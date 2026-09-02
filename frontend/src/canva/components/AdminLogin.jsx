import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';
import { authenticateAdmin } from '../utils/api.js';

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const admin = await authenticateAdmin(username, password);

      if (admin && admin.username) {
        setIsLoading(false);
        onLoginSuccess(admin);
      } else {
        setIsLoading(false);
        setError('Invalid username or password.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Server connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md glass-panel rounded-2xl sm:rounded-3xl border border-purple-500/40 p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-[0_0_80px_rgba(125,42,232,0.3)]">
        
        {/* Header */}
        <div className="text-center space-y-2.5 sm:space-y-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-pink-500 p-0.5 mx-auto shadow-lg">
            <div className="w-full h-full bg-[#0D0F1A] rounded-[14px] flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
          </div>

          <div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-white">Admin Authentication</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter secure admin credentials to access live store controller</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Username Field */}
          <div className="space-y-1 text-xs">
            <label className="block font-bold text-slate-300">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1 text-xs">
            <label className="block font-bold text-slate-300">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 pt-1 animate-pulse">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl btn-futuristic font-heading font-extrabold text-sm text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <span>{isLoading ? 'Authenticating...' : 'Login to Admin Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Back to storefront button */}
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Return to Customer Storefront
          </button>

        </form>

      </div>
    </div>
  );
}
