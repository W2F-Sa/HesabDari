import { useMemo, useState } from 'react'
import { Users, Plus, Search, Pencil, Trash2, Phone, MapPin, Download } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getPartyBalance } from '@/store/selectors'
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
  Toggle,
} from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import { formatMoney } from '@/utils/format'
import { exportCSV } from '@/utils/helpers'
import type { Party, PartyType } from '@/types'

const typeLabels: Record<PartyType, string> = {
  customer: 'مشتری',
  supplier: 'تامین‌کننده',
  both: 'مشتری/تامین‌کننده',
  employee: 'کارمند',
}

const emptyParty = (): Omit<Party, 'id' | 'createdAt'> => ({
  type: 'customer',
  name: '',
  isLegal: false,
  openingBalance: 0,
  active: true,
})

export default function Parties() {
  const { parties, addParty, updateParty, removeParty, toast } = useStore()
  const ask = useConfirm((s) => s.ask)
  const unit = useStore((s) => s.settings.defaultCurrency)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | PartyType>('all')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyParty())

  const filtered = useMemo(() => {
    return parties.filter((p) => {
      if (filter !== 'all' && p.type !== filter) return false
      if (search && !`${p.name} ${p.company ?? ''} ${p.mobile ?? ''} ${p.nationalId ?? ''}`.includes(search))
        return false
      return true
    })
  }, [parties, search, filter])

  const openNew = () => {
    setForm(emptyParty())
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (p: Party) => {
    setForm({ ...p })
    setEditId(p.id)
    setOpen(true)
  }
  const save = () => {
    if (!form.name.trim()) return toast('نام طرف حساب الزامی است', 'error')
    if (editId) {
      updateParty(editId, form)
      toast('طرف حساب ویرایش شد')
    } else {
      addParty(form)
      toast('طرف حساب جدید ثبت شد')
    }
    setOpen(false)
  }
  const del = async (p: Party) => {
    if (await ask({ message: `طرف حساب «${p.name}» حذف شود؟`, danger: true, confirmText: 'حذف' })) {
      removeParty(p.id)
      toast('حذف شد', 'info')
    }
  }

  const set = (patch: Partial<Party>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="طرف حساب‌ها"
        subtitle="مدیریت مشتریان، تامین‌کنندگان و کارکنان"
        icon={<Users size={24} />}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                exportCSV(
                  parties.map((p) => ({
                    نام: p.name,
                    نوع: typeLabels[p.type],
                    موبایل: p.mobile ?? '',
                    شهر: p.city ?? '',
                    مانده: getPartyBalance(p.id),
                  })),
                  'parties.csv',
                )
              }
            >
              <Download size={18} /> خروجی
            </Button>
            <Button onClick={openNew}>
              <Plus size={18} /> طرف حساب جدید
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
              placeholder="جستجو بر اساس نام، موبایل یا کد ملی…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="sm:w-52">
            <option value="all">همه انواع</option>
            <option value="customer">مشتری</option>
            <option value="supplier">تامین‌کننده</option>
            <option value="both">مشتری/تامین‌کننده</option>
            <option value="employee">کارمند</option>
          </Select>
        </div>
      </Card>

      <Card className="!p-0">
        {filtered.length ? (
          <Table>
            <thead>
              <tr className="border-b border-white/10">
                <Th>نام / شرکت</Th>
                <Th>نوع</Th>
                <Th>تماس</Th>
                <Th>موقعیت</Th>
                <Th>مانده حساب</Th>
                <Th className="text-left">عملیات</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const bal = getPartyBalance(p.id)
                return (
                  <tr key={p.id} className="table-row border-b border-white/5">
                    <Td>
                      <div className="font-semibold">{p.name}</div>
                      {p.company && <div className="text-xs text-muted">{p.company}</div>}
                      {p.isLegal && <Badge color="violet" className="mt-1">حقوقی</Badge>}
                    </Td>
                    <Td>
                      <Badge color={p.type === 'customer' ? 'blue' : p.type === 'supplier' ? 'amber' : 'green'}>
                        {typeLabels[p.type]}
                      </Badge>
                    </Td>
                    <Td>
                      {p.mobile ? (
                        <span className="flex items-center gap-1 text-sm" dir="ltr">
                          <Phone size={13} /> {p.mobile}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      {p.city ? (
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin size={13} /> {p.city}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td>
                      <span
                        className={
                          bal > 0 ? 'font-bold text-rose-500' : bal < 0 ? 'font-bold text-emerald-500' : 'text-muted'
                        }
                      >
                        {formatMoney(Math.abs(bal), unit, false)}
                        <span className="mr-1 text-xs font-normal">
                          {bal > 0 ? 'بدهکار' : bal < 0 ? 'بستانکار' : 'تسویه'}
                        </span>
                      </span>
                    </Td>
                    <Td className="text-left">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => del(p)}
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
            icon={<Users size={28} />}
            title="طرف حسابی یافت نشد"
            description="برای شروع، اولین مشتری یا تامین‌کننده خود را اضافه کنید."
            action={
              <Button onClick={openNew}>
                <Plus size={18} /> افزودن طرف حساب
              </Button>
            }
          />
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش طرف حساب' : 'طرف حساب جدید'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button onClick={save}>ذخیره</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="نام *" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <Input
            label="نام شرکت"
            value={form.company ?? ''}
            onChange={(e) => set({ company: e.target.value })}
          />
          <Select label="نوع" value={form.type} onChange={(e) => set({ type: e.target.value as PartyType })}>
            <option value="customer">مشتری</option>
            <option value="supplier">تامین‌کننده</option>
            <option value="both">مشتری/تامین‌کننده</option>
            <option value="employee">کارمند</option>
          </Select>
          <div className="flex items-end">
            <Toggle checked={form.isLegal} onChange={(v) => set({ isLegal: v })} label="شخص حقوقی است" />
          </div>
          <Input
            label={form.isLegal ? 'شناسه ملی' : 'کد ملی'}
            value={form.nationalId ?? ''}
            onChange={(e) => set({ nationalId: e.target.value })}
          />
          <Input
            label="کد اقتصادی"
            value={form.economicCode ?? ''}
            onChange={(e) => set({ economicCode: e.target.value })}
          />
          <Input
            label="موبایل"
            value={form.mobile ?? ''}
            onChange={(e) => set({ mobile: e.target.value })}
            dir="ltr"
          />
          <Input
            label="تلفن"
            value={form.phone ?? ''}
            onChange={(e) => set({ phone: e.target.value })}
            dir="ltr"
          />
          <Input
            label="ایمیل"
            value={form.email ?? ''}
            onChange={(e) => set({ email: e.target.value })}
            dir="ltr"
          />
          <Input label="شهر" value={form.city ?? ''} onChange={(e) => set({ city: e.target.value })} />
          <Input
            label="استان"
            value={form.province ?? ''}
            onChange={(e) => set({ province: e.target.value })}
          />
          <Input
            label="کد پستی"
            value={form.postalCode ?? ''}
            onChange={(e) => set({ postalCode: e.target.value })}
            dir="ltr"
          />
          <NumberInput
            label="مانده اولیه (مثبت=بدهکار)"
            value={form.openingBalance}
            onChange={(v) => set({ openingBalance: v })}
            suffix="ریال"
          />
          <NumberInput
            label="سقف اعتبار"
            value={form.creditLimit ?? 0}
            onChange={(v) => set({ creditLimit: v })}
            suffix="ریال"
          />
          <div className="sm:col-span-2">
            <Textarea
              label="آدرس"
              value={form.address ?? ''}
              onChange={(e) => set({ address: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="یادداشت"
              value={form.note ?? ''}
              onChange={(e) => set({ note: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
