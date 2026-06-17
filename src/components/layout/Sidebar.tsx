import { NavLink } from 'react-router-dom'
import { navItems } from './nav'
import { useStore } from '@/store/useStore'
import { X } from 'lucide-react'
import clsx from 'clsx'
import { CompanyLogo } from '../CompanyLogo'

const groups = Array.from(new Set(navItems.map((n) => n.group)))

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const company = useStore((s) => s.company)

  return (
    <>
      {/* overlay موبایل */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 right-0 z-40 flex w-72 flex-col gap-2 p-4 transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="glass-card flex h-full flex-col p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CompanyLogo size={44} />
              <div className="leading-tight">
                <div className="font-extrabold">{company.brand || 'GIoT'}</div>
                <div className="text-xs text-muted">{company.name}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto pl-1">
            {groups.map((group) => (
              <div key={group}>
                <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                  {group}
                </div>
                <div className="space-y-1">
                  {navItems
                    .filter((n) => n.group === group)
                    .map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onClose}
                        className={({ isActive }) => clsx('nav-item', isActive && 'active')}
                      >
                        <item.icon size={19} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-3 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-700/10 p-3 text-center text-xs text-muted">
            نسخه ۱.۰ • سال مالی ۱۴۰۵
          </div>
        </div>
      </aside>
    </>
  )
}
