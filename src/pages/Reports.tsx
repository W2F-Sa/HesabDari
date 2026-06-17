import { useMemo, useState } from 'react'
import {
  PieChart as PieIcon,
  TrendingUp,
  Download,
  Users,
  Package,
  Scale,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { PageHeader, Card, StatCard, Table, Th, Td, Select, Button, Badge } from '@/components/ui'
import { calcInvoice, calcItem } from '@/utils/invoice'
import { formatMoney, toFaDigits } from '@/utils/format'
import { exportCSV, groupBy } from '@/utils/helpers'

const COLORS = ['#327bff', '#2dd4a7', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444']

export default function Reports() {
  const store = useStore()
  const unit = store.settings.defaultCurrency
  const [period, setPeriod] = useState<'all' | 'year' | 'month'>('all')

  const inRange = (date: string) => {
    if (period === 'all') return true
    const d = new Date(date).getTime()
    const now = Date.now()
    if (period === 'month') return now - d <= 30 * 86400000
    return now - d <= 365 * 86400000
  }

  const sales = store.invoices.filter((i) => i.type === 'sale' && i.status !== 'canceled' && inRange(i.date))
  const purchases = store.invoices.filter((i) => i.type === 'purchase' && i.status !== 'canceled' && inRange(i.date))

  const totalSales = sales.reduce((s, i) => s + calcInvoice(i).payable, 0)
  const totalPurchases = purchases.reduce((s, i) => s + calcInvoice(i).payable, 0)
  const totalIncome = store.transactions.filter((t) => t.type === 'income' && inRange(t.date)).reduce((s, t) => s + t.amount, 0)
  const totalExpense = store.transactions.filter((t) => t.type === 'expense' && inRange(t.date)).reduce((s, t) => s + t.amount, 0)
  const grossProfit = totalSales - totalPurchases
  const netProfit = totalSales + totalIncome - totalPurchases - totalExpense

  // فروش بر اساس کالا
  const productSales = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {}
    for (const inv of sales) {
      for (const item of inv.items) {
        const key = item.productId ?? item.description
        const name = item.description
        if (!map[key]) map[key] = { name, qty: 0, total: 0 }
        map[key].qty += item.quantity
        map[key].total += calcItem(item).total
      }
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8)
  }, [sales])

  // فروش بر اساس طرف حساب
  const partySales = useMemo(() => {
    const grouped = groupBy(sales, (i) => i.partyId ?? 'guest')
    return Object.entries(grouped)
      .map(([pid, invs]) => ({
        name: store.parties.find((p) => p.id === pid)?.name ?? 'مهمان',
        total: invs.reduce((s, i) => s + calcInvoice(i).payable, 0),
        count: invs.length,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [sales, store.parties])

  // هزینه بر اساس دسته
  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of store.transactions) {
      if (t.type !== 'expense' || !inRange(t.date)) continue
      const cat = store.expenseCategories.find((c) => c.id === t.categoryId)?.name ?? 'سایر'
      map[cat] = (map[cat] ?? 0) + t.amount
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [store.transactions, store.expenseCategories, period])

  const div = unit === 'IRT' ? 10 : 1

  return (
    <div className="space-y-5">
      <PageHeader
        title="گزارش‌ها و تحلیل"
        subtitle="صورت سود و زیان، فروش و هزینه‌ها"
        icon={<PieIcon size={24} />}
        actions={
          <Select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="w-44">
            <option value="all">کل دوره</option>
            <option value="year">یک سال اخیر</option>
            <option value="month">یک ماه اخیر</option>
          </Select>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="فروش" value={formatMoney(totalSales, unit, false)} icon={<TrendingUp size={22} />} gradient="from-emerald-400 to-emerald-600" />
        <StatCard title="خرید" value={formatMoney(totalPurchases, unit, false)} icon={<Package size={22} />} gradient="from-amber-400 to-orange-600" />
        <StatCard title="سود ناخالص" value={formatMoney(grossProfit, unit, false)} icon={<Scale size={22} />} gradient="from-brand-400 to-brand-700" />
        <StatCard title="سود خالص" value={formatMoney(netProfit, unit, false)} icon={<TrendingUp size={22} />} gradient="from-violet-400 to-violet-600" />
      </div>

      {/* صورت سود و زیان */}
      <Card>
        <h3 className="mb-4 font-bold">صورت سود و زیان</h3>
        <div className="space-y-2">
          <PnlRow label="درآمد فروش کالا و خدمات" value={totalSales} unit={unit} />
          <PnlRow label="سایر درآمدها" value={totalIncome} unit={unit} />
          <PnlRow label="بهای تمام‌شده / خرید" value={-totalPurchases} unit={unit} />
          <PnlRow label="هزینه‌های عملیاتی" value={-totalExpense} unit={unit} />
          <div className="flex items-center justify-between rounded-2xl bg-brand-500/10 px-4 py-3 text-base font-extrabold">
            <span>سود (زیان) خالص</span>
            <span className={netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
              {formatMoney(netProfit, unit)}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-bold">پرفروش‌ترین کالاها</h3>
          {productSales.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={productSales.map((p) => ({ ...p, total: p.total / div }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,130,150,0.15)" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => new Intl.NumberFormat('en').format(v)} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fontFamily: 'Vazirmatn' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: 'none', fontFamily: 'Vazirmatn', fontSize: 13 }}
                  formatter={(v: number) => new Intl.NumberFormat('fa').format(v)}
                />
                <Bar dataKey="total" fill="#327bff" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-muted">داده‌ای موجود نیست</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 font-bold">هزینه‌ها بر اساس دسته</h3>
          {expenseByCat.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseByCat} dataKey="value" nameKey="name" outerRadius={100} label>
                  {expenseByCat.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v: number) => formatMoney(v, unit)} contentStyle={{ borderRadius: 16, border: 'none', fontFamily: 'Vazirmatn' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-muted">هزینه‌ای ثبت نشده است</p>
          )}
        </Card>
      </div>

      <Card className="!p-0">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="flex items-center gap-2 font-bold">
            <Users size={18} /> فروش بر اساس مشتری
          </h3>
          <Button
            variant="ghost"
            className="!py-1.5 !text-xs"
            onClick={() => exportCSV(partySales.map((p) => ({ مشتری: p.name, تعداد_فاکتور: p.count, مبلغ: p.total })), 'sales-by-customer.csv')}
          >
            <Download size={15} /> خروجی
          </Button>
        </div>
        <Table>
          <thead>
            <tr className="border-b border-white/10">
              <Th>مشتری</Th>
              <Th>تعداد فاکتور</Th>
              <Th>مجموع خرید</Th>
            </tr>
          </thead>
          <tbody>
            {partySales.map((p, i) => (
              <tr key={i} className="table-row border-b border-white/5">
                <Td className="font-semibold">{p.name}</Td>
                <Td>{toFaDigits(p.count)}</Td>
                <Td className="font-semibold">{formatMoney(p.total, unit, false)}</Td>
              </tr>
            ))}
            {!partySales.length && (
              <tr>
                <Td className="py-8 text-center text-muted">داده‌ای موجود نیست</Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}

function PnlRow({ label, value, unit }: { label: string; value: number; unit: any }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-1 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className={value < 0 ? 'font-semibold text-rose-500' : 'font-semibold'}>
        {value < 0 ? `(${formatMoney(Math.abs(value), unit, false)})` : formatMoney(value, unit, false)}
      </span>
    </div>
  )
}
