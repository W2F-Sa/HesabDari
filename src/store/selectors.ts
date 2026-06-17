import type { Invoice, Product, StockMove } from '@/types'
import { calcInvoice } from '@/utils/invoice'
import { useStore } from './useStore'

/** تاثیر هر نوع حرکت روی موجودی */
export function moveDelta(move: StockMove, warehouseId?: string): number {
  const incoming = ['in', 'return-in', 'adjust'].includes(move.type)
  const outgoing = ['out', 'return-out', 'waste'].includes(move.type)
  if (move.type === 'transfer') {
    if (warehouseId && move.toWarehouseId === warehouseId) return move.quantity
    if (warehouseId && move.warehouseId === warehouseId) return -move.quantity
    return 0
  }
  if (move.type === 'adjust') {
    // اصلاح می‌تواند مثبت یا منفی باشد (quantity علامت‌دار)
    return move.quantity
  }
  if (incoming) return Math.abs(move.quantity)
  if (outgoing) return -Math.abs(move.quantity)
  return 0
}

/** موجودی فعلی یک کالا (اختیاری در یک انبار خاص) */
export function getProductStock(
  productId: string,
  moves: StockMove[],
  products: Product[],
  warehouseId?: string,
): number {
  const product = products.find((p) => p.id === productId)
  let stock = product && (!warehouseId) ? product.initialStock : 0
  for (const m of moves) {
    if (m.productId !== productId) continue
    if (warehouseId && m.warehouseId !== warehouseId && m.toWarehouseId !== warehouseId) continue
    stock += moveDelta(m, warehouseId)
  }
  return stock
}

/** ارزش کل موجودی انبار به قیمت خرید */
export function getInventoryValue(products: Product[], moves: StockMove[]): number {
  return products.reduce((sum, p) => {
    const stock = getProductStock(p.id, moves, products)
    return sum + stock * p.purchasePrice
  }, 0)
}

/** مانده حساب یک طرف حساب (مثبت = بدهکار به ما) */
export function getPartyBalance(partyId: string): number {
  const { parties, invoices, transactions } = useStore.getState()
  const party = parties.find((p) => p.id === partyId)
  let balance = party?.openingBalance ?? 0
  for (const inv of invoices) {
    if (inv.partyId !== partyId || inv.status === 'canceled' || inv.type === 'proforma') continue
    const c = calcInvoice(inv)
    if (inv.type === 'sale') balance += c.remaining
    if (inv.type === 'purchase') balance -= c.remaining
  }
  for (const tx of transactions) {
    if (tx.partyId !== partyId) continue
    if (tx.type === 'receive') balance -= tx.amount
    if (tx.type === 'pay') balance += tx.amount
  }
  return balance
}

/** مانده یک حساب صندوق/بانک */
export function getCashBalance(cashAccountId: string): number {
  const { cashAccounts, transactions, invoices } = useStore.getState()
  const acc = cashAccounts.find((c) => c.id === cashAccountId)
  let balance = acc?.openingBalance ?? 0
  for (const tx of transactions) {
    if (tx.accountId !== cashAccountId) continue
    if (tx.type === 'income' || tx.type === 'receive') balance += tx.amount
    if (tx.type === 'expense' || tx.type === 'pay') balance -= tx.amount
  }
  // پرداخت‌های نقدی فاکتورها
  for (const inv of invoices) {
    for (const pay of inv.payments) {
      if ((pay as any).cashAccountId === cashAccountId) {
        balance += inv.type === 'sale' ? pay.amount : -pay.amount
      }
    }
  }
  return balance
}

export interface DashboardStats {
  totalSales: number
  totalPurchases: number
  totalIncome: number
  totalExpense: number
  netProfit: number
  receivables: number
  payables: number
  inventoryValue: number
  invoiceCount: number
  productCount: number
  partyCount: number
  lowStockCount: number
  overdueCount: number
  cashTotal: number
}

export function computeDashboard(): DashboardStats {
  const s = useStore.getState()
  let totalSales = 0
  let totalPurchases = 0
  let receivables = 0
  let payables = 0
  let overdueCount = 0
  const now = Date.now()
  for (const inv of s.invoices) {
    if (inv.status === 'canceled' || inv.type === 'proforma') continue
    const c = calcInvoice(inv)
    if (inv.type === 'sale') {
      totalSales += c.payable
      receivables += c.remaining
    }
    if (inv.type === 'purchase') {
      totalPurchases += c.payable
      payables += c.remaining
    }
    if (inv.dueDate && c.remaining > 0 && new Date(inv.dueDate).getTime() < now) {
      overdueCount++
    }
  }
  let totalIncome = 0
  let totalExpense = 0
  for (const tx of s.transactions) {
    if (tx.type === 'income') totalIncome += tx.amount
    if (tx.type === 'expense') totalExpense += tx.amount
  }
  const lowStockCount = s.products.filter(
    (p) => p.type === 'product' && getProductStock(p.id, s.stockMoves, s.products) <= p.reorderLevel,
  ).length
  const cashTotal = s.cashAccounts.reduce((sum, c) => sum + getCashBalance(c.id), 0)

  return {
    totalSales,
    totalPurchases,
    totalIncome,
    totalExpense,
    netProfit: totalSales + totalIncome - totalPurchases - totalExpense,
    receivables,
    payables,
    inventoryValue: getInventoryValue(s.products, s.stockMoves),
    invoiceCount: s.invoices.length,
    productCount: s.products.length,
    partyCount: s.parties.length,
    lowStockCount,
    overdueCount,
    cashTotal,
  }
}

export function getInvoiceParty(inv: Invoice): string {
  const { parties } = useStore.getState()
  return parties.find((p) => p.id === inv.partyId)?.name ?? 'مهمان'
}
