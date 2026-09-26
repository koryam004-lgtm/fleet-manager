import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Car,
  Users,
  ClipboardCheck,
  AlertTriangle,
  History,
  Truck,
  Menu,
  X,
} from 'lucide-react';

export type PageKey = 'dashboard' | 'vehicles' | 'drivers' | 'checklists' | 'anomalies' | 'history';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'vehicles', label: 'Véhicules', icon: Car },
  { key: 'drivers', label: 'Chauffeurs', icon: Users },
  { key: 'checklists', label: 'Checklists', icon: ClipboardCheck },
  { key: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
  { key: 'history', label: 'Historique', icon: History },
];

interface LayoutProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function Layout({ current, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((n) => n.key === current);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-indigo-50/40">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarContent current={current} onNavigate={onNavigate} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.key}
                  item={item}
                  active={current === item.key}
                  onClick={() => {
                    onNavigate(item.key);
                    setMobileOpen(false);
                  }}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={26} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                {activeItem?.label}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-sm font-semibold text-white shadow-md shadow-indigo-200">
              AD
            </div>
            <span className="text-sm font-medium text-slate-600">Administrateur</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  current,
  onNavigate,
}: {
  current: PageKey;
  onNavigate: (p: PageKey) => void;
}) {
  return (
    <>
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={current === item.key}
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </nav>
      <div className="border-t border-slate-100 p-4">
        <p className="text-xs text-slate-400">Fleet Manager v1.0</p>
      </div>
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-200">
        <Truck size={24} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">Fleet Manager</p>
        <p className="text-xs text-slate-400">Gestion de flotte</p>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-200'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={21} strokeWidth={2} />
      {item.label}
    </button>
  );
}