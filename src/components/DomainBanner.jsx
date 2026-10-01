// src/components/DomainBanner.jsx
import React from 'react';
import { 
  Terminal, 
  Sparkles, 
  Layers, 
  Users, 
  Trophy, 
  PhoneCall, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { DOMAINS_DIRECTORY, getDomainStats } from '../utils/auth';

export default function DomainBanner({ 
  domainId, 
  currentUser, 
  participants, 
  onSelectEventFilter,
  selectedEvent 
}) {
  const domain = DOMAINS_DIRECTORY[domainId];
  if (!domain) return null;

  const stats = getDomainStats(domainId, participants);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="surface-card rounded-2xl p-5 mb-6 border border-white/[0.08] relative overflow-hidden bg-gradient-to-br from-[#11141A] via-[#141822] to-[#11141A] shadow-2xl">
      
      {/* Subtle Ambient Radial Glow */}
      <div 
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: domain.accentColor || '#38BDF8' }}
      />

      <div className="relative z-10 space-y-4">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-lg border border-white/[0.15]"
              style={{ 
                backgroundColor: `${domain.accentColor}25`,
                color: domain.accentColor || '#38BDF8'
              }}
            >
              {domain.bay?.split('-')[1] || domain.name.substring(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {domain.name.toUpperCase()}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white/[0.06] text-slate-300 border border-white/[0.1]">
                  {domain.bay}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono tracking-wider uppercase text-sky-400 bg-sky-500/10 border border-sky-500/20">
                  {domain.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {domain.department} • <span className="text-slate-300 font-medium">{domain.tagline}</span>
              </p>
            </div>
          </div>

          {/* Session Status Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {isSuperAdmin ? (
              <span className="px-3 py-1 rounded-lg text-xs font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <span>👑 Super Admin Filter View</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-lg text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Logged In as {currentUser?.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Domain Metrics Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Domain Attendees</div>
              <div className="text-xl font-bold text-white mt-0.5">{stats.totalParticipants}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">Across {stats.uniqueColleges} colleges</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Paid Revenue</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">{stats.paidCount} Paid • {stats.freeCount} Free</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400">Domain Competitions</div>
              <div className="text-xl font-bold text-sky-400 mt-0.5">{stats.eventsCount}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">Active TechFEST Events</div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Calling Outreach</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">
                {stats.totalParticipants > 0 ? Math.round((stats.paidCount / stats.totalParticipants) * 100) : 0}%
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">Paid Conversion Ratio</div>
            </div>
          </div>
        )}

        {/* Domain Events Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Assigned Competitions & Tracks ({domain.events.length})
            </span>
            {selectedEvent && (
              <button
                onClick={() => onSelectEventFilter && onSelectEventFilter('')}
                className="text-[10px] font-mono text-sky-400 hover:text-sky-300"
              >
                Clear Event Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {domain.events.map((ev, i) => {
              const isSelected = selectedEvent === ev;
              return (
                <button
                  key={i}
                  onClick={() => onSelectEventFilter && onSelectEventFilter(isSelected ? '' : ev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <span>{ev}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
