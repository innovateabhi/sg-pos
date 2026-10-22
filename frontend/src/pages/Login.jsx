import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('owner@saffrongrill.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setError('');
    if (role === 'owner') {
      setEmail('owner@saffrongrill.com');
      setPassword('admin123');
    } else {
      setEmail('cashier@saffrongrill.com');
      setPassword('staff123');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] flex flex-col justify-center items-center px-4 py-8">
      {/* Background Ambience */}
      <div className="w-full max-w-md">
        
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#CF7C12] to-[#E99A24] items-center justify-center shadow-lg shadow-amber-500/25 mb-4">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Saffron Grill</h1>
          <p className="text-sm text-slate-600 mt-1">Restaurant Operations & POS System</p>
          <p className="text-xs text-amber-700 font-medium">IQ City & Bijra, Durgapur, West Bengal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl p-7 shadow-xl border border-slate-200/80">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your station</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your staff credentials to open POS register</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@saffrongrill.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#E99A24] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#E99A24] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#E99A24] hover:bg-[#CF7C12] text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Access POS Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Demo Logins (1-Click Fill)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('owner')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs text-slate-700 font-semibold transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Owner Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('cashier')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs text-slate-700 font-semibold transition cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Cashier Staff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Local Prototype by <span className="text-slate-600 font-semibold">Softrenix Technologies</span>
          </p>
        </div>
      </div>
    </div>
  );
}
