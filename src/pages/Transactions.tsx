import { useMemo, useState } from 'react'
import {
  Wallet,
  Plus,
  Search,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Pencil,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
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
  StatCard,
} from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import JalaliDatePicker from '@/components/JalaliDatePicker'
import { toJalali } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { exportCSV } from '@/utils/helpers'
import type { Transaction, TransactionType } from '@/types'

const typeConfig: Record<TransactionType, { label: string; color: any; inflow: boolean }> = {
  income: { label: 'درآمد', color: 'green', inflow: true },
  expense: { label: 'هزینه', color: 'red', inflow: false },
  receive: { label: 'دریافت از طرف حساب', color: 'green', inflow: true },
  pay: { label: 'پرداخت به طرف حساب', color: 'red', inflow: false },
  transfer: { label: 'انتقال داخلی', color: 'blue', inflow: false },
}

const methodLabels: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  transfer: 'انتقال بانکی',
  cheque: 'چک',
  usdt: 'تتر',
  other: 'سایر',
}

const empty = (accountId: string): Omit<Transaction, 'id' | 'createdAt'> => ({
  date: new Date().toISOString(),
  type: 'income',
  amount: 0,
  accountId,
  method: 'cash',
  description: '',
})

export default function Transactions() {
  const store = useStore()
  const { transactions, cashAccounts, expenseCategories, parties, addTransaction, updateTransaction, removeTransaction, toast } = store
  const ask = useConfirm((s) => s.ask)
  const unit = store.settings.defaultCurrency
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [form, setForm] = useState(empty(cashAccounts[0]?.id ?? ''))

  const set = (p: Partial<Transaction>) => setForm((f) => ({ ...f, ...p }))

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false
        if (search && !`${t.description} ${t.reference ?? ''}`.includes(search)) return false
        return true
      }),
    [transactions, typeFilter, search],
  )

  const totalIn = transactions.filter((t) => typeConfig[t.type].inflow).reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter((t) => !typeConfig[t.type].inflow).reduce((s, t) => s + t.amount, 0)

  const openNew = () => {
    setForm(empty(cashAccounts[0]?.id ?? ''))
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (t: Transaction) => {
    setForm({ ...t })
    setEditId(t.id)
    setOpen(true)
  }
  const save = () => {
    if (form.amount <= 0) return toast('مبلغ باید بزرگتر از صفر باشد', 'error')
    if (!form.description.trim()) return toast('شرح تراکنش الزامی است', 'error')
    if (editId) {
      updateTransaction(editId, form)
      toast('تراکنش ویرایش شد')
    } else {
      addTransaction(form)
      toast('تراکنش ثبت شد')
    }
    setOpen(false)
  }

  const cats = expenseCategories.filter((c) =>
    typeConfig[form.type].inflow ? c.type === 'income' : c.type === 'expense',
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="دریافت و پرداخت"
        subtitle="ثبت درآمد، هزینه و تراکنش‌های مالی"
        icon={<Wallet size={24} />}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                exportCSV(
                  transactions.map((t) => ({
                    تاریخ: toJalali(t.date),
                    نوع: typeConfig[t.type].label,
                    مبلغ: t.amount,
                    شرح: t.description,
                  })),
                  'transactions.csv',
                )
              }
            >
              <Download size={18} /> خروجی
            </Button>
            <Button onClick={openNew}>
              <Plus size={18} /> تراکنش جدید
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="مجموع دریافتی‌ها" value={formatMoney(totalIn, unit, false)} icon={<ArrowDownCircle size={22} />} gradient="from-emerald-400 to-emerald-600" />
        <StatCard title="مجموع پرداختی‌ها" value={formatMoney(totalOut, unit, false)} icon={<ArrowUpCircle size={22} />} gradient="from-rose-400 to-rose-600" />
        <StatCard title="خالص جریان نقد" value={formatMoney(totalIn - totalOut, unit, false)} icon={<Wallet size={22} />} gradient="from-brand-400 to-brand-700" />
      </div>

      <Card className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="glass-input pr-10" placeholder="جستجو…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="sm:w-56">
            <option value="all">همه انواع</option>
            {Object.entries(typeConfig).map(([k, v]) => (
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
                <Th>شرح</Th>
                <Th>طرف حساب</Th>
                <Th>روش</Th>
                <Th>مبلغ</Th>
                <Th className="text-left"></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const cfg = typeConfig[t.type]
                const party = parties.find((p) => p.id === t.partyId)
                return (
                  <tr key={t.id} className="table-row border-b border-white/5">
                    <Td className="text-sm">{toJalali(t.date)}</Td>
                    <Td>
                      <Badge color={cfg.color}>{cfg.label}</Badge>
                    </Td>
                    <Td>{t.description}</Td>
                    <Td className="text-sm">{party?.name ?? '—'}</Td>
                    <Td className="text-sm">{methodLabels[t.method]}</Td>
                    <Td>
                      <span className={cfg.inflow ? 'font-bold text-emerald-500' : 'font-bold text-rose-500'}>
                        {cfg.inflow ? '+' : '−'}
                        {formatMoney(t.amount, unit, false)}
                      </span>
                    </Td>
                    <Td className="text-left">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(t)} className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10">
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (await ask({ message: 'این تراکنش حذف شود؟', danger: true, confirmText: 'حذف' }))
                              removeTransaction(t.id)
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
          <EmptyState icon={<Wallet size={28} />} title="تراکنشی ثبت نشده است" action={<Button onClick={openNew}><Plus size={18} /> ثبت تراکنش</Button>} />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش تراکنش' : 'تراکنش جدید'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={save}>ذخیره</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="نوع تراکنش" value={form.type} onChange={(e) => set({ type: e.target.value as TransactionType, categoryId: undefined })}>
            {Object.entries(typeConfig).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <JalaliDatePicker label="تاریخ" value={form.date} onChange={(iso) => set({ date: iso })} />
          <NumberInput label="مبلغ" value={form.amount} onChange={(v) => set({ amount: v })} suffix="ریال" />
          <Select label="صندوق/بانک" value={form.accountId ?? ''} onChange={(e) => set({ accountId: e.target.value })}>
            {cashAccounts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="روش پرداخت" value={form.method} onChange={(e) => set({ method: e.target.value as any })}>
            {Object.entries(methodLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          {cats.length > 0 && (
            <Select label="دسته‌بندی" value={form.categoryId ?? ''} onChange={(e) => set({ categoryId: e.target.value })}>
              <option value="">—</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
          {(form.type === 'receive' || form.type === 'pay') && (
            <Select label="طرف حساب" value={form.partyId ?? ''} onChange={(e) => set({ partyId: e.target.value })}>
              <option value="">—</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          <Input label="شماره مرجع/پیگیری" value={form.reference ?? ''} onChange={(e) => set({ reference: e.target.value })} dir="ltr" />
          <div className="sm:col-span-2">
            <Textarea label="شرح *" value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
