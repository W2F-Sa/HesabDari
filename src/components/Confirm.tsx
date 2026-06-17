import { create } from 'zustand'
import { AlertTriangle } from 'lucide-react'
import { Modal, Button } from './ui'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmText: string
  danger: boolean
  resolve?: (v: boolean) => void
  ask: (opts: {
    title?: string
    message: string
    confirmText?: string
    danger?: boolean
  }) => Promise<boolean>
  close: (v: boolean) => void
}

export const useConfirm = create<ConfirmState>((set, get) => ({
  open: false,
  title: 'تایید عملیات',
  message: '',
  confirmText: 'تایید',
  danger: false,
  ask: ({ title = 'تایید عملیات', message, confirmText = 'تایید', danger = false }) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, title, message, confirmText, danger, resolve })
    }),
  close: (v) => {
    get().resolve?.(v)
    set({ open: false, resolve: undefined })
  },
}))

export function ConfirmHost() {
  const { open, title, message, confirmText, danger, close } = useConfirm()
  return (
    <Modal
      open={open}
      onClose={() => close(false)}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            انصراف
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-500">
          <AlertTriangle size={22} />
        </div>
        <p className="pt-1 text-sm leading-7">{message}</p>
      </div>
    </Modal>
  )
}
