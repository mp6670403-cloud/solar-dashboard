import { useState } from 'react';
import Card from './UI/Card';
import Input from './UI/Input';
import Button from './UI/Button';
import { Play, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ActionCard({ action, onActionSuccess }) {
  const { action_name, payload_fields } = action;
  
  // Track form values dynamically
  const [formValues, setFormValues] = useState(
    payload_fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {})
  );
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' }); // 'success' or 'error'

  const handleInputChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear status when user starts modifying inputs
    if (status.type) {
      setStatus({ type: null, message: '' });
    }
  };

  const getPlaceholder = (field) => {
    const formatted = field.toLowerCase();
    if (formatted.includes('email')) return 'e.g. name@clientcompany.com';
    if (formatted.includes('name')) return 'e.g. Jane Doe';
    if (formatted.includes('id') || formatted.includes('code')) return 'e.g. SP-550-MONO';
    if (formatted.includes('quantity') || formatted.includes('amount')) return 'e.g. 50';
    if (formatted.includes('month')) return 'e.g. October 2026';
    return `Enter ${field.replace(/_/g, ' ')}`;
  };

  const getInputType = (field) => {
    const formatted = field.toLowerCase();
    if (formatted.includes('email')) return 'email';
    if (formatted.includes('quantity') || formatted.includes('level') || formatted.includes('price')) return 'number';
    return 'text';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('dashboard_token');

      const response = await fetch(`${apiBaseUrl}/actions/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actionName: action_name,
          payload: formValues
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger automation.');
      }

      setStatus({
        type: 'success',
        message: data.message || `Automation "${action_name}" triggered successfully!`
      });

      // Clear form inputs
      setFormValues(
        payload_fields.reduce((acc, field) => ({ ...acc, [field]: '' }), {})
      );

      // Trigger callback if provided (e.g. to reload logs table)
      if (onActionSuccess) {
        onActionSuccess();
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:border-slate-700 hover:shadow-indigo-500/2 transition duration-200">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-wide">{action_name}</h3>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-medium uppercase tracking-wider">
            n8n Webhook
          </span>
        </div>

        {/* Dynamic Fields */}
        <div className="flex flex-col gap-3">
          {payload_fields.map((field) => (
            <Input
              key={field}
              label={field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              id={field}
              type={getInputType(field)}
              placeholder={getPlaceholder(field)}
              value={formValues[field]}
              onChange={(e) => handleInputChange(field, e.target.value)}
              required
            />
          ))}
        </div>

        {/* Feedback Messages */}
        {status.type === 'success' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>{status.message}</span>
          </div>
        )}

        {status.type === 'error' && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{status.message}</span>
          </div>
        )}

        {/* Trigger Button */}
        <Button
          type="submit"
          loading={loading}
          className="w-full mt-2"
        >
          <Play size={14} fill="currentColor" /> Trigger Automation
        </Button>
      </form>
    </Card>
  );
}
