import { useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();
  
  let title = "Dashboard";
  if (location.pathname.startsWith('/projects')) title = "Projects";
  if (location.pathname.startsWith('/characters')) title = "Characters";
  if (location.pathname.startsWith('/library')) title = "Asset Library";
  if (location.pathname.startsWith('/settings')) title = "Settings";
  if (location.pathname.startsWith('/analytics')) title = "Analytics";

  return (
    <header className="h-16 px-6 md:px-8 border-b border-border-dark flex items-center justify-between shrink-0 bg-background-dark z-10">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-text-secondary">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-xl font-bold tracking-tight text-white hidden sm:block">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary text-[20px]">search</span>
          <input className="bg-surface-dark border border-border-dark text-sm text-white rounded-lg pl-10 pr-4 py-2 focus:ring-1 focus:ring-primary focus:border-primary placeholder-text-secondary w-64 outline-none" placeholder="Search..." type="text"/>
        </div>
        <button className="relative text-text-secondary hover:text-white transition-colors p-2 rounded-lg hover:bg-surface-dark">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background-dark"></span>
        </button>
        <button className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-primary hover:bg-blue-600 text-white text-sm font-bold leading-normal tracking-[0.015em] transition-colors shadow-[0_0_15px_rgba(19,91,236,0.3)]">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">Create New</span>
        </button>
      </div>
    </header>
  )
}