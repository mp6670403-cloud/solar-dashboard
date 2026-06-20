'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Sun, 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  Phone, 
  Copy, 
  Printer, 
  AlertCircle,
  FileText,
  ChevronRight,
  Camera,
  Layers,
  Zap
} from 'lucide-react';

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('token');

  const [data, setData] = useState(null);
  const [isB2C, setIsB2C] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showInvoicePrint, setShowInvoicePrint] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('Please provide a valid Order ID or Tracking Token.');
      setLoading(false);
      return;
    }

    const fetchTrackingInfo = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        
        // Detect if B2C Tracking token (starts with TRK-)
        const isB2CToken = orderId.toUpperCase().startsWith('TRK-');
        setIsB2C(isB2CToken);

        const url = isB2CToken 
          ? `${baseUrl}/b2c/project/track/${orderId}` 
          : `${baseUrl}/b2b/track/${orderId}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(isB2CToken ? 'Project not found with this tracking token.' : 'Order not found or tracking offline.');
        }
        const resData = await response.json();
        setData(resData);
      } catch (err) {
        setError(err.message || 'Failed to fetch tracking status.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingInfo();
  }, [orderId]);

  const handleCopyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center animate-bounce shadow-lg shadow-indigo-600/30">
          <Sun size={24} className="text-white animate-spin" />
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-indigo-400 animate-pulse">Connecting to Helius Solar Logistics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-sm font-bold text-white mb-2">Tracking Failed</h3>
          <p className="text-xs text-slate-450 mb-6 leading-relaxed">{error || 'Tracking details not found.'}</p>
          <a 
            href="https://wa.me/917052051010" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition duration-200 w-full"
          >
            <Phone size={14} /> Contact Support
          </a>
        </div>
      </div>
    );
  }

  // Render B2C Project Timeline
  if (isB2C) {
    const b2cStages = [
      { id: 'Survey Pending', label: 'Survey Pending', icon: Clock, desc: 'Site survey scheduled and technician assigning initiated.' },
      { id: 'Survey Done', label: 'Site Survey Completed', icon: Camera, desc: 'Technician visited site, feasibility report submitted.' },
      { id: 'Structure Installation', label: 'Structure Mounted', icon: Layers, desc: 'Solar mounting structures successfully fixed.' },
      { id: 'Panel Installation', label: 'Solar Panels Mounted', icon: Sun, desc: 'Solar modules mounted and wired in series.' },
      { id: 'Wiring & Commissioning', label: 'Electrical Commissioning', icon: Zap, desc: 'Inverter mounted, connected to grid, commissioned.' },
      { id: 'Net Metering Approval', label: 'Net Metering Completed', icon: CheckCircle, desc: 'Net meter installed by DISCOM. System fully active.' }
    ];

    const getB2CStepStatus = (stepId) => {
      const history = data.stage_history || [];
      const isCompleted = history.some(h => h.stage === stepId);
      if (isCompleted) return 'completed';
      
      // If current stage matches, it is active/completed
      if (data.stage === stepId) return 'completed';

      // Simple sequence checking
      const stageOrder = b2cStages.map(s => s.id);
      const currentIdx = stageOrder.indexOf(data.stage);
      const stepIdx = stageOrder.indexOf(stepId);
      
      return stepIdx <= currentIdx ? 'completed' : 'pending';
    };

    const getB2CHistoryDetails = (stepId) => {
      const history = data.stage_history || [];
      return history.find(h => h.stage === stepId);
    };

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <div className="flex items-center gap-3 justify-center pb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sun size={22} className="animate-pulse" />
            </div>
            <div className="text-left">
              <h1 className="text-base font-black tracking-tight text-white uppercase">Helius Solar</h1>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Project Installation Tracking</p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
              <div>
                <p className="text-[10px] text-slate-505 uppercase font-semibold">Tracking Token</p>
                <h2 className="text-sm font-bold text-indigo-400 font-mono">{orderId}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                {data.stage}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Customer Name</p>
                <p className="text-white font-medium mt-0.5">{data.customer_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">System Capacity</p>
                <p className="text-white font-medium mt-0.5">{data.kw_capacity} kW Residential</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Net Metering Status</p>
                <p className="text-white font-medium mt-0.5">{data.net_metering_stage || 'Not Initiated'}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6 border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <Layers size={14} className="text-indigo-400" /> Installation Milestones
            </h3>
            
            <div className="relative border-l border-slate-800 ml-3 space-y-6">
              {b2cStages.map((step) => {
                const stepStatus = getB2CStepStatus(step.id);
                const StepIcon = step.icon;
                const historyDetails = getB2CHistoryDetails(step.id);
                return (
                  <div key={step.id} className="relative pl-7">
                    <div className={`absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      stepStatus === 'completed'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-650'
                    }`}>
                      <StepIcon size={12} className={stepStatus === 'completed' ? 'text-white' : 'text-slate-500'} />
                    </div>

                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className={`text-xs font-bold ${
                          stepStatus === 'completed' ? 'text-white' : 'text-slate-505 text-slate-500'
                        }`}>{step.label}</h4>
                        {historyDetails && (
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(historyDetails.timestamp).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] mt-0.5 leading-normal ${
                        stepStatus === 'completed' ? 'text-slate-400' : 'text-slate-600'
                      }`}>{step.desc}</p>

                      {/* Display proof photo if uploaded */}
                      {historyDetails && historyDetails.proof_url && (
                        <div className="mt-2.5 rounded-lg border border-slate-800 overflow-hidden bg-slate-950 p-1.5 max-w-xs">
                          <img 
                            src={historyDetails.proof_url} 
                            alt={`${step.label} proof`} 
                            className="rounded h-24 w-full object-cover opacity-80 hover:opacity-100 transition duration-200"
                          />
                          <p className="text-[8px] text-slate-500 mt-1 text-center font-medium">Uploaded by {historyDetails.updated_by}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <a 
            href="https://wa.me/917052051010" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition duration-200 shadow-md w-full"
          >
            <Phone size={14} /> Contact Support & Team
          </a>

          <p className="text-[9px] text-center text-slate-600 mt-8">
            Powered by Helius Solar Logistics. Lucknow branch. &bull; gomtinagar@heliussolar.in
          </p>
        </div>
      </div>
    );
  }

  // B2B Order Tracking
  const steps = [
    { id: 'placed', label: 'Order Received', icon: Clock, desc: 'Order details successfully placed in the queue.' },
    { id: 'approved', label: 'Approved & Confirmed', icon: CheckCircle, desc: 'Owner approved. Invoice generated.' },
    { id: 'dispatched', label: 'Material Dispatched', icon: Truck, desc: 'LR/AWB assigned and transit initiated.' },
    { id: 'delivered', label: 'Delivered', icon: MapPin, desc: 'Material successfully handed over at destination.' },
  ];

  const getStepStatus = (stepId) => {
    const status = data.status;
    if (stepId === 'placed') return 'completed';
    
    if (stepId === 'approved') {
      return ['Confirmed', 'Dispatched', 'Delivered'].includes(status) ? 'completed' : 'pending';
    }
    
    if (stepId === 'dispatched') {
      return ['Dispatched', 'Delivered'].includes(status) ? 'completed' : 'pending';
    }
    
    if (stepId === 'delivered') {
      return status === 'Delivered' ? 'completed' : 'pending';
    }
    
    return 'pending';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      <div className="absolute top-[-10%] left-[-20%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl mx-auto space-y-6 relative z-10 print:hidden">
        
        <div className="flex items-center gap-3 justify-center pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sun size={22} className="animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-base font-black tracking-tight text-white uppercase">Helius Solar</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Operations & Logistics Hub</p>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Order ID</p>
              <h2 className="text-sm font-bold text-white"># {data.id}</h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
              data.status === 'Delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              data.status === 'Dispatched' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
              data.status === 'Confirmed' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}>
              {data.status === 'Pending Owner Approval' ? 'Pending Approval' : data.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] text-slate-505 uppercase font-semibold text-slate-500">Client Dealership</p>
              <p className="text-white font-medium mt-0.5">{data.client_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-505 uppercase font-semibold text-slate-500">Product / Qty</p>
              <p className="text-white font-medium mt-0.5 truncate">{data.product_name} <span className="text-slate-400">({data.quantity} units)</span></p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[10px] text-slate-505 uppercase font-semibold text-slate-500">Delivery Location</p>
              <p className="text-white font-medium mt-0.5">{data.delivery_address}</p>
            </div>
          </div>
        </div>

        {/* Timeline Tracker */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-6 border-b border-slate-800/80 pb-3 flex items-center gap-2">
            <Package size={14} className="text-indigo-400" /> Delivery Progress
          </h3>
          
          <div className="relative border-l border-slate-800 ml-3 space-y-6">
            {steps.map((step) => {
              const stepStatus = getStepStatus(step.id);
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="relative pl-7">
                  <div className={`absolute left-0 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    stepStatus === 'completed'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950 border-slate-800 text-slate-650'
                  }`}>
                    <StepIcon size={12} className={stepStatus === 'completed' ? 'text-white' : 'text-slate-505'} />
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold ${
                      stepStatus === 'completed' ? 'text-white' : 'text-slate-500'
                    }`}>{step.label}</h4>
                    <p className={`text-[10px] mt-0.5 leading-normal ${
                      stepStatus === 'completed' ? 'text-slate-400' : 'text-slate-600'
                    }`}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Logistics Info Card */}
        {data.logistics_partner && (
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800/80 pb-3 flex items-center gap-2">
              <Truck size={14} className="text-indigo-400" /> Shipping & Logistics
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Courier / Logistics Partner</p>
                <p className="text-white font-medium mt-0.5">{data.logistics_partner}</p>
              </div>

              {data.booking_id && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">AWB / Tracking Number</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-indigo-400 font-mono font-bold">{data.booking_id}</span>
                    <button 
                      onClick={() => handleCopyToClipboard(data.booking_id, 'tracking')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition"
                      title="Copy Tracking ID"
                    >
                      <Copy size={11} />
                    </button>
                    {copiedField === 'tracking' && <span className="text-[8px] text-emerald-400 font-bold">Copied!</span>}
                  </div>
                </div>
              )}

              {data.e_way_bill && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">GST E-Way Bill Number</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-indigo-400 font-mono font-bold">{data.e_way_bill}</span>
                    <button 
                      onClick={() => handleCopyToClipboard(data.e_way_bill, 'eway')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition"
                      title="Copy E-way bill"
                    >
                      <Copy size={11} />
                    </button>
                    {copiedField === 'eway' && <span className="text-[8px] text-emerald-400 font-bold">Copied!</span>}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {data.invoice ? (
            <button 
              onClick={() => setShowInvoicePrint(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-xs font-semibold text-white transition duration-200 shadow-md"
            >
              <FileText size={14} className="text-indigo-400" /> View Invoice
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800/40 bg-slate-900/20 text-xs font-medium text-slate-550 italic">
              Invoice Generating...
            </div>
          )}

          <a 
            href="https://wa.me/917052051010" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition duration-200 shadow-md"
          >
            <Phone size={14} /> Contact Support
          </a>
        </div>

        <p className="text-[9px] text-center text-slate-600 mt-8">
          Powered by Helius Solar Logistics. Lucknow branch. &bull; gomtinagar@heliussolar.in
        </p>

      </div>

      {/* PRINTABLE INVOICE VIEW OVERLAY */}
      {showInvoicePrint && data.invoice && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overflow-y-auto p-4 print:relative print:bg-white print:p-0 print:z-0">
          <div className="max-w-2xl w-full bg-white text-slate-800 p-8 rounded-2xl relative shadow-2xl print:shadow-none print:p-0 print:max-w-full">
            
            <button 
              onClick={() => setShowInvoicePrint(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition print:hidden"
              title="Close view"
            >
              Close
            </button>

            <button 
              onClick={handlePrint}
              className="absolute top-4 right-20 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition print:hidden shadow-md"
            >
              <Printer size={12} /> Print PDF
            </button>

            <div className="space-y-6 pt-4 print:pt-0">
              
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-xl font-black uppercase text-indigo-700 tracking-tight">Helius Solar</h2>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1">
                    5/576, Sector 5 Market, Gomti Nagar,<br />
                    Lucknow, Uttar Pradesh - 226010<br />
                    GSTIN: 09AAACH4821A1Z8
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-slate-700 uppercase">Tax Invoice</h3>
                  <p className="text-xs font-mono font-bold mt-1">No: {data.invoice.invoice_no}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Date: {new Date(data.invoice.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bill To Client</h4>
                  <p className="font-bold text-slate-800 mt-1">{data.client_name}</p>
                  <p className="text-slate-500 mt-1">{data.delivery_address}</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment Details</h4>
                  <p className="mt-1"><strong>Status:</strong> <span className={`font-bold ${data.invoice.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{data.invoice.status}</span></p>
                  <p className="mt-1"><strong>Due Date:</strong> {new Date(data.invoice.due_date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Taxable Amt (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-150">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{data.product_name}</p>
                      <span className="text-[10px] text-slate-400">Solar EPC Stock Allocation</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">{data.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">₹{data.invoice.taxable_amount / data.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">₹{data.invoice.taxable_amount.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 text-xs border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-slate-500">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">₹{data.invoice.taxable_amount.toLocaleString('en-IN')}</span>
                  </div>
                  {data.invoice.cgst > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>CGST (9%):</span>
                      <span className="font-mono">₹{data.invoice.cgst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {data.invoice.sgst > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>SGST (9%):</span>
                      <span className="font-mono">₹{data.invoice.sgst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {data.invoice.igst > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>IGST (18%):</span>
                      <span className="font-mono">₹{data.invoice.igst.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black border-t border-slate-200 pt-2 text-indigo-700">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{data.invoice.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="terms-footer border-t border-slate-200 pt-5 text-[9px] text-slate-400 text-center space-y-1">
                <p>All values are in Indian Rupees (INR). Subject to Lucknow Jurisdiction.</p>
                <p>Thank you for partnering with Helius Solar for clean energy transition!</p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <p className="text-xs font-semibold tracking-wider uppercase text-indigo-450 animate-pulse">Loading Tracking Engine...</p>
      </div>
    }>
      <TrackingContent />
    </Suspense>
  );
}
