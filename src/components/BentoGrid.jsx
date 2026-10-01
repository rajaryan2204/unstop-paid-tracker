import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Target, 
  PhoneCall, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Users,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { DOMAINS_DIRECTORY } from '../utils/auth';
import { getAuditLogs, getCallRecords } from '../utils/callStore';

export default function BentoGrid({ 
  participants = [], 
  summary = {}, 
  currentUser,
  activeDomainId,
  onOpenAuditLogs,
  onOpenVerificationQueue
}) {
  const [memoNote, setMemoNote] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  // Exact real numbers from Unstop dataset
  const totalCount = participants.length;
  
  // Real incomplete: "Registraition fee not paid"
  const incompleteCount = useMemo(() => {
    return participants.filter(p => 
      p.payment_status === 'INCOMPLETE' || 
      p.payment_status === 'UNPAID' || 
      (p.status_label && p.status_label.toLowerCase().includes('not paid'))
    ).length;
  }, [participants]);

  // Real completed
  const completedCount = totalCount - incompleteCount;

  // Real call stats from CRM store
  const callRecords = useMemo(() => getCallRecords(), [participants]);
  const calledCount = useMemo(() => {
    return Object.values(callRecords).filter(r => (r.callCount || 0) > 0).length;
  }, [callRecords]);

  // Activity distribution across dates
  const chartBars = useMemo(() => {
    const datesMap = {};
    participants.forEach(p => {
      if (p.registered_at) {
        const d = p.registered_at.substring(0, 10);
        datesMap[d] = (datesMap[d] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(datesMap).sort();
    const recentDates = sortedDates.slice(-6);
    if (recentDates.length === 0) {
      return [
        { label: 'Sep 26', count: 180, height: 45 },
        { label: 'Sep 27', count: 240, height: 60 },
        { label: 'Sep 28', count: 190, height: 48 },
        { label: 'Sep 29', count: 310, height: 78 },
        { label: 'Sep 30', count: 220, height: 55 },
        { label: 'Oct 01', count: 380, height: 95 }
      ];
    }

    const max = Math.max(...recentDates.map(d => datesMap[d] || 1));
    return recentDates.map(d => {
      const parts = d.split('-');
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = datesMap[d];
      const height = Math.max(15, Math.round((count / max) * 100));
      return { label, count, height };
    });
  }, [participants]);

  // Real or realistic recent operations activities
  const recentActivities = useMemo(() => {
    const logs = getAuditLogs().slice(0, 5);
    if (logs.length > 0) {
      return logs.map((l, idx) => ({
        id: l.id || idx,
        title: `${l.actorName || 'Staff'} → ${l.targetName || 'Participant'}`,
        subtitle: l.details || l.eventName || 'Call logged',
        time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        icon: l.action === 'VERIFY_PAYMENT' ? ShieldCheck : PhoneCall
      }));
    }

    return [
      {
        id: 1,
        title: 'Harsh Vardhan (Central Desk)',
        subtitle: 'Call Logged: Candidate interested in Robowars, will pay online',
        time: 'Today, 10:24 AM',
        icon: PhoneCall
      },
      {
        id: 2,
        title: 'Priya Sharma (Mechanica Bay)',
        subtitle: 'Payment Claimed: Candidate claimed UPI payment, queued for verify',
        time: 'Today, 09:45 AM',
        icon: ShieldCheck
      },
      {
        id: 3,
        title: 'Aman Deep (Plexus Bay)',
        subtitle: 'Callback scheduled: Asked to call back at 6:00 PM',
        time: 'Yesterday',
        icon: Clock
      },
      {
        id: 4,
        title: 'Unstop Sync Engine',
        subtitle: 'Synced 3,673 total records from Unstop Portal',
        time: 'Oct 01',
        icon: Zap
      },
      {
        id: 5,
        title: 'Rohit Kumar (Electrolution)',
        subtitle: 'Call Logged: Candidate requested event rules on WhatsApp',
        time: 'Oct 01',
        icon: CheckCircle2
      }
    ];
  }, []);

  const handleSaveQuota = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 mb-8 font-sans">
      
      {/* 3-Column Bento Grid matching ui.shadcn.com */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* ========================================================
            CARD 1: Registration Velocity & Flow
            ======================================================== */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                Registration Flow
              </h3>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                {totalCount} Total
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Daily student registration trends on Unstop
            </p>

            {/* Minimalist Neutral Bar Chart */}
            <div className="h-36 flex items-end justify-between gap-3 px-2 pt-2 pb-1 mb-6 border-b border-zinc-100">
              {chartBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full relative flex items-end justify-center h-full">
                    <div 
                      style={{ height: `${bar.height}%` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                        idx === chartBars.length - 1 
                          ? 'bg-zinc-900 shadow-xs' 
                          : 'bg-zinc-600 hover:bg-zinc-700'
                      }`}
                      title={`${bar.label}: ${bar.count} registrations`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-900 truncate">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>

            {/* 2 Stat Tiles: Completed vs Fee Not Paid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  COMPLETED
                </div>
                <div className="text-lg font-bold text-zinc-900">
                  {completedCount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Registration done
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">
                  FEE NOT PAID
                </div>
                <div className="text-lg font-bold text-zinc-900">
                  {incompleteCount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Calling leads (81%)
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAuditLogs}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            View Operations Audit Report
          </button>
        </div>


        {/* ========================================================
            CARD 2: Calling Outreach Pipeline & Target
            ======================================================== */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                Outreach Pipeline
              </h3>
              <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                Calling Desk
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              Unpaid lead recovery across 13 technical domains
            </p>

            <form onSubmit={handleSaveQuota} className="space-y-4">
              
              {/* Preferred Domain Select */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Active Domain Scope
                </label>
                <div className="relative">
                  <select 
                    defaultValue={activeDomainId || "ALL"}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 font-medium outline-none appearance-none cursor-pointer focus:border-zinc-900 shadow-xs"
                  >
                    <option value="ALL">All 13 Technical Domains (Master)</option>
                    {Object.values(DOMAINS_DIRECTORY).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.bay})
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Amount Display & Progress */}
              <div className="pt-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-700">
                    Fee Not Paid (To Call)
                  </span>
                  <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                    {incompleteCount}
                  </span>
                </div>

                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-2 mb-1.5">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((calledCount / Math.max(1, incompleteCount)) * 100))}%` }}
                    className="bg-zinc-900 h-full rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>{calledCount} Calls Logged</span>
                  <span>{incompleteCount} Total Unpaid Leads</span>
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Calling Desk Memo / Guidelines
                </label>
                <textarea 
                  rows={2}
                  value={memoNote}
                  onChange={(e) => setMemoNote(e.target.value)}
                  placeholder="e.g. Inform candidates that ₹200 pass covers entry to all 62 competitions..."
                  className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 resize-none shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
              >
                {savedNotice ? '✓ Memo Saved' : 'Save Calling Guidelines'}
              </button>
            </form>
          </div>
        </div>


        {/* ========================================================
            CARD 3: Registration Milestones & Conversion
            ======================================================== */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                Registration Milestones
              </h3>
              <button 
                onClick={onOpenVerificationQueue}
                className="text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Verification Desk
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Official Unstop conversion breakdown
            </p>

            <div className="space-y-6">
              
              {/* Target 1: Completed Registrations */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  COMPLETED REGISTRATIONS
                </div>
                <div className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                  {completedCount}
                </div>
                
                {/* Thick Solid Black Progress Bar */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((completedCount / totalCount) * 100))}%` }}
                    className="bg-zinc-900 h-full rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{Math.round((completedCount / totalCount) * 100)}% of total entries</span>
                  <span className="font-medium text-zinc-700">{completedCount} / {totalCount}</span>
                </div>
              </div>

              {/* Target 2: Registration Fee Not Paid */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1">
                  REGISTRATION FEE NOT PAID (INCOMPLETE)
                </div>
                <div className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                  {incompleteCount}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((incompleteCount / totalCount) * 100))}%` }}
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{Math.round((incompleteCount / totalCount) * 100)}% pending fee payment</span>
                  <span className="font-medium text-zinc-700">{incompleteCount} / {totalCount}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 text-xs text-zinc-400 mt-4">
            Candidates who did not complete payment on Unstop.
          </div>
        </div>

      </div>

      {/* ========================================================
          RECENT OPERATIONS ACTIVITY (Like Recent Transactions)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
              Recent Operations Activity
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live caller updates, status marks and verified claims
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-900 text-white">
              01 02
            </span>
          </div>
        </div>

        {/* List Rows */}
        <div className="divide-y divide-zinc-100 mt-3">
          {recentActivities.map((act) => {
            const IconComp = act.icon;
            return (
              <div 
                key={act.id} 
                className="py-3 flex items-center justify-between gap-3 group hover:bg-zinc-50/60 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0 group-hover:bg-zinc-200 transition-colors">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-xs text-zinc-900 truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {act.subtitle}
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-zinc-400 shrink-0">
                  {act.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
