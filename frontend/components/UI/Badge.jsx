/**
 * UI/Badge.jsx — Reusable status badge component
 * 
 * Variants:
 * - success: emerald (green) — for completed, active, paid states
 * - warning: amber (yellow) — for pending, in-progress states
 * - danger:  rose (red) — for overdue, failed, lost states
 * - info:    indigo (blue) — for informational, new states
 * - neutral: slate (gray) — for default/unknown states
 * 
 * Props:
 * - variant: one of the above color schemes
 * - children: badge text content
 * - className: optional additional classes
 * - dot: optional boolean to show a leading status dot
 */

export default function Badge({ children, variant = 'neutral', className = '', dot = false }) {
  // Color mapping for each variant — bg, text, border, and dot colors
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    danger:  'bg-rose-500/10 text-rose-400 border-rose-500/25',
    info:    'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
    neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
  };

  const dotColors = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger:  'bg-rose-400',
    info:    'bg-indigo-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.neutral} ${className}`}
    >
      {/* Optional status dot indicator */}
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.neutral}`} />
      )}
      {children}
    </span>
  );
}
