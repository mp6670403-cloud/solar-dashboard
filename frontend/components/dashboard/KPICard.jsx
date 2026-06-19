/**
 * dashboard/KPICard.jsx — Reusable Key Performance Indicator stat card
 * 
 * Features:
 * - Icon displayed in a colored container with gradient background
 * - Label (small text above value)
 * - Value (large, prominent number)
 * - Trend indicator: up/down arrow with percentage change
 * - Gradient accent border on left side
 * - Subtle hover animation (lift + shadow increase)
 * - Responsive sizing
 * 
 * Props:
 * - icon: Lucide icon component
 * - label: stat description
 * - value: stat number/string
 * - trend: percentage change string (e.g., "+12.5%")
 * - trendUp: boolean — true = green/up, false = red/down
 * - color: accent color theme ('indigo', 'emerald', 'amber', 'rose', 'violet', 'sky')
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

// Color mapping for icon containers and left border accents
const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-500/10',  border: 'border-l-indigo-500',  text: 'text-indigo-400',  shadow: 'shadow-indigo-500/5' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-l-emerald-500', text: 'text-emerald-400', shadow: 'shadow-emerald-500/5' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-l-amber-500',   text: 'text-amber-400',   shadow: 'shadow-amber-500/5' },
  rose:    { bg: 'bg-rose-500/10',     border: 'border-l-rose-500',    text: 'text-rose-400',    shadow: 'shadow-rose-500/5' },
  violet:  { bg: 'bg-violet-500/10',   border: 'border-l-violet-500',  text: 'text-violet-400',  shadow: 'shadow-violet-500/5' },
  sky:     { bg: 'bg-sky-500/10',      border: 'border-l-sky-500',     text: 'text-sky-400',     shadow: 'shadow-sky-500/5' },
};

export default function KPICard({ icon: Icon, label, value, trend, trendUp = true, color = 'indigo' }) {
  const colors = COLOR_MAP[color] || COLOR_MAP.indigo;

  return (
    <div
      className={`
        relative group bg-slate-900/60 backdrop-blur-md rounded-xl
        border border-slate-800/80 border-l-[3px] ${colors.border}
        p-5 shadow-xl ${colors.shadow}
        hover:shadow-2xl hover:-translate-y-0.5
        transition-all duration-300 ease-out
        overflow-hidden
      `}
    >
      {/* Decorative background glow */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 ${colors.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative flex items-start justify-between">
        {/* Left: label + value */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-2xl font-bold text-white tracking-tight">
            {value}
          </span>

          {/* Trend indicator */}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{trend}</span>
              <span className="text-slate-500 ml-0.5">vs last month</span>
            </div>
          )}
        </div>

        {/* Right: Icon */}
        <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          {Icon && <Icon size={20} className={colors.text} />}
        </div>
      </div>
    </div>
  );
}
