import { useState } from 'react'
import { Warehouse as WhIcon, Plus, Pencil, Trash2, MapPin, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getProductStock } from '@/store/selectors'
import { useConfirm } from '@/components/Confirm'
import { PageHeader, Card, Button, Modal, Input, EmptyState, Toggle, Badge } from '@/components/ui'
import { toFaDigits } from '@/utils/format'
import type { Warehouse } from '@/types'

const empty = (): Omit<Warehouse, 'id'> => ({ name: '', code: '', active: true })

export default function Warehouses() {
  const store = useStore()
  const { warehouses, products, stockMoves, addWarehouse, updateWarehouse, removeWarehouse, toast } = store
  const ask = useConfirm((s) => s.ask)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty())

  const set = (p: Partial<Warehouse>) => setForm((f) => ({ ...f, ...p }))

  const itemsInWarehouse = (whId: string) =>
    products.filter((p) => p.type === 'product' && getProductStock(p.id, stockMoves, products, whId) !== 0).length

  const openNew = () => {
    setForm({ ...empty(), code: `WH-${String(warehouses.length + 1).padStart(2, '0')}` })
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (w: Warehouse) => {
    setForm({ ...w })
    setEditId(w.id)
    setOpen(true)
  }
  const save = () => {
    if (!form.name.trim()) return toast('نام انبار الزامی است', 'error')
    if (editId) {
      updateWarehouse(editId, form)
      toast('انبار ویرایش شد')
    } else {
      addWarehouse(form)
      toast('انبار جدید ثبت شد')
    }
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="انبارها"
        subtitle="مدیریت چند انبار و موقعیت‌های نگهداری کالا"
        icon={<WhIcon size={24} />}
        actions={
          <Button onClick={openNew}>
            <Plus size={18} /> انبار جدید
          </Button>
        }
      />

      {warehouses.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <Card key={w.id} className="group">
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-soft">
                  <WhIcon size={22} />
                </div>
                <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(w)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-brand-500 hover:bg-brand-500/10"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={async () => {
                      if (await ask({ message: `انبار «${w.name}» حذف شود؟`, danger: true, confirmText: 'حذف' }))
                        removeWarehouse(w.id)
                    }}
                    className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{w.name}</h3>
                  {!w.active && <Badge color="red">غیرفعال</Badge>}
                </div>
                <p className="text-xs text-muted" dir="ltr">{w.code}</p>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted">
                {w.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} /> {w.location}
                  </div>
                )}
                {w.manager && (
                  <div className="flex items-center gap-1.5">
                    <User size={14} /> {w.manager}
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-2xl bg-black/[0.03] p-3 text-center dark:bg-white/[0.03]">
                <span className="text-lg font-extrabold">{toFaDigits(itemsInWarehouse(w.id))}</span>
                <span className="mr-1 text-xs text-muted">قلم کالای موجود</span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<WhIcon size={28} />}
            title="انباری ثبت نشده است"
            action={
              <Button onClick={openNew}>
                <Plus size={18} /> افزودن انبار
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش انبار' : 'انبار جدید'}
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
          <Input label="نام انبار *" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          <Input label="کد انبار" value={form.code} onChange={(e) => set({ code: e.target.value })} dir="ltr" />
          <Input label="موقعیت / آدرس" value={form.location ?? ''} onChange={(e) => set({ location: e.target.value })} />
          <Input label="مسئول انبار" value={form.manager ?? ''} onChange={(e) => set({ manager: e.target.value })} />
          <div className="flex items-end">
            <Toggle checked={form.active} onChange={(v) => set({ active: v })} label="فعال" />
          </div>
        </div>
      </Modal>
    </div>
  )
}
