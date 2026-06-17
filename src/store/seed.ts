import type {
  Account,
  CashAccount,
  Category,
  Company,
  ExpenseCategory,
  Product,
  Settings,
  Warehouse,
} from '@/types'
import { uid } from '@/utils/helpers'

export const defaultCompany: Company = {
  name: 'ماهان الکترونیک پرنیا',
  nameEn: 'GIoT',
  brand: 'GIoT',
  economicCode: '۴۱۱۲۳۴۵۶۷۸۹۰',
  nationalId: '۱۴۰۱۲۳۴۵۶۷۸',
  registrationNumber: '۵۶۷۸۹',
  phone: '۰۲۱-۹۱۰۰۰۰۰۰',
  mobile: '۰۹۱۲۰۰۰۰۰۰۰',
  email: 'info@giot.ir',
  website: 'www.giot.ir',
  address: 'تهران، خیابان ولیعصر، برج فناوری، طبقه ۱۲',
  postalCode: '۱۹۶۶۶۵۴۳۲۱',
  logo: '',
  stamp: '',
  iban: 'IR۰۶۰۱۲۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰',
  cardNumber: '۶۰۳۷-۹۹۷۰-۰۰۰۰-۰۰۰۰',
  bankName: 'بانک ملی ایران',
  slogan: 'پیشرو در اینترنت اشیا و راهکارهای هوشمند',
}

export const defaultSettings: Settings = {
  theme: 'light',
  defaultCurrency: 'IRT',
  defaultTaxRate: 10,
  invoicePrefix: 'GIoT-',
  invoiceCounter: 1001,
  proformaPrefix: 'PF-',
  proformaCounter: 501,
  decimalDigits: 0,
  showUsdtRate: true,
  autoBackup: true,
  defaultTemplate: 'modern',
  fiscalYear: 1405,
}

// کدینگ استاندارد حساب‌ها
export function defaultAccounts(): Account[] {
  const mk = (
    code: string,
    name: string,
    kind: Account['kind'],
    isGroup = false,
    parentId: string | null = null,
  ): Account => ({
    id: uid('acc_'),
    code,
    name,
    kind,
    parentId,
    isGroup,
    openingBalance: 0,
    active: true,
  })
  const assets = mk('1', 'دارایی‌ها', 'asset', true)
  const liabilities = mk('2', 'بدهی‌ها', 'liability', true)
  const equity = mk('3', 'حقوق صاحبان سهام', 'equity', true)
  const income = mk('4', 'درآمدها', 'income', true)
  const expense = mk('5', 'هزینه‌ها', 'expense', true)
  return [
    assets,
    mk('1101', 'صندوق', 'asset', false, assets.id),
    mk('1102', 'بانک', 'asset', false, assets.id),
    mk('1103', 'حساب‌های دریافتنی', 'asset', false, assets.id),
    mk('1104', 'موجودی کالا', 'asset', false, assets.id),
    mk('1105', 'پیش‌پرداخت‌ها', 'asset', false, assets.id),
    liabilities,
    mk('2101', 'حساب‌های پرداختنی', 'liability', false, liabilities.id),
    mk('2102', 'مالیات بر ارزش افزوده', 'liability', false, liabilities.id),
    mk('2103', 'حقوق پرداختنی', 'liability', false, liabilities.id),
    equity,
    mk('3101', 'سرمایه', 'equity', false, equity.id),
    mk('3102', 'سود انباشته', 'equity', false, equity.id),
    income,
    mk('4101', 'فروش کالا', 'income', false, income.id),
    mk('4102', 'درآمد خدمات', 'income', false, income.id),
    mk('4103', 'سایر درآمدها', 'income', false, income.id),
    expense,
    mk('5101', 'بهای تمام‌شده کالای فروش‌رفته', 'expense', false, expense.id),
    mk('5102', 'حقوق و دستمزد', 'expense', false, expense.id),
    mk('5103', 'اجاره', 'expense', false, expense.id),
    mk('5104', 'آب و برق و گاز', 'expense', false, expense.id),
    mk('5105', 'تبلیغات و بازاریابی', 'expense', false, expense.id),
    mk('5106', 'هزینه حمل و نقل', 'expense', false, expense.id),
    mk('5107', 'سایر هزینه‌ها', 'expense', false, expense.id),
  ]
}

export function defaultWarehouses(): Warehouse[] {
  return [
    { id: uid('wh_'), name: 'انبار مرکزی', code: 'WH-01', location: 'تهران', active: true },
    { id: uid('wh_'), name: 'انبار فروشگاه', code: 'WH-02', location: 'تهران', active: true },
  ]
}

export function defaultCategories(): Category[] {
  return [
    { id: uid('cat_'), name: 'ماژول‌های IoT', color: '#327bff' },
    { id: uid('cat_'), name: 'سنسورها', color: '#2dd4a7' },
    { id: uid('cat_'), name: 'بردهای توسعه', color: '#f59e0b' },
    { id: uid('cat_'), name: 'تجهیزات شبکه', color: '#8b5cf6' },
    { id: uid('cat_'), name: 'خدمات', color: '#ec4899' },
  ]
}

export function defaultCashAccounts(): CashAccount[] {
  return [
    {
      id: uid('cash_'),
      name: 'صندوق نقدی',
      type: 'cash',
      openingBalance: 0,
      currency: 'IRR',
      active: true,
    },
    {
      id: uid('cash_'),
      name: 'بانک ملی',
      type: 'bank',
      bankName: 'بانک ملی ایران',
      iban: 'IR060120000000000000000000',
      openingBalance: 0,
      currency: 'IRR',
      active: true,
    },
  ]
}

export function defaultExpenseCategories(): ExpenseCategory[] {
  return [
    { id: uid('ec_'), name: 'فروش', type: 'income', color: '#2dd4a7' },
    { id: uid('ec_'), name: 'خدمات', type: 'income', color: '#327bff' },
    { id: uid('ec_'), name: 'حقوق و دستمزد', type: 'expense', color: '#f59e0b' },
    { id: uid('ec_'), name: 'اجاره', type: 'expense', color: '#8b5cf6' },
    { id: uid('ec_'), name: 'قبوض', type: 'expense', color: '#ef4444' },
    { id: uid('ec_'), name: 'تبلیغات', type: 'expense', color: '#ec4899' },
    { id: uid('ec_'), name: 'حمل و نقل', type: 'expense', color: '#06b6d4' },
  ]
}

export function defaultProducts(categories: Category[]): Product[] {
  const now = new Date().toISOString()
  const cat = (i: number) => categories[i]?.id
  return [
    {
      id: uid('prd_'), sku: 'GIOT-ESP32', name: 'ماژول ESP32 وای‌فای', type: 'product',
      categoryId: cat(0), unit: 'عدد', purchasePrice: 1800000, salePrice: 2500000,
      taxRate: 10, reorderLevel: 20, initialStock: 150, active: true, createdAt: now,
      barcode: '6260000000017', description: 'ماژول کنترلی با وای‌فای و بلوتوث',
    },
    {
      id: uid('prd_'), sku: 'GIOT-DHT22', name: 'سنسور دما و رطوبت DHT22', type: 'product',
      categoryId: cat(1), unit: 'عدد', purchasePrice: 350000, salePrice: 550000,
      taxRate: 10, reorderLevel: 50, initialStock: 300, active: true, createdAt: now,
      barcode: '6260000000024',
    },
    {
      id: uid('prd_'), sku: 'GIOT-RPI4', name: 'برد رزبری‌پای ۴ مدل B', type: 'product',
      categoryId: cat(2), unit: 'عدد', purchasePrice: 6500000, salePrice: 8900000,
      taxRate: 10, reorderLevel: 10, initialStock: 40, active: true, createdAt: now,
      barcode: '6260000000031',
    },
    {
      id: uid('prd_'), sku: 'GIOT-RTR', name: 'روتر صنعتی 4G', type: 'product',
      categoryId: cat(3), unit: 'دستگاه', purchasePrice: 12000000, salePrice: 16500000,
      taxRate: 10, reorderLevel: 5, initialStock: 18, active: true, createdAt: now,
    },
    {
      id: uid('prd_'), sku: 'GIOT-SRV', name: 'خدمات نصب و راه‌اندازی', type: 'service',
      categoryId: cat(4), unit: 'ساعت', purchasePrice: 0, salePrice: 3500000,
      taxRate: 10, reorderLevel: 0, initialStock: 0, active: true, createdAt: now,
    },
  ]
}
