import {
  LayoutDashboard,
  FileText,
  Package,
  Warehouse,
  ArrowLeftRight,
  Users,
  BookOpenCheck,
  Wallet,
  ScrollText,
  BadgeDollarSign,
  PieChart,
  Settings,
  Landmark,
  ReceiptText,
  Boxes,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  group: string
}

export const navItems: NavItem[] = [
  { to: '/', label: 'داشبورد', icon: LayoutDashboard, group: 'اصلی' },
  { to: '/invoices', label: 'فاکتورها', icon: FileText, group: 'فروش' },
  { to: '/parties', label: 'طرف حساب‌ها', icon: Users, group: 'فروش' },
  { to: '/products', label: 'کالا و خدمات', icon: Package, group: 'انبارداری' },
  { to: '/stock', label: 'حرکات انبار', icon: ArrowLeftRight, group: 'انبارداری' },
  { to: '/warehouses', label: 'انبارها', icon: Warehouse, group: 'انبارداری' },
  { to: '/inventory-report', label: 'گزارش موجودی', icon: Boxes, group: 'انبارداری' },
  { to: '/transactions', label: 'دریافت و پرداخت', icon: Wallet, group: 'حسابداری' },
  { to: '/cash', label: 'صندوق و بانک', icon: Landmark, group: 'حسابداری' },
  { to: '/accounts', label: 'دفتر حساب‌ها', icon: BookOpenCheck, group: 'حسابداری' },
  { to: '/journal', label: 'اسناد حسابداری', icon: ScrollText, group: 'حسابداری' },
  { to: '/cheques', label: 'مدیریت چک‌ها', icon: ReceiptText, group: 'حسابداری' },
  { to: '/reports', label: 'گزارش‌ها', icon: PieChart, group: 'گزارش' },
  { to: '/usdt', label: 'نرخ تتر و ارز', icon: BadgeDollarSign, group: 'گزارش' },
  { to: '/settings', label: 'تنظیمات', icon: Settings, group: 'سیستم' },
]
