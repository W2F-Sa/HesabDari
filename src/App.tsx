import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { useAuth } from './store/useAuth'
import Layout from './components/layout/Layout'
import Toaster from './components/Toaster'
import { ConfirmHost } from './components/Confirm'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import InvoiceEditor from './pages/InvoiceEditor'
import InvoiceView from './pages/InvoiceView'
import Parties from './pages/Parties'
import Products from './pages/Products'
import Stock from './pages/Stock'
import Warehouses from './pages/Warehouses'
import InventoryReport from './pages/InventoryReport'
import Transactions from './pages/Transactions'
import CashAccounts from './pages/CashAccounts'
import Accounts from './pages/Accounts'
import Journal from './pages/Journal'
import Cheques from './pages/Cheques'
import Reports from './pages/Reports'
import Usdt from './pages/Usdt'
import SettingsPage from './pages/Settings'

export default function App() {
  const theme = useStore((s) => s.settings.theme)
  const isAuthed = useAuth((s) => s.isAuthed)
  const initialized = useAuth((s) => s.initialized)
  const ensureSeed = useAuth((s) => s.ensureSeed)

  useEffect(() => {
    ensureSeed()
  }, [ensureSeed])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme !== 'dark')
  }, [theme])

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="glass-card px-8 py-6 text-sm text-muted">در حال بارگذاری…</div>
      </div>
    )
  }

  if (!isAuthed) {
    return (
      <>
        <Login />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceEditor />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
          <Route path="/invoices/:id" element={<InvoiceView />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/inventory-report" element={<InventoryReport />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/cash" element={<CashAccounts />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/cheques" element={<Cheques />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/usdt" element={<Usdt />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
      <ConfirmHost />
    </>
  )
}
