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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    onSelectUser(acc);
    onClose();
  };

  const admins = OFFICIAL_ACCOUNTS.filter(a => a.accountType === 'admin');
  const webdevs = OFFICIAL_ACCOUNTS.filter(a => a.accountType === 'webdev');
  const domains = OFFICIAL_ACCOUNTS.filter(a => a.accountType === 'domain');
  const ops = OFFICIAL_ACCOUNTS.filter(a => a.accountType === 'operations');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">techFEST '26 Operations Portal Login</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                17 Official Logins • Central Desk, 13 Domain Heads & Calling Operations
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Session Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Active Session:</span>
            <span className="font-semibold text-slate-900">{currentUser?.name}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border border-sky-200 bg-sky-50 text-sky-700 font-medium">
              {currentUser?.title || currentUser?.role}
            </span>
          </div>

          <span className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Authenticated
          </span>
        </div>

        {/* Main Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-6 bg-slate-50/20">
          
          {/* Credentials Login Form */}
          <form onSubmit={handleLogin} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3.5 shadow-xs">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
              <LogIn className="w-3.5 h-3.5 text-sky-600" />
              <span>Enter Organizer Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Username (Domain Name / ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. plexus, mechanica, raj, sagar"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none font-mono shadow-xs"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. plexus@sliet"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none font-mono shadow-xs"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Initial password for all accounts: <code className="text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded font-semibold">Techfest@2026</code>
              </span>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
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
                <span className="text-[11px] font-mono uppercase tracking-wider text-purple-700 font-semibold flex items-center gap-1.5">
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
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group shadow-xs ${
                        isActive 
                          ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-100' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                          {acc.avatar}
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-purple-700 transition-colors">
                            {acc.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {acc.username} • {acc.password}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-purple-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 13 Domain Heads */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-700 font-semibold flex items-center gap-1.5">
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
                      className={`p-2.5 rounded-xl border text-left transition-all group shadow-xs ${
                        isActive 
                          ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                          {acc.domainName}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 px-1 py-0.2 rounded bg-slate-100 border border-slate-200">
                          {acc.bay?.split('-')[1] || 'BAY'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        {acc.username}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. WebDev Operations Editor */}
            {webdevs.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 font-semibold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Operations Record Editor (WebDev)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Participant Edit Access</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {webdevs.map(acc => {
                    const isActive = currentUser?.username === acc.username;
                    return (
                      <button
                        key={acc.username}
                        type="button"
                        onClick={() => handleQuickSelect(acc)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group shadow-xs ${
                          isActive 
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                            {acc.avatar}
                          </span>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 group-hover:text-amber-700 transition-colors">
                              {acc.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {acc.username}
                            </div>
                          </div>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-amber-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Operations & Calling Teams */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Calling & Operations Desks (1)
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
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group shadow-xs ${
                        isActive 
                          ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                          {acc.avatar}
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {acc.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {acc.username}
                          </div>
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
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
