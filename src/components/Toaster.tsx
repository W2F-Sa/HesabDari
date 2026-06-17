import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react'
import { useStore } from '@/store/useStore'
import clsx from 'clsx'

const config = {
  success: { icon: CheckCircle2, cls: 'text-emerald-500' },
  error: { icon: XCircle, cls: 'text-rose-500' },
  warning: { icon: AlertTriangle, cls: 'text-amber-500' },
  info: { icon: Info, cls: 'text-blue-500' },
}

export default function Toaster() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  return (
    <div className="fixed left-1/2 top-4 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
      {toasts.map((t) => {
        const C = config[t.type].icon
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className="toast-enter glass-card flex cursor-pointer items-center gap-3 px-4 py-3 shadow-glass-lg"
          >
            <C size={20} className={clsx('shrink-0', config[t.type].cls)} />
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
