'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import {
  Camera,
  Compass,
  CheckCircle2,
  FileText,
  Clock,
  IndianRupee,
  Briefcase,
  AlertCircle,
  Phone,
  MessageSquare,
  ShieldCheck,
  Cpu,
  Zap,
  TrendingUp,
  Download,
  Trash2,
  UserCheck,
  Send,
  Upload
} from 'lucide-react';

export default function MobileAppPortal({ user, initialMode = 'employee' }) {
  const [activePortal, setActivePortal] = useState(initialMode); // 'employee' or 'customer'
  const [activeTab, setActiveTab] = useState('survey'); // employee tabs: 'survey', 'attendance', 'tasks', 'expense'. customer tabs: 'track', 'telemetry', 'support', 'docs'

  // Common States
  const [loading, setLoading] = useState(false);

  // === EMPLOYEE STATE ===
  const [selfieCheckIn, setSelfieCheckIn] = useState(null);
  const [locationLock, setLocationLock] = useState(null);
  const [safetyCleared, setSafetyCleared] = useState(false);
  const [safetyChecks, setSafetyChecks] = useState({ helmet: false, harness: false, boots: false });
  const [safetySelfie, setSafetySelfie] = useState(null);
  const [surveyForm, setSurveyForm] = useState({
    clientName: 'Rajesh Sharma',
    roofArea: 600,
    roofType: 'RCC Flat Roof',
    sanctionedLoad: 6,
    meterNo: 'DISCOM-M-88210',
    cableDistance: 45,
    gpsLat: '',
    gpsLng: '',
    photo: '',
    structural_layout: '',
    notes: ''
  });
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [scanningRoof, setScanningRoof] = useState(false);

  // === CUSTOMER STATE ===
  const [projectId, setProjectId] = useState('B2C-1001');
  const [customerName, setCustomerName] = useState('Rajesh Sharma');
  const [systemCapacity, setSystemCapacity] = useState(5); // 5 kW
  const [ticketsList, setTicketsList] = useState([]);
  const [ticketForm, setTicketForm] = useState({ type: 'Low Generation', description: '', photo: '' });
  const [cleaningDate, setCleaningDate] = useState('');
  const [cleaningList, setCleaningList] = useState([]);

  // Auto-lock Geolocation on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationLock({
            lat: pos.coords.latitude.toFixed(4),
            lng: pos.coords.longitude.toFixed(4)
          });
          setSurveyForm(prev => ({
            ...prev,
            gpsLat: pos.coords.latitude.toFixed(4),
            gpsLng: pos.coords.longitude.toFixed(4)
          }));
        },
        () => {
          setLocationLock({ lat: '26.9124', lng: '75.7873' }); // Jaipur default fallback
        }
      );
    }
  }, []);

  // Fetch customer tickets / cleanings if active
  useEffect(() => {
    if (activePortal === 'customer') {
      apiCall(`/customer/tickets/${projectId}`).then(res => setTicketsList(res || []));
      apiCall(`/customer/cleaning/${projectId}`).then(res => setCleaningList(res || []));
    }
  }, [activePortal, projectId]);

  // Handle Employee Attendance Check-in
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/field/attendance', {
        method: 'POST',
        body: JSON.stringify({
          check_in: new Date().toLocaleTimeString(),
          current_activity: 'Logged check-in selfie from Mobile Field App',
          selfie: 'data:image/png;base64,demo_selfie_base64_placeholder',
          latitude: locationLock?.lat || '26.9124',
          longitude: locationLock?.lng || '75.7873'
        })
      });
      if (res) {
        setSelfieCheckIn(res.check_in);
        alert('Check-In marked successfully with GPS coordinates!');
      }
    } catch (err) {
      setSelfieCheckIn(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  // Handle Safety SOP checks selfie capture
  const handleSafetySubmit = async (e) => {
    e.preventDefault();
    if (!safetyChecks.helmet || !safetyChecks.harness || !safetyChecks.boots) {
      alert('Please check all safety items first.');
      return;
    }
    setLoading(true);
    try {
      await apiCall('/field/safety-sop', {
        method: 'POST',
        body: JSON.stringify({
          itemsChecked: Object.keys(safetyChecks),
          selfieProof: 'data:image/png;base64,demo_safety_selfie'
        })
      });
      setSafetyCleared(true);
      alert('Safety SOP parameters locked! Feasibility Form unlocked.');
    } catch (err) {
      setSafetyCleared(true);
    } finally {
      setLoading(false);
    }
  };

  // Run AI survey on employee inputs
  const runAiSurveyRecommendation = async () => {
    setScanningRoof(true);
    try {
      const res = await apiCall('/survey/recommend-design', {
        method: 'POST',
        body: JSON.stringify({
          capacity: 5,
          roof_area: surveyForm.roofArea,
          roof_type: surveyForm.roofType,
          sanctioned_load: surveyForm.sanctionedLoad
        })
      });
      if (res) {
        setSurveyForm(prev => ({
          ...prev,
          structural_layout: res.structural_layout,
          notes: res.design_notes
        }));
        setAiAnalysisResult({
          score: 95,
          obstacles: 'None near panels',
          health: 'Excellent base slab stability.'
        });
        alert('Surya AI generated layout design suggestions successfully!');
      }
    } catch (err) {
      alert('AI Recommendation failed: ' + err.message);
    } finally {
      setScanningRoof(false);
    }
  };

  // Handle Customer support tickets
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiCall('/customer/ticket', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          customer_name: customerName,
          issue_type: ticketForm.type,
          description: ticketForm.description
        })
      });
      if (res && res.ticket) {
        setTicketsList(prev => [res.ticket, ...prev]);
        setTicketForm({ type: 'Low Generation', description: '', photo: '' });
        alert('Complaint logged. Surya AI has assigned a priority engineer.');
      }
    } catch (err) {
      alert('Failed to log ticket');
    } finally {
      setLoading(false);
    }
  };

  // Handle Cleaning bookings
  const handleBookCleaning = async (e) => {
    e.preventDefault();
    if (!cleaningDate) return;
    setLoading(true);
    try {
      const res = await apiCall('/customer/schedule-cleaning', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          customer_name: customerName,
          preferred_date: cleaningDate,
          cleaning_frequency: 'Bi-Weekly'
        })
      });
      if (res && res.schedule) {
        setCleaningList(prev => [res.schedule, ...prev]);
        setCleaningDate('');
        alert('Cleaning appointment scheduled successfully!');
      }
    } catch (err) {
      alert('Failed to schedule cleaning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[420px] mx-auto min-h-screen bg-slate-950 border-x border-slate-900 text-slate-100 flex flex-col font-sans relative shadow-2xl">
      {/* --- PORTAL HEADER CONTROLLER --- */}
      <div className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 p-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
            ☀️
          </div>
          <div>
            <h4 className="text-xs font-black text-white tracking-wide uppercase">SunCraft Power</h4>
            <p className="text-[9px] text-indigo-400 font-semibold tracking-wider uppercase">Field Sync v2.0</p>
          </div>
        </div>

        <select
          value={activePortal}
          onChange={(e) => {
            setActivePortal(e.target.value);
            setActiveTab(e.target.value === 'employee' ? 'survey' : 'track');
          }}
          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="employee">👷 Field Staff</option>
          <option value="customer">👨 Customer</option>
        </select>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <main className="flex-1 p-4 overflow-y-auto pb-24">
        {activePortal === 'employee' ? (
          /* ========================================================================= */
          /* ======================== EMPLOYEE WORKSPACE ============================= */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Geo and Check-in Widget */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3.5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attendance Lock</span>
                <Badge variant={selfieCheckIn ? "success" : "warning"}>
                  {selfieCheckIn ? "Checked-In" : "Check-in Pending"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                <div>Lat: <span className="text-slate-200">{locationLock?.lat || 'Fetching...'}</span></div>
                <div>Lng: <span className="text-slate-200">{locationLock?.lng || 'Fetching...'}</span></div>
              </div>

              {!selfieCheckIn ? (
                <div className="space-y-2">
                  <div className="flex justify-center border border-dashed border-slate-800 rounded-lg p-3 bg-slate-950 cursor-pointer hover:bg-slate-900/50">
                    <div className="text-center">
                      <Camera size={20} className="mx-auto text-slate-500 mb-1" />
                      <span className="text-[9px] text-slate-400 block font-medium">Tap to snap Selfie</span>
                    </div>
                  </div>
                  <Button onClick={handleCheckIn} variant="primary" className="w-full !py-2 text-xs font-semibold">
                    Mark Daily Attendance
                  </Button>
                </div>
              ) : (
                <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center justify-center font-bold">
                  ✓ Attendance registered at {selfieCheckIn}
                </div>
              )}
            </div>

            {/* Employee Tab Contents */}
            {activeTab === 'survey' && (
              <div className="space-y-4">
                {/* 1. Mandatory Safety Checklist */}
                {!safetyCleared ? (
                  <form onSubmit={handleSafetySubmit} className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-4">
                    <h5 className="text-[11px] text-amber-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      ⚠️ Pre-Work Safety SOP Audit
                    </h5>
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={safetyChecks.helmet}
                          onChange={(e) => setSafetyChecks(prev => ({ ...prev, helmet: e.target.checked }))}
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Wearing Hard Safety Helmet
                      </label>
                      <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={safetyChecks.harness}
                          onChange={(e) => setSafetyChecks(prev => ({ ...prev, harness: e.target.checked }))}
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Safety Harness Secured (Roof Anchor)
                      </label>
                      <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={safetyChecks.boots}
                          onChange={(e) => setSafetyChecks(prev => ({ ...prev, boots: e.target.checked }))}
                          className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Insulated Grip Safety Shoes Worn
                      </label>
                    </div>

                    <div className="border border-dashed border-slate-800 rounded-lg p-3 bg-slate-950 text-center cursor-pointer">
                      <Camera size={18} className="mx-auto text-slate-500 mb-1" />
                      <span className="text-[9px] text-slate-400 block font-medium">Snap Safety Gear Selfie</span>
                    </div>

                    <Button type="submit" variant="secondary" className="w-full !py-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 text-xs font-bold uppercase tracking-wider">
                      Verify & Unlock Survey
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); alert('Site feasibility synced to manager!'); }} className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h5 className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-wide">
                        📝 Feasibility & Measurements
                      </h5>
                      <span className="text-[8px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded uppercase font-black font-mono">
                        Safety Checked
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Rooftop Area (sq ft)</label>
                        <input
                          type="number"
                          value={surveyForm.roofArea}
                          onChange={(e) => setSurveyForm(prev => ({ ...prev, roofArea: parseInt(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Roofing Structure Type</label>
                        <select
                          value={surveyForm.roofType}
                          onChange={(e) => setSurveyForm(prev => ({ ...prev, roofType: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="RCC Flat Roof">RCC Flat Roof</option>
                          <option value="Tin Sheet Roof">Tin Sheet Roof</option>
                          <option value="Tiled Roof">Tiled Roof</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Sanctioned Load (kW)</label>
                          <input
                            type="number"
                            value={surveyForm.sanctionedLoad}
                            onChange={(e) => setSurveyForm(prev => ({ ...prev, sanctionedLoad: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Cable Distance (m)</label>
                          <input
                            type="number"
                            value={surveyForm.cableDistance}
                            onChange={(e) => setSurveyForm(prev => ({ ...prev, cableDistance: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Snap roof photos */}
                      <div className="border border-dashed border-slate-800 rounded-lg p-3 bg-slate-950 text-center cursor-pointer">
                        <Camera size={16} className="mx-auto text-slate-500 mb-1" />
                        <span className="text-[9px] text-slate-400 block font-medium">Capture Roof Layout Photo</span>
                      </div>

                      {/* AI Layout Button */}
                      <Button type="button" onClick={runAiSurveyRecommendation} disabled={scanningRoof} variant="secondary" className="w-full !py-2 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold">
                        {scanningRoof ? 'Surya AI analysis running...' : 'Run Auto-Design with Surya AI'}
                      </Button>

                      {aiAnalysisResult && (
                        <div className="bg-slate-950 rounded-lg border border-slate-850 p-2.5 text-[9px] font-mono space-y-1.5">
                          <div className="text-amber-400 font-bold uppercase tracking-wider border-b border-slate-900 pb-1 flex justify-between">
                            <span>Surya AI Analysis</span>
                            <span className="text-emerald-400 font-black">Score: {aiAnalysisResult.score}%</span>
                          </div>
                          <div>Obstacles: <span className="text-slate-300">{aiAnalysisResult.obstacles}</span></div>
                          <div>Health: <span className="text-slate-300">{aiAnalysisResult.health}</span></div>
                          {surveyForm.structural_layout && (
                            <div>Mount Layout: <span className="text-indigo-300 font-bold">{surveyForm.structural_layout}</span></div>
                          )}
                          {surveyForm.notes && (
                            <div className="mt-1 pt-1 border-t border-slate-900 text-slate-400 leading-relaxed italic">"{surveyForm.notes}"</div>
                          )}
                        </div>
                      )}

                      {/* Digital signature canvas mock */}
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 uppercase font-black block">Customer Sign-Off Screen</label>
                        <div className="w-full bg-slate-950 border border-slate-800 rounded h-16 flex items-center justify-center text-[10px] text-slate-600 font-mono italic cursor-pointer select-none">
                          Sign here to finalize report
                        </div>
                      </div>

                      <Button type="submit" variant="primary" className="w-full !py-2 text-xs font-bold uppercase tracking-wider mt-2">
                        Submit Feasibility & Design
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* ======================== CUSTOMER PORTAL ================================ */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Live Progress Tracker */}
            {activeTab === 'track' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h5 className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-wide">
                      📊 Installation Milestones
                    </h5>
                    <span className="text-[9px] text-slate-400 font-bold font-mono">ID: {projectId}</span>
                  </div>

                  <div className="relative border-l border-slate-800 pl-4 space-y-5 py-1 text-[11px]">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 flex items-center justify-center" />
                      <div className="font-bold text-slate-200">Site Survey & Feasibility Done</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">Completed by Suresh Patel &bull; 18 June</div>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
                      <div className="font-bold text-slate-200">Material Procurement Complete</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">Panels & Inverters reserved at store &bull; 20 June</div>
                    </div>

                    <div className="relative animate-pulse">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/10" />
                      <div className="font-black text-amber-400">Panel & Structure Installation</div>
                      <div className="text-[8px] text-slate-400 mt-0.5">Ongoing at site. Structure completion by tomorrow.</div>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-slate-800" />
                      <div className="font-bold text-slate-600">Net Metering Application</div>
                      <div className="text-[8px] text-slate-600 mt-0.5">Pending physical installation.</div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                      🚨
                    </div>
                    <div>
                      <h6 className="text-[10px] font-black text-white uppercase">Technical Emergency?</h6>
                      <p className="text-[8px] text-slate-500">Sparking, structure hazard, fault</p>
                    </div>
                  </div>
                  <a href="tel:+918081012213" className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition">
                    <Phone size={10} /> Call SOS
                  </a>
                </div>
              </div>
            )}

            {/* Customer Generation Telemetry */}
            {activeTab === 'telemetry' && (
              <div className="space-y-4">
                {/* Generation Card */}
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h5 className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <Cpu size={12} className="text-emerald-400" /> Generation Telemetry
                    </h5>
                    <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Live Output</span>
                      <span className="text-xl font-black text-white font-mono block mt-1">4.65 <span className="text-[10px] text-indigo-400">kW</span></span>
                    </div>
                    <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                      <span className="text-[8px] text-slate-500 uppercase font-black block">Today's Yield</span>
                      <span className="text-xl font-black text-white font-mono block mt-1">19.36 <span className="text-[10px] text-indigo-400">kWh</span></span>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">Accumulated Savings</span>
                      <span className="text-emerald-400 font-black font-mono">₹45,820 Saved</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-medium">Carbon Prevented</span>
                      <span className="text-indigo-400 font-black font-mono">165.5 kg CO2</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Helpdesk & Support tickets */}
            {activeTab === 'support' && (
              <div className="space-y-4">
                {/* Book cleaning Form */}
                <form onSubmit={handleBookCleaning} className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-3">
                  <h5 className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-wide border-b border-slate-800 pb-2">
                    🧼 Book Panel Cleaning Service
                  </h5>
                  <div>
                    <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Preferred Visit Date</label>
                    <input
                      type="date"
                      value={cleaningDate}
                      onChange={(e) => setCleaningDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" className="w-full !py-2 text-xs font-bold uppercase tracking-wider">
                    Schedule Cleaning
                  </Button>

                  {cleaningList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
                      <label className="text-[8px] text-slate-500 uppercase font-black block">Scheduled Visits</label>
                      {cleaningList.map(item => (
                        <div key={item.id} className="bg-slate-950 rounded p-2 text-[10px] flex justify-between items-center font-mono">
                          <span>{item.preferred_date} &bull; Bi-Weekly</span>
                          <span className="text-emerald-400 font-bold uppercase text-[8px]">{item.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </form>

                {/* Complaint Support Ticket Form */}
                <form onSubmit={handleRaiseTicket} className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-3">
                  <h5 className="text-[11px] text-rose-400 font-extrabold uppercase tracking-wide border-b border-slate-800 pb-2 flex items-center gap-1">
                    🔧 Log Technical Issue / Ticket
                  </h5>
                  <div>
                    <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Issue Category</label>
                    <select
                      value={ticketForm.type}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Low Generation">Low Generation</option>
                      <option value="Inverter Offline">Inverter Offline</option>
                      <option value="Physical Damaged Structure">Physical Damaged Structure</option>
                      <option value="Net-meter Discrepancy">Net-meter Discrepancy</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Describe the Issue</label>
                    <textarea
                      rows={3}
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Explain the problem in detail. Surya AI will review..."
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <Button type="submit" variant="secondary" className="w-full !py-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs font-bold uppercase tracking-wider">
                    Submit Support Ticket
                  </Button>

                  {/* Active tickets */}
                  {ticketsList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                      <label className="text-[8px] text-slate-500 uppercase font-black block">My Support Tickets</label>
                      {ticketsList.map(t => (
                        <div key={t.id} className="bg-slate-950 rounded border border-slate-850 p-2.5 text-[9px] space-y-1 font-mono">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-200">{t.issue_type}</span>
                            <span className="text-amber-400 uppercase text-[8px]">{t.status}</span>
                          </div>
                          <div className="text-slate-400 italic leading-relaxed">"{t.description}"</div>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- FOOTER NAV BAR (MOBILE LOOK) --- */}
      <footer className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 h-16 grid grid-cols-4 items-center text-center px-2 z-40">
        {activePortal === 'employee' ? (
          <>
            <button
              onClick={() => setActiveTab('survey')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'survey' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FileText size={18} className="mb-0.5" />
              Survey
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'attendance' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <UserCheck size={18} className="mb-0.5" />
              Check-In
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'tasks' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Briefcase size={18} className="mb-0.5" />
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'expense' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Upload size={18} className="mb-0.5" />
              Expense
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'track' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Clock size={18} className="mb-0.5" />
              Tracker
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'telemetry' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Cpu size={18} className="mb-0.5" />
              Telemetry
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'support' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <AlertCircle size={18} className="mb-0.5" />
              Support
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'docs' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FileText size={18} className="mb-0.5" />
              Docs
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
