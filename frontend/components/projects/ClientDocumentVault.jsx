import { useState, useEffect } from 'react';
import { 
  X, Copy, CheckCircle, FileText, Upload, Download, 
  ExternalLink, FileCheck, ShieldCheck, Zap, Cpu, Settings, 
  Activity, Thermometer, Gauge, Leaf 
} from 'lucide-react';
import Button from '../UI/Button';
import { 
  getLivePower, 
  getTodayYield, 
  getHourlyGenerationCurve, 
  getEnvironmentalImpact, 
  getInverterTelemetry 
} from '../../lib/inverterSimulator';

export default function ClientDocumentVault({ project, onClose }) {
  const [activeTab, setActiveTab] = useState('vault'); // 'vault' or 'inverter'
  const [copied, setCopied] = useState('');
  
  // DCR / Portal credentials state
  const [portalData, setPortalData] = useState({
    arn: 'PM-SURYA-' + Math.floor(100000 + Math.random() * 900000),
    mobile: project.phone || '9876543210',
    password: 'DemoPassword@123',
  });

  // Inverter Configuration State
  const [inverterBrand, setInverterBrand] = useState('Growatt');
  const [inverterSerial, setInverterSerial] = useState(
    'GRW-' + project.id + '-' + Math.floor(1000 + Math.random() * 9000)
  );

  // Live Telemetry state
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

  // Capacity in kW
  const capacity = project.kw_capacity || project.capacity || 5;

  // Telemetry simulation update tick
  useEffect(() => {
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
    const interval = setInterval(updateStats, 5000); // refresh telemetry every 5s
    return () => clearInterval(interval);
  }, [capacity, inverterBrand]);

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
      {copied === field ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );

  // Generate coordinates for SVG Solar Curve
  const renderSvgSolarCurve = () => {
    const hourlyData = getHourlyGenerationCurve(capacity);
    const maxVal = Math.max(...hourlyData) || 1;
    const width = 450;
    const height = 120;
    const padding = 10;
    
    // Map points to SVG coordinate space
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

  const svgData = renderSvgSolarCurve();

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={20} />
              Portal Assist & Document Vault
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage PM Surya Ghar compliance & live inverter tracking for {project.customer_name || project.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-950/40 px-6 border-b border-slate-800/80 shrink-0">
          <button
            onClick={() => setActiveTab('vault')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'vault'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={14} className={activeTab === 'vault' ? 'text-indigo-400' : ''} />
            Govt Portal Assist & Docs
          </button>
          <button
            onClick={() => setActiveTab('inverter')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'inverter'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={14} className={activeTab === 'inverter' ? 'text-emerald-400' : ''} />
            Live Inverter Performance
          </button>
        </div>

        {/* CONTENT SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: GOVT PORTAL ASSIST & DOCS */}
          {activeTab === 'vault' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* 1. MASTER DATA & PORTAL CREDENTIALS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink size={16} className="text-indigo-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">PM Surya Ghar Portal Login</h4>
                  </div>
                  <Button 
                    onClick={() => {
                      const headers = ['Field', 'Value'];
                      const rows = [
                        ['Client Name', project.customer_name || project.name],
                        ['Application No (ARN)', portalData.arn],
                        ['Registered Mobile', portalData.mobile],
                        ['Portal Password', portalData.password],
                        ['Consumer No', project.id.split('-')[1] || '123456789'],
                        ['Sanction Load', `${capacity} kW`],
                        ['City', project.city]
                      ];
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `Portal_Credentials_${project.id}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    variant="secondary" 
                    className="!py-0.5 !px-2 !text-[10px] border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                  >
                    <Download size={11} className="text-indigo-400 mr-1" /> Export Credentials (CSV)
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Application No (ARN)</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm font-mono text-emerald-400">{portalData.arn}</span>
                      <CopyButton text={portalData.arn} field="arn" />
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Registered Mobile</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm font-mono text-white">{portalData.mobile}</span>
                      <CopyButton text={portalData.mobile} field="mobile" />
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Portal Password</p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm font-mono text-slate-300">{portalData.password}</span>
                      <CopyButton text={portalData.password} field="password" />
                    </div>
                  </div>
                </div>

                {/* Quick Copy Client Data */}
                <div className="bg-slate-800/30 rounded-lg p-3 mt-2 border border-slate-800/50">
                  <h5 className="text-xs font-semibold text-slate-300 mb-2">Client Details (For Data Entry)</h5>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="flex items-center">
                      <span className="text-slate-500 w-24">Consumer No:</span>
                      <span className="text-white font-mono">{project.id.split('-')[1] || '123456789'}</span>
                      <CopyButton text={project.id.split('-')[1] || '123456789'} field="consumer" />
                    </div>
                    <div className="flex items-center">
                      <span className="text-slate-500 w-24">Sanction Load:</span>
                      <span className="text-white font-mono">{capacity} kW</span>
                      <CopyButton text={capacity.toString()} field="load" />
                    </div>
                    <div className="flex items-center col-span-2">
                      <span className="text-slate-500 w-24">Address:</span>
                      <span className="text-white truncate max-w-[250px]">{project.city}, State, India - 123456</span>
                      <CopyButton text={`${project.city}, State, India - 123456`} field="address" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DCR COMPLIANCE TRACKER */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Zap size={16} className="text-amber-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">DCR Compliance (Mandatory)</h4>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-xs text-amber-200/70 mb-3">
                    Subsidy requires Domestic Content Requirement (DCR) compliant modules. Scan and upload ALMM/DCR proofs here.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">Panel Serial Numbers</p>
                        <p className="text-[10px] text-slate-500">Excel/CSV of all installed modules</p>
                      </div>
                      <Button variant="secondary" className="!py-1 !text-xs"><Upload size={14} className="mr-1"/> Upload CSV</Button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">Manufacturer DCR Certificate</p>
                        <p className="text-[10px] text-slate-500">ALMM listing proof from vendor</p>
                      </div>
                      <Button variant="secondary" className="!py-1 !text-xs"><Upload size={14} className="mr-1"/> Upload PDF</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DOCUMENT VAULT */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FileCheck size={16} className="text-sky-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Upload Vault (For Govt Portal)</h4>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: 'Latest Electricity Bill', desc: 'Required for Pre-Registration', status: 'uploaded' },
                    { name: 'Joint Commissioning Report (JCR)', desc: 'Signed by DISCOM Engineer', status: 'pending' },
                    { name: 'Geo-Tagged Plant Photos', desc: 'Must include applicant in photo', status: 'pending' },
                    { name: 'Cancelled Cheque', desc: 'For DBT Subsidy Transfer', status: 'uploaded' }
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 border border-slate-800 p-3 rounded-lg hover:border-slate-700 transition">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${doc.status === 'uploaded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {doc.status === 'uploaded' ? <CheckCircle size={16} /> : <FileText size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{doc.name}</p>
                          <p className="text-[10px] text-slate-500">{doc.desc}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {doc.status === 'uploaded' ? (
                          <Button variant="secondary" className="!p-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" title="Download to upload on portal">
                            <Download size={14} />
                          </Button>
                        ) : (
                          <Button variant="secondary" className="!py-1 !px-3 !text-xs">
                            Upload
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. AUTO-GENERATE INTERNAL DOCS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <FileText size={16} className="text-rose-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Generate Internal Paperwork</h4>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" className="!text-xs border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300">
                    <FileText size={14} className="mr-1.5" /> DCR Undertaking Affidavit
                  </Button>
                  <Button variant="secondary" className="!text-xs border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300">
                    <FileText size={14} className="mr-1.5" /> Client Handover Certificate
                  </Button>
                  <Button variant="secondary" className="!text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-300">
                    <FileText size={14} className="mr-1.5" /> O&M / Maintenance Guide
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE INVERTER PERFORMANCE */}
          {activeTab === 'inverter' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Inverter Config Panel */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Settings size={14} /> Inverter Configuration
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Inverter Brand</label>
                    <select 
                      value={inverterBrand} 
                      onChange={(e) => setInverterBrand(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Growatt">Growatt (Recommended)</option>
                      <option value="Solis">Solis Cloud</option>
                      <option value="Sungrow">Sungrow Power</option>
                      <option value="Luminous">Luminous Solar</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Serial Number (S/N)</label>
                    <input 
                      type="text" 
                      value={inverterSerial} 
                      onChange={(e) => setInverterSerial(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Flashing Status indicator */}
                <div className="pt-2 flex justify-between items-center border-t border-slate-900">
                  <span className="text-[10px] text-slate-400">Connection State:</span>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400">{telemetry.status}</span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Activity size={10} className="text-emerald-400" /> Current Power
                  </span>
                  <div className="mt-2 text-xl font-bold text-white font-mono">{telemetry.livePower} <span className="text-xs text-emerald-400 font-semibold">kW</span></div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Gauge size={10} className="text-indigo-400" /> Today's Energy
                  </span>
                  <div className="mt-2 text-xl font-bold text-white font-mono">{telemetry.todayYield} <span className="text-xs text-indigo-400 font-semibold">kWh</span></div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Thermometer size={10} className="text-amber-400" /> Inverter Temp
                  </span>
                  <div className="mt-2 text-xl font-bold text-white font-mono">{telemetry.temp} <span className="text-xs text-amber-400 font-semibold">°C</span></div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <Cpu size={10} className="text-cyan-400" /> Grid AC Voltage
                  </span>
                  <div className="mt-2 text-xl font-bold text-white font-mono">{telemetry.gridVoltage} <span className="text-xs text-cyan-400 font-semibold">V</span></div>
                </div>
              </div>

              {/* SVG Area Chart */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">24-Hour Solar Production Curve</span>
                  <span className="text-[10px] text-slate-500">System Capacity: {capacity} kW</span>
                </div>
                
                {/* SVG Area Curve */}
                <div className="relative w-full h-[140px] flex items-center justify-center bg-slate-900/30 rounded-lg border border-slate-900/60 p-2 overflow-hidden">
                  <svg 
                    viewBox={`0 0 ${svgData.width} ${svgData.height}`} 
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="10" y1="30" x2="440" y2="30" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.5" />
                    <line x1="10" y1="60" x2="440" y2="60" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.5" />
                    <line x1="10" y1="90" x2="440" y2="90" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="0.5" />

                    {/* Gradient area */}
                    <path d={svgData.pathD} fill="url(#solarGradient)" />
                    {/* Top border line */}
                    <path d={svgData.lineD} fill="none" stroke="#10b981" strokeWidth="2" />
                    
                    {/* Time indicator vertical line (if daytime) */}
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
                </div>
                <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-2 px-1">
                  <span>12 AM</span>
                  <span>6 AM (Sunrise)</span>
                  <span className="text-amber-500 font-bold">12 PM (Peak)</span>
                  <span>6 PM (Sunset)</span>
                  <span>12 AM</span>
                </div>
              </div>

              {/* Environmental Carbon savings */}
              <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Leaf size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Carbon Footprint Reduction</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Estimated environmental impact based on current yield</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400 font-mono">-{telemetry.co2Kg} kg CO2</div>
                  <div className="text-[9px] text-slate-400 font-semibold">{telemetry.trees} trees planted equiv.</div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
