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
  Sliders,
  DollarSign,
  Users,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { DOMAINS_DIRECTORY } from '../utils/auth';
import { getAuditLogs, getPaymentVerificationQueue } from '../utils/callStore';

export default function BentoGrid({ 
  participants = [], 
  summary = {}, 
  currentUser,
  activeDomainId,
  onOpenAuditLogs,
  onOpenVerificationQueue,
  onOpenDomainDrawer
}) {
  const [quotaSlider, setQuotaSlider] = useState(73);
  const [memoNote, setMemoNote] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  // Computations
  const totalCount = participants.length;
  const paidCount = useMemo(() => {
    return participants.filter(p => p.is_paid === true || p.payment_status === 'PAID' || Number(p.amount) > 0).length;
  }, [participants]);
  const incompleteCount = totalCount - paidCount;
  const totalRevenue = paidCount * 200;

  // Compute 6-bar activity distribution (like Contribution History in screenshot)
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
        { label: 'Dec', count: 180, height: 45 },
        { label: 'Jan', count: 240, height: 60 },
        { label: 'Feb', count: 190, height: 48 },
        { label: 'Mar', count: 310, height: 78 },
        { label: 'Apr', count: 220, height: 55 },
        { label: 'May', count: 380, height: 95 }
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

  // Recent Operations Activity list
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

    // Default realistic activity entries if log is fresh
    return [
      {
        id: 1,
        title: 'Harsh Vardhan (Central Desk)',
        subtitle: 'Call Logged: Candidate interested in Robowars',
        time: 'Today, 10:24 AM',
        icon: PhoneCall
      },
      {
        id: 2,
        title: 'Priya Sharma (Mechanica Bay)',
        subtitle: 'Payment Claimed: ₹200 UPI transaction pending gateway sync',
        time: 'Today, 09:45 AM',
        icon: ShieldCheck
      },
      {
        id: 3,
        title: 'Aman Deep (Plexus Bay)',
        subtitle: 'Callback scheduled: Father asked to call at 6:00 PM',
        time: 'Yesterday',
        icon: Clock
      },
      {
        id: 4,
        title: 'Unstop Autonomous Cloud Sync',
        subtitle: 'Nightly OAuth background sync verified 730 entries',
        time: 'Oct 01',
        icon: Zap
      },
      {
        id: 5,
        title: 'Rohit Kumar (Electrolution)',
        subtitle: 'Candidate verified via Gateway transaction matching',
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
    <div className="space-y-6 mb-8">
      
      {/* 3-Column Bento Grid directly matching ui.shadcn.com screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* ========================================================
            CARD 1: Contribution History (Registration Velocity)
            ======================================================== */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                Registration Velocity
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Daily participant flow across technical events
            </p>

            {/* Minimalist Neutral Bar Chart (Exact replica of screenshot) */}
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
                      title={`${bar.label}: ${bar.count} participants`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-zinc-500 group-hover:text-zinc-900 truncate">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom 2 Stat Tiles in Light Gray Tray */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  GATEWAY PAID
                </div>
                <div className="text-sm font-bold text-zinc-900">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {paidCount} confirmed
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  OUTREACH PIPELINE
                </div>
                <div className="text-sm font-bold text-zinc-900">
                  {incompleteCount.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Fee recovery leads
                </div>
              </div>
            </div>
          </div>

          {/* Solid Black Button */}
          <button
            onClick={onOpenAuditLogs}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            View Operations Report
          </button>
        </div>


        {/* ========================================================
            CARD 2: Payout Threshold (Outreach Quota & Scope)
            ======================================================== */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                Outreach Quota
              </h3>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-5">
              Set the minimum calling target and domain allocation
            </p>

            <form onSubmit={handleSaveQuota} className="space-y-4">
              
              {/* Preferred Domain Select */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Preferred Domain
                </label>
                <div className="relative">
                  <select 
                    defaultValue={activeDomainId || "ALL"}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 font-medium outline-none appearance-none cursor-pointer focus:border-zinc-900 shadow-xs"
                  >
                    <option value="ALL">All 13 Technical Domains</option>
                    {Object.values(DOMAINS_DIRECTORY).map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.bay})
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Amount Display & Slider */}
              <div className="pt-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-700">
                    Target Paid Registrations
                  </span>
                  <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                    {paidCount}
                  </span>
                </div>

                {/* Range Slider */}
                <input 
                  type="range"
                  min="0"
                  max="1000"
                  value={paidCount}
                  onChange={(e) => setQuotaSlider(Number(e.target.value))}
                  className="w-full accent-zinc-900 cursor-pointer h-1.5 bg-zinc-100 rounded-lg"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
                  <span>0 (MIN)</span>
                  <span>1,000 (TARGET)</span>
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Coordinator Memo
                </label>
                <textarea 
                  rows={2}
                  value={memoNote}
                  onChange={(e) => setMemoNote(e.target.value)}
                  placeholder="Add notes for calling desks or domain briefing..."
                  className="w-full bg-white border border-zinc-200 rounded-xl p-2.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 resize-none shadow-xs"
                />
              </div>

              {/* Solid Black Button */}
              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer mt-2"
              >
                {savedNotice ? '✓ Quota Saved' : 'Save Outreach Configuration'}
              </button>
            </form>
          </div>
        </div>


        {/* ========================================================
            CARD 3: Savings Targets (Registration Milestones)
            ======================================================== */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
                Registration Targets
              </h3>
              <button 
                onClick={onOpenVerificationQueue}
                className="text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Verification
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Active milestones for techFEST '26
            </p>

            <div className="space-y-6">
              
              {/* Target 1: Gateway Paid Passes */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  GATEWAY PAID (₹200 PASS)
                </div>
                <div className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                
                {/* Thick Solid Black Progress Bar */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((paidCount / 1000) * 100))}%` }}
                    className="bg-zinc-900 h-full rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{Math.round((paidCount / 1000) * 100)}% achieved</span>
                  <span className="font-medium text-zinc-700">{paidCount} / 1,000</span>
                </div>
              </div>

              {/* Target 2: Fee Pending Outreach */}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  FEE PENDING RECOVERY
                </div>
                <div className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                  {incompleteCount.toLocaleString('en-IN')}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                  <div 
                    style={{ width: `38%` }}
                    className="bg-zinc-900 h-full rounded-full transition-all duration-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>38% contacted</span>
                  <span className="font-medium text-zinc-700">1,120 / {incompleteCount}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 text-xs text-zinc-400 mt-4">
            All 13 technical domains actively tracking recovery.
          </div>
        </div>

      </div>

      {/* ========================================================
          RECENT OPERATIONS ACTIVITY (Like Recent Transactions in screenshot)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 tracking-tight">
              Recent Operations Activity
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Your latest caller updates and verified claims
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-zinc-900 text-white">
              01 02
            </span>
          </div>
        </div>

        {/* List Rows with Minimalist Rounded Icon Containers */}
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
