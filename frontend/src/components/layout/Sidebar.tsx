import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/projects', icon: 'movie_filter', label: 'My Projects' },
  { to: '/characters', icon: 'face', label: 'Characters' },
  { to: '/library', icon: 'library_books', label: 'Asset Library' },
]

const systemItems = [
  { to: '/settings', icon: 'memory', label: 'Agent Settings' },
  { to: '/analytics', icon: 'monitoring', label: 'Analytics' },
  { to: '/billing', icon: 'credit_card', label: 'Billing' },
]

export function Sidebar() {
  return (
    <aside className="w-64 h-full bg-[#0f1115] border-r border-border-dark flex flex-col shrink-0 transition-all duration-300 hidden md:flex font-display">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary/20 rounded-lg p-2 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-2xl">auto_fix</span>
        </div>
        <div>
          <h1 className="text-white text-xl font-bold tracking-tight">MangaForge</h1>
          <p className="text-text-secondary text-xs uppercase tracking-wider">AI Studio</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 mt-2">Main Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-text-secondary hover:bg-surface-dark hover:text-white'
              )
            }
          >
            <span className={clsx("material-symbols-outlined", { "filled": true })}>{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 mt-6">System</p>
        {systemItems.map((item) => (
            <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-text-secondary hover:bg-surface-dark hover:text-white'
              )
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border-dark">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-dark cursor-pointer transition-colors">
          <div 
            className="w-10 h-10 rounded-full bg-cover bg-center" 
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDCD8PNv76sP9OHKMFe-5LuU2bND8k_YFYHzHWO9Tx7IImZoFvnydIniDYWfe316x51P96qLE786s9A6ekX-4kxUP0HGN5uHb9iXs2hsX-CcOenqBm7O9d7tDCz6oiDMrkDTUQe2B9r9CUhTtg8uSQ6D1s-F0eLaCDiTiH7ffyroRT6Dq8hRLvNlib0hMs9mWDVpZmWltQKQRuI3_qPt2oKR2nHxq113rxVFQVAuVSOSPfDXPIQGpglslYmCeDHJ5EcbsI5SPQdAM9y')" }}
          ></div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-medium text-white truncate">Elena K.</p>
            <p className="text-xs text-text-secondary truncate">Pro Plan</p>
          </div>
          <span className="material-symbols-outlined text-text-secondary ml-auto text-lg">expand_more</span>
        </div>
      </div>
    </aside>
  )
}