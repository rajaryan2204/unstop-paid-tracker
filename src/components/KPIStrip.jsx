import React from 'react';
import { Users, DollarSign, Trophy, School } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function KPIStrip({ summary, participants }) {
  const totalCount = participants.length;
  const paidCount = participants.filter(p => p.is_paid === true || p.payment_status === 'PAID' || Number(p.amount) > 0).length;
  const incompleteCount = participants.filter(p => p.is_paid === false || p.payment_status === 'INCOMPLETE' || p.payment_status === 'UNPAID' || (p.status_label && p.status_label.toLowerCase().includes('not paid'))).length;
  const totalRevenue = participants.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  
  const totalEvents = summary?.total_events_scanned || 62;
  const eventsWithPaid = summary?.events_with_paid || new Set(participants.map(p => p.event_name)).size;
  const zeroPaidCount = Math.max(0, totalEvents - eventsWithPaid);

  const collegeCount = summary?.total_colleges || new Set(participants.map(p => p.college).filter(Boolean)).size;

  const cards = [
    {
      label: "Total Registrations",
      value: totalCount.toLocaleString('en-IN'),
      suffix: null,
      badgeText: "LIVE SYNC",
      badgeVariant: "info",
      valueColor: "text-white",
      subtext: `${paidCount.toLocaleString('en-IN')} Complete • ${incompleteCount.toLocaleString('en-IN')} Incomplete`,
      icon: Users,
      iconColor: "text-sky-400"
    },
    {
      label: "Paid Revenue",
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      suffix: null,
      badgeText: "GATEWAY",
      badgeVariant: "success",
      valueColor: "text-emerald-400",
      subtext: "Complete Registrations",
      icon: DollarSign,
      iconColor: "text-emerald-400"
    },
    {
      label: "Total Competitions",
      value: totalEvents,
      suffix: null,
      badgeText: "CATALOG",
      badgeVariant: "purple",
      valueColor: "text-purple-300",
      subtext: `${eventsWithPaid} with entries • ${zeroPaidCount} awaiting`,
      icon: Trophy,
      iconColor: "text-purple-400"
    },
    {
      label: "Institutions",
      value: collegeCount,
      suffix: null,
      badgeText: "PAN-INDIA",
      badgeVariant: "warning",
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
          <Card 
            key={i}
            className="p-4 relative overflow-hidden transition-all duration-200 hover:border-white/20 hover:shadow-lg group bg-[#11141A]/90 backdrop-blur-sm"
          >
            {/* Top Row: Label + shadcn Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400">
                {card.label}
              </span>
              <Badge variant={card.badgeVariant} className="text-[9.5px] font-mono font-semibold px-1.5 py-0.5">
                {card.badgeText}
              </Badge>
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
          </Card>
        );
      })}
    </div>
  );
}
