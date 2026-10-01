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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  summary,
  neonStatus
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

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        
        {/* Left: Brand Identity & Domain Scope */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
            TF
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 tracking-tight leading-none">
                techFEST '26
              </span>
              {isDomainHead && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-sky-50 text-sky-700 border border-sky-200 shrink-0 truncate max-w-[120px] sm:max-w-none">
                  {currentUser?.domainName}
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-slate-500 leading-none mt-0.5 truncate hidden sm:block">
              {isDomainHead ? `${currentUser?.bay} • Domain Operations` : 'Central Operations Desk'}
            </div>
          </div>

          {/* Super Admin Domain Switcher */}
          {isSuperAdmin && (
            <div className="hidden md:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
              <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <select
                value={selectedDomainOverride || 'ALL'}
                onChange={(e) => onSelectDomainOverride(e.target.value)}
                className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1 outline-none font-medium focus:border-purple-500 cursor-pointer max-w-[190px] truncate shadow-xs"
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
          
          {/* Neon PostgreSQL Cloud Status Pill */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 shadow-xs"
            title={neonStatus?.isConnected ? `Neon PostgreSQL Connected (${neonStatus.lastSyncTime ? new Date(neonStatus.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live'})` : 'Connecting to Neon PostgreSQL...'}
          >
            <span className={`w-2 h-2 rounded-full ${neonStatus?.isSyncing ? 'bg-amber-400 animate-pulse' : (neonStatus?.isConnected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-400')}`} />
            <span className="hidden md:inline text-slate-500">DB:</span>
            <span className={`text-[10px] font-semibold ${neonStatus?.isConnected ? 'text-emerald-700' : 'text-slate-500'}`}>
              {neonStatus?.isSyncing ? 'Syncing...' : (neonStatus?.isConnected ? 'Neon Live' : 'Connecting')}
            </span>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="iconSm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-8 h-8 rounded-lg bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs"
            title="Refresh Live Registrations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
          </Button>

          {/* CSV Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="h-8 px-2.5 sm:px-3 text-xs bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-600 mr-1" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          {/* Super Admin Quick Verification Badge */}
          {isSuperAdmin && verificationCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenVerificationQueue}
              className="h-8 px-2.5 bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-medium shadow-xs"
              title="Verification Queue"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              <span className="hidden md:inline">Verify</span>
              <span className="w-4 h-4 ml-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {verificationCount}
              </span>
            </Button>
          )}

          {/* User Profile & Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-8 px-2 sm:px-2.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center">
                {currentUser?.avatar || 'TF'}
              </span>
              <span className="hidden sm:inline max-w-[110px] truncate font-semibold">
                {currentUser?.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                
                {/* User Session Info */}
                <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 truncate">
                      {currentUser?.name}
                    </span>
                    {isSuperAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                    ID: {currentUser?.username} • {currentUser?.teamName || 'Staff'}
                  </div>
                </div>

                {/* Operations Tools (Super Admin Only) */}
                {isSuperAdmin && (
                  <div className="py-1 border-b border-slate-100">
                    
                    {/* Password Manager */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenPasswordManager();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Password Manager (Domain Heads)</span>
                    </button>

                    {/* Audit Trail */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAuditLogs();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Audit Trail & Activity Logs</span>
                    </button>

                    {/* Verification Queue */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenVerificationQueue();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Payment Verification Desk</span>
                      </div>
                      {verificationCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-600 text-white font-bold">
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
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>1-Click Unstop Sync Tool</span>
                    </button>

                    {/* Token Health */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenTokenHealth();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Activity className="w-4 h-4 text-sky-600 shrink-0" />
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
                    className="w-full px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Switch to Light Theme</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Switch to Dark Theme</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Explicit Logout Button */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Log Out of Operations</span>
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={onLogout}
            className="hidden sm:flex w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Log Out of Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>
    </header>
  );
}
