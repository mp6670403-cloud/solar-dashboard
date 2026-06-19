/**
 * crm/LeadForm.jsx — Modal form for adding/editing CRM leads
 * 
 * Fields:
 * - name (text, required)
 * - phone (tel, required)
 * - email (email)
 * - source (dropdown: WhatsApp, Manual, Referral, Website)
 * - kw_capacity (number)
 * - monthly_bill (number)
 * - roof_area (number)
 * - notes (textarea)
 * 
 * Submits to POST /api/crm/leads (or PUT for editing existing lead).
 * Shows loading state and error handling.
 */

import { useState } from 'react';
import { apiCall } from '@/lib/api';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import { UserPlus, Edit } from 'lucide-react';

// Source options for the dropdown
const SOURCE_OPTIONS = [
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Manual',   label: 'Manual Entry' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Website',  label: 'Website' },
];

export default function LeadForm({ isOpen, onClose, onSuccess, editData = null }) {
  // Pre-fill form if editing an existing lead
  const [form, setForm] = useState({
    name:         editData?.name || '',
    phone:        editData?.phone || '',
    email:        editData?.email || '',
    source:       editData?.source || '',
    kw_capacity:  editData?.kw_capacity || '',
    monthly_bill: editData?.monthly_bill || '',
    roof_area:    editData?.roof_area || '',
    notes:        editData?.notes || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update form field
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = editData ? `/crm/leads/${editData.id}` : '/crm/leads';
      const method = editData ? 'PUT' : 'POST';

      await apiCall(endpoint, {
        method,
        body: JSON.stringify({
          ...form,
          kw_capacity:  form.kw_capacity ? Number(form.kw_capacity) : null,
          monthly_bill: form.monthly_bill ? Number(form.monthly_bill) : null,
          roof_area:    form.roof_area ? Number(form.roof_area) : null,
        }),
      });

      // Notify parent of success and close modal
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Lead' : 'Add New Lead'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Error message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Row 1: Name + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            id="name"
            placeholder="Enter full name"
            value={form.name}
            onChange={handleChange('name')}
            required
          />
          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            placeholder="9876543210"
            value={form.phone}
            onChange={handleChange('phone')}
            required
          />
        </div>

        {/* Row 2: Email + Source */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            id="email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={handleChange('email')}
          />
          <Select
            label="Lead Source"
            id="source"
            value={form.source}
            onChange={handleChange('source')}
            options={SOURCE_OPTIONS}
            placeholder="Select source..."
            required
          />
        </div>

        {/* Row 3: kW Capacity + Monthly Bill + Roof Area */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="kW Capacity"
            id="kw_capacity"
            type="number"
            placeholder="e.g. 10"
            value={form.kw_capacity}
            onChange={handleChange('kw_capacity')}
          />
          <Input
            label="Monthly Bill (₹)"
            id="monthly_bill"
            type="number"
            placeholder="e.g. 5000"
            value={form.monthly_bill}
            onChange={handleChange('monthly_bill')}
          />
          <Input
            label="Roof Area (sq ft)"
            id="roof_area"
            type="number"
            placeholder="e.g. 500"
            value={form.roof_area}
            onChange={handleChange('roof_area')}
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-slate-300 font-medium text-sm">Notes</label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Additional notes about this lead..."
            value={form.notes}
            onChange={handleChange('notes')}
            className="bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-900 transition-all duration-200 resize-none"
          />
        </div>

        {/* Submit button */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {editData ? <><Edit size={14} /> Update Lead</> : <><UserPlus size={14} /> Add Lead</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
