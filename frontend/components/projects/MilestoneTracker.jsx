/**
 * projects/MilestoneTracker.jsx — Milestones tracker list for solar rooftop sites
 * 
 * Milestones managed:
 * 1. Site Survey
 * 2. Design Approval
 * 3. Material Procurement
 * 4. Structure Installation
 * 5. Panel Installation
 * 6. Commissioning
 * 7. Net Metering Application
 * 
 * Shows a beautiful vertical timeline with status badges and action buttons to update progress.
 */

import { useState } from 'react';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import { CheckCircle2, Clock, Play, AlertCircle } from 'lucide-react';

const MILESTONE_ORDER = [
  'Site Survey',
  'Design Approval',
  'Material Procurement',
  'Structure Installation',
  'Panel Installation',
  'Commissioning',
  'Net Metering Application'
];

export default function MilestoneTracker({ project, milestones = [], onUpdateMilestone }) {
  const [updating, setUpdating] = useState(null);

  // Helper to get status of a milestone
  const getMilestoneStatus = (name) => {
    const m = milestones.find(item => item.milestone_name === name);
    return m ? m.status : 'Pending'; // 'Pending', 'In Progress', 'Completed'
  };

  const handleStatusChange = async (name, currentStatus) => {
    let nextStatus = 'In Progress';
    if (currentStatus === 'Pending') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed';
    else return; // already completed

    setUpdating(name);
    try {
      await onUpdateMilestone(project.id, name, nextStatus);
    } catch (err) {
      alert(`Failed to update milestone: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 backdrop-blur-md">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Project Milestones</h3>
        <p className="text-[11px] text-slate-500">Track and update the 7 solar rooftop deployment phases</p>
      </div>

      <div className="relative pl-6 border-l border-slate-800 space-y-6">
        {MILESTONE_ORDER.map((name, index) => {
          const status = getMilestoneStatus(name);
          const isCurrent = project.current_milestone === name;

          // Icon and color mapping
          let color = 'text-slate-600 bg-slate-950 border-slate-800';
          let icon = <Clock size={14} />;
          let badgeVariant = 'neutral';

          if (status === 'Completed') {
            color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            icon = <CheckCircle2 size={14} />;
            badgeVariant = 'success';
          } else if (status === 'In Progress') {
            color = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 animate-pulse';
            icon = <Play size={14} />;
            badgeVariant = 'info';
          }

          return (
            <div key={name} className="relative flex items-start justify-between gap-4">
              {/* Vertical timeline dot */}
              <div className={`absolute -left-[35px] top-1 w-6.5 h-6.5 rounded-full border flex items-center justify-center ${color}`}>
                {icon}
              </div>

              {/* Milestone Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs font-semibold ${status !== 'Pending' ? 'text-white' : 'text-slate-500'}`}>
                    {index + 1}. {name}
                  </h4>
                  <Badge variant={badgeVariant}>{status}</Badge>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {name === 'Site Survey' && 'Physical analysis of rooftop structure, shadows, and load capability'}
                  {name === 'Design Approval' && 'CAD structural layouts and single-line electrical diagrams approved'}
                  {name === 'Material Procurement' && 'Dispatch of solar panels, hybrid inverters, mounting rails, and DC cables'}
                  {name === 'Structure Installation' && 'Anchoring and erection of hot-dip galvanized mounting structures'}
                  {name === 'Panel Installation' && 'Erection and wiring of solar panel array'}
                  {name === 'Commissioning' && 'Inverter connections, DCDB/ACDB wiring, and inverter commissioning'}
                  {name === 'Net Metering Application' && 'DISCOM approvals, dual-energy meter installation, solar grid sync'}
                </p>
              </div>

              {/* Action Button */}
              {status !== 'Completed' && (
                <Button
                  onClick={() => handleStatusChange(name, status)}
                  loading={updating === name}
                  variant={status === 'Pending' ? 'secondary' : 'primary'}
                  className="px-2.5 py-1 text-[10px] shrink-0"
                >
                  {status === 'Pending' ? 'Start' : 'Complete'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
