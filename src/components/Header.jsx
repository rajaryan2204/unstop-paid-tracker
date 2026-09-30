import React from 'react';
import { 
  Zap, 
  RefreshCw, 
  Download, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

export default function Header({ 
  onRefresh, 
  isRefreshing, 
  onOpenBookmarklet, 
  onOpenTokenHealth, 
  onExportCSV,
  theme,
  onToggleTheme,
  summary
}) {
  const lastSyncTime = summary?.last_synced_at 
    ? new Date(summary.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Active';

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-white/[0.08] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400/25 to-blue-600/10 border border-sky-400/35 flex items-center justify-center text-sky-400 font-bold text-xs tracking-tight shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            TF
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm text-white tracking-tight">techFEST '26</span>
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 hidden sm:inline-block">
              Central Desk
            </span>
          </div>
        </div>

        {/* Right Tools & Actions */}
        <div className="flex items-center gap-2">
          
          {/* Autonomous Token Health Indicator */}
          <button
            onClick={onOpenTokenHealth}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-slate-300 bg-[#161A22] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
            title="Click to view 24/7 Autonomous OAuth Token Health"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Auth: {summary?.auth_mode === 'automated_login' ? '24/7 Auto' : 'Active'}</span>
          </button>

          {/* Live Sync Timestamp Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synced {lastSyncTime}</span>
          </div>

          {/* 1-Click Sync Trigger */}
          <button
            onClick={onOpenBookmarklet}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all"
            title="1-Click Unstop Browser Sync Tool"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>1-Click Sync</span>
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
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

        </div>
      </div>
    </header>
  );
}
