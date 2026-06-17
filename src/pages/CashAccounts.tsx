import { useState } from 'react'
import { Landmark, Plus, Pencil, Trash2, Banknote, CreditCard, Wallet } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getCashBalance } from '@/store/selectors'
import { useConfirm } from '@/components/Confirm'
import { PageHeader, Card, Button, Modal, Input, Select, EmptyState, Badge, StatCard } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import { formatMoney } from '@/utils/format'
import type { CashAccount } from '@/types'

const empty = (): Omit<CashAccount, 'id'> => ({
  name: '',
  type: 'bank',
  openingBalance: 0,
  currency: 'IRR',
  active: true,
})

export default function CashAccounts() {
  const store = useStore()
  const { cashAccounts, addCashAccount, updateCashAccount, removeCashAccount, toast } = store
  const ask = useConfirm((s) => s.ask)
  const unit = store.settings.defaultCurrency
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty())

  const set = (p: Partial<CashAccount>) => setForm((f) => ({ ...f, ...p }))
  const total = cashAccounts.reduce((s, c) => s + getCashBalance(c.id), 0)

  const openNew = () => {
    setForm(empty())
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (c: CashAccount) => {
    setForm({ ...c })
    setEditId(c.id)
    setOpen(true)
  }
  const save = () => {
    if (!form.name.trim()) return toast('نام حساب الزامی است', 'error')
    if (editId) {
      updateCashAccount(editId, form)
      toast('حساب ویرایش شد')
    } else {
      addCashAccount(form)
      toast('حساب جدید ثبت شد')
    }
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="صندوق و بانک"
        subtitle="مدیریت حساب‌های نقدی و بانکی"
        icon={<Landmark size={24} />}
        actions={
          <Button onClick={openNew}>
            <Plus size={18} /> حساب جدید
          </Button>
        }
      />

      <StatCard
        title="مجموع موجودی نقد و بانک"
        value={formatMoney(total, unit, false)}
        icon={<Wallet size={22} />}
        gradient="from-brand-400 to-brand-700"
      />

      {cashAccounts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cashAccounts.map((c) => {
            const bal = getCashBalance(c.id)
            return (
              <Card key={c.id} className="group">
                <div className="flex items-start justify-between">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft ${
                      c.type === 'cash' ? 'from-emerald-400 to-emerald-600' : 'from-brand-400 to-brand-700'
                    }`}
                  >
                    {c.type === 'cash' ? <Banknote size={22} /> : <CreditCard size={22} />}
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => openEdit(c)} className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={async () => {
                        if (await ask({ message: `حساب «${c.name}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                          removeCashAccount(c.id)
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="font-bold">{c.name}</h3>
                  <Badge color={c.type === 'cash' ? 'green' : 'blue'}>{c.type === 'cash' ? 'صندوق' : 'بانک'}</Badge>
                </div>
                {c.bankName && <p className="text-xs text-muted">{c.bankName}</p>}
                {c.iban && <p className="mt-1 text-xs text-muted" dir="ltr">{c.iban}</p>}
                <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-center dark:bg-white/[0.03]">
                  <div className="text-xs text-muted">موجودی فعلی</div>
                  <div className={`text-lg font-extrabold ${bal < 0 ? 'text-rose-500' : ''}`}>
                    {formatMoney(bal, unit, false)}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={<Landmark size={28} />} title="حسابی ثبت نشده است" action={<Button onClick={openNew}><Plus size={18} /> افزودن حساب</Button>} />
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش حساب' : 'حساب جدید'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={save}>ذخیره</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="نام حساب *" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <Select label="نوع" value={form.type} onChange={(e) => set({ type: e.target.value as any })}>
            <option value="bank">بانک</option>
            <option value="cash">صندوق</option>
          </Select>
          {form.type === 'bank' && (
            <>
              <Input label="نام بانک" value={form.bankName ?? ''} onChange={(e) => set({ bankName: e.target.value })} />
              <Input label="شماره حساب" value={form.accountNumber ?? ''} onChange={(e) => set({ accountNumber: e.target.value })} dir="ltr" />
              <Input label="شماره شبا (IBAN)" value={form.iban ?? ''} onChange={(e) => set({ iban: e.target.value })} dir="ltr" />
              <Input label="شماره کارت" value={form.cardNumber ?? ''} onChange={(e) => set({ cardNumber: e.target.value })} dir="ltr" />
            </>
          )}
          <NumberInput label="موجودی اولیه" value={form.openingBalance} onChange={(v) => set({ openingBalance: v })} suffix="ریال" />
        </div>
      </Modal>
    </div>
  )
}
