// src/components/Header.jsx
import React from 'react';
import { 
  Zap, 
  RefreshCw, 
  Download, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Activity,
  Layers,
  FileText,
  Lock,
  Crown
} from 'lucide-react';
import { DOMAINS_DIRECTORY } from '../utils/auth';

export default function Header({ 
  onRefresh, 
  isRefreshing, 
  onOpenBookmarklet, 
  onOpenTokenHealth, 
  onOpenAuth,
  onOpenAuditLogs,
  onOpenVerificationQueue,
  onExportCSV,
  currentUser,
  selectedDomainOverride,
  onSelectDomainOverride,
  verificationCount = 0,
  theme,
  onToggleTheme,
  summary
}) {
  const lastSyncTime = summary?.last_synced_at 
    ? new Date(summary.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Active';

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isDomainHead = currentUser?.role === 'domain_head';

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand Identity & Domain Context */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400/25 to-blue-600/10 border border-sky-400/35 flex items-center justify-center text-sky-400 font-bold text-xs tracking-tight shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            TF
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-white tracking-tight">techFEST '26</span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 hidden sm:inline-block">
              {isDomainHead ? `${currentUser?.domainName} Desk` : 'Central Desk'}
            </span>
          </div>

          {/* Super Admin Domain Switcher Dropdown */}
          {isSuperAdmin && (
            <div className="hidden lg:flex items-center gap-1.5 ml-3 pl-3 border-l border-white/[0.08]">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={selectedDomainOverride || 'ALL'}
                onChange={(e) => onSelectDomainOverride(e.target.value)}
                className="bg-[#161A22] border border-white/[0.08] text-xs text-white rounded-lg px-2.5 py-1 outline-none font-medium focus:border-purple-500/50"
              >
                <option value="ALL">🌐 All 13 Domains (Master View)</option>
                {Object.values(DOMAINS_DIRECTORY).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.bay})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Operations Nav Links */}
          <div className="hidden md:flex items-center gap-1.5 ml-2">
            <button
              onClick={onOpenVerificationQueue}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all"
              title="Open Payment Verification & Defaulter Desk"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verification</span>
              {verificationCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-400 text-black">
                  {verificationCount}
                </span>
              )}
            </button>

            {/* Audit Trail for Super Admin / Calling */}
            <button
              onClick={onOpenAuditLogs}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/20 transition-all"
              title="Open Caller Activity & Access Audit Trail"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Right Tools & User Profile */}
        <div className="flex items-center gap-2">
          
          {/* Active User Switcher / Profile Badge */}
          <button
            onClick={onOpenAuth}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-left ${
              isSuperAdmin 
                ? 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50' 
                : 'bg-[#161A22] border-white/[0.08] hover:border-white/20'
            }`}
            title="Switch User Role or Login"
          >
            <span className="w-5 h-5 rounded-md bg-white/[0.08] flex items-center justify-center font-bold text-[10px] text-white">
              {currentUser?.avatar || 'SA'}
            </span>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-white leading-none truncate max-w-[120px] flex items-center gap-1">
                {isSuperAdmin && <Crown className="w-3 h-3 text-purple-400 shrink-0" />}
                <span>{currentUser?.name || 'Staff'}</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400 truncate max-w-[120px] mt-0.5">
                {currentUser?.username} • {currentUser?.title || 'Organizer'}
              </div>
            </div>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          {/* Autonomous Token Health Indicator */}
          <button
            onClick={onOpenTokenHealth}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-slate-300 bg-[#161A22] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            title="Click to view 24/7 Autonomous OAuth Token Health"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Auth: {summary?.auth_mode === 'automated_login' ? '24/7 Auto' : 'Active'}</span>
          </button>

          {/* Live Sync Timestamp Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lastSyncTime}</span>
          </div>

          {/* 1-Click Sync Trigger */}
          <button
            onClick={onOpenBookmarklet}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all"
            title="1-Click Unstop Browser Sync Tool"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>Sync</span>
          </button>

          {/* Force Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-md bg-[#161A22] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            title="Refresh Live Registrations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-md bg-[#161A22] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* CSV Export Button */}
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-gradient-to-r from-sky-500/20 to-blue-600/20 hover:from-sky-500/30 hover:to-blue-600/30 border border-sky-400/30 shadow-[0_0_15px_-3px_rgba(56,189,248,0.25)] transition-all"
            title="Export verified attendees to CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

        </div>
      </div>
    </header>
  );
}
