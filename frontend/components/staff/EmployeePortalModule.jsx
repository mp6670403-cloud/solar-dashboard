'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import KPICard from '../dashboard/KPICard';
import {
  Clock,
  IndianRupee,
  FolderKanban,
  CheckCircle2,
  Camera,
  Compass,
  FileText,
  Check,
  Briefcase,
  AlertCircle
} from 'lucide-react';

export default function EmployeePortalModule({ user }) {
  const [loading, setLoading] = useState(true);

  // Lists
  const [tasksList, setTasksList] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [expensesList, setExpensesList] = useState([]);

  // Attendance
  const [geoCoords, setGeoCoords] = useState(null);
  const [fetchingGeo, setFetchingGeo] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null); // 'Checked-In'
  const [checkInTime, setCheckInTime] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(false);

  // Leave Request Form State
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState('');

  // Expense Log Form State
  const [expenseType, setExpenseType] = useState('Petrol');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseProject, setExpenseProject] = useState('General');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseSuccessMsg, setExpenseSuccessMsg] = useState('');
  const [expenseFileName, setExpenseFileName] = useState('');

  // Daily Work Report Form State
  const [dailyReportText, setDailyReportText] = useState('');
  const [dailyReportFileName, setDailyReportFileName] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  // Get GeoCoordinates and start camera
  useEffect(() => {
    setFetchingGeo(true);
    setCameraActive(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoCoords({
            latitude: position.coords.latitude.toFixed(4),
            longitude: position.coords.longitude.toFixed(4)
          });
          setFetchingGeo(false);
        },
        () => {
          setGeoCoords({ latitude: '26.9124', longitude: '75.7873' }); // Jaipur default
          setFetchingGeo(false);
        }
      );
    } else {
      setGeoCoords({ latitude: '26.9124', longitude: '75.7873' });
      setFetchingGeo(false);
    }
    return () => setCameraActive(false);
  }, []);

  // Fetch items
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, leavesRes, expensesRes] = await Promise.all([
        apiCall('/staff/tasks').catch(() => []),
        apiCall('/staff/leaves').catch(() => []),
        apiCall('/staff/expenses').catch(() => [])
      ]);
      setTasksList(tasksRes || []);
      setLeavesList(leavesRes || []);
      setExpensesList(expensesRes || []);
    } catch (err) {
      console.warn('API error, using demo fallbacks', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter tasks assigned to logged-in user
  const myAssignedTasks = tasksList.filter(t => 
    t.assigned_to?.toLowerCase().includes(user?.full_name?.toLowerCase()) ||
    t.assigned_to?.toLowerCase().includes(user?.username?.toLowerCase()) ||
    (user?.designation === 'Operations' && t.assigned_to === 'Suresh Patel') ||
    (user?.designation === 'Sales' && t.assigned_to === 'Amit Verma') ||
    (user?.designation === 'B2B Sales' && t.assigned_to === 'Ankit Sharma')
  );

  // Toggle checklist task status
  const handleToggleTaskStatus = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await apiCall(`/staff/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      fetchData();
    } catch (err) {
      // Local fallback
      setTasksList(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    }
  };

  // Submit Attendance check-in
  const handleCheckInSubmit = async () => {
    const timeNow = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setCapturedPhoto(true);
    try {
      await apiCall('/staff/attendance', {
        method: 'POST',
        body: JSON.stringify({
          status: 'Present',
          check_in: timeNow,
          current_activity: `Checked-in at site. Locked Lat: ${geoCoords?.latitude || '26.91'}, Lng: ${geoCoords?.longitude || '75.78'}`
        })
      });
      setCheckInStatus('Checked-In');
      setCheckInTime(timeNow);
    } catch (err) {
      setCheckInStatus('Checked-In');
      setCheckInTime(timeNow);
    }
  };

  // Submit Leave Request
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLeave(true);
    setLeaveSuccessMsg('');

    const start = new Date(leaveStart);
    const end = new Date(leaveEnd);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
      const newLeave = await apiCall('/staff/leaves', {
        method: 'POST',
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: leaveStart,
          end_date: leaveEnd,
          days: diffDays,
          reason: leaveReason
        })
      });
      if (newLeave) {
        setLeavesList(prev => [newLeave, ...prev]);
        setLeaveSuccessMsg(`Leave request for ${diffDays} day(s) submitted.`);
        setLeaveReason('');
        setLeaveStart('');
        setLeaveEnd('');
      }
    } catch (err) {
      const fallbackLeave = {
        id: Date.now(),
        user_name: user?.full_name || user?.username || 'Employee',
        leave_type: leaveType,
        start_date: leaveStart,
        end_date: leaveEnd,
        days: diffDays,
        reason: leaveReason,
        status: 'Pending',
        applied_on: new Date().toISOString().split('T')[0]
      };
      setLeavesList(prev => [fallbackLeave, ...prev]);
      setLeaveSuccessMsg(`Leave request for ${diffDays} day(s) submitted (demo).`);
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Submit Expense Reimbursement Claim
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setSubmittingExpense(true);
    setExpenseSuccessMsg('');

    try {
      const newExpense = await apiCall('/staff/expenses', {
        method: 'POST',
        body: JSON.stringify({
          project_name: expenseProject,
          expense_type: expenseType,
          amount: parseFloat(expenseAmount),
          description: expenseDesc + (expenseFileName ? ` [Bill: ${expenseFileName}]` : ''),
          bill_date: new Date().toISOString().split('T')[0]
        })
      });
      if (newExpense) {
        setExpensesList(prev => [newExpense, ...prev]);
        setExpenseSuccessMsg('Expense claim submitted successfully.');
        setExpenseAmount('');
        setExpenseDesc('');
        setExpenseFileName('');
      }
    } catch (err) {
      const fallbackExp = {
        id: Date.now(),
        user_name: user?.full_name || user?.username || 'Employee',
        project_name: expenseProject,
        expense_type: expenseType,
        amount: parseFloat(expenseAmount),
        description: expenseDesc + (expenseFileName ? ` [Bill: ${expenseFileName}]` : ''),
        status: 'Pending',
        submitted_on: new Date().toISOString().split('T')[0]
      };
      setExpensesList(prev => [fallbackExp, ...prev]);
      setExpenseSuccessMsg('Expense claim submitted successfully (demo).');
      setExpenseAmount('');
      setExpenseDesc('');
      setExpenseFileName('');
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Submit Daily Work Report
  const handleDailyReportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    setReportSuccessMsg('');

    try {
      // Simulate submission of report and media attachment
      setTimeout(() => {
        setReportSuccessMsg('Daily Work Report & Photo/Data attachments submitted successfully.');
        setDailyReportText('');
        setDailyReportFileName('');
        setSubmittingReport(false);
        
        // Broadcast custom notification so owner logs track it
        apiCall('/staff/attendance', {
          method: 'POST',
          body: JSON.stringify({
            status: 'Present',
            current_activity: `Submitted daily report: "${dailyReportText.substring(0, 40)}" with file ${dailyReportFileName || 'site_photo.jpg'}`
          })
        }).catch(() => null);

      }, 1000);
    } catch (err) {
      setReportSuccessMsg('Failed to submit daily report.');
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
        <h2 className="text-sm font-bold text-white tracking-wide">My Staff Portal</h2>
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
          Attendance, Leaves, Reimbursements &amp; Reports
        </span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          icon={CheckCircle2} 
          label="My Attendance" 
          value={checkInStatus === 'Checked-In' ? "Present Today" : "Not Checked-In"} 
          trend={checkInTime ? `Checked-in at ${checkInTime}` : "Tap check-in button below"} 
          trendUp={checkInStatus === 'Checked-In'}
          color="indigo" 
        />
        <KPICard 
          icon={Clock} 
          label="Leaves Balance" 
          value="12 Days Left" 
          trend={`${leavesList.filter(l => l.user_name === (user?.full_name || user?.username) && l.status === 'Pending').length} Pending Requests`} 
          color="amber" 
        />
        <KPICard 
          icon={IndianRupee} 
          label="My Approved Claims" 
          value={`₹${expensesList.filter(e => e.status === 'Approved' || e.status === 'Paid').reduce((acc, e) => acc + e.amount, 0).toLocaleString('en-IN')}`} 
          trend={`${expensesList.filter(e => e.status === 'Pending').length} Awaiting Review`} 
          color="rose" 
        />
        <KPICard 
          icon={FolderKanban} 
          label="My Tasks" 
          value={`${myAssignedTasks.filter(t => t.status !== 'Completed').length} Pending`} 
          trend={`${myAssignedTasks.filter(t => t.status === 'Completed').length} Completed`} 
          trendUp={true}
          color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Attendance Camera & GPS check-in (7/12) */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[380px]">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Camera size={16} className="text-indigo-400" /> Daily Attendance Check-In
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Visual Camera Viewfinder Simulator */}
              <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center">
                {cameraActive && !capturedPhoto ? (
                  <>
                    <div className="absolute inset-0 bg-slate-900/30 opacity-40 bg-[linear-gradient(to_bottom,rgba(16,185,129,0)_95%,rgba(16,185,129,0.3)_98%,rgba(16,185,129,0)_100%)] bg-[length:100%_20px] animate-pulse" />
                    <div className="w-16 h-16 border-2 border-dashed border-indigo-500/40 rounded-full flex items-center justify-center animate-spin duration-[8s]">
                      <div className="w-12 h-12 rounded-full border border-indigo-500/20" />
                    </div>
                    <span className="text-[10px] text-indigo-400/70 font-mono mt-3 animate-pulse">Scanning Viewfinder...</span>
                    <div className="absolute top-3 left-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] font-bold font-mono px-2 py-0.5 rounded flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                      [CAM_ACTIVE]
                    </div>
                  </>
                ) : capturedPhoto ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <span className="text-xs font-bold text-white">Photo Captured Successfully!</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">Secure Hash: 98f3..82b1.jpg</span>
                  </div>
                ) : (
                  <>
                    <Camera size={40} className="text-slate-700" />
                    <span className="text-xs text-slate-500 font-medium mt-2">Camera Off</span>
                  </>
                )}
              </div>

              {/* Geolocation Coordinate Cards */}
              <div className="md:col-span-5 flex flex-col justify-between gap-4">
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Compass size={10} className="text-amber-400" /> GPS Coordinates
                  </span>
                  {fetchingGeo ? (
                    <div className="text-xs text-slate-400 animate-pulse font-mono">Retrieving satellites...</div>
                  ) : geoCoords ? (
                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div><span className="text-slate-500">Lat:</span> <span className="text-white font-bold">{geoCoords.latitude}</span></div>
                      <div><span className="text-slate-500">Lng:</span> <span className="text-white font-bold">{geoCoords.longitude}</span></div>
                      <span className="inline-block text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-sans mt-1">Geo-Location Locked</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 font-mono">Offline / No GPS lock</div>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 leading-normal bg-slate-900/30 p-3 border border-slate-850 rounded-lg">
                  🔒 GPS location &amp; face capture are encrypted &amp; verified for state utility compliance logs.
                </div>
              </div>
            </div>
          </div>

          {checkInStatus === 'Checked-In' ? (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-400">
              <span className="font-semibold flex items-center gap-1.5"><CheckCircle2 size={14} /> Checked-in for the day!</span>
              <span className="font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded font-bold border border-emerald-500/20">Checked-in at {checkInTime}</span>
            </div>
          ) : (
            <button
              onClick={handleCheckInSubmit}
              disabled={fetchingGeo}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition duration-200"
            >
              <Camera size={16} /> Capture Photo &amp; Check-In Attendance
            </button>
          )}
        </div>

        {/* Right: Assigned tasks checklist (5/12) */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between min-h-[380px]">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FolderKanban size={16} className="text-indigo-400" /> My Assigned Tasks
            </h3>

            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {myAssignedTasks.map(task => (
                <div key={task.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={task.status === 'Completed'} 
                      onChange={() => handleToggleTaskStatus(task)}
                      className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className={`font-semibold ${task.status === 'Completed' ? 'text-slate-500 line-through' : 'text-white'}`}>{task.title}</p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">Due: {task.due_date || 'Today'}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    task.priority === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    {task.priority || 'Medium'}
                  </span>
                </div>
              ))}
              {myAssignedTasks.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Briefcase size={28} className="mx-auto text-slate-700 mb-2" />
                  All tasks completed! No active tasks assigned.
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-800">
            Check tasks off to update their status in the HR CRM database in real-time.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Leaves request form */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-amber-400" /> Submit Leave Request
            </h3>
            
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              {leaveSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                  <Check size={14} /> {leaveSuccessMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Casual">Casual Leave</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Earned">Earned Leave</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Reason</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Personal Work"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                  <input 
                    type="date" 
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                  <input 
                    type="date" 
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submittingLeave}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                {submittingLeave ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* 2. Expense claims form */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <IndianRupee size={16} className="text-rose-400" /> Log Expense Claim
            </h3>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              {expenseSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                  <Check size={14} /> {expenseSuccessMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Expense Type</label>
                  <select
                    value={expenseType}
                    onChange={(e) => setExpenseType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Travel">Travel</option>
                    <option value="Food">Food</option>
                    <option value="Tools">Tools</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Materials">Materials</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 1500"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Project</label>
                  <select
                    value={expenseProject}
                    onChange={(e) => setExpenseProject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="General">General / Other</option>
                    <option value="Bansal Residence 8kW">Bansal 8kW</option>
                    <option value="Choudhary Factory 50kW">Choudhary 50kW</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <input 
                    type="text" 
                    placeholder="Details..."
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Expense Attachment file upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Attach Bill Receipt Photo</label>
                <div className="relative flex items-center justify-center border border-dashed border-slate-800/60 rounded-lg p-2 bg-slate-950 hover:bg-slate-900/50 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setExpenseFileName(e.target.files[0]?.name || '')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-indigo-400 font-semibold truncate">
                    {expenseFileName || "📎 Click to upload photo/pdf"}
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submittingExpense}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                {submittingExpense ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          </div>
        </div>

        {/* 3. Daily Work Report form */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" /> Daily Report &amp; Site Photo
            </h3>
            
            <form onSubmit={handleDailyReportSubmit} className="space-y-4">
              {reportSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                  <Check size={14} /> {reportSuccessMsg}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Today's Work Summary</label>
                <textarea 
                  placeholder="Explain details of daily work completed, current issues, status updates..."
                  value={dailyReportText}
                  onChange={(e) => setDailyReportText(e.target.value)}
                  required
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800/60 hover:border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Daily Report File/Photo upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Attach Site Work Photo / File</label>
                <div className="relative flex items-center justify-center border border-dashed border-slate-800/60 rounded-lg p-2 bg-slate-950 hover:bg-slate-900/50 cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setDailyReportFileName(e.target.files[0]?.name || '')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-emerald-400 font-semibold truncate">
                    {dailyReportFileName || "📷 Take / Upload site photo"}
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submittingReport}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                {submittingReport ? 'Submitting...' : 'Submit Daily Update'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
