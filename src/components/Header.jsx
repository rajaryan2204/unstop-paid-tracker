// src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  RefreshCw, 
  Moon, 
  Sun, 
  ShieldCheck, 
  FileText, 
  KeyRound, 
  Zap, 
  LogOut, 
  Layers, 
  ChevronDown, 
  User, 
  Crown,
  Activity
} from 'lucide-react';
import { DOMAINS_DIRECTORY } from '../utils/auth';

export default function Header({ 
  currentUser,
  onRefresh, 
  isRefreshing, 
  onLogout,
  onOpenPasswordManager,
  onOpenAuditLogs,
  onOpenVerificationQueue,
  onOpenBookmarklet,
  onOpenTokenHealth,
  onExportCSV,
  selectedDomainOverride,
  onSelectDomainOverride,
  verificationCount = 0,
  theme,
  onToggleTheme,
  summary
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isDomainHead = currentUser?.role === 'domain_head';

  const lastSyncTime = summary?.last_synced_at 
    ? new Date(summary.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Live';

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        
        {/* Left: Brand Identity & Domain Scope */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400/25 to-blue-600/15 border border-sky-400/35 flex items-center justify-center text-sky-400 font-bold text-xs shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            TF
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight leading-none">
                techFEST '26
              </span>
              {isDomainHead && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-500/15 text-sky-300 border border-sky-500/25 shrink-0 truncate max-w-[120px] sm:max-w-none">
                  {currentUser?.domainName}
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-400 leading-none mt-0.5 truncate hidden sm:block">
              {isDomainHead ? `${currentUser?.bay} • Domain Operations` : 'Central Operations Desk'}
            </div>
          </div>

          {/* Super Admin Domain Switcher (Compact Dropdown) */}
          {isSuperAdmin && (
            <div className="hidden md:flex items-center gap-1.5 ml-2 pl-2 border-l border-white/[0.08]">
              <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <select
                value={selectedDomainOverride || 'ALL'}
                onChange={(e) => onSelectDomainOverride(e.target.value)}
                className="bg-[#161A22] border border-white/[0.08] text-xs text-white rounded-lg px-2.5 py-1 outline-none font-medium focus:border-purple-500/50 cursor-pointer max-w-[190px] truncate"
              >
                <option value="ALL">🌐 All 13 Domains (Master)</option>
                {Object.values(DOMAINS_DIRECTORY).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.bay})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Clean Restrained Controls (Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-lg bg-[#161A22] border border-white/[0.08] hover:border-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Live Registrations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* CSV Export Button (Compact on phone) */}
          <button
            onClick={onExportCSV}
            className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Super Admin Quick Verification Badge */}
          {isSuperAdmin && verificationCount > 0 && (
            <button
              onClick={onOpenVerificationQueue}
              className="h-8 px-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-medium transition-all flex items-center gap-1.5"
              title="Verification Queue"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Verify</span>
              <span className="w-4 h-4 rounded-full bg-emerald-400 text-black text-[10px] font-bold flex items-center justify-center">
                {verificationCount}
              </span>
            </button>
          )}

          {/* User Profile & Menu Dropdown (Replaces cluttered buttons) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-8 px-2 sm:px-2.5 rounded-lg bg-[#161A22] border border-white/[0.08] hover:border-white/20 text-white text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <span className="w-5 h-5 rounded-md bg-white/[0.08] text-sky-300 font-bold text-[10px] flex items-center justify-center">
                {currentUser?.avatar || 'TF'}
              </span>
              <span className="hidden sm:inline max-w-[110px] truncate font-semibold">
                {currentUser?.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Premium Slide Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#11141A] border border-white/[0.1] shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                
                {/* User Session Info */}
                <div className="px-3.5 py-2.5 border-b border-white/[0.06] bg-[#161A22]/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate">
                      {currentUser?.name}
                    </span>
                    {isSuperAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    ID: {currentUser?.username} • {currentUser?.teamName || 'Staff'}
                  </div>
                </div>

                {/* Operations Tools (Super Admin Only) */}
                {isSuperAdmin && (
                  <div className="py-1 border-b border-white/[0.06]">
                    
                    {/* Password Manager */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenPasswordManager();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2.5"
                    >
                      <KeyRound className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Password Manager (Domain Heads)</span>
                    </button>

                    {/* Audit Trail */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAuditLogs();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2.5"
                    >
                      <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Audit Trail & Activity Logs</span>
                    </button>

                    {/* Verification Queue */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenVerificationQueue();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Payment Verification Desk</span>
                      </div>
                      {verificationCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-400 text-black font-bold">
                          {verificationCount}
                        </span>
                      )}
                    </button>

                    {/* Unstop 1-Click Sync */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenBookmarklet();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2.5"
                    >
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>1-Click Unstop Sync Tool</span>
                    </button>

                    {/* Token Health */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenTokenHealth();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2.5"
                    >
                      <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>24/7 Autonomous Token Health</span>
                    </button>
                  </div>
                )}

                {/* Common Utilities */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      onToggleTheme();
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors flex items-center gap-2.5"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Switch to Light Theme</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Switch to Dark Theme</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Explicit Logout Button (In Red) */}
                <div className="pt-1 border-t border-white/[0.06]">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Log Out of Operations</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Quick Logout Button (Desktop only for 1-click convenience) */}
          <button
            onClick={onLogout}
            className="hidden sm:flex w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 items-center justify-center transition-all cursor-pointer"
            title="Log Out of Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </header>
  );
}
