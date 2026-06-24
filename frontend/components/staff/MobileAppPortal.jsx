'use client';

import { useState, useEffect, useRef } from 'react';
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
  Upload,
  Lock,
  User,
  Check,
  RefreshCw,
  LogOut,
  Calendar,
  HelpCircle,
  Smartphone
} from 'lucide-react';

export default function MobileAppPortal({ user: globalUser }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'employee' });
  const [activePortal, setActivePortal] = useState('employee'); // 'employee' or 'customer'
  const [activeTab, setActiveTab] = useState('survey'); // employee: 'survey', 'attendance', 'tasks', 'expense', 'aichat'. customer: 'track', 'telemetry', 'support', 'docs'

  // Employee Login Role mapping
  const [currentUser, setCurrentUser] = useState(null);

  // States
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

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

  // Task checklist with photo verification
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Verify GI structure alignment', status: 'Pending', proofRequired: true, proofUploaded: false },
    { id: 2, title: 'Check Growatt inverter safety seals', status: 'Pending', proofRequired: true, proofUploaded: false },
    { id: 3, title: 'Upload JCR commissioning forms', status: 'Completed', proofRequired: false, proofUploaded: false }
  ]);

  // Expenses state
  const [expenses, setExpenses] = useState([
    { id: 1, type: 'Petrol Allowances', amount: 850, date: '2026-06-23', status: 'Approved' },
    { id: 2, type: 'Structure Screws Local Purchase', amount: 1500, date: '2026-06-24', status: 'Pending' }
  ]);
  const [newExpense, setNewExpense] = useState({ type: 'Petrol', amount: '', desc: '', receipt: '' });

  // Surya AI Assistant Field Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'surya', text: 'Hello! I am Surya, your on-site AI helper. Ask me about inverter error codes, structure tilt angles, or safety regulations.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Leaves & Attendance summary
  const [leaveDays, setLeaveDays] = useState(12);
  const [appliedLeave, setAppliedLeave] = useState({ start: '', end: '', reason: '' });

  // === CUSTOMER STATE ===
  const [projectId, setProjectId] = useState('B2C-1001');
  const [customerName, setCustomerName] = useState('Rajesh Sharma');
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
    if (isAuthenticated && activePortal === 'customer') {
      apiCall(`/customer/tickets/${projectId}`).then(res => setTicketsList(res || []));
      apiCall(`/customer/cleaning/${projectId}`).then(res => setCleaningList(res || []));
    }
  }, [isAuthenticated, activePortal, projectId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (loginForm.role === 'employee') {
        if (loginForm.username === 'suresh' && loginForm.password === 'suresh123') {
          setCurrentUser({ username: 'Suresh Patel', designation: 'Operations Technician' });
          setIsAuthenticated(true);
          setActivePortal('employee');
          setActiveTab('survey');
        } else {
          alert('Invalid Employee credentials. (Use suresh / suresh123)');
        }
      } else {
        if (loginForm.username === 'rajesh' && loginForm.password === 'rajesh123') {
          setCurrentUser({ username: 'Rajesh Sharma', designation: 'Customer' });
          setIsAuthenticated(true);
          setActivePortal('customer');
          setActiveTab('track');
        } else {
          alert('Invalid Customer credentials. (Use rajesh / rajesh123)');
        }
      }
      setLoading(false);
    }, 800);
  };

  // Sign out
  const handleSignOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginForm({ username: '', password: '', role: 'employee' });
  };

  // Handle Employee Attendance Check-in
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/field/attendance', {
        method: 'POST',
        body: JSON.stringify({
          check_in: new Date().toLocaleTimeString(),
          current_activity: 'Logged check-in selfie from Mobile Field App',
          selfie: 'data:image/png;base64,demo_selfie',
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

  // Field Chatbot Message Submit
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput('');

    setTimeout(() => {
      let replyText = "I'm analyzing the database to answer your query.";
      const lowInput = input.toLowerCase();
      if (lowInput.includes('tilt') || lowInput.includes('angle')) {
        replyText = "For Lucknow/Jaipur latitudes, the optimal south-facing tilt angle is 12° to 15° to capture maximum year-round solar irradiance.";
      } else if (lowInput.includes('error') || lowInput.includes('growatt')) {
        replyText = "Growatt Error 102 usually indicates DC isolation voltage mismatch or high grid voltage. Check grid voltage at AC side first.";
      } else if (lowInput.includes('safety') || lowInput.includes('harness')) {
        replyText = "SOP requires anchoring the safety harness line to a rigid column or secondary anchorage point, not directly to panels or GI structure legs.";
      } else {
        replyText = `Understood. For ${input}, please ensure to clear shadows within 5 meters of the solar panel arrays to guarantee optimal performance.`;
      }
      setChatMessages(prev => [...prev, { sender: 'surya', text: replyText }]);
    }, 600);
  };

  // Upload proof photo for checklists
  const triggerProofUpload = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, proofUploaded: true, status: 'Completed' } : t));
    alert('Proof photo captured and validated by AI. Task marked Completed!');
  };

  // Add Expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.amount) return;
    const exp = {
      id: Date.now(),
      type: newExpense.type + ' Allowances: ' + (newExpense.desc || 'Trip'),
      amount: parseInt(newExpense.amount),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setExpenses(prev => [exp, ...prev]);
    setNewExpense({ type: 'Petrol', amount: '', desc: '', receipt: '' });
    alert('Expense receipt uploaded and queued for Owner approval.');
  };

  // Apply Leave
  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!appliedLeave.start) return;
    setLeaveDays(prev => prev - 1);
    setAppliedLeave({ start: '', end: '', reason: '' });
    alert('Leave request submitted to HR.');
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

  /* ========================================================================= */
  /* ======================== 1. LOGIN INTERFACE ============================= */
  /* ========================================================================= */
  if (!isAuthenticated) {
    return (
      <div className="max-w-[420px] mx-auto min-h-screen bg-slate-950 border-x border-slate-900 text-slate-100 flex flex-col font-sans relative shadow-2xl justify-center items-center p-6">
        <div className="w-full space-y-6 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30">
              <Smartphone size={32} />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight mt-3">SunCraft Power</h1>
            <p className="text-xs text-slate-500 font-medium">Field Sync & Customer Portal</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-inner backdrop-blur-xl">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex bg-slate-950 border border-slate-800/80 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setLoginForm(prev => ({ ...prev, role: 'employee' }))}
                  className={`flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${loginForm.role === 'employee' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  👷 Field Staff
                </button>
                <button
                  type="button"
                  onClick={() => setLoginForm(prev => ({ ...prev, role: 'customer' }))}
                  className={`flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition ${loginForm.role === 'customer' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  👨 Customer
                </button>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={loginForm.role === 'employee' ? "Username (e.g. suresh)" : "Username (e.g. rajesh)"}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter Access Password"
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} variant="primary" className="w-full !py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/25">
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-600 font-mono">Demo accounts: suresh/suresh123 | rajesh/rajesh123</span>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* ======================== 2. MAIN APPLICATION PORTAL ===================== */
  /* ========================================================================= */
  return (
    <div className="max-w-[420px] mx-auto min-h-screen bg-slate-950 border-x border-slate-900 text-slate-100 flex flex-col font-sans relative shadow-2xl">
      
      {/* HEADER WIDGET */}
      <div className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 p-4 border-b border-slate-800 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow shadow-indigo-600/30">
            ☀️
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-white tracking-wide uppercase">SunCraft Power</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${offlineMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
              <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">
                {offlineMode ? 'Offline Mode (Local Storage)' : 'Live Connected'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Offline mode toggle */}
          <button
            onClick={() => {
              setOfflineMode(!offlineMode);
              alert(offlineMode ? "Switched to Live mode" : "Offline mode active. All submissions will be cached locally.");
            }}
            title="Toggle Offline Cache Mode"
            className={`p-2 rounded-lg border transition ${offlineMode ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-slate-800 text-slate-500 hover:text-slate-300'}`}
          >
            <RefreshCw size={12} className={offlineMode ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Sign Out"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <main className="flex-1 p-4 overflow-y-auto pb-24 space-y-4">
        {activePortal === 'employee' ? (
          /* ========================================================================= */
          /* ======================== EMPLOYEE WORKSPACE ============================= */
          /* ========================================================================= */
          <div className="space-y-4 animate-in slide-in-from-right duration-300">
            {/* Geo and Check-in Widget */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <UserCheck size={12} className="text-indigo-400" /> Attendance Lock & Coordinates
                    </h5>
                    <Badge variant={selfieCheckIn ? "success" : "warning"}>
                      {selfieCheckIn ? "Checked-In" : "Check-in Pending"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl">
                    <div>Latitude: <span className="text-slate-200 font-bold">{locationLock?.lat || 'Fetching...'}</span></div>
                    <div>Longitude: <span className="text-slate-200 font-bold">{locationLock?.lng || 'Fetching...'}</span></div>
                  </div>

                  {!selfieCheckIn ? (
                    <div className="space-y-3">
                      <div className="flex justify-center border border-dashed border-slate-800 rounded-2xl p-4 bg-slate-950 cursor-pointer hover:bg-slate-900/50 transition">
                        <div className="text-center">
                          <Camera size={24} className="mx-auto text-slate-500 mb-1.5" />
                          <span className="text-[9px] text-slate-400 block font-medium">Tap to snap selfie</span>
                          <span className="text-[7px] text-slate-600 block mt-0.5 font-mono">Selfie checks face match</span>
                        </div>
                      </div>
                      <Button onClick={handleCheckIn} variant="primary" className="w-full !py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20">
                        Check-In Attendance
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center">
                      <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 font-bold flex items-center justify-center gap-1.5 shadow">
                        ✓ Attendance registered at {selfieCheckIn}
                      </div>

                      {/* Leaves Ledger */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-left space-y-3">
                        <div className="flex justify-between items-center text-[10px] border-b border-slate-900 pb-2">
                          <span className="text-slate-400">Monthly Leaves Remaining</span>
                          <span className="text-white font-bold font-mono">{leaveDays} Days</span>
                        </div>
                        <form onSubmit={handleApplyLeave} className="space-y-2">
                          <div className="text-[8px] text-slate-500 uppercase font-black">Apply for leave</div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={appliedLeave.start}
                              onChange={(e) => setAppliedLeave(prev => ({ ...prev, start: e.target.value }))}
                              className="bg-slate-900 border border-slate-850 rounded p-1 text-[9px] text-white"
                              required
                            />
                            <input
                              type="date"
                              value={appliedLeave.end}
                              onChange={(e) => setAppliedLeave(prev => ({ ...prev, end: e.target.value }))}
                              className="bg-slate-900 border border-slate-850 rounded p-1 text-[9px] text-white"
                              required
                            />
                          </div>
                          <input
                            type="text"
                            value={appliedLeave.reason}
                            onChange={(e) => setAppliedLeave(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Reason for leave"
                            className="w-full bg-slate-900 border border-slate-850 rounded p-1.5 text-[9px] text-white"
                            required
                          />
                          <Button type="submit" variant="secondary" className="w-full !py-1 text-[8px] font-bold uppercase">
                            Submit Leave Request
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Employee Tab: Site Survey Feasibility */}
            {activeTab === 'survey' && (
              <div className="space-y-4">
                {/* 1. Mandatory Safety Checklist */}
                {!safetyCleared ? (
                  <form onSubmit={handleSafetySubmit} className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-xl">
                    <h5 className="text-[11px] text-amber-400 font-extrabold uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-800 pb-2">
                      ⚠️ Pre-Work Safety SOP Audit
                    </h5>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 text-xs font-medium cursor-pointer bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 hover:border-slate-800 transition">
                        <input
                          type="checkbox"
                          checked={safetyChecks.helmet}
                          onChange={(e) => setSafetyChecks(prev => ({ ...prev, helmet: e.target.checked }))}
                          className="rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Wearing Hard Safety Helmet
                      </label>
                      <label className="flex items-center gap-3 text-xs font-medium cursor-pointer bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 hover:border-slate-800 transition">
                        <input
                          type="checkbox"
                          checked={safetyChecks.harness}
                          onChange={(e) => setSafetyChecks(prev => ({ ...prev, harness: e.target.checked }))}
                          className="rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Safety Harness Secured (Roof Anchor)
                      </label>
                      <label className="flex items-center gap-3 text-xs font-medium cursor-pointer bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 hover:border-slate-800 transition">
                        <input
                          type="checkbox"
                          checked={safetyChecks.boots}
                          onChange={(e) => setSafetyChecks(prev => ({ ...prev, boots: e.target.checked }))}
                          className="rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                        Insulated Grip Safety Shoes Worn
                      </label>
                    </div>

                    <div className="border border-dashed border-slate-800 rounded-2xl p-4 bg-slate-950 text-center cursor-pointer hover:bg-slate-900/50 transition">
                      <Camera size={20} className="mx-auto text-slate-500 mb-1.5" />
                      <span className="text-[9px] text-slate-400 block font-medium">Snap Safety Gear Selfie</span>
                    </div>

                    <Button type="submit" variant="secondary" className="w-full !py-2.5 rounded-xl border-amber-500/20 text-amber-400 hover:bg-amber-500/10 text-xs font-bold uppercase tracking-wider">
                      Verify & Unlock Survey
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); alert('Site feasibility synced to manager!'); }} className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-xl">
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
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Roofing Structure Type</label>
                        <select
                          value={surveyForm.roofType}
                          onChange={(e) => setSurveyForm(prev => ({ ...prev, roofType: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Cable Distance (m)</label>
                          <input
                            type="number"
                            value={surveyForm.cableDistance}
                            onChange={(e) => setSurveyForm(prev => ({ ...prev, cableDistance: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Snap roof photos */}
                      <div className="border border-dashed border-slate-800 rounded-2xl p-4 bg-slate-950 text-center cursor-pointer hover:bg-slate-900/50 transition">
                        <Camera size={20} className="mx-auto text-slate-500 mb-1" />
                        <span className="text-[9px] text-slate-400 block font-medium">Capture Roof Layout Photo</span>
                      </div>

                      {/* AI Layout Button */}
                      <Button type="button" onClick={runAiSurveyRecommendation} disabled={scanningRoof} variant="secondary" className="w-full !py-2.5 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 text-xs font-semibold rounded-xl">
                        {scanningRoof ? 'Surya AI analysis running...' : 'Run Auto-Design with Surya AI'}
                      </Button>

                      {aiAnalysisResult && (
                        <div className="bg-slate-950 rounded-xl border border-slate-850 p-3 text-[9px] font-mono space-y-2">
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
                            <div className="mt-1.5 pt-1.5 border-t border-slate-900 text-slate-400 leading-relaxed italic">"{surveyForm.notes}"</div>
                          )}
                        </div>
                      )}

                      {/* Digital signature canvas mock */}
                      <div className="space-y-1">
                        <label className="text-[8px] text-slate-500 uppercase font-black block">Customer Sign-Off Screen</label>
                        <div className="w-full bg-slate-950 border border-slate-800 rounded-lg h-16 flex items-center justify-center text-[10px] text-slate-600 font-mono italic cursor-pointer select-none">
                          Sign here to finalize report
                        </div>
                      </div>

                      <Button type="submit" variant="primary" className="w-full !py-3 text-xs font-bold uppercase tracking-wider mt-2 rounded-xl">
                        Submit Feasibility & Design
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Employee Tab: Tasks Checklist with Photo Verification */}
            {activeTab === 'tasks' && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-4 shadow-xl">
                <h5 className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-wide border-b border-slate-800 pb-2">
                  📋 My Daily Tasks & Milestones
                </h5>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <span className={`text-xs font-semibold leading-snug ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                        <Badge variant={task.status === 'Completed' ? 'success' : 'warning'}>
                          {task.status}
                        </Badge>
                      </div>

                      {task.status !== 'Completed' && task.proofRequired && (
                        <div className="flex items-center justify-between gap-3 border-t border-slate-900 pt-2">
                          <span className="text-[8px] text-rose-400 font-bold uppercase">⚠️ Camera Proof Required</span>
                          <button
                            type="button"
                            onClick={() => triggerProofUpload(task.id)}
                            className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-400 rounded text-[9px] font-bold flex items-center gap-1 transition"
                          >
                            <Camera size={10} /> Upload Proof
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employee Tab: Expense Claim Uploads */}
            {activeTab === 'expense' && (
              <div className="space-y-4">
                <form onSubmit={handleAddExpense} className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-3 shadow-xl">
                  <h5 className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-wide border-b border-slate-800 pb-2">
                    💸 Log New Expense Claim
                  </h5>

                  <div>
                    <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Expense Type</label>
                    <select
                      value={newExpense.type}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Petrol">Petrol / Fuel</option>
                      <option value="Local Material Purchase">Local Material Purchase</option>
                      <option value="Food & Travel">Food & Travel</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[8px] text-slate-500 uppercase font-black block mb-1">Description</label>
                      <input
                        type="text"
                        value={newExpense.desc}
                        onChange={(e) => setNewExpense(prev => ({ ...prev, desc: e.target.value }))}
                        placeholder="Trip/Purchase details"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border border-dashed border-slate-800 rounded-lg p-2 bg-slate-950 text-center cursor-pointer hover:bg-slate-900/50">
                    <Camera size={14} className="mx-auto text-slate-500 mb-0.5" />
                    <span className="text-[8px] text-slate-400 block font-medium">Capture Bill / Receipt Receipt</span>
                  </div>

                  <Button type="submit" variant="primary" className="w-full !py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                    Submit Expense Receipt
                  </Button>
                </form>

                <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 space-y-3 shadow-xl">
                  <label className="text-[8px] text-slate-500 uppercase font-black block">Recent Expense Submissions</label>
                  <div className="space-y-2">
                    {expenses.map(e => (
                      <div key={e.id} className="bg-slate-950 rounded-xl p-2.5 flex justify-between items-center text-[10px] font-mono border border-slate-900">
                        <div>
                          <p className="font-bold text-slate-300">{e.type}</p>
                          <p className="text-[8px] text-slate-500 mt-0.5">{e.date} &bull; ₹{e.amount}</p>
                        </div>
                        <Badge variant={e.status === 'Approved' ? 'success' : 'warning'}>
                          {e.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Employee Tab: On-site Chat Support */}
            {activeTab === 'aichat' && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col h-[380px] shadow-xl">
                <h5 className="text-[11px] text-indigo-400 font-extrabold uppercase tracking-wide border-b border-slate-800 pb-2 mb-2 flex items-center gap-1.5">
                  💬 Surya AI Site Assistant
                </h5>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[10px] leading-relaxed">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl p-2.5 ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-950 border border-slate-850 text-slate-300'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-1.5 mt-3 border-t border-slate-850 pt-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about wiring, tilt, error codes..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 text-[10px] text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* ======================== CUSTOMER PORTAL ================================ */
          /* ========================================================================= */
          <div className="space-y-4 animate-in slide-in-from-left duration-300">
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
                      <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
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
      <footer className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 h-16 grid grid-cols-5 items-center text-center px-2 z-40">
        {activePortal === 'employee' ? (
          <>
            <button
              onClick={() => setActiveTab('survey')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'survey' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FileText size={16} className="mb-0.5" />
              Survey
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'attendance' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <UserCheck size={16} className="mb-0.5" />
              Check-In
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'tasks' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Briefcase size={16} className="mb-0.5" />
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'expense' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Upload size={16} className="mb-0.5" />
              Expense
            </button>
            <button
              onClick={() => setActiveTab('aichat')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'aichat' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <MessageSquare size={16} className="mb-0.5" />
              Surya AI
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('track')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'track' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Clock size={16} className="mb-0.5" />
              Tracker
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'telemetry' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Cpu size={16} className="mb-0.5" />
              Telemetry
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'support' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <AlertCircle size={16} className="mb-0.5" />
              Support
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`flex flex-col items-center justify-center text-[9px] font-bold transition ${activeTab === 'docs' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <FileText size={16} className="mb-0.5" />
              Docs
            </button>
            <button
              onClick={() => alert("SOS Triggered to operations support desk.")}
              className="flex flex-col items-center justify-center text-[9px] font-black text-rose-500 hover:text-rose-400"
            >
              <Phone size={16} className="mb-0.5 animate-bounce" />
              SOS
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
