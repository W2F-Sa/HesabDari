import type { Invoice, InvoiceItem } from '@/types'

export interface ItemCalc {
  gross: number // مبلغ ناخالص (تعداد × فی)
  discount: number // تخفیف ردیف
  net: number // پس از تخفیف
  tax: number // مالیات ارزش افزوده
  total: number // جمع نهایی ردیف
}

export function calcItem(item: InvoiceItem): ItemCalc {
  const gross = (item.quantity || 0) * (item.unitPrice || 0)
  const percentDiscount = (gross * (item.discountPercent || 0)) / 100
  const discount = percentDiscount + (item.discountAmount || 0)
  const net = Math.max(0, gross - discount)
  const tax = (net * (item.taxRate || 0)) / 100
  const total = net + tax
  return { gross, discount, net, tax, total }
}

export interface InvoiceCalc {
  subtotal: number // جمع ناخالص ردیف‌ها
  itemsDiscount: number // مجموع تخفیف ردیف‌ها
  globalDiscount: number // تخفیف کلی
  totalDiscount: number
  taxableBase: number // پایه مشمول مالیات
  tax: number // مجموع مالیات
  shipping: number
  round: number
  payable: number // قابل پرداخت
  paid: number
  remaining: number
}

export function calcInvoice(inv: Invoice): InvoiceCalc {
  let subtotal = 0
  let itemsDiscount = 0
  let net = 0
  let tax = 0
  for (const item of inv.items) {
    const c = calcItem(item)
    subtotal += c.gross
    itemsDiscount += c.discount
    net += c.net
    tax += c.tax
  }
  const globalPercent = (net * (inv.globalDiscountPercent || 0)) / 100
  const globalDiscount = globalPercent + (inv.globalDiscountAmount || 0)
  const taxableBase = Math.max(0, net - globalDiscount)
  // اگر تخفیف کلی اعمال شود مالیات بر پایه‌ی پس از تخفیف بازمحاسبه می‌شود
  const effTax = net > 0 ? tax * (taxableBase / net) : 0
  const shipping = inv.shippingCost || 0
  const round = inv.roundAmount || 0
  const payable = Math.max(0, taxableBase + effTax + shipping + round)
  const paid = inv.paidAmount || 0
  return {
    subtotal,
    itemsDiscount,
    globalDiscount,
    totalDiscount: itemsDiscount + globalDiscount,
    taxableBase,
    tax: effTax,
    shipping,
    round,
    payable,
    paid,
    remaining: Math.max(0, payable - paid),
  }
}

export function emptyItem(taxRate = 0): InvoiceItem {
  return {
    id: Math.random().toString(36).slice(2),
    description: '',
    quantity: 1,
    unit: 'عدد',
    unitPrice: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxRate,
  }
}
