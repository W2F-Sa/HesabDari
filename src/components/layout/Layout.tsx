import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Header onMenu={() => setSidebarOpen(true)} />
          <Outlet />
          <footer className="mt-10 pb-6 text-center text-xs text-muted">
            سامانه حسابداری و انبارداری ماهان الکترونیک پرنیا (GIoT) — تمامی حقوق محفوظ است
          </footer>
        </div>
      </main>
    </div>
  )
}
