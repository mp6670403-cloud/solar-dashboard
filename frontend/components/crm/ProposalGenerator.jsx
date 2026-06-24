import { useState, useEffect } from 'react';
import Button from '../UI/Button';
import Badge from '../UI/Badge';
import { FileText, Sun, Zap, Home, DollarSign, Calculator, Printer, ShieldCheck } from 'lucide-react';

export default function ProposalGenerator({ lead }) {
  const [kw, setKw] = useState(lead?.kw_capacity || 3);
  const [ratePerKw, setRatePerKw] = useState(60000);
  const [interestRate, setInterestRate] = useState(9);
  
  // Math Calculations
  const totalCost = kw * ratePerKw;
  
  // PM Surya Ghar Subsidy Logic
  let subsidy = 0;
  if (kw <= 2) {
    subsidy = kw * 30000;
  } else if (kw <= 3) {
    subsidy = 60000 + ((kw - 2) * 18000);
  } else {
    subsidy = 78000; // Max subsidy
  }
  
  const effectiveCost = totalCost - subsidy;
  const roofArea = kw * 100;
  const dailyGen = kw * 4;
  const monthlySavings = dailyGen * 30 * 8; // assuming ₹8 per unit
  
  // EMI Calculation (on Total Cost, since Subsidy is DBT and comes later)
  const calculateEMI = (principal, years, rate) => {
    const p = principal;
    const r = rate / (12 * 100);
    const n = years * 12;
    if (r === 0) return p / n;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const emi3Years = calculateEMI(totalCost, 3, interestRate);
  const emi5Years = calculateEMI(totalCost, 5, interestRate);
  
  const handlePrint = () => {
    const printContent = document.getElementById('proposal-pdf-content');
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload(); // Reload to restore React state cleanly
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-6">
      
      {/* Top Controls (Hidden in print) */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calculator size={16} className="text-primary-400" /> Auto-Proposal Generator
          </h3>
          <p className="text-[10px] text-slate-500">Tweak values to instantly update the quote</p>
        </div>
        <div className="flex gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase">System Size (kW)</label>
            <input 
              type="number" 
              value={kw} 
              onChange={e => setKw(Number(e.target.value))} 
              className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase">Rate/kW (₹)</label>
            <input 
              type="number" 
              value={ratePerKw} 
              onChange={e => setRatePerKw(Number(e.target.value))} 
              className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-semibold uppercase">Loan Int. (%)</label>
            <input 
              type="number" 
              value={interestRate} 
              onChange={e => setInterestRate(Number(e.target.value))} 
              className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500"
            />
          </div>
          <div className="self-end">
            <Button onClick={handlePrint} className="!py-1.5 bg-primary-600 hover:bg-primary-500 text-xs">
              <Printer size={14} /> Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* ── PDF Printable Container ── */}
      <div id="proposal-pdf-content" className="bg-white rounded-xl p-8 text-slate-800 font-sans shadow-inner max-w-3xl mx-auto w-full print:shadow-none print:m-0 print:p-0">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">SOLAR<span className="text-emerald-600">SYNERGY</span></h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Empowering Homes with Clean Energy</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">Quotation</h2>
            <p className="text-sm text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            <p className="text-sm font-semibold mt-1">Valid for: 15 Days</p>
          </div>
        </div>

        {/* Client Info */}
        <div className="flex justify-between mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Prepared For</p>
            <p className="font-bold text-slate-800 text-lg">{lead?.name || 'Customer Name'}</p>
            <p className="text-sm text-slate-600">{lead?.phone || '+91 XXXXX XXXXX'}</p>
            <p className="text-sm text-slate-600">{lead?.city || 'City'}, Gujarat</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">System Overview</p>
            <p className="font-bold text-slate-800 text-lg">{kw} kW Grid-Tied System</p>
            <p className="text-sm text-slate-600">Avg. Generation: {dailyGen} Units/Day</p>
            <p className="text-sm text-slate-600">Roof Req: {roofArea} Sq.ft.</p>
          </div>
        </div>

        {/* Costing Table */}
        <div className="mb-8 border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="p-3 text-xs font-bold text-slate-600 uppercase">Description</th>
                <th className="p-3 text-xs font-bold text-slate-600 uppercase text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-4">
                  <p className="font-bold text-slate-800">Complete Solar EPC Installation ({kw}kW)</p>
                  <p className="text-xs text-slate-500 mt-1">Includes Tier-1 Mono PERC Panels, On-grid Inverter, GI Structure, AC/DC Cables, Earthing, Net Metering facilitation, and Labor.</p>
                </td>
                <td className="p-4 text-right font-bold text-slate-800">₹{totalCost.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="p-4">
                  <p className="font-bold text-emerald-700 flex items-center gap-2">
                    <ShieldCheck size={16} /> PM Surya Ghar Subsidy (DBT)
                  </p>
                  <p className="text-xs text-emerald-600/80 mt-1">This amount will be directly credited to your bank account by the Govt. of India after successful net metering.</p>
                </td>
                <td className="p-4 text-right font-bold text-emerald-700">- ₹{subsidy.toLocaleString('en-IN')}</td>
              </tr>
              <tr className="bg-slate-800 text-white">
                <td className="p-4 font-bold text-lg">Effective Cost to You (After Subsidy)</td>
                <td className="p-4 text-right font-black text-xl">₹{effectiveCost.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financials & ROI */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border border-indigo-100 bg-indigo-50/30 rounded-lg p-5">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign size={14} /> Solar Loan Options
            </h4>
            <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
              Loans are processed on the Total Project Cost (₹{totalCost.toLocaleString('en-IN')}). Your subsidy will be disbursed later to your account.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded border border-indigo-100">
                <div>
                  <p className="font-bold text-indigo-900 text-sm">3 Years EMI</p>
                  <p className="text-[10px] text-slate-500">@{interestRate}% p.a.</p>
                </div>
                <p className="font-black text-indigo-700">₹{emi3Years.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/mo</span></p>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded border border-indigo-100">
                <div>
                  <p className="font-bold text-indigo-900 text-sm">5 Years EMI</p>
                  <p className="text-[10px] text-slate-500">@{interestRate}% p.a.</p>
                </div>
                <p className="font-black text-indigo-700">₹{emi5Years.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/mo</span></p>
              </div>
            </div>
          </div>

          <div className="border border-amber-100 bg-amber-50/30 rounded-lg p-5">
            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={14} /> ROI & Savings
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Monthly Savings</p>
                <p className="text-2xl font-black text-amber-600">₹{monthlySavings.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Payback Period</p>
                <p className="text-xl font-bold text-slate-800">
                  {Math.round((effectiveCost / (monthlySavings * 12)) * 10) / 10} Years
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  After {Math.round((effectiveCost / (monthlySavings * 12)) * 10) / 10} years, your electricity is practically FREE for the next 20+ years of panel life!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-slate-200 mt-8">
          <p className="text-[10px] text-slate-400 font-medium">Thank you for choosing SunCraft Power to transition to clean energy.</p>
          <p className="text-[10px] text-slate-400 mt-1">Email: contact@suncraftpower.in | Phone: +91 70520 51010</p>
        </div>

      </div>
    </div>
  );
}
