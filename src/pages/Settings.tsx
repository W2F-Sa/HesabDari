import { useState } from 'react'
import {
  Settings as SettingsIcon,
  Building2,
  Lock,
  Palette,
  FileCog,
  Database,
  Upload,
  Download,
  Trash2,
  KeyRound,
  RefreshCw,
  Tags,
  Plus,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/store/useAuth'
import { useConfirm } from '@/components/Confirm'
import { PageHeader, Card, Button, Input, Select, Textarea, Toggle, Badge } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import { CompanyLogo } from '@/components/CompanyLogo'
import { readFileAsDataURL, downloadFile, generatePassword } from '@/utils/helpers'
import { TEMPLATES } from '@/components/invoice/InvoiceDocument'
import type { Company } from '@/types'

type Tab = 'company' | 'security' | 'appearance' | 'invoice' | 'categories' | 'data'

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'company', label: 'اطلاعات شرکت', icon: Building2 },
  { id: 'security', label: 'امنیت و کاربر', icon: Lock },
  { id: 'appearance', label: 'ظاهر', icon: Palette },
  { id: 'invoice', label: 'فاکتور', icon: FileCog },
  { id: 'categories', label: 'دسته‌بندی‌ها', icon: Tags },
  { id: 'data', label: 'پشتیبان‌گیری', icon: Database },
]

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('company')
  return (
    <div className="space-y-5">
      <PageHeader title="تنظیمات" subtitle="پیکربندی سامانه و اطلاعات شرکت" icon={<SettingsIcon size={24} />} />
      <div className="grid gap-5 lg:grid-cols-4">
        <Card className="h-fit !p-3 lg:col-span-1">
          <div className="flex gap-2 overflow-x-auto lg:flex-col">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  tab === t.id ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <t.icon size={18} /> {t.label}
              </button>
            ))}
          </div>
        </Card>
        <div className="lg:col-span-3">
          {tab === 'company' && <CompanyTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'invoice' && <InvoiceTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'data' && <DataTab />}
        </div>
      </div>
    </div>
  )
}

function CompanyTab() {
  const company = useStore((s) => s.company)
  const setCompany = useStore((s) => s.setCompany)
  const toast = useStore((s) => s.toast)
  const [form, setForm] = useState<Company>({ ...company })
  const set = (p: Partial<Company>) => setForm((f) => ({ ...f, ...p }))

  const upload = async (key: 'logo' | 'stamp', file?: File) => {
    if (!file) return
    const data = await readFileAsDataURL(file)
    set({ [key]: data } as any)
  }

  const save = () => {
    setCompany(form)
    toast('اطلاعات شرکت ذخیره شد')
  }

  return (
    <Card>
      <h3 className="mb-4 font-bold">اطلاعات شرکت</h3>
      <div className="mb-5 flex flex-wrap items-center gap-6">
        <div className="text-center">
          <CompanyLogo size={80} />
          <label className="mt-2 block cursor-pointer text-xs text-brand-500">
            تغییر لوگو
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload('logo', e.target.files?.[0])} />
          </label>
          {form.logo && (
            <button onClick={() => set({ logo: '' })} className="text-xs text-rose-500">
              حذف
            </button>
          )}
        </div>
        <div className="text-center">
          <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-current/20 text-muted">
            {form.stamp ? <img src={form.stamp} alt="stamp" className="h-full w-full object-contain p-1" /> : 'مهر'}
          </div>
          <label className="mt-2 block cursor-pointer text-xs text-brand-500">
            مهر و امضا
            <input type="file" accept="image/*" className="hidden" onChange={(e) => upload('stamp', e.target.files?.[0])} />
          </label>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="نام شرکت" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        <Input label="نام انگلیسی / برند" value={form.nameEn} onChange={(e) => set({ nameEn: e.target.value })} dir="ltr" />
        <Input label="شناسه ملی" value={form.nationalId} onChange={(e) => set({ nationalId: e.target.value })} />
        <Input label="کد اقتصادی" value={form.economicCode} onChange={(e) => set({ economicCode: e.target.value })} />
        <Input label="شماره ثبت" value={form.registrationNumber} onChange={(e) => set({ registrationNumber: e.target.value })} />
        <Input label="تلفن" value={form.phone} onChange={(e) => set({ phone: e.target.value })} dir="ltr" />
        <Input label="موبایل" value={form.mobile} onChange={(e) => set({ mobile: e.target.value })} dir="ltr" />
        <Input label="ایمیل" value={form.email} onChange={(e) => set({ email: e.target.value })} dir="ltr" />
        <Input label="وب‌سایت" value={form.website} onChange={(e) => set({ website: e.target.value })} dir="ltr" />
        <Input label="کد پستی" value={form.postalCode} onChange={(e) => set({ postalCode: e.target.value })} dir="ltr" />
        <Input label="نام بانک" value={form.bankName} onChange={(e) => set({ bankName: e.target.value })} />
        <Input label="شماره شبا" value={form.iban} onChange={(e) => set({ iban: e.target.value })} dir="ltr" />
        <Input label="شماره کارت" value={form.cardNumber} onChange={(e) => set({ cardNumber: e.target.value })} dir="ltr" />
        <Input label="شعار" value={form.slogan} onChange={(e) => set({ slogan: e.target.value })} />
        <div className="sm:col-span-2">
          <Textarea label="آدرس" value={form.address} onChange={(e) => set({ address: e.target.value })} />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={save}>ذخیره اطلاعات</Button>
      </div>
    </Card>
  )
}

function SecurityTab() {
  const { user, changePassword, changeUsername, setDisplayName } = useAuth()
  const toast = useStore((s) => s.toast)
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [newUser, setNewUser] = useState(user?.username ?? '')
  const [userPwd, setUserPwd] = useState('')
  const [display, setDisplay] = useState(user?.displayName ?? '')

  const doChangePwd = async () => {
    if (newPwd.length < 6) return toast('رمز جدید حداقل ۶ کاراکتر باشد', 'error')
    if (newPwd !== confirmPwd) return toast('تکرار رمز مطابقت ندارد', 'error')
    const ok = await changePassword(oldPwd, newPwd)
    if (ok) {
      toast('رمز عبور تغییر کرد')
      setOldPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } else toast('رمز فعلی نادرست است', 'error')
  }

  const doChangeUser = async () => {
    if (!newUser.trim()) return toast('نام کاربری الزامی است', 'error')
    const ok = await changeUsername(newUser, userPwd)
    if (ok) {
      toast('نام کاربری تغییر کرد')
      setUserPwd('')
    } else toast('رمز عبور نادرست است', 'error')
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-bold">
          <KeyRound size={18} /> تغییر رمز عبور
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="رمز فعلی" type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} />
          <Input label="رمز جدید" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          <Input label="تکرار رمز جدید" type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={doChangePwd}>تغییر رمز</Button>
          <Button
            variant="ghost"
            onClick={() => {
              const p = generatePassword(12)
              setNewPwd(p)
              setConfirmPwd(p)
              navigator.clipboard?.writeText(p)
              toast('رمز پیشنهادی تولید و کپی شد', 'info')
            }}
          >
            <RefreshCw size={16} /> تولید رمز قوی
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-bold">نام کاربری و نمایش</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="نام کاربری جدید" value={newUser} onChange={(e) => setNewUser(e.target.value)} dir="ltr" />
          <Input label="رمز عبور (برای تایید)" type="password" value={userPwd} onChange={(e) => setUserPwd(e.target.value)} />
        </div>
        <div className="mt-3">
          <Button onClick={doChangeUser}>تغییر نام کاربری</Button>
        </div>
        <div className="mt-5 flex items-end gap-3 border-t border-white/10 pt-4">
          <Input label="نام نمایشی" value={display} onChange={(e) => setDisplay(e.target.value)} className="flex-1" />
          <Button
            variant="ghost"
            onClick={() => {
              setDisplayName(display)
              toast('نام نمایشی ذخیره شد')
            }}
          >
            ذخیره
          </Button>
        </div>
      </Card>
    </div>
  )
}

function AppearanceTab() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  return (
    <Card>
      <h3 className="mb-4 font-bold">ظاهر و نمایش</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.03]">
          <div>
            <div className="font-semibold">حالت تیره</div>
            <div className="text-xs text-muted">رنگ‌بندی معکوس برای محیط‌های کم‌نور</div>
          </div>
          <Toggle checked={settings.theme === 'dark'} onChange={(v) => setSettings({ theme: v ? 'dark' : 'light' })} />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.03]">
          <div>
            <div className="font-semibold">نمایش نرخ تتر در نوار بالا</div>
            <div className="text-xs text-muted">نرخ روز تتر در هدر نمایش داده شود</div>
          </div>
          <Toggle checked={settings.showUsdtRate} onChange={(v) => setSettings({ showUsdtRate: v })} />
        </div>
        <Select label="واحد پول پیش‌فرض" value={settings.defaultCurrency} onChange={(e) => setSettings({ defaultCurrency: e.target.value as any })}>
          <option value="IRT">تومان</option>
          <option value="IRR">ریال</option>
        </Select>
      </div>
    </Card>
  )
}

function InvoiceTab() {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const toast = useStore((s) => s.toast)
  return (
    <Card>
      <h3 className="mb-4 font-bold">تنظیمات فاکتور</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="پیشوند شماره فاکتور" value={settings.invoicePrefix} onChange={(e) => setSettings({ invoicePrefix: e.target.value })} dir="ltr" />
        <NumberInput label="شماره فاکتور بعدی" value={settings.invoiceCounter} onChange={(v) => setSettings({ invoiceCounter: v })} />
        <Input label="پیشوند پیش‌فاکتور" value={settings.proformaPrefix} onChange={(e) => setSettings({ proformaPrefix: e.target.value })} dir="ltr" />
        <NumberInput label="شماره پیش‌فاکتور بعدی" value={settings.proformaCounter} onChange={(v) => setSettings({ proformaCounter: v })} />
        <NumberInput label="نرخ مالیات پیش‌فرض (٪)" value={settings.defaultTaxRate} onChange={(v) => setSettings({ defaultTaxRate: v })} />
        <Select label="قالب پیش‌فرض فاکتور" value={settings.defaultTemplate} onChange={(e) => setSettings({ defaultTemplate: e.target.value })}>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
        <NumberInput label="سال مالی" value={settings.fiscalYear} onChange={(v) => setSettings({ fiscalYear: v })} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => toast('تنظیمات ذخیره شد')}>ذخیره</Button>
      </div>
    </Card>
  )
}

function CategoriesTab() {
  const { expenseCategories, addExpenseCategory, removeExpenseCategory } = useStore()
  const ask = useConfirm((s) => s.ask)
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [color, setColor] = useState('#327bff')

  return (
    <Card>
      <h3 className="mb-4 font-bold">دسته‌بندی درآمد و هزینه</h3>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <Input label="نام دسته" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Select label="نوع" value={type} onChange={(e) => setType(e.target.value as any)} className="w-32">
          <option value="expense">هزینه</option>
          <option value="income">درآمد</option>
        </Select>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-12 cursor-pointer rounded-xl border-0" />
        <Button
          onClick={() => {
            if (name.trim()) {
              addExpenseCategory({ name: name.trim(), type, color })
              setName('')
            }
          }}
        >
          <Plus size={18} />
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {expenseCategories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/[0.03]">
            <span className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
              {c.name}
              <Badge color={c.type === 'income' ? 'green' : 'red'}>{c.type === 'income' ? 'درآمد' : 'هزینه'}</Badge>
            </span>
            <button
              onClick={async () => {
                if (await ask({ message: `دسته «${c.name}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                  removeExpenseCategory(c.id)
              }}
              className="text-rose-500 hover:opacity-70"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

function DataTab() {
  const store = useStore()
  const ask = useConfirm((s) => s.ask)
  const [importText, setImportText] = useState('')

  const doExport = () => {
    downloadFile(store.exportData(), `giot-backup-${Date.now()}.json`, 'application/json')
    store.toast('فایل پشتیبان دانلود شد')
  }

  const doImportFile = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    if (store.importData(text)) store.toast('اطلاعات بازیابی شد')
    else store.toast('فایل نامعتبر است', 'error')
  }

  return (
    <div className="space-y-5">
      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-bold">
          <Database size={18} /> پشتیبان‌گیری و بازیابی
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={doExport}>
            <Download size={18} /> دانلود فایل پشتیبان (JSON)
          </Button>
          <label className="btn-ghost cursor-pointer">
            <Upload size={18} /> بازیابی از فایل
            <input type="file" accept="application/json" className="hidden" onChange={(e) => doImportFile(e.target.files?.[0])} />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted">
          تمام اطلاعات شما به‌صورت محلی روی همین مرورگر ذخیره می‌شود. برای انتقال یا نگهداری امن، به‌صورت دوره‌ای پشتیبان تهیه کنید.
        </p>
      </Card>

      <Card>
        <h3 className="mb-3 font-bold text-rose-500">منطقه خطر</h3>
        <p className="mb-3 text-sm text-muted">حذف کامل تمام اطلاعات و بازگشت به حالت اولیه. این عمل قابل بازگشت نیست.</p>
        <Button
          variant="danger"
          onClick={async () => {
            if (
              await ask({
                title: 'حذف تمام اطلاعات',
                message: 'آیا مطمئن هستید؟ تمام داده‌ها پاک می‌شود. پیشنهاد می‌شود ابتدا پشتیبان تهیه کنید.',
                danger: true,
                confirmText: 'حذف کامل',
              })
            ) {
              store.resetData()
              store.toast('اطلاعات بازنشانی شد', 'info')
            }
          }}
        >
          <Trash2 size={18} /> بازنشانی کامل اطلاعات
        </Button>
      </Card>
    </div>
  )
}
