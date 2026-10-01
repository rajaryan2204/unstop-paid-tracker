// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { authenticateUser } from '../utils/auth';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = authenticateUser(username, password);
      if (!res.success) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(res.user);
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#0B0D11] text-[#F5F7FA] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden select-none">
      
      {/* Background Ambience Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400/25 to-blue-600/15 border border-sky-400/30 flex items-center justify-center text-sky-400 font-bold text-lg mx-auto shadow-[0_0_20px_rgba(56,189,248,0.25)] mb-3">
            TF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            techFEST '26
          </h1>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">
            Central Organizer Operations Desk
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Enter your designated domain or staff credentials to access your operations dashboard.
          </p>
        </div>

        {/* Credentials Form Box */}
        <div className="bg-[#11141A] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field 1: Username */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Username / Domain ID</span>
                <span className="text-[10px] font-mono text-slate-500">e.g. plexus, mechanica, raj, sagar</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter domain name or staff ID"
                  className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/50 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] font-mono text-slate-500">Official Passkey</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/50 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Submit Button (Thumb-friendly 48px height for phones) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password.trim()}
                className="w-full h-12 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Operations'}</span>
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

          </form>

          {/* Discreet Help Notice */}
          <div className="mt-5 pt-4 border-t border-white/[0.06] text-center space-y-1">
            <p className="text-[11px] text-slate-400">
              Domain Heads use your assigned domain identifier.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              For password reset or access assistance, contact Central Desk (Raj / Sagar).
            </p>
          </div>

        </div>

        {/* Security Footnote */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SLIET Longowal • Official Unstop Operations Desk</span>
        </div>

      </div>

    </div>
  );
}
