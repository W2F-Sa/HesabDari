import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Download,
  Filter,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useConfirm } from '@/components/Confirm'
import { PageHeader, Card, Button, Select, Badge, Table, Th, Td, EmptyState, StatCard } from '@/components/ui'
import { calcInvoice } from '@/utils/invoice'
import { formatMoney, toFaDigits } from '@/utils/format'
import { toJalali } from '@/utils/date'
import { exportCSV } from '@/utils/helpers'
import type { Invoice, InvoiceStatus, InvoiceType } from '@/types'

const typeLabels: Record<InvoiceType, { label: string; color: any }> = {
  sale: { label: 'فروش', color: 'green' },
  purchase: { label: 'خرید', color: 'amber' },
  proforma: { label: 'پیش‌فاکتور', color: 'blue' },
  return: { label: 'برگشت', color: 'red' },
}

const statusLabels: Record<InvoiceStatus, { label: string; color: any }> = {
  draft: { label: 'پیش‌نویس', color: 'gray' },
  issued: { label: 'صادر شده', color: 'blue' },
  paid: { label: 'پرداخت شده', color: 'green' },
  partial: { label: 'پرداخت جزئی', color: 'amber' },
  overdue: { label: 'سررسید گذشته', color: 'red' },
  canceled: { label: 'باطل', color: 'gray' },
}

export default function Invoices() {
  const store = useStore()
  const { invoices, parties, addInvoice, removeInvoice, toast } = store
  const ask = useConfirm((s) => s.ask)
  const nav = useNavigate()
  const unit = store.settings.defaultCurrency
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | InvoiceType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all')

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (typeFilter !== 'all' && inv.type !== typeFilter) return false
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (search) {
        const party = parties.find((p) => p.id === inv.partyId)
        if (!`${inv.number} ${party?.name ?? ''} ${inv.note ?? ''}`.includes(search)) return false
      }
      return true
    })
  }, [invoices, typeFilter, statusFilter, search, parties])

  const salesTotal = invoices
    .filter((i) => i.type === 'sale' && i.status !== 'canceled')
    .reduce((s, i) => s + calcInvoice(i).payable, 0)
  const unpaidTotal = invoices
    .filter((i) => i.type === 'sale' && i.status !== 'canceled')
    .reduce((s, i) => s + calcInvoice(i).remaining, 0)

  const duplicate = (inv: Invoice) => {
    const { id, createdAt, updatedAt, ...rest } = inv
    const num = store.nextInvoiceNumber(inv.type)
    addInvoice({ ...rest, number: num, status: 'draft', paidAmount: 0, payments: [] })
    toast('فاکتور کپی شد')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="فاکتورها"
        subtitle="مدیریت فاکتورهای فروش، خرید و پیش‌فاکتور"
        icon={<FileText size={24} />}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                exportCSV(
                  invoices.map((i) => ({
                    شماره: i.number,
                    نوع: typeLabels[i.type].label,
                    طرف_حساب: parties.find((p) => p.id === i.partyId)?.name ?? '',
                    تاریخ: toJalali(i.date),
                    مبلغ: calcInvoice(i).payable,
                    وضعیت: statusLabels[i.status].label,
                  })),
                  'invoices.csv',
                )
              }
            >
              <Download size={18} /> خروجی
            </Button>
            <Link to="/invoices/new" className="btn-primary">
              <Plus size={18} /> فاکتور جدید
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="تعداد فاکتورها" value={toFaDigits(invoices.length)} icon={<FileText size={22} />} gradient="from-brand-400 to-brand-700" />
        <StatCard title="مجموع فروش" value={formatMoney(salesTotal, unit, false)} icon={<FileText size={22} />} gradient="from-emerald-400 to-emerald-600" />
        <StatCard title="مانده دریافتنی" value={formatMoney(unpaidTotal, unit, false)} icon={<FileText size={22} />} gradient="from-amber-400 to-orange-600" />
      </div>

      <Card className="!p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="glass-input pr-10" placeholder="جستجوی شماره فاکتور یا طرف حساب…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="lg:w-44">
            <option value="all">همه انواع</option>
            {Object.entries(typeLabels).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="lg:w-44">
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="!p-0">
        {filtered.length ? (
          <Table>
            <thead>
              <tr className="border-b border-white/10">
                <Th>شماره</Th>
                <Th>نوع</Th>
                <Th>طرف حساب</Th>
                <Th>تاریخ</Th>
                <Th>مبلغ</Th>
                <Th>مانده</Th>
                <Th>وضعیت</Th>
                <Th className="text-left">عملیات</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const c = calcInvoice(inv)
                const party = parties.find((p) => p.id === inv.partyId)
                return (
                  <tr key={inv.id} className="table-row border-b border-white/5">
                    <Td>
                      <Link to={`/invoices/${inv.id}`} className="font-mono font-semibold text-brand-500 hover:underline">
                        {inv.number}
                      </Link>
                      {inv.isOfficial && <Badge color="violet" className="mr-2">رسمی</Badge>}
                    </Td>
                    <Td>
                      <Badge color={typeLabels[inv.type].color}>{typeLabels[inv.type].label}</Badge>
                    </Td>
                    <Td>{party?.name ?? 'مهمان'}</Td>
                    <Td className="text-sm">{toJalali(inv.date)}</Td>
                    <Td className="font-semibold">{formatMoney(c.payable, unit, false)}</Td>
                    <Td>
                      {c.remaining > 0 ? (
                        <span className="font-semibold text-rose-500">{formatMoney(c.remaining, unit, false)}</span>
                      ) : (
                        <span className="text-emerald-500">تسویه</span>
                      )}
                    </Td>
                    <Td>
                      <Badge color={statusLabels[inv.status].color}>{statusLabels[inv.status].label}</Badge>
                    </Td>
                    <Td className="text-left">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => nav(`/invoices/${inv.id}`)} title="مشاهده" className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => nav(`/invoices/${inv.id}/edit`)} title="ویرایش" className="grid h-8 w-8 place-items-center rounded-lg text-amber-500 hover:bg-amber-500/10">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => duplicate(inv)} title="کپی" className="grid h-8 w-8 place-items-center rounded-lg text-violet-500 hover:bg-violet-500/10">
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (await ask({ message: `فاکتور «${inv.number}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                              removeInvoice(inv.id)
                          }}
                          title="حذف"
                          className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            icon={<FileText size={28} />}
            title="فاکتوری یافت نشد"
            description="اولین فاکتور خود را صادر کنید."
            action={
              <Link to="/invoices/new" className="btn-primary">
                <Plus size={18} /> فاکتور جدید
              </Link>
            }
          />
        )}
      </Card>
    </div>
  )
}
