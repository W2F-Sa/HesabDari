import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Boxes,
  Users,
  FileText,
  AlertTriangle,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  PackageSearch,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { computeDashboard, getProductStock } from '@/store/selectors'
import { calcInvoice } from '@/utils/invoice'
import { StatCard, Card, PageHeader, Badge } from '@/components/ui'
import { formatMoney, toFaDigits } from '@/utils/format'
import { toJalali, JALALI_MONTHS } from '@/utils/date'
import jalaali from 'jalaali-js'

export default function Dashboard() {
  const store = useStore()
  const stats = useMemo(() => computeDashboard(), [
    store.invoices,
    store.transactions,
    store.products,
    store.stockMoves,
    store.cashAccounts,
  ])
  const unit = store.settings.defaultCurrency

  // نمودار فروش ماهانه (۶ ماه اخیر)
  const monthlyData = useMemo(() => {
    const now = new Date()
    const buckets: { label: string; فروش: number; هزینه: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const { jy, jm } = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, 1)
      buckets.push({ label: `${JALALI_MONTHS[jm - 1]}`, فروش: 0, هزینه: 0 })
    }
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime()
    for (const inv of store.invoices) {
      if (inv.type !== 'sale' || inv.status === 'canceled') continue
      const t = new Date(inv.date).getTime()
      if (t < startMonth) continue
      const idx =
        (new Date(inv.date).getFullYear() - now.getFullYear()) * 12 +
        (new Date(inv.date).getMonth() - now.getMonth()) +
        5
      if (idx >= 0 && idx < 6) buckets[idx].فروش += calcInvoice(inv).payable
    }
    for (const tx of store.transactions) {
      if (tx.type !== 'expense') continue
      const t = new Date(tx.date).getTime()
      if (t < startMonth) continue
      const idx =
        (new Date(tx.date).getFullYear() - now.getFullYear()) * 12 +
        (new Date(tx.date).getMonth() - now.getMonth()) +
        5
      if (idx >= 0 && idx < 6) buckets[idx].هزینه += tx.amount
    }
    return buckets
  }, [store.invoices, store.transactions])

  const lowStock = useMemo(
    () =>
      store.products
        .filter((p) => p.type === 'product')
        .map((p) => ({ p, stock: getProductStock(p.id, store.stockMoves, store.products) }))
        .filter((x) => x.stock <= x.p.reorderLevel)
        .slice(0, 5),
    [store.products, store.stockMoves],
  )

  const recentInvoices = store.invoices.slice(0, 5)

  const pieData = [
    { name: 'دریافتنی', value: stats.receivables, color: '#327bff' },
    { name: 'پرداختنی', value: stats.payables, color: '#f59e0b' },
    { name: 'موجودی نقد', value: Math.max(0, stats.cashTotal), color: '#2dd4a7' },
    { name: 'ارزش انبار', value: stats.inventoryValue, color: '#8b5cf6' },
  ].filter((d) => d.value > 0)

  const div = unit === 'IRT' ? 10 : 1

  return (
    <div className="space-y-5">
      <PageHeader
        title="داشبورد مدیریتی"
        subtitle="نمای کلی وضعیت مالی و انبار شرکت"
        icon={<TrendingUp size={24} />}
        actions={
          <Link to="/invoices/new" className="btn-primary">
            <Plus size={18} /> فاکتور جدید
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="فروش کل"
          value={formatMoney(stats.totalSales, unit)}
          icon={<ArrowUpRight size={22} />}
          gradient="from-emerald-400 to-emerald-600"
        />
        <StatCard
          title="خرید کل"
          value={formatMoney(stats.totalPurchases, unit)}
          icon={<ArrowDownLeft size={22} />}
          gradient="from-amber-400 to-orange-600"
        />
        <StatCard
          title="سود خالص"
          value={formatMoney(stats.netProfit, unit)}
          icon={<PiggyBank size={22} />}
          gradient="from-brand-400 to-brand-700"
        />
        <StatCard
          title="موجودی نقد"
          value={formatMoney(stats.cashTotal, unit)}
          icon={<Wallet size={22} />}
          gradient="from-violet-400 to-violet-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="مطالبات (دریافتنی)"
          value={formatMoney(stats.receivables, unit)}
          icon={<TrendingUp size={22} />}
          gradient="from-sky-400 to-blue-600"
        />
        <StatCard
          title="بدهی‌ها (پرداختنی)"
          value={formatMoney(stats.payables, unit)}
          icon={<TrendingDown size={22} />}
          gradient="from-rose-400 to-rose-600"
        />
        <StatCard
          title="ارزش موجودی انبار"
          value={formatMoney(stats.inventoryValue, unit)}
          icon={<Boxes size={22} />}
          gradient="from-teal-400 to-emerald-600"
        />
        <StatCard
          title="فاکتورهای سررسید گذشته"
          value={toFaDigits(stats.overdueCount)}
          icon={<AlertTriangle size={22} />}
          gradient="from-red-400 to-rose-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">روند فروش و هزینه (۶ ماه اخیر)</h3>
            <Badge color="blue">{store.settings.defaultCurrency === 'IRT' ? 'تومان' : 'ریال'}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData.map((d) => ({ ...d, فروش: d.فروش / div, هزینه: d.هزینه / div }))}>
              <defs>
                <linearGradient id="sale" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#327bff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#327bff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,130,150,0.15)" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fontFamily: 'Vazirmatn' }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => new Intl.NumberFormat('en').format(v)}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: 'none',
                  fontFamily: 'Vazirmatn',
                  fontSize: 13,
                  background: 'rgba(255,255,255,0.95)',
                }}
                formatter={(v: number) => new Intl.NumberFormat('fa').format(v)}
              />
              <Area type="monotone" dataKey="فروش" stroke="#327bff" fill="url(#sale)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="هزینه" stroke="#f59e0b" fill="url(#exp)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-4 font-bold">ترکیب دارایی‌ها و بدهی‌ها</h3>
          {pieData.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: 'none', fontFamily: 'Vazirmatn', fontSize: 13 }}
                    formatter={(v: number) => formatMoney(v, unit)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{formatMoney(d.value, unit, false)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted">داده‌ای برای نمایش نیست</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">آخرین فاکتورها</h3>
            <Link to="/invoices" className="text-xs text-brand-500 hover:underline">
              مشاهده همه
            </Link>
          </div>
          {recentInvoices.length ? (
            <div className="space-y-2">
              {recentInvoices.map((inv) => {
                const c = calcInvoice(inv)
                const party = store.parties.find((p) => p.id === inv.partyId)
                return (
                  <Link
                    key={inv.id}
                    to={`/invoices/${inv.id}`}
                    className="flex items-center justify-between rounded-2xl bg-black/[0.03] p-3 transition hover:bg-black/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{inv.number}</div>
                        <div className="text-xs text-muted">{party?.name ?? 'مهمان'}</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold">{formatMoney(c.payable, unit, false)}</div>
                      <div className="text-xs text-muted">{toJalali(inv.date)}</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">هنوز فاکتوری ثبت نشده است</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">هشدار موجودی کم</h3>
            <Link to="/inventory-report" className="text-xs text-brand-500 hover:underline">
              گزارش انبار
            </Link>
          </div>
          {lowStock.length ? (
            <div className="space-y-2">
              {lowStock.map(({ p, stock }) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                      <PackageSearch size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted">کد: {p.sku}</div>
                    </div>
                  </div>
                  <Badge color={stock <= 0 ? 'red' : 'amber'}>
                    موجودی: {toFaDigits(stock)} {p.unit}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Boxes size={32} className="text-emerald-500" />
              <p className="text-sm text-muted">موجودی همه کالاها در وضعیت مطلوب است</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickStat icon={<FileText size={18} />} label="فاکتورها" value={stats.invoiceCount} />
        <QuickStat icon={<Boxes size={18} />} label="اقلام کالا" value={stats.productCount} />
        <QuickStat icon={<Users size={18} />} label="طرف حساب‌ها" value={stats.partyCount} />
        <QuickStat icon={<AlertTriangle size={18} />} label="کالای رو به اتمام" value={stats.lowStockCount} />
      </div>
    </div>
  )
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="flex items-center gap-3 !p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
        {icon}
      </div>
      <div>
        <div className="text-lg font-extrabold">{toFaDigits(value)}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </Card>
  )
}
