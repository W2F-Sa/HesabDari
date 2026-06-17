import { useState } from 'react'
import {
  BadgeDollarSign,
  RefreshCw,
  ArrowRightLeft,
  TrendingUp,
  Save,
  CheckCircle2,
  XCircle,
  Coins,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useRates } from '@/hooks/useUsdtRate'
import { PageHeader, Card, Button, StatCard, Badge } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import { formatNumber } from '@/utils/format'
import { toJalali } from '@/utils/date'

export default function Usdt() {
  const usdtRate = useStore((s) => s.usdtRate)
  const rateSources = useStore((s) => s.rateSources)
  const cnyRate = useStore((s) => s.cnyRate)
  const setUsdtRate = useStore((s) => s.setUsdtRate)
  const toast = useStore((s) => s.toast)
  const { refresh, loading } = useRates()

  const [manualBuy, setManualBuy] = useState(usdtRate?.buy ?? 0)
  const [manualSell, setManualSell] = useState(usdtRate?.sell ?? 0)

  // مبدل
  const [toman, setToman] = useState(0)
  const [usdt, setUsdt] = useState(0)
  const rate = usdtRate?.sell || 1

  const tomanToUsdt = (t: number) => {
    setToman(t)
    setUsdt(rate ? t / rate : 0)
  }
  const usdtToToman = (u: number) => {
    setUsdt(u)
    setToman(u * rate)
  }

  const saveManual = () => {
    setUsdtRate({ buy: manualBuy, sell: manualSell, updatedAt: new Date().toISOString(), source: 'دستی' })
    toast('نرخ دستی ذخیره شد')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="نرخ لحظه‌ای تتر و یوان"
        subtitle="نرخ روز از ۵ منبع معتبر + نرخ یوان چین"
        icon={<BadgeDollarSign size={24} />}
        actions={
          <Button onClick={() => refresh()} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> بروزرسانی نرخ‌ها
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="نرخ تتر (میانگین فروش)"
          value={<span dir="ltr">{usdtRate ? formatNumber(usdtRate.sell) : '—'}</span>}
          icon={<BadgeDollarSign size={22} />}
          gradient="from-emerald-400 to-emerald-600"
          hint="تومان"
        />
        <StatCard
          title="نرخ خرید تتر"
          value={<span dir="ltr">{usdtRate ? formatNumber(usdtRate.buy) : '—'}</span>}
          icon={<TrendingUp size={22} />}
          gradient="from-brand-400 to-brand-700"
          hint="تومان"
        />
        <StatCard
          title="نرخ یوان چین (CNY)"
          value={<span dir="ltr">{cnyRate ? formatNumber(cnyRate.price) : '—'}</span>}
          icon={<Coins size={22} />}
          gradient="from-amber-400 to-orange-600"
          hint="تومان"
        />
      </div>

      {/* منابع زنده */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">نرخ تتر در ۵ منبع</h3>
          {usdtRate && <span className="text-xs text-muted">آخرین بروزرسانی: {toJalali(usdtRate.updatedAt, true)}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rateSources.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted">
              برای دریافت نرخ، روی «بروزرسانی نرخ‌ها» بزنید.
            </p>
          )}
          {rateSources.map((s) => (
            <div
              key={s.key}
              className={`rounded-2xl border p-4 ${
                s.ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{s.name}</span>
                {s.ok ? (
                  <CheckCircle2 size={18} className="text-emerald-500" />
                ) : (
                  <XCircle size={18} className="text-rose-500" />
                )}
              </div>
              {s.ok ? (
                <div className="mt-2 text-2xl font-extrabold" dir="ltr">
                  {formatNumber(s.sell)}
                  <span className="mr-1 text-xs font-normal text-muted">تومان</span>
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted">در دسترس نیست</div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-6 text-muted">
          نرخ نهایی تتر = میانگین (median) منابع در دسترس. منابع: نوبیتکس، تترلند، بیت‌پین، اکسیر و TGJU.
          برخی منابع ممکن است به دلیل محدودیت شبکه‌ی مرورگر شما در دسترس نباشند.
        </p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <ArrowRightLeft size={18} /> مبدل تومان ⇄ تتر
          </h3>
          <div className="space-y-4">
            <NumberInput label="مبلغ به تومان" value={toman} onChange={tomanToUsdt} suffix="تومان" />
            <div className="flex justify-center">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-500/10 text-brand-500">
                <ArrowRightLeft size={18} />
              </div>
            </div>
            <NumberInput label="معادل تتر" value={Math.round(usdt * 100) / 100} onChange={usdtToToman} suffix="USDT" />
            <p className="text-center text-xs text-muted">
              بر اساس نرخ فروش {usdtRate ? formatNumber(usdtRate.sell) : '—'} تومان
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 font-bold">ثبت نرخ دستی</h3>
          <p className="mb-4 text-sm text-muted">در صورت عدم دسترسی به منابع، نرخ را دستی وارد و ذخیره کنید.</p>
          <div className="space-y-4">
            <NumberInput label="نرخ خرید (تومان)" value={manualBuy} onChange={setManualBuy} suffix="تومان" />
            <NumberInput label="نرخ فروش (تومان)" value={manualSell} onChange={setManualSell} suffix="تومان" />
            <Button onClick={saveManual} className="w-full">
              <Save size={18} /> ذخیره نرخ دستی
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 font-bold">راهنما</h3>
        <ul className="list-disc space-y-1.5 pr-5 text-sm text-muted">
          <li>نرخ تتر هم‌زمان از ۵ صرافی/منبع دریافت و میانگین آن‌ها به‌عنوان نرخ مرجع استفاده می‌شود.</li>
          <li>نرخ یوان چین از بازار آزاد (TGJU) دریافت می‌شود.</li>
          <li>نرخ‌ها به‌صورت خودکار هر ۱۵ دقیقه یک‌بار بروزرسانی می‌شوند.</li>
          <li>نرخ ذخیره‌شده در زمان صدور هر فاکتور، روی همان فاکتور ثبت می‌ماند.</li>
        </ul>
      </Card>
    </div>
  )
}
