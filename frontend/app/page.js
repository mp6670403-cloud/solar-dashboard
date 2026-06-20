'use client';

import { useState, useEffect } from 'react';
import Login from '../components/Login';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import OwnerDashboard from '../components/dashboard/OwnerDashboard';
import CRMModule from '../components/crm/CRMModule';
import ProjectModule from '../components/projects/ProjectModule';
import InventoryModule from '../components/inventory/InventoryModule';
import PaymentModule from '../components/payments/PaymentModule';
import AIChatWidget from '../components/dashboard/AIChatWidget';
import StaffTrackerModule from '../components/staff/StaffTrackerModule';
import B2BDealerModule from '../components/b2b/B2BDealerModule';
import B2CProjectModule from '../components/projects/B2CProjectModule';
import EmployeePortalModule from '../components/staff/EmployeePortalModule';
import { apiCall } from '../lib/api';

export default function Home() {
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // AI Settings State for settings override panel
  const [aiSettings, setAiSettings] = useState({
    surya_strategy_override: '',
    active_offers: '',
    sales_strategy: '',
    bot_whatsapp_number: '',
    owner_whatsapp_number: '',
    waha_api_url: '',
    waha_api_key: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);

  // 1. Authentication check and error suppression on mount
  useEffect(() => {
    // Suppress external browser extension rejections/errors (like MetaMask)
    const handleRejection = (event) => {
      const msg = event.reason?.message || String(event.reason || '');
      const stack = event.reason?.stack || '';
      if (
        msg.includes('MetaMask') || 
        msg.includes('extension') || 
        msg.includes('connect') ||
        stack.includes('chrome-extension')
      ) {
        event.preventDefault(); // Suppresses the Next.js dev overlay
      }
    };

    const handleError = (event) => {
      const msg = event.message || event.error?.message || '';
      const filename = event.filename || '';
      if (
        msg.includes('MetaMask') || 
        msg.includes('extension') || 
        filename.includes('chrome-extension') ||
        filename.includes('inpage.js')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    const token = localStorage.getItem('dashboard_token');
    const user = localStorage.getItem('dashboard_user');
    if (token && user) {
      setAuthToken(token);
      setCurrentUser(JSON.parse(user));
    }
    setCheckingAuth(false);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // AI Settings Fetching Hook (Owner Only)
  useEffect(() => {
    if (activeModule === 'settings' && currentUser?.designation === 'Owner') {
      const fetchAiSettings = async () => {
        setLoadingSettings(true);
        try {
          const data = await apiCall('/ai/settings');
          setAiSettings({
            surya_strategy_override: data.surya_strategy_override || '',
            active_offers: data.active_offers || '',
            sales_strategy: data.sales_strategy || '',
            bot_whatsapp_number: data.bot_whatsapp_number || '6386434561',
            owner_whatsapp_number: data.owner_whatsapp_number || '917052051010',
            waha_api_url: data.waha_api_url || 'http://localhost:3000',
            waha_api_key: data.waha_api_key || ''
          });
        } catch (err) {
          console.error('Failed to load AI settings:', err);
        } finally {
          setLoadingSettings(false);
        }
      };
      fetchAiSettings();
    }
  }, [activeModule, currentUser]);

  const handleSaveAllSettings = async () => {
    setSavingSettings(true);
    setSaveStatus('Saving all AI parameters...');
    try {
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'surya_strategy_override', value: aiSettings.surya_strategy_override })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'active_offers', value: aiSettings.active_offers })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'sales_strategy', value: aiSettings.sales_strategy })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'bot_whatsapp_number', value: aiSettings.bot_whatsapp_number })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'owner_whatsapp_number', value: aiSettings.owner_whatsapp_number })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'waha_api_url', value: aiSettings.waha_api_url })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'waha_api_key', value: aiSettings.waha_api_key })
      });
      setSaveStatus('All AI settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus(`Error saving: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // 2. Handle Login Success
  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('dashboard_token', token);
    localStorage.setItem('dashboard_user', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
    setActiveModule('dashboard');
  };

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('dashboard_token');
    localStorage.removeItem('dashboard_user');
    setAuthToken(null);
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Verifying security clearance...
      </div>
    );
  }

  if (!authToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Role-based module access control
  const ROLE_MODULE_ACCESS = {
    'Owner':      ['dashboard','crm','b2c_projects','projects','b2b','inventory','staff','employee_portal','payments','settings'],
    'HR':         ['dashboard','staff','employee_portal','settings'],
    'Sales Head':      ['dashboard','crm','b2c_projects','employee_portal','settings'],
    'B2B Sales':       ['dashboard','b2b','inventory','settings'],
    'Operations Head': ['dashboard','projects','b2c_projects','b2b','inventory','settings'],
  };

  // Render module component dynamically with access guard
  const renderModule = () => {
    const role = currentUser?.designation || 'Owner';
    const allowed = ROLE_MODULE_ACCESS[role] || ROLE_MODULE_ACCESS['Owner'];
    const moduleToRender = allowed.includes(activeModule) ? activeModule : 'dashboard';

    switch (moduleToRender) {
      case 'dashboard':
        return <OwnerDashboard user={currentUser} />;
      case 'crm':
        return <CRMModule user={currentUser} />;
      case 'projects':
        return <ProjectModule />;
      case 'b2c_projects':
        return <B2CProjectModule user={currentUser} />;
      case 'inventory':
        return <InventoryModule />;
      case 'payments':
        return <PaymentModule />;
      case 'staff':
        return <StaffTrackerModule user={currentUser} />;
      case 'employee_portal':
        return <EmployeePortalModule user={currentUser} />;
      case 'b2b':
        return <B2BDealerModule user={currentUser} />;
      case 'settings': {
        const isOwner = currentUser?.designation === 'Owner';
        return (
          <div className="space-y-6 max-w-4xl mx-auto text-xs animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: General System Settings */}
              <div className="md:col-span-1 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">System Settings</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Manage configuration credentials and integration layers</p>
                </div>
                
                <div className="space-y-4 border-t border-slate-800/80 pt-6">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold block">n8n Host URL:</span>
                    <code className="text-indigo-400 font-mono block bg-slate-950 p-2.5 rounded border border-slate-850">http://localhost:5678</code>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold block">API Base URL:</span>
                    <code className="text-indigo-400 font-mono block bg-slate-950 p-2.5 rounded border border-slate-850">http://localhost:5000/api</code>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold block">Designation Role:</span>
                    <span className="inline-block px-2.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">{currentUser?.designation}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-semibold block">AI Gateway Model:</span>
                    <span className="text-white block font-mono text-[10px]">Gemini-3.5-Flash (Integrated Simulator)</span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-6 flex justify-end">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition font-semibold text-center cursor-pointer"
                  >
                    Sign Out Session
                  </button>
                </div>
              </div>

              {/* Right Column: AI Strategy Overrides (Owner Only) */}
              <div className="md:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>AI Sales Agent Strategy &amp; Offers</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold">Owner Only</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Dynamically adjust the AI Surya Sales Agent's pitch guidelines, pricing strategy, and active customer discounts without code deployments.</p>
                </div>

                {isOwner ? (
                  <div className="space-y-4 border-t border-slate-800/80 pt-6">
                    {loadingSettings ? (
                      <div className="text-center py-12 text-slate-500">
                        Loading AI parameters...
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-slate-300 font-semibold block">
                            AI Surya Agent Strategy Override
                          </label>
                          <textarea
                            rows={3}
                            value={aiSettings.surya_strategy_override}
                            onChange={(e) => setAiSettings({ ...aiSettings, surya_strategy_override: e.target.value })}
                            placeholder="e.g. Pitch standard Helius Solar rates at ₹60,000 per kW. Highlight Lucknow location."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px] leading-relaxed"
                          />
                          <span className="text-[10px] text-slate-500 block">
                            This directly overrides or appends custom rules to the AI core sales strategy.
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-300 font-semibold block">
                            Active Offers &amp; Discounts
                          </label>
                          <textarea
                            rows={2}
                            value={aiSettings.active_offers}
                            onChange={(e) => setAiSettings({ ...aiSettings, active_offers: e.target.value })}
                            placeholder="e.g. Monsoon Offer: ₹5,000 cash discount on systems 5kW and above."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                          />
                          <span className="text-[10px] text-slate-500 block">
                            Special promotions that the AI agent is permitted to offer during lead generation.
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-slate-300 font-semibold block">
                            General Sales Pitch Strategy
                          </label>
                          <textarea
                            rows={2}
                            value={aiSettings.sales_strategy}
                            onChange={(e) => setAiSettings({ ...aiSettings, sales_strategy: e.target.value })}
                            placeholder="e.g. Focus on central subsidy of ₹78,000."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                          />
                          <span className="text-[10px] text-slate-500 block">
                            Broad context given to the agent for general solar Q&amp;A.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                          <div className="space-y-1.5">
                            <label className="text-slate-300 font-semibold block">
                              Bot WhatsApp Number (Waha Instance)
                            </label>
                            <input
                              type="text"
                              value={aiSettings.bot_whatsapp_number}
                              onChange={(e) => setAiSettings({ ...aiSettings, bot_whatsapp_number: e.target.value })}
                              placeholder="e.g. 6386434561"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-500 block">
                              Number linked with the Waha QR Code instance.
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-300 font-semibold block">
                              Owner WhatsApp Number (Alerts)
                            </label>
                            <input
                              type="text"
                              value={aiSettings.owner_whatsapp_number}
                              onChange={(e) => setAiSettings({ ...aiSettings, owner_whatsapp_number: e.target.value })}
                              placeholder="e.g. 917052051010"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-500 block">
                              Target phone number to receive instant administrative alerts.
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-300 font-semibold block">
                              Waha API URL (Server Endpoint)
                            </label>
                            <input
                              type="text"
                              value={aiSettings.waha_api_url}
                              onChange={(e) => setAiSettings({ ...aiSettings, waha_api_url: e.target.value })}
                              placeholder="e.g. http://localhost:3000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-500 block">
                              Endpoint URL where your WAHA service is hosted.
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-slate-300 font-semibold block">
                              Waha API Key (Security Token)
                            </label>
                            <input
                              type="password"
                              value={aiSettings.waha_api_key}
                              onChange={(e) => setAiSettings({ ...aiSettings, waha_api_key: e.target.value })}
                              placeholder="Optional - Enter Waha API Key if configured"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                            />
                            <span className="text-[10px] text-slate-500 block">
                              API Key token to authenticate with the WAHA server.
                            </span>
                          </div>
                        </div>

                        {saveStatus && (
                          <div className={`p-2.5 rounded border text-[10px] ${
                            saveStatus.includes('Error') 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {saveStatus}
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={handleSaveAllSettings}
                            disabled={savingSettings}
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                          >
                            {savingSettings ? 'Saving...' : 'Save AI Configuration'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-slate-800/80 pt-6 text-center py-12 text-slate-500">
                    Your current role does not have authorization to view or edit AI Strategy parameters. Contact Rajesh Gupta for clearance.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      default:
        return <OwnerDashboard user={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar navigation */}
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        user={currentUser}
        onLogout={handleLogout}
      />

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activeModule={activeModule} user={currentUser} />
        
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {renderModule()}
          </div>
        </main>
      </div>

      {/* Floating AI chatbot widget */}
      <AIChatWidget />
    </div>
  );
}
