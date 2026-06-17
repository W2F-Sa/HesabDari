// ===================== انواع داده‌های اصلی سیستم =====================

export type CurrencyUnit = 'IRR' | 'IRT' | 'USDT' | 'USD' | 'EUR'

export type ID = string

export interface Company {
  name: string
  nameEn: string
  brand: string
  economicCode: string
  nationalId: string
  registrationNumber: string
  phone: string
  mobile: string
  email: string
  website: string
  address: string
  postalCode: string
  logo: string // dataURL
  stamp: string // dataURL مهر و امضا
  iban: string
  cardNumber: string
  bankName: string
  slogan: string
}

// ===================== طرف حساب‌ها (مشتری/تامین‌کننده) =====================
export type PartyType = 'customer' | 'supplier' | 'both' | 'employee'

export interface Party {
  id: ID
  type: PartyType
  name: string
  company?: string
  isLegal: boolean // حقوقی یا حقیقی
  nationalId?: string // کد ملی / شناسه ملی
  economicCode?: string
  phone?: string
  mobile?: string
  email?: string
  address?: string
  postalCode?: string
  city?: string
  province?: string
  creditLimit?: number
  openingBalance: number // مانده اولیه (مثبت=بدهکار)
  tags?: string[]
  note?: string
  createdAt: string
  active: boolean
}

// ===================== انبارداری =====================
export interface Category {
  id: ID
  name: string
  parentId?: ID | null
  color?: string
}

export interface Warehouse {
  id: ID
  name: string
  code: string
  location?: string
  manager?: string
  active: boolean
}

export type ProductType = 'product' | 'service'

export interface Product {
  id: ID
  sku: string
  barcode?: string
  name: string
  nameEn?: string
  type: ProductType
  categoryId?: ID | null
  unit: string // واحد شمارش
  purchasePrice: number // قیمت خرید (ریال)
  salePrice: number // قیمت فروش (ریال)
  taxRate: number // درصد مالیات بر ارزش افزوده
  reorderLevel: number // حد سفارش مجدد
  maxLevel?: number
  initialStock: number
  description?: string
  image?: string
  tags?: string[]
  trackBatch?: boolean
  expiryTracking?: boolean
  active: boolean
  createdAt: string
}

export type StockMoveType =
  | 'in' // ورود (خرید)
  | 'out' // خروج (فروش)
  | 'adjust' // اصلاح موجودی
  | 'transfer' // انتقال بین انبار
  | 'return-in' // برگشت از فروش
  | 'return-out' // برگشت خرید
  | 'waste' // ضایعات

export interface StockMove {
  id: ID
  date: string
  type: StockMoveType
  productId: ID
  warehouseId: ID
  toWarehouseId?: ID // برای انتقال
  quantity: number
  unitPrice: number
  partyId?: ID
  refType?: 'invoice' | 'purchase' | 'manual'
  refId?: ID
  batchNumber?: string
  expiryDate?: string
  note?: string
  createdAt: string
}

// ===================== فاکتور =====================
export type InvoiceType = 'sale' | 'purchase' | 'proforma' | 'return'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'canceled'

export interface InvoiceItem {
  id: ID
  productId?: ID
  description: string
  quantity: number
  unit: string
  unitPrice: number // ریال
  discountPercent: number
  discountAmount: number
  taxRate: number // درصد
}

export interface Invoice {
  id: ID
  number: string
  type: InvoiceType
  status: InvoiceStatus
  partyId?: ID
  warehouseId?: ID
  date: string // ISO
  dueDate?: string
  items: InvoiceItem[]
  globalDiscountPercent: number
  globalDiscountAmount: number
  shippingCost: number
  roundAmount: number
  currency: CurrencyUnit
  usdtRate?: number // نرخ تتر در زمان صدور
  note?: string
  terms?: string
  template: string // شناسه قالب
  isOfficial: boolean // فاکتور رسمی
  taxId?: string // شماره مالیاتی (سامانه مودیان)
  paidAmount: number
  payments: Payment[]
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: ID
  date: string
  amount: number
  method: 'cash' | 'card' | 'transfer' | 'cheque' | 'usdt' | 'other'
  reference?: string
  note?: string
}

// ===================== حسابداری =====================
export type AccountKind = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export interface Account {
  id: ID
  code: string
  name: string
  kind: AccountKind
  parentId?: ID | null
  isGroup: boolean
  openingBalance: number
  active: boolean
}

export interface JournalLine {
  id: ID
  accountId: ID
  description?: string
  debit: number
  credit: number
}

export interface JournalEntry {
  id: ID
  number: string
  date: string
  description: string
  lines: JournalLine[]
  reference?: string
  refType?: 'invoice' | 'payment' | 'manual' | 'opening'
  refId?: ID
  createdAt: string
}

// تراکنش‌های ساده درآمد/هزینه (دریافت/پرداخت)
export type TransactionType = 'income' | 'expense' | 'receive' | 'pay' | 'transfer'

export interface Transaction {
  id: ID
  date: string
  type: TransactionType
  amount: number
  accountId?: ID // حساب بانکی/صندوق
  categoryId?: ID
  partyId?: ID
  method: 'cash' | 'card' | 'transfer' | 'cheque' | 'usdt' | 'other'
  description: string
  reference?: string
  attachment?: string
  createdAt: string
}

export interface ExpenseCategory {
  id: ID
  name: string
  type: 'income' | 'expense'
  color?: string
}

// حساب بانکی / صندوق
export interface CashAccount {
  id: ID
  name: string
  type: 'cash' | 'bank'
  bankName?: string
  accountNumber?: string
  iban?: string
  cardNumber?: string
  openingBalance: number
  currency: CurrencyUnit
  active: boolean
}

// چک‌ها
export type ChequeStatus = 'in-hand' | 'deposited' | 'cleared' | 'bounced' | 'spent'
export type ChequeKind = 'received' | 'issued'

export interface Cheque {
  id: ID
  kind: ChequeKind
  number: string
  bankName: string
  amount: number
  dueDate: string
  partyId?: ID
  status: ChequeStatus
  cashAccountId?: ID
  note?: string
  createdAt: string
}

// ===================== تنظیمات و کاربر =====================
export interface AuthUser {
  username: string
  passwordHash: string
  displayName: string
  role: 'admin' | 'accountant' | 'viewer'
  lastLogin?: string
}

export type ThemeMode = 'light' | 'dark'

export interface Settings {
  theme: ThemeMode
  defaultCurrency: CurrencyUnit
  defaultTaxRate: number
  invoicePrefix: string
  invoiceCounter: number
  proformaPrefix: string
  proformaCounter: number
  decimalDigits: number
  showUsdtRate: boolean
  autoBackup: boolean
  defaultTemplate: string
  fiscalYear: number
}

export interface UsdtRate {
  buy: number
  sell: number
  updatedAt: string
  source: string
}

export interface ActivityLog {
  id: ID
  date: string
  action: string
  module: string
  detail?: string
}
