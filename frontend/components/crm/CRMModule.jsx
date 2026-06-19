/**
 * crm/CRMModule.jsx — Full CRM (Customer Relationship Manager) module
 * 
 * Features:
 * - Pipeline stage tabs at top: All, New Inquiry, Site Survey, Proposal Sent, Negotiation, Won, Lost
 * - Lead data table with columns: Name, Phone, Source, Stage, kW, AI Score, Assigned To, Date
 * - "Add New Lead" button opens the LeadForm modal
 * - Click on a lead row to view detail in a side panel
 * - Stats summary cards at top: Total Leads, Hot Leads (score≥80), Conversion Rate
 * - Fetches from /api/crm/leads with graceful fallback to demo data
 * - Search/filter functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import LeadForm from './LeadForm';
import ProposalGenerator from './ProposalGenerator';
import LeadFollowUpLog from './LeadFollowUpLog';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import AIInsights from '../dashboard/AIInsights';
import {
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  X,
  Users,
  Flame,
  TrendingUp,
  RefreshCw,
  Download
} from 'lucide-react';

// Pipeline stages with colors
const B2B_STAGES = [
  { id: 'all',           label: 'All Leads',        color: 'neutral' },
  { id: 'New Inquiry',   label: 'New Inquiry',      color: 'info' },
  { id: 'Requirements',  label: 'Requirements',     color: 'info' },
  { id: 'Quote Sent',    label: 'Quote Sent',       color: 'warning' },
  { id: 'Negotiation',   label: 'Negotiation',      color: 'warning' },
  { id: 'Onboarded',     label: 'Onboarded/Won',    color: 'success' },
  { id: 'Lost',          label: 'Lost',             color: 'danger' },
];

const B2C_STAGES = [
  { id: 'all',           label: 'All Leads',        color: 'neutral' },
  { id: 'New Lead',      label: 'New Lead',         color: 'info' },
  { id: 'Tele-qualified',label: 'Tele-qualified',   color: 'indigo' },
  { id: 'Site Survey',   label: 'Site Survey',      color: 'warning' },
  { id: 'AI Proposal',   label: 'AI Proposal Sent', color: 'primary' },
  { id: 'Won',           label: 'Closed Won',       color: 'success' },
  { id: 'Lost',          label: 'Lost',             color: 'danger' },
];


// Demo leads for when backend is offline
const DEMO_LEADS = [
  { id: 1, name: 'Rajesh Patel',   phone: '9876543210', email: 'rajesh@example.com', source: 'WhatsApp', stage: 'Site Survey',   kw_capacity: 10, ai_score: 85, assigned_to: 'Vikram', created_at: '2026-06-18', city: 'Rajkot' },
  { id: 2, name: 'Meena Shah',     phone: '9876543211', email: 'meena@example.com',  source: 'Referral',  stage: 'Proposal Sent', kw_capacity: 5,  ai_score: 72, assigned_to: 'Ankit',  created_at: '2026-06-17', city: 'Ahmedabad' },
  { id: 3, name: 'Amit Joshi',     phone: '9876543212', email: 'amit@example.com',   source: 'Website',   stage: 'New Inquiry',   kw_capacity: 15, ai_score: 91, assigned_to: 'Vikram', created_at: '2026-06-17', city: 'Surat' },
  { id: 4, name: 'Priya Desai',    phone: '9876543213', email: 'priya@example.com',  source: 'Manual',    stage: 'Negotiation',   kw_capacity: 8,  ai_score: 68, assigned_to: 'Ravi',   created_at: '2026-06-16', city: 'Vadodara' },
  { id: 5, name: 'Suresh Mehta',   phone: '9876543214', email: 'suresh@example.com', source: 'WhatsApp',  stage: 'New Inquiry',   kw_capacity: 20, ai_score: 78, assigned_to: 'Ankit',  created_at: '2026-06-16', city: 'Rajkot' },
  { id: 6, name: 'Kavita Sharma',  phone: '9876543215', email: 'kavita@example.com', source: 'Website',   stage: 'Won',           kw_capacity: 12, ai_score: 94, assigned_to: 'Vikram', created_at: '2026-06-15', city: 'Jamnagar' },
  { id: 7, name: 'Dinesh Trivedi', phone: '9876543216', email: 'dinesh@example.com', source: 'Referral',  stage: 'Lost',          kw_capacity: 6,  ai_score: 35, assigned_to: 'Ravi',   created_at: '2026-06-14', city: 'Bhavnagar' },
  { id: 8, name: 'Neha Parmar',    phone: '9876543217', email: 'neha@example.com',   source: 'WhatsApp',  stage: 'Site Survey',   kw_capacity: 25, ai_score: 88, assigned_to: 'Ankit',  created_at: '2026-06-14', city: 'Ahmedabad' },
];

const B2B_DEMO_LEADS = [
  { id: 1, name: 'Eco Solar Traders', phone: '9876123450', email: 'eco.solar@gmail.com', source: 'WhatsApp', stage: 'Negotiation', kw_capacity: 150, ai_score: 88, assigned_to: 'Ankit Sharma', created_at: '2026-06-18', city: 'Gandhinagar' },
  { id: 2, name: 'Sunbeam Energy Solutions', phone: '9123098765', email: 'sunbeam.energy@outlook.com', source: 'Website', stage: 'Quote Sent', kw_capacity: 50, ai_score: 75, assigned_to: 'Ankit Sharma', created_at: '2026-06-17', city: 'Vadodara' },
  { id: 3, name: 'Bright Future Panels', phone: '9998877665', email: 'bright.future@yahoo.com', source: 'Referral', stage: 'New Inquiry', kw_capacity: 120, ai_score: 92, assigned_to: 'Ankit Sharma', created_at: '2026-06-16', city: 'Bhavnagar' },
  { id: 4, name: 'GreenGrid Suppliers', phone: '9812345670', email: 'greengrid@corp.in', source: 'IndiaMART', stage: 'Onboarded', kw_capacity: 200, ai_score: 95, assigned_to: 'Ankit Sharma', created_at: '2026-06-14', city: 'Surat' }
];

export default function CRMModule({ user }) {
  const isB2B = user?.designation === 'B2B Sales';
  const [leads, setLeads] = useState(isB2B ? B2B_DEMO_LEADS : DEMO_LEADS);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showProposal, setShowProposal] = useState(false);

  // Export current filtered leads to CSV (Excel format)
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ['ID', 'Name', 'Phone', 'Email', 'Source', 'Stage', 'Capacity (kW)', 'AI Score', 'Assigned To', 'Date', 'City'];
    const rows = filteredLeads.map(l => [
      l.id,
      l.name,
      l.phone,
      l.email || '',
      l.source,
      l.stage,
      l.kw_capacity || 0,
      l.ai_score || 0,
      l.assigned_to || '',
      l.created_at || '',
      l.city || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Solar_EPC_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export current filtered leads to JSON
  const handleExportJSON = () => {
    if (filteredLeads.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredLeads, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Solar_EPC_Leads_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  // Fetch leads from API
  const fetchLeads = useCallback(async () => {
    if (isB2B) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiCall('/crm/leads');
      if (data?.leads?.length > 0) {
        setLeads(data.leads);
      } else if (Array.isArray(data) && data.length > 0) {
        setLeads(data);
      }
    } catch {
      // Use demo data
    } finally {
      setLoading(false);
    }
  }, [isB2B]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Filter leads by stage and search term
  const filteredLeads = leads.filter((lead) => {
    const matchesStage = activeStage === 'all' || lead.stage === activeStage;
    const matchesSearch = searchTerm === '' ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.city?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStage && matchesSearch;
  });

  // Compute summary stats
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.ai_score >= 80).length;
  const wonLeads = leads.filter((l) => l.stage === 'Won' || l.stage === 'Onboarded').length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

  // Stage badge color
  const getStageBadge = (stage) => {
    const map = {
      'New Inquiry':   'info',
      'Requirements':  'info',
      'Quote Sent':    'warning',
      'Negotiation':   'warning',
      'Onboarded':     'success',
      'Lost':          'danger',
      // fallback
      'Site Survey':   'info',
      'Proposal Sent': 'warning',
      'Won':           'success',
    };
    return map[stage] || 'neutral';
  };

  // AI score color
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{wonLeads}</p>
            <p className="text-[11px] text-slate-400">Past Clients (Completed/Won)</p>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Users size={18} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalLeads - wonLeads}</p>
            <p className="text-[11px] text-slate-400">Ongoing Conversations</p>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Flame size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{hotLeads}</p>
            <p className="text-[11px] text-slate-400">Hot Leads (Score ≥ 80)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left main CRM workspace */}
        <div className="xl:col-span-9 space-y-6">
          {/* ═══ Stage Tabs + Actions Bar ═══ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Pipeline stage tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(isB2B ? B2B_STAGES : B2C_STAGES).map((stage) => {
                const isActive = activeStage === stage.id;
                const count = stage.id === 'all' ? leads.length : leads.filter((l) => l.stage === stage.id).length;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {stage.label}
                    <span className={`ml-1.5 text-[10px] ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + Add Lead */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900/50 border border-slate-800 rounded-lg pl-8 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 w-32 transition-all"
                />
              </div>
              <Button onClick={fetchLeads} variant="secondary" className="!p-2" title="Refresh leads">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </Button>
              <Button onClick={handleExportCSV} variant="secondary" className="!py-2 !px-2.5 !text-xs" title="Export CSV for Excel">
                <Download size={14} className="text-emerald-400 mr-1" /> CSV
              </Button>
              <Button onClick={handleExportJSON} variant="secondary" className="!py-2 !px-2.5 !text-xs" title="Export JSON backup">
                <Download size={14} className="text-indigo-400 mr-1" /> JSON
              </Button>
              <Button onClick={() => setShowForm(true)}>
                <UserPlus size={14} /> Add Lead
              </Button>
            </div>
          </div>

          {/* ═══ Leads Table ═══ */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-16 text-sm text-slate-500">No leads found matching your criteria.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 border-b border-slate-800">
                      <th className="px-6 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stage</th>
                      <th className="px-4 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">kW</th>
                      <th className="px-4 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">AI Score</th>
                      <th className="px-4 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assigned To</th>
                      <th className="px-4 py-3.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-800/30 transition-colors duration-150 cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-medium text-white">{lead.name}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300 font-mono">{lead.phone}</td>
                        <td className="px-4 py-3.5">
                          <Badge variant="neutral">{lead.source}</Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant={getStageBadge(lead.stage)} dot>{lead.stage}</Badge>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300">{lead.kw_capacity} kW</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-sm font-bold ${getScoreColor(lead.ai_score)}`}>{lead.ai_score}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-300">{lead.assigned_to}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-400">{lead.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right sticky AI Insight sidebar (3 cols) */}
        <div className="xl:col-span-3 xl:sticky xl:top-8 bg-slate-900/30 backdrop-blur-md rounded-xl p-5 border border-slate-800/80">
          <AIInsights module="crm" />
        </div>
      </div>

      {/* ═══ Lead Detail Side Panel ═══ */}
      {selectedLead && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-white">Lead Details</h3>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Name + Score */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedLead.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">{selectedLead.city || 'City not specified'}</p>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(selectedLead.ai_score)}`}>
                    {selectedLead.ai_score}
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase">AI Score</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={14} className="text-slate-500" />
                  <span className="text-slate-300">{selectedLead.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={14} className="text-slate-500" />
                  <span className="text-slate-300">{selectedLead.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={14} className="text-slate-500" />
                  <span className="text-slate-300">{selectedLead.created_at}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Stage',    value: selectedLead.stage },
                  { label: 'Source',   value: selectedLead.source },
                  { label: 'Capacity', value: `${selectedLead.kw_capacity} kW` },
                  { label: 'Assigned', value: selectedLead.assigned_to },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-800/40 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase">{item.label}</p>
                    <p className="text-sm font-medium text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="primary">
                  <Phone size={14} /> Call Now
                </Button>
                {!isB2B && (
                  <Button className="flex-1 bg-primary-600 hover:bg-primary-500" onClick={() => setShowProposal(true)}>
                    <Calculator size={14} /> Auto-Proposal
                  </Button>
                )}
              </div>

              {/* ── Communication Log ── */}
              <LeadFollowUpLog leadId={selectedLead.id} />

            </div>
          </div>
        </div>
      )}

      {/* ═══ Auto Proposal Modal ═══ */}
      <Modal isOpen={showProposal} onClose={() => setShowProposal(false)} title="Generate Proposal" maxWidth="max-w-4xl">
         {selectedLead && <ProposalGenerator lead={selectedLead} />}
      </Modal>

      {/* ═══ Add Lead Modal ═══ */}
      <LeadForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchLeads}
      />
    </div>
  );
}
