import React from 'react';
import { Users, DollarSign, Trophy, School, TrendingUp } from 'lucide-react';

export default function KPIStrip({ summary, participants }) {
  const verifiedCount = participants.length;
  const totalApplicants = summary?.total_unstop_registrations || 3601;
  const paidCount = participants.filter(p => Number(p.amount) > 0).length;
  const freeCount = verifiedCount - paidCount;
  const totalRevenue = participants.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  
  const totalEvents = summary?.total_events_scanned || 62;
  const eventsWithPaid = summary?.events_with_paid || new Set(participants.map(p => p.event_name)).size;
  const zeroPaidCount = Math.max(0, totalEvents - eventsWithPaid);

  const collegeCount = summary?.total_colleges || new Set(participants.map(p => p.college).filter(Boolean)).size;

  const cards = [
    {
      label: "Verified Attendees",
      value: verifiedCount.toLocaleString('en-IN'),
      suffix: `/ ${totalApplicants.toLocaleString('en-IN')}`,
      badge: "LIVE SYNC",
      badgeClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      valueColor: "text-white",
      subtext: `${freeCount} Free • ${paidCount} Paid`,
      icon: Users,
      iconColor: "text-sky-400"
    },
    {
      label: "Paid Revenue",
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      suffix: null,
      badge: "GATEWAY",
      badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      valueColor: "text-emerald-400",
      subtext: "RC Boat + Ghost Code",
      icon: DollarSign,
      iconColor: "text-emerald-400"
    },
    {
      label: "Total Competitions",
      value: totalEvents,
      suffix: null,
      badge: "CATALOG",
      badgeClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      valueColor: "text-purple-300",
      subtext: `${eventsWithPaid} with entries • ${zeroPaidCount} awaiting`,
      icon: Trophy,
      iconColor: "text-purple-400"
    },
    {
      label: "Institutions",
      value: collegeCount,
      suffix: null,
      badge: "PAN-INDIA",
      badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      valueColor: "text-amber-300",
      subtext: `PAN-India (${collegeCount} Colleges)`,
      icon: School,
      iconColor: "text-amber-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div 
            key={i}
            className="surface-card rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:border-white/20 group"
          >
            {/* Top Row: Label + Micro Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
                {card.label}
              </span>
              <span className={`text-[9.5px] font-mono font-semibold px-1.5 py-0.5 rounded border ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>

            {/* Value Row */}
            <div className="flex items-baseline gap-1.5 my-1">
              <span className={`text-2xl sm:text-[26px] font-semibold tracking-tight tabular-nums ${card.valueColor}`}>
                {card.value}
              </span>
              {card.suffix && (
                <span className="text-xs font-mono text-slate-500 font-normal">
                  {card.suffix}
                </span>
              )}
            </div>

            {/* Subtitle Row */}
            <div className="text-[11.5px] text-slate-400 flex items-center justify-between gap-2 mt-1 truncate">
              <span className="truncate">{card.subtext}</span>
              <IconComponent className={`w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${card.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
