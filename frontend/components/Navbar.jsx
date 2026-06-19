/**
 * Navbar.jsx — Top navigation bar for the Solar EPC Dashboard
 * 
 * Shows:
 * - Current module name (dynamic heading)
 * - Breadcrumb-style subtitle
 * - Quick search input (UI placeholder — no backend search yet)
 * - User designation badge
 * - Notification bell icon (placeholder)
 * - Current date display
 * 
 * This sits at the top of the main content area (to the right of sidebar).
 */

import { Search, Bell, Calendar } from 'lucide-react';
import Badge from './UI/Badge';

// Map module IDs to human-friendly display names
const MODULE_NAMES = {
  dashboard:  'Dashboard',
  crm:        'Customer Relationship Manager',
  projects:   'Project Management',
  inventory:  'Inventory & Stock',
  payments:   'Payments & Finance',
  workflows:  'Workflow Automations',
  staff:      'Staff & HR Portal',
  b2b:        'B2B Distribution & Dealer Portal',
  settings:   'Settings',
};

export default function Navbar({ activeModule, user }) {
  // Format today's date for the top bar
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* ── Left: Module title ── */}
        <div className="flex flex-col min-w-0 pl-12 lg:pl-0">
          <h1 className="text-base font-bold text-white tracking-tight truncate">
            {MODULE_NAMES[activeModule] || 'Dashboard'}
          </h1>
          <span className="text-[10px] text-slate-500 font-medium">
            Solar EPC &bull; Operations Hub
          </span>
        </div>

        {/* ── Center: Quick search bar (desktop only) ── */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads, projects, inventory..."
              className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* ── Right: Date, notifications, user badge ── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Current date */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Calendar size={13} className="text-slate-500" />
            <span>{today}</span>
          </div>

          {/* Notification bell — placeholder with dummy count badge */}
          <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors duration-200">
            <Bell size={18} />
            {/* Notification count dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-950" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-800 hidden sm:block" />

          {/* User designation badge */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold uppercase">
              {user?.username?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200">{user?.username}</span>
              <Badge variant="info" className="text-[9px] py-0">
                {user?.designation || 'User'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
