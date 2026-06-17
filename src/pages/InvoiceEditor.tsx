import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Package,
  Calculator,
  Boxes,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PageHeader, Card, Button, Input, Select, Textarea, Toggle } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import JalaliDatePicker from '@/components/JalaliDatePicker'
import { calcInvoice, calcItem, emptyItem } from '@/utils/invoice'
import { formatMoney, percent, rialToUsdt, formatNumber } from '@/utils/format'
import { TEMPLATES } from '@/components/invoice/InvoiceDocument'
import type { Invoice, InvoiceItem, InvoiceType } from '@/types'

export default function InvoiceEditor() {
  const { id } = useParams()
  const nav = useNavigate()
  const store = useStore()
  const { products, parties, warehouses, settings, usdtRate, addInvoice, updateInvoice, addStockMove, toast } = store

  const existing = id ? store.invoices.find((i) => i.id === id) : undefined

  const [inv, setInv] = useState<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>(() => {
    if (existing) {
      const { id: _i, createdAt, updatedAt, ...rest } = existing
      return { ...rest, items: rest.items.map((it) => ({ ...it })) }
    }
    return {
      number: store.nextInvoiceNumber('sale'),
      type: 'sale',
      status: 'issued',
      date: new Date().toISOString(),
      items: [emptyItem(settings.defaultTaxRate)],
      globalDiscountPercent: 0,
      globalDiscountAmount: 0,
      shippingCost: 0,
      roundAmount: 0,
      currency: settings.defaultCurrency,
      template: settings.defaultTemplate,
      isOfficial: false,
      paidAmount: 0,
      payments: [],
      warehouseId: warehouses[0]?.id,
      usdtRate: usdtRate?.sell,
    }
  })
  const [updateStock, setUpdateStock] = useState(!existing)

  const set = (p: Partial<typeof inv>) => setInv((f) => ({ ...f, ...p }))
  const setItem = (itemId: string, p: Partial<InvoiceItem>) =>
    setInv((f) => ({ ...f, items: f.items.map((it) => (it.id === itemId ? { ...it, ...p } : it)) }))
  const addItem = () => setInv((f) => ({ ...f, items: [...f.items, emptyItem(settings.defaultTaxRate)] }))
  const removeItem = (itemId: string) =>
    setInv((f) => ({ ...f, items: f.items.filter((it) => it.id !== itemId) }))

  const pickProduct = (itemId: string, productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) {
      setItem(itemId, { productId: undefined })
      return
    }
    const price = inv.type === 'purchase' ? p.purchasePrice : p.salePrice
    setItem(itemId, {
      productId: p.id,
      description: p.name,
      unit: p.unit,
      unitPrice: price,
      taxRate: p.taxRate,
    })
  }

  const calc = useMemo(() => calcInvoice({ ...inv, id: '', createdAt: '', updatedAt: '' } as Invoice), [inv])

  const changeType = (type: InvoiceType) => {
    set({ type, number: store.nextInvoiceNumber(type) })
  }

  const save = () => {
    if (inv.items.length === 0 || inv.items.every((i) => !i.description))
      return toast('حداقل یک ردیف کالا وارد کنید', 'error')
    const cleanItems = inv.items.filter((i) => i.description.trim())
    const payload = { ...inv, items: cleanItems }

    let saved: Invoice
    if (existing) {
      updateInvoice(existing.id, payload)
      saved = { ...existing, ...payload }
      toast('فاکتور بروزرسانی شد')
    } else {
      saved = addInvoice(payload)
      toast('فاکتور صادر شد')
    }

    // بروزرسانی موجودی انبار
    if (updateStock && !existing && (inv.type === 'sale' || inv.type === 'purchase')) {
      for (const item of cleanItems) {
        if (!item.productId) continue
        const prod = products.find((p) => p.id === item.productId)
        if (!prod || prod.type !== 'product') continue
        addStockMove({
          date: inv.date,
          type: inv.type === 'sale' ? 'out' : 'in',
          productId: item.productId,
          warehouseId: inv.warehouseId ?? warehouses[0]?.id ?? '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          partyId: inv.partyId,
          refType: 'invoice',
          refId: saved.id,
        })
      }
      toast('موجودی انبار بروزرسانی شد', 'info')
    }
    nav(`/invoices/${saved.id}`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={existing ? `ویرایش فاکتور ${existing.number}` : 'صدور فاکتور جدید'}
        subtitle="اطلاعات فاکتور، اقلام و مبالغ را وارد کنید"
        icon={<FileText size={24} />}
        actions={
          <>
            <Button variant="ghost" onClick={() => nav(-1)}>انصراف</Button>
            <Button onClick={save}>
              <Save size={18} /> ذخیره فاکتور
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* اطلاعات کلی */}
          <Card>
            <h3 className="mb-4 font-bold">اطلاعات فاکتور</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="نوع فاکتور" value={inv.type} onChange={(e) => changeType(e.target.value as InvoiceType)}>
                <option value="sale">فروش</option>
                <option value="purchase">خرید</option>
                <option value="proforma">پیش‌فاکتور</option>
                <option value="return">برگشت از فروش</option>
              </Select>
              <Input label="شماره فاکتور" value={inv.number} onChange={(e) => set({ number: e.target.value })} dir="ltr" />
              <JalaliDatePicker label="تاریخ" value={inv.date} onChange={(iso) => set({ date: iso })} />
              <Select label="طرف حساب" value={inv.partyId ?? ''} onChange={(e) => set({ partyId: e.target.value || undefined })}>
                <option value="">مهمان</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
              <JalaliDatePicker label="سررسید" value={inv.dueDate ?? ''} onChange={(iso) => set({ dueDate: iso })} />
              <Select label="انبار" value={inv.warehouseId ?? ''} onChange={(e) => set({ warehouseId: e.target.value })}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Select>
            </div>
          </Card>

          {/* ردیف‌های کالا */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">اقلام فاکتور</h3>
              <Button variant="ghost" onClick={addItem} className="!py-1.5 !text-xs">
                <Plus size={15} /> افزودن ردیف
              </Button>
            </div>
            <div className="space-y-3">
              {inv.items.map((item, idx) => {
                const ic = calcItem(item)
                return (
                  <div key={item.id} className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.03]">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12 sm:col-span-5">
                        <label className="mb-1 block text-xs text-muted">انتخاب کالا</label>
                        <select
                          className="glass-input mb-2"
                          value={item.productId ?? ''}
                          onChange={(e) => pickProduct(item.id, e.target.value)}
                        >
                          <option value="">— شرح دستی —</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input
                          className="glass-input"
                          placeholder="شرح کالا/خدمت"
                          value={item.description}
                          onChange={(e) => setItem(item.id, { description: e.target.value })}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <label className="mb-1 block text-xs text-muted">تعداد</label>
                        <NumberInput value={item.quantity} onChange={(v) => setItem(item.id, { quantity: v })} suffix={item.unit} />
                      </div>
                      <div className="col-span-8 sm:col-span-3">
                        <label className="mb-1 block text-xs text-muted">فی واحد</label>
                        <NumberInput value={item.unitPrice} onChange={(v) => setItem(item.id, { unitPrice: v })} />
                      </div>
                      <div className="col-span-6 sm:col-span-1">
                        <label className="mb-1 block text-xs text-muted">تخفیف٪</label>
                        <NumberInput value={item.discountPercent} onChange={(v) => setItem(item.id, { discountPercent: v })} />
                      </div>
                      <div className="col-span-6 sm:col-span-1">
                        <label className="mb-1 block text-xs text-muted">مالیات٪</label>
                        <NumberInput value={item.taxRate} onChange={(v) => setItem(item.id, { taxRate: v })} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-sm">
                      <span className="text-muted">
                        جمع ردیف: <b className="text-current">{formatMoney(ic.total, inv.currency, false)}</b>
                      </span>
                      <button onClick={() => removeItem(item.id)} className="flex items-center gap-1 text-rose-500 hover:opacity-70">
                        <Trash2 size={15} /> حذف
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* توضیحات */}
          <Card>
            <div className="grid gap-4">
              <Textarea label="توضیحات" value={inv.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
              <Textarea label="شرایط و قوانین" value={inv.terms ?? ''} onChange={(e) => set({ terms: e.target.value })} />
            </div>
          </Card>
        </div>

        {/* ستون کناری: محاسبات و تنظیمات */}
        <div className="space-y-5">
          <Card>
            <h3 className="mb-4 flex items-center gap-2 font-bold">
              <Calculator size={18} /> محاسبات
            </h3>
            <div className="space-y-3">
              <Select label="واحد پول" value={inv.currency} onChange={(e) => set({ currency: e.target.value as any })}>
                <option value="IRR">ریال</option>
                <option value="IRT">تومان</option>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="تخفیف کلی٪" value={inv.globalDiscountPercent} onChange={(v) => set({ globalDiscountPercent: v })} />
                <NumberInput label="تخفیف مبلغی" value={inv.globalDiscountAmount} onChange={(v) => set({ globalDiscountAmount: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="هزینه حمل" value={inv.shippingCost} onChange={(v) => set({ shippingCost: v })} />
                <NumberInput label="گرد کردن" value={inv.roundAmount} onChange={(v) => set({ roundAmount: v })} />
              </div>
              <NumberInput label="مبلغ پرداخت شده" value={inv.paidAmount} onChange={(v) => set({ paidAmount: v })} />

              <div className="space-y-1.5 rounded-2xl bg-brand-500/5 p-3 text-sm">
                <Line label="جمع کل" value={formatMoney(calc.subtotal, inv.currency, false)} />
                {calc.totalDiscount > 0 && <Line label="تخفیف" value={`(${formatMoney(calc.totalDiscount, inv.currency, false)})`} />}
                {calc.tax > 0 && <Line label="مالیات" value={formatMoney(calc.tax, inv.currency, false)} />}
                <div className="flex items-center justify-between border-t border-brand-500/20 pt-2 text-base font-extrabold text-brand-600 dark:text-brand-400">
                  <span>قابل پرداخت</span>
                  <span>{formatMoney(calc.payable, inv.currency, false)}</span>
                </div>
                {usdtRate && (
                  <div className="text-left text-xs text-muted" dir="ltr">
                    ≈ {formatNumber(rialToUsdt(calc.payable, usdtRate.sell))} USDT
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-4 font-bold">تنظیمات فاکتور</h3>
            <div className="space-y-3">
              <Select label="قالب فاکتور" value={inv.template} onChange={(e) => set({ template: e.target.value })}>
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
              <Select label="وضعیت" value={inv.status} onChange={(e) => set({ status: e.target.value as any })}>
                <option value="draft">پیش‌نویس</option>
                <option value="issued">صادر شده</option>
                <option value="paid">پرداخت شده</option>
                <option value="partial">پرداخت جزئی</option>
                <option value="overdue">سررسید گذشته</option>
                <option value="canceled">باطل</option>
              </Select>
              <Toggle checked={inv.isOfficial} onChange={(v) => set({ isOfficial: v })} label="فاکتور رسمی (مالیاتی)" />
              {inv.isOfficial && (
                <Input label="شماره مالیاتی (مودیان)" value={inv.taxId ?? ''} onChange={(e) => set({ taxId: e.target.value })} dir="ltr" />
              )}
              {!existing && (inv.type === 'sale' || inv.type === 'purchase') && (
                <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 p-3">
                  <Boxes size={18} className="text-amber-500" />
                  <Toggle checked={updateStock} onChange={setUpdateStock} label="بروزرسانی موجودی انبار" />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
