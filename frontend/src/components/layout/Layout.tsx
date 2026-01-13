import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex h-screen bg-background-dark overflow-hidden font-display text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-background-dark relative">
        <Header />
        {/* Main content area - pages must handle their own scrolling */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
