import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Printer,
  FileDown,
  FileText as FileWord,
  Pencil,
  Plus,
  CreditCard,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { PageHeader, Card, Button, Select, Modal, Input } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import JalaliDatePicker from '@/components/JalaliDatePicker'
import InvoiceDocument, { TEMPLATES } from '@/components/invoice/InvoiceDocument'
import { exportElementToPDF, exportHTMLToWord, printElement } from '@/utils/export'
import { calcInvoice, calcItem } from '@/utils/invoice'
import { formatMoney, moneyToWords, toFaDigits } from '@/utils/format'
import { toJalali } from '@/utils/date'
import { uid } from '@/utils/helpers'
import type { Payment } from '@/types'

export default function InvoiceView() {
  const { id } = useParams()
  const nav = useNavigate()
  const store = useStore()
  const inv = store.invoices.find((i) => i.id === id)
  const printRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payment, setPayment] = useState<Payment>({
    id: uid('pay_'),
    date: new Date().toISOString(),
    amount: 0,
    method: 'cash',
  })

  if (!inv) {
    return (
      <Card>
        <p className="py-10 text-center text-muted">فاکتور یافت نشد</p>
        <div className="text-center">
          <Button onClick={() => nav('/invoices')}>بازگشت به فهرست</Button>
        </div>
      </Card>
    )
  }

  const company = store.company
  const party = store.parties.find((p) => p.id === inv.partyId)
  const calc = calcInvoice(inv)

  const exportPDF = async () => {
    if (!printRef.current) return
    setExporting(true)
    try {
      await exportElementToPDF(printRef.current, `${inv.number}.pdf`)
      store.toast('فایل PDF آماده شد')
    } catch {
      store.toast('خطا در ساخت PDF', 'error')
    } finally {
      setExporting(false)
    }
  }

  const exportWord = () => {
    const rows = inv.items
      .map((item, i) => {
        const ic = calcItem(item)
        return `<tr><td class="text-center">${toFaDigits(i + 1)}</td><td>${item.description}</td><td class="text-center">${toFaDigits(
          item.quantity,
        )} ${item.unit}</td><td class="text-left">${formatMoney(item.unitPrice, inv.currency, false)}</td><td class="text-left">${formatMoney(
          ic.total,
          inv.currency,
          false,
        )}</td></tr>`
      })
      .join('')
    const html = `
      <div class="header">
        <div><h1>${company.name}</h1><div class="muted">${company.address}</div><div class="muted" dir="ltr">${company.phone} • ${company.website}</div></div>
        <div class="text-left"><h2>${inv.type === 'purchase' ? 'فاکتور خرید' : inv.type === 'proforma' ? 'پیش‌فاکتور' : 'فاکتور فروش'}</h2>
        <div>شماره: ${inv.number}</div><div>تاریخ: ${toJalali(inv.date)}</div></div>
      </div>
      <hr/>
      <p><b>طرف حساب:</b> ${party?.name ?? 'مهمان'} ${party?.mobile ? ' - ' + party.mobile : ''}</p>
      <table><thead><tr><th>ردیف</th><th>شرح</th><th>تعداد</th><th>فی</th><th>مبلغ کل</th></tr></thead><tbody>${rows}</tbody></table>
      <table class="totals"><tbody>
        <tr><td class="text-left">جمع کل:</td><td class="text-left">${formatMoney(calc.subtotal, inv.currency)}</td></tr>
        ${calc.totalDiscount > 0 ? `<tr><td class="text-left">تخفیف:</td><td class="text-left">${formatMoney(calc.totalDiscount, inv.currency)}</td></tr>` : ''}
        ${calc.tax > 0 ? `<tr><td class="text-left">مالیات:</td><td class="text-left">${formatMoney(calc.tax, inv.currency)}</td></tr>` : ''}
        <tr><td class="text-left"><b>قابل پرداخت:</b></td><td class="text-left"><b>${formatMoney(calc.payable, inv.currency)}</b></td></tr>
      </tbody></table>
      <p class="muted">مبلغ به حروف: ${moneyToWords(calc.payable, inv.currency)}</p>
      ${inv.note ? `<p class="muted">توضیحات: ${inv.note}</p>` : ''}
    `
    exportHTMLToWord(html, `${inv.number}.doc`)
    store.toast('فایل Word آماده شد')
  }

  const addPayment = () => {
    if (payment.amount <= 0) return store.toast('مبلغ پرداخت را وارد کنید', 'error')
    const payments = [...inv.payments, payment]
    const paid = payments.reduce((s, p) => s + p.amount, 0)
    const status = paid >= calc.payable ? 'paid' : paid > 0 ? 'partial' : inv.status
    store.updateInvoice(inv.id, { payments, paidAmount: paid, status })
    store.toast('پرداخت ثبت شد')
    setPayOpen(false)
    setPayment({ id: uid('pay_'), date: new Date().toISOString(), amount: 0, method: 'cash' })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`فاکتور ${inv.number}`}
        subtitle={`${party?.name ?? 'مهمان'} • ${toJalali(inv.date)}`}
        icon={<FileWord size={24} />}
        actions={
          <Button variant="ghost" onClick={() => nav('/invoices')}>
            <ArrowRight size={18} /> بازگشت
          </Button>
        }
      />

      <Card className="no-print !p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={inv.template}
            onChange={(e) => store.updateInvoice(inv.id, { template: e.target.value })}
            className="w-48"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
          <Button onClick={() => printElement()} variant="ghost">
            <Printer size={18} /> چاپ
          </Button>
          <Button onClick={exportPDF} disabled={exporting}>
            <FileDown size={18} /> {exporting ? 'در حال ساخت…' : 'خروجی PDF'}
          </Button>
          <Button onClick={exportWord} variant="ghost">
            <FileWord size={18} /> خروجی Word
          </Button>
          <Button onClick={() => setPayOpen(true)} variant="success">
            <CreditCard size={18} /> ثبت پرداخت
          </Button>
          <Button onClick={() => nav(`/invoices/${inv.id}/edit`)} variant="ghost">
            <Pencil size={18} /> ویرایش
          </Button>
        </div>
        {calc.remaining > 0 && (
          <div className="mt-3 rounded-2xl bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
            مانده قابل پرداخت: <b>{formatMoney(calc.remaining, inv.currency)}</b>
          </div>
        )}
      </Card>

      {/* سند قابل چاپ */}
      <div className="overflow-hidden rounded-3xl shadow-glass-lg">
        <div id="print-area" ref={printRef}>
          <InvoiceDocument invoice={inv} company={company} party={party} usdtRate={store.usdtRate} />
        </div>
      </div>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="ثبت پرداخت"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>انصراف</Button>
            <Button onClick={addPayment}>ثبت</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput label="مبلغ" value={payment.amount} onChange={(v) => setPayment((p) => ({ ...p, amount: v }))} suffix="ریال" />
          <JalaliDatePicker label="تاریخ" value={payment.date} onChange={(iso) => setPayment((p) => ({ ...p, date: iso }))} />
          <Select label="روش" value={payment.method} onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value as any }))}>
            <option value="cash">نقدی</option>
            <option value="card">کارت</option>
            <option value="transfer">انتقال بانکی</option>
            <option value="cheque">چک</option>
            <option value="usdt">تتر</option>
            <option value="other">سایر</option>
          </Select>
          <Input label="شماره مرجع" value={payment.reference ?? ''} onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))} dir="ltr" />
        </div>
        <div className="mt-4 rounded-2xl bg-brand-500/5 p-3 text-sm">
          مبلغ کل: <b>{formatMoney(calc.payable, inv.currency)}</b> • پرداخت شده:{' '}
          <b>{formatMoney(calc.paid, inv.currency)}</b> • مانده: <b>{formatMoney(calc.remaining, inv.currency)}</b>
        </div>
      </Modal>
    </div>
  )
}
