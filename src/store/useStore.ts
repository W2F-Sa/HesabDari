import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Account,
  ActivityLog,
  CashAccount,
  Category,
  Cheque,
  Company,
  ExpenseCategory,
  Invoice,
  JournalEntry,
  Party,
  Product,
  Settings,
  StockMove,
  Transaction,
  UsdtRate,
  Warehouse,
} from '@/types'
import { uid } from '@/utils/helpers'
import {
  defaultAccounts,
  defaultCashAccounts,
  defaultCategories,
  defaultCompany,
  defaultExpenseCategories,
  defaultProducts,
  defaultSettings,
  defaultWarehouses,
} from './seed'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface State {
  company: Company
  settings: Settings
  parties: Party[]
  categories: Category[]
  warehouses: Warehouse[]
  products: Product[]
  stockMoves: StockMove[]
  invoices: Invoice[]
  accounts: Account[]
  journalEntries: JournalEntry[]
  transactions: Transaction[]
  expenseCategories: ExpenseCategory[]
  cashAccounts: CashAccount[]
  cheques: Cheque[]
  usdtRate: UsdtRate | null
  activityLog: ActivityLog[]
  toasts: Toast[]

  // generic actions
  setCompany: (c: Partial<Company>) => void
  setSettings: (s: Partial<Settings>) => void
  setUsdtRate: (r: UsdtRate) => void

  // parties
  addParty: (p: Omit<Party, 'id' | 'createdAt'>) => Party
  updateParty: (id: string, p: Partial<Party>) => void
  removeParty: (id: string) => void

  // categories
  addCategory: (c: Omit<Category, 'id'>) => void
  updateCategory: (id: string, c: Partial<Category>) => void
  removeCategory: (id: string) => void

  // warehouses
  addWarehouse: (w: Omit<Warehouse, 'id'>) => void
  updateWarehouse: (id: string, w: Partial<Warehouse>) => void
  removeWarehouse: (id: string) => void

  // products
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => Product
  updateProduct: (id: string, p: Partial<Product>) => void
  removeProduct: (id: string) => void

  // stock
  addStockMove: (m: Omit<StockMove, 'id' | 'createdAt'>) => void
  removeStockMove: (id: string) => void

  // invoices
  addInvoice: (i: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice
  updateInvoice: (id: string, i: Partial<Invoice>) => void
  removeInvoice: (id: string) => void
  nextInvoiceNumber: (type: Invoice['type']) => string

  // accounting
  addAccount: (a: Omit<Account, 'id'>) => void
  updateAccount: (id: string, a: Partial<Account>) => void
  removeAccount: (id: string) => void
  addJournalEntry: (j: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  updateJournalEntry: (id: string, j: Partial<JournalEntry>) => void
  removeJournalEntry: (id: string) => void
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void
  updateTransaction: (id: string, t: Partial<Transaction>) => void
  removeTransaction: (id: string) => void
  addExpenseCategory: (c: Omit<ExpenseCategory, 'id'>) => void
  removeExpenseCategory: (id: string) => void
  addCashAccount: (c: Omit<CashAccount, 'id'>) => void
  updateCashAccount: (id: string, c: Partial<CashAccount>) => void
  removeCashAccount: (id: string) => void
  addCheque: (c: Omit<Cheque, 'id' | 'createdAt'>) => void
  updateCheque: (id: string, c: Partial<Cheque>) => void
  removeCheque: (id: string) => void

  // logs & toast
  log: (action: string, module: string, detail?: string) => void
  toast: (message: string, type?: Toast['type']) => void
  dismissToast: (id: string) => void

  // data management
  exportData: () => string
  importData: (json: string) => boolean
  resetData: () => void
}

const cats = defaultCategories()

const initialState = () => ({
  company: defaultCompany,
  settings: defaultSettings,
  parties: [] as Party[],
  categories: cats,
  warehouses: defaultWarehouses(),
  products: defaultProducts(cats),
  stockMoves: [] as StockMove[],
  invoices: [] as Invoice[],
  accounts: defaultAccounts(),
  journalEntries: [] as JournalEntry[],
  transactions: [] as Transaction[],
  expenseCategories: defaultExpenseCategories(),
  cashAccounts: defaultCashAccounts(),
  cheques: [] as Cheque[],
  usdtRate: null as UsdtRate | null,
  activityLog: [] as ActivityLog[],
})

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState(),
      toasts: [],

      setCompany: (c) => set((s) => ({ company: { ...s.company, ...c } })),
      setSettings: (s2) => set((s) => ({ settings: { ...s.settings, ...s2 } })),
      setUsdtRate: (r) => set({ usdtRate: r }),

      addParty: (p) => {
        const party: Party = { ...p, id: uid('pty_'), createdAt: new Date().toISOString() }
        set((s) => ({ parties: [party, ...s.parties] }))
        get().log('افزودن طرف حساب', 'طرف حساب‌ها', party.name)
        return party
      },
      updateParty: (id, p) =>
        set((s) => ({ parties: s.parties.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeParty: (id) => set((s) => ({ parties: s.parties.filter((x) => x.id !== id) })),

      addCategory: (c) => set((s) => ({ categories: [...s.categories, { ...c, id: uid('cat_') }] })),
      updateCategory: (id, c) =>
        set((s) => ({ categories: s.categories.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      removeCategory: (id) => set((s) => ({ categories: s.categories.filter((x) => x.id !== id) })),

      addWarehouse: (w) => set((s) => ({ warehouses: [...s.warehouses, { ...w, id: uid('wh_') }] })),
      updateWarehouse: (id, w) =>
        set((s) => ({ warehouses: s.warehouses.map((x) => (x.id === id ? { ...x, ...w } : x)) })),
      removeWarehouse: (id) => set((s) => ({ warehouses: s.warehouses.filter((x) => x.id !== id) })),

      addProduct: (p) => {
        const product: Product = { ...p, id: uid('prd_'), createdAt: new Date().toISOString() }
        set((s) => ({ products: [product, ...s.products] }))
        get().log('افزودن کالا', 'انبارداری', product.name)
        return product
      },
      updateProduct: (id, p) =>
        set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      removeProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),

      addStockMove: (m) => {
        const move: StockMove = { ...m, id: uid('mv_'), createdAt: new Date().toISOString() }
        set((s) => ({ stockMoves: [move, ...s.stockMoves] }))
        get().log('ثبت حرکت انبار', 'انبارداری', move.type)
      },
      removeStockMove: (id) => set((s) => ({ stockMoves: s.stockMoves.filter((x) => x.id !== id) })),

      addInvoice: (i) => {
        const now = new Date().toISOString()
        const invoice: Invoice = { ...i, id: uid('inv_'), createdAt: now, updatedAt: now }
        set((s) => ({ invoices: [invoice, ...s.invoices] }))
        // افزایش شمارنده
        if (i.type === 'proforma') {
          set((s) => ({ settings: { ...s.settings, proformaCounter: s.settings.proformaCounter + 1 } }))
        } else {
          set((s) => ({ settings: { ...s.settings, invoiceCounter: s.settings.invoiceCounter + 1 } }))
        }
        get().log('صدور فاکتور', 'فاکتورها', invoice.number)
        return invoice
      },
      updateInvoice: (id, i) =>
        set((s) => ({
          invoices: s.invoices.map((x) =>
            x.id === id ? { ...x, ...i, updatedAt: new Date().toISOString() } : x,
          ),
        })),
      removeInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
      nextInvoiceNumber: (type) => {
        const s = get().settings
        if (type === 'proforma') return `${s.proformaPrefix}${s.proformaCounter}`
        return `${s.invoicePrefix}${s.invoiceCounter}`
      },

      addAccount: (a) => set((s) => ({ accounts: [...s.accounts, { ...a, id: uid('acc_') }] })),
      updateAccount: (id, a) =>
        set((s) => ({ accounts: s.accounts.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
      removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter((x) => x.id !== id) })),

      addJournalEntry: (j) =>
        set((s) => ({
          journalEntries: [
            { ...j, id: uid('je_'), createdAt: new Date().toISOString() },
            ...s.journalEntries,
          ],
        })),
      updateJournalEntry: (id, j) =>
        set((s) => ({
          journalEntries: s.journalEntries.map((x) => (x.id === id ? { ...x, ...j } : x)),
        })),
      removeJournalEntry: (id) =>
        set((s) => ({ journalEntries: s.journalEntries.filter((x) => x.id !== id) })),

      addTransaction: (t) => {
        set((s) => ({
          transactions: [
            { ...t, id: uid('tx_'), createdAt: new Date().toISOString() },
            ...s.transactions,
          ],
        }))
        get().log('ثبت تراکنش', 'حسابداری', t.description)
      },
      updateTransaction: (id, t) =>
        set((s) => ({ transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) })),

      addExpenseCategory: (c) =>
        set((s) => ({ expenseCategories: [...s.expenseCategories, { ...c, id: uid('ec_') }] })),
      removeExpenseCategory: (id) =>
        set((s) => ({ expenseCategories: s.expenseCategories.filter((x) => x.id !== id) })),

      addCashAccount: (c) =>
        set((s) => ({ cashAccounts: [...s.cashAccounts, { ...c, id: uid('cash_') }] })),
      updateCashAccount: (id, c) =>
        set((s) => ({ cashAccounts: s.cashAccounts.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      removeCashAccount: (id) =>
        set((s) => ({ cashAccounts: s.cashAccounts.filter((x) => x.id !== id) })),

      addCheque: (c) =>
        set((s) => ({
          cheques: [{ ...c, id: uid('chq_'), createdAt: new Date().toISOString() }, ...s.cheques],
        })),
      updateCheque: (id, c) =>
        set((s) => ({ cheques: s.cheques.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
      removeCheque: (id) => set((s) => ({ cheques: s.cheques.filter((x) => x.id !== id) })),

      log: (action, module, detail) =>
        set((s) => ({
          activityLog: [
            { id: uid('log_'), date: new Date().toISOString(), action, module, detail },
            ...s.activityLog,
          ].slice(0, 500),
        })),

      toast: (message, type = 'success') => {
        const id = uid('t_')
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => get().dismissToast(id), 3500)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      exportData: () => {
        const s = get()
        const data = {
          version: 1,
          exportedAt: new Date().toISOString(),
          company: s.company,
          settings: s.settings,
          parties: s.parties,
          categories: s.categories,
          warehouses: s.warehouses,
          products: s.products,
          stockMoves: s.stockMoves,
          invoices: s.invoices,
          accounts: s.accounts,
          journalEntries: s.journalEntries,
          transactions: s.transactions,
          expenseCategories: s.expenseCategories,
          cashAccounts: s.cashAccounts,
          cheques: s.cheques,
        }
        return JSON.stringify(data, null, 2)
      },
      importData: (json) => {
        try {
          const data = JSON.parse(json)
          set((s) => ({
            company: data.company ?? s.company,
            settings: data.settings ?? s.settings,
            parties: data.parties ?? [],
            categories: data.categories ?? [],
            warehouses: data.warehouses ?? [],
            products: data.products ?? [],
            stockMoves: data.stockMoves ?? [],
            invoices: data.invoices ?? [],
            accounts: data.accounts ?? [],
            journalEntries: data.journalEntries ?? [],
            transactions: data.transactions ?? [],
            expenseCategories: data.expenseCategories ?? [],
            cashAccounts: data.cashAccounts ?? [],
            cheques: data.cheques ?? [],
          }))
          return true
        } catch {
          return false
        }
      },
      resetData: () => set({ ...initialState(), toasts: [] }),
    }),
    {
      name: 'giot-hesabdari-data',
      version: 1,
    },
  ),
)
