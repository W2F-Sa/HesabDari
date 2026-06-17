import { useState } from 'react'
import { BadgeDollarSign, RefreshCw, ArrowRightLeft, TrendingUp, Save } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useUsdtRate } from '@/hooks/useUsdtRate'
import { PageHeader, Card, Button, StatCard } from '@/components/ui'
import NumberInput from '@/components/NumberInput'
import { formatNumber, toFaDigits } from '@/utils/format'
import { toJalali } from '@/utils/date'

export default function Usdt() {
  const usdtRate = useStore((s) => s.usdtRate)
  const setUsdtRate = useStore((s) => s.setUsdtRate)
  const toast = useStore((s) => s.toast)
  const { refresh, loading } = useUsdtRate()

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
    setUsdtRate({
      buy: manualBuy,
      sell: manualSell,
      updatedAt: new Date().toISOString(),
      source: 'دستی',
    })
    toast('نرخ دستی ذخیره شد')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="نرخ تتر و تبدیل ارز"
        subtitle="نرخ روز تتر (USDT) و مبدل تومان"
        icon={<BadgeDollarSign size={24} />}
        actions={
          <Button onClick={() => refresh()} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> بروزرسانی نرخ
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="نرخ خرید تتر"
          value={<span dir="ltr">{usdtRate ? formatNumber(usdtRate.buy) : '—'}</span>}
          icon={<TrendingUp size={22} />}
          gradient="from-emerald-400 to-emerald-600"
          hint="تومان"
        />
        <StatCard
          title="نرخ فروش تتر"
          value={<span dir="ltr">{usdtRate ? formatNumber(usdtRate.sell) : '—'}</span>}
          icon={<BadgeDollarSign size={22} />}
          gradient="from-brand-400 to-brand-700"
          hint="تومان"
        />
        <StatCard
          title="منبع نرخ"
          value={<span className="text-base">{usdtRate?.source ?? '—'}</span>}
          icon={<RefreshCw size={22} />}
          gradient="from-violet-400 to-violet-600"
          hint={usdtRate ? `آخرین بروزرسانی: ${toJalali(usdtRate.updatedAt, true)}` : ''}
        />
      </div>

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
          <p className="mb-4 text-sm text-muted">
            در صورت عدم دسترسی به صرافی، می‌توانید نرخ را به‌صورت دستی وارد و ذخیره کنید.
          </p>
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
          <li>نرخ تتر به‌صورت خودکار از صرافی‌های نوبیتکس و والکس دریافت می‌شود.</li>
          <li>تمام مبالغ تتر در فاکتورها بر اساس نرخ فروش روز محاسبه می‌شوند.</li>
          <li>در صورت محدودیت دسترسی شبکه، نرخ به‌صورت دستی قابل تنظیم است.</li>
          <li>نرخ ذخیره‌شده در زمان صدور هر فاکتور، روی همان فاکتور ثبت می‌ماند.</li>
        </ul>
      </Card>
    </div>
  )
}
