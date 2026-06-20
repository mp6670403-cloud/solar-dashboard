/**
 * dashboard/OwnerDashboard.jsx — Customized Role-Based Dashboard View
 * 
 * Adapts dynamically based on the logged-in user's role designation:
 * - Owner: Full system statistics, financials, yield curve, logs, and staff trackers.
 * - HR: Focuses on staff directories, attendance logs, leave approvals, expense claims, and candidate pipelines.
 * - Sales: CRM lead tracking, AI proposal shortcuts, target achievements, and conversions.
 * - Operations: Active projects, site surveys, net metering milestones, BOM alerts, and task lists.
 * - Self-Service Portal (For Employees): Camera & GPS Check-in, Leaves Request, Expense Logging, and Tasks.
 */

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import KPICard from './KPICard';
import AIInsights from './AIInsights';
import { 
  getLivePower, 
  getTodayYield, 
  getHourlyGenerationCurve, 
  getEnvironmentalImpact 
} from '@/lib/inverterSimulator';
import {
  Zap,
  Sun,
  UserPlus,
  IndianRupee,
  Clock,
  FolderKanban,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Phone,
  FileText,
  Truck,
  Store,
  Package,
  TrendingUp,
  Building2,
  ShieldCheck,
  BarChart3,
  Layers,
  Users,
  Home,
  Banknote,
  Leaf,
  Gauge,
  Check,
  X,
  Target,
  Award,
  Camera,
  Compass,
  Briefcase
} from 'lucide-react';

// ─── EPC Demo data ─────────────────────────────────────────────────────
const DEMO_STATS = {
  activeSites: 12,
  kwInstalledToday: 45,
  newLeads: 8,
  revenueThisMonth: '₹32.5L',
  pendingPayments: '₹8.2L',
  projectsPipeline: 23,
};

const DEMO_RECENT_LEADS = [
  { id: 1, name: 'Rajesh Patel',     phone: '9876543210', source: 'WhatsApp', stage: 'Site Survey',   kw: '10 kW', aiScore: 85, date: '2026-06-18' },
  { id: 2, name: 'Meena Shah',       phone: '9876543211', source: 'Referral',  stage: 'Proposal Sent', kw: '5 kW',  aiScore: 72, date: '2026-06-17' },
  { id: 3, name: 'Amit Joshi',       phone: '9876543212', source: 'Website',   stage: 'New Inquiry',   kw: '15 kW', aiScore: 91, date: '2026-06-17' },
  { id: 4, name: 'Priya Desai',      phone: '9876543213', source: 'Manual',    stage: 'Negotiation',   kw: '8 kW',  aiScore: 68, date: '2026-06-16' },
  { id: 5, name: 'Suresh Mehta',     phone: '9876543214', source: 'WhatsApp',  stage: 'New Inquiry',   kw: '20 kW', aiScore: 78, date: '2026-06-16' },
];

const DEMO_ACTIVITY = [
  { id: 1, type: 'success', message: 'Payment of ₹2.5L received from Rajesh Patel', time: '2 hours ago' },
  { id: 2, type: 'info',    message: 'New lead added: Amit Joshi — 15 kW system inquiry', time: '3 hours ago' },
  { id: 3, type: 'warning', message: 'Site survey pending for Meena Shah (Ahmedabad)', time: '5 hours ago' },
  { id: 4, type: 'success', message: 'Project milestone completed: Panel installation at Surat site', time: '8 hours ago' },
  { id: 5, type: 'info',    message: 'Workflow triggered: WhatsApp follow-up sent to 4 leads', time: '12 hours ago' },
  { id: 6, type: 'warning', message: 'Inverter stock below reorder level — 3 units remaining', time: '1 day ago' },
];

const DEMO_CANDIDATES = [
  { id: 1, position: 'Senior Site Engineer', department: 'Engineering', candidate_name: 'Rohit Mehra', email: 'rohit.m@gmail.com', phone: '9876123450', experience_years: 5, current_company: 'Tata Power Solar', status: 'Interview Scheduled', applied_date: '2026-06-10', notes: 'Strong experience in 50kW+ commercial installations' },
  { id: 2, position: 'Solar Installer Technician', department: 'Operations', candidate_name: 'Manoj Kumar', email: 'manoj.k@yahoo.com', phone: '9812345670', experience_years: 3, current_company: 'Local Contractor', status: 'Applied', applied_date: '2026-06-16', notes: 'Knows panel mounting and DC wiring' },
  { id: 3, position: 'B2B Telecaller', department: 'Sales', candidate_name: 'Sneha Gupta', email: 'sneha.g@gmail.com', phone: '9998877665', experience_years: 2, current_company: 'SolarEdge India', status: 'Technical Round', applied_date: '2026-06-05', notes: 'Excellent communication, knows solar industry terminology' },
  { id: 4, position: 'Design Engineer (AutoCAD)', department: 'Engineering', candidate_name: 'Vivek Agarwal', email: 'vivek.a@outlook.com', phone: '9123098765', experience_years: 4, current_company: 'Vikram Solar', status: 'Offered', applied_date: '2026-05-28', notes: 'Expert in SLDs and structural shadow calculations' },
];

const DEMO_LEAVES = [
  { id: 1, user_id: 3, user_name: 'Amit Verma', leave_type: 'Casual', start_date: '2026-06-20', end_date: '2026-06-21', days: 2, reason: 'Family function at hometown', status: 'Pending', applied_on: '2026-06-18' },
  { id: 2, user_id: 4, user_name: 'Suresh Patel', leave_type: 'Sick', start_date: '2026-06-17', end_date: '2026-06-17', days: 1, reason: 'High fever and cold', status: 'Approved', applied_on: '2026-06-17' },
  { id: 3, user_id: 5, user_name: 'Vikram Malhotra', leave_type: 'Earned', start_date: '2026-07-01', end_date: '2026-07-05', days: 5, reason: 'Personal holiday trip', status: 'Pending', applied_on: '2026-06-19' }
];

const DEMO_EXPENSES = [
  { id: 1, user_id: 4, user_name: 'Suresh Patel', project_name: 'Bansal Residence 8kW', expense_type: 'Travel', amount: 1200, description: 'Cab to Bansal site for panel inspection', bill_date: '2026-06-15', status: 'Approved', submitted_on: '2026-06-16' },
  { id: 2, user_id: 4, user_name: 'Suresh Patel', project_name: 'Choudhary Factory 50kW', expense_type: 'Petrol', amount: 800, description: 'Bike petrol for daily site visits', bill_date: '2026-06-14', status: 'Pending', submitted_on: '2026-06-17' },
  { id: 3, user_id: 3, user_name: 'Amit Verma', project_name: 'Client Meetings', expense_type: 'Food', amount: 650, description: 'Lunch with B2B dealer client Mr. Singh', bill_date: '2026-06-16', status: 'Pending', submitted_on: '2026-06-17' },
];

const DEMO_B2C_PROJECTS = [
  { id: 'B2C-1001', customer_name: 'Rajesh Sharma', name: 'Rajesh Sharma Residence', city: 'Jaipur', capacity: 5, stage: 'Physical Installation', net_metering_stage: 'Physical Installation', status: 'In Progress' },
  { id: 'B2C-1002', customer_name: 'Amit Joshi', name: 'Amit Joshi Villa', city: 'Ahmedabad', capacity: 3, stage: 'Feasibility Approval', net_metering_stage: 'Feasibility Approval', status: 'In Progress' },
  { id: 'B2C-1003', customer_name: 'Kavita Bansal', name: 'Kavita Bansal Rooftop', city: 'Jaipur', capacity: 8, stage: 'Subsidy Disbursement', net_metering_stage: 'Subsidy Disbursement', status: 'Completed' },
  { id: 'B2C-1004', customer_name: 'Vikram Malhotra', name: 'Vikram Malhotra Home', city: 'Lucknow', capacity: 6, stage: 'Registration & Application', net_metering_stage: 'Registration & Application', status: 'In Progress' }
];

const FALLBACK_ROLE_ACTIVITIES = {
  'Sales Head': [
    { id: 101, type: 'info',    message: 'New lead added: Amit Joshi — 15 kW system inquiry', time: '3 hours ago' },
    { id: 102, type: 'info',    message: 'Workflow triggered: WhatsApp follow-up sent to 4 leads', time: '12 hours ago' },
    { id: 103, type: 'success', message: 'Lead qualified: Rajesh Patel updated to Site Survey stage', time: '1 day ago' },
    { id: 104, type: 'info',    message: 'Lead inquiry: Sunita Reddy requested commercial site visit', time: '1 day ago' },
    { id: 105, type: 'warning', message: 'Follow-up overdue for Neha Joshi (Sales rep assigned)', time: '2 days ago' },
  ],
  'Operations Head': [
    { id: 201, type: 'warning', message: 'Site survey pending for Meena Shah (Ahmedabad)', time: '5 hours ago' },
    { id: 202, type: 'success', message: 'Project milestone completed: Panel installation at Surat site', time: '8 hours ago' },
    { id: 203, type: 'info',    message: 'BOM check: All solar panels dispatched for Bansal Residence', time: '1 day ago' },
    { id: 204, type: 'success', message: 'Inverter setup completed: Choudhary Factory 50kW commercial', time: '2 days ago' },
    { id: 205, type: 'info',    message: 'Net metering application submitted to state discom portal', time: '3 days ago' },
  ],
  HR: [
    { id: 301, type: 'info',    message: 'Priya Sharma marked Present (09:00 AM check-in)', time: '2 hours ago' },
    { id: 302, type: 'warning', message: 'Pending leave request: Vikram Malhotra requested Casual Leave for tomorrow', time: '4 hours ago' },
    { id: 303, type: 'info',    message: 'New candidate applied: Vikram Sen (Site Engineer, 4 yrs exp)', time: '6 hours ago' },
    { id: 304, type: 'success', message: 'Task completed: Amit Verma submitted expense claims clearance', time: '1 day ago' },
    { id: 305, type: 'info',    message: 'Candidate interview scheduled: Technical round for Telecaller position', time: '1 day ago' },
  ],
  'B2B Sales': [
    { id: 401, type: 'success', message: 'Order #101 delivered to Helius Solar Systems — 50x Mono PERC 540W', time: '2 hours ago' },
    { id: 402, type: 'info',    message: 'New order placed by Apex Green Solutions — 20x Mono PERC 540W (Pending Owner Approval)', time: '5 hours ago' },
    { id: 403, type: 'warning', message: 'Payment overdue: Aditya Power EPC — Invoice SLV-B2B-002 (₹2.65L) past due', time: '1 day ago' },
    { id: 404, type: 'info',    message: 'WhatsApp dispatch alert sent to Helius Solar — Order #104 via Delhivery', time: '1 day ago' },
    { id: 405, type: 'success', message: 'Invoice SLV-B2B-001 payment received from Helius Solar — ₹5.43L RTGS', time: '2 days ago' },
  ]
};

// Activity type icon mapping
const ACTIVITY_ICONS = {
  success: CheckCircle2,
  info:    Activity,
  warning: AlertCircle,
};

const ACTIVITY_COLORS = {
  success: 'text-emerald-400 bg-emerald-500/10',
  info:    'text-indigo-400 bg-indigo-500/10',
  warning: 'text-amber-400 bg-amber-500/10',
};

export default function OwnerDashboard({ user }) {
  const userRole = user?.designation || 'Owner';
  const isOwner = userRole === 'Owner';
  const isHR = userRole === 'HR';
  const isSales = userRole === 'Sales Head';
  const isB2BSales = userRole === 'B2B Sales';
  const isOps = userRole === 'Operations Head';

  const [stats, setStats] = useState(DEMO_STATS);
  const [recentLeads, setRecentLeads] = useState(DEMO_RECENT_LEADS);
  const [activity, setActivity] = useState(DEMO_ACTIVITY);
  const [loading, setLoading] = useState(true);
  
  const [staffList, setStaffList] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [candidatesList, setCandidatesList] = useState(DEMO_CANDIDATES);
  const [leavesList, setLeavesList] = useState(DEMO_LEAVES);
  const [expensesList, setExpensesList] = useState(DEMO_EXPENSES);
  const [b2cProjectsList, setB2cProjectsList] = useState(DEMO_B2C_PROJECTS);

  const [activeTab, setActiveTab] = useState('epc'); // 'epc', 'staff_live', 'self_service'

  // GPS Coordinates and Checkin states
  const [geoCoords, setGeoCoords] = useState(null);
  const [fetchingGeo, setFetchingGeo] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null); // 'Checked-In'
  const [checkInTime, setCheckInTime] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(false);

  // Self Service Forms state
  const [leaveType, setLeaveType] = useState('Casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState('');

  const [expenseType, setExpenseType] = useState('Petrol');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseProject, setExpenseProject] = useState('General');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [expenseSuccessMsg, setExpenseSuccessMsg] = useState('');
  const [expenseFileName, setExpenseFileName] = useState('');
  const [dailyReportText, setDailyReportText] = useState('');
  const [dailyReportFileName, setDailyReportFileName] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  // Fetch coordinates on self-service mount
  useEffect(() => {
    if (activeTab === 'self_service') {
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
    } else {
      setCameraActive(false);
    }
  }, [activeTab]);

  // Installed portfolio of B2C client plants for live generation sum
  const portfolioPlants = [
    { id: 'B2C-1001', name: 'Rajesh Sharma Residence', city: 'Jaipur', capacity: 5, brand: 'Growatt', serial: 'GRW-1001-8392' },
    { id: 'B2C-1002', name: 'Amit Joshi Villa', city: 'Ahmedabad', capacity: 3, brand: 'Solis', serial: 'SOL-1002-1249' }
  ];

  // Combined live portfolio state
  const [liveMetrics, setLiveMetrics] = useState({
    totalCapacity: 8,
    activePower: 0,
    todayYield: 0,
    co2Saved: 0,
    trees: 0
  });

  // Calculate cumulative real-time telemetry metrics
  useEffect(() => {
    const updateMetrics = () => {
      const activeSum = portfolioPlants.reduce((acc, p) => acc + getLivePower(p.capacity), 0);
      const yieldSum = portfolioPlants.reduce((acc, p) => acc + getTodayYield(p.capacity), 0);
      const env = getEnvironmentalImpact(yieldSum);

      setLiveMetrics({
        totalCapacity: portfolioPlants.reduce((acc, p) => acc + p.capacity, 0),
        activePower: parseFloat(activeSum.toFixed(2)),
        todayYield: parseFloat(yieldSum.toFixed(2)),
        co2Saved: env.co2Kg,
        trees: env.trees
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // refresh portfolio every 5s
    return () => clearInterval(interval);
  }, []);

  const getCombinedHourlyCurve = () => {
    const curve1 = getHourlyGenerationCurve(5);
    const curve2 = getHourlyGenerationCurve(3);
    const combined = curve1.map((val, idx) => parseFloat((val + curve2[idx]).toFixed(2)));
    
    const maxVal = Math.max(...combined) || 1;
    const width = 400;
    const height = 120;
    const padding = 10;
    
    const points = combined.map((val, idx) => {
      const x = padding + (idx / 23) * (width - 2 * padding);
      const y = height - padding - (val / maxVal) * (height - 2 * padding);
      return { x, y, val, hour: idx };
    });

    const pathD = `M ${points[0].x} ${height - padding} ` + 
      points.map(p => `L ${p.x} ${p.y}`).join(' ') + 
      ` L ${points[points.length - 1].x} ${height - padding} Z`;

    const lineD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { pathD, lineD, width, height };
  };

  const combinedSvg = getCombinedHourlyCurve();

  // Fetch dashboard stats + staff details from backend dynamically based on role
  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises = [
          apiCall('/staff/tasks').catch(() => null)
        ];

        if (isOwner || isHR) {
          promises.push(apiCall('/staff/directory').catch(() => null));
          promises.push(apiCall('/staff/attendance').catch(() => null));
          promises.push(apiCall('/staff/candidates').catch(() => null));
          promises.push(apiCall('/staff/leaves').catch(() => null));
          promises.push(apiCall('/staff/expenses').catch(() => null));
        }

        if (isOwner || isSales || isOps) {
          promises.push(apiCall('/dashboard/stats').catch(() => null));
        }

        if (isOps) {
          promises.push(apiCall('/b2c/projects').catch(() => null));
        }

        if (isB2BSales) {
          promises.push(apiCall('/dashboard/stats').catch(() => null));
        }

        const results = await Promise.all(promises);
        
        let index = 0;
        const tasksData = results[index++];
        if (tasksData) setTasksList(tasksData);

        if (isOwner || isHR) {
          const staffData = results[index++];
          const attendanceData = results[index++];
          const candidatesData = results[index++];
          const leavesData = results[index++];
          const expensesData = results[index++];

          if (staffData) setStaffList(staffData);
          if (attendanceData) setAttendanceList(attendanceData);
          if (candidatesData) setCandidatesList(candidatesData);
          if (leavesData) setLeavesList(leavesData);
          if (expensesData) setExpensesList(expensesData);
        }

        if (isOwner || isSales || isOps) {
          const dashData = results[index++];
          if (dashData) {
            setStats({
              activeSites:       dashData.stats?.activeSites ?? dashData.active_sites ?? DEMO_STATS.activeSites,
              kwInstalledToday:  dashData.stats?.kwInstalledToday ?? dashData.kw_installed_today ?? DEMO_STATS.kwInstalledToday,
              newLeads:          dashData.stats?.newLeads ?? dashData.new_leads ?? DEMO_STATS.newLeads,
              revenueThisMonth:  dashData.stats?.revenueThisMonth ?? dashData.revenue_this_month ?? DEMO_STATS.revenueThisMonth,
              pendingPayments:   dashData.stats?.pendingPayments ?? dashData.pending_payments ?? DEMO_STATS.pendingPayments,
              projectsPipeline:  dashData.stats?.projectsPipeline ?? dashData.projects_pipeline ?? DEMO_STATS.projectsPipeline,
            });
            if (dashData.recentActivity?.length) setActivity(dashData.recentActivity);
            else if (dashData.recent_activity?.length) setActivity(dashData.recent_activity);
          }
        }

        if (isOps) {
          const b2cData = results[index++];
          if (b2cData) setB2cProjectsList(b2cData);
        }

        if (isB2BSales) {
          const b2bDashData = results[index++];
          // B2B Sales can use dashboard stats if needed
        }
      } catch (error) {
        console.error('Error fetching role dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userRole]);

  // HR Approvals handlers
  const handleApproveLeave = async (id) => {
    try {
      await apiCall(`/staff/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Approved', reviewed_by: user?.full_name || user?.username })
      });
      setLeavesList(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
    } catch {
      setLeavesList(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await apiCall(`/staff/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Rejected', reviewed_by: user?.full_name || user?.username })
      });
      setLeavesList(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' } : l));
    } catch {
      setLeavesList(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' } : l));
    }
  };

  const handleApproveExpense = async (id) => {
    try {
      await apiCall(`/staff/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Approved', reviewed_by: user?.full_name || user?.username })
      });
      setExpensesList(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
    } catch {
      setExpensesList(prev => prev.map(e => e.id === id ? { ...e, status: 'Approved' } : e));
    }
  };

  const handleRejectExpense = async (id) => {
    try {
      await apiCall(`/staff/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Rejected', reviewed_by: user?.full_name || user?.username })
      });
      setExpensesList(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));
    } catch {
      setExpensesList(prev => prev.map(e => e.id === id ? { ...e, status: 'Rejected' } : e));
    }
  };

  // Operations Task checklist toggle helper
  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await apiCall(`/staff/tasks`, {
        method: 'POST', // Mock DB upsert behavior
        body: JSON.stringify({ ...task, status: newStatus })
      });
      setTasksList(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch {
      setTasksList(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    }
  };

  // Self-service Check-In Submit handler
  const handleCheckInSubmit = async () => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toISOString().split('T')[0];
    const coordinatesStr = geoCoords ? `${geoCoords.latitude}, ${geoCoords.longitude}` : '26.9124, 75.7873';

    try {
      await apiCall('/staff/attendance', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user?.id,
          date: dateStr,
          status: 'Present',
          check_in: timeStr,
          current_activity: `Checked in via Staff Portal (Geo: ${coordinatesStr})`
        })
      });

      setCheckInStatus('Checked-In');
      setCheckInTime(timeStr);
      setCapturedPhoto(true);

      // Add to attendance log list locally
      const mockEntry = {
        id: Date.now(),
        user_id: user?.id,
        date: dateStr,
        status: 'Present',
        check_in: timeStr,
        check_out: '',
        current_activity: `Checked in via Staff Portal (Geo: ${coordinatesStr})`
      };
      setAttendanceList(prev => [mockEntry, ...prev]);

      // Add system log activity locally
      setActivity(prev => [
        { 
          id: Date.now(), 
          type: 'success', 
          message: `${user?.full_name || user?.username} checked in via Self-Service Portal (GPS: ${coordinatesStr})`, 
          time: 'just now' 
        },
        ...prev
      ]);
    } catch (error) {
      console.error('Check-in failed:', error);
      // Fallback local update
      setCheckInStatus('Checked-In');
      setCheckInTime(timeStr);
      setCapturedPhoto(true);
    }
  };

  // Self-service Leave Submit handler
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
      // Fallback local update
      const fallbackLeave = {
        id: Date.now(),
        user_name: user?.full_name || user?.username,
        leave_type: leaveType,
        start_date: leaveStart,
        end_date: leaveEnd,
        days: diffDays,
        reason: leaveReason,
        status: 'Pending',
        applied_on: new Date().toISOString().split('T')[0]
      };
      setLeavesList(prev => [fallbackLeave, ...prev]);
      setLeaveSuccessMsg(`Leave request for ${diffDays} day(s) submitted successfully (demo).`);
      setLeaveReason('');
      setLeaveStart('');
      setLeaveEnd('');
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Self-service Expense Submit handler
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
          description: expenseDesc,
          bill_date: new Date().toISOString().split('T')[0]
        })
      });
      
      if (newExpense) {
        setExpensesList(prev => [newExpense, ...prev]);
        setExpenseSuccessMsg('Expense claim submitted successfully.');
        setExpenseAmount('');
        setExpenseDesc('');
      }
    } catch (err) {
      // Fallback local update
      const fallbackExp = {
        id: Date.now(),
        user_name: user?.full_name || user?.username,
        project_name: expenseProject,
        expense_type: expenseType,
        amount: parseFloat(expenseAmount),
        description: expenseDesc,
        status: 'Pending',
        submitted_on: new Date().toISOString().split('T')[0]
      };
      setExpensesList(prev => [fallbackExp, ...prev]);
      setExpenseSuccessMsg('Expense claim submitted successfully (demo).');
      setExpenseAmount('');
      setExpenseDesc('');
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Self-service Daily Report Submit handler
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
        
        // Log this activity so owner sees it in real-time
        const newAct = {
          id: Date.now(),
          type: 'success',
          message: `Daily report from ${user?.full_name || user?.username}: "${dailyReportText.substring(0, 50)}${dailyReportText.length > 50 ? '...' : ''}" with attachment ${dailyReportFileName || 'site_photo.jpg'}`,
          time: 'Just now'
        };
        setActivity(prev => [newAct, ...prev]);
      }, 1000);
    } catch (err) {
      setReportSuccessMsg('Failed to submit daily report.');
      setSubmittingReport(false);
    }
  };

  // Filter recent leads for Sales
  const filteredRecentLeads = recentLeads.filter(lead => {
    if (isOwner) return true;
    if (isSales) {
      return lead.name === 'Rajesh Patel' || lead.name === 'Amit Joshi' || lead.name === 'Priya Desai';
    }
    return true;
  });

  // Filter tasks assigned to logged-in user
  const myAssignedTasks = tasksList.filter(t => 
    t.assigned_to?.toLowerCase().includes(user?.full_name?.toLowerCase()) ||
    t.assigned_to?.toLowerCase().includes(user?.username?.toLowerCase()) ||
    (isOps && t.assigned_to === 'Suresh Patel') ||
    (isSales && t.assigned_to === 'Amit Verma') ||
    (isB2BSales && t.assigned_to === 'Ankit Sharma')
  );

  // Filter activity logs based on role keywords (restricting revenue/inverters details)
  const filteredActivity = activity.filter(item => {
    const msg = item.message?.toLowerCase() || '';
    if (isOwner) return true;
    if (isHR) {
      return msg.includes('attendance') || msg.includes('leave') || msg.includes('candidate') || msg.includes('hiring') || msg.includes('staff') || msg.includes('expense') || msg.includes('paid') || msg.includes('approved') || msg.includes('rejected');
    }
    if (isSales) {
      return msg.includes('lead') || msg.includes('inquiry') || msg.includes('proposal') || msg.includes('follow-up') || msg.includes('whatsapp') || msg.includes('negotiation');
    }
    if (isB2BSales) {
      return msg.includes('order') || msg.includes('dealer') || msg.includes('dispatch') || msg.includes('invoice') || msg.includes('b2b') || msg.includes('payment');
    }
    if (isOps) {
      return msg.includes('project') || msg.includes('milestone') || msg.includes('survey') || msg.includes('installation') || msg.includes('inverter') || msg.includes('wiring') || msg.includes('site') || msg.includes('structure');
    }
    return true;
  });

  // Use realistic fallback logs if filtered output is empty
  const displayActivities = filteredActivity.length > 0 
    ? filteredActivity 
    : (FALLBACK_ROLE_ACTIVITIES[userRole] || DEMO_ACTIVITY);

  // Stage styling helpers
  const getStageColor = (stage) => {
    const map = {
      'New Inquiry':   'text-sky-400 bg-sky-500/10 border-sky-500/25',
      'Site Survey':   'text-violet-400 bg-violet-500/10 border-violet-500/25',
      'Proposal Sent': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
      'Negotiation':   'text-amber-400 bg-amber-500/10 border-amber-500/25',
      'Won':           'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      'Lost':          'text-rose-400 bg-rose-500/10 border-rose-500/25',
      'Applied':       'text-blue-400 bg-blue-500/10 border-blue-500/25',
      'Interview Scheduled': 'text-purple-400 bg-purple-500/10 border-purple-500/25',
      'Technical Round': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
      'Offered':       'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
      'Hired':         'text-teal-400 bg-teal-500/10 border-teal-500/25',
      'Rejected':      'text-rose-400 bg-rose-500/10 border-rose-500/25',
    };
    return map[stage] || 'text-slate-400 bg-slate-500/10 border-slate-500/25';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getAttendanceForUser = (userId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const att = attendanceList.find(a => a.user_id === userId && a.date === todayStr);
    if (!att) return { status: 'Absent', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', check_in: '-', activity: 'Not checked-in yet' };
    if (att.check_out) return { status: 'Checked Out', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', check_in: att.check_in, activity: 'Shift ended' };
    return { status: 'Present', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', check_in: att.check_in, activity: att.current_activity };
  };

  const showEPC = activeTab === 'epc';
  const showStaffLive = activeTab === 'staff_live';
  const showSelfService = activeTab === 'self_service';

  return (
    <div className="flex gap-6">
      {/* ── LEFT: Main Content ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

      {/* ═══ SECTION TOGGLE TABS ═══ */}
      {isOwner && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/60 rounded-xl p-1">
            {[
              { key: 'epc',  label: 'EPC Overview', icon: Sun },
              { key: 'staff_live', label: 'Staff Live Tracker', icon: Users }
            ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Last synced: {new Date().toLocaleTimeString('en-IN')}
          </div>
        </div>
      )}

      {/* ═══ 1. OWNER / ADMIN DASHBOARD VIEW ═══ */}
      {isOwner && showEPC && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-amber-500 rounded-full" />
              <h2 className="text-sm font-bold text-white tracking-wide">Solar EPC Dashboard</h2>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">Residential & Commercial</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KPICard icon={Home} label="Active Installations" value={stats.activeSites} trend="+2 this week" trendUp={true} color="indigo" />
              <KPICard icon={Banknote} label="PM Surya Ghar Pending" value="15 Files" trend="₹11.7L Subsidy" trendUp={false} color="sky" />
              <KPICard icon={Zap} label="Net Metering Approvals" value="8 Sites" trend="+3 today" trendUp={true} color="amber" />
              <KPICard icon={FileText} label="Loan Sanctions Pending" value="12 Files" trend="-2 since yday" trendUp={true} color="rose" />
              <KPICard icon={Sun} label="kW Installed Today" value={stats.kwInstalledToday} trend="+18%" trendUp={true} color="emerald" />
              <KPICard icon={IndianRupee} label="B2C Retail Revenue" value={stats.revenueThisMonth} trend="+12.5%" trendUp={true} color="violet" />
            </div>
          </div>

          {/* Live Solar Portfolio Area Curve */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  <Sun size={16} className="text-amber-400" /> Combined Live Solar Portfolio Yield
                </h3>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                {portfolioPlants.length} Plants Online
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Activity size={10} className="text-emerald-400" /> Live Power Out
                  </span>
                  <div className="mt-2 text-xl font-black text-white font-mono">{liveMetrics.activePower} <span className="text-xs text-emerald-400 font-bold">kW</span></div>
                </div>
                <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Gauge size={10} className="text-indigo-400" /> Combined Today
                  </span>
                  <div className="mt-2 text-xl font-black text-white font-mono">{liveMetrics.todayYield} <span className="text-xs text-indigo-400 font-bold">kWh</span></div>
                </div>
                <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Layers size={10} className="text-amber-400" /> Total Capacity
                  </span>
                  <div className="mt-2 text-xl font-black text-white font-mono">{liveMetrics.totalCapacity} <span className="text-xs text-amber-400 font-bold">kWp</span></div>
                </div>
                <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Leaf size={10} className="text-emerald-400" /> Carbon Offset
                  </span>
                  <div className="mt-2 text-xs font-black text-emerald-400 font-mono truncate">
                    -{liveMetrics.co2Saved} kg
                    <span className="block text-[8px] text-slate-500 font-semibold">{liveMetrics.trees} Trees saved</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-950 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold mb-2">
                  <span>Portfolio Hourly Curve</span>
                  <span>Peak: 7.0 kW</span>
                </div>
                <div className="relative w-full h-[90px]">
                  <svg viewBox={`0 0 ${combinedSvg.width} ${combinedSvg.height}`} className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="combinedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={combinedSvg.pathD} fill="url(#combinedGrad)" />
                    <path d={combinedSvg.lineD} fill="none" stroke="#10b981" strokeWidth="2" />
                  </svg>
                </div>
                <div className="flex justify-between text-[8px] text-slate-600 font-mono mt-1">
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-950 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">Individual Active Inverters</div>
                <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                  {portfolioPlants.map((plant) => {
                    const power = getLivePower(plant.capacity);
                    return (
                      <div key={plant.id} className="flex justify-between items-center bg-slate-900/60 border border-slate-800 p-2 rounded-lg text-[10px]">
                        <div>
                          <p className="font-bold text-white leading-normal truncate max-w-[120px]">{plant.name.split(' ')[0]} Residence</p>
                          <p className="text-[8px] text-slate-500 font-mono leading-none mt-0.5">{plant.brand} - {plant.serial}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-emerald-400 font-bold">{power} kW</p>
                          <span className="inline-block text-[7px] text-emerald-400/80 font-bold bg-emerald-500/10 px-1 py-0.2 rounded mt-0.5">Online</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Leads & B2C/B2B Analytics Division */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Recent Leads (7/12) */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Recent Leads</h3>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">B2C/B2B End User</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900/40">
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Source</th>
                        <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Stage</th>
                        <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Capacity</th>
                        <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">AI Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-xs">
                      {filteredRecentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors duration-150 cursor-pointer">
                          <td className="px-6 py-3.5">
                            <div>
                              <span className="text-sm font-medium text-white">{lead.name}</span>
                              <p className="text-[10px] text-slate-500">{lead.phone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">{lead.source}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${getStageColor(lead.stage)}`}>
                              {lead.stage}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 font-mono">{lead.kw}</td>
                          <td className="px-4 py-3.5 font-bold font-mono">
                            <span className={getScoreColor(lead.aiScore)}>{lead.aiScore}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right: B2C vs B2B Insights Widget (5/12) */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" /> B2C vs B2B Division Insights
                  </h3>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
                    Active Share
                  </span>
                </div>

                <div className="space-y-4">
                  {/* B2C Segment */}
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Home size={13} className="text-indigo-400" /> B2C Solar Installation
                      </span>
                      <span className="text-xs font-black text-indigo-400 font-mono">₹32.5L (42%)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                      <div>Supervised Sites: <strong className="text-white">12 Active</strong></div>
                      <div>Installed Power: <strong className="text-white">78 kWp</strong></div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-500" style={{ width: '42%' }} />
                    </div>
                  </div>

                  {/* B2B Segment */}
                  <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Building2 size={13} className="text-emerald-400" /> B2B Dealer Distribution
                      </span>
                      <span className="text-xs font-black text-emerald-400 font-mono">₹45.0L (58%)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                      <div>Active Dealers: <strong className="text-white">34 Registered</strong></div>
                      <div>Orders Fulfilled: <strong className="text-white">48 Orders</strong></div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-500" style={{ width: '58%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI division recommendation */}
              <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] text-slate-300 leading-normal flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">💡</span>
                <p>
                  <strong>AI Analysis:</strong> B2B distribution orders are up 18% MoM. Allocation of Waaree 545W panels to dealers is optimal; caution on net meter stockouts for B2C projects.
                </p>
              </div>
            </div>

          </div>

          {/* ═══ DIVISION SUMMARIES — EPC / B2B / HR ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── 1. EPC Division Summary ── */}
            <div className="bg-gradient-to-br from-indigo-950/80 to-slate-900/60 backdrop-blur-md border border-indigo-500/20 rounded-xl p-5 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
              {/* Decorative glow */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                      <Sun size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide">EPC Division</h3>
                      <p className="text-[9px] text-indigo-400/80 font-medium">Solar Installation & Net Metering</p>
                    </div>
                  </div>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Active Sites</span>
                    <p className="text-lg font-black text-white font-mono mt-0.5">{stats.activeSites}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Revenue MTD</span>
                    <p className="text-lg font-black text-indigo-400 font-mono mt-0.5">{stats.revenueThisMonth}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">kW Today</span>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">{stats.kwInstalledToday}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Pipeline</span>
                    <p className="text-lg font-black text-amber-400 font-mono mt-0.5">{stats.projectsPipeline}</p>
                  </div>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Net Metering Pending</span>
                    <span className="text-white font-bold font-mono">8 Files</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">PM Surya Ghar Subsidy</span>
                    <span className="text-emerald-400 font-bold font-mono">₹11.7L Expected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Loan Sanctions</span>
                    <span className="text-amber-400 font-bold font-mono">12 Pending</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-500/15">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-500">Pending Payments</span>
                    <span className="text-rose-400 font-bold font-mono">{stats.pendingPayments}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2. B2B Distribution Summary ── */}
            <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <Building2 size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide">B2B Distribution</h3>
                      <p className="text-[9px] text-emerald-400/80 font-medium">Dealer Orders & Wholesale</p>
                    </div>
                  </div>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">LIVE</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Total Sales</span>
                    <p className="text-lg font-black text-white font-mono mt-0.5">₹14.5L</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Active Orders</span>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">3</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Dealers</span>
                    <p className="text-lg font-black text-sky-400 font-mono mt-0.5">3</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Outstanding</span>
                    <p className="text-lg font-black text-rose-400 font-mono mt-0.5">₹3.55L</p>
                  </div>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Pending Owner Approval</span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold text-[9px]">1 Order</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Unpaid Invoices</span>
                    <span className="text-rose-400 font-bold font-mono">2 (₹9.5L)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Flagged Defaulters</span>
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-bold text-[9px]">1 Client</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-500/15">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-500">Top Product: Mono PERC 540W</span>
                    <span className="text-emerald-400 font-bold">150 in stock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. HR & Workforce Summary ── */}
            <div className="bg-gradient-to-br from-violet-950/80 to-slate-900/60 backdrop-blur-md border border-violet-500/20 rounded-xl p-5 shadow-xl relative overflow-hidden group hover:border-violet-500/40 transition-all duration-300">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                      <Users size={18} className="text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide">HR & Workforce</h3>
                      <p className="text-[9px] text-violet-400/80 font-medium">Staff, Leaves & Hiring</p>
                    </div>
                  </div>
                  <span className="text-[8px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded font-bold">
                    {staffList.length || 5} Staff
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Present Today</span>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                      {staffList.length > 0 ? staffList.filter(s => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        return attendanceList.some(a => a.user_id === s.id && a.date === todayStr);
                      }).length : 4}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Absent</span>
                    <p className="text-lg font-black text-rose-400 font-mono mt-0.5">
                      {staffList.length > 0 ? staffList.length - staffList.filter(s => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        return attendanceList.some(a => a.user_id === s.id && a.date === todayStr);
                      }).length : 1}
                    </p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Pending Leaves</span>
                    <p className="text-lg font-black text-amber-400 font-mono mt-0.5">{leavesList.filter(l => l.status === 'Pending').length}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800/50 rounded-lg p-2.5">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Hiring Pipeline</span>
                    <p className="text-lg font-black text-sky-400 font-mono mt-0.5">{candidatesList.filter(c => c.status !== 'Hired' && c.status !== 'Rejected').length}</p>
                  </div>
                </div>

                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Pending Expense Claims</span>
                    <span className="text-rose-400 font-bold font-mono">₹{expensesList.filter(e => e.status === 'Pending').reduce((acc, exp) => acc + exp.amount, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Open Tasks</span>
                    <span className="text-white font-bold font-mono">{tasksList.filter(t => t.status !== 'Completed').length} Active</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Interviews Today</span>
                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-bold text-[9px]">
                      {candidatesList.filter(c => c.status === 'Interview Scheduled' || c.status === 'Technical Round').length} Scheduled
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-violet-500/15">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-500">Attendance Rate</span>
                    <span className="text-emerald-400 font-bold">{staffList.length > 0 ? Math.round((staffList.filter(s => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      return attendanceList.some(a => a.user_id === s.id && a.date === todayStr);
                    }).length / staffList.length) * 100) : 80}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Staff live tracker (Toggled inside Owner view) */}
      {isOwner && showStaffLive && (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Users size={20} />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Active Staff</h4>
                <div className="text-xl font-bold text-white mt-0.5">{staffList.length} Accounts</div>
              </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Present Today</h4>
                <div className="text-xl font-bold text-white mt-0.5">
                  {staffList.filter(s => getAttendanceForUser(s.id).status === 'Present').length} Active
                </div>
              </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Absent / Offline</h4>
                <div className="text-xl font-bold text-white mt-0.5">
                  {staffList.filter(s => getAttendanceForUser(s.id).status === 'Absent').length} Staff
                </div>
              </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Truck size={20} />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Tasks Assigned</h4>
                <div className="text-xl font-bold text-white mt-0.5">{tasksList.length} Tasks</div>
              </div>
            </div>
          </div>

          {/* Middle Row: Staff Status + Candidates Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Staff Status & Attendance logs table */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl p-5">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <Users size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Staff Status &amp; Real-time Operations Logs</h3>
              </div>
              <div className="overflow-x-auto max-h-[280px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="px-4 py-2">Staff Member</th>
                      <th className="px-4 py-2">Role</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Check-in Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
                    {staffList.map((usr) => {
                      const statusData = getAttendanceForUser(usr.id);
                      return (
                        <tr key={usr.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-white">{usr.full_name || usr.username}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                              {usr.designation}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusData.color}`}>
                              {statusData.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">{statusData.check_in}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Candidates pipeline */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl p-5">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus size={16} className="text-sky-400" /> Active Hiring Pipelines (Candidates)
                </h3>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
                {candidatesList.map(c => (
                  <div key={c.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{c.candidate_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{c.position} ({c.department})</p>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getStageColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Leaves & Expenses Approvals Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-6">
              {/* Leaves table */}
              <div>
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                  <Clock size={14} className="text-amber-400" /> Pending Leave Requests
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                        <th className="pb-2">Employee</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Days</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {leavesList.filter(l => l.status === 'Pending').map(leave => (
                        <tr key={leave.id} className="hover:bg-slate-850/20">
                          <td className="py-2.5 font-medium text-white">{leave.user_name}</td>
                          <td className="py-2.5 text-slate-400">{leave.leave_type}</td>
                          <td className="py-2.5 font-mono text-slate-300">{leave.days} day(s)</td>
                          <td className="py-2.5">
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">Pending</span>
                          </td>
                          <td className="py-2.5 text-right space-x-1.5">
                            <button 
                              onClick={() => handleApproveLeave(leave.id)}
                              className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 transition-colors"
                              title="Approve"
                            >
                              <Check size={12} />
                            </button>
                            <button 
                              onClick={() => handleRejectLeave(leave.id)}
                              className="p-1 hover:bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 transition-colors"
                              title="Reject"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {leavesList.filter(l => l.status === 'Pending').length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-500 text-xs">No pending leave requests</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenses table */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                  <IndianRupee size={14} className="text-rose-400" /> Pending Expense Claims
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                        <th className="pb-2">Employee</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {expensesList.filter(e => e.status === 'Pending').map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-850/20">
                          <td className="py-2.5 font-medium text-white">{exp.user_name}</td>
                          <td className="py-2.5 text-slate-400">{exp.expense_type}</td>
                          <td className="py-2.5 text-rose-400 font-bold font-mono">₹{exp.amount}</td>
                          <td className="py-2.5 text-slate-500 truncate max-w-[150px]">{exp.description}</td>
                          <td className="py-2.5 text-right space-x-1.5">
                            <button 
                              onClick={() => handleApproveExpense(exp.id)}
                              className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 transition-colors"
                              title="Approve"
                            >
                              <Check size={12} />
                            </button>
                            <button 
                              onClick={() => handleRejectExpense(exp.id)}
                              className="p-1 hover:bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 transition-colors"
                              title="Reject"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expensesList.filter(e => e.status === 'Pending').length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-500 text-xs">No pending expense claims</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═══ 2. HR PORTAL / STAFF DASHBOARD VIEW ═══ */}
      {isHR && showEPC && (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-indigo-500 rounded-full" />
            <h2 className="text-sm font-bold text-white tracking-wide">Staff &amp; HR Manager Dashboard</h2>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Operations &amp; Admin</span>
          </div>

          {/* Top HR KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard 
              icon={Users} 
              label="Attendance Rate" 
              value={`${staffList.length > 0 ? Math.round((staffList.filter(s => getAttendanceForUser(s.id).status === 'Present').length / staffList.length) * 100) : 0}%`}
              trend={`${staffList.filter(s => getAttendanceForUser(s.id).status === 'Present').length} Present Today`} 
              trendUp={true} 
              color="indigo" 
            />
            <KPICard 
              icon={Clock} 
              label="Pending Leaves" 
              value={`${leavesList.filter(l => l.status === 'Pending').length} Requests`} 
              trend="Needs review" 
              trendUp={false} 
              color="amber" 
            />
            <KPICard 
              icon={UserPlus} 
              label="Hiring Pipeline" 
              value={`${candidatesList.filter(c => c.status !== 'Hired' && c.status !== 'Rejected').length} Candidates`} 
              trend="4 Interviews today" 
              trendUp={true} 
              color="sky" 
            />
            <KPICard 
              icon={IndianRupee} 
              label="Pending Expenses" 
              value={`₹${expensesList.filter(e => e.status === 'Pending').reduce((acc, exp) => acc + exp.amount, 0).toLocaleString()}`} 
              trend={`${expensesList.filter(e => e.status === 'Pending').length} Claims pending`} 
              trendUp={false} 
              color="rose" 
            />
            <KPICard 
              icon={FolderKanban} 
              label="Active Tasks" 
              value={`${tasksList.filter(t => t.status !== 'Completed').length} Tasks`} 
              trend="5 In Progress" 
              trendUp={true} 
              color="emerald" 
            />
            <KPICard 
              icon={Users} 
              label="Total Employees" 
              value={`${staffList.length || 5} Active`} 
              trend="1 New joining soon" 
              trendUp={true} 
              color="violet" 
            />
          </div>

          {/* Middle Row: Staff attendance + Candidates directory */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Attendance directory */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl p-5">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" /> Staff Attendance Directory
                </h3>
              </div>
              <div className="overflow-y-auto max-h-[280px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/60 pb-2">
                      <th className="pb-2 font-semibold">Employee</th>
                      <th className="pb-2 font-semibold">Role</th>
                      <th className="pb-2 font-semibold">Status</th>
                      <th className="pb-2 font-semibold">In Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {(staffList.length > 0 ? staffList : [
                      { id: 1, full_name: 'Rajesh Gupta', username: 'owner', designation: 'Owner' },
                      { id: 2, full_name: 'Priya Sharma', username: 'hr_user', designation: 'HR' },
                      { id: 3, full_name: 'Amit Verma', username: 'sales_user', designation: 'Sales Head' },
                      { id: 4, full_name: 'Suresh Patel', username: 'ops_user', designation: 'Operations Head' },
                      { id: 5, full_name: 'Vikram Malhotra', username: 'installer', designation: 'Operations Head' }
                    ]).map(usr => {
                      const statusData = getAttendanceForUser(usr.id);
                      return (
                        <tr key={usr.id} className="hover:bg-slate-850/40">
                          <td className="py-2.5 font-semibold text-white">{usr.full_name || usr.username}</td>
                          <td className="py-2.5 text-slate-400">{usr.designation}</td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusData.color}`}>
                              {statusData.status}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono text-slate-500">{statusData.check_in}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Candidates pipeline */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl p-5">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus size={16} className="text-sky-400" /> Active Hiring Pipelines
                </h3>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
                {candidatesList.map(c => (
                  <div key={c.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">{c.candidate_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{c.position} ({c.department})</p>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${getStageColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row: Leaves & Expenses Approvals Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Pending leaves and expenses */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-6">
              
              {/* Leaves table */}
              <div>
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                  <Clock size={14} className="text-amber-400" /> Pending Leave Requests
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                        <th className="pb-2">Employee</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Days</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {leavesList.filter(l => l.status === 'Pending').map(leave => (
                        <tr key={leave.id} className="hover:bg-slate-850/20">
                          <td className="py-2.5 font-medium text-white">{leave.user_name}</td>
                          <td className="py-2.5 text-slate-400">{leave.leave_type}</td>
                          <td className="py-2.5 font-mono text-slate-300">{leave.days} day(s)</td>
                          <td className="py-2.5">
                            <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">Pending</span>
                          </td>
                          <td className="py-2.5 text-right space-x-1.5">
                            <button 
                              onClick={() => handleApproveLeave(leave.id)}
                              className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 transition-colors"
                              title="Approve"
                            >
                              <Check size={12} />
                            </button>
                            <button 
                              onClick={() => handleRejectLeave(leave.id)}
                              className="p-1 hover:bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 transition-colors"
                              title="Reject"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {leavesList.filter(l => l.status === 'Pending').length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-500 text-xs">No pending leave requests</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenses table */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                  <IndianRupee size={14} className="text-rose-400" /> Pending Expense Claims
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-semibold">
                        <th className="pb-2">Employee</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {expensesList.filter(e => e.status === 'Pending').map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-850/20">
                          <td className="py-2.5 font-medium text-white">{exp.user_name}</td>
                          <td className="py-2.5 text-slate-400">{exp.expense_type}</td>
                          <td className="py-2.5 text-rose-400 font-bold font-mono">₹{exp.amount}</td>
                          <td className="py-2.5 text-slate-500 truncate max-w-[150px]">{exp.description}</td>
                          <td className="py-2.5 text-right space-x-1.5">
                            <button 
                              onClick={() => handleApproveExpense(exp.id)}
                              className="p-1 hover:bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 transition-colors"
                              title="Approve"
                            >
                              <Check size={12} />
                            </button>
                            <button 
                              onClick={() => handleRejectExpense(exp.id)}
                              className="p-1 hover:bg-rose-500/10 text-rose-400 rounded border border-rose-500/20 transition-colors"
                              title="Reject"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expensesList.filter(e => e.status === 'Pending').length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-500 text-xs">No pending expense claims</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Activity Log */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">HR Activity Log</h3>
              </div>
              <div className="divide-y divide-slate-800/40 max-h-80 overflow-y-auto">
                {displayActivities.map((item, index) => {
                  const IconComp = ACTIVITY_ICONS[item?.type] || Activity;
                  const colorClasses = ACTIVITY_COLORS[item?.type] || ACTIVITY_COLORS.info;
                  return (
                    <div key={item?.id ? `${item.id}-${index}` : `hr-activity-${index}`} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-800/20 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${colorClasses} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <IconComp size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">{item.message || item.text}</p>
                        <span className="text-[10px] text-slate-600 mt-1 block">{item.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═══ 3. SALES / CRM WORKSPACE DASHBOARD VIEW ═══ */}
      {isSales && showEPC && (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-sm font-bold text-white tracking-wide">Sales Rep Workspace</h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">CRM Leads &amp; Quotations</span>
          </div>

          {/* Top Sales KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard icon={UserPlus} label="New Leads Today" value="3 Leads" trend="+1 since yesterday" trendUp={true} color="indigo" />
            <KPICard icon={Phone} label="Assigned CRM Leads" value={`${filteredRecentLeads.length} Leads`} trend="Focus pipeline" color="sky" />
            <KPICard icon={Zap} label="AI Hot Leads" value={`${filteredRecentLeads.filter(l => l.aiScore >= 80).length} Hot`} trend="High interest deals" trendUp={true} color="amber" />
            <KPICard icon={FileText} label="Generated Proposals" value="7 Proposals" trend="5 Pending closure" trendUp={true} color="rose" />
            <KPICard icon={Sun} label="Target Capacity" value="120 kWp" trend="102 kWp Committed" trendUp={true} color="emerald" />
            <KPICard icon={TrendingUp} label="Monthly Conversion" value="24.5%" trend="+2.1% MoM increase" trendUp={true} color="violet" />
          </div>

          {/* Middle Row: Assigned leads + AI proposals shortcut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Leads table */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl p-5">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Phone size={16} className="text-indigo-400" /> Your Assigned CRM Leads
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/60 pb-2">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Source</th>
                      <th className="pb-2">Stage</th>
                      <th className="pb-2">Capacity</th>
                      <th className="pb-2 text-right pr-4">AI Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredRecentLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-slate-850/20">
                        <td className="py-3 font-semibold text-white">
                          {lead.name}
                          <p className="text-[10px] text-slate-500 font-normal">{lead.phone}</p>
                        </td>
                        <td className="py-3 text-slate-400">{lead.source}</td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStageColor(lead.stage)}`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300 font-mono font-bold">{lead.kw}</td>
                        <td className="py-3 font-bold font-mono text-right pr-4">
                          <span className={getScoreColor(lead.aiScore)}>{lead.aiScore}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: AI Insights suggestion cards */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap size={16} className="text-amber-400 animate-pulse" /> AI Hot Lead Assistant
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Award size={12} className="text-amber-400" /> High-Value Target
                    </p>
                    <p className="text-slate-300"><strong>Rajesh Patel</strong> (AI Score: 85) recently requested a quote. Follow up on his 10 kW rooftop survey design today.</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Target size={12} className="text-amber-400" /> Pending Proposal
                    </p>
                    <p className="text-slate-300"><strong>Amit Joshi</strong> (AI Score: 91) has approved feasibility. Send the AI Proposal generated on 3 kW Solis system.</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => window.location.hash = '#/crm'}
                className="mt-6 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                Go to CRM Pipeline <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Targets progress + sales logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Targets progress */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                  <Target size={14} className="text-emerald-400" /> Monthly Sales Target Achievements
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Total Installed Capacity</span>
                      <span className="text-white">102 kWp / 120 kWp</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">85% achieved — 18 kWp pending for target bonus</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Lead Conversions</span>
                      <span className="text-white">18 Won / 25 Target</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: '72%' }} />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">72% of monthly customer onboardings complete</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 mt-4">
                <span>Commission earned: <strong className="text-emerald-400 font-mono">₹45,800</strong></span>
                <span>Active deals in negotiation: <strong>4 Contracts</strong></span>
              </div>
            </div>

            {/* Right: Activity Log */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Sales Activity Log</h3>
              </div>
              <div className="divide-y divide-slate-800/40 max-h-80 overflow-y-auto">
                {displayActivities.map((item) => {
                  const IconComp = ACTIVITY_ICONS[item.type] || Activity;
                  const colorClasses = ACTIVITY_COLORS[item.type] || ACTIVITY_COLORS.info;
                  return (
                    <div key={item.id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-800/20 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${colorClasses} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <IconComp size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">{item.message || item.text}</p>
                        <span className="text-[10px] text-slate-600 mt-1 block">{item.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═══ 3B. B2B SALES WORKSPACE DASHBOARD VIEW ═══ */}
      {isB2BSales && showEPC && (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-violet-500 rounded-full" />
            <h2 className="text-sm font-bold text-white tracking-wide">B2B Sales Workspace</h2>
            <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">Dealer Orders &amp; Distribution</span>
          </div>

          {/* Top B2B Sales KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard icon={Store} label="Active Dealers" value="3 Clients" trend="1 Flagged defaulter" trendUp={false} color="indigo" />
            <KPICard icon={Package} label="Pending Orders" value="1 Orders" trend="Needs Owner approval" trendUp={false} color="amber" />
            <KPICard icon={Truck} label="Dispatched Today" value="1 Shipment" trend="Porter LR tracking" trendUp={true} color="emerald" />
            <KPICard icon={IndianRupee} label="B2B Revenue (MTD)" value="₹14.5L" trend="+18% MoM" trendUp={true} color="violet" />
            <KPICard icon={FileText} label="Unpaid Invoices" value="2 Invoices" trend="₹9.5L Outstanding" trendUp={false} color="rose" />
            <KPICard icon={TrendingUp} label="Order Conversion" value="75%" trend="3 of 4 orders delivered" trendUp={true} color="sky" />
          </div>

          {/* Middle Row: Order Pipeline + Dealer Directory */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recent B2B Orders */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl p-5">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package size={16} className="text-violet-400" /> B2B Dealer Order Pipeline
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/60 pb-2">
                      <th className="pb-2">Client / EPC</th>
                      <th className="pb-2">Product</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {[
                      { id: 101, client: 'Bhushan Solar (EPC)', product: 'Mono PERC 540W', qty: 50, amount: '₹4.6L', status: 'Delivered', statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                      { id: 102, client: 'Aditya Power EPC', product: 'Inverter 5kVA', qty: 5, amount: '₹2.25L', status: 'Confirmed', statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                      { id: 103, client: 'Apex Green Solutions', product: 'Mono PERC 540W', qty: 20, amount: '₹1.9L', status: 'Pending Approval', statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                      { id: 104, client: 'Bhushan Solar (EPC)', product: 'Poly 335W', qty: 100, amount: '₹5.8L', status: 'Dispatched', statusColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                    ].map(order => (
                      <tr key={order.id} className="hover:bg-slate-850/20">
                        <td className="py-3 font-semibold text-white">
                          {order.client}
                          <p className="text-[10px] text-slate-500 font-normal">Order #{order.id}</p>
                        </td>
                        <td className="py-3 text-slate-400">{order.product}</td>
                        <td className="py-3 text-slate-300 font-mono font-bold">{order.qty}</td>
                        <td className="py-3 text-violet-400 font-bold font-mono">{order.amount}</td>
                        <td className="py-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${order.statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button 
                onClick={() => window.location.hash = '#/b2b'}
                className="mt-4 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                Open Full B2B Portal <ArrowRight size={14} />
              </button>
            </div>

            {/* Right: Dealer Clients Overview */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Store size={16} className="text-emerald-400" /> Registered Dealer Clients
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Bhushan Solar Systems', state: 'Rajasthan', dues: '₹12K', behavior: 'Good', behaviorColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  { name: 'Aditya Power EPC', state: 'Gujarat', dues: '₹98K', behavior: 'Delayed', behaviorColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  { name: 'Apex Green Solutions', state: 'Delhi', dues: '₹2.45L', behavior: 'Defaulter', behaviorColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                ].map((client, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">{client.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{client.state} • Dues: <span className="text-rose-400 font-mono">{client.dues}</span></p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${client.behaviorColor}`}>
                      {client.behavior}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Recommendation */}
              <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[10px] text-slate-300 leading-normal flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">💡</span>
                <p>
                  <strong>AI Alert:</strong> Apex Green Solutions has exceeded credit limit (₹1.5L) with ₹2.45L outstanding. Block new orders until partial payment is received.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Targets + Activity Log */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: B2B Targets */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-800 pb-3">
                <Target size={14} className="text-violet-400" /> Monthly B2B Sales Targets
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">Total Dealer Sales Volume</span>
                    <span className="text-white">₹14.5L / ₹20L</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                    <div className="h-full bg-violet-500" style={{ width: '72.5%' }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">72.5% achieved — ₹5.5L more to unlock incentive tier</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-400">New Dealer Onboardings</span>
                    <span className="text-white">3 / 5 Target</span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '60%' }} />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">2 more dealer registrations needed this quarter</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500 mt-4">
                <span>Commission earned: <strong className="text-violet-400 font-mono">₹32,500</strong></span>
                <span>Pending dispatches: <strong>2 Orders</strong></span>
              </div>
            </div>

            {/* Right: Activity Log */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <FileText size={16} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-white">B2B Sales Activity Log</h3>
              </div>
              <div className="divide-y divide-slate-800/40 max-h-80 overflow-y-auto">
                {[
                  { id: 1, type: 'success', message: 'Order #101 delivered to Bhushan Solar Systems — 50x Mono PERC 540W', time: '2 hours ago' },
                  { id: 2, type: 'info',    message: 'New order placed by Apex Green Solutions — 20x Mono PERC 540W (Pending Owner Approval)', time: '5 hours ago' },
                  { id: 3, type: 'warning', message: 'Payment overdue: Aditya Power EPC — Invoice SLV-B2B-002 (₹2.65L) past due date', time: '1 day ago' },
                  { id: 4, type: 'info',    message: 'WhatsApp dispatch alert sent to Bhushan Solar — Order #104 via Delhivery', time: '1 day ago' },
                  { id: 5, type: 'success', message: 'Invoice SLV-B2B-001 payment received from Bhushan Solar — ₹5.43L RTGS', time: '2 days ago' },
                ].map((item) => {
                  const IconComp = ACTIVITY_ICONS[item.type] || Activity;
                  const colorClasses = ACTIVITY_COLORS[item.type] || ACTIVITY_COLORS.info;
                  return (
                    <div key={item.id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-800/20 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${colorClasses} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <IconComp size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                        <span className="text-[10px] text-slate-600 mt-1 block">{item.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ═══ 4. OPERATIONS / SITE ENGINEER WORKSPACE DASHBOARD VIEW ═══ */}
      {isOps && showEPC && (
        <div className="space-y-6 animate-in fade-in duration-300 w-full">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-amber-500 rounded-full" />
            <h2 className="text-sm font-bold text-white tracking-wide">Operations &amp; Engineering Workspace</h2>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">Site Installation &amp; Telemetry</span>
          </div>

          {/* Top Operations KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KPICard icon={FolderKanban} label="Supervised Projects" value={`${b2cProjectsList.filter(p => p.status === 'In Progress').length} Projects`} trend="Active site management" color="indigo" />
            <KPICard icon={Clock} label="Sites Pending Survey" value="3 Sites" trend="Vikram Malhotra assigned" color="sky" />
            <KPICard icon={Zap} label="Net Metering Sync" value="2 Pending" trend="1 Discom filing today" color="amber" />
            <KPICard icon={ShieldCheck} label="Pending Inspections" value="4 Pending" trend="Discom visits scheduled" color="rose" />
            <KPICard icon={Package} label="BOM Sourcing Checks" value="2 Alerts" trend="Out of stock cables/meters" color="emerald" />
            <KPICard icon={CheckCircle2} label="Completed Handovers" value={`${b2cProjectsList.filter(p => p.status === 'Completed').length} Sites`} trend="+3 this month" trendUp={true} color="violet" />
          </div>

          {/* Middle Row: Supervised Projects + Inverter telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Projects table */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl p-5">
              <div className="border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderKanban size={16} className="text-indigo-400" /> Active Operations Projects
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/60 pb-2">
                      <th className="pb-2">Project ID / Client</th>
                      <th className="pb-2">City</th>
                      <th className="pb-2">Capacity</th>
                      <th className="pb-2">Milestone Stage</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {b2cProjectsList.map(project => (
                      <tr key={project.id} className="hover:bg-slate-850/20">
                        <td className="py-3 font-semibold text-white">
                          {project.customer_name}
                          <p className="text-[10px] text-slate-500 font-normal">{project.id}</p>
                        </td>
                        <td className="py-3 text-slate-400">{project.city}</td>
                        <td className="py-3 text-slate-300 font-mono font-bold">{project.capacity} kWp</td>
                        <td className="py-3">
                          <span className="text-[10px] bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded font-mono text-indigo-400">
                            {project.net_metering_stage || project.stage}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
                            project.status === 'Completed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Live Inverter Telemetry Portfolio */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
              <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sun size={16} className="text-amber-400" /> Solar Generation Telemetry
                </h3>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">LIVE</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex flex-col justify-between">
                    <span className="text-[8px] text-slate-500 uppercase font-bold">Generating Power</span>
                    <p className="text-lg font-black text-white font-mono mt-1">{liveMetrics.activePower} kW</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex flex-col justify-between">
                    <span className="text-[8px] text-slate-500 uppercase font-bold">Yield Today</span>
                    <p className="text-lg font-black text-white font-mono mt-1">{liveMetrics.todayYield} kWh</p>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex justify-between items-center text-[10px]">
                  <div>
                    <span className="text-[8px] text-slate-500 block mb-0.5">CO2 Carbon Prevented</span>
                    <span className="text-emerald-400 font-bold font-mono">{liveMetrics.co2Saved} kg offset</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 block mb-0.5">Trees Equivalent</span>
                    <span className="text-emerald-400 font-bold font-mono">{liveMetrics.trees} Trees saved</span>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.hash = '#/b2c_projects'}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  View Client Inverter Graphs <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Checklist Tasks + Operations logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Operations tasks list */}
            <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-xl">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-800 pb-3">
                <CheckCircle2 size={14} className="text-indigo-400" /> Supervised Operations Tasks
              </h3>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {tasksList.map(task => (
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
                        <p className="text-[10px] text-slate-500 mt-0.5">Supervisor: {task.assigned_to}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase ${
                      task.priority === 'High' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {task.priority || 'Medium'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Activity Log */}
            <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-2">
                <FileText size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Operations Activity Log</h3>
              </div>
              <div className="divide-y divide-slate-800/40 max-h-80 overflow-y-auto">
                {displayActivities.map((item) => {
                  const IconComp = ACTIVITY_ICONS[item.type] || Activity;
                  const colorClasses = ACTIVITY_COLORS[item.type] || ACTIVITY_COLORS.info;
                  return (
                    <div key={item.id} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-800/20 transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${colorClasses} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <IconComp size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">{item.message || item.text}</p>
                        <span className="text-[10px] text-slate-600 mt-1 block">{item.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ═══ BOTTOM ROW: Revenue Chart + System Activity Log (Owner only) ═══ */}
      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Revenue Chart (7/12) */}
          <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  EPC Revenue
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {['6M', '1Y', 'ALL'].map((period) => (
                  <button
                    key={period}
                    className="px-3 py-1 text-[10px] font-medium rounded-lg bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Stacked chart bars */}
            <div className="flex items-end justify-between gap-2 h-48 px-2">
              {[
                { epc: 45 }, { epc: 32 }, { epc: 58 },
                { epc: 40 }, { epc: 68 }, { epc: 52 },
                { epc: 75 }, { epc: 42 }, { epc: 62 },
                { epc: 35 }, { epc: 50 }, { epc: 70 },
              ].map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-stretch" style={{ height: `${data.epc}%` }}>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-indigo-600/40 to-indigo-500/80 transition-all duration-500 hover:from-indigo-500/60 hover:to-indigo-400"
                      style={{ height: '100%', minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-[8px] text-slate-500">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /><span className="text-[10px] text-slate-400">EPC (C2C)</span></div>
              </div>
              <span className="text-xs text-emerald-400 font-medium">+23% YoY Growth</span>
            </div>
          </div>

          {/* Activity Log (5/12) */}
          <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800/60 flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>

            <div className="divide-y divide-slate-800/40 max-h-80 overflow-y-auto">
            {displayActivities.map((item, index) => {
              const IconComp = ACTIVITY_ICONS[item?.type] || Activity;
              const colorClasses = ACTIVITY_COLORS[item?.type] || ACTIVITY_COLORS.info;

              return (
                <div key={item?.id ? `${item.id}-${index}` : `activity-${index}`} className="px-6 py-3.5 flex items-start gap-3 hover:bg-slate-800/20 transition-colors">
                    <div className={`w-7 h-7 rounded-lg ${colorClasses} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <IconComp size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-relaxed">{item.message || item.text}</p>
                      <span className="text-[10px] text-slate-600 mt-1 block">{item.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      </div>

      {/* ── RIGHT: AI Insights Sticky Sidebar ── */}
      <div className="hidden xl:block w-[320px] flex-shrink-0">
        <div className="sticky top-8">
          <AIInsights module={isSales ? 'crm' : (isB2BSales ? 'inventory' : (isOps ? 'projects' : (isHR ? 'staff' : 'crm')))} />
        </div>
      </div>
    </div>
  );
}
