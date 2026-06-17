import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  Plus,
  Search,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Repeat,
  Settings2,
  Undo2,
  PackageX,
  Download,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getProductStock } from '@/store/selectors'
import { useConfirm } from '@/components/Confirm'
import {
  PageHeader,
  Card,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Badge,
  Table,
  Th,
  Td,
  EmptyState,
} from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import JalaliDatePicker from '@/components/JalaliDatePicker'
import { toJalali } from '@/utils/date'
import { formatMoney, toFaDigits } from '@/utils/format'
import { exportCSV } from '@/utils/helpers'
import type { StockMove, StockMoveType } from '@/types'

const moveConfig: Record<StockMoveType, { label: string; color: any; icon: any; sign: number }> = {
  in: { label: 'ورود', color: 'green', icon: ArrowDownToLine, sign: 1 },
  out: { label: 'خروج', color: 'red', icon: ArrowUpFromLine, sign: -1 },
  transfer: { label: 'انتقال', color: 'blue', icon: Repeat, sign: 0 },
  adjust: { label: 'اصلاح موجودی', color: 'amber', icon: Settings2, sign: 0 },
  'return-in': { label: 'برگشت از فروش', color: 'green', icon: Undo2, sign: 1 },
  'return-out': { label: 'برگشت خرید', color: 'red', icon: Undo2, sign: -1 },
  waste: { label: 'ضایعات', color: 'red', icon: PackageX, sign: -1 },
}

const empty = (warehouseId: string): Omit<StockMove, 'id' | 'createdAt'> => ({
  date: new Date().toISOString(),
  type: 'in',
  productId: '',
  warehouseId,
  quantity: 1,
  unitPrice: 0,
})

export default function Stock() {
  const store = useStore()
  const { stockMoves, products, warehouses, parties, addStockMove, removeStockMove, toast } = store
  const ask = useConfirm((s) => s.ask)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | StockMoveType>('all')
  const [form, setForm] = useState(empty(warehouses[0]?.id ?? ''))

  const set = (p: Partial<StockMove>) => setForm((f) => ({ ...f, ...p }))

  const filtered = useMemo(() => {
    return stockMoves.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) return false
      if (search) {
        const prod = products.find((p) => p.id === m.productId)
        if (!`${prod?.name ?? ''} ${prod?.sku ?? ''} ${m.note ?? ''}`.includes(search)) return false
      }
      return true
    })
  }, [stockMoves, typeFilter, search, products])

  const openNew = () => {
    setForm(empty(warehouses[0]?.id ?? ''))
    setOpen(true)
  }

  const save = () => {
    if (!form.productId) return toast('کالا را انتخاب کنید', 'error')
    if (!form.warehouseId) return toast('انبار را انتخاب کنید', 'error')
    if (form.type === 'transfer' && !form.toWarehouseId) return toast('انبار مقصد را انتخاب کنید', 'error')
    if (form.quantity === 0) return toast('مقدار نمی‌تواند صفر باشد', 'error')
    addStockMove(form)
    toast('حرکت انبار ثبت شد')
    setOpen(false)
  }

  const selectedProduct = products.find((p) => p.id === form.productId)
  const currentStock = form.productId
    ? getProductStock(form.productId, stockMoves, products, form.warehouseId)
    : 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="حرکات انبار"
        subtitle="ثبت ورود، خروج، انتقال، اصلاح موجودی و ضایعات"
        icon={<ArrowLeftRight size={24} />}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                exportCSV(
                  stockMoves.map((m) => ({
                    تاریخ: toJalali(m.date),
                    نوع: moveConfig[m.type].label,
                    کالا: products.find((p) => p.id === m.productId)?.name ?? '',
                    مقدار: m.quantity,
                    فی: m.unitPrice,
                  })),
                  'stock-moves.csv',
                )
              }
            >
              <Download size={18} /> خروجی
            </Button>
            <Button onClick={openNew}>
              <Plus size={18} /> حرکت جدید
            </Button>
          </>
        }
      />

      <Card className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="glass-input pr-10"
              placeholder="جستجوی کالا…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="sm:w-52">
            <option value="all">همه حرکت‌ها</option>
            {Object.entries(moveConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="!p-0">
        {filtered.length ? (
          <Table>
            <thead>
              <tr className="border-b border-white/10">
                <Th>تاریخ</Th>
                <Th>نوع</Th>
                <Th>کالا</Th>
                <Th>انبار</Th>
                <Th>مقدار</Th>
                <Th>فی</Th>
                <Th>ارزش</Th>
                <Th className="text-left"></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const cfg = moveConfig[m.type]
                const prod = products.find((p) => p.id === m.productId)
                const wh = warehouses.find((w) => w.id === m.warehouseId)
                const Icon = cfg.icon
                return (
                  <tr key={m.id} className="table-row border-b border-white/5">
                    <Td className="text-sm">{toJalali(m.date)}</Td>
                    <Td>
                      <Badge color={cfg.color}>
                        <Icon size={13} /> {cfg.label}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="font-semibold">{prod?.name ?? '—'}</div>
                      <div className="text-xs text-muted">{prod?.sku}</div>
                    </Td>
                    <Td className="text-sm">
                      {wh?.name}
                      {m.type === 'transfer' && m.toWarehouseId && (
                        <span className="text-muted">
                          {' '}← {warehouses.find((w) => w.id === m.toWarehouseId)?.name}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className={cfg.sign > 0 ? 'font-bold text-emerald-500' : cfg.sign < 0 ? 'font-bold text-rose-500' : 'font-bold'}>
                        {cfg.sign > 0 ? '+' : cfg.sign < 0 ? '−' : ''}
                        {toFaDigits(Math.abs(m.quantity))}
                      </span>
                    </Td>
                    <Td className="text-sm">{m.unitPrice ? formatMoney(m.unitPrice, 'IRR', false) : '—'}</Td>
                    <Td className="text-sm font-semibold">
                      {m.unitPrice ? formatMoney(m.unitPrice * Math.abs(m.quantity), 'IRR', false) : '—'}
                    </Td>
                    <Td className="text-left">
                      <button
                        onClick={async () => {
                          if (await ask({ message: 'این حرکت انبار حذف شود؟', danger: true, confirmText: 'حذف' }))
                            removeStockMove(m.id)
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<ArrowLeftRight size={28} />}
            title="حرکتی ثبت نشده است"
            description="ورود و خروج کالا را از اینجا ثبت کنید."
            action={
              <Button onClick={openNew}>
                <Plus size={18} /> ثبت حرکت
              </Button>
            }
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="ثبت حرکت انبار"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button onClick={save}>ثبت</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="نوع حرکت" value={form.type} onChange={(e) => set({ type: e.target.value as StockMoveType })}>
            {Object.entries(moveConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <JalaliDatePicker label="تاریخ" value={form.date} onChange={(iso) => set({ date: iso })} />
          <Select label="کالا" value={form.productId} onChange={(e) => set({ productId: e.target.value })}>
            <option value="">انتخاب کالا…</option>
            {products
              .filter((p) => p.type === 'product')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
          </Select>
          <Select label={form.type === 'transfer' ? 'انبار مبدأ' : 'انبار'} value={form.warehouseId} onChange={(e) => set({ warehouseId: e.target.value })}>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          {form.type === 'transfer' && (
            <Select label="انبار مقصد" value={form.toWarehouseId ?? ''} onChange={(e) => set({ toWarehouseId: e.target.value })}>
              <option value="">انتخاب…</option>
              {warehouses
                .filter((w) => w.id !== form.warehouseId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </Select>
          )}
          <NumberInput
            label={form.type === 'adjust' ? 'مقدار اصلاح (می‌تواند منفی باشد)' : 'مقدار'}
            value={form.quantity}
            onChange={(v) => set({ quantity: v })}
            suffix={selectedProduct?.unit}
          />
          <NumberInput label="قیمت واحد" value={form.unitPrice} onChange={(v) => set({ unitPrice: v })} suffix="ریال" />
          {['in', 'out', 'return-in', 'return-out'].includes(form.type) && (
            <Select label="طرف حساب" value={form.partyId ?? ''} onChange={(e) => set({ partyId: e.target.value })}>
              <option value="">—</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          {form.productId && (
            <div className="sm:col-span-2 rounded-2xl bg-brand-500/5 p-3 text-sm">
              موجودی فعلی این کالا در انبار انتخابی:{' '}
              <b>
                {toFaDigits(currentStock)} {selectedProduct?.unit}
              </b>
            </div>
          )}
          <div className="sm:col-span-2">
            <Textarea label="توضیحات" value={form.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
