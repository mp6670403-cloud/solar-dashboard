/**
 * projects/ProjectModule.jsx — Project Management panel for Solar EPC sites
 * 
 * Displays:
 * - Summary stats: Active Projects, Avg. Capacity (kW), Completed sites
 * - Projects List with capacity, current milestone, status, start & completion dates
 * - Selecting a project opens the MilestoneTracker timeline on the right side
 */

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import MilestoneTracker from './MilestoneTracker';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import AIInsights from '../dashboard/AIInsights';
import {
  FolderKanban,
  Zap,
  MapPin,
  Calendar,
  Layers,
  Phone,
  RefreshCw,
  Search,
  Download,
  Printer,
} from 'lucide-react';

const DEMO_PROJECTS = [
  { id: 1, project_name: 'Bansal Residence 8kW Rooftop', customer_name: 'Kavita Bansal', customer_phone: '9876001234', site_address: '42, Green Park Colony, Jaipur', kw_capacity: 8, project_value: 480000, current_milestone: 'Panel Installation', status: 'In Progress', start_date: '2026-06-10', expected_completion: '2026-07-15' },
  { id: 2, project_name: 'Choudhary Factory 50kW Commercial', customer_name: 'Mahesh Choudhary', customer_phone: '9334455667', site_address: '1201, RIICO Industrial Area, Bhiwadi', kw_capacity: 50, project_value: 2800000, current_milestone: 'Commissioning', status: 'In Progress', start_date: '2025-12-01', expected_completion: '2026-06-30' },
  { id: 3, project_name: 'Mehta Group 100kW Industrial', customer_name: 'Sanjay Mehta', customer_phone: '9445566778', site_address: '78, MG Road, Ahmedabad', kw_capacity: 100, project_value: 5500000, current_milestone: 'Net Metering Application', status: 'Completed', start_date: '2025-09-01', expected_completion: '2026-03-15' }
];

const DEMO_MILESTONES = {
  1: [
    { milestone_name: 'Site Survey', status: 'Completed' },
    { milestone_name: 'Design Approval', status: 'Completed' },
    { milestone_name: 'Material Procurement', status: 'Completed' },
    { milestone_name: 'Structure Installation', status: 'Completed' },
    { milestone_name: 'Panel Installation', status: 'In Progress' }
  ],
  2: [
    { milestone_name: 'Site Survey', status: 'Completed' },
    { milestone_name: 'Design Approval', status: 'Completed' },
    { milestone_name: 'Material Procurement', status: 'Completed' },
    { milestone_name: 'Structure Installation', status: 'Completed' },
    { milestone_name: 'Panel Installation', status: 'Completed' },
    { milestone_name: 'Commissioning', status: 'In Progress' }
  ],
  3: [
    { milestone_name: 'Site Survey', status: 'Completed' },
    { milestone_name: 'Design Approval', status: 'Completed' },
    { milestone_name: 'Material Procurement', status: 'Completed' },
    { milestone_name: 'Structure Installation', status: 'Completed' },
    { milestone_name: 'Panel Installation', status: 'Completed' },
    { milestone_name: 'Commissioning', status: 'Completed' },
    { milestone_name: 'Net Metering Application', status: 'Completed' }
  ]
};

export default function ProjectModule() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDetail, setProjectDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExportProjectsCSV = () => {
    if (filteredProjects.length === 0) return;
    const headers = ['Project ID', 'Project Name', 'Customer Name', 'Phone', 'Address', 'Capacity (kW)', 'Contract Value', 'Current Milestone', 'Status', 'Start Date', 'Expected Completion'];
    const rows = filteredProjects.map(p => [
      p.id,
      p.project_name,
      p.customer_name || '',
      p.customer_phone || '',
      p.site_address || '',
      p.kw_capacity || 0,
      p.project_value || 0,
      p.current_milestone || '',
      p.status || '',
      p.start_date || '',
      p.expected_completion || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Solar_EPC_B2B_Projects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProjectsJSON = () => {
    if (filteredProjects.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredProjects, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Solar_EPC_B2B_Projects_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('/projects');
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.warn('API error, loading demo projects:', err.message);
      setProjects(DEMO_PROJECTS);
      if (DEMO_PROJECTS.length > 0 && !selectedProjectId) {
        setSelectedProjectId(DEMO_PROJECTS[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  const fetchProjectDetail = useCallback(async (id) => {
    try {
      const detail = await apiCall(`/projects/${id}`);
      setProjectDetail(detail);
    } catch (err) {
      console.warn('API error, using demo project details for ID:', id);
      const proj = projects.find(p => p.id === id) || DEMO_PROJECTS.find(p => p.id === id);
      setProjectDetail({
        project: proj,
        milestones: DEMO_MILESTONES[id] || []
      });
    }
  }, [projects]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetail(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectDetail]);

  const handleUpdateMilestone = async (projectId, milestoneName, newStatus) => {
    try {
      await apiCall(`/projects/${projectId}/milestones`, {
        method: 'PUT',
        body: JSON.stringify({ milestone_name: milestoneName, status: newStatus })
      });
      // refresh details
      fetchProjectDetail(projectId);
      // refresh project list stats
      const updatedList = await apiCall('/projects');
      setProjects(updatedList);
    } catch (err) {
      // Local simulated fallback
      console.warn('API update failed, simulating milestone update locally:', err.message);
      setProjectDetail(prev => {
        const currentMilestones = [...prev.milestones];
        const matchIdx = currentMilestones.findIndex(m => m.milestone_name === milestoneName);
        if (matchIdx >= 0) {
          currentMilestones[matchIdx].status = newStatus;
        } else {
          currentMilestones.push({ milestone_name: milestoneName, status: newStatus });
        }
        return {
          ...prev,
          milestones: currentMilestones
        };
      });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, current_milestone: milestoneName } : p));
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(p =>
    p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const totalProjects = projects.length;
  const activeCount = projects.filter(p => p.status === 'In Progress').length;
  const totalKW = projects.reduce((acc, curr) => acc + (curr.kw_capacity || 0), 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* ── Top project stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <FolderKanban size={20} />
          </div>
          <div>
            <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Active Projects</h4>
            <div className="text-lg font-bold text-white mt-0.5">{activeCount} / {totalProjects}</div>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Rooftop Capacity Blocked</h4>
            <div className="text-lg font-bold text-white mt-0.5">{totalKW} kW</div>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Layers size={20} />
          </div>
          <div>
            <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">DISCOM Net-meterings</h4>
            <div className="text-lg font-bold text-white mt-0.5">{projects.filter(p => p.current_milestone === 'Net Metering Application').length} Pending</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ── Left Column: Projects List (5 cols) ── */}
        <div className="xl:col-span-5 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-850 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={fetchProjects}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 transition"
              title="Refresh project list"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <Button onClick={handleExportProjectsCSV} variant="secondary" className="!py-2 !px-2.5 !text-xs" title="Export CSV for Excel">
              <Download size={14} className="text-emerald-400 mr-1" /> CSV
            </Button>
            <Button onClick={handleExportProjectsJSON} variant="secondary" className="!py-2 !px-2.5 !text-xs" title="Export JSON backup">
              <Download size={14} className="text-indigo-400 mr-1" /> JSON
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4">Project / Site</th>
                  <th className="py-4 px-2">Size</th>
                  <th className="py-4 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="py-12 text-center text-xs text-slate-500">
                      Loading project records...
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-12 text-center text-xs text-slate-500">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map(proj => {
                    const isSelected = selectedProjectId === proj.id;
                    return (
                      <tr
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className={`hover:bg-slate-800/30 cursor-pointer transition-colors duration-150 ${isSelected ? 'bg-indigo-600/5 hover:bg-indigo-600/10 border-l-[3px] border-l-indigo-500' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-xs text-white">{proj.project_name}</div>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1">
                            <MapPin size={9} className="shrink-0" />
                            <span className="truncate max-w-[150px]">{proj.site_address}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-xs text-white font-mono">{proj.kw_capacity} kW</td>
                        <td className="py-3 px-2">
                          <Badge variant={proj.status === 'Completed' ? 'success' : 'warning'}>
                            {proj.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Middle Column: Milestones Timeline (4 cols) ── */}
        <div className="xl:col-span-4 space-y-4">
          {projectDetail ? (
            <>
              <div className="flex justify-end gap-2 print:hidden">
                <Button 
                  onClick={() => {
                    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                      JSON.stringify(projectDetail, null, 2)
                    )}`;
                    const link = document.createElement("a");
                    link.setAttribute("href", jsonString);
                    link.setAttribute("download", `Project_Timeline_${projectDetail.project.id || projectDetail.project.project_name.replace(/\s+/g, '_')}.json`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  variant="secondary" 
                  className="!py-1 !px-2.5 !text-[10px] flex items-center gap-1 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                >
                  <Download size={11} className="text-indigo-400" /> Export JSON
                </Button>
                <Button 
                  onClick={() => window.print()} 
                  variant="secondary" 
                  className="!py-1 !px-2.5 !text-[10px] flex items-center gap-1 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                >
                  <Printer size={11} /> Print Timeline
                </Button>
              </div>
              <MilestoneTracker
                project={projectDetail.project}
                milestones={projectDetail.milestones}
                onUpdateMilestone={handleUpdateMilestone}
              />
            </>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center text-xs text-slate-500">
              Select a project on the left to track installation milestones.
            </div>
          )}
        </div>

        {/* ── Right Column: AI Insights (3 cols) ── */}
        <div className="xl:col-span-3 xl:sticky xl:top-8 bg-slate-900/30 backdrop-blur-md rounded-xl p-5 border border-slate-800/80">
          <AIInsights module="projects" />
        </div>

      </div>

    </div>
  );
}
