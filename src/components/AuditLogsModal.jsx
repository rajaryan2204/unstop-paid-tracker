// src/components/AuditLogsModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User, 
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { getAuditLogs } from '../utils/callStore';

export default function AuditLogsModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');

  if (!isOpen) return null;

  const logs = getAuditLogs();

  const filteredLogs = logs.filter((log) => {
    if (teamFilter !== 'ALL' && log.actorTeam !== teamFilter) return false;
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor = (log.actorName || '').toLowerCase().includes(q);
      const matchTarget = (log.targetName || '').toLowerCase().includes(q);
      const matchEvent = (log.eventName || '').toLowerCase().includes(q);
      const matchDetails = (log.details || '').toLowerCase().includes(q);
      if (!matchActor && !matchTarget && !matchEvent && !matchDetails) return false;
    }

    return true;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Actor Team', 'Action', 'Target ID', 'Target Name', 'Event', 'Previous Status', 'Next Status', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp || ''}"`,
      `"${l.actorName || ''}"`,
      `"${l.actorRole || ''}"`,
      `"${l.actorTeam || ''}"`,
      `"${l.action || ''}"`,
      `"${l.targetId || ''}"`,
      `"${l.targetName || ''}"`,
      `"${l.eventName || ''}"`,
      `"${l.prevStatus || ''}"`,
      `"${l.nextStatus || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TechFEST_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
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
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Central Operations Audit & Calling Trail</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete tamper-evident log of caller activities, status updates, and payment claims
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 border border-white/[0.08] transition-all"
              title="Download audit trail as CSV"
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

        {/* Filter Toolbar */}
        <div className="p-4 bg-[#151922] border-b border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, candidate, or remarks..."
              className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-purple-500/50 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
            >
              <option value="ALL">All Teams & Departments</option>
              <option value="Central Desk">Central Desk</option>
              <option value="Invitation Team">Invitation Team</option>
              <option value="Reception & Helpdesk">Reception & Helpdesk</option>
              <option value="Outreach Team">Outreach Team</option>
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
            >
              <option value="ALL">All Logged Actions</option>
              <option value="LOG_CALL">Call Logs (LOG_CALL)</option>
              <option value="VERIFY_PAYMENT">Payment Verifications</option>
            </select>
          </div>
        </div>

        {/* Logs Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No audit records match your search filters.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : '--';

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#0B0D11] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">
                        {log.actorName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {log.actorTeam || 'Desk'}
                      </span>
                      <span className="text-slate-500 text-xs">→</span>
                      <span className="font-medium text-xs text-sky-300">
                        {log.targetName}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate hidden md:inline">
                        ({log.eventName})
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {dateStr}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5">
                    {log.details}
                  </p>

                  {log.nextStatus && log.nextStatus !== 'NONE' && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono">
                      <span className="text-slate-500">{log.prevStatus || 'None'}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600" />
                      <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-200 border border-white/[0.08]">
                        {log.nextStatus}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#161A22] border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredLogs.length} verified operations audit events</span>
          <span className="font-mono text-[11px] text-slate-500">Immutable Audit Trail • SLIET TechFEST '26</span>
        </div>

      </div>
    </div>
  );
}
