/**
 * payments/PaymentModule.jsx — Payments and Finance tracker module
 * 
 * Features:
 * - Stats: Outstanding collections, received collections, overdue count
 * - List of milestone invoices
 * - "Send WhatsApp Overdue Alert" button triggers n8n webhook placeholder
 * - Update payment status manually (Paid vs Pending)
 */

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/api';
import Badge from '../UI/Badge';
import Button from '../UI/Button';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import AIInsights from '../dashboard/AIInsights';
import {
  CreditCard,
  Send,
  RefreshCw,
  Search,
  IndianRupee,
  AlertCircle,
  Calendar,
  CheckCircle,
} from 'lucide-react';

const DEMO_PAYMENTS = [
  { id: 1, project_name: 'Bansal Residence 8kW Rooftop', customer_name: 'Kavita Bansal', customer_phone: '9876001234', amount: 144000, due_date: '2026-06-25', status: 'Pending', payment_stage: 'Site Survey Completed', transaction_reference: '' },
  { id: 2, project_name: 'Choudhary Factory 50kW Commercial', customer_name: 'Mahesh Choudhary', customer_phone: '9334455667', amount: 840000, due_date: '2026-06-15', status: 'Overdue', payment_stage: 'Material Mobilization', transaction_reference: '' },
  { id: 3, project_name: 'Mehta Group 100kW Industrial', customer_name: 'Sanjay Mehta', customer_phone: '9445566778', amount: 1100000, due_date: '2026-03-01', status: 'Paid', payment_stage: 'Site Survey Completed', transaction_reference: 'TXN849184910' },
  { id: 4, project_name: 'Mehta Group 100kW Industrial', customer_name: 'Sanjay Mehta', customer_phone: '9445566778', amount: 1650000, due_date: '2026-03-22', status: 'Paid', payment_stage: 'Panel Installation Completed', transaction_reference: 'TXN918491823' }
];

export default function PaymentModule() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Status edit states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [newStatus, setNewStatus] = useState('Paid');
  const [txnRef, setTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Send Reminder states
  const [sendingReminder, setSendingReminder] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('/payments');
      setPayments(data);
    } catch (err) {
      console.warn('API error, using demo payments:', err.message);
      setPayments(DEMO_PAYMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiCall(`/payments/${selectedPayment.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          transaction_reference: txnRef
        })
      });
      setEditModalOpen(false);
      setSelectedPayment(null);
      setTxnRef('');
      fetchPayments();
    } catch (err) {
      // offline simulation
      console.warn('Simulating payment update locally:', err.message);
      setPayments(prev => prev.map(p =>
        p.id === selectedPayment.id
          ? { ...p, status: newStatus, transaction_reference: txnRef }
          : p
      ));
      setEditModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = async (paymentId) => {
    setSendingReminder(paymentId);
    try {
      await apiCall(`/payments/${paymentId}/reminder`, {
        method: 'POST'
      });
      alert('WhatsApp reminder workflow dispatched via n8n integration!');
    } catch (err) {
      console.warn('Failed triggering n8n reminder, simulating:', err.message);
      alert('Simulated WhatsApp notification sent successfully to customer!');
    } finally {
      setSendingReminder(null);
    }
  };

  // Filter & Search
  const filteredPayments = payments.filter(p => {
    const custName = typeof p.customer_name === 'string' ? p.customer_name : String(p.customer_name || '');
    const projName = typeof p.project_name === 'string' ? p.project_name : String(p.project_name || '');
    return custName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           projName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Financial Stats
  const totalReceived = payments.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOutstanding = payments.filter(p => p.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'Overdue').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      
      {/* ── top financial stats cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 border-l-[3px] border-l-emerald-500 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <IndianRupee size={20} />
          </div>
          <div>
            <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Revenue Collected</h4>
            <div className="text-lg font-bold text-white mt-0.5">₹{totalReceived.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 border-l-[3px] border-l-amber-500 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <CreditCard size={20} />
          </div>
          <div>
            <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Outstanding Invoices</h4>
            <div className="text-lg font-bold text-white mt-0.5">₹{totalOutstanding.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 border-l-[3px] border-l-rose-500 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Overdue</h4>
            <div className="text-lg font-bold text-rose-400 mt-0.5">₹{totalOverdue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Payments Table Workspace (9 cols) */}
        <div className="xl:col-span-9 space-y-6">
          {/* ── Payments List Card ── */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search payments by client or site..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-850 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={fetchPayments}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 transition"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-850 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Customer / Project</th>
                    <th className="py-4 px-3">Billing Stage</th>
                    <th className="py-4 px-3 text-right">Invoiced Amount</th>
                    <th className="py-4 px-3">Due Date</th>
                    <th className="py-4 px-3">Status</th>
                    <th className="py-4 px-3">Transaction ID</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-xs text-slate-500">
                        Loading payment logs...
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-xs text-slate-500">
                        No payment invoices found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(pay => {
                      let statusVariant = 'neutral';
                      if (pay.status === 'Paid') statusVariant = 'success';
                      else if (pay.status === 'Pending') statusVariant = 'warning';
                      else if (pay.status === 'Overdue') statusVariant = 'danger';

                      return (
                        <tr key={pay.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-xs text-white">{pay.customer_name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{pay.project_name}</div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">{pay.customer_phone}</div>
                          </td>
                          <td className="py-4 px-3">
                            <span className="text-[10px] font-medium bg-indigo-950/50 text-indigo-400 border border-indigo-950 px-2 py-0.5 rounded">{pay.payment_stage}</span>
                          </td>
                          <td className="py-4 px-3 text-xs font-bold text-white text-right font-mono pr-6">₹{pay.amount.toLocaleString('en-IN')}</td>
                          <td className="py-4 px-3 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} />
                              <span>{pay.due_date}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <Badge variant={statusVariant} dot>
                              {pay.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-3 text-xs text-indigo-400 font-mono">{pay.transaction_reference || '-'}</td>
                          <td className="py-4 px-6 flex items-center justify-center gap-2">
                            <button
                              onClick={() => { setSelectedPayment(pay); setNewStatus(pay.status); setTxnRef(pay.transaction_reference || ''); setEditModalOpen(true); }}
                              className="px-2.5 py-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition text-[10px] font-semibold flex items-center gap-1"
                            >
                              <CheckCircle size={10} /> Update Status
                            </button>
                            {pay.status !== 'Paid' && (
                              <button
                                onClick={() => handleSendReminder(pay.id)}
                                disabled={sendingReminder === pay.id}
                                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white transition text-[10px] font-semibold flex items-center gap-1"
                              >
                                <Send size={10} /> {sendingReminder === pay.id ? 'Sending...' : 'WhatsApp Alert'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Payments AI Insights Sidebar (3 cols) */}
        <div className="xl:col-span-3 xl:sticky xl:top-8 bg-slate-900/30 backdrop-blur-md rounded-xl p-5 border border-slate-800/80">
          <AIInsights module="payments" />
        </div>
      </div>

      {/* ── Update Payment Status Modal ── */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Milestone Payment Status">
        {selectedPayment && (
          <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 text-xs space-y-1">
              <div><span className="text-slate-400">Invoice:</span> <span className="font-bold text-white">₹{selectedPayment.amount.toLocaleString('en-IN')}</span></div>
              <div><span className="text-slate-400">Milestone Stage:</span> <span className="text-indigo-400">{selectedPayment.payment_stage}</span></div>
              <div><span className="text-slate-400">Customer:</span> <span className="text-white">{selectedPayment.customer_name}</span></div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="payment_status" className="text-slate-300 font-medium text-sm">Payment Status</label>
              <select
                id="payment_status"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {newStatus === 'Paid' && (
              <Input
                label="Transaction ID / Payment Reference"
                id="txn_ref"
                placeholder="e.g. TXN91849184"
                value={txnRef}
                onChange={e => setTxnRef(e.target.value)}
                required
              />
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button variant="secondary" onClick={() => { setEditModalOpen(false); setSelectedPayment(null); }}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
