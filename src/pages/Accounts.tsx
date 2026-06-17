import { useMemo, useState } from 'react'
import { BookOpenCheck, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useConfirm } from '@/components/Confirm'
import { PageHeader, Card, Button, Modal, Input, Select, Table, Th, Td, Badge, EmptyState, Toggle } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import { formatMoney } from '@/utils/format'
import type { Account, AccountKind } from '@/types'

const kindLabels: Record<AccountKind, { label: string; color: any }> = {
  asset: { label: 'دارایی', color: 'blue' },
  liability: { label: 'بدهی', color: 'amber' },
  equity: { label: 'سرمایه', color: 'violet' },
  income: { label: 'درآمد', color: 'green' },
  expense: { label: 'هزینه', color: 'red' },
}

const empty = (): Omit<Account, 'id'> => ({
  code: '',
  name: '',
  kind: 'asset',
  isGroup: false,
  openingBalance: 0,
  active: true,
})

export default function Accounts() {
  const store = useStore()
  const { accounts, journalEntries, addAccount, updateAccount, removeAccount, toast } = store
  const ask = useConfirm((s) => s.ask)
  const unit = store.settings.defaultCurrency
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | AccountKind>('all')
  const [form, setForm] = useState(empty())

  const set = (p: Partial<Account>) => setForm((f) => ({ ...f, ...p }))

  // محاسبه مانده هر حساب با احتساب اسناد
  const balances = useMemo(() => {
    const map: Record<string, number> = {}
    for (const a of accounts) map[a.id] = a.openingBalance
    for (const je of journalEntries) {
      for (const line of je.lines) {
        if (map[line.accountId] === undefined) map[line.accountId] = 0
        map[line.accountId] += line.debit - line.credit
      }
    }
    return map
  }, [accounts, journalEntries])

  const filtered = useMemo(
    () =>
      accounts.filter((a) => {
        if (kindFilter !== 'all' && a.kind !== kindFilter) return false
        if (search && !`${a.code} ${a.name}`.includes(search)) return false
        return true
      }),
    [accounts, kindFilter, search],
  )

  const openNew = () => {
    setForm(empty())
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (a: Account) => {
    setForm({ ...a })
    setEditId(a.id)
    setOpen(true)
  }
  const save = () => {
    if (!form.name.trim() || !form.code.trim()) return toast('کد و نام حساب الزامی است', 'error')
    if (editId) {
      updateAccount(editId, form)
      toast('حساب ویرایش شد')
    } else {
      addAccount(form)
      toast('حساب جدید ثبت شد')
    }
    setOpen(false)
  }

  const groups = accounts.filter((a) => a.isGroup)

  return (
    <div className="space-y-5">
      <PageHeader
        title="دفتر حساب‌ها"
        subtitle="کدینگ حساب‌ها بر اساس استاندارد حسابداری ایران"
        icon={<BookOpenCheck size={24} />}
        actions={
          <Button onClick={openNew}>
            <Plus size={18} /> حساب جدید
          </Button>
        }
      />

      <Card className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="glass-input pr-10" placeholder="جستجوی کد یا نام حساب…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)} className="sm:w-52">
            <option value="all">همه گروه‌ها</option>
            {Object.entries(kindLabels).map(([k, v]) => (
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
                <Th>کد</Th>
                <Th>نام حساب</Th>
                <Th>گروه</Th>
                <Th>نوع</Th>
                <Th>مانده</Th>
                <Th className="text-left"></Th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((a) => {
                  const bal = balances[a.id] ?? 0
                  return (
                    <tr key={a.id} className="table-row border-b border-white/5">
                      <Td className="font-mono text-sm" >{a.code}</Td>
                      <Td className={a.isGroup ? 'font-bold' : ''}>{a.name}</Td>
                      <Td>
                        <Badge color={kindLabels[a.kind].color}>{kindLabels[a.kind].label}</Badge>
                      </Td>
                      <Td className="text-sm text-muted">{a.isGroup ? 'گروه' : 'حساب'}</Td>
                      <Td className="font-semibold">{formatMoney(Math.abs(bal), unit, false)}</Td>
                      <Td className="text-left">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(a)} className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10">
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (await ask({ message: `حساب «${a.name}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                                removeAccount(a.id)
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
          <EmptyState icon={<BookOpenCheck size={28} />} title="حسابی یافت نشد" />
        )}
      </Card>

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
          <Input label="کد حساب *" value={form.code} onChange={(e) => set({ code: e.target.value })} dir="ltr" />
          <Input label="نام حساب *" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <Select label="نوع حساب" value={form.kind} onChange={(e) => set({ kind: e.target.value as AccountKind })}>
            {Object.entries(kindLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </Select>
          <Select label="حساب والد" value={form.parentId ?? ''} onChange={(e) => set({ parentId: e.target.value || null })}>
            <option value="">بدون والد</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <NumberInput label="مانده اولیه" value={form.openingBalance} onChange={(v) => set({ openingBalance: v })} suffix="ریال" />
          <div className="flex items-end gap-4">
            <Toggle checked={form.isGroup} onChange={(v) => set({ isGroup: v })} label="حساب گروه (کل)" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
