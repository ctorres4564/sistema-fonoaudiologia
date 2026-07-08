import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-noble-50 dark:bg-noble-900 transition-colors duration-200">
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-w-0 flex-1 bg-noble-50 dark:bg-noble-900 transition-colors duration-200">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-noble-200 dark:border-noble-800 bg-white/90 dark:bg-noble-900/90 px-4 py-3 backdrop-blur md:px-8 transition-colors duration-200">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg border border-noble-300 dark:border-noble-700 px-3 py-2 text-sm font-medium text-noble-700 dark:text-noble-300 hover:bg-noble-100 dark:hover:bg-noble-800 md:hidden"
          >
            Menu
          </button>
          <div>
            <h2 className="text-lg font-bold text-noble-800 dark:text-noble-100">Sistema de Gestão de Pacientes</h2>
            <p className="text-xs text-noble-500 dark:text-noble-400">Fase 1 (MVP)</p>
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
