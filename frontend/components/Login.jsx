import { useState } from 'react';
import Card from './UI/Card';
import Input from './UI/Input';
import Button from './UI/Button';
import { Lock, User, Terminal } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      // Pass token and user details to parent
      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] p-4 font-sans text-slate-100">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Company Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-600/10">
            <Terminal size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Solar EPC Staff Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Internal Operations & Automation Dashboard</p>
        </div>

        {/* Login Form Card */}
        <Card className="border-indigo-500/10 shadow-indigo-500/5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-lg font-semibold text-white">Sign In</h2>
              <p className="text-xs text-slate-400">Authenticate to access your designation panel</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="relative">
                <Input
                  label="Username"
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-2"
                />
              </div>

              <div className="relative">
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-2"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              <Lock size={16} /> Sign In to Dashboard
            </Button>
          </form>
        </Card>

        {/* Demo Credentials Quick-Fill Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Local Demo Credentials</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => fillCredentials('owner', 'password123')}
              className="px-2 py-1.5 rounded bg-indigo-950/40 border border-indigo-900/60 hover:bg-indigo-900/40 text-[10px] font-medium text-slate-200 text-center transition"
            >
              Owner Role
            </button>
            <button
              onClick={() => fillCredentials('hr_user', 'password123')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-medium text-slate-200 text-center transition"
            >
              HR Role
            </button>
            <button
              onClick={() => fillCredentials('b2b_sales', 'password123')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-medium text-slate-200 text-center transition"
            >
              B2B Sales
            </button>
            <button
              onClick={() => fillCredentials('ops_user', 'password123')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-medium text-slate-200 text-center transition"
            >
              EPC Ops
            </button>
            <button
              onClick={() => fillCredentials('sales_user', 'password123')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] font-medium text-slate-200 text-center transition"
            >
              Sales Role
            </button>
          </div>
          <div className="text-[10px] text-slate-500 text-center">
            Password: <code className="text-slate-400">password123</code> (seeded in Postgres database)
          </div>
        </div>

      </div>
    </div>
  );
}
