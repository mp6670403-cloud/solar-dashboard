import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import { 
  getLivePower, 
  getTodayYield, 
  getHourlyGenerationCurve, 
  getEnvironmentalImpact, 
  getInverterTelemetry 
} from '@/lib/inverterSimulator';
import { 
  Home, 
  FileText, 
  CheckCircle, 
  Settings, 
  Zap, 
  Banknote, 
  RefreshCw, 
  AlertCircle, 
  FileCheck, 
  Check, 
  ShieldCheck,
  Search,
  Users,
  Copy,
  Download,
  Upload,
  Phone,
  MessageSquare,
  Plus,
  Trash2,
  Leaf,
  Gauge,
  Thermometer,
  Cpu,
  ChevronRight,
  Printer,
  FolderKanban,
  Package,
  Activity
} from 'lucide-react';

const NET_METERING_STAGES = [
  'Registration & Application',
  'Feasibility Approval',
  'Physical Installation',
  'Net Metering Application',
  'Inspection & Commissioning',
  'Subsidy Disbursement'
];

const LOAN_STAGES = [
  'Application Submitted',
  'Sanctioned',
  'Downpayment Collected',
  'Disbursed'
];

const INITIAL_PROJECTS = [
  {
    id: 'B2C-1001',
    name: 'Rajesh Sharma Residence',
    customer_name: 'Rajesh Sharma',
    city: 'Jaipur',
    capacity: 5,
    kw_capacity: 5,
    project_value: 250000,
    subsidy_amount: 78000,
    stage: 'Physical Installation',
    net_metering_stage: 'Physical Installation',
    loan_opted: true,
    loan_status: 'Sanctioned',
    loan_provider: 'SBI Solar Finance',
    loan_sanctioned_amount: 150000,
    downpayment_collected: 100000,
    phone: '9876543210',
    arn: 'PM-SURYA-829103',
    portal_password: 'RajeshPassword@123',
    inverter_brand: 'Growatt',
    inverter_serial: 'GRW-1001-9283',
    survey: {
      assigned_engineer: 'Suresh Patel',
      date: '2026-06-12',
      roof_area: 600,
      roof_type: 'RCC Flat Roof',
      sanctioned_load: 6,
      meter_no: 'DISCOM-M-88210',
      cable_length: 45,
      latitude: '26.9124',
      longitude: '75.7873',
      status: 'Survey Completed'
    },
    bom: [
      { id: 1, name: 'Waaree Mono PERC 545W Solar Panels', qty: 10, status: 'In-Stock (Reserved)', po: '' },
      { id: 2, name: 'Growatt 5kW String Inverter', qty: 1, status: 'In-Stock (Reserved)', po: '' },
      { id: 3, name: 'GI Mounting Structure (5kW Set)', qty: 1, status: 'In-Stock (Reserved)', po: '' },
      { id: 4, name: 'Polycab DC Solar Cable 6mm²', qty: 90, status: 'Needs Procurement', po: '' },
      { id: 5, name: 'Genus Bi-Directional Net Meter', qty: 1, status: 'Needs Procurement', po: '' }
    ],
    conversation_logs: [
      { date: '2026-06-18', type: 'Call', recording_link: 'http://rec.heliussolar.in/c-rajesh-32', summary: 'Called client to inform about structure delivery delay. GI columns are scheduled for tomorrow morning.', transcript: 'Agent: Sir structure material transport me thoda issue tha, kal subah 9 baje tak site reach ho jayega. Client: Thik hai, kal morning se hi work start karwa dena.' },
      { date: '2026-06-15', type: 'Chat', recording_link: null, summary: 'Client shared electricity bill for feasibility application.', transcript: 'Client: Attached my latest electricity bill. Agent: Thank you, uploading it for PM Surya Ghar registration.' }
    ]
  },
  {
    id: 'B2C-1002',
    name: 'Amit Joshi Villa',
    customer_name: 'Amit Joshi',
    city: 'Ahmedabad',
    capacity: 3,
    kw_capacity: 3,
    project_value: 165000,
    subsidy_amount: 78000,
    stage: 'Feasibility Approval',
    net_metering_stage: 'Feasibility Approval',
    loan_opted: false,
    loan_status: 'Application Submitted',
    loan_provider: '',
    loan_sanctioned_amount: 0,
    downpayment_collected: 165000,
    phone: '9988776655',
    arn: 'PM-SURYA-992144',
    portal_password: 'AmitPassword@456',
    inverter_brand: 'Solis',
    inverter_serial: 'SOL-1002-3921',
    survey: {
      assigned_engineer: 'Vikram Malhotra',
      date: '2026-06-16',
      roof_area: 400,
      roof_type: 'Tin Sheet Roof',
      sanctioned_load: 3,
      meter_no: 'DISCOM-M-11209',
      cable_length: 25,
      latitude: '23.0225',
      longitude: '72.5714',
      status: 'Survey Completed'
    },
    bom: [
      { id: 1, name: 'Adani Mono PERC 440W Solar Panels', qty: 7, status: 'In-Stock (Reserved)', po: '' },
      { id: 2, name: 'Solis 3kW String Inverter', qty: 1, status: 'In-Stock (Reserved)', po: '' },
      { id: 3, name: 'Tin Clamping Mounting Structure Set', qty: 1, status: 'In-Stock (Reserved)', po: '' },
      { id: 4, name: 'Polycab DC Solar Cable 4mm²', qty: 50, status: 'In-Stock (Reserved)', po: '' },
      { id: 5, name: 'Genus Bi-Directional Net Meter', qty: 1, status: 'Needs Procurement', po: '' }
    ],
    conversation_logs: [
      { date: '2026-06-17', type: 'Call', recording_link: 'http://rec.heliussolar.in/c-amit-14', summary: 'Called for document verify. Feasibility has been approved on state portal.', transcript: 'Agent: Hello Amit ji, feasibility approve ho gayi hai. Commissioning team kal panel mount check karegi. Client: Bahut achha, thanks for the update.' }
    ]
  },
  {
    id: 'B2C-1003',
    name: 'Kavita Bansal Rooftop',
    customer_name: 'Kavita Bansal',
    city: 'Jaipur',
    capacity: 8,
    kw_capacity: 8,
    project_value: 480000,
    subsidy_amount: 78000,
    stage: 'Subsidy Disbursement',
    net_metering_stage: 'Subsidy Disbursement',
    loan_opted: true,
    loan_status: 'Disbursed',
    loan_provider: 'HDFC Solar',
    loan_sanctioned_amount: 300000,
    downpayment_collected: 180000,
    phone: '9876001234',
    arn: 'PM-SURYA-120938',
    portal_password: 'KavitaPassword@789',
    inverter_brand: 'Sungrow',
    inverter_serial: 'SNG-1003-8821',
    survey: {
      assigned_engineer: 'Suresh Patel',
      date: '2026-05-10',
      roof_area: 900,
      roof_type: 'RCC Flat Roof',
      sanctioned_load: 8,
      meter_no: 'DISCOM-M-55421',
      cable_length: 60,
      latitude: '26.8500',
      longitude: '75.7600',
      status: 'Survey Completed'
    },
    bom: [
      { id: 1, name: 'Waaree Mono PERC 545W Solar Panels', qty: 15, status: 'Received at Site', po: '' },
      { id: 2, name: 'Sungrow 8kW Inverter', qty: 1, status: 'Received at Site', po: '' },
      { id: 3, name: 'GI Mounting Elevated Structure Set', qty: 1, status: 'Received at Site', po: '' },
      { id: 4, name: 'Polycab DC Solar Cable 6mm²', qty: 120, status: 'Received at Site', po: '' },
      { id: 5, name: 'Genus Bi-Directional Net Meter', qty: 1, status: 'Received at Site', po: 'PO-M-9921' }
    ],
    conversation_logs: [
      { date: '2026-06-19', type: 'Chat', recording_link: null, summary: 'DISCOM signed Joint Commissioning Report (JCR) successfully uploaded.', transcript: 'Agent: Mam, JCR portal par submit ho gaya hai. Status is now Subsidy Disbursement pending. Client: Perfect! Subisdy credit kab tak expected hai? Agent: 30 days window me subsidy check bank account me direct credit hoga.' }
    ]
  },
  {
    id: 'B2C-1004',
    name: 'Vikram Malhotra Home',
    customer_name: 'Vikram Malhotra',
    city: 'Lucknow',
    capacity: 6,
    kw_capacity: 6,
    project_value: 310000,
    subsidy_amount: 78000,
    stage: 'Registration & Application',
    net_metering_stage: 'Registration & Application',
    loan_opted: true,
    loan_status: 'Downpayment Collected',
    loan_provider: 'SBI Solar Finance',
    loan_sanctioned_amount: 200000,
    downpayment_collected: 110000,
    phone: '9123456789',
    arn: 'PM-SURYA-332910',
    portal_password: 'VikramPassword@111',
    inverter_brand: 'Luminous',
    inverter_serial: 'LUM-1004-4532',
    survey: {
      assigned_engineer: 'Vikram Malhotra',
      date: '2026-06-18',
      roof_area: 500,
      roof_type: 'RCC Flat Roof',
      sanctioned_load: 4, // Exceeds sanctioned load!
      meter_no: 'DISCOM-M-44219',
      cable_length: 35,
      latitude: '26.8467',
      longitude: '80.9462',
      status: 'Survey Completed'
    },
    bom: [
      { id: 1, name: 'Waaree Mono PERC Solar Panels', qty: 11, status: 'In-Stock (Reserved)', po: '' },
      { id: 2, name: 'Luminous 6kW String Inverter', qty: 1, status: 'Needs Procurement', po: '' },
      { id: 3, name: 'GI Flat Mounting Structure Set', qty: 1, status: 'In-Stock (Reserved)', po: '' },
      { id: 4, name: 'Polycab DC Solar Cable 6mm²', qty: 70, status: 'Needs Procurement', po: '' },
      { id: 5, name: 'Genus Bi-Directional Net Meter', qty: 1, status: 'Needs Procurement', po: '' }
    ],
    conversation_logs: [
      { date: '2026-06-14', type: 'Call', recording_link: 'http://rec.heliussolar.in/c-vikram-99', summary: 'Called to verify downpayment receipt status. Payment received.', transcript: 'Agent: Sir downpayment ₹1.1L check clear ho gaya hai, registration workflow lock kar diya hai. Client: Okay, file forward kar dena.' }
    ]
  },
  {
    id: 'B2C-1005',
    name: 'Sunita Reddy Estate',
    customer_name: 'Sunita Reddy',
    city: 'Hyderabad',
    capacity: 10,
    kw_capacity: 10,
    project_value: 550000,
    subsidy_amount: 78000,
    stage: 'Inspection & Commissioning',
    net_metering_stage: 'Inspection & Commissioning',
    loan_opted: false,
    loan_status: 'Application Submitted',
    loan_provider: '',
    loan_sanctioned_amount: 0,
    downpayment_collected: 550000,
    phone: '9900112233',
    arn: 'PM-SURYA-456321',
    portal_password: 'SunitaPassword@999',
    inverter_brand: 'Growatt',
    inverter_serial: 'GRW-1005-7731',
    survey: {
      assigned_engineer: 'Suresh Patel',
      date: '2026-06-10',
      roof_area: 1200,
      roof_type: 'RCC Flat Roof',
      sanctioned_load: 12,
      meter_no: 'DISCOM-M-90218',
      cable_length: 50,
      latitude: '17.3850',
      longitude: '78.4867',
      status: 'Survey Completed'
    },
    bom: [
      { id: 1, name: 'Waaree Mono PERC 545W Solar Panels', qty: 18, status: 'Received at Site', po: '' },
      { id: 2, name: 'Growatt 10kW String Inverter', qty: 1, status: 'Received at Site', po: '' },
      { id: 3, name: 'GI Mounting Structure Set', qty: 1, status: 'Received at Site', po: '' },
      { id: 4, name: 'Polycab DC Solar Cable 6mm²', qty: 100, status: 'Received at Site', po: '' },
      { id: 5, name: 'Genus Bi-Directional Net Meter', qty: 1, status: 'PO Sent', po: 'PO-METER-998' }
    ],
    conversation_logs: [
      { date: '2026-06-16', type: 'Call', recording_link: 'http://rec.heliussolar.in/c-sunita-21', summary: 'Scheduled DISCOM physical inspection for solar system.', transcript: 'Agent: Mam, state engineering team Saturday morning inspect karne aa rahi hai. Client: I will ensure my manager is present at site. Please send safety handbook.' }
    ]
  }
];

export default function B2CProjectModule({ user }) {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [filteredProjects, setFilteredProjects] = useState(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(INITIAL_PROJECTS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState('profile');
  
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [copied, setCopied] = useState('');

  // Conversation logs new entry form state
  const [newLogType, setNewLogType] = useState('Call');
  const [newLogSummary, setNewLogSummary] = useState('');
  const [newLogTranscript, setNewLogTranscript] = useState('');

  // Survey Edit State (local copy for editing)
  const [surveyEdit, setSurveyEdit] = useState({
    assigned_engineer: '',
    date: '',
    roof_area: 0,
    roof_type: 'RCC Flat Roof',
    sanctioned_load: 0,
    meter_no: '',
    cable_length: 0,
    latitude: '',
    longitude: ''
  });

  // PR Modal State
  const [prModalOpen, setPrModalOpen] = useState(false);
  const [prItem, setPrItem] = useState(null);
  const [prSupplier, setPrSupplier] = useState('Waaree Energies');
  const [prCost, setPrCost] = useState(1500);

  // Live Telemetry states (updates periodically)
  const [telemetry, setTelemetry] = useState({
    status: 'Online',
    statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    temp: 35,
    gridVoltage: 230,
    livePower: 0,
    todayYield: 0,
    co2Kg: 0,
    trees: 0
  });

  // Load survey data into edit state when selected client changes
  useEffect(() => {
    if (selectedProject?.survey) {
      setSurveyEdit({ ...selectedProject.survey });
    }
  }, [selectedProject]);

  // Filter client list based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = projects.filter(p => 
      p.customer_name.toLowerCase().includes(term) ||
      p.name.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term) ||
      p.id.toLowerCase().includes(term)
    );
    setFilteredProjects(filtered);
    if (filtered.length > 0) {
      if (!selectedProject || !filtered.some(p => p.id === selectedProject.id)) {
        setSelectedProject(filtered[0]);
      }
    } else {
      setSelectedProject(null);
    }
  }, [searchTerm, projects]);

  // Telemetry loop for selected client
  useEffect(() => {
    if (!selectedProject) return;
    const capacity = selectedProject.kw_capacity || selectedProject.capacity || 5;

    const updateStats = () => {
      const tel = getInverterTelemetry(capacity);
      const yieldToday = getTodayYield(capacity);
      const env = getEnvironmentalImpact(yieldToday);
      
      setTelemetry({
        status: tel.status,
        statusColor: tel.statusColor,
        temp: tel.temp,
        gridVoltage: tel.gridVoltage,
        livePower: tel.livePower,
        todayYield: yieldToday,
        co2Kg: env.co2Kg,
        trees: env.trees
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  const handleUpdateStage = (id, field, value) => {
    const updated = projects.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value, stage: field === 'net_metering_stage' ? value : p.stage };
      }
      return p;
    });
    setProjects(updated);
    const activeObj = updated.find(p => p.id === id);
    setSelectedProject(activeObj);
    setUpdateModalOpen(false);
  };

  const handleSaveSurvey = (e) => {
    e.preventDefault();
    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        // Recalculate cable length in BOM dynamically based on cable length entered
        const newBom = p.bom.map(item => {
          if (item.name.includes('Solar Cable')) {
            return { ...item, qty: surveyEdit.cable_length * 2 };
          }
          return item;
        });

        return {
          ...p,
          survey: { ...surveyEdit, status: 'Survey Completed' },
          bom: newBom
        };
      }
      return p;
    });
    setProjects(updated);
    const activeObj = updated.find(p => p.id === selectedProject.id);
    setSelectedProject(activeObj);
    alert('Site Survey Feasibility Report Saved Successfully!');
  };

  const handleOpenPr = (item) => {
    setPrItem(item);
    if (item.name.includes('Net Meter')) setPrSupplier('Genus Innovation');
    else if (item.name.includes('Inverter')) setPrSupplier('Growatt');
    else if (item.name.includes('Cable')) setPrSupplier('Polycab India');
    else setPrSupplier('Waaree Energies');
    setPrModalOpen(true);
  };

  const handleCreatePO = (e) => {
    e.preventDefault();
    const poNum = 'PO-' + prItem.name.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random()*9000);
    
    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        const newBom = p.bom.map(item => {
          if (item.id === prItem.id) {
            return { ...item, status: 'PO Sent', po: poNum };
          }
          return item;
        });
        return { ...p, bom: newBom };
      }
      return p;
    });

    setProjects(updated);
    const activeObj = updated.find(p => p.id === selectedProject.id);
    setSelectedProject(activeObj);
    setPrModalOpen(false);
    alert(`Purchase Order ${poNum} successfully generated and sent to ${prSupplier}!`);
  };

  const handleMarkDelivered = (item) => {
    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        const newBom = p.bom.map(b => {
          if (b.id === item.id) {
            return { ...b, status: 'Received at Site' };
          }
          return b;
        });
        return { ...p, bom: newBom };
      }
      return p;
    });
    setProjects(updated);
    const activeObj = updated.find(p => p.id === selectedProject.id);
    setSelectedProject(activeObj);
  };

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newLogSummary) return;

    const newLog = {
      date: new Date().toISOString().split('T')[0],
      type: newLogType,
      recording_link: newLogType === 'Call' ? `http://rec.heliussolar.in/c-new-${Math.floor(100+Math.random()*900)}` : null,
      summary: newLogSummary,
      transcript: newLogTranscript || 'Conversation logged manually by operator.'
    };

    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          conversation_logs: [newLog, ...p.conversation_logs]
        };
      }
      return p;
    });

    setProjects(updated);
    const activeObj = updated.find(p => p.id === selectedProject.id);
    setSelectedProject(activeObj);

    setNewLogSummary('');
    setNewLogTranscript('');
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(''), 2000);
  };

  const CopyButton = ({ text, field }) => (
    <button 
      onClick={() => handleCopy(text, field)}
      className="ml-2 text-slate-500 hover:text-indigo-400 transition flex items-center gap-1"
      title="Copy to clipboard"
    >
      {copied === field ? <CheckCircle size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  );

  const getStageIndex = (stage, stagesArray) => {
    return stagesArray.indexOf(stage);
  };

  const renderSvgSolarCurve = (capacity) => {
    const hourlyData = getHourlyGenerationCurve(capacity);
    const maxVal = Math.max(...hourlyData) || 1;
    const width = 450;
    const height = 120;
    const padding = 10;
    
    const points = hourlyData.map((val, idx) => {
      const x = padding + (idx / 23) * (width - 2 * padding);
      const y = height - padding - (val / maxVal) * (height - 2 * padding);
      return { x, y, val, hour: idx };
    });

    const pathD = `M ${points[0].x} ${height - padding} ` + 
      points.map(p => `L ${p.x} ${p.y}`).join(' ') + 
      ` L ${points[points.length - 1].x} ${height - padding} Z`;

    const lineD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { points, pathD, lineD, width, height };
  };

  const handlePrintProfile = () => {
    window.print();
  };

  const handleExportProjectJSON = () => {
    if (!selectedProject) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(selectedProject, null, 2)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `Project_Dossier_${selectedProject.id}_${selectedProject.customer_name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBOM = () => {
    if (!selectedProject || !selectedProject.bom) return;
    const headers = ['Item ID', 'Component Name', 'Quantity Required', 'Sourcing Status', 'Purchase Order (PO)'];
    const rows = selectedProject.bom.map(item => [
      item.id,
      item.name,
      item.qty,
      item.status,
      item.po || 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BOM_${selectedProject.id}_${selectedProject.customer_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAllProjectsCSV = () => {
    const headers = ['Project ID', 'Client Name', 'City', 'Capacity (kW)', 'Contract Value', 'Subsidy Amount', 'Stage', 'Financing', 'ARN'];
    const rows = projects.map(p => [
      p.id,
      p.customer_name,
      p.city,
      p.kw_capacity,
      p.project_value,
      p.subsidy_amount,
      p.stage,
      p.loan_opted ? `${p.loan_provider} (Approved)` : 'Cash',
      p.arn
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `B2C_Projects_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Home size={18} className="text-emerald-400" /> B2C Client Profiles & Operations Hub
          </h2>
          <p className="text-[10px] text-slate-500">Unifying Client Lists, Net Metering Milestones, DCR Documents, Live Telemetry, & Conversation Histories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportAllProjectsCSV} variant="secondary" className="!py-1.5 !px-3 !text-xs">
            <Download size={13} className="text-emerald-400 mr-1" /> Export Projects (CSV)
          </Button>
        </div>
      </div>

      {/* Split Screen Master-Detail Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ─── LEFT: Client List & Search (3 cols) ─── */}
        <div className="xl:col-span-3 space-y-4 print:hidden">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 shadow-xl">
            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-3">Client Directory</h3>
            
            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search clients, cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-slate-600" />
            </div>

            {/* Scrollable list */}
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600">No clients match query.</div>
              ) : (
                filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col gap-1.5 ${
                      selectedProject?.id === p.id
                        ? 'bg-indigo-600/10 border-indigo-500/80 text-white shadow-lg'
                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-indigo-400 font-bold">{p.id}</span>
                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold border ${
                        p.stage.includes('Subsidy') || p.stage.includes('Commissioning')
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {p.stage.split(' ')[0]}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white leading-normal truncate">{p.customer_name}</h4>
                    <div className="flex items-center justify-between text-[8px] text-slate-500">
                      <span>{p.city}</span>
                      <span className="font-mono text-slate-400 font-bold">{p.kw_capacity} kW</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Main Detail Screen (9 cols) ─── */}
        <div className="xl:col-span-9 print:w-full print:col-span-12">
          {!selectedProject ? (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl py-24 text-center text-slate-500">
              <Users size={40} className="mx-auto text-slate-700 mb-3" />
              Select a client from the left directory to view full profile details.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Client Profile Header Summary */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 shadow-xl flex flex-wrap justify-between items-start gap-4 print:border-b print:pb-6 print:mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white print:text-black print:text-xl">{selectedProject.customer_name}</h3>
                    <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase print:text-black print:border-black">{selectedProject.city}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 print:text-slate-700">Mobile: {selectedProject.phone} | Client ID: {selectedProject.id}</p>
                </div>
                
                <div className="flex gap-4 print:text-black">
                  <div className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-lg text-center min-w-[70px] print:border-slate-300">
                    <span className="text-[8px] text-slate-500 uppercase font-black print:text-slate-600">Capacity</span>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5 print:text-emerald-700">{selectedProject.kw_capacity} kW</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-lg text-center min-w-[90px] print:border-slate-300">
                    <span className="text-[8px] text-slate-500 uppercase font-black print:text-slate-600">Contract Value</span>
                    <p className="text-sm font-bold text-white font-mono mt-0.5 print:text-black">₹{selectedProject.project_value.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-lg text-center min-w-[85px] print:border-slate-300">
                    <span className="text-[8px] text-slate-500 uppercase font-black print:text-slate-600">DBT Subsidy</span>
                    <p className="text-xs font-bold text-amber-400 font-mono mt-0.5 print:text-amber-700">₹{selectedProject.subsidy_amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Milestones Flow section */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-6 print:border-b print:pb-6 print:mb-6">
                
                {/* Net Metering Stages */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 print:text-black">
                      <Zap size={12} className="text-amber-400 print:text-amber-600" /> PM Surya Ghar Net Metering Flow
                    </h5>
                    <Button 
                      variant="secondary" 
                      className="!py-0.5 !px-2 !text-[9px] print:hidden"
                      onClick={() => setUpdateModalOpen(true)}
                    >
                      Update Progress
                    </Button>
                  </div>
                  
                  <div className="flex w-full items-center py-2 overflow-x-auto">
                    {NET_METERING_STAGES.map((stage, idx) => {
                      const currentIdx = getStageIndex(selectedProject.net_metering_stage || selectedProject.stage, NET_METERING_STAGES);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={stage} className="flex-1 relative min-w-[70px] group">
                          <div className={`h-1.5 w-full ${isCompleted ? 'bg-amber-500' : 'bg-slate-800'} rounded-full`} />
                          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 ${
                            isCompleted ? 'bg-amber-500 border-slate-900' : 'bg-slate-800 border-slate-700'
                          } ${isCurrent ? 'ring-2 ring-amber-500/30 ring-offset-1 ring-offset-slate-900' : ''}`} />
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-max max-w-[80px] text-center">
                            <span className={`text-[8px] font-semibold leading-tight block ${isCompleted ? 'text-amber-400 print:text-amber-700' : 'text-slate-500'}`}>
                              {stage.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Solar Financing Stage */}
                <div className="space-y-3 pt-6 border-t border-slate-850">
                  <h5 className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5 print:text-black">
                    <Banknote size={12} className="text-cyan-400 print:text-cyan-600" /> Solar Financing (Loan pipeline)
                  </h5>
                  
                  {!selectedProject.loan_opted ? (
                    <div className="text-[10px] text-slate-500 bg-slate-950/40 p-2.5 rounded text-center border border-slate-800 border-dashed print:text-slate-700">
                      Customer did not opt for a loan (100% Cash/Downpayment). Downpayment collected: ₹{selectedProject.downpayment_collected.toLocaleString('en-IN')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[9px] text-slate-500 px-1 print:text-slate-750">
                        <span>Provider: <strong className="text-cyan-400 font-bold print:text-cyan-700">{selectedProject.loan_provider}</strong></span>
                        <span>Sanctioned Amount: <strong className="text-white font-mono print:text-black">₹{selectedProject.loan_sanctioned_amount.toLocaleString('en-IN')}</strong></span>
                      </div>
                      <div className="flex w-full items-center py-2 overflow-x-auto">
                        {LOAN_STAGES.map((stage, idx) => {
                          const currentIdx = getStageIndex(selectedProject.loan_status, LOAN_STAGES);
                          const isCompleted = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={stage} className="flex-1 relative min-w-[70px] group">
                              <div className={`h-1.5 w-full ${isCompleted ? 'bg-cyan-500' : 'bg-slate-800'} rounded-full`} />
                              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 ${
                                isCompleted ? 'bg-cyan-500 border-slate-900' : 'bg-slate-800 border-slate-700'
                              } ${isCurrent ? 'ring-2 ring-cyan-500/30 ring-offset-1 ring-offset-slate-900' : ''}`} />
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-max max-w-[80px] text-center">
                                <span className={`text-[8px] font-semibold leading-tight block ${isCompleted ? 'text-cyan-400 print:text-cyan-700' : 'text-slate-500'}`}>
                                  {stage.split(' ')[0]}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Profiles Sub-Tabs */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl flex flex-col print:border-none print:shadow-none">
                
                {/* Tabs Selector */}
                <div className="flex bg-slate-950/60 border-b border-slate-850 print:hidden overflow-x-auto">
                  {[
                    { key: 'profile', label: 'Client 360° Profile', icon: Users },
                    { key: 'survey', label: 'Site Survey & Feasibility', icon: FolderKanban },
                    { key: 'bom', label: 'BOM & Procurement', icon: Package },
                    { key: 'credentials', label: 'Credentials Assist', icon: Settings },
                    { key: 'vault', label: 'Uploads & DCR', icon: FileCheck },
                    { key: 'inverter', label: 'Live Inverter Performance', icon: Zap },
                    { key: 'logs', label: 'CRM Logs', icon: Users }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveDetailTab(tab.key)}
                      className={`flex-1 py-3 px-4 text-[10px] font-bold border-b-2 transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        activeDetailTab === tab.key
                          ? 'border-indigo-500 text-white bg-indigo-500/5'
                          : 'border-transparent text-slate-500 hover:text-white'
                      }`}
                    >
                      <tab.icon size={12} className={activeDetailTab === tab.key ? 'text-indigo-400' : ''} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab contents */}
                <div className="p-5">
                  
                  {/* TAB 0: CLIENT 360 DEGREE PROFILE (Consolidated dossier) */}
                  {(activeDetailTab === 'profile' || typeof window === 'undefined') && (
                    <div className="space-y-6 animate-in fade-in duration-200 print:text-black">
                      
                      {/* PDF Print Export button */}
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3 print:hidden">
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                          <Users size={12} className="text-indigo-400" /> Complete Client Dossier
                        </span>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleExportProjectJSON} 
                            variant="secondary" 
                            className="!py-1 !px-3 !text-[10px] flex items-center gap-1 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <Download size={12} className="text-indigo-400" /> Export JSON Dossier
                          </Button>
                          <Button 
                            onClick={handlePrintProfile} 
                            variant="secondary" 
                            className="!py-1 !px-3 !text-[10px] flex items-center gap-1 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <Printer size={12} /> Export Dossier (PDF/Print)
                          </Button>
                        </div>
                      </div>

                      {/* Dossier Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Left block: Tech Specs & Portal Credentials */}
                        <div className="space-y-6">
                          
                          {/* Financials & Tech Specs Table */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-800">1. Commercial & Technical Specifications</h5>
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">System Capacity:</span>
                                <span className="font-bold text-white font-mono print:text-black">{selectedProject.kw_capacity} kWp (Residential)</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">Total Contract Value:</span>
                                <span className="font-bold text-white font-mono print:text-black">₹{selectedProject.project_value.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">PM Surya Ghar Subsidy:</span>
                                <span className="font-bold text-amber-400 font-mono print:text-amber-800">₹{selectedProject.subsidy_amount.toLocaleString('en-IN')} (DBT direct credit)</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">Downpayment Collected:</span>
                                <span className="font-bold text-emerald-400 font-mono print:text-emerald-800">₹{selectedProject.downpayment_collected.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Financing Option:</span>
                                <span className="font-bold text-white print:text-black">
                                  {selectedProject.loan_opted ? `${selectedProject.loan_provider} (₹${selectedProject.loan_sanctioned_amount.toLocaleString('en-IN')})` : '100% Cash Payment'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Portal logins info */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-800">2. National Solar Portal Credentials</h5>
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">Application Number (ARN):</span>
                                <span className="font-mono text-emerald-400 font-bold print:text-emerald-800">{selectedProject.arn}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">Registered Mobile:</span>
                                <span className="font-mono text-white print:text-black">{selectedProject.phone}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Portal Password:</span>
                                <span className="font-mono text-slate-300 print:text-slate-800">{selectedProject.portal_password}</span>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Right block: Hardware, Upload Checklist & Conversation Summary */}
                        <div className="space-y-6">
                          
                          {/* Hardware specs */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-800">3. Inverter Equipment Details</h5>
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 print:bg-slate-50 print:border-slate-300">
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">Inverter Brand:</span>
                                <span className="font-bold text-white print:text-black">{selectedProject.inverter_brand}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 print:border-slate-200">
                                <span className="text-slate-500">Serial Number (S/N):</span>
                                <span className="font-mono text-white print:text-black">{selectedProject.inverter_serial}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">Telemetry Status:</span>
                                <span className="font-bold text-emerald-400 print:text-emerald-700">Online • Active output</span>
                              </div>
                            </div>
                          </div>

                          {/* Document Checklist */}
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-800">4. Compliance Upload checklist</h5>
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2 print:bg-slate-50 print:border-slate-300">
                              {[
                                { name: 'Latest Electricity Bill', status: 'Uploaded' },
                                { name: 'Joint Commissioning Report (JCR)', status: selectedProject.net_metering_stage === 'Subsidy Disbursement' ? 'Uploaded' : 'Pending' },
                                { name: 'Geo-Tagged Site Photo', status: selectedProject.kw_capacity > 3 ? 'Uploaded' : 'Pending' },
                                { name: 'Client Cancelled Cheque', status: 'Uploaded' }
                              ].map((doc, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs py-0.5">
                                  <span className="text-slate-400 print:text-slate-700">{doc.name}</span>
                                  <span className={`text-[10px] font-bold ${doc.status === 'Uploaded' ? 'text-emerald-400 print:text-emerald-700' : 'text-slate-500'}`}>
                                    {doc.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* Full Width Block: Conversation log summaries */}
                      <div className="space-y-3 pt-4 border-t border-slate-800 print:border-slate-300">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider print:text-slate-800">5. Client Conversation History</h5>
                        <div className="space-y-3">
                          {selectedProject.conversation_logs.map((log, idx) => (
                            <div key={idx} className="bg-slate-950/60 border border-slate-850 p-3 rounded-lg print:bg-slate-50 print:border-slate-300">
                              <div className="flex justify-between items-center text-[9px] text-slate-500 mb-1 border-b border-slate-900 pb-1 print:border-slate-200">
                                <span className="font-bold print:text-slate-700">{log.type === 'Call' ? '📞 Call log' : '💬 Chat log'} ({log.date})</span>
                                {log.recording_link && <span className="print:hidden text-indigo-400">Audio Recorded</span>}
                              </div>
                              <p className="text-xs font-semibold text-white print:text-black">{log.summary}</p>
                              <p className="text-[9px] text-slate-400 italic mt-1 font-mono print:text-slate-600">"{log.transcript}"</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 0.5: SITE SURVEY & FEASIBILITY FORM */}
                  {activeDetailTab === 'survey' && selectedProject.survey && (
                    <form onSubmit={handleSaveSurvey} className="space-y-5 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <FolderKanban size={12} className="text-amber-400" /> Technical Site Feasibility Report
                        </h4>
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button"
                            onClick={() => {
                              if (!selectedProject || !selectedProject.survey) return;
                              const s = selectedProject.survey;
                              const headers = ['Parameter', 'Value'];
                              const rows = [
                                ['Client ID', selectedProject.id],
                                ['Client Name', selectedProject.customer_name],
                                ['Assigned Engineer', s.assigned_engineer],
                                ['Survey Date', s.date],
                                ['Roof Area (sq ft)', s.roof_area],
                                ['Roof Type', s.roof_type],
                                ['Sanctioned Load (kW)', s.sanctioned_load],
                                ['Meter No', s.meter_no],
                                ['Cable Length (m)', s.cable_length],
                                ['GPS Coordinates', `${s.latitude}, ${s.longitude}`],
                                ['Survey Status', s.status]
                              ];
                              const csvContent = "data:text/csv;charset=utf-8," 
                                + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                              const encodedUri = encodeURI(csvContent);
                              const link = document.createElement("a");
                              link.setAttribute("href", encodedUri);
                              link.setAttribute("download", `Survey_Report_${selectedProject.id}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            variant="secondary" 
                            className="!py-0.5 !px-2 !text-[9px] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 mr-2"
                          >
                            <Download size={10} className="text-emerald-400 mr-1" /> Export Survey (CSV)
                          </Button>
                          {selectedProject.kw_capacity > selectedProject.survey.sanctioned_load && (
                            <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-black uppercase animate-pulse">
                              ⚠️ Load Enhancement Required
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Assigned Engineer</label>
                          <select 
                            value={surveyEdit.assigned_engineer}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, assigned_engineer: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="Suresh Patel">Suresh Patel</option>
                            <option value="Vikram Malhotra">Vikram Malhotra</option>
                            <option value="Priya Sharma">Priya Sharma</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Survey Visit Date</label>
                          <input 
                            type="date"
                            value={surveyEdit.date}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, date: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Shadow-Free Roof Area (sq ft)</label>
                          <input 
                            type="number"
                            value={surveyEdit.roof_area}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, roof_area: parseInt(e.target.value, 10) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          {surveyEdit.roof_area < selectedProject.kw_capacity * 80 && (
                            <span className="text-[7px] text-rose-400 font-semibold">Insufficient area for {selectedProject.kw_capacity}kW!</span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Roofing Material Structure</label>
                          <select 
                            value={surveyEdit.roof_type}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, roof_type: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="RCC Flat Roof">RCC Flat Roof</option>
                            <option value="Tin Sheet Roof">Tin Sheet Roof</option>
                            <option value="Tiled Roof">Tiled Roof</option>
                            <option value="Elevated GI Structure">Elevated GI Structure</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Grid Sanctioned Load (kW)</label>
                          <input 
                            type="number"
                            value={surveyEdit.sanctioned_load}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, sanctioned_load: parseInt(e.target.value, 10) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                          {selectedProject.kw_capacity > surveyEdit.sanctioned_load && (
                            <span className="text-[7px] text-amber-400 font-semibold">Exceeds load limits (Apply Enhancement)</span>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Electricity Meter Number</label>
                          <input 
                            type="text"
                            value={surveyEdit.meter_no}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, meter_no: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Cable Distance to Panel (meters)</label>
                          <input 
                            type="number"
                            value={surveyEdit.cable_length}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, cable_length: parseInt(e.target.value, 10) || 0 })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">GPS Latitude</label>
                          <input 
                            type="text"
                            value={surveyEdit.latitude}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, latitude: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">GPS Longitude</label>
                          <input 
                            type="text"
                            value={surveyEdit.longitude}
                            onChange={(e) => setSurveyEdit({ ...surveyEdit, longitude: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-3">
                        <Button type="submit" variant="primary" className="!py-1.5 !px-5 !text-xs">
                          Save Feasibility Data
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* TAB 0.6: BOM & PROCUREMENT WORKFLOWS */}
                  {activeDetailTab === 'bom' && selectedProject.bom && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Package size={12} className="text-indigo-400" /> Bill of Materials (BOM) & Sourcing
                        </h4>
                        <div className="flex items-center gap-2">
                          <Button 
                            onClick={handleExportBOM} 
                            variant="secondary" 
                            className="!py-0.5 !px-2 !text-[9px] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <Download size={10} className="text-emerald-400 mr-1" /> Export BOM (CSV)
                          </Button>
                          <span className="text-[9px] text-slate-500">Cable quantities auto-scale from site distance</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/40">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead>
                            <tr className="bg-slate-900 border-b border-slate-850 text-[10px] text-slate-500 uppercase font-bold">
                              <th className="px-4 py-2.5">Component Details</th>
                              <th className="px-4 py-2.5 text-center">Qty Required</th>
                              <th className="px-4 py-2.5">Sourcing Status</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {selectedProject.bom.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-900/40 transition">
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-white block">{item.name}</span>
                                  {item.po && <span className="text-[8px] text-slate-500 font-mono leading-none block mt-0.5">PO: {item.po}</span>}
                                </td>
                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-200">
                                  {item.qty} {item.name.includes('Cable') ? 'meters' : 'units'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                                    item.status === 'In-Stock (Reserved)' ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' :
                                    item.status === 'Received at Site' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                    item.status === 'PO Sent' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse' :
                                    'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {item.status === 'Needs Procurement' && (
                                    <Button 
                                      variant="secondary" 
                                      className="!py-0.5 !px-2 !text-[9px] border-indigo-500/30 text-indigo-300"
                                      onClick={() => handleOpenPr(item)}
                                    >
                                      Procure Item
                                    </Button>
                                  )}
                                  {item.status === 'PO Sent' && (
                                    <Button 
                                      variant="secondary" 
                                      className="!py-0.5 !px-2 !text-[9px] border-emerald-500/30 text-emerald-300"
                                      onClick={() => handleMarkDelivered(item)}
                                    >
                                      Mark Received
                                    </Button>
                                  )}
                                  {(item.status === 'In-Stock (Reserved)' || item.status === 'Received at Site') && (
                                    <span className="text-[9px] text-slate-500 font-bold flex items-center justify-end gap-0.5">
                                      <CheckCircle size={10} className="text-emerald-400"/> Ready
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: Credentials Board */}
                  {activeDetailTab === 'credentials' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <FileCheck size={12} className="text-indigo-400" /> PM Surya Ghar Portal Login Assist
                        </h4>
                        <Button 
                          onClick={() => {
                            if (!selectedProject) return;
                            const headers = ['Field', 'Value'];
                            const rows = [
                              ['Client Name', selectedProject.customer_name],
                              ['Application No (ARN)', selectedProject.arn],
                              ['Registered Mobile', selectedProject.phone],
                              ['Portal Password', selectedProject.portal_password],
                              ['Consumer No', selectedProject.id.split('-')[1] || '123456789'],
                              ['Sanction Load', `${selectedProject.kw_capacity} kW`],
                              ['City', selectedProject.city]
                            ];
                            const csvContent = "data:text/csv;charset=utf-8," 
                              + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `Credentials_${selectedProject.id}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          variant="secondary" 
                          className="!py-0.5 !px-2 !text-[9px] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
                        >
                          <Download size={10} className="text-emerald-400 mr-1" /> Export Credentials (CSV)
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3">
                          <p className="text-[9px] text-slate-500 uppercase font-black">Application No (ARN)</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-mono text-emerald-400">{selectedProject.arn}</span>
                            <CopyButton text={selectedProject.arn} field="arn" />
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3">
                          <p className="text-[9px] text-slate-500 uppercase font-black">Registered Mobile</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-mono text-white">{selectedProject.phone}</span>
                            <CopyButton text={selectedProject.phone} field="mobile" />
                          </div>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-lg p-3">
                          <p className="text-[9px] text-slate-500 uppercase font-black">Portal Password</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-mono text-slate-300">{selectedProject.portal_password}</span>
                            <CopyButton text={selectedProject.portal_password} field="password" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2.5">
                        <h5 className="text-[10px] font-bold text-slate-300 uppercase">Data Entry Copyboard</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                          <div className="flex justify-between items-center py-1 border-b border-slate-850">
                            <span className="text-slate-500">Consumer No:</span>
                            <div className="flex items-center font-mono">
                              <span className="text-white">{selectedProject.id.split('-')[1]}</span>
                              <CopyButton text={selectedProject.id.split('-')[1]} field="consumer_no" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-850">
                            <span className="text-slate-500">Sanction Load:</span>
                            <div className="flex items-center font-mono">
                              <span className="text-white">{selectedProject.kw_capacity} kW</span>
                              <CopyButton text={selectedProject.kw_capacity.toString()} field="capacity_val" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-slate-850 md:col-span-2">
                            <span className="text-slate-500">Address:</span>
                            <div className="flex items-center">
                              <span className="text-white truncate max-w-[300px]">{selectedProject.city}, India</span>
                              <CopyButton text={`${selectedProject.city}, State, India - 302001`} field="addr_val" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Uploads & DCR */}
                  {activeDetailTab === 'vault' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      
                      {/* DCR compliance box */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
                        <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          <Zap size={14} /> DCR Panel Serial Verification (Compulsory)
                        </h5>
                        <p className="text-[10px] text-amber-200/70 leading-normal">
                          Domestic Content Requirement (DCR) rules require uploading lists of active cell serial numbers to qualify for government subsidy.
                        </p>
                        <div className="flex gap-2 pt-1.5">
                          <Button variant="secondary" className="!text-[10px] !py-1"><Upload size={12} className="mr-1"/> Upload Panel Serials CSV</Button>
                          <Button variant="secondary" className="!text-[10px] !py-1"><Upload size={12} className="mr-1"/> Upload ALMM Certificate</Button>
                        </div>
                      </div>

                      {/* Document Vault List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { name: 'Latest Electricity Bill', desc: 'Required for pre-registration', status: 'uploaded' },
                          { name: 'Joint Commissioning Report (JCR)', desc: 'DISCOM signed report', status: selectedProject.net_metering_stage === 'Subsidy Disbursement' ? 'uploaded' : 'pending' },
                          { name: 'Geo-Tagged Site Photo', desc: 'Plant image with coordinates', status: selectedProject.kw_capacity > 3 ? 'uploaded' : 'pending' },
                          { name: 'Client Cancelled Cheque', desc: 'Required for DBT subsidy bank credit', status: 'uploaded' }
                        ].map((doc, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-950/60 border border-slate-850 p-3 rounded-lg">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${doc.status === 'uploaded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                {doc.status === 'uploaded' ? <CheckCircle size={14} /> : <FileText size={14} />}
                              </div>
                              <div>
                                <h6 className="text-xs font-bold text-white">{doc.name}</h6>
                                <p className="text-[9px] text-slate-500">{doc.desc}</p>
                              </div>
                            </div>
                            <div>
                              {doc.status === 'uploaded' ? (
                                <button className="p-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800" title="Download file">
                                  <Download size={12} />
                                </button>
                              ) : (
                                <button className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700">
                                  Upload
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Internal generate paperwork buttons */}
                      <div className="pt-4 border-t border-slate-850 space-y-2">
                        <h5 className="text-[10px] text-slate-400 uppercase font-black">Generate Paperwork</h5>
                        <div className="flex flex-wrap gap-2.5">
                          <Button variant="secondary" className="!text-[10px] !py-1.5"><FileText size={12} className="mr-1" /> DCR Affidavit</Button>
                          <Button variant="secondary" className="!text-[10px] !py-1.5"><FileText size={12} className="mr-1" /> Site Handover Certificate</Button>
                          <Button variant="secondary" className="!text-[10px] !py-1.5"><FileText size={12} className="mr-1" /> Maintenance & O&M Manual</Button>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: Live Inverter telemetry */}
                  {activeDetailTab === 'inverter' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      
                      {/* Brand Info Banner */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <h5 className="text-xs font-black text-white">{selectedProject.inverter_brand} Smart Inverter</h5>
                          <p className="text-[9px] text-slate-500 font-mono mt-0.5">S/N: {selectedProject.inverter_serial}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400">{telemetry.status}</span>
                        </div>
                      </div>

                      {/* Live metrics cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-1">
                            <Activity size={10} className="text-emerald-400" /> Active Power
                          </span>
                          <div className="mt-1 text-base font-bold text-white font-mono">{telemetry.livePower} <span className="text-[10px] text-emerald-400">kW</span></div>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-1">
                            <Gauge size={10} className="text-indigo-400" /> Daily Yield
                          </span>
                          <div className="mt-1 text-base font-bold text-white font-mono">{telemetry.todayYield} <span className="text-[10px] text-indigo-400">kWh</span></div>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-1">
                            <Thermometer size={10} className="text-amber-400" /> System Temp
                          </span>
                          <div className="mt-1 text-base font-bold text-white font-mono">{telemetry.temp} <span className="text-[10px] text-amber-400">°C</span></div>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col justify-between">
                          <span className="text-[8px] text-slate-500 uppercase font-bold flex items-center gap-1">
                            <Cpu size={10} className="text-cyan-400" /> Grid Voltage
                          </span>
                          <div className="mt-1 text-base font-bold text-white font-mono">{telemetry.gridVoltage} <span className="text-[10px] text-cyan-400">V</span></div>
                        </div>
                      </div>

                      {/* SVG individual curve */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-4">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase font-black mb-3">
                          <span>24h Yield Profile</span>
                          <span>Max Capacity: {selectedProject.kw_capacity} kWp</span>
                        </div>
                        
                        <div className="relative w-full h-[110px] bg-slate-900/20 border border-slate-900 p-2 rounded-lg">
                          {(() => {
                            const svgData = renderSvgSolarCurve(selectedProject.kw_capacity);
                            return (
                              <svg viewBox={`0 0 ${svgData.width} ${svgData.height}`} className="w-full h-full" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id="indGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>
                                <path d={svgData.pathD} fill="url(#indGrad)" />
                                <path d={svgData.lineD} fill="none" stroke="#10b981" strokeWidth="2" />
                                
                                {new Date().getHours() >= 6 && new Date().getHours() <= 18 && (
                                  <line 
                                    x1={10 + ((new Date().getHours() + new Date().getMinutes()/60 - 6) / 12) * 430} 
                                    y1="10" 
                                    x2={10 + ((new Date().getHours() + new Date().getMinutes()/60 - 6) / 12) * 430} 
                                    y2="110" 
                                    stroke="#f59e0b" 
                                    strokeWidth="1" 
                                    strokeDasharray="2 2"
                                  />
                                )}
                              </svg>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between text-[7px] text-slate-600 font-mono mt-1 px-1">
                          <span>6 AM</span>
                          <span>12 PM</span>
                          <span>6 PM</span>
                        </div>
                      </div>

                      {/* Carbon footprint savings */}
                      <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-xl p-3.5 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <Leaf size={16} className="text-emerald-400" />
                          <div>
                            <span className="font-bold text-white">Carbon Footprint Saved</span>
                            <p className="text-[9px] text-slate-500 mt-0.5">Calculated offset based on lifetime yield</p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-emerald-400">-{telemetry.co2Kg} kg CO2</p>
                          <span className="text-[8px] text-slate-500">{telemetry.trees} trees planted</span>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 4: CRM follow-up logs */}
                  {activeDetailTab === 'logs' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      
                      {/* Manual log form */}
                      <form onSubmit={handleAddLog} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                            <Plus size={12} /> Log Manual Conversation
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 items-center">
                          <div className="space-y-1">
                            <label className="text-[8px] text-slate-500 uppercase font-bold">Type</label>
                            <select 
                              value={newLogType} 
                              onChange={(e) => setNewLogType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                            >
                              <option value="Call">Call Recording</option>
                              <option value="Chat">WhatsApp / Chat</option>
                            </select>
                          </div>
                          
                          <div className="col-span-2 space-y-1">
                            <label className="text-[8px] text-slate-500 uppercase font-bold">Log Summary</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Discussed structure load delays..."
                              value={newLogSummary} 
                              onChange={(e) => setNewLogSummary(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] text-slate-500 uppercase font-bold">Detailed Transcript Summary</label>
                          <textarea 
                            rows="2"
                            placeholder="Type client transcript snippet here..."
                            value={newLogTranscript} 
                            onChange={(e) => setNewLogTranscript(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <Button type="submit" variant="primary" className="!py-1 !px-3.5 !text-[10px]">
                            Add Conversation Log
                          </Button>
                        </div>
                      </form>

                      {/* Display Log List */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {selectedProject.conversation_logs.map((log, idx) => (
                          <div key={idx} className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-lg space-y-2 hover:border-slate-800 transition">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1.5">
                                {log.type === 'Call' ? (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-[8px] text-indigo-400 font-bold flex items-center gap-0.5"><Phone size={8}/> Call Log</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[8px] text-emerald-400 font-bold flex items-center gap-0.5"><MessageSquare size={8}/> Chat log</span>
                                )}
                                <span className="text-[8px] text-slate-500 font-mono">{log.date}</span>
                              </div>
                              {log.recording_link && (
                                <a 
                                  href={log.recording_link}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[8px] text-indigo-400 hover:underline flex items-center gap-0.5 font-bold"
                                >
                                  Listen Audio Recording <ChevronRight size={10} />
                                </a>
                              )}
                            </div>
                            
                            <p className="text-xs text-white font-semibold leading-normal">{log.summary}</p>
                            <div className="bg-slate-950 border border-slate-900 rounded p-2.5 text-[10px] text-slate-400 font-mono leading-relaxed italic">
                              "{log.transcript}"
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>
          )}
        </div>

      </div>

      {/* Update Progress Modal */}
      <Modal isOpen={updateModalOpen} onClose={() => setUpdateModalOpen(false)} title="Update Client Progress Stages">
        {selectedProject && (
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Net Metering Status Stage</label>
              <select 
                value={selectedProject.net_metering_stage || selectedProject.stage}
                onChange={(e) => handleUpdateStage(selectedProject.id, 'net_metering_stage', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {NET_METERING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {selectedProject.loan_opted && (
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Solar Financing status</label>
                <select 
                  value={selectedProject.loan_status}
                  onChange={(e) => handleUpdateStage(selectedProject.id, 'loan_status', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {LOAN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Sourcing/PR Modal (New) */}
      <Modal isOpen={prModalOpen} onClose={() => setPrModalOpen(false)} title="Generate Purchase Order (PO)">
        {prItem && (
          <form onSubmit={handleCreatePO} className="p-6 space-y-4">
            <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-lg p-3 text-xs space-y-1">
              <p className="text-slate-400">Raising Sourcing Request for:</p>
              <h5 className="font-bold text-white text-sm">{prItem.name}</h5>
              <p className="font-mono text-slate-400">Qty Required: {prItem.qty}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Select Supplier</label>
              <select 
                value={prSupplier}
                onChange={(e) => setPrSupplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Waaree Energies">Waaree Energies (Solar Panels)</option>
                <option value="Solis Inverters">Solis Inverters (Inverters)</option>
                <option value="Growatt India">Growatt India (Inverters)</option>
                <option value="Polycab India">Polycab India (AC/DC Cables)</option>
                <option value="Genus Innovation">Genus Innovation (Net Meters)</option>
                <option value="Strolar GI Structure">Strolar GI Structure (Mounting structures)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Estimated Supplier Rate (per unit)</label>
              <input 
                type="number"
                value={prCost}
                onChange={(e) => setPrCost(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="secondary" className="!py-1.5" onClick={() => setPrModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" className="!py-1.5">Generate &amp; Send PO</Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
