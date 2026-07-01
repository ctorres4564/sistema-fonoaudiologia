import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-noble-50">
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-noble-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg border border-noble-300 px-3 py-2 text-sm font-medium text-noble-700 md:hidden"
          >
            Menu
          </button>
          <div>
            <h2 className="text-lg font-bold text-noble-800">Sistema de Gestão de Pacientes</h2>
            <p className="text-xs text-noble-500">Fase 1 (MVP)</p>
          </div>
        </header>

        <section className="p-4 md:p-8">
          {children || <Outlet />}
        </section>
      </main>
    </div>
  )
}

export default AppLayout
