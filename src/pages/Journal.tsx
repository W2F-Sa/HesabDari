import { useMemo, useState } from 'react'
import { ScrollText, Plus, Trash2, Pencil, Search, Scale, CheckCircle2, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useConfirm } from '@/components/Confirm'
import { PageHeader, Card, Button, Modal, Input, Select, Table, Th, Td, Badge, EmptyState } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import JalaliDatePicker from '@/components/JalaliDatePicker'
import { toJalali } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import { uid, sum } from '@/utils/helpers'
import type { JournalEntry, JournalLine } from '@/types'

const newLine = (): JournalLine => ({ id: uid('jl_'), accountId: '', debit: 0, credit: 0 })

const empty = (number: string): Omit<JournalEntry, 'id' | 'createdAt'> => ({
  number,
  date: new Date().toISOString(),
  description: '',
  lines: [newLine(), newLine()],
  refType: 'manual',
})

export default function Journal() {
  const store = useStore()
  const { journalEntries, accounts, addJournalEntry, updateJournalEntry, removeJournalEntry, toast } = store
  const ask = useConfirm((s) => s.ask)
  const unit = store.settings.defaultCurrency
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(empty(`SND-${journalEntries.length + 1}`))

  const nonGroupAccounts = accounts.filter((a) => !a.isGroup)

  const totalDebit = useMemo(() => sum(form.lines.map((l) => l.debit)), [form.lines])
  const totalCredit = useMemo(() => sum(form.lines.map((l) => l.credit)), [form.lines])
  const balanced = totalDebit === totalCredit && totalDebit > 0

  const filtered = journalEntries.filter(
    (j) => !search || `${j.number} ${j.description}`.includes(search),
  )

  const openNew = () => {
    setForm(empty(`SND-${journalEntries.length + 1}`))
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (j: JournalEntry) => {
    setForm({ ...j, lines: j.lines.map((l) => ({ ...l })) })
    setEditId(j.id)
    setOpen(true)
  }

  const setLine = (id: string, patch: Partial<JournalLine>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, newLine()] }))
  const removeLine = (id: string) =>
    setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.id !== id) }))

  const save = () => {
    if (!form.description.trim()) return toast('شرح سند الزامی است', 'error')
    if (!balanced) return toast('سند تراز نیست (جمع بدهکار و بستانکار باید برابر باشد)', 'error')
    if (form.lines.some((l) => !l.accountId)) return toast('برای همه ردیف‌ها حساب انتخاب کنید', 'error')
    if (editId) {
      updateJournalEntry(editId, form)
      toast('سند ویرایش شد')
    } else {
      addJournalEntry(form)
      toast('سند ثبت شد')
    }
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="اسناد حسابداری"
        subtitle="ثبت اسناد دوطرفه (بدهکار/بستانکار)"
        icon={<ScrollText size={24} />}
        actions={
          <Button onClick={openNew}>
            <Plus size={18} /> سند جدید
          </Button>
        }
      />

      <Card className="!p-4">
        <div className="relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="glass-input pr-10" placeholder="جستجوی شماره یا شرح سند…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card className="!p-0">
        {filtered.length ? (
          <Table>
            <thead>
              <tr className="border-b border-white/10">
                <Th>شماره</Th>
                <Th>تاریخ</Th>
                <Th>شرح</Th>
                <Th>تعداد ردیف</Th>
                <Th>مبلغ سند</Th>
                <Th className="text-left"></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => {
                const amount = sum(j.lines.map((l) => l.debit))
                return (
                  <tr key={j.id} className="table-row border-b border-white/5">
                    <Td className="font-mono text-sm">{j.number}</Td>
                    <Td className="text-sm">{toJalali(j.date)}</Td>
                    <Td>{j.description}</Td>
                    <Td className="text-sm text-muted">{j.lines.length} ردیف</Td>
                    <Td className="font-semibold">{formatMoney(amount, unit, false)}</Td>
                    <Td className="text-left">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(j)} className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10">
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={async () => {
                            if (await ask({ message: `سند «${j.number}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                              removeJournalEntry(j.id)
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
          <EmptyState icon={<ScrollText size={28} />} title="سندی ثبت نشده است" action={<Button onClick={openNew}><Plus size={18} /> سند جدید</Button>} />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش سند' : 'سند حسابداری جدید'}
        size="xl"
        footer={
          <>
            <div className="ml-auto flex items-center gap-3 text-sm">
              {balanced ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 size={16} /> سند تراز است
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-500">
                  <XCircle size={16} /> سند تراز نیست
                </span>
              )}
            </div>
            <Button variant="ghost" onClick={() => setOpen(false)}>انصراف</Button>
            <Button onClick={save} disabled={!balanced}>ذخیره</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="شماره سند" value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} dir="ltr" />
            <JalaliDatePicker label="تاریخ" value={form.date} onChange={(iso) => setForm((f) => ({ ...f, date: iso }))} />
            <Input label="شماره مرجع" value={form.reference ?? ''} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
          </div>
          <Input label="شرح سند *" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">ردیف‌های سند</h4>
              <Button variant="ghost" onClick={addLine} className="!py-1.5 !text-xs">
                <Plus size={15} /> افزودن ردیف
              </Button>
            </div>
            <div className="space-y-2">
              {form.lines.map((l) => (
                <div key={l.id} className="grid grid-cols-12 items-center gap-2 rounded-2xl bg-black/[0.03] p-2 dark:bg-white/[0.03]">
                  <div className="col-span-12 sm:col-span-4">
                    <select className="glass-input" value={l.accountId} onChange={(e) => setLine(l.id, { accountId: e.target.value })}>
                      <option value="">انتخاب حساب…</option>
                      {nonGroupAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-12 sm:col-span-3">
                    <input className="glass-input" placeholder="شرح ردیف" value={l.description ?? ''} onChange={(e) => setLine(l.id, { description: e.target.value })} />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <NumberInput value={l.debit} onChange={(v) => setLine(l.id, { debit: v, credit: 0 })} placeholder="بدهکار" />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <NumberInput value={l.credit} onChange={(v) => setLine(l.id, { credit: v, debit: 0 })} placeholder="بستانکار" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    <button onClick={() => removeLine(l.id)} className="grid h-9 w-9 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-6 rounded-2xl bg-brand-500/5 p-3 text-sm">
              <span className="flex items-center gap-2">
                <Scale size={16} className="text-muted" />
                جمع بدهکار: <b>{formatMoney(totalDebit, unit, false)}</b>
              </span>
              <span>
                جمع بستانکار: <b>{formatMoney(totalCredit, unit, false)}</b>
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
