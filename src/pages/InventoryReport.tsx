import { useMemo, useState } from 'react'
import { Boxes, Download, AlertTriangle, TrendingUp, Package, Warehouse } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getProductStock, getInventoryValue } from '@/store/selectors'
import { PageHeader, Card, Select, Table, Th, Td, Badge, StatCard, EmptyState, Button } from '@/components/ui'
import { formatMoney, toFaDigits } from '@/utils/format'
import { exportCSV } from '@/utils/helpers'

export default function InventoryReport() {
  const store = useStore()
  const { products, stockMoves, warehouses, categories } = store
  const unit = store.settings.defaultCurrency
  const [wh, setWh] = useState('all')
  const [status, setStatus] = useState<'all' | 'low' | 'out' | 'ok'>('all')

  const rows = useMemo(() => {
    return products
      .filter((p) => p.type === 'product')
      .map((p) => {
        const stock = wh === 'all'
          ? getProductStock(p.id, stockMoves, products)
          : getProductStock(p.id, stockMoves, products, wh)
        const value = stock * p.purchasePrice
        const saleValue = stock * p.salePrice
        let st: 'out' | 'low' | 'ok' = 'ok'
        if (stock <= 0) st = 'out'
        else if (stock <= p.reorderLevel) st = 'low'
        return { p, stock, value, saleValue, st }
      })
      .filter((r) => (status === 'all' ? true : r.st === status))
  }, [products, stockMoves, wh, status])

  const totalValue = getInventoryValue(products, stockMoves)
  const totalSaleValue = rows.reduce((s, r) => s + r.saleValue, 0)
  const lowCount = products.filter(
    (p) => p.type === 'product' && getProductStock(p.id, stockMoves, products) <= p.reorderLevel,
  ).length
  const outCount = products.filter(
    (p) => p.type === 'product' && getProductStock(p.id, stockMoves, products) <= 0,
  ).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="گزارش موجودی انبار"
        subtitle="ارزش‌گذاری موجودی و وضعیت اقلام"
        icon={<Boxes size={24} />}
        actions={
          <Button
            variant="ghost"
            onClick={() =>
              exportCSV(
                rows.map((r) => ({
                  کد: r.p.sku,
                  نام: r.p.name,
                  موجودی: r.stock,
                  ارزش_خرید: r.value,
                  ارزش_فروش: r.saleValue,
                })),
                'inventory-report.csv',
              )
            }
          >
            <Download size={18} /> خروجی
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="ارزش موجودی (خرید)"
          value={formatMoney(totalValue, unit, false)}
          icon={<Boxes size={22} />}
          gradient="from-teal-400 to-emerald-600"
        />
        <StatCard
          title="ارزش موجودی (فروش)"
          value={formatMoney(totalSaleValue, unit, false)}
          icon={<TrendingUp size={22} />}
          gradient="from-brand-400 to-brand-700"
        />
        <StatCard
          title="کالای رو به اتمام"
          value={toFaDigits(lowCount)}
          icon={<AlertTriangle size={22} />}
          gradient="from-amber-400 to-orange-600"
        />
        <StatCard
          title="کالای ناموجود"
          value={toFaDigits(outCount)}
          icon={<Package size={22} />}
          gradient="from-rose-400 to-rose-600"
        />
      </div>

      <Card className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select label="انبار" value={wh} onChange={(e) => setWh(e.target.value)} className="sm:w-56">
            <option value="all">همه انبارها</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
          <Select label="وضعیت" value={status} onChange={(e) => setStatus(e.target.value as any)} className="sm:w-56">
            <option value="all">همه</option>
            <option value="ok">موجودی مطلوب</option>
            <option value="low">رو به اتمام</option>
            <option value="out">ناموجود</option>
          </Select>
        </div>
      </Card>

      <Card className="!p-0">
        {rows.length ? (
          <Table>
            <thead>
              <tr className="border-b border-white/10">
                <Th>کالا</Th>
                <Th>دسته</Th>
                <Th>موجودی</Th>
                <Th>حد سفارش</Th>
                <Th>ارزش (خرید)</Th>
                <Th>ارزش (فروش)</Th>
                <Th>وضعیت</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cat = categories.find((c) => c.id === r.p.categoryId)
                return (
                  <tr key={r.p.id} className="table-row border-b border-white/5">
                    <Td>
                      <div className="font-semibold">{r.p.name}</div>
                      <div className="text-xs text-muted">{r.p.sku}</div>
                    </Td>
                    <Td className="text-sm">{cat?.name ?? '—'}</Td>
                    <Td className="font-bold">
                      {toFaDigits(r.stock)} {r.p.unit}
                    </Td>
                    <Td className="text-sm text-muted">{toFaDigits(r.p.reorderLevel)}</Td>
                    <Td className="text-sm">{formatMoney(r.value, unit, false)}</Td>
                    <Td className="text-sm font-semibold">{formatMoney(r.saleValue, unit, false)}</Td>
                    <Td>
                      {r.st === 'out' ? (
                        <Badge color="red">ناموجود</Badge>
                      ) : r.st === 'low' ? (
                        <Badge color="amber">رو به اتمام</Badge>
                      ) : (
                        <Badge color="green">مطلوب</Badge>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={<Warehouse size={28} />} title="موردی یافت نشد" />
        )}
      </Card>
    </div>
  )
}
