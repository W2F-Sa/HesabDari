import { useStore } from '@/store/useStore'

/** نمایش لوگوی شرکت یا لوگوی پیش‌فرض GIoT */
export function CompanyLogo({ size = 48 }: { size?: number }) {
  const logo = useStore((s) => s.company.logo)
  if (logo) {
    return (
      <img
        src={logo}
        alt="logo"
        style={{ width: size, height: size }}
        className="rounded-2xl object-contain"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 font-black text-white shadow-soft"
    >
      <span style={{ fontSize: size * 0.32 }}>GIoT</span>
    </div>
  )
}
