/**
 * dashboard/AIInsights.jsx — AI-powered suggestion cards panel
 * 
 * Accepts a `module` prop to filter insights per section:
 * - 'all' / undefined → Combined insights from every department (Dashboard overview)
 * - 'crm'             → Only CRM/lead/sales insights
 * - 'projects'        → Only project/site related insights
 * - 'inventory'       → Only inventory/stock insights
 * - 'payments'        → Only payment/revenue insights
 * - 'staff'           → Only staff/HR insights
 * 
 * Falls back to hardcoded demo suggestions if the API is unreachable.
 */

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Brain,
  Users,
  Package,
  CreditCard,
  FolderKanban,
  Phone,
} from 'lucide-react';

// ─── Module-specific insights ──────────────────────────────────────────
const MODULE_INSIGHTS = {
  crm: [
    {
      id: 'crm-1', priority: 'high', module: 'crm',
      title: 'Follow up on 3 hot leads',
      description: 'Leads from Rajkot and Ahmedabad have been idle for 48+ hours. Their AI score is above 80 — immediate follow-up recommended.',
      action: 'View Leads', icon: 'alert', timestamp: '2 hours ago',
    },
    {
      id: 'crm-2', priority: 'medium', module: 'crm',
      title: 'Optimize proposal conversion',
      description: 'Proposal-to-Won conversion dropped from 34% to 28% this month. Consider revisiting pricing or adding financing options.',
      action: 'View Analytics', icon: 'bulb', timestamp: '2 days ago',
    },
    {
      id: 'crm-3', priority: 'low', module: 'crm',
      title: 'WhatsApp leads trending up',
      description: 'WhatsApp-sourced leads increased 42% this week. Consider running a targeted campaign to capitalize on this channel.',
      action: 'View Sources', icon: 'trend', timestamp: '1 day ago',
    },
    {
      id: 'crm-4', priority: 'medium', module: 'crm',
      title: 'B2B vendor inquiry pending',
      description: 'SunTech Distributors sent a bulk inquiry for 200 panels 3 days ago — no response logged yet.',
      action: 'View Inquiry', icon: 'alert', timestamp: '3 days ago',
    },
  ],

  inventory: [
    {
      id: 'inv-1', priority: 'high', module: 'inventory',
      title: 'Inverter stock running low',
      description: 'Growatt 5kW inverter stock is at 3 units — below the reorder threshold of 5. Consider placing a purchase order.',
      action: 'Check Inventory', icon: 'alert', timestamp: '5 hours ago',
    },
    {
      id: 'inv-2', priority: 'medium', module: 'inventory',
      title: 'Panel batch expiry alert',
      description: 'Warranty registration for batch #PNL-2024-089 (50 panels) expires in 15 days. Register before dispatch.',
      action: 'View Batch', icon: 'sparkle', timestamp: '1 day ago',
    },
    {
      id: 'inv-3', priority: 'low', module: 'inventory',
      title: 'Warehouse utilization at 82%',
      description: 'Bhiwadi warehouse is nearing capacity. Consider dispatching pending B2B orders to free up space.',
      action: 'View Warehouse', icon: 'trend', timestamp: '6 hours ago',
    },
  ],

  payments: [
    {
      id: 'pay-1', priority: 'high', module: 'payments',
      title: 'Revenue target 78% achieved',
      description: 'Monthly target is ₹45L. Current collections stand at ₹35.1L with 12 days remaining. 2 pending milestones could push this to 92%.',
      action: 'View Payments', icon: 'sparkle', timestamp: '1 day ago',
    },
    {
      id: 'pay-2', priority: 'high', module: 'payments',
      title: '3 invoices overdue',
      description: 'Invoices #INV-1042, #INV-1038, #INV-1035 are past due date. Combined amount ₹4.8L. Send payment reminders.',
      action: 'View Overdue', icon: 'alert', timestamp: '4 hours ago',
    },
    {
      id: 'pay-3', priority: 'medium', module: 'payments',
      title: 'B2B vendor payment due',
      description: 'GreenTech Solar vendor payment of ₹2.1L is due in 3 days. Approve disbursement to maintain credit terms.',
      action: 'Approve Payment', icon: 'trend', timestamp: '2 days ago',
    },
  ],

  projects: [
    {
      id: 'proj-1', priority: 'high', module: 'projects',
      title: 'Delayed milestone: Sharma Residence',
      description: 'Panel installation was scheduled for yesterday but not marked complete. Site team hasn\'t updated status in 36 hours.',
      action: 'View Project', icon: 'alert', timestamp: '3 hours ago',
    },
    {
      id: 'proj-2', priority: 'medium', module: 'projects',
      title: 'Net metering approval pending',
      description: '4 projects awaiting DISCOM net metering approval. Average wait time exceeding 18 days — consider follow-up.',
      action: 'Track Approvals', icon: 'sparkle', timestamp: '1 day ago',
    },
    {
      id: 'proj-3', priority: 'low', module: 'projects',
      title: 'Quality score above 95%',
      description: 'Last 10 installations scored 95%+ on quality inspection. Team performance is excellent this month.',
      action: 'View Reports', icon: 'trend', timestamp: '5 hours ago',
    },
  ],

  staff: [
    {
      id: 'staff-1', priority: 'high', module: 'staff',
      title: '2 staff members absent today',
      description: 'Vikram Malhotra and Priya Sharma haven\'t checked in today. Vikram has a site survey scheduled at 11 AM.',
      action: 'View Attendance', icon: 'alert', timestamp: '1 hour ago',
    },
    {
      id: 'staff-2', priority: 'medium', module: 'staff',
      title: 'Overtime hours exceeding limit',
      description: 'Suresh Patel has logged 52 hours this week, exceeding the 45-hour weekly limit. Consider redistribution.',
      action: 'View Hours', icon: 'sparkle', timestamp: '6 hours ago',
    },
    {
      id: 'staff-3', priority: 'low', module: 'staff',
      title: 'Task completion rate improved',
      description: 'Team task completion rate improved from 72% to 88% compared to last month. Operations team leading.',
      action: 'View Tasks', icon: 'trend', timestamp: '2 days ago',
    },
  ],
};

// Build combined "all" insights — pick top items from each module
const ALL_INSIGHTS = [
  MODULE_INSIGHTS.crm[0],
  MODULE_INSIGHTS.inventory[0],
  MODULE_INSIGHTS.payments[0],
  MODULE_INSIGHTS.projects[0],
  MODULE_INSIGHTS.staff[0],
  MODULE_INSIGHTS.crm[1],
  MODULE_INSIGHTS.payments[1],
  MODULE_INSIGHTS.inventory[1],
].filter(Boolean);

// Map icon names to Lucide components
const ICON_MAP = {
  alert:   AlertTriangle,
  trend:   TrendingUp,
  sparkle: Sparkles,
  bulb:    Lightbulb,
};

// Module header info
const MODULE_HEADERS = {
  all:       { label: 'AI Insights — Overview', subtitle: 'Combined intelligence across all departments', icon: Brain, color: 'violet' },
  crm:       { label: 'CRM Insights', subtitle: 'Lead tracking & sales intelligence', icon: Phone, color: 'indigo' },
  inventory: { label: 'Inventory Insights', subtitle: 'Stock levels & warehouse alerts', icon: Package, color: 'amber' },
  payments:  { label: 'Payment Insights', subtitle: 'Revenue tracking & collection alerts', icon: CreditCard, color: 'emerald' },
  projects:  { label: 'Project Insights', subtitle: 'Site progress & milestone tracking', icon: FolderKanban, color: 'sky' },
  staff:     { label: 'Staff Insights', subtitle: 'Attendance & performance alerts', icon: Users, color: 'rose' },
};

// Priority color schemes
const PRIORITY_COLORS = {
  high:   { bg: 'bg-amber-500/10', border: 'border-amber-500/25', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  medium: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
  low:    { bg: 'bg-slate-500/10', border: 'border-slate-500/25', text: 'text-slate-400', badge: 'bg-slate-500/20 text-slate-300' },
};

const HEADER_COLORS = {
  violet:  'bg-violet-500/10 text-violet-400',
  indigo:  'bg-indigo-500/10 text-indigo-400',
  amber:   'bg-amber-500/10 text-amber-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  sky:     'bg-sky-500/10 text-sky-400',
  rose:    'bg-rose-500/10 text-rose-400',
};

export default function AIInsights({ module = 'all' }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the right insights based on module prop
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await apiCall('/ai/suggestions');
        if (data?.suggestions?.length > 0) {
          // If API returns data, filter by module
          if (module === 'all') {
            setInsights(data.suggestions);
          } else {
            setInsights(data.suggestions.filter(s => s.module === module));
          }
          setLoading(false);
          return;
        }
      } catch {
        // Fall back to demo data
      }

      // Use demo data
      if (module === 'all') {
        setInsights(ALL_INSIGHTS);
      } else {
        setInsights(MODULE_INSIGHTS[module] || ALL_INSIGHTS);
      }
      setLoading(false);
    };
    fetchInsights();
  }, [module]);

  const header = MODULE_HEADERS[module] || MODULE_HEADERS.all;
  const HeaderIcon = header.icon;
  const headerColor = HEADER_COLORS[header.color] || HEADER_COLORS.violet;

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${headerColor} flex items-center justify-center`}>
          <HeaderIcon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{header.label}</h3>
          <p className="text-[10px] text-slate-500">{header.subtitle}</p>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 animate-pulse">
              <div className="h-3 w-1/3 bg-slate-800 rounded mb-2" />
              <div className="h-2 w-2/3 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        /* Insight cards */
        <div className="space-y-3">
          {insights.map((insight) => {
            const colors = PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS.low;
            const IconComponent = ICON_MAP[insight.icon] || Lightbulb;

            return (
              <div
                key={insight.id}
                className={`group ${colors.bg} border ${colors.border} rounded-xl p-4 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start gap-3">
                  {/* Priority icon */}
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <IconComponent size={15} className={colors.text} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + priority badge + module tag */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-sm font-medium text-white truncate">{insight.title}</h4>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${colors.badge}`}>
                        {insight.priority}
                      </span>
                      {module === 'all' && insight.module && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50 uppercase">
                          {insight.module}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed mb-2.5">
                      {insight.description}
                    </p>

                    {/* Footer: action link + timestamp */}
                    <div className="flex items-center justify-between">
                      <button className={`text-xs font-medium ${colors.text} flex items-center gap-1 hover:underline transition-colors`}>
                        {insight.action}
                        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <span className="text-[10px] text-slate-600">{insight.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
