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

export default function Home() {
  const [authToken, setAuthToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    'Sales':      ['dashboard','crm','b2c_projects','employee_portal','settings'],
    'B2B Sales':  ['dashboard','b2b','inventory','settings'],
    'Operations': ['dashboard','projects','b2c_projects','settings'],
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
      case 'settings':
        return (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 max-w-2xl mx-auto space-y-6 text-xs animate-in fade-in duration-300">
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
                <span className="text-white block font-mono">Gemini-3.5-Flash (Integrated Simulator)</span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-6 flex justify-end">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition font-semibold"
              >
                Sign Out Session
              </button>
            </div>
          </div>
        );
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
