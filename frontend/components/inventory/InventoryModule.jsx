/**
 * inventory/InventoryModule.jsx — Unified Inventory Insights Center (B2B + EPC)
 * 
 * Features:
 * - Overview Tab: Blocked capital metrics, category lists, reorder warnings.
 * - B2B Bulk Tab: B2B Vendors listing (name, GSTIN, credit ledger balances), purchase PO tracking logs.
 * - EPC Retail Tab: Material dispatches to retail active solar sites.
 * - Role-Based Access: Hides B2B tab for Operations, hides EPC tab for B2B Sales.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select';
import AIInsights from '../dashboard/AIInsights';
import {
  Package,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Send,
  Boxes,
  Briefcase,
  Layers,
  Truck,
  IndianRupee,
  FileText,
  UserCheck,
} from 'lucide-react';

const DEMO_INVENTORY = [
  { id: 1, item_name: 'Mono PERC Solar Panel 550Wp', item_code: 'PNL-550-MONO', stock_level: 120, price: 150.00, supplier: 'SolarTech Corp' },
  { id: 2, item_name: '3-Phase Hybrid Solar Inverter 10kW', item_code: 'INV-10K-HYB', stock_level: 4, price: 1200.00, supplier: 'Energiaa Systems' },
  { id: 3, item_name: 'LiFePO4 Lithium Battery Storage 5kWh', item_code: 'BAT-5K-LIFE', stock_level: 45, price: 950.00, supplier: 'PowerVolt Solutions' },
  { id: 4, item_name: 'MC4 Connectors Male/Female (Pair)', item_code: 'MC4-CONN-01', stock_level: 850, price: 2.50, supplier: 'LinkCable Manufacturing' },
  { id: 5, item_name: 'Aluminum Solar Panel Mounting Rail 4.2m', item_code: 'RAIL-4.2-AL', stock_level: 8, price: 45.00, supplier: 'StructMetal Co' }
];

export default function InventoryModule() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'b2b', 'epc'
  const [inventory, setInventory] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [skuModalOpen, setSkuModalOpen] = useState(false);
  const [skuForm, setSkuForm] = useState({ item_name: '', item_code: '', stock_level: '', price: '', supplier: '' });

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: '', gstin: '', contact: '', credit_balance: '' });

  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerForm, setLedgerForm] = useState({ vendor_id: '', transaction_type: 'Credit', amount: '', description: '' });

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ project_id: '', item_name: '', quantity: '', status: 'Pending' });

  useEffect(() => {
    const userStr = localStorage.getItem('dashboard_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invData, projData] = await Promise.all([
        apiCall('/inventory'),
        apiCall('/projects')
      ]);
      setInventory(invData);
      setProjects(projData);

      // Role check to fetch restricted datasets
      const userStr = localStorage.getItem('dashboard_user');
      const user = userStr ? JSON.parse(userStr) : { designation: 'Owner' };
      
      if (user.designation === 'Owner' || user.designation === 'B2B Sales') {
        const [vData, lData] = await Promise.all([
          apiCall('/inventory/vendors'),
          apiCall('/inventory/ledgers')
        ]);
        setVendors(vData);
        setLedgers(lData);
      }
      
      if (user.designation === 'Owner' || user.designation === 'Operations') {
        const dData = await apiCall('/inventory/dispatches');
        setDispatches(dData);
      }
    } catch (err) {
      console.warn('API error in Unified Inventory, using mock fallbacks:', err.message);
      setInventory(DEMO_INVENTORY);
      setVendors([
        { id: 1, name: 'Waaree Energies Ltd', gstin: '27AAAAA1111A1Z1', contact: 'sales@waaree.com', credit_balance: 450000 },
        { id: 2, name: 'Growatt New Energy', gstin: '27BBBBB2222B2Z2', contact: 'service@growatt.com', credit_balance: 120000 }
      ]);
      setLedgers([
        { id: 1, vendor_id: 1, transaction_type: 'Credit', amount: 450000, description: 'Bulk Purchase of Panels', created_at: '2026-06-01' },
        { id: 2, vendor_id: 2, transaction_type: 'Credit', amount: 120000, description: 'Procured Inverters', created_at: '2026-06-10' }
      ]);
      setDispatches([
        { id: 1, project_id: 1, item_name: 'Mono PERC Solar Panel 550Wp', quantity: 16, status: 'Delivered', dispatched_at: '2026-06-11' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Form Submissions
  const handleAddSku = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/inventory', { method: 'POST', body: JSON.stringify(skuForm) });
      setSkuModalOpen(false);
      setSkuForm({ item_name: '', item_code: '', stock_level: '', price: '', supplier: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/inventory/vendors', { method: 'POST', body: JSON.stringify(vendorForm) });
      setVendorModalOpen(false);
      setVendorForm({ name: '', gstin: '', contact: '', credit_balance: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddLedger = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/inventory/ledgers', { method: 'POST', body: JSON.stringify(ledgerForm) });
      setLedgerModalOpen(false);
      setLedgerForm({ vendor_id: '', transaction_type: 'Credit', amount: '', description: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddDispatch = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/inventory/dispatches', { method: 'POST', body: JSON.stringify(dispatchForm) });
      setDispatchModalOpen(false);
      setDispatchForm({ project_id: '', item_name: '', quantity: '', status: 'Pending' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStockStatus = (level, code) => {
    let threshold = 10;
    if (code?.includes('CONN') || code?.includes('RAIL')) threshold = 50;
    if (level === 0) return { label: 'Out of Stock', variant: 'danger', isLow: true };
    if (level <= threshold) return { label: 'Low Stock', variant: 'warning', isLow: true };
    return { label: 'Healthy', variant: 'success', isLow: false };
  };

  const getVendorName = (vendorId) => {
    const v = vendors.find(item => item.id === parseInt(vendorId));
    return v ? v.name : `Vendor ID ${vendorId}`;
  };

  const getProjectName = (projId) => {
    const p = projects.find(item => item.id === parseInt(projId));
    return p ? p.project_name : `Project ID ${projId}`;
  };

  const totalCapital = inventory.reduce((acc, curr) => acc + (curr.stock_level * curr.price), 0);
  const lowStockCount = inventory.filter(item => getStockStatus(item.stock_level, item.item_code).isLow).length;

  const userRole = currentUser?.designation || 'Owner';

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* ── Top Tabs ── */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'overview' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/25' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Boxes size={14} className="inline mr-1" /> Stock Overview
          </button>
          
          {(userRole === 'Owner' || userRole === 'B2B Sales') && (
            <button
              onClick={() => setActiveTab('b2b')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'b2b' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/25' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Briefcase size={14} className="inline mr-1" /> B2B Wholesales &amp; Vendors
            </button>
          )}

          {(userRole === 'Owner' || userRole === 'Operations') && (
            <button
              onClick={() => setActiveTab('epc')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'epc' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/25' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Truck size={14} className="inline mr-1" /> Retail EPC Dispatches
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {activeTab === 'overview' && (
            <Button onClick={() => setSkuModalOpen(true)} className="px-3.5 py-2 text-xs">
              <Plus size={14} /> Add SKU
            </Button>
          )}
          {activeTab === 'b2b' && (
            <div className="flex gap-2">
              <Button onClick={() => setVendorModalOpen(true)} variant="secondary" className="px-3 py-2 text-xs">
                <Plus size={13} /> Add Vendor
              </Button>
              <Button onClick={() => setLedgerModalOpen(true)} className="px-3 py-2 text-xs">
                <IndianRupee size={13} /> Post ledger Transaction
              </Button>
            </div>
          )}
          {activeTab === 'epc' && (
            <Button onClick={() => setDispatchModalOpen(true)} className="px-3.5 py-2 text-xs">
              <Truck size={14} /> Record dispatch
            </Button>
          )}
        </div>
      </div>

      {/* ── Content Viewports ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <IndianRupee size={20} />
              </div>
              <div>
                <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Blocked Capital</h4>
                <div className="text-lg font-bold text-white mt-0.5">₹{totalCapital.toLocaleString('en-IN')}</div>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Low Stock SKUs</h4>
                <div className="text-lg font-bold text-white mt-0.5">{lowStockCount} Items Alert</div>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Package size={20} />
              </div>
              <div>
                <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Active Catalog Size</h4>
                <div className="text-lg font-bold text-white mt-0.5">{inventory.length} Stock items</div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Stock List Table (9 cols) */}
            <div className="xl:col-span-9 space-y-6">
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/40 border-b border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Item Description</th>
                        <th className="py-4 px-3">Item Code</th>
                        <th className="py-4 px-3 text-right">Available Stock</th>
                        <th className="py-4 px-3">Status</th>
                        <th className="py-4 px-3">Supplier</th>
                        <th className="py-4 px-3 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {inventory.map(item => {
                        const status = getStockStatus(item.stock_level, item.item_code);
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="py-4 px-6 font-semibold text-xs text-white">{item.item_name}</td>
                            <td className="py-4 px-3 text-xs text-indigo-400 font-mono">{item.item_code}</td>
                            <td className="py-4 px-3 text-xs font-bold text-white text-right font-mono pr-6">{item.stock_level}</td>
                            <td className="py-4 px-3">
                              <Badge variant={status.variant} dot>{status.label}</Badge>
                            </td>
                            <td className="py-4 px-3 text-xs text-slate-400">{item.supplier || '-'}</td>
                            <td className="py-4 px-3 text-xs text-white text-right font-mono pr-6">₹{item.price.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Inventory AI Insights Sidebar (3 cols) */}
            <div className="xl:col-span-3 xl:sticky xl:top-8 bg-slate-900/30 backdrop-blur-md rounded-xl p-5 border border-slate-800/80">
              <AIInsights module="inventory" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'b2b' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vendors directory (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
              <Briefcase size={15} className="text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Wholesales Vendor Accounts</h3>
            </div>

            <div className="space-y-3">
              {vendors.map(v => (
                <div key={v.id} className="bg-slate-950/40 border border-slate-850 rounded-lg p-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">{v.name}</h4>
                    <span className="text-[9px] font-mono text-indigo-400 block mt-1">GSTIN: {v.gstin || '-'}</span>
                    <span className="text-[9px] text-slate-500 block">Contact: {v.contact || '-'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Balance Owed</span>
                    <span className="text-xs font-bold text-white font-mono">₹{v.credit_balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchasing Ledger logs (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl p-5 flex flex-col h-[400px]">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
              <FileText size={15} className="text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Wholesale Ledger Transactions</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {ledgers.map(l => (
                <div key={l.id} className="bg-slate-950/60 border border-slate-850 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[10px]">{getVendorName(l.vendor_id)}</span>
                    <Badge variant={l.transaction_type === 'Debit' ? 'success' : 'danger'}>{l.transaction_type}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">{l.description}</p>
                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <span className="font-mono text-white font-semibold">Amount: ₹{l.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-slate-500">{new Date(l.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'epc' && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
            <Truck size={15} className="text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">EPC Project Site Material Dispatches</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Project Site Link</th>
                  <th className="py-4 px-3">Item Description</th>
                  <th className="py-4 px-3 text-right">Quantity</th>
                  <th className="py-4 px-3">Dispatch Status</th>
                  <th className="py-4 px-3">Log Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs">
                {dispatches.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/10">
                    <td className="py-4 px-6 font-semibold text-white">{getProjectName(d.project_id)}</td>
                    <td className="py-4 px-3 text-slate-300 font-medium">{d.item_name}</td>
                    <td className="py-4 px-3 text-right font-mono pr-6">{d.quantity} units</td>
                    <td className="py-4 px-3">
                      <Badge variant={d.status === 'Delivered' ? 'success' : d.status === 'Dispatched' ? 'info' : 'warning'}>{d.status}</Badge>
                    </td>
                    <td className="py-4 px-3 text-[10px] text-slate-500">{new Date(d.dispatched_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Add New SKU ── */}
      <Modal isOpen={skuModalOpen} onClose={() => setSkuModalOpen(false)} title="Create New Stock SKU">
        <form onSubmit={handleAddSku} className="p-6 space-y-4">
          <Input label="Item Name" id="name" placeholder="Waaree Solar Panel 540Wp" value={skuForm.item_name} onChange={e => setSkuForm(prev => ({ ...prev, item_name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU Code" id="code" placeholder="PNL-WAA-540" value={skuForm.item_code} onChange={e => setSkuForm(prev => ({ ...prev, item_code: e.target.value }))} required />
            <Input label="Initial Inventory Stock" id="qty" type="number" placeholder="100" value={skuForm.stock_level} onChange={e => setSkuForm(prev => ({ ...prev, stock_level: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit Cost Price (₹)" id="price" type="number" placeholder="12000" value={skuForm.price} onChange={e => setSkuForm(prev => ({ ...prev, price: e.target.value }))} required />
            <Input label="Manufacturer / Supplier Co" id="supplier" placeholder="Waaree" value={skuForm.supplier} onChange={e => setSkuForm(prev => ({ ...prev, supplier: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setSkuModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create SKU</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Add B2B Vendor ── */}
      <Modal isOpen={vendorModalOpen} onClose={() => setVendorModalOpen(false)} title="Register B2B Vendor Profile">
        <form onSubmit={handleAddVendor} className="p-6 space-y-4">
          <Input label="Vendor Business Name" id="v_name" placeholder="Luminous Power Technologies" value={vendorForm.name} onChange={e => setVendorForm(prev => ({ ...prev, name: e.target.value }))} required />
          <Input label="GSTIN Number" id="v_gst" placeholder="27XXXXX0000X0Z0" value={vendorForm.gstin} onChange={e => setVendorForm(prev => ({ ...prev, gstin: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Email/WhatsApp" id="v_contact" placeholder="dealers@luminous.com" value={vendorForm.contact} onChange={e => setVendorForm(prev => ({ ...prev, contact: e.target.value }))} />
            <Input label="Initial Credit Balance Owed (₹)" id="v_bal" type="number" placeholder="0" value={vendorForm.credit_balance} onChange={e => setVendorForm(prev => ({ ...prev, credit_balance: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
            <Button type="submit">Register Vendor</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Post Ledger Transaction ── */}
      <Modal isOpen={ledgerModalOpen} onClose={() => setLedgerModalOpen(false)} title="Record Wholesale Transaction Ledger">
        <form onSubmit={handleAddLedger} className="p-6 space-y-4">
          <Select
            label="Select B2B Vendor"
            id="l_vendor"
            value={ledgerForm.vendor_id}
            onChange={e => setLedgerForm(prev => ({ ...prev, vendor_id: e.target.value }))}
            options={vendors.map(v => ({ value: v.id, label: v.name }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Transaction Action Type"
              id="l_type"
              value={ledgerForm.transaction_type}
              onChange={e => setLedgerForm(prev => ({ ...prev, transaction_type: e.target.value }))}
              options={[{ value: 'Credit', label: 'Credit (Add Invoice)' }, { value: 'Debit', label: 'Debit (Log Payment)' }]}
              required
            />
            <Input label="Transaction Value (₹)" id="l_amt" type="number" placeholder="50000" value={ledgerForm.amount} onChange={e => setLedgerForm(prev => ({ ...prev, amount: e.target.value }))} required />
          </div>
          <Input label="Description / Invoice Reference" id="l_desc" placeholder="e.g. Shipment of 24 poly panels - INV#49184" value={ledgerForm.description} onChange={e => setLedgerForm(prev => ({ ...prev, description: e.target.value }))} />
          
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setLedgerModalOpen(false)}>Cancel</Button>
            <Button type="submit">Post Ledger Entry</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Record Dispatch ── */}
      <Modal isOpen={dispatchModalOpen} onClose={() => setDispatchModalOpen(false)} title="Record Project Site Material Dispatch">
        <form onSubmit={handleAddDispatch} className="p-6 space-y-4">
          <Select
            label="Destination Site Project"
            id="d_proj"
            value={dispatchForm.project_id}
            onChange={e => setDispatchForm(prev => ({ ...prev, project_id: e.target.value }))}
            options={projects.map(p => ({ value: p.id, label: p.project_name }))}
            required
          />
          <Input label="Material Item Description" id="d_item" placeholder="Mono PERC Solar Panel 550Wp" value={dispatchForm.item_name} onChange={e => setDispatchForm(prev => ({ ...prev, item_name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dispatched Quantity" id="d_qty" type="number" placeholder="16" value={dispatchForm.quantity} onChange={e => setDispatchForm(prev => ({ ...prev, quantity: e.target.value }))} required />
            <Select
              label="Dispatch Status"
              id="d_status"
              value={dispatchForm.status}
              onChange={e => setDispatchForm(prev => ({ ...prev, status: e.target.value }))}
              options={[{ value: 'Pending', label: 'Pending Dispatch' }, { value: 'Dispatched', label: 'Dispatched (In Transit)' }, { value: 'Delivered', label: 'Delivered (On Site)' }]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setDispatchModalOpen(false)}>Cancel</Button>
            <Button type="submit">Log Material Dispatch</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
