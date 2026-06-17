import React from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

// ---------------- Card ----------------
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('glass-card p-5', className)} {...props}>
      {children}
    </div>
  )
}

// ---------------- Page header ----------------
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-soft">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ---------------- Button ----------------
type BtnVariant = 'primary' | 'ghost' | 'danger' | 'success'
export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const cls = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
  }[variant]
  return (
    <button className={clsx(cls, className)} {...props}>
      {children}
    </button>
  )
}

// ---------------- Inputs ----------------
export function Input({
  label,
  className,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium">{label}</span>}
      <input className={clsx('glass-input', className)} {...props} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Textarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium">{label}</span>}
      <textarea className={clsx('glass-input min-h-[90px] resize-y', className)} {...props} />
    </label>
  )
}

export function Select({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium">{label}</span>}
      <select className={clsx('glass-input cursor-pointer', className)} {...props}>
        {children}
      </select>
    </label>
  )
}

// ---------------- Badge / chip ----------------
const badgeColors: Record<string, string> = {
  green: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  red: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  gray: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  violet: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
}
export function Badge({
  color = 'gray',
  children,
  className,
}: {
  color?: keyof typeof badgeColors
  children: React.ReactNode
  className?: string
}) {
  return <span className={clsx('chip', badgeColors[color], className)}>{children}</span>
}

// ---------------- Modal ----------------
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}) {
  if (!open) return null
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={onClose}
    >
      <div
        className={clsx(
          'glass-card my-auto w-full animate-scale-in p-0',
          widths[size],
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-white/10 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- Empty state ----------------
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && (
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-black/5 text-muted dark:bg-white/5">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}

// ---------------- Stat card ----------------
export function StatCard({
  title,
  value,
  icon,
  gradient = 'from-brand-400 to-brand-700',
  hint,
}: {
  title: string
  value: React.ReactNode
  icon: React.ReactNode
  gradient?: string
  hint?: React.ReactNode
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted">{title}</p>
          <p className="mt-2 truncate text-2xl font-extrabold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <div
          className={clsx(
            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft',
            gradient,
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}

// ---------------- Table wrapper ----------------
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  )
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={clsx('whitespace-nowrap px-3 py-3 text-right text-xs font-semibold text-muted', className)}>
      {children}
    </th>
  )
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={clsx('px-3 py-3 align-middle', className)}>{children}</td>
}

// ---------------- Toggle ----------------
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'right-0.5' : 'right-[22px]',
          )}
        />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  )
}
