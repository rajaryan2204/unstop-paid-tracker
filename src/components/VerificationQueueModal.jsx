// src/components/VerificationQueueModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Download, 
  Phone, 
  PhoneCall, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { 
  getPaymentVerificationQueue, 
  setManualVerification 
} from '../utils/callStore';

export default function VerificationQueueModal({ 
  isOpen, 
  participants, 
  currentUser, 
  onClose, 
  onTriggerCall,
  onTriggerToast 
}) {
  const [filter, setFilter] = useState('ALL'); // ALL, VERIFIED_PAID, PENDING_SYNC, DEFAULTER
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const queue = getPaymentVerificationQueue(participants);

  const filtered = queue.filter(item => {
    if (filter !== 'ALL' && item.verificationState !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (item.participant.name || '').toLowerCase().includes(q);
      const matchEvent = (item.participant.event_name || '').toLowerCase().includes(q);
      const matchPhone = (item.participant.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchEvent && !matchPhone) return false;
    }
    return true;
  });

  const verifiedCount = queue.filter(q => q.verificationState === 'VERIFIED_PAID').length;
  const pendingCount = queue.filter(q => q.verificationState === 'PENDING_SYNC').length;
  const defaulterCount = queue.filter(q => q.verificationState === 'DEFAULTER').length;

  const handleManualAction = (participantId, status, reason) => {
    setManualVerification(participantId, status, currentUser, reason);
    if (onTriggerToast) {
      onTriggerToast({
        type: status === 'APPROVED' ? 'success' : 'error',
        message: `Payment status updated to ${status} for ID #${participantId}`
      });
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Participant ID', 'Candidate Name', 'Event', 'Phone', 'Claimed At', 'Elapsed Hours', 'Verification Status', 'Unstop Gateway Status', 'Last Caller'];
    const rows = filtered.map(item => [
      `"${item.participantId}"`,
      `"${item.participant.name || ''}"`,
      `"${item.participant.event_name || ''}"`,
      `"${item.participant.phone || ''}"`,
      `"${item.record.claimedAt || ''}"`,
      `"${item.elapsedHours} hrs"`,
      `"${item.stateLabel}"`,
      `"${item.isGatewayPaid ? 'Paid' : 'Unpaid'}"`,
      `"${item.record.history?.[0]?.callerName || 'Staff'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TechFEST_Payment_Verification_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-[#11141A] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#161A22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Payment Verification & Defaulter Desk</h3>
                {defaulterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    {defaulterCount} Defaulters Flagged
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cross-matches participant claimed payments against Unstop Gateway records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 border border-white/[0.08] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-3 border-b border-white/[0.08] bg-[#151922] divide-x divide-white/[0.06]">
          <button
            onClick={() => setFilter('VERIFIED_PAID')}
            className={`p-3 text-left transition-all ${filter === 'VERIFIED_PAID' ? 'bg-emerald-500/10' : 'hover:bg-white/[0.02]'}`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/80">Verified in Gateway</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{verifiedCount}</div>
          </button>

          <button
            onClick={() => setFilter('PENDING_SYNC')}
            className={`p-3 text-left transition-all ${filter === 'PENDING_SYNC' ? 'bg-amber-500/10' : 'hover:bg-white/[0.02]'}`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80">Pending Nightly Sync</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{pendingCount}</div>
          </button>

          <button
            onClick={() => setFilter('DEFAULTER')}
            className={`p-3 text-left transition-all ${filter === 'DEFAULTER' ? 'bg-rose-500/10' : 'hover:bg-white/[0.02]'}`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400/80">Defaulters (&gt;24h Unpaid)</div>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{defaulterCount}</div>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-[#11141A] border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, phone or event..."
              className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-emerald-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${filter === 'ALL' ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({queue.length})
            </button>
          </div>
        </div>

        {/* Queue Items Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No participants currently in this verification category.
            </div>
          ) : (
            filtered.map((item) => {
              const p = item.participant;
              const rec = item.record;
              const isDefaulter = item.verificationState === 'DEFAULTER';

              return (
                <div
                  key={item.participantId}
                  className={`p-4 rounded-xl border transition-all ${
                    isDefaulter
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-[#0B0D11] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isDefaulter ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {isDefaulter ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{p.name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${item.stateBadge}`}>
                            {item.stateLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {p.event_name} • Phone: <span className="font-mono text-slate-300">{p.phone || 'N/A'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-1">
                          Claimed by caller {item.elapsedHours} hrs ago ({rec.history?.[0]?.callerName || 'Staff'})
                        </p>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {p.phone && p.phone !== 'N/A' && (
                        <button
                          onClick={() => {
                            if (onTriggerCall) onTriggerCall(p);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all"
                          title="Call candidate to follow up"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Call Again</span>
                        </button>
                      )}

                      {currentUser?.role === 'super_admin' && (
                        <>
                          <button
                            onClick={() => handleManualAction(item.participantId, 'APPROVED', 'Verified by Admin')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-all"
                            title="Mark as Verified Manually"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleManualAction(item.participantId, 'REJECTED', 'Defaulter / Unpaid')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-medium transition-all"
                            title="Mark as Defaulter"
                          >
                            Flag Defaulter
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {rec.lastRemark && (
                    <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-xs text-slate-300">
                      <span className="text-slate-500 font-medium">Caller Note: </span>
                      {rec.lastRemark}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#161A22] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <span>{queue.length} claimed registrations tracked against Unstop</span>
          <span className="font-mono text-[11px] text-slate-500">Auto-matched every 2 hours via Cloud Sync</span>
        </div>

      </div>
    </div>
  );
}
