import { Menu, Moon, Sun, LogOut, BadgeDollarSign, RefreshCw } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/store/useAuth'
import { formatNumber, toFaDigits } from '@/utils/format'
import { useUsdtRate } from '@/hooks/useUsdtRate'
import { toJalaliLong } from '@/utils/date'

export default function Header({ onMenu }: { onMenu: () => void }) {
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const usdtRate = useStore((s) => s.usdtRate)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const { refresh, loading } = useUsdtRate()

  const toggleTheme = () =>
    setSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })

  return (
    <header className="sticky top-0 z-20 mb-5">
      <div className="glass-card flex items-center gap-3 px-4 py-3">
        <button
          onClick={onMenu}
          className="grid h-10 w-10 place-items-center rounded-xl transition hover:bg-black/5 dark:hover:bg-white/10 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="hidden flex-col sm:flex">
          <span className="text-sm font-semibold">
            {user?.displayName ? `${user.displayName} عزیز، خوش آمدید` : 'خوش آمدید'}
          </span>
          <span className="text-xs text-muted">{toJalaliLong(new Date())}</span>
        </div>

        <div className="flex-1" />

        {/* نرخ تتر */}
        {settings.showUsdtRate && (
          <div className="hidden items-center gap-2 rounded-2xl bg-emerald-500/10 px-3 py-2 sm:flex">
            <BadgeDollarSign size={18} className="text-emerald-500" />
            <div className="leading-tight">
              <div className="text-[10px] text-muted">نرخ تتر</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                {usdtRate ? `${formatNumber(usdtRate.sell)}` : '—'}
                <span className="mr-1 text-[10px] font-normal text-muted">تومان</span>
              </div>
            </div>
            <button
              onClick={() => refresh()}
              title="بروزرسانی نرخ"
              className="grid h-8 w-8 place-items-center rounded-lg transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        <button
          onClick={toggleTheme}
          title="تغییر تم"
          className="grid h-10 w-10 place-items-center rounded-xl transition hover:bg-black/5 dark:hover:bg-white/10"
        >
          {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={logout}
          title="خروج"
          className="grid h-10 w-10 place-items-center rounded-xl text-rose-500 transition hover:bg-rose-500/10"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  )
}
