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
import MobileAppPortal from '../components/staff/MobileAppPortal';
import { apiCall } from '../lib/api';

export default function Home() {
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // System Controller Panel States
  const [systemSettings, setSystemSettings] = useState({});
  const [settingSchemas, setSettingSchemas] = useState({});
  const [loadingController, setLoadingController] = useState(false);
  const [controllerPassword, setControllerPassword] = useState('');
  const [controllerSaveStatus, setControllerSaveStatus] = useState('');
  const [savingControllerKey, setSavingControllerKey] = useState(null);

  // AI Settings State (Legacy panel settings fallback)
  const [aiSettings, setAiSettings] = useState({
    surya_strategy_override: '',
    active_offers: '',
    sales_strategy: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);

  // 1. Authentication check on mount
  useEffect(() => {
    const handleRejection = (event) => {
      const msg = event.reason?.message || String(event.reason || '');
      const stack = event.reason?.stack || '';
      if (
        msg.includes('MetaMask') || 
        msg.includes('extension') || 
        msg.includes('connect') ||
        stack.includes('chrome-extension')
      ) {
        event.preventDefault();
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

  // Fetch Settings for Dynamic Controller / Legacy View
  useEffect(() => {
    if ((activeModule === 'settings' || activeModule === 'controller') && currentUser?.designation === 'Owner') {
      const fetchSettings = async () => {
        setLoadingController(true);
        setLoadingSettings(true);
        try {
          const res = await apiCall('/ai/settings');
          const data = res.settings || res;
          const schemas = res.schemas || {};
          
          setSystemSettings(data);
          setSettingSchemas(schemas);

          setAiSettings({
            surya_strategy_override: data.surya_strategy_override || '',
            active_offers: data.active_offers || '',
            sales_strategy: data.sales_strategy || ''
          });
        } catch (err) {
          console.error('Failed to load system configurations:', err);
        } finally {
          setLoadingController(false);
          setLoadingSettings(false);
        }
      };
      fetchSettings();
    }
  }, [activeModule, currentUser]);

  const handleSaveAllSettings = async () => {
    setSavingSettings(true);
    setSaveStatus('Saving parameters...');
    try {
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'surya_strategy_override', value: aiSettings.surya_strategy_override, password: 'admin123' })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'active_offers', value: aiSettings.active_offers, password: 'admin123' })
      });
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'sales_strategy', value: aiSettings.sales_strategy, password: 'admin123' })
      });
      setSaveStatus('AI strategy saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus(`Error saving: ${err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle single system parameter save in Controller Panel (Protected by Password check)
  const handleSaveControllerKey = async (key, val) => {
    if (!controllerPassword) {
      setControllerSaveStatus('Error: Enter the Controller Access Password first.');
      return;
    }
    setSavingControllerKey(key);
    setControllerSaveStatus('');
    try {
      await apiCall('/ai/settings', {
        method: 'POST',
        body: JSON.stringify({ key, value: val, password: controllerPassword })
      });
      // Refresh configurations state
      setSystemSettings(prev => ({ ...prev, [key]: val }));
      setControllerSaveStatus(`Saved config label: ${settingSchemas[key]?.label || key}`);
      setTimeout(() => setControllerSaveStatus(''), 3000);
    } catch (err) {
      setControllerSaveStatus(`Error saving ${key}: ${err.message}`);
    } finally {
      setSavingControllerKey(null);
    }
  };

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('dashboard_token', token);
    localStorage.setItem('dashboard_user', JSON.stringify(user));
    setAuthToken(token);
    setCurrentUser(user);
    setActiveModule('dashboard');
  };

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

  const ROLE_MODULE_ACCESS = {
    'Owner':      ['dashboard','crm','b2c_projects','projects','b2b','inventory','staff','employee_portal','payments','settings','controller','mobile_app'],
    'HR':         ['dashboard','staff','employee_portal','settings','mobile_app'],
    'Sales Head':      ['dashboard','crm','b2c_projects','employee_portal','settings','mobile_app'],
    'B2B Sales':       ['dashboard','b2b','inventory','settings','mobile_app'],
    'Operations Head': ['dashboard','projects','b2c_projects','b2b','inventory','settings','mobile_app'],
  };

  const renderModule = () => {
    const role = currentUser?.designation || 'Owner';
    const allowed = ROLE_MODULE_ACCESS[role] || ROLE_MODULE_ACCESS['Owner'];
    const moduleToRender = allowed.includes(activeModule) ? activeModule : 'dashboard';

    switch (moduleToRender) {
      case 'mobile_app':
        return <MobileAppPortal user={currentUser} />;
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
      
      // NEW SEGREGATED SYSTEM CONTROLLER VIEW (Owner Only)
      case 'controller': {
        const categories = {};
        Object.keys(settingSchemas).forEach(key => {
          const category = settingSchemas[key].category || "System Settings";
          if (!categories[category]) categories[category] = [];
          categories[category].push(key);
        });

        return (
          <div className="space-y-6 max-w-4xl mx-auto text-xs animate-in fade-in duration-300">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⚙️ Core System Controller Panel</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-bold">Security Lock</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Control live API keys, numbers, strategy prompt overrides, and endpoints dynamically without system reboots.</p>
                </div>
                {/* Secure Access Password Validation field */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium whitespace-nowrap">Access Key:</span>
                  <input
                    type="password"
                    placeholder="Enter Controller Lock"
                    value={controllerPassword}
                    onChange={(e) => setControllerPassword(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {controllerSaveStatus && (
                <div className={`p-2.5 rounded border text-[10px] ${
                  controllerSaveStatus.includes('Error') 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}>
                  {controllerSaveStatus}
                </div>
              )}

              {loadingController ? (
                <div className="text-center py-12 text-slate-500">Loading system configuration mapping...</div>
              ) : (
                <div className="space-y-6 border-t border-slate-800/80 pt-6">
                  {Object.keys(categories).map(catName => (
                    <div key={catName} className="space-y-4">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{catName}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories[catName].map(key => {
                          const schema = settingSchemas[key];
                          const value = systemSettings[key] || '';
                          return (
                            <div key={key} className="bg-slate-950/40 border border-slate-850 p-4 rounded-lg flex flex-col justify-between gap-3">
                              <div className="space-y-1">
                                <label className="text-slate-300 font-semibold block">{schema.label}</label>
                                <p className="text-[10px] text-slate-500 leading-normal">{schema.description}</p>
                                <span className="text-[9px] text-slate-600 font-mono block">DB KEY: {key}</span>
                              </div>
                              <div className="flex gap-2">
                                {key.includes('prompt') || key.includes('override') ? (
                                  <textarea
                                    rows={3}
                                    value={value}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, [key]: e.target.value })}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                                  />
                                ) : (
                                  <input
                                    type={key.includes('key') || key.includes('password') ? 'password' : 'text'}
                                    value={value}
                                    onChange={(e) => setSystemSettings({ ...systemSettings, [key]: e.target.value })}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                                  />
                                )}
                                <button
                                  onClick={() => handleSaveControllerKey(key, systemSettings[key])}
                                  disabled={savingControllerKey === key}
                                  className="px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition font-semibold flex items-center justify-center cursor-pointer"
                                >
                                  {savingControllerKey === key ? 'Saving' : 'Save'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

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
                            placeholder="e.g. Pitch standard SunCraft Power rates at ₹60,000 per kW. Highlight Lucknow location."
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
