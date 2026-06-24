/**
 * staff/StaffTrackerModule.jsx — Full HR Portal Hub
 * 
 * A complete HR management system for Solar EPC company with 5 tabs:
 * 1. Directory & Attendance - Real-time geo-fencing, attendance calendar
 * 2. Hiring Portal - Candidate pipeline, open positions, recruitment tracking
 * 3. Leave Requests - Leave approval/rejection workflow
 * 4. Expense Claims - Site expense reimbursement tracking
 * 5. Tasks - Staff task assignment and project allocations
 * 
 * Features:
 * - WhatsApp webhook simulation for attendance & AI inspections
 * - AI Insights sidebar with module="staff"
 * - RBAC: Owner & HR see all tabs, other roles see limited view
 */

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import AIInsights from '../dashboard/AIInsights';
import {
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Play,
  ClipboardList,
  UserCheck,
  Send,
  Camera,
  Image,
  RefreshCw,
  Briefcase,
  Calendar,
  FileText,
  DollarSign,
  UserPlus,
  XCircle,
  ChevronRight,
  Star,
  Phone,
  Mail,
  Building,
  Download,
  Printer,
  Filter,
  Search,
  TrendingUp,
  Award,
  CreditCard,
  Fuel,
  Wrench,
  Utensils,
  Home,
  Package,
  Check,
  X,
} from 'lucide-react';

// ── Tab definitions ──
const HR_TABS = [
  { id: 'directory', label: 'Directory & Attendance', icon: UserCheck, color: 'emerald' },
  { id: 'hiring', label: 'Hiring Portal', icon: UserPlus, color: 'violet' },
  { id: 'leaves', label: 'Leave Requests', icon: Calendar, color: 'amber' },
  { id: 'expenses', label: 'Expense Claims', icon: CreditCard, color: 'cyan' },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList, color: 'indigo' },
];

// ── Candidate pipeline stages ──
const CANDIDATE_STAGES = ['Applied', 'Screening', 'Interview Scheduled', 'Technical Round', 'HR Round', 'Offered', 'Hired', 'Rejected'];
const CANDIDATE_STAGE_COLORS = {
  'Applied': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'Screening': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Interview Scheduled': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Technical Round': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'HR Round': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Offered': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Hired': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Rejected': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

// ── Expense type icons ──
const EXPENSE_ICONS = {
  'Travel': MapPin,
  'Petrol': Fuel,
  'Tools': Wrench,
  'Food': Utensils,
  'Accommodation': Home,
  'Materials': Package,
};

export default function StaffTrackerModule({ user }) {
  const [activeTab, setActiveTab] = useState('directory');
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // HR-specific data
  const [attendanceActivity, setAttendanceActivity] = useState('');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [dailyRate, setDailyRate] = useState(1500);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [expenseClaims, setExpenseClaims] = useState([]);

  // User management states (Owner & HR only)
  const [usersList, setUsersList] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    designation: 'Sales Head',
    full_name: '',
    email: ''
  });
  const [editUserMode, setEditUserMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  // New task modal states
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    assigned_to: '',
    title: '',
    description: '',
    priority: 'Medium',
    due_date: '',
    related_project_id: ''
  });

  // Leave request modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'Casual',
    start_date: '',
    end_date: '',
    days: 1,
    reason: ''
  });

  // Candidate modal
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    position: '',
    department: 'Engineering',
    candidate_name: '',
    email: '',
    phone: '',
    experience_years: '',
    current_company: '',
    resume_link: '',
    notes: ''
  });

  // Expense claim modal
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    project_id: '',
    project_name: '',
    expense_type: 'Travel',
    amount: '',
    description: '',
    bill_date: ''
  });

  // WhatsApp simulation modal states
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simType, setSimType] = useState('location');
  const [simForm, setSimForm] = useState({
    staff_name: 'Vikram Malhotra',
    latitude: '26.9124',
    longitude: '75.7873',
    project_id: '1',
    milestone_name: 'Panel Installation',
    image_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600',
    is_fail: 'false'
  });
  const [simResult, setSimResult] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  // Filter states
  const [candidateFilter, setCandidateFilter] = useState('All');
  const [leaveFilter, setLeaveFilter] = useState('All');
  const [expenseFilter, setExpenseFilter] = useState('All');

  const isHROrOwner = user?.designation === 'Owner' || user?.designation === 'HR';

  // ── Mock seed data for HR features ──
  const mockLeaveRequests = [
    { id: 1, user_id: 3, user_name: 'Amit Verma', leave_type: 'Casual', start_date: '2026-06-20', end_date: '2026-06-21', days: 2, reason: 'Family function in hometown', status: 'Pending', applied_on: '2026-06-17', reviewed_by: null },
    { id: 2, user_id: 4, user_name: 'Suresh Patel', leave_type: 'Sick', start_date: '2026-06-15', end_date: '2026-06-16', days: 2, reason: 'Fever and body ache', status: 'Approved', applied_on: '2026-06-14', reviewed_by: 'Priya Sharma' },
    { id: 3, user_id: 5, user_name: 'Ankit Sharma', leave_type: 'Earned', start_date: '2026-07-01', end_date: '2026-07-05', days: 5, reason: 'Annual vacation trip to Shimla', status: 'Pending', applied_on: '2026-06-18', reviewed_by: null },
    { id: 4, user_id: 3, user_name: 'Amit Verma', leave_type: 'Half Day', start_date: '2026-06-12', end_date: '2026-06-12', days: 0.5, reason: 'Doctor appointment in afternoon', status: 'Approved', applied_on: '2026-06-11', reviewed_by: 'Priya Sharma' },
    { id: 5, user_id: 4, user_name: 'Suresh Patel', leave_type: 'Casual', start_date: '2026-06-25', end_date: '2026-06-25', days: 1, reason: 'Personal work at bank', status: 'Rejected', applied_on: '2026-06-18', reviewed_by: 'Priya Sharma' },
    { id: 6, user_id: 2, user_name: 'Priya Sharma', leave_type: 'Earned', start_date: '2026-07-10', end_date: '2026-07-12', days: 3, reason: 'Sister wedding ceremony', status: 'Pending', applied_on: '2026-06-19', reviewed_by: null },
  ];

  const mockCandidates = [
    { id: 1, position: 'Senior Site Engineer', department: 'Engineering', candidate_name: 'Rohit Mehra', email: 'rohit.m@gmail.com', phone: '9876123450', experience_years: 5, current_company: 'Tata Power Solar', status: 'Interview Scheduled', applied_date: '2026-06-10', resume_link: '#', notes: 'Strong experience in 50kW+ commercial installations' },
    { id: 2, position: 'Solar Installer Technician', department: 'Operations', candidate_name: 'Manoj Kumar', email: 'manoj.k@yahoo.com', phone: '9812345670', experience_years: 3, current_company: 'Local Contractor', status: 'Applied', applied_date: '2026-06-16', resume_link: '#', notes: 'Knows panel mounting and DC wiring' },
    { id: 3, position: 'B2B Telecaller', department: 'Sales', candidate_name: 'Sneha Gupta', email: 'sneha.g@gmail.com', phone: '9998877665', experience_years: 2, current_company: 'SolarEdge India', status: 'Technical Round', applied_date: '2026-06-05', resume_link: '#', notes: 'Excellent communication, knows solar industry terminology' },
    { id: 4, position: 'Design Engineer (AutoCAD)', department: 'Engineering', candidate_name: 'Vivek Agarwal', email: 'vivek.a@outlook.com', phone: '9123098765', experience_years: 4, current_company: 'Vikram Solar', status: 'Offered', applied_date: '2026-05-28', resume_link: '#', notes: 'Expert in single-line diagrams and shadow analysis' },
    { id: 5, position: 'Project Manager', department: 'Operations', candidate_name: 'Deepika Nair', email: 'deepika.n@corp.in', phone: '9087654321', experience_years: 7, current_company: 'Adani Solar', status: 'HR Round', applied_date: '2026-06-01', resume_link: '#', notes: 'Managed 200+ residential installations across Gujarat' },
    { id: 6, position: 'Electrician (Licensed)', department: 'Operations', candidate_name: 'Ram Prasad', email: 'ram.p@email.com', phone: '9234567890', experience_years: 8, current_company: 'Self Employed', status: 'Hired', applied_date: '2026-05-15', resume_link: '#', notes: 'Licensed wireman, 8 years industrial experience' },
    { id: 7, position: 'Accounts Executive', department: 'Finance', candidate_name: 'Kavya Reddy', email: 'kavya.r@gmail.com', phone: '9345678901', experience_years: 3, current_company: 'Clean Energy Co.', status: 'Rejected', applied_date: '2026-05-20', resume_link: '#', notes: 'Good profile but salary expectation too high' },
  ];

  const mockExpenseClaims = [
    { id: 1, user_id: 4, user_name: 'Suresh Patel', project_id: 1, project_name: 'Bansal Residence 8kW', expense_type: 'Travel', amount: 1200, description: 'Cab to Bansal site for panel inspection', bill_date: '2026-06-15', status: 'Approved', submitted_on: '2026-06-16', reviewed_by: 'Priya Sharma' },
    { id: 2, user_id: 4, user_name: 'Suresh Patel', project_id: 2, project_name: 'Choudhary Factory 50kW', expense_type: 'Petrol', amount: 800, description: 'Bike petrol for daily site visits (5 days)', bill_date: '2026-06-14', status: 'Pending', submitted_on: '2026-06-17', reviewed_by: null },
    { id: 3, user_id: 3, user_name: 'Amit Verma', project_id: null, project_name: 'Client Meetings', expense_type: 'Food', amount: 650, description: 'Lunch with potential B2B client Mr. Singh', bill_date: '2026-06-16', status: 'Pending', submitted_on: '2026-06-17', reviewed_by: null },
    { id: 4, user_id: 5, user_name: 'Ankit Sharma', project_id: null, project_name: 'Market Survey', expense_type: 'Travel', amount: 2500, description: 'Train ticket to Ahmedabad for dealer meeting', bill_date: '2026-06-10', status: 'Approved', submitted_on: '2026-06-12', reviewed_by: 'Priya Sharma' },
    { id: 5, user_id: 4, user_name: 'Suresh Patel', project_id: 1, project_name: 'Bansal Residence 8kW', expense_type: 'Tools', amount: 1800, description: 'Crimping tool and MC4 connector kit purchase', bill_date: '2026-06-13', status: 'Paid', submitted_on: '2026-06-14', reviewed_by: 'Rajesh Gupta' },
    { id: 6, user_id: 4, user_name: 'Suresh Patel', project_id: 2, project_name: 'Choudhary Factory 50kW', expense_type: 'Accommodation', amount: 3500, description: '2 nights stay at Bhiwadi during commissioning', bill_date: '2026-06-18', status: 'Pending', submitted_on: '2026-06-19', reviewed_by: null },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffData, attendanceData, tasksData, projData, usersData] = await Promise.all([
        apiCall('/staff/directory'),
        apiCall('/staff/attendance'),
        apiCall('/staff/tasks'),
        apiCall('/projects'),
        isHROrOwner ? apiCall('/staff/users') : Promise.resolve([])
      ]);
      setStaff(staffData);
      setAttendance(attendanceData);
      setTasks(tasksData);
      setProjects(projData);
      if (isHROrOwner) setUsersList(usersData);

      // Fetch HR-specific data
      if (isHROrOwner) {
        try {
          const [leavesData, candidatesData, expensesData] = await Promise.all([
            apiCall('/staff/leaves'),
            apiCall('/staff/candidates'),
            apiCall('/staff/expenses')
          ]);
          setLeaveRequests(leavesData);
          setCandidates(candidatesData);
          setExpenseClaims(expensesData);
        } catch {
          // Fallback to mock data if API not ready yet
          setLeaveRequests(mockLeaveRequests);
          setCandidates(mockCandidates);
          setExpenseClaims(mockExpenseClaims);
        }
      }
    } catch (err) {
      console.warn('API error, loading mock data:', err.message);
      setStaff([
        { id: 1, username: 'owner', designation: 'Owner', full_name: 'Rajesh Gupta', email: 'rajesh@suncraftpower.in' },
        { id: 2, username: 'hr_user', designation: 'HR', full_name: 'Priya Sharma', email: 'priya@suncraftpower.in' },
        { id: 3, username: 'sales_user', designation: 'Sales Head', full_name: 'Amit Verma', email: 'amit@suncraftpower.in' },
        { id: 4, username: 'ops_user', designation: 'Operations Head', full_name: 'Suresh Patel', email: 'suresh@suncraftpower.in' },
        { id: 5, username: 'b2b_sales', designation: 'B2B Sales', full_name: 'Ankit Sharma', email: 'ankit@suncraftpower.in' }
      ]);
      setAttendance([
        { id: 1, user_id: 4, date: new Date().toISOString().split('T')[0], status: 'Present', check_in: '09:15 AM', check_out: '', current_activity: 'Field Site Survey at Bansal Residence' },
        { id: 2, user_id: 3, date: new Date().toISOString().split('T')[0], status: 'Present', check_in: '09:00 AM', check_out: '', current_activity: 'At Bhiwadi Factory Warehouse' }
      ]);
      setTasks([
        { id: 1, assigned_to: 'Vikram Malhotra', title: 'Site survey: Bansal Residence', description: 'Analyze structural capacity and draw shadow map.', priority: 'High', status: 'Completed', due_date: '2026-06-18' },
        { id: 2, assigned_to: 'Vikram Malhotra', title: 'Mounting structures setup', description: 'Align hot-dip galvanized mounting rails.', priority: 'High', status: 'In Progress', due_date: '2026-06-20' },
        { id: 3, assigned_to: 'Suresh Patel', title: 'Approve single line diagrams', description: 'Verify electrical CAD layouts.', priority: 'Medium', status: 'Pending', due_date: '2026-06-25' }
      ]);
      setUsersList([
        { id: 1, username: 'owner', designation: 'Owner', full_name: 'Rajesh Gupta', email: 'rajesh@suncraftpower.in' },
        { id: 2, username: 'hr_user', designation: 'HR', full_name: 'Priya Sharma', email: 'priya@suncraftpower.in' },
        { id: 3, username: 'sales_user', designation: 'Sales Head', full_name: 'Amit Verma', email: 'amit@suncraftpower.in' },
        { id: 4, username: 'ops_user', designation: 'Operations Head', full_name: 'Suresh Patel', email: 'suresh@suncraftpower.in' },
        { id: 5, username: 'b2b_sales', designation: 'B2B Sales', full_name: 'Ankit Sharma', email: 'ankit@suncraftpower.in' }
      ]);
      setLeaveRequests(mockLeaveRequests);
      setCandidates(mockCandidates);
      setExpenseClaims(mockExpenseClaims);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers ──

  const handleMarkAttendance = async (action) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    
    let payload = {
      user_id: user?.id,
      date: todayStr,
    };
    
    if (action === 'check_in') {
      payload.status = 'Present';
      payload.check_in = timeStr;
      payload.current_activity = attendanceActivity || 'Office Work';
    } else {
      payload.check_out = timeStr;
      payload.status = 'Checked Out';
    }
    
    try {
      await apiCall('/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setAttendanceActivity('');
      fetchData();
    } catch (err) {
      console.warn('API attendance log failed, updating locally', err);
      // Fallback
      setAttendance(prev => {
        const existingIdx = prev.findIndex(a => a.user_id === user?.id && a.date === todayStr);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...payload };
          return updated;
        } else {
          return [...prev, { id: Date.now(), ...payload }];
        }
      });
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/staff/tasks', { method: 'POST', body: JSON.stringify(taskForm) });
      setTaskModalOpen(false);
      setTaskForm({ assigned_to: '', title: '', description: '', priority: 'Medium', due_date: '', related_project_id: '' });
      fetchData();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  };

  const handleUpdateTaskStatus = async (taskId, currentStatus) => {
    let nextStatus = 'In Progress';
    if (currentStatus === 'Pending') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed';
    else return;
    try {
      await apiCall(`/staff/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) });
      fetchData();
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    }
  };

  const handleLeaveAction = async (leaveId, action) => {
    try {
      await apiCall(`/staff/leaves/${leaveId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: action, reviewed_by: user?.full_name || user?.username })
      });
      fetchData();
    } catch (err) {
      setLeaveRequests(prev => prev.map(l => l.id === leaveId ? { ...l, status: action, reviewed_by: user?.full_name } : l));
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    const newLeave = {
      ...leaveForm,
      user_id: user?.id,
      user_name: user?.full_name || user?.username,
      status: 'Pending',
      applied_on: new Date().toISOString().split('T')[0]
    };
    try {
      await apiCall('/staff/leaves', { method: 'POST', body: JSON.stringify(newLeave) });
      setLeaveModalOpen(false);
      setLeaveForm({ leave_type: 'Casual', start_date: '', end_date: '', days: 1, reason: '' });
      fetchData();
    } catch (err) {
      setLeaveRequests(prev => [...prev, { id: Date.now(), ...newLeave }]);
      setLeaveModalOpen(false);
    }
  };

  const handleCandidateStatusUpdate = async (candidateId, newStatus) => {
    try {
      await apiCall(`/staff/candidates/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus } : c));
    }
  };

  const handleSubmitCandidate = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/staff/candidates', { method: 'POST', body: JSON.stringify(candidateForm) });
      setCandidateModalOpen(false);
      setCandidateForm({ position: '', department: 'Engineering', candidate_name: '', email: '', phone: '', experience_years: '', current_company: '', resume_link: '', notes: '' });
      fetchData();
    } catch (err) {
      setCandidates(prev => [...prev, { id: Date.now(), ...candidateForm, status: 'Applied', applied_date: new Date().toISOString().split('T')[0] }]);
      setCandidateModalOpen(false);
    }
  };

  const handleExpenseAction = async (expenseId, action) => {
    try {
      await apiCall(`/staff/expenses/${expenseId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: action, reviewed_by: user?.full_name || user?.username })
      });
      fetchData();
    } catch (err) {
      setExpenseClaims(prev => prev.map(e => e.id === expenseId ? { ...e, status: action, reviewed_by: user?.full_name } : e));
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    const newExpense = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      user_id: user?.id,
      user_name: user?.full_name || user?.username,
      status: 'Pending',
      submitted_on: new Date().toISOString().split('T')[0]
    };
    try {
      await apiCall('/staff/expenses', { method: 'POST', body: JSON.stringify(newExpense) });
      setExpenseModalOpen(false);
      setExpenseForm({ project_id: '', project_name: '', expense_type: 'Travel', amount: '', description: '', bill_date: '' });
      fetchData();
    } catch (err) {
      setExpenseClaims(prev => [...prev, { id: Date.now(), ...newExpense }]);
      setExpenseModalOpen(false);
    }
  };

  const handleTriggerWhatsAppSimulation = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    setSimResult('');
    try {
      let bodyPayload = { phone: '919876543210', staff_name: simForm.staff_name };
      if (simType === 'location') {
        bodyPayload.latitude = parseFloat(simForm.latitude);
        bodyPayload.longitude = parseFloat(simForm.longitude);
      } else {
        bodyPayload.image_url = simForm.image_url;
        bodyPayload.project_id = parseInt(simForm.project_id, 10);
        bodyPayload.milestone_name = simForm.milestone_name;
        bodyPayload.text = simForm.is_fail === 'true' ? 'Inspection failed' : 'Photo for verification';
      }
      const res = await fetch('http://localhost:5000/api/staff/webhook/whatsapp-inspection', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const resData = await res.json();
      setSimResult(resData.message || 'Workflow executed.');
      fetchData();
    } catch (err) {
      setSimResult(`Connection error: ${err.message}. Make sure backend server is active.`);
    } finally {
      setSimLoading(false);
    }
  };

  const handleOnboardUser = async (e) => {
    e.preventDefault();
    try {
      if (editUserMode) {
        await apiCall(`/staff/users/${selectedUserId}`, {
          method: 'PUT',
          body: JSON.stringify({ designation: userForm.designation, full_name: userForm.full_name, email: userForm.email })
        });
      } else {
        await apiCall('/staff/users', { method: 'POST', body: JSON.stringify(userForm) });
      }
      setUserModalOpen(false);
      setUserForm({ username: '', password: '', designation: 'Sales Head', full_name: '', email: '' });
      setEditUserMode(false);
      setSelectedUserId(null);
      fetchData();
    } catch (err) {
      alert(`User operation failed: ${err.message}`);
    }
  };

  const handleEditUser = (usr) => {
    setUserForm({ username: usr.username, password: '', designation: usr.designation, full_name: usr.full_name, email: usr.email });
    setSelectedUserId(usr.id);
    setEditUserMode(true);
    setUserModalOpen(true);
  };

  const handleRevokeAccess = async (userId) => {
    if (!confirm('Are you sure you want to revoke this user\'s access?')) return;
    try {
      await apiCall(`/staff/users/${userId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      alert(`Failed to revoke access: ${err.message}`);
    }
  };

  // ============================================================================
  // EXPORT HANDLERS
  // ============================================================================
  const handleExportDirectoryCSV = () => {
    if (staff.length === 0) return;
    const headers = ['User ID', 'Username', 'Designation', 'Full Name', 'Email', 'Today Status', 'Check In', 'Activity'];
    const rows = staff.map(s => {
      const att = getAttendanceForUser(s.id);
      return [
        s.id,
        s.username,
        s.designation,
        s.full_name,
        s.email,
        att.status,
        att.check_in,
        att.activity
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Staff_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDirectoryJSON = () => {
    if (staff.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(staff, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Staff_Directory_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCandidatesCSV = () => {
    if (candidates.length === 0) return;
    const headers = ['Candidate ID', 'Name', 'Position', 'Department', 'Experience (Years)', 'Current Company', 'Status', 'Applied Date', 'Notes'];
    const rows = filteredCandidates.map(c => [
      c.id,
      c.candidate_name,
      c.position,
      c.department,
      c.experience_years,
      c.current_company,
      c.status,
      c.applied_date,
      c.notes || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCandidatesJSON = () => {
    if (candidates.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredCandidates, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Candidates_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLeavesCSV = () => {
    if (leaveRequests.length === 0) return;
    const headers = ['Request ID', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status', 'Applied On', 'Reviewed By'];
    const rows = filteredLeaves.map(l => [
      l.id,
      l.user_name,
      l.leave_type,
      l.start_date,
      l.end_date,
      l.days,
      l.reason,
      l.status,
      l.applied_on,
      l.reviewed_by || 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Leave_Requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLeavesJSON = () => {
    if (leaveRequests.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredLeaves, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Leave_Requests_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExpensesCSV = () => {
    if (expenseClaims.length === 0) return;
    const headers = ['Claim ID', 'Employee Name', 'Project', 'Expense Type', 'Amount', 'Description', 'Bill Date', 'Submitted On', 'Status', 'Reviewed By'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.user_name,
      e.project_name || 'General',
      e.expense_type,
      e.amount || 0,
      e.description,
      e.bill_date,
      e.submitted_on,
      e.status,
      e.reviewed_by || 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expense_Claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExpensesJSON = () => {
    if (expenseClaims.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredExpenses, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Expense_Claims_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTasksCSV = () => {
    if (tasks.length === 0) return;
    const headers = ['Task ID', 'Assigned To', 'Title', 'Description', 'Priority', 'Status', 'Due Date'];
    const rows = tasks.map(t => [
      t.id,
      t.assigned_to,
      t.title,
      t.description || '',
      t.priority,
      t.status,
      t.due_date || 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Staff_Tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTasksJSON = () => {
    if (tasks.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(tasks, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Staff_Tasks_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAttendanceForUser = (userId) => {
    const att = attendance.find(a => a.user_id === userId && a.date === new Date().toISOString().split('T')[0]);
    if (!att) return { status: 'Absent', color: 'danger', check_in: '-', activity: 'Not checked-in yet' };
    if (att.check_out) return { status: 'Checked Out', color: 'neutral', check_in: att.check_in, activity: 'Shift ended' };
    return { status: 'Present', color: 'success', check_in: att.check_in, activity: att.current_activity };
  };

  // ── KPI calculations ──
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;
  const pendingExpenses = expenseClaims.filter(e => e.status === 'Pending').length;
  const totalExpenseAmount = expenseClaims.filter(e => e.status === 'Pending').reduce((s, e) => s + (e.amount || 0), 0);
  const activeCandidates = candidates.filter(c => !['Hired', 'Rejected'].includes(c.status)).length;
  const presentToday = staff.filter(s => getAttendanceForUser(s.id).status === 'Present').length;

  // Filtered data
  const filteredLeaves = leaveFilter === 'All' ? leaveRequests : leaveRequests.filter(l => l.status === leaveFilter);
  const filteredCandidates = candidateFilter === 'All' ? candidates : candidates.filter(c => c.status === candidateFilter);
  const filteredExpenses = expenseFilter === 'All' ? expenseClaims : expenseClaims.filter(e => e.status === expenseFilter);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* ── Header with KPIs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">HR Portal & Staff Management</h2>
          <p className="text-[10px] text-slate-500">Complete workforce management — attendance, hiring, leaves, expenses & tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 transition"
            title="Refresh data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                if (activeTab === 'directory') handleExportDirectoryCSV();
                else if (activeTab === 'hiring') handleExportCandidatesCSV();
                else if (activeTab === 'leaves') handleExportLeavesCSV();
                else if (activeTab === 'expenses') handleExportExpensesCSV();
                else if (activeTab === 'tasks') handleExportTasksCSV();
              }}
              className="px-2 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 rounded flex items-center gap-1 transition"
              title="Export active sheet as CSV"
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={() => {
                if (activeTab === 'directory') handleExportDirectoryJSON();
                else if (activeTab === 'hiring') handleExportCandidatesJSON();
                else if (activeTab === 'leaves') handleExportLeavesJSON();
                else if (activeTab === 'expenses') handleExportExpensesJSON();
                else if (activeTab === 'tasks') handleExportTasksJSON();
              }}
              className="px-2 py-1.5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/10 rounded flex items-center gap-1 transition"
              title="Export active sheet as JSON"
            >
              <Download size={12} /> JSON
            </button>
          </div>
          
          <button
            onClick={() => setSimModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
          >
            <Send size={13} /> Simulate WhatsApp
          </button>

          {isHROrOwner && (
            <button
              onClick={() => {
                setUserForm({ username: '', password: '', designation: 'Sales Head', full_name: '', email: '' });
                setEditUserMode(false);
                setUserModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
            >
              <Plus size={13} /> Onboard Staff
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <UserCheck size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{presentToday}<span className="text-slate-500 text-xs font-normal">/{staff.length}</span></p>
            <p className="text-[10px] text-slate-500">Present Today</p>
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Calendar size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{pendingLeaves}</p>
            <p className="text-[10px] text-slate-500">Pending Leaves</p>
          </div>
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <CreditCard size={16} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">₹{totalExpenseAmount.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">{pendingExpenses} Pending Claims</p>
          </div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <UserPlus size={16} className="text-violet-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{activeCandidates}</p>
            <p className="text-[10px] text-slate-500">Active Pipeline</p>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900/40 backdrop-blur-sm rounded-xl p-1.5 border border-slate-800/60">
        {HR_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          // Only show hiring, leaves, expenses to HR/Owner roles
          if (['hiring'].includes(tab.id) && !isHROrOwner) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? `bg-${tab.color}-500/10 text-${tab.color}-400 border border-${tab.color}-500/20 shadow-lg shadow-${tab.color}-500/5`
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
              style={isActive ? {
                backgroundColor: `color-mix(in srgb, var(--tw-${tab.color}-500, #8b5cf6) 8%, transparent)`,
              } : {}}
            >
              <Icon size={14} />
              {tab.label}
              {tab.id === 'leaves' && pendingLeaves > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">{pendingLeaves}</span>
              )}
              {tab.id === 'expenses' && pendingExpenses > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[9px] font-bold">{pendingExpenses}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Content Area (with AI Insights Sidebar) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Content (9 cols) */}
        <div className="xl:col-span-9 space-y-6">

          {/* ════════ TAB 1: DIRECTORY & ATTENDANCE ════════ */}
          {activeTab === 'directory' && (
            <>
              {/* Check In / Check Out Card for Current User */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-indigo-400" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Your Daily Attendance</h3>
                      <p className="text-[10px] text-slate-500">Record check-in and check-out times for today</p>
                    </div>
                  </div>
                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const myAtt = attendance.find(a => a.user_id === user?.id && a.date === todayStr);
                    if (!myAtt) return <Badge variant="danger">Absent</Badge>;
                    if (myAtt.check_out) return <Badge variant="neutral">Checked Out</Badge>;
                    return <Badge variant="success">Checked In</Badge>;
                  })()}
                </div>

                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const myAtt = attendance.find(a => a.user_id === user?.id && a.date === todayStr);
                  
                  if (!myAtt) {
                    return (
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Today's Focus / Activity</label>
                          <input
                            type="text"
                            value={attendanceActivity}
                            onChange={(e) => setAttendanceActivity(e.target.value)}
                            placeholder="e.g., Commissioning at Choudhary Factory, Client meetings, Office work..."
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        <button
                          onClick={() => handleMarkAttendance('check_in')}
                          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-emerald-600/10"
                        >
                          <UserCheck size={14} /> Check In Today
                        </button>
                      </div>
                    );
                  }
                  
                  if (!myAtt.check_out) {
                    return (
                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-950/40 p-4 rounded-lg border border-slate-850">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-300 font-medium">
                            Checked In at <span className="text-white font-bold">{myAtt.check_in}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <MapPin size={11} className="text-indigo-400" />
                            Active task: <span className="text-slate-400 italic">"{myAtt.current_activity || myAtt.activity}"</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkAttendance('check_out')}
                          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-rose-600/15 border border-rose-500/30 hover:bg-rose-600 hover:text-white text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition duration-200"
                        >
                          <Clock size={14} /> Check Out Now
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-indigo-950/10 border border-indigo-500/20 p-4 rounded-lg text-center space-y-1">
                      <p className="text-xs text-indigo-400 font-bold">Shift Completed Successfully</p>
                      <p className="text-[10px] text-slate-500 font-mono">Check In: {myAtt.check_in} | Check Out: {myAtt.check_out}</p>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Attendance */}
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-3">
                    <UserCheck size={16} className="text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Today's Real-time Attendance</h3>
                  </div>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-6 text-xs text-slate-500">Loading attendance...</div>
                    ) : (
                      staff.filter(s => s.designation !== 'Owner').map(s => {
                        const att = getAttendanceForUser(s.id);
                        return (
                          <div key={s.id} className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-start gap-3 justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white">{s.full_name || s.username}</span>
                                <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-850">{s.designation}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <MapPin size={10} className="text-indigo-400 shrink-0" />
                                <span className="truncate">{att.activity}</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <Badge variant={att.color} dot>{att.status}</Badge>
                              <span className="text-[9px] text-slate-500 block font-mono flex items-center gap-1"><Clock size={9} /> In: {att.check_in}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Staff Directory & Access Control */}
                <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-indigo-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Staff Directory</h3>
                    </div>
                    {isHROrOwner && (
                      <button
                        onClick={() => { setEditUserMode(false); setUserModalOpen(true); }}
                        className="px-2.5 py-1 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 rounded text-white transition"
                      >
                        + Add Staff
                      </button>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {(isHROrOwner ? usersList : staff).filter(u => u.designation !== 'Owner').map(usr => (
                      <div key={usr.id} className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                            {(usr.full_name || usr.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{usr.full_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{usr.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            usr.designation === 'HR'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : usr.designation === 'Operations Head'
                              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              : usr.designation === 'B2B Sales'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {usr.designation}
                          </span>
                          {isHROrOwner && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStaff(usr);
                                  setHistoryModalOpen(true);
                                }}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 px-2 py-1 rounded font-semibold transition"
                              >
                                Attendance &amp; Payroll
                              </button>
                              <button
                                onClick={() => handleEditUser(usr)}
                                className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold px-1"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Attendance Calendar Preview */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-3">
                  <Calendar size={16} className="text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">June 2026 — Attendance Overview</h3>
                </div>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-1.5 min-w-[500px]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="text-center text-[9px] font-bold text-slate-500 uppercase py-1">{day}</div>
                    ))}
                    {/* Simulated calendar for June (starts on Monday) */}
                    {Array.from({ length: 30 }, (_, i) => {
                      const dayNum = i + 1;
                      const isToday = dayNum === new Date().getDate() && new Date().getMonth() === 5;
                      const isWeekend = [6, 7, 13, 14, 20, 21, 27, 28].includes(dayNum);
                      const isLeave = [15, 16, 12].includes(dayNum);
                      const isPast = dayNum < new Date().getDate();
                      let bgColor = 'bg-slate-900/40 border-slate-800/40';
                      if (isToday) bgColor = 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20';
                      else if (isWeekend) bgColor = 'bg-slate-800/20 border-slate-800/30';
                      else if (isLeave) bgColor = 'bg-amber-500/10 border-amber-500/20';
                      else if (isPast) bgColor = 'bg-emerald-500/5 border-emerald-500/15';

                      return (
                        <div key={dayNum} className={`rounded-lg border p-2 text-center ${bgColor} transition-colors`}>
                          <span className={`text-xs font-bold ${isToday ? 'text-indigo-400' : isWeekend ? 'text-slate-600' : isLeave ? 'text-amber-400' : isPast ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {dayNum}
                          </span>
                          <div className="mt-0.5">
                            {isToday && <span className="text-[7px] text-indigo-400 font-bold block">TODAY</span>}
                            {isWeekend && <span className="text-[7px] text-slate-600 block">OFF</span>}
                            {isLeave && !isWeekend && <span className="text-[7px] text-amber-400 block">LEAVE</span>}
                            {isPast && !isWeekend && !isLeave && !isToday && <span className="text-[7px] text-emerald-500 block">✓</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500/30"></span><span className="text-[9px] text-slate-500">Present</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/30"></span><span className="text-[9px] text-slate-500">Leave</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-800/40 border border-slate-700/30"></span><span className="text-[9px] text-slate-500">Weekend</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/20 border border-indigo-500/30"></span><span className="text-[9px] text-slate-500">Today</span></div>
                </div>
              </div>
            </>
          )}

          {/* ════════ TAB 2: HIRING PORTAL ════════ */}
          {activeTab === 'hiring' && isHROrOwner && (
            <>
              {/* Pipeline summary bar */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCandidateFilter('All')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${candidateFilter === 'All' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'text-slate-500 border-slate-800 hover:border-slate-700'}`}
                >
                  All ({candidates.length})
                </button>
                {CANDIDATE_STAGES.map(stage => {
                  const count = candidates.filter(c => c.status === stage).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={stage}
                      onClick={() => setCandidateFilter(stage)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${candidateFilter === stage ? CANDIDATE_STAGE_COLORS[stage] : 'text-slate-500 border-slate-800 hover:border-slate-700'}`}
                    >
                      {stage} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Add candidate button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setCandidateModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-lg shadow-violet-600/10"
                >
                  <Plus size={13} /> Add Candidate
                </button>
              </div>

              {/* Candidates list */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-xs text-slate-500">Loading candidates...</div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">No candidates in this stage.</div>
                ) : (
                  filteredCandidates.map(candidate => (
                    <div key={candidate.id} className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-4 shadow-xl hover:border-slate-700/80 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{candidate.candidate_name}</h4>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${CANDIDATE_STAGE_COLORS[candidate.status]}`}>
                              {candidate.status}
                            </span>
                          </div>
                          <p className="text-xs text-violet-400 font-semibold mt-1">{candidate.position}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{candidate.department}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Building size={10} className="text-slate-500" /> {candidate.current_company}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Award size={10} className="text-slate-500" /> {candidate.experience_years} yrs exp
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Mail size={10} className="text-slate-500" /> {candidate.email}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone size={10} className="text-slate-500" /> {candidate.phone}
                            </span>
                          </div>
                          {candidate.notes && (
                            <p className="text-[10px] text-slate-500 mt-2 italic bg-slate-950/40 p-2 rounded border border-slate-800/40">
                              💡 {candidate.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <span className="text-[9px] text-slate-600 text-right">Applied: {candidate.applied_date}</span>
                          {candidate.status !== 'Hired' && candidate.status !== 'Rejected' && (
                            <div className="flex gap-1.5">
                              <Select
                                id={`stage_${candidate.id}`}
                                value={candidate.status}
                                onChange={(e) => handleCandidateStatusUpdate(candidate.id, e.target.value)}
                                options={CANDIDATE_STAGES.map(s => ({ value: s, label: s }))}
                                className="!text-[10px] !py-1 !px-2 !min-w-[120px]"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* ════════ TAB 3: LEAVE REQUESTS ════════ */}
          {activeTab === 'leaves' && (
            <>
              {/* Filter bar */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-wrap gap-2">
                  {['All', 'Pending', 'Approved', 'Rejected'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setLeaveFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${
                        leaveFilter === filter
                          ? filter === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : filter === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : filter === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-700/20 text-slate-300 border-slate-700/40'
                          : 'text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {filter} ({filter === 'All' ? leaveRequests.length : leaveRequests.filter(l => l.status === filter).length})
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setLeaveModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-lg shadow-amber-600/10"
                >
                  <Plus size={13} /> Apply Leave
                </button>
              </div>

              {/* Leave requests table */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Leave Type</th>
                        <th className="py-3 px-4">Dates</th>
                        <th className="py-3 px-4">Days</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Status</th>
                        {isHROrOwner && <th className="py-3 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-xs">
                      {filteredLeaves.length === 0 ? (
                        <tr><td colSpan={7} className="py-8 text-center text-slate-500 text-xs">No leave requests found.</td></tr>
                      ) : (
                        filteredLeaves.map(leave => (
                          <tr key={leave.id} className="hover:bg-slate-800/20 text-slate-300">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-white">{leave.user_name}</span>
                              <span className="block text-[9px] text-slate-500 mt-0.5">Applied: {leave.applied_on}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                leave.leave_type === 'Sick' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : leave.leave_type === 'Earned' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : leave.leave_type === 'Half Day' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {leave.leave_type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                              {leave.start_date}{leave.start_date !== leave.end_date && ` → ${leave.end_date}`}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">{leave.days}</td>
                            <td className="py-3 px-4 text-[10px] text-slate-400 max-w-[200px] truncate">{leave.reason}</td>
                            <td className="py-3 px-4">
                              <Badge variant={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'danger' : 'warning'}>
                                {leave.status}
                              </Badge>
                              {leave.reviewed_by && (
                                <span className="block text-[9px] text-slate-500 mt-0.5">by {leave.reviewed_by}</span>
                              )}
                            </td>
                            {isHROrOwner && (
                              <td className="py-3 px-4 text-right">
                                {leave.status === 'Pending' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleLeaveAction(leave.id, 'Approved')}
                                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                                      title="Approve"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleLeaveAction(leave.id, 'Rejected')}
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                                      title="Reject"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ════════ TAB 4: EXPENSE CLAIMS ════════ */}
          {activeTab === 'expenses' && (
            <>
              {/* Filter bar */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-wrap gap-2">
                  {['All', 'Pending', 'Approved', 'Rejected', 'Paid'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setExpenseFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${
                        expenseFilter === filter
                          ? filter === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : filter === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : filter === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : filter === 'Paid' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-slate-700/20 text-slate-300 border-slate-700/40'
                          : 'text-slate-500 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {filter} ({filter === 'All' ? expenseClaims.length : expenseClaims.filter(e => e.status === filter).length})
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 shadow-lg shadow-cyan-600/10"
                >
                  <Plus size={13} /> Submit Claim
                </button>
              </div>

              {/* Expense claims cards */}
              <div className="space-y-3">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">No expense claims found.</div>
                ) : (
                  filteredExpenses.map(expense => {
                    const ExpIcon = EXPENSE_ICONS[expense.expense_type] || CreditCard;
                    return (
                      <div key={expense.id} className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-4 shadow-xl hover:border-slate-700/80 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                              <ExpIcon size={18} className="text-cyan-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">{expense.user_name}</span>
                                <span className="text-[10px] text-slate-500">•</span>
                                <span className="text-[10px] text-slate-500">{expense.expense_type}</span>
                                {expense.project_name && (
                                  <>
                                    <span className="text-[10px] text-slate-500">•</span>
                                    <span className="text-[10px] text-cyan-400 font-semibold">{expense.project_name}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">{expense.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[9px] text-slate-500">Bill: {expense.bill_date}</span>
                                <span className="text-[9px] text-slate-500">Submitted: {expense.submitted_on}</span>
                                {expense.reviewed_by && <span className="text-[9px] text-slate-500">Reviewed by: {expense.reviewed_by}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-sm font-bold text-white">₹{(expense.amount || 0).toLocaleString('en-IN')}</span>
                            <Badge variant={
                              expense.status === 'Approved' ? 'success'
                              : expense.status === 'Rejected' ? 'danger'
                              : expense.status === 'Paid' ? 'info'
                              : 'warning'
                            }>
                              {expense.status}
                            </Badge>
                            {isHROrOwner && expense.status === 'Pending' && (
                              <div className="flex gap-1.5 mt-1">
                                <button
                                  onClick={() => handleExpenseAction(expense.id, 'Approved')}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
                                  title="Approve"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => handleExpenseAction(expense.id, 'Rejected')}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                                  title="Reject"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Expense summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-4">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Pending</p>
                  <p className="text-lg font-bold text-amber-400 mt-1">₹{expenseClaims.filter(e => e.status === 'Pending').reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-4">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Approved</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">₹{expenseClaims.filter(e => e.status === 'Approved').reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-4">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Paid</p>
                  <p className="text-lg font-bold text-cyan-400 mt-1">₹{expenseClaims.filter(e => e.status === 'Paid').reduce((s, e) => s + (e.amount || 0), 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </>
          )}

          {/* ════════ TAB 5: TASKS ════════ */}
          {activeTab === 'tasks' && (
            <>
              <div className="flex justify-end">
                <Button onClick={() => setTaskModalOpen(true)} className="px-3.5 py-2 text-xs">
                  <Plus size={14} /> Assign New Task
                </Button>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800/60 pb-3">
                  <ClipboardList size={16} className="text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Staff Tasks & Project Allocations</h3>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-xs text-slate-500">Loading tasks...</div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">No active tasks found.</div>
                  ) : (
                    tasks.map(task => {
                      let priColor = 'neutral';
                      if (task.priority === 'High' || task.priority === 'Critical') priColor = 'danger';
                      else if (task.priority === 'Medium') priColor = 'warning';

                      return (
                        <div key={task.id} className="bg-slate-950/60 border border-slate-850 hover:border-slate-800 p-4 rounded-xl flex items-start justify-between gap-4 transition-colors">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{task.title}</h4>
                              <Badge variant={priColor}>{task.priority}</Badge>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">{task.description}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <span className="text-[9px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-850">Assignee: {task.assigned_to}</span>
                              {task.due_date && <span className="text-[9px] text-slate-500">Due: {task.due_date}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge variant={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'info' : 'warning'}>
                              {task.status}
                            </Badge>
                            {task.status !== 'Completed' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                                className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 text-indigo-400 hover:text-indigo-300 font-bold rounded transition"
                              >
                                {task.status === 'Pending' ? 'Start' : 'Complete'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Right Column: AI Insights (3 cols) */}
        <div className="xl:col-span-3 xl:sticky xl:top-8 bg-slate-900/30 backdrop-blur-md rounded-xl p-5 border border-slate-800/80">
          <AIInsights module="staff" />
        </div>
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* Modal: Assign New Task */}
      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Assign New Staff Task">
        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
          <Input label="Task Title" id="task_title" placeholder="e.g. Conduct site survey for Bansal" value={taskForm.title} onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Assign To Staff" id="assigned_to" value={taskForm.assigned_to} onChange={e => setTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))} options={staff.map(s => ({ value: s.full_name || s.username, label: s.full_name || s.username }))} required />
            <Select label="Priority" id="priority" value={taskForm.priority} onChange={e => setTaskForm(prev => ({ ...prev, priority: e.target.value }))} options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Critical', label: 'Critical' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Due Date" id="due_date" type="date" value={taskForm.due_date} onChange={e => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))} />
            <Select label="Link to Project" id="related_project" value={taskForm.related_project_id} onChange={e => setTaskForm(prev => ({ ...prev, related_project_id: e.target.value }))} options={projects.map(p => ({ value: p.id, label: p.project_name }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium text-sm">Task Description</label>
            <textarea value={taskForm.description} onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Task details, notes..." className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit">Assign Task</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Apply Leave */}
      <Modal isOpen={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
          <Select label="Leave Type" id="leave_type" value={leaveForm.leave_type} onChange={e => setLeaveForm(prev => ({ ...prev, leave_type: e.target.value }))} options={[
            { value: 'Casual', label: 'Casual Leave' },
            { value: 'Sick', label: 'Sick Leave' },
            { value: 'Earned', label: 'Earned Leave (Annual)' },
            { value: 'Half Day', label: 'Half Day' },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" id="leave_start" type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))} required />
            <Input label="End Date" id="leave_end" type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))} required />
          </div>
          <Input label="Number of Days" id="leave_days" type="number" step="0.5" min="0.5" value={leaveForm.days} onChange={e => setLeaveForm(prev => ({ ...prev, days: parseFloat(e.target.value) }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium text-sm">Reason</label>
            <textarea value={leaveForm.reason} onChange={e => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="Reason for leave..." className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 h-20" required />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setLeaveModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-500">Submit Leave Request</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Candidate */}
      <Modal isOpen={candidateModalOpen} onClose={() => setCandidateModalOpen(false)} title="Add New Candidate" maxWidth="max-w-xl">
        <form onSubmit={handleSubmitCandidate} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Candidate Name" id="cand_name" placeholder="e.g. Rohit Mehra" value={candidateForm.candidate_name} onChange={e => setCandidateForm(prev => ({ ...prev, candidate_name: e.target.value }))} required />
            <Input label="Position" id="cand_position" placeholder="e.g. Senior Site Engineer" value={candidateForm.position} onChange={e => setCandidateForm(prev => ({ ...prev, position: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" id="cand_dept" value={candidateForm.department} onChange={e => setCandidateForm(prev => ({ ...prev, department: e.target.value }))} options={[
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Operations', label: 'Operations' },
              { value: 'Sales', label: 'Sales' },
              { value: 'Finance', label: 'Finance' },
              { value: 'HR', label: 'HR' },
            ]} />
            <Input label="Experience (Years)" id="cand_exp" type="number" value={candidateForm.experience_years} onChange={e => setCandidateForm(prev => ({ ...prev, experience_years: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" id="cand_email" type="email" placeholder="candidate@email.com" value={candidateForm.email} onChange={e => setCandidateForm(prev => ({ ...prev, email: e.target.value }))} required />
            <Input label="Phone" id="cand_phone" placeholder="9876543210" value={candidateForm.phone} onChange={e => setCandidateForm(prev => ({ ...prev, phone: e.target.value }))} />
          </div>
          <Input label="Current Company" id="cand_company" placeholder="e.g. Tata Power Solar" value={candidateForm.current_company} onChange={e => setCandidateForm(prev => ({ ...prev, current_company: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium text-sm">Notes</label>
            <textarea value={candidateForm.notes} onChange={e => setCandidateForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Observations, strengths..." className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 h-16" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setCandidateModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-500">Add Candidate</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Submit Expense Claim */}
      <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Submit Expense Claim">
        <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Expense Type" id="exp_type" value={expenseForm.expense_type} onChange={e => setExpenseForm(prev => ({ ...prev, expense_type: e.target.value }))} options={[
              { value: 'Travel', label: '🚗 Travel' },
              { value: 'Petrol', label: '⛽ Petrol' },
              { value: 'Tools', label: '🔧 Tools Purchase' },
              { value: 'Food', label: '🍽️ Food / Meals' },
              { value: 'Accommodation', label: '🏨 Accommodation' },
              { value: 'Materials', label: '📦 Materials' },
            ]} />
            <Input label="Amount (₹)" id="exp_amount" type="number" placeholder="1500" value={expenseForm.amount} onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Related Project" id="exp_project" value={expenseForm.project_id} onChange={e => {
              const proj = projects.find(p => p.id == e.target.value);
              setExpenseForm(prev => ({ ...prev, project_id: e.target.value, project_name: proj?.project_name || 'General' }));
            }} options={[{ value: '', label: 'No Project (General)' }, ...projects.map(p => ({ value: p.id, label: p.project_name }))]} />
            <Input label="Bill Date" id="exp_bill_date" type="date" value={expenseForm.bill_date} onChange={e => setExpenseForm(prev => ({ ...prev, bill_date: e.target.value }))} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-medium text-sm">Description</label>
            <textarea value={expenseForm.description} onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the expense..." className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 h-20" required />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500">Submit Claim</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: WhatsApp Webhook Simulation */}
      <Modal isOpen={simModalOpen} onClose={() => setSimModalOpen(false)} title="Simulate WhatsApp Automated Webhook" maxWidth="max-w-xl">
        <form onSubmit={handleTriggerWhatsAppSimulation} className="p-6 space-y-4">
          <div className="flex border-b border-slate-800">
            <button type="button" onClick={() => setSimType('location')} className={`px-4 py-2 text-xs font-bold transition ${simType === 'location' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-500'}`}>
              WhatsApp GPS Live Location Check-In
            </button>
            <button type="button" onClick={() => setSimType('image')} className={`px-4 py-2 text-xs font-bold transition ${simType === 'image' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'text-slate-500'}`}>
              WhatsApp Milestone Photo AI Inspection
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Select Staff Sender" id="sim_staff" value={simForm.staff_name} onChange={e => setSimForm(prev => ({ ...prev, staff_name: e.target.value }))} options={staff.filter(s => s.username !== 'owner').map(s => ({ value: s.full_name || s.username, label: s.full_name || s.username }))} required />
            {simType === 'location' ? (
              <div className="grid grid-cols-2 gap-2">
                <Input label="Latitude" id="sim_lat" value={simForm.latitude} onChange={e => setSimForm(prev => ({ ...prev, latitude: e.target.value }))} required />
                <Input label="Longitude" id="sim_lng" value={simForm.longitude} onChange={e => setSimForm(prev => ({ ...prev, longitude: e.target.value }))} required />
              </div>
            ) : (
              <Select label="Target Project" id="sim_project" value={simForm.project_id} onChange={e => setSimForm(prev => ({ ...prev, project_id: e.target.value }))} options={projects.map(p => ({ value: p.id, label: p.project_name }))} required />
            )}
          </div>

          {simType === 'image' && (
            <div className="grid grid-cols-2 gap-4">
              <Select label="Milestone Category" id="sim_milestone" value={simForm.milestone_name} onChange={e => setSimForm(prev => ({ ...prev, milestone_name: e.target.value }))} options={[
                { value: 'Site Survey', label: 'Site Survey' },
                { value: 'Design Approval', label: 'Design Approval' },
                { value: 'Material Procurement', label: 'Material Procurement' },
                { value: 'Structure Installation', label: 'Structure Installation' },
                { value: 'Panel Installation', label: 'Panel Installation' },
                { value: 'Commissioning', label: 'Commissioning' },
                { value: 'Net Metering Application', label: 'Net Metering Application' }
              ]} required />
              <Select label="AI Quality Check" id="sim_fail" value={simForm.is_fail} onChange={e => setSimForm(prev => ({ ...prev, is_fail: e.target.value }))} options={[
                { value: 'false', label: 'Approved (Pass)' },
                { value: 'true', label: 'Rejected (Fail)' }
              ]} />
            </div>
          )}

          {simType === 'image' && (
            <div className="space-y-1">
              <Input label="Photo URL (WhatsApp media)" id="sim_img" value={simForm.image_url} onChange={e => setSimForm(prev => ({ ...prev, image_url: e.target.value }))} required />
              {simForm.image_url && (
                <div className="relative w-full h-24 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                  <img src={simForm.image_url} alt="Solar structure preview" className="object-cover h-full w-full opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent flex items-end p-2">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1"><Image size={11} /> Photo preview</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {simResult && (
            <div className={`p-4 rounded-lg text-xs font-mono border leading-relaxed ${simResult.includes('Approved') || simResult.includes('Attendance') ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' : 'bg-rose-950/20 border-rose-900/60 text-rose-400'}`}>
              <span className="font-bold block uppercase mb-1">Incoming WhatsApp webhook response:</span>
              {simResult}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => { setSimModalOpen(false); setSimResult(''); }}>Close</Button>
            <Button type="submit" loading={simLoading} className="bg-emerald-600 hover:bg-emerald-500 shadow-md">
              Trigger Hook &amp; Run AI Engine
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Onboard / Edit Staff */}
      <Modal isOpen={userModalOpen} onClose={() => setUserModalOpen(false)} title={editUserMode ? "Modify Staff Access" : "Onboard New Staff Member"}>
        <form onSubmit={handleOnboardUser} className="p-6 space-y-4">
          <Input label="Full Name" id="user_fullname" placeholder="e.g. Aman Verma" value={userForm.full_name} onChange={e => setUserForm(prev => ({ ...prev, full_name: e.target.value }))} required />
          <Input label="Email Address" id="user_email" type="email" placeholder="aman@suncraftpower.in" value={userForm.email} onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Username" id="user_username" placeholder="e.g. aman_sales" value={userForm.username} onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value }))} required disabled={editUserMode} />
            <Select label="Access Designation (Role)" id="user_role" value={userForm.designation} onChange={e => setUserForm(prev => ({ ...prev, designation: e.target.value }))} options={[
              { value: 'Owner', label: 'Owner (All Access)' },
              { value: 'HR', label: 'HR (Attendance & Tasks)' },
              { value: 'Operations Head', label: 'Operations Head (Field & Projects)' },
              { value: 'B2B Sales', label: 'B2B Sales (Lead & Ledger)' },
              { value: 'Sales Head', label: 'Sales Head (CRM Only)' }
            ]} />
          </div>
          {!editUserMode && (
            <Input label="Account Password" id="user_password" type="password" placeholder="password123" value={userForm.password} onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))} required />
          )}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setUserModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editUserMode ? 'Update Staff' : 'Create & Onboard'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detailed Attendance & Payroll History */}
      <Modal isOpen={historyModalOpen} onClose={() => { setHistoryModalOpen(false); setSelectedStaff(null); }} title={`Attendance & Payroll: ${selectedStaff?.full_name || selectedStaff?.username || ''}`} maxWidth="max-w-3xl">
        <div className="p-6 space-y-6">
          {(() => {
            if (!selectedStaff) return null;
            
            // Filter all attendance entries for this staff member
            const history = attendance.filter(a => a.user_id === selectedStaff.id);
            const presentDays = history.filter(a => a.status === 'Present' || a.status === 'Checked Out').length;
            // Fetch leaves approved for this staff member
            const approvedLeaves = leaveRequests.filter(l => l.user_id === selectedStaff.id && l.status === 'Approved').reduce((acc, curr) => acc + curr.days, 0);
            
            const netPaydays = presentDays + approvedLeaves; // Paid days = worked days + paid leaves
            const totalSalary = netPaydays * dailyRate;

            return (
              <div className="space-y-6">
                
                {/* KPI Summaries */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Days Present</span>
                    <span className="text-base font-bold text-emerald-400 mt-1 block">{presentDays} Days</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Paid Leaves</span>
                    <span className="text-base font-bold text-amber-400 mt-1 block">{approvedLeaves} Days</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Total Paid Days</span>
                    <span className="text-base font-bold text-white mt-1 block">{netPaydays} Days</span>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Present %</span>
                    <span className="text-base font-bold text-indigo-400 mt-1 block">
                      {history.length > 0 ? Math.round((presentDays / history.length) * 100) : 0}%
                    </span>
                  </div>
                </div>

                {/* Payroll Calculator Section */}
                <div className="bg-indigo-950/15 border border-indigo-500/20 rounded-xl p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">June 2026 Payroll Estimation</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Custom daily wage calculator based on logged days</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Daily Payout / Wage Rate (₹)</label>
                      <input
                        type="number"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="Daily rate"
                      />
                    </div>
                    <div className="text-right shrink-0 py-1">
                      <div className="text-[10px] text-slate-400">Total Calculated Payout:</div>
                      <div className="text-lg font-extrabold text-emerald-400">₹{totalSalary.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Logs List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800/60 pb-2">Attendance Logs History</h4>
                  
                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1.5">
                    {history.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-6">No historical logs found for this user.</p>
                    ) : (
                      history.map((log, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white font-mono text-[10px]">{log.date}</span>
                            <span className="block text-[10px] text-slate-500 italic mt-0.5">Activity: {log.current_activity || log.activity || 'Office Work'}</span>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <Badge variant={log.status === 'Checked Out' ? 'success' : log.status === 'Present' ? 'info' : 'danger'}>
                              {log.status}
                            </Badge>
                            <span className="text-[9px] font-mono text-slate-500">
                              {log.check_in ? `In: ${log.check_in}` : ''} {log.check_out ? `| Out: ${log.check_out}` : ''}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            );
          })()}
          <div className="flex justify-end pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => { setHistoryModalOpen(false); setSelectedStaff(null); }}>Close Panel</Button>
          </div>
        </div>
      </Modal>
      {/* Modal: Submit Expense Claim */}
      <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Submit New Expense Claim">
        <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
          <Select
            label="Expense Category"
            value={expenseForm.expense_type}
            onChange={e => setExpenseForm(prev => ({ ...prev, expense_type: e.target.value }))}
            options={[
              { value: 'Travel', label: 'Travel / Train / Flight' },
              { value: 'Petrol', label: 'Petrol / Fuel' },
              { value: 'Tools', label: 'Hardware / Tools' },
              { value: 'Food', label: 'Food / Meals' },
              { value: 'Accommodation', label: 'Accommodation / Hotel' },
              { value: 'Materials', label: 'Site Materials' }
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (₹)" type="number" value={expenseForm.amount} onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))} required />
            <Input label="Bill Date" type="date" value={expenseForm.bill_date} onChange={e => setExpenseForm(prev => ({ ...prev, bill_date: e.target.value }))} required />
          </div>
          <Input label="Project Name (Optional)" placeholder="e.g. Bansal Residence 8kW" value={expenseForm.project_name} onChange={e => setExpenseForm(prev => ({ ...prev, project_name: e.target.value }))} />
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Description / Remarks</label>
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              rows={3}
              placeholder="Why was this expense incurred?"
              value={expenseForm.description}
              onChange={e => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Claim</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
