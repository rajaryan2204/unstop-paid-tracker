// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  LogIn, 
  Lock, 
  User, 
  Layers, 
  PhoneCall, 
  AlertCircle,
  Check,
  Crown
} from 'lucide-react';
import { OFFICIAL_ACCOUNTS, authenticateUser } from '../utils/auth';

export default function AuthModal({ 
  isOpen, 
  currentUser, 
  onClose, 
  onSelectUser 
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const res = authenticateUser(username, password);
    if (!res.success) {
      setError(res.error);
      return;
    }

    onSelectUser(res.user);
    onClose();
  };

  const handleQuickSelect = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
    // Auto-login on click
    onSelectUser(acc);
    onClose();
  };

  const admins = OFFICIAL_ACCOUNTS.filter(a => a.accountType === 'admin');
  const domains = OFFICIAL_ACCOUNTS.filter(a => a.accountType === 'domain');
  const ops = OFFICIAL_ACCOUNTS.filter(a => a.accountType === 'operations');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#11141A] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#161A22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">techFEST '26 Operations Portal Login</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                17 Official Logins • Central Desk, 13 Domain Heads & Calling Operations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Session Bar */}
        <div className="px-5 py-3 bg-[#151922] border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Active Session:</span>
            <span className="font-semibold text-white">{currentUser?.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-sky-500/30 bg-sky-500/10 text-sky-300">
              {currentUser?.title || currentUser?.role}
            </span>
          </div>

          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Authenticated
          </span>
        </div>

        {/* Main Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-6">
          
          {/* Credentials Login Form */}
          <form onSubmit={handleLogin} className="p-4 rounded-xl bg-[#0B0D11] border border-white/[0.08] space-y-3.5">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5 mb-1">
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Enter Organizer Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Username (Domain Name / ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. plexus, mechanica, raj, sagar"
                    className="w-full bg-[#151922] border border-white/[0.08] focus:border-sky-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. plexus@sliet"
                    className="w-full bg-[#151922] border border-white/[0.08] focus:border-sky-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Rule: password is <code className="text-slate-400 font-mono">&lt;username&gt;@sliet</code>
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
              >
                Sign In
              </button>
            </div>
          </form>

          {/* Quick Roster Selector (All 17 Logins) */}
          <div className="space-y-4">
            
            {/* 1. Super Admins */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> Central Desk Super Admins (2)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Master Full Access</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {admins.map(acc => {
                  const isActive = currentUser?.username === acc.username;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleQuickSelect(acc)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        isActive 
                          ? 'bg-purple-500/15 border-purple-500/40 ring-1 ring-purple-500/30' 
                          : 'bg-[#151922] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                          {acc.avatar}
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-white group-hover:text-purple-300 transition-colors">
                            {acc.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {acc.username} • {acc.password}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 13 Domain Heads */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 13 Technical Domain Heads (13)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Scoped to Domain Events Only</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {domains.map(acc => {
                  const isActive = currentUser?.username === acc.username;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleQuickSelect(acc)}
                      className={`p-2 rounded-xl border text-left transition-all group ${
                        isActive 
                          ? 'bg-sky-500/15 border-sky-500/40 ring-1 ring-sky-500/30' 
                          : 'bg-[#151922] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white group-hover:text-sky-300 transition-colors truncate">
                          {acc.domainName}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 px-1 py-0.2 rounded bg-white/[0.04]">
                          {acc.bay?.split('-')[1] || 'BAY'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {acc.username}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Operations & Calling Teams */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Calling & Operations Desks (2)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Participant Calling Focused</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ops.map(acc => {
                  const isActive = currentUser?.username === acc.username;
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleQuickSelect(acc)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        isActive 
                          ? 'bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30' 
                          : 'bg-[#151922] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center">
                          {acc.avatar}
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                            {acc.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {acc.username} • {acc.password}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
