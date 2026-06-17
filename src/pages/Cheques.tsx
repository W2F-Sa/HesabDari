import { useMemo, useState } from 'react'
import { ReceiptText, Plus, Pencil, Trash2, Search, Calendar, AlertCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useConfirm } from '@/components/Confirm'
import { PageHeader, Card, Button, Modal, Input, Select, Textarea, Table, Th, Td, Badge, EmptyState, StatCard } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import JalaliDatePicker from '@/components/JalaliDatePicker'
import { toJalali, daysBetween } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import type { Cheque, ChequeKind, ChequeStatus } from '@/types'

const statusConfig: Record<ChequeStatus, { label: string; color: any }> = {
  'in-hand': { label: 'در جریان', color: 'blue' },
  deposited: { label: 'واگذار شده', color: 'amber' },
  cleared: { label: 'وصول شده', color: 'green' },
  bounced: { label: 'برگشتی', color: 'red' },
  spent: { label: 'خرج شده', color: 'violet' },
}

const empty = (): Omit<Cheque, 'id' | 'createdAt'> => ({
  kind: 'received',
  number: '',
  bankName: '',
  amount: 0,
  dueDate: new Date().toISOString(),
  status: 'in-hand',
})

export default function Cheques() {
  const store = useStore()
  const { cheques, parties, addCheque, updateCheque, removeCheque, toast } = store
  const ask = useConfirm((s) => s.ask)
  const unit = store.settings.defaultCurrency
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | ChequeKind>('all')
  const [form, setForm] = useState(empty())

  const set = (p: Partial<Cheque>) => setForm((f) => ({ ...f, ...p }))

  const filtered = useMemo(
    () =>
      cheques.filter((c) => {
        if (kindFilter !== 'all' && c.kind !== kindFilter) return false
        if (search && !`${c.number} ${c.bankName}`.includes(search)) return false
        return true
      }),
    [cheques, kindFilter, search],
  )

  const received = cheques.filter((c) => c.kind === 'received' && ['in-hand', 'deposited'].includes(c.status))
  const issued = cheques.filter((c) => c.kind === 'issued' && c.status !== 'cleared')
  const totalReceived = received.reduce((s, c) => s + c.amount, 0)
  const totalIssued = issued.reduce((s, c) => s + c.amount, 0)

  const openNew = () => {
    setForm(empty())
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (c: Cheque) => {
    setForm({ ...c })
    setEditId(c.id)
    setOpen(true)
  }
  const save = () => {
    if (!form.number.trim()) return toast('شماره چک الزامی است', 'error')
    if (form.amount <= 0) return toast('مبلغ چک الزامی است', 'error')
    if (editId) {
      updateCheque(editId, form)
      toast('چک ویرایش شد')
    } else {
      addCheque(form)
      toast('چک ثبت شد')
    }
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="مدیریت چک‌ها"
        subtitle="پیگیری چک‌های دریافتی و پرداختی"
        icon={<ReceiptText size={24} />}
        actions={
          <Button onClick={openNew}>
            <Plus size={18} /> چک جدید
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="چک‌های دریافتی در جریان" value={formatMoney(totalReceived, unit, false)} icon={<ReceiptText size={22} />} gradient="from-emerald-400 to-emerald-600" />
        <StatCard title="چک‌های پرداختی در جریان" value={formatMoney(totalIssued, unit, false)} icon={<ReceiptText size={22} />} gradient="from-rose-400 to-rose-600" />
      </div>

      <Card className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="glass-input pr-10" placeholder="جستجوی شماره چک یا بانک…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)} className="sm:w-48">
            <option value="all">همه چک‌ها</option>
            <option value="received">دریافتی</option>
            <option value="issued">پرداختی</option>
          </Select>
        </div>
      </Card>

      <Card className="!p-0">
        {filtered.length ? (
          <Table>
            <thead>
              <tr className="border-b border-white/10">
                <Th>شماره چک</Th>
                <Th>نوع</Th>
                <Th>بانک</Th>
                <Th>طرف حساب</Th>
                <Th>مبلغ</Th>
                <Th>سررسید</Th>
                <Th>وضعیت</Th>
                <Th className="text-left"></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const party = parties.find((p) => p.id === c.partyId)
                const days = daysBetween(new Date().toISOString(), c.dueDate)
                const near = days >= 0 && days <= 7 && ['in-hand', 'deposited'].includes(c.status)
                return (
                  <tr key={c.id} className="table-row border-b border-white/5">
                    <Td className="font-mono text-sm">{c.number}</Td>
                    <Td>
                      <Badge color={c.kind === 'received' ? 'green' : 'red'}>{c.kind === 'received' ? 'دریافتی' : 'پرداختی'}</Badge>
                    </Td>
                    <Td className="text-sm">{c.bankName}</Td>
                    <Td className="text-sm">{party?.name ?? '—'}</Td>
                    <Td className="font-semibold">{formatMoney(c.amount, unit, false)}</Td>
                    <Td>
                      <span className={near ? 'flex items-center gap-1 text-amber-500' : 'flex items-center gap-1 text-sm'}>
                        {near && <AlertCircle size={14} />}
                        <Calendar size={13} /> {toJalali(c.dueDate)}
                      </span>
                    </Td>
                    <Td>
                      <select
                        className="rounded-lg bg-transparent text-xs font-semibold outline-none"
                        value={c.status}
                        onChange={(e) => updateCheque(c.id, { status: e.target.value as ChequeStatus })}
                      >
                        {Object.entries(statusConfig).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </Td>
                    <Td className="text-left">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10">
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (await ask({ message: `چک شماره «${c.number}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                              removeCheque(c.id)
                          }}
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
          <EmptyState icon={<ReceiptText size={28} />} title="چکی ثبت نشده است" action={<Button onClick={openNew}><Plus size={18} /> ثبت چک</Button>} />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش چک' : 'چک جدید'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={save}>ذخیره</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="نوع چک" value={form.kind} onChange={(e) => set({ kind: e.target.value as ChequeKind })}>
            <option value="received">دریافتی</option>
            <option value="issued">پرداختی</option>
          </Select>
          <Input label="شماره چک *" value={form.number} onChange={(e) => set({ number: e.target.value })} dir="ltr" />
          <Input label="نام بانک" value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} />
          <NumberInput label="مبلغ *" value={form.amount} onChange={(v) => set({ amount: v })} suffix="ریال" />
          <JalaliDatePicker label="تاریخ سررسید" value={form.dueDate} onChange={(iso) => set({ dueDate: iso })} />
          <Select label="طرف حساب" value={form.partyId ?? ''} onChange={(e) => set({ partyId: e.target.value })}>
            <option value="">—</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Select label="وضعیت" value={form.status} onChange={(e) => set({ status: e.target.value as ChequeStatus })}>
            {Object.entries(statusConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Textarea label="توضیحات" value={form.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
