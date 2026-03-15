import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, TrendingUp, Receipt } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Pregled' },
  { to: '/reservations', icon: CalendarDays, label: 'Rezervacije' },
  { to: '/revenue', icon: TrendingUp, label: 'Prihodi' },
  { to: '/expenses', icon: Receipt, label: 'Troškovi' },
]

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-brand-bg pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-center px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏰</span>
            <h1 className="text-lg font-bold text-brand-dark">HopHop</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="flex justify-around max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-xs transition ${
                  isActive ? 'text-brand-teal' : 'text-gray-400'
                }`
              }
              end={to === '/'}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
