import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { useTheme } from '../../contexts/useTheme'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/agenda', label: 'Agenda' },
]

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await logout()
    onClose?.()
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 transition md:hidden ${open ? 'block' : 'hidden'}`}
      />

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col bg-noble-800 p-6 text-white shadow-2xl transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-300">FonoFlow</p>
          <h1 className="mt-2 text-2xl font-bold">Gestão Clínica</h1>
          <p className="mt-2 text-sm text-noble-200">Sistema de pacientes de fonoaudiologia</p>
        </div>

        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-plum-600 text-white' : 'text-noble-100 hover:bg-noble-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          className="mb-4 flex items-center justify-between rounded-xl border border-noble-600 bg-noble-700/50 px-4 py-3 text-sm font-medium text-noble-100 transition hover:bg-noble-700 hover:text-white"
        >
          <span>Tema: {isDark ? 'Escuro 🌙' : 'Claro ☀️'}</span>
          <span className="rounded-lg bg-noble-600 px-2 py-0.5 text-xs text-gold-300">Mudar</span>
        </button>

        <div className="rounded-xl border border-noble-600 bg-noble-700 p-4">
          <p className="text-sm text-noble-200">Usuário conectado</p>
          <p className="mt-1 truncate text-sm font-semibold text-gold-300">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 w-full rounded-lg bg-gold-400 px-4 py-2 text-sm font-semibold text-noble-900 transition hover:bg-gold-300"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
