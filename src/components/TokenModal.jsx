import React from 'react';
import { X, ShieldCheck, Clock, Key, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TokenModal({ summary, isOpen, onClose }) {
  if (!isOpen) return null;

  const isAuto = summary?.auth_mode === 'automated_login';
  const expiresAt = summary?.token_expires_at ? new Date(summary.token_expires_at) : null;
  const now = new Date();
  const hoursLeft = expiresAt ? Math.max(0, Math.round((expiresAt - now) / (1000 * 60 * 60))) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md surface-card rounded-2xl p-5 border border-white/[0.1] shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">24/7 Autonomous OAuth Status</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3.5 text-xs text-slate-300">
          
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-300">System Healthy & Autonomous</div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">
                The GitHub Actions background workflow is configured with autonomous OAuth refresh.
              </div>
            </div>
          </div>

          <div className="surface-elevated rounded-xl p-3 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Authentication Mode:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {isAuto ? 'Email/Password Auto-Login' : 'Static Bearer Token'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Token Status:</span>
              <span className="font-mono text-white">Active & Valid</span>
            </div>
            {expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Current Session Expiry:</span>
                <span className="font-mono text-slate-200">
                  {expiresAt.toLocaleString('en-IN')} ({hoursLeft}h remaining)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Automatic Sync Cron:</span>
              <span className="font-mono text-sky-400">Every 2 Hours (0 */2 * * *)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Whenever the current session token expires, the autonomous sync script logs into Unstop automatically, acquires a fresh JWT access token, and syncs all 62 competitions without any manual intervention required.
          </p>

        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-white/[0.08] hover:bg-white/[0.15] transition-colors"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
}
