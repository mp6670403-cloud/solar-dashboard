'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Modal from '../UI/Modal';
import AIInsights from '../dashboard/AIInsights';
import DocumentPrinter from './DocumentPrinter';
import {
  Package,
  Printer,
  TrendingUp,
  CreditCard,
  Users,
  RefreshCw,
  Plus,
  Truck,
  FileText,
  DollarSign,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Layers,
  Search,
  ShoppingCart,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  Download
} from 'lucide-react';

const B2B_TABS = [
  { id: 'clients', label: 'EPC Clients (Buyers)', icon: Users, color: 'emerald' },
  { id: 'vendors', label: 'Vendors & Suppliers', icon: UserCheck, color: 'indigo' },
  { id: 'inventory', label: 'Products & Stock', icon: Package, color: 'cyan' },
  { id: 'orders', label: 'Orders & Quotes', icon: ShoppingCart, color: 'violet' },
  { id: 'invoices', label: 'Invoices & Ledgers', icon: FileText, color: 'amber' },
];

export default function B2BDealerModule({ user }) {
  const [activeTab, setActiveTab] = useState('clients');
  const [loading, setLoading] = useState(true);
  
  // DB States
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, activeOrders: 0, outstandingDues: 0, totalClients: 0 });

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals status
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [changeRateModalOpen, setChangeRateModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);

  // Document Printing
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printType, setPrintType] = useState('invoice');
  const [printData, setPrintData] = useState(null);

  const openDocument = (type, data) => {
    setPrintType(type);
    setPrintData(data);
    setPrintModalOpen(true);
  };

  // Form states
  const [clientForm, setClientForm] = useState({ business_name: '', gstin: '', contact: '', phone: '', state: 'Rajasthan', credit_limit: '500000' });
  const [vendorForm, setVendorForm] = useState({ name: '', gstin: '', contact: '', phone: '', credit_balance: '0' });
  const [productForm, setProductForm] = useState({ product_name: '', rate: '', category: 'Panels', stock_level: '0', reorder_level: '20' });
  const [orderForm, setOrderForm] = useState({ client_id: '', product_id: '', quantity: '10', rate: '', delivery_address: '' });
  const [stockInForm, setStockInForm] = useState({ vendor_id: '', product_id: '', quantity: '100', rate: '' });
  const [paymentForm, setPaymentForm] = useState({ invoice_id: '' });
  const [dispatchForm, setDispatchForm] = useState({ order_id: null, partner: 'Porter', tracking_no: '', eway_bill: '' });
  
  // Override rate states
  const [selectedOrderForRate, setSelectedOrderForRate] = useState(null);
  const [customRate, setCustomRate] = useState('');

  const isB2BAllowed = user?.designation === 'Owner' || user?.designation === 'B2B Sales' || user?.designation === 'Operations';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, clientsData, vendorsData, productsData, ordersData, invoicesData, ledgersData, stockLogsData] = await Promise.all([
        apiCall('/b2b/stats'),
        apiCall('/b2b/clients'),
        apiCall('/b2b/vendors'),
        apiCall('/b2b/price-list'),
        apiCall('/b2b/orders'),
        apiCall('/b2b/invoices'),
        apiCall('/b2b/ledgers'),
        apiCall('/b2b/stock-in-logs')
      ]);

      setStats(statsData);
      setClients(clientsData);
      setVendors(vendorsData);
      setProducts(productsData);
      setOrders(ordersData);
      setInvoices(invoicesData);
      setLedgers(ledgersData);
      setStockLogs(stockLogsData);

      // Set default drop-down values
      if (clientsData.length > 0) setOrderForm(prev => ({ ...prev, client_id: clientsData[0].id.toString() }));
      if (productsData.length > 0) {
        setOrderForm(prev => ({ ...prev, product_id: productsData[0].id.toString() }));
        setStockInForm(prev => ({ ...prev, product_id: productsData[0].id.toString() }));
      }
      if (vendorsData.length > 0) setStockInForm(prev => ({ ...prev, vendor_id: vendorsData[0].id.toString() }));
      const unpaid = invoicesData.find(i => i.status === 'Unpaid');
      if (unpaid) setPaymentForm({ invoice_id: unpaid.id.toString() });

    } catch (err) {
      console.warn('API fetch error, falling back to cached state details', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // EXPORT HANDLERS
  // ============================================================================
  const handleExportClientsCSV = () => {
    if (clients.length === 0) return;
    const headers = ['Client ID', 'Business Legal Name', 'GSTIN', 'Contact Person', 'Phone', 'Credit Limit', 'Pending Dues', 'State', 'Defaulter Status'];
    const rows = clients.map(c => [
      c.id,
      c.business_name,
      c.gstin,
      c.contact,
      c.phone,
      c.credit_limit || 0,
      c.pending_dues || 0,
      c.state,
      c.defaulter_status || 'No'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `B2B_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportClientsJSON = () => {
    if (clients.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(clients, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `B2B_Clients_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVendorsCSV = () => {
    if (vendors.length === 0) return;
    const headers = ['Vendor ID', 'Company Name', 'GSTIN', 'Phone', 'Email', 'Outstanding Balance'];
    const rows = vendors.map(v => [
      v.id,
      v.name,
      v.gstin,
      v.phone,
      v.contact,
      v.credit_balance || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `B2B_Vendors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportVendorsJSON = () => {
    if (vendors.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(vendors, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `B2B_Vendors_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProductsCSV = () => {
    if (products.length === 0) return;
    const headers = ['Product ID', 'Product Name', 'Category', 'Unit Rate', 'Stock Level', 'Reorder Level'];
    const rows = products.map(p => [
      p.id,
      p.product_name,
      p.category,
      p.rate || 0,
      p.stock_level || 0,
      p.reorder_level || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `B2B_Products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProductsJSON = () => {
    if (products.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(products, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `B2B_Products_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOrdersCSV = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'Client Name', 'Product Name', 'Quantity', 'Rate', 'Total Amount', 'Status', 'E-Way Bill'];
    const rows = orders.map(o => [
      o.id,
      o.client_name,
      o.product_name,
      o.quantity || 0,
      o.rate || 0,
      o.total_amount || 0,
      o.status,
      o.e_way_bill || 'N/A'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `B2B_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOrdersJSON = () => {
    if (orders.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(orders, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `B2B_Orders_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInvoicesCSV = () => {
    if (invoices.length === 0) return;
    const headers = ['Invoice ID', 'Invoice No', 'Client Name', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Amount', 'Due Date', 'Status'];
    const rows = invoices.map(i => [
      i.id,
      i.invoice_no,
      i.client_name,
      i.taxable_amount || 0,
      i.cgst || 0,
      i.sgst || 0,
      i.igst || 0,
      i.total_amount || 0,
      i.due_date,
      i.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `B2B_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportInvoicesJSON = () => {
    if (invoices.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(invoices, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `B2B_Invoices_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLedgersCSV = () => {
    if (ledgers.length === 0) return;
    const headers = ['Ledger ID', 'Client Name', 'Description', 'Amount', 'Type', 'Date'];
    const rows = ledgers.map(l => {
      const cl = clients.find(c => c.id == l.client_id);
      return [
        l.id,
        cl?.business_name || 'General',
        l.description,
        l.amount || 0,
        l.type,
        l.created_at
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `B2B_Ledgers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLedgersJSON = () => {
    if (ledgers.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(ledgers, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `B2B_Ledgers_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================================
  // FORM SUBMISSION HANDLERS
  // ============================================================================

  // 1. Create New EPC Client (Buyer)
  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/b2b/clients', {
        method: 'POST',
        body: JSON.stringify(clientForm)
      });
      setClientModalOpen(false);
      setClientForm({ business_name: '', gstin: '', contact: '', phone: '', state: 'Rajasthan', credit_limit: '500000' });
      fetchData();
    } catch (err) {
      alert(`Onboarding failed: ${err.message}`);
    }
  };

  // 2. Create New Vendor (Supplier)
  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/b2b/vendors', {
        method: 'POST',
        body: JSON.stringify(vendorForm)
      });
      setVendorModalOpen(false);
      setVendorForm({ name: '', gstin: '', contact: '', phone: '', credit_balance: '0' });
      fetchData();
    } catch (err) {
      alert(`Failed to add vendor: ${err.message}`);
    }
  };

  // 3. Create New Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/b2b/price-list', {
        method: 'POST',
        body: JSON.stringify(productForm)
      });
      setProductModalOpen(false);
      setProductForm({ product_name: '', rate: '', category: 'Panels', stock_level: '0', reorder_level: '20' });
      fetchData();
    } catch (err) {
      alert(`Failed to create product: ${err.message}`);
    }
  };

  // 4. Create New Order (Sales Quote)
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const prod = products.find(p => p.id == orderForm.product_id);
      const payload = {
        ...orderForm,
        rate: parseFloat(orderForm.rate) || prod?.rate
      };
      await apiCall('/b2b/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setOrderModalOpen(false);
      setOrderForm(prev => ({ ...prev, quantity: '10', rate: '' }));
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Record Manual Stock In Purchase
  const handleRecordStockIn = async (e) => {
    e.preventDefault();
    try {
      const prod = products.find(p => p.id == stockInForm.product_id);
      const payload = {
        ...stockInForm,
        rate: parseFloat(stockInForm.rate) || prod?.rate
      };
      await apiCall('/b2b/stock-in-manual', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setStockInModalOpen(false);
      setStockInForm(prev => ({ ...prev, quantity: '100', rate: '' }));
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 6. Record Manual Payment Receipt
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/b2b/payments-manual', {
        method: 'POST',
        body: JSON.stringify(paymentForm)
      });
      setPaymentModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================================
  // WORKFLOW ACTION BUTTONS
  // ============================================================================

  // Approve pending order (Owner action)
  const handleApproveOrder = async (orderId) => {
    try {
      await apiCall(`/b2b/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Confirmed' })
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Trigger Dispatch Modal
  const openDispatchModal = (orderId) => {
    setDispatchForm({ order_id: orderId, partner: 'Porter', tracking_no: `PRT-${Math.floor(1000 + Math.random() * 9000)}-DEL`, eway_bill: '' });
    setDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/b2b/orders/${dispatchForm.order_id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          booking_id: dispatchForm.tracking_no, 
          status: 'Dispatched',
          logistics_partner: dispatchForm.partner,
          e_way_bill: dispatchForm.eway_bill 
        })
      });
      setDispatchModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Confirm Delivery
  const handleConfirmDelivery = async (orderId) => {
    try {
      await apiCall(`/b2b/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Delivered' })
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Reject order
  const handleRejectOrder = async (orderId) => {
    if (!confirm('Are you sure you want to reject this quote request?')) return;
    try {
      await apiCall(`/b2b/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Rejected' })
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Save new overridden rate
  const handleSaveCustomRate = async (e) => {
    e.preventDefault();
    if (!selectedOrderForRate) return;
    try {
      await apiCall(`/b2b/orders/${selectedOrderForRate.id}`, {
        method: 'PUT',
        body: JSON.stringify({ rate: parseFloat(customRate), status: 'Confirmed' })
      });
      setChangeRateModalOpen(false);
      setSelectedOrderForRate(null);
      setCustomRate('');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const triggerChangeRate = (order) => {
    setSelectedOrderForRate(order);
    setCustomRate(order.rate.toString());
    setChangeRateModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* Tab Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">B2B Dealer Module</h2>
          <p className="text-[10px] text-slate-500">Manage Luminous panel stock, EPC clients, vendor invoices, orders, ledgers, and E-Way bills</p>
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
                if (activeTab === 'clients') handleExportClientsCSV();
                else if (activeTab === 'vendors') handleExportVendorsCSV();
                else if (activeTab === 'inventory') handleExportProductsCSV();
                else if (activeTab === 'orders') handleExportOrdersCSV();
                else if (activeTab === 'invoices') {
                  handleExportInvoicesCSV();
                  handleExportLedgersCSV();
                }
              }}
              className="px-2 py-1.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/10 rounded flex items-center gap-1 transition"
              title="Export active sheet as CSV"
            >
              <Download size={12} /> CSV
            </button>
            <button
              onClick={() => {
                if (activeTab === 'clients') handleExportClientsJSON();
                else if (activeTab === 'vendors') handleExportVendorsJSON();
                else if (activeTab === 'inventory') handleExportProductsJSON();
                else if (activeTab === 'orders') handleExportOrdersJSON();
                else if (activeTab === 'invoices') {
                  handleExportInvoicesJSON();
                  handleExportLedgersJSON();
                }
              }}
              className="px-2 py-1.5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/10 rounded flex items-center gap-1 transition"
              title="Export active sheet as JSON"
            >
              <Download size={12} /> JSON
            </button>
          </div>

          <button
            onClick={() => setClientModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/10"
          >
            <Plus size={13} /> Onboard EPC Client
          </button>
          <button
            onClick={() => setStockInModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/10"
          >
            <Package size={13} /> Record Stock In
          </button>
        </div>
      </div>

      {/* KPI Stats widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">₹{stats.totalSales?.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">Total B2B Billing Turnover</p>
          </div>
        </div>
        <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <ShoppingCart size={16} className="text-violet-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{stats.activeOrders}</p>
            <p className="text-[10px] text-slate-500">Active B2B Orders</p>
          </div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <CreditCard size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">₹{stats.outstandingDues?.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-500">Outstanding EPC Balances</p>
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Users size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{stats.totalClients}</p>
            <p className="text-[10px] text-slate-500">Onboarded Clients</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-1.5 bg-slate-900/40 backdrop-blur-sm rounded-xl p-1.5 border border-slate-800/60">
        {B2B_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? `bg-${tab.color}-500/10 text-${tab.color}-400 border border-${tab.color}-500/20 shadow-lg shadow-${tab.color}-500/5`
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left main pane (9 cols) */}
        <div className="xl:col-span-9 space-y-6">

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by legal name, GSTIN, product or city..."
              className="w-full bg-slate-900/50 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
            />
          </div>

          {/* ==================== TAB 1: EPC CLIENTS (BUYERS) ==================== */}
          {activeTab === 'clients' && (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">EPC Client Database</h3>
                <span className="text-[10px] text-slate-500">Authorized Dealerships purchasing panels &amp; inverters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.filter(c => 
                  c.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.contact.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(client => (
                  <div key={client.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-3 relative overflow-hidden">
                    {client.defaulter_status === 'Yes' && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[8px] font-bold text-rose-400 uppercase animate-pulse">
                        <AlertTriangle size={9} /> Defaulter
                      </div>
                    )}
                    
                    <div>
                      <span className="text-xs font-bold text-white block truncate">{client.business_name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">GSTIN: {client.gstin}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div>
                        <span className="text-slate-500 block">Contact Person:</span>
                        <span className="text-slate-350 font-medium">{client.contact}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Dues Balance:</span>
                        <span className={`font-bold ${client.pending_dues > 100000 ? 'text-rose-400' : 'text-slate-300'}`}>
                          ₹{client.pending_dues?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Credit Limit:</span>
                        <span className="text-indigo-400 font-semibold">₹{client.credit_limit?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Phone:</span>
                        <span className="text-slate-300 font-mono">{client.phone}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900/60 flex justify-between items-center text-[9px] text-slate-500">
                      <span className="font-bold uppercase tracking-wider">{client.state}</span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const nextDef = client.defaulter_status === 'Yes' ? 'No' : 'Yes';
                            apiCall(`/b2b/clients/${client.id}`, {
                              method: 'PUT',
                              body: JSON.stringify({ defaulter_status: nextDef })
                            }).then(fetchData);
                          }}
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10 transition"
                        >
                          Defaulter Flag
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== TAB 2: VENDORS & SUPPLIERS ==================== */}
          {activeTab === 'vendors' && (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Manufacturer Vendors &amp; Partners</h3>
                <button
                  onClick={() => setVendorModalOpen(true)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                >
                  + Add Vendor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())).map(vendor => (
                  <div key={vendor.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-3 relative overflow-hidden">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">{vendor.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">GSTIN: {vendor.gstin}</span>
                    </div>

                    <div className="space-y-1.5 text-[10px] pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact:</span>
                        <span className="text-slate-300">{vendor.contact}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Phone:</span>
                        <span className="text-slate-300 font-mono">{vendor.phone}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-900/40">
                        <span className="text-slate-500">Outstanding Balance to Pay:</span>
                        <span className="text-rose-400 font-bold">₹{vendor.credit_balance?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== TAB 3: PRODUCTS & STOCK ==================== */}
          {activeTab === 'inventory' && (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Inventory &amp; Stock Levels</h3>
                <button
                  onClick={() => setProductModalOpen(true)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                >
                  + Add Product
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.filter(p => p.product_name.toLowerCase().includes(searchTerm.toLowerCase())).map(prod => {
                  const isLow = prod.stock_level <= prod.reorder_level;
                  return (
                    <div key={prod.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
                      {isLow && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose-500 animate-pulse" />
                      )}
                      
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-white block">{prod.product_name}</span>
                        <div className="flex gap-2">
                          <span className="text-[9px] text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-850 uppercase">{prod.category}</span>
                          <span className="text-[9px] text-slate-400 font-mono font-bold">List Rate: ₹{prod.rate?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Stock Level</span>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={`text-sm font-extrabold font-mono ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {prod.stock_level}
                          </span>
                          {isLow && (
                            <AlertTriangle size={11} className="text-rose-500 animate-pulse" title="Critical Low Stock!" />
                          )}
                        </div>
                        <span className="text-[8px] text-slate-500 block font-mono">Min limit: {prod.reorder_level}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== TAB 4: ORDERS & QUOTES ==================== */}
          {activeTab === 'orders' && (
            <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quotations &amp; Order Pipeline</h3>
                <button
                  onClick={() => setOrderModalOpen(true)}
                  className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
                >
                  + Create Quote
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Rate</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">GST Invoice / E-way</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-350">
                    {orders.filter(o => 
                      o.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      o.product_name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(order => {
                      const client = clients.find(c => c.id == order.client_id);
                      const isDefaulter = client?.defaulter_status === 'Yes';
                      
                      return (
                        <tr key={order.id} className="hover:bg-slate-800/10">
                          <td className="py-3 px-3 font-mono font-bold text-white">#{order.id}</td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-white block">{order.client_name}</span>
                            <span className="text-[9px] text-slate-500">{client?.state || 'India'}</span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-350">{order.product_name}</td>
                          <td className="py-3 px-3 font-mono">{order.quantity}</td>
                          <td className="py-3 px-3 font-mono">₹{order.rate?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono font-bold text-white">₹{order.total_amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {invoices.find(i => i.order_id == order.id)?.invoice_no || 'Awaiting Confirmation'}
                              </span>
                              {order.e_way_bill && (
                                <span className="text-[9px] text-cyan-400 font-mono block">EWB: {order.e_way_bill}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={
                              order.status === 'Delivered' ? 'success' :
                              order.status === 'Confirmed' ? 'info' :
                              order.status === 'Dispatched' ? 'warning' : 'danger'
                            }>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {order.status === 'Pending Owner Approval' && (
                                <>
                                  {isDefaulter && (
                                    <AlertTriangle size={12} className="text-rose-500 animate-pulse" title="Defaulter Warning!" />
                                  )}
                                  <button
                                    onClick={() => handleApproveOrder(order.id)}
                                    className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-600 hover:text-white transition text-[9px] font-bold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => triggerChangeRate(order)}
                                    className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded hover:bg-indigo-600 hover:text-white transition text-[9px] font-bold"
                                  >
                                    Change
                                  </button>
                                  <button
                                    onClick={() => handleRejectOrder(order.id)}
                                    className="px-2 py-0.5 bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded hover:bg-rose-600 hover:text-white transition text-[9px] font-bold"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {order.status === 'Confirmed' && (
                                <button
                                  onClick={() => openDispatchModal(order.id)}
                                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[9px] font-bold flex items-center gap-1 transition"
                                >
                                  <Truck size={10} /> Dispatch
                                </button>
                              )}
                              <button
                                onClick={() => openDocument('pi', order)}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[9px] font-bold flex items-center gap-1 transition"
                                title="Print Proforma Invoice"
                              >
                                <Printer size={10} /> PI
                              </button>
                              {order.status === 'Dispatched' && (
                                <button
                                  onClick={() => handleConfirmDelivery(order.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold flex items-center gap-1 transition"
                                >
                                  <CheckCircle size={10} /> Delivered
                                </button>
                              )}
                              {order.status === 'Delivered' && (
                                <span className="text-[10px] text-emerald-500 font-semibold flex items-center justify-end gap-1"><CheckCircle size={10} /> Completed</span>
                              )}
                              {order.status === 'Rejected' && (
                                <span className="text-[10px] text-rose-500 font-semibold">Rejected</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================== TAB 5: INVOICES & LEDGERS ==================== */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              
              {/* Manual payment capture box */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Record Client Payment</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Manually clear unpaid EPC dealer invoices and update ledgers</p>
                  </div>
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                  >
                    Record Payment Receipt
                  </button>
                </div>
              </div>

              {/* Invoices list */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800/60 pb-2">Sales Tax Invoices</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Taxable Value</th>
                        <th className="py-2.5 px-3">CGST / SGST</th>
                        <th className="py-2.5 px-3">IGST</th>
                        <th className="py-2.5 px-3">Total Amount</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-350">
                      {invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-800/10">
                          <td className="py-3 px-3 font-mono font-bold text-white">{inv.invoice_no}</td>
                          <td className="py-3 px-3 text-white font-medium">{inv.client_name}</td>
                          <td className="py-3 px-3 font-mono">₹{inv.taxable_amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">₹{inv.cgst?.toLocaleString('en-IN')} / ₹{inv.sgst?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">₹{inv.igst?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono font-bold text-white">₹{inv.total_amount?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{inv.due_date}</td>
                          <td className="py-3 px-3 text-right flex justify-end gap-2 items-center">
                            <Badge variant={inv.status === 'Paid' ? 'success' : 'warning'}>
                              {inv.status}
                            </Badge>
                            <button
                              onClick={() => openDocument('invoice', inv)}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-bold flex items-center gap-1 transition"
                            >
                              <Printer size={10} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ledgers transactions */}
              <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 p-5 shadow-2xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800/60 pb-2">Dealership Ledgers Transaction History</h3>
                
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Transaction Description</th>
                        <th className="py-2.5 px-3">Credit (Added)</th>
                        <th className="py-2.5 px-3 text-right">Debit (Cleared)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-350">
                      {ledgers.map(led => {
                        const cl = clients.find(c => c.id == led.client_id);
                        return (
                          <tr key={led.id} className="hover:bg-slate-850/10 text-[10px]">
                            <td className="py-2.5 px-3 text-slate-500">{new Date(led.created_at).toLocaleString('en-IN')}</td>
                            <td className="py-2.5 px-3 font-sans text-xs text-white">{cl?.business_name || 'General'}</td>
                            <td className="py-2.5 px-3 font-sans text-slate-300">{led.description}</td>
                            <td className="py-2.5 px-3 text-rose-400 font-bold">{led.type === 'Credit' ? `+₹${led.amount?.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="py-2.5 px-3 text-emerald-400 font-bold text-right">{led.type === 'Debit' ? `-₹${led.amount?.toLocaleString('en-IN')}` : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right side panel (3 cols) */}
        <div className="xl:col-span-3 xl:sticky xl:top-8 bg-slate-900/30 backdrop-blur-md rounded-xl p-5 border border-slate-800/80">
          <AIInsights module="b2b" />
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Modal 1: Onboard EPC Client */}
      <Modal isOpen={clientModalOpen} onClose={() => setClientModalOpen(false)} title="Onboard New Dealership Client">
        <form onSubmit={handleCreateClient} className="p-6 space-y-4">
          <Input label="Business Legal Name" placeholder="e.g. Bhushan Solar Systems (EPC)" value={clientForm.business_name} onChange={e => setClientForm(prev => ({ ...prev, business_name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="GSTIN Code" placeholder="08ABCDE1234F1Z5" value={clientForm.gstin} onChange={e => setClientForm(prev => ({ ...prev, gstin: e.target.value }))} required />
            <Select label="State Location" value={clientForm.state} onChange={e => setClientForm(prev => ({ ...prev, state: e.target.value }))} options={[
              { value: 'Rajasthan', label: 'Rajasthan (CGST+SGST)' },
              { value: 'Gujarat', label: 'Gujarat (IGST)' },
              { value: 'Delhi', label: 'Delhi (IGST)' },
              { value: 'Haryana', label: 'Haryana (IGST)' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Person" placeholder="Manoj Bhushan" value={clientForm.contact} onChange={e => setClientForm(prev => ({ ...prev, contact: e.target.value }))} required />
            <Input label="Phone Number" placeholder="9876543210" value={clientForm.phone} onChange={e => setClientForm(prev => ({ ...prev, phone: e.target.value }))} required />
          </div>
          <Input label="Credit Limit (₹)" type="number" placeholder="500000" value={clientForm.credit_limit} onChange={e => setClientForm(prev => ({ ...prev, credit_limit: e.target.value }))} />
          
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setClientModalOpen(false)}>Cancel</Button>
            <Button type="submit">Verify &amp; Onboard</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Supplier Vendor */}
      <Modal isOpen={vendorModalOpen} onClose={() => setVendorModalOpen(false)} title="Add Supplier Vendor">
        <form onSubmit={handleCreateVendor} className="p-6 space-y-4">
          <Input label="Vendor Company Name" placeholder="e.g. Luminous Power Technologies" value={vendorForm.name} onChange={e => setVendorForm(prev => ({ ...prev, name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="GSTIN Code" placeholder="06AAAAL9876M1Z0" value={vendorForm.gstin} onChange={e => setVendorForm(prev => ({ ...prev, gstin: e.target.value }))} required />
            <Input label="Phone" placeholder="18001033039" value={vendorForm.phone} onChange={e => setVendorForm(prev => ({ ...prev, phone: e.target.value }))} required />
          </div>
          <Input label="Contact Email" placeholder="info@luminous.com" value={vendorForm.contact} onChange={e => setVendorForm(prev => ({ ...prev, contact: e.target.value }))} required />
          
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Vendor</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Add Product Item */}
      <Modal isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} title="Create New Product Item">
        <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
          <Input label="Product Name" placeholder="e.g. Luminous Mono PERC 540W Panel" value={productForm.product_name} onChange={e => setProductForm(prev => ({ ...prev, product_name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit Price / Rate (₹)" type="number" placeholder="9200" value={productForm.rate} onChange={e => setProductForm(prev => ({ ...prev, rate: e.target.value }))} required />
            <Select label="Category" value={productForm.category} onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))} options={[
              { value: 'Panels', label: 'Solar Panels' },
              { value: 'Inverters', label: 'Inverters' },
              { value: 'Batteries', label: 'Batteries' },
              { value: 'Structures', label: 'Mounting Structures' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Initial Stock level" type="number" value={productForm.stock_level} onChange={e => setProductForm(prev => ({ ...prev, stock_level: e.target.value }))} />
            <Input label="Reorder Limit Level" type="number" value={productForm.reorder_level} onChange={e => setProductForm(prev => ({ ...prev, reorder_level: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setProductModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Create Manual Quotation / Order */}
      <Modal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} title="Generate Dealer Quotation / Order">
        <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
          <Select label="Select B2B EPC Buyer" value={orderForm.client_id} onChange={e => setOrderForm(prev => ({ ...prev, client_id: e.target.value }))} options={clients.map(c => ({ value: c.id, label: c.business_name }))} />
          <Select label="Select Product" value={orderForm.product_id} onChange={e => setOrderForm(prev => ({ ...prev, product_id: e.target.value }))} options={products.map(p => ({ value: p.id, label: `${p.product_name} (Stock: ${p.stock_level})` }))} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity (Units)" type="number" value={orderForm.quantity} onChange={e => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))} required />
            <Input label="Rate Override (₹ per unit)" type="number" value={orderForm.rate} placeholder="Leave blank to use default list rate" onChange={e => setOrderForm(prev => ({ ...prev, rate: e.target.value }))} />
          </div>
          <Input label="Delivery / Site Address" placeholder="Jaipur, Rajasthan, India" value={orderForm.delivery_address} onChange={e => setOrderForm(prev => ({ ...prev, delivery_address: e.target.value }))} />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setOrderModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create Quotation</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Record Manual Stock In */}
      <Modal isOpen={stockInModalOpen} onClose={() => setStockInModalOpen(false)} title="Record Manual Stock Purchase Receipt">
        <form onSubmit={handleRecordStockIn} className="p-6 space-y-4">
          <Select label="Select Vendor (Supplier)" value={stockInForm.vendor_id} onChange={e => setStockInForm(prev => ({ ...prev, vendor_id: e.target.value }))} options={vendors.map(v => ({ value: v.id, label: v.name }))} />
          <Select label="Product Item" value={stockInForm.product_id} onChange={e => setStockInForm(prev => ({ ...prev, product_id: e.target.value }))} options={products.map(p => ({ value: p.id, label: p.product_name }))} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Quantity Received" type="number" value={stockInForm.quantity} onChange={e => setStockInForm(prev => ({ ...prev, quantity: e.target.value }))} required />
            <Input label="Unit Cost Rate (₹)" type="number" value={stockInForm.rate} placeholder="Defaults to list price" onChange={e => setStockInForm(prev => ({ ...prev, rate: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setStockInModalOpen(false)}>Cancel</Button>
            <Button type="submit">Record Purchase Stock In</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 6: Record Manual Payment Receipt */}
      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Record Client Payment Receipt">
        <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
          <Select
            label="Select Invoice to Clear"
            value={paymentForm.invoice_id}
            onChange={e => setPaymentForm({ invoice_id: e.target.value })}
            options={[
              { value: '', label: 'Select Outstanding Invoice' },
              ...invoices.filter(i => i.status === 'Unpaid').map(i => ({ value: i.id, label: `${i.invoice_no} - ${i.client_name} (₹${i.total_amount})` }))
            ]}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button type="submit">Register Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 7: Change Rate Override */}
      <Modal isOpen={changeRateModalOpen} onClose={() => { setChangeRateModalOpen(false); setSelectedOrderForRate(null); }} title="Modify Quote Rate">
        <form onSubmit={handleSaveCustomRate} className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            You are overriding rate for {selectedOrderForRate?.client_name}. 
            Product: {selectedOrderForRate?.product_name} (Qty: {selectedOrderForRate?.quantity})
          </p>
          <Input label="Custom Rate (₹ per unit)" type="number" value={customRate} onChange={e => setCustomRate(e.target.value)} required />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => { setChangeRateModalOpen(false); setSelectedOrderForRate(null); }}>Cancel</Button>
            <Button type="submit">Confirm Updated Rate</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 8: Dispatch Order */}
      <Modal isOpen={dispatchModalOpen} onClose={() => setDispatchModalOpen(false)} title="Dispatch Order & Transport Details">
        <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4">
          <Select label="Logistics Partner" value={dispatchForm.partner} onChange={e => setDispatchForm({...dispatchForm, partner: e.target.value})}>
            <option value="Porter">Porter</option>
            <option value="Delhivery">Delhivery</option>
            <option value="VRL Logistics">VRL Logistics</option>
            <option value="Self Pickup">Self Pickup</option>
          </Select>
          <Input label="Tracking / LR Number" value={dispatchForm.tracking_no} onChange={e => setDispatchForm({...dispatchForm, tracking_no: e.target.value})} required />
          <Input label="E-Way Bill Number (Optional)" value={dispatchForm.eway_bill} onChange={e => setDispatchForm({...dispatchForm, eway_bill: e.target.value})} />
          
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setDispatchModalOpen(false)}>Cancel</Button>
            <Button type="submit">Confirm Dispatch</Button>
          </div>
        </form>
      </Modal>

      {/* Document Printer View */}
      {printModalOpen && (
        <DocumentPrinter 
          type={printType} 
          data={printData} 
          onClose={() => setPrintModalOpen(false)} 
        />
      )}

    </div>
  );
}
