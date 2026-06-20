/**
 * Sidebar.jsx — Left sidebar navigation for the Solar EPC Dashboard
 * 
 * Features:
 * - Company logo/brand at top with solar icon
 * - 7 navigation items with lucide icons: Dashboard, CRM, Projects, Inventory, Payments, Workflows, Settings
 * - Active state with indigo accent highlighting and left border indicator
 * - User profile card at bottom with role badge and logout button
 * - Responsive: slides in/out on mobile with overlay backdrop
 * - Collapsed state on mobile, always visible on desktop (lg+)
 * - Smooth transitions on all state changes
 */

import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Package,
  CreditCard,
  Workflow,
  Settings,
  LogOut,
  Sun,
  ChevronLeft,
  Menu,
  X,
  UserCheck,
  Briefcase,
  Home,
  ClipboardList,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',          icon: LayoutDashboard, roles: ['Owner', 'HR', 'Sales Head', 'Operations Head', 'B2B Sales'] },
  { id: 'crm',             label: 'Leads & Follow-ups', icon: Users,           roles: ['Owner', 'Sales Head'] },
  { id: 'b2c_projects',    label: 'B2C Tracker',        icon: Home,            roles: ['Owner', 'Sales Head', 'Operations Head'] },
  { id: 'projects',        label: 'Projects',           icon: FolderKanban,    roles: ['Owner', 'Operations Head'] },
  { id: 'b2b',             label: 'B2B Dealer Portal',  icon: Briefcase,       roles: ['Owner', 'B2B Sales', 'Operations Head'] },
  { id: 'inventory',       label: 'Inventory',          icon: Package,         roles: ['Owner', 'B2B Sales', 'Operations Head'] },
  { id: 'staff',           label: 'HR & Staff Portal',  icon: UserCheck,       roles: ['Owner', 'HR'] },
  { id: 'employee_portal', label: 'My Staff Portal',    icon: ClipboardList,   roles: ['Owner', 'HR', 'Sales Head'] },
  { id: 'payments',        label: 'Payments',           icon: CreditCard,      roles: ['Owner'] },
  { id: 'settings',        label: 'Settings',           icon: Settings,        roles: ['Owner', 'HR', 'Sales Head', 'Operations Head', 'B2B Sales'] },
];

export default function Sidebar({ activeModule, onModuleChange, user, onLogout }) {
  const userRole = user?.designation || 'Owner';

  // Filter navigation items based on user role
  const allowedItems = NAV_ITEMS.filter(item => 
    item.roles.includes(userRole)
  );
  // Mobile sidebar open/close state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Handle nav item click — switch module and close mobile sidebar
  const handleNavClick = (moduleId) => {
    onModuleChange(moduleId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ── Mobile hamburger button (visible < lg) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/50 text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-all duration-200"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile backdrop overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-[80] h-screen
          w-[260px] flex flex-col
          bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Brand / Logo ── */}
        <div className="px-5 py-6 flex items-center gap-3 border-b border-slate-800/60">
          {/* Solar icon with gradient background */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 flex-shrink-0">
            <Sun size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white tracking-tight truncate">Helius Solar</span>
            <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Operations Hub</span>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Navigation items ── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {allowedItems.map((item) => {
              const isActive = activeModule === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-indigo-600/15 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }
                  `}
                >
                  {/* Active indicator — left accent bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-500 rounded-r-full" />
                  )}

                  {/* Icon with active color */}
                  <Icon
                    size={18}
                    className={`flex-shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />

                  {/* Label */}
                  <span>{item.label}</span>

                  {/* Active glow dot */}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── User info + Logout ── */}
        <div className="px-3 py-4 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
            {/* User avatar */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 text-sm font-bold uppercase">
              {user?.username?.charAt(0) || 'U'}
            </div>

            {/* User details */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.designation || 'Role'}</p>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-200"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
