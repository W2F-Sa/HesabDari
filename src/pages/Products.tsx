import { useMemo, useState } from 'react'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Tags,
  Download,
  Barcode,
  AlertTriangle,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getProductStock } from '@/store/selectors'
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
import { formatMoney, toFaDigits, percent } from '@/utils/format'
import { exportCSV } from '@/utils/helpers'
import type { Product, ProductType } from '@/types'

const emptyProduct = (taxRate: number): Omit<Product, 'id' | 'createdAt'> => ({
  sku: '',
  name: '',
  type: 'product',
  unit: 'عدد',
  purchasePrice: 0,
  salePrice: 0,
  taxRate,
  reorderLevel: 0,
  initialStock: 0,
  active: true,
})

export default function Products() {
  const store = useStore()
  const { products, categories, addProduct, updateProduct, removeProduct, toast } = store
  const ask = useConfirm((s) => s.ask)
  const unit = store.settings.defaultCurrency
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyProduct(store.settings.defaultTaxRate))

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (catFilter !== 'all' && p.categoryId !== catFilter) return false
      if (search && !`${p.name} ${p.sku} ${p.barcode ?? ''} ${p.nameEn ?? ''}`.toLowerCase().includes(search.toLowerCase()))
        return false
      return true
    })
  }, [products, search, catFilter])

  const set = (patch: Partial<Product>) => setForm((f) => ({ ...f, ...patch }))

  const openNew = () => {
    setForm({ ...emptyProduct(store.settings.defaultTaxRate), sku: `SKU-${1000 + products.length + 1}` })
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (p: Product) => {
    setForm({ ...p })
    setEditId(p.id)
    setOpen(true)
  }
  const save = () => {
    if (!form.name.trim()) return toast('نام کالا الزامی است', 'error')
    if (editId) {
      updateProduct(editId, form)
      toast('کالا ویرایش شد')
    } else {
      addProduct(form)
      toast('کالا ثبت شد')
    }
    setOpen(false)
  }
  const del = async (p: Product) => {
    if (await ask({ message: `کالای «${p.name}» حذف شود؟`, danger: true, confirmText: 'حذف' })) {
      removeProduct(p.id)
      toast('حذف شد', 'info')
    }
  }

  const margin = form.salePrice > 0 ? ((form.salePrice - form.purchasePrice) / form.salePrice) * 100 : 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="کالا و خدمات"
        subtitle="مدیریت اقلام انبار، قیمت‌گذاری و دسته‌بندی"
        icon={<Package size={24} />}
        actions={
          <>
            <Button variant="ghost" onClick={() => setCatOpen(true)}>
              <Tags size={18} /> دسته‌بندی‌ها
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                exportCSV(
                  products.map((p) => ({
                    کد: p.sku,
                    نام: p.name,
                    واحد: p.unit,
                    قیمت_خرید: p.purchasePrice,
                    قیمت_فروش: p.salePrice,
                    موجودی: getProductStock(p.id, store.stockMoves, products),
                  })),
                  'products.csv',
                )
              }
            >
              <Download size={18} /> خروجی
            </Button>
            <Button onClick={openNew}>
              <Plus size={18} /> کالای جدید
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
              placeholder="جستجو بر اساس نام، کد یا بارکد…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="sm:w-52">
            <option value="all">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
                <Th>کالا</Th>
                <Th>دسته</Th>
                <Th>قیمت خرید</Th>
                <Th>قیمت فروش</Th>
                <Th>مالیات</Th>
                <Th>موجودی</Th>
                <Th className="text-left">عملیات</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stock = getProductStock(p.id, store.stockMoves, products)
                const low = p.type === 'product' && stock <= p.reorderLevel
                const cat = categories.find((c) => c.id === p.categoryId)
                return (
                  <tr key={p.id} className="table-row border-b border-white/5">
                    <Td>
                      <div className="flex items-center gap-2 font-semibold">
                        {p.name}
                        {p.type === 'service' && <Badge color="violet">خدمت</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span>{p.sku}</span>
                        {p.barcode && (
                          <span className="flex items-center gap-1" dir="ltr">
                            <Barcode size={12} /> {p.barcode}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      {cat ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat.color }} />
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </Td>
                    <Td className="text-sm">{formatMoney(p.purchasePrice, unit, false)}</Td>
                    <Td className="text-sm font-semibold">{formatMoney(p.salePrice, unit, false)}</Td>
                    <Td>{percent(p.taxRate)}</Td>
                    <Td>
                      {p.type === 'service' ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span className={low ? 'flex items-center gap-1 font-bold text-amber-500' : 'font-semibold'}>
                          {low && <AlertTriangle size={14} />}
                          {toFaDigits(stock)} {p.unit}
                        </span>
                      )}
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
            icon={<Package size={28} />}
            title="کالایی یافت نشد"
            description="اولین کالا یا خدمت خود را اضافه کنید."
            action={
              <Button onClick={openNew}>
                <Plus size={18} /> افزودن کالا
              </Button>
            }
          />
        )}
      </Card>

      {/* مودال کالا */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش کالا' : 'کالای جدید'}
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
          <Input label="نام کالا *" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <Input label="نام لاتین" value={form.nameEn ?? ''} onChange={(e) => set({ nameEn: e.target.value })} dir="ltr" />
          <Input label="کد کالا (SKU)" value={form.sku} onChange={(e) => set({ sku: e.target.value })} dir="ltr" />
          <Input label="بارکد" value={form.barcode ?? ''} onChange={(e) => set({ barcode: e.target.value })} dir="ltr" />
          <Select label="نوع" value={form.type} onChange={(e) => set({ type: e.target.value as ProductType })}>
            <option value="product">کالا</option>
            <option value="service">خدمت</option>
          </Select>
          <Select
            label="دسته‌بندی"
            value={form.categoryId ?? ''}
            onChange={(e) => set({ categoryId: e.target.value || null })}
          >
            <option value="">بدون دسته</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input label="واحد شمارش" value={form.unit} onChange={(e) => set({ unit: e.target.value })} />
          <NumberInput label="درصد مالیات" value={form.taxRate} onChange={(v) => set({ taxRate: v })} suffix="٪" />
          <NumberInput label="قیمت خرید" value={form.purchasePrice} onChange={(v) => set({ purchasePrice: v })} suffix="ریال" />
          <NumberInput label="قیمت فروش" value={form.salePrice} onChange={(v) => set({ salePrice: v })} suffix="ریال" />
          {form.type === 'product' && (
            <>
              <NumberInput label="موجودی اولیه" value={form.initialStock} onChange={(v) => set({ initialStock: v })} />
              <NumberInput label="حد سفارش مجدد" value={form.reorderLevel} onChange={(v) => set({ reorderLevel: v })} />
            </>
          )}
          <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl bg-brand-500/5 p-3 text-sm">
            <span className="text-muted">حاشیه سود فروش:</span>
            <span className={margin >= 0 ? 'font-bold text-emerald-500' : 'font-bold text-rose-500'}>
              {percent(Math.round(margin * 10) / 10)}
            </span>
          </div>
          <div className="sm:col-span-2">
            <Textarea label="توضیحات" value={form.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
          </div>
        </div>
      </Modal>

      <CategoriesModal open={catOpen} onClose={() => setCatOpen(false)} />
    </div>
  )
}

function CategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { categories, addCategory, removeCategory, toast } = useStore()
  const ask = useConfirm((s) => s.ask)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#327bff')

  const add = () => {
    if (!name.trim()) return
    addCategory({ name: name.trim(), color })
    setName('')
    toast('دسته اضافه شد')
  }

  return (
    <Modal open={open} onClose={onClose} title="مدیریت دسته‌بندی‌ها" size="sm">
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <Input label="نام دسته" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-11 w-12 cursor-pointer rounded-xl border-0"
          />
          <Button onClick={add}>
            <Plus size={18} />
          </Button>
        </div>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/[0.03]">
              <span className="flex items-center gap-2 text-sm">
                <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                {c.name}
              </span>
              <button
                onClick={async () => {
                  if (await ask({ message: `دسته «${c.name}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                    removeCategory(c.id)
                }}
                className="text-rose-500 hover:opacity-70"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
