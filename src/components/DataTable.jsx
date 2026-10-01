// src/components/DataTable.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  X, 
  Copy, 
  Check, 
  Phone, 
  PhoneCall, 
  ArrowRight, 
  Users, 
  Sparkles, 
  Trophy, 
  HelpCircle, 
  Terminal, 
  Music, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getAvatarStyle, getInitials } from '../utils/avatar';
import { getCallRecords, CALL_STATUSES } from '../utils/callStore';
import { getDomainForEvent, DOMAINS_DIRECTORY } from '../utils/auth';

export default function DataTable({ 
  participants = [], 
  summary = {}, 
  currentUser,
  activeDomainId,
  selectedEventFilter = '',
  onSelectEventFilter,
  onSelectParticipant, 
  onTriggerCall,
  onTriggerToast 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedCallStatus, setSelectedCallStatus] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(selectedEventFilter || '');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Sync selectedEvent with prop if changed from DomainBanner
  useEffect(() => {
    setSelectedEvent(selectedEventFilter || '');
  }, [selectedEventFilter]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Fetch call records database
  const callRecords = useMemo(() => getCallRecords(), [participants]);

  // Active domain info if scoped
  const activeDomain = activeDomainId ? DOMAINS_DIRECTORY[activeDomainId] : null;

  // Category counts based on accessible participants
  const categoryCounts = useMemo(() => {
    const counts = { all: participants.length, competitions: 0, quizzes: 0, hackathons: 0, cultural: 0 };
    participants.forEach(p => {
      const t = (p.event_type || 'competitions').toLowerCase();
      if (t.includes('quiz')) counts.quizzes++;
      else if (t.includes('hack')) counts.hackathons++;
      else if (t.includes('cultur')) counts.cultural++;
      else counts.competitions++;
    });
    return counts;
  }, [participants]);

  // Payment counts
  const paymentCounts = useMemo(() => {
    const paid = participants.filter(p => Number(p.amount) > 0).length;
    return { all: participants.length, paid, free: participants.length - paid };
  }, [participants]);

  // Master events list for dropdown
  const masterEvents = useMemo(() => {
    const eventCounts = {};
    participants.forEach(p => {
      const name = (p.event_name || 'Event').trim();
      eventCounts[name] = (eventCounts[name] || 0) + 1;
    });

    const sortedEvents = Object.keys(eventCounts).sort((a, b) => eventCounts[b] - eventCounts[a]);
    return { sortedEvents, eventCounts };
  }, [participants]);

  // Colleges list
  const collegesList = useMemo(() => {
    return Array.from(new Set(participants.map(p => p.college).filter(Boolean))).sort();
  }, [participants]);

  // Filter & Search logic
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // 1. Category
      if (selectedCategory !== 'all') {
        const t = (p.event_type || 'competitions').toLowerCase();
        if (selectedCategory === 'quizzes' && !t.includes('quiz')) return false;
        if (selectedCategory === 'hackathons' && !t.includes('hack')) return false;
        if (selectedCategory === 'cultural' && !t.includes('cultur')) return false;
        if (selectedCategory === 'competitions' && (t.includes('quiz') || t.includes('hack') || t.includes('cultur'))) return false;
      }

      // 2. Payment
      if (selectedPayment === 'paid' && Number(p.amount) <= 0) return false;
      if (selectedPayment === 'free' && Number(p.amount) > 0) return false;

      // 3. Calling Status Filter
      if (selectedCallStatus !== 'all') {
        const record = callRecords[String(p.id)];
        const callCount = record?.callCount || 0;
        const lastStatus = record?.lastStatus;

        if (selectedCallStatus === 'never_called' && callCount > 0) return false;
        if (selectedCallStatus === 'called' && callCount === 0) return false;
        if (selectedCallStatus === 'PAYMENT_CLAIMED' && lastStatus !== 'PAYMENT_CLAIMED') return false;
        if (selectedCallStatus === 'INTERESTED' && lastStatus !== 'INTERESTED') return false;
        if (selectedCallStatus === 'CALL_LATER' && lastStatus !== 'CALL_LATER') return false;
        if (selectedCallStatus === 'NOT_PICKED' && lastStatus !== 'NOT_PICKED') return false;
      }

      // 4. Event
      if (selectedEvent && (p.event_name || '').trim() !== selectedEvent) return false;

      // 5. College
      if (selectedCollege && (p.college || '').trim() !== selectedCollege) return false;

      // 6. Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchEmail = (p.email || '').toLowerCase().includes(q);
        const matchPhone = (p.phone || '').toLowerCase().includes(q);
        const matchCollege = (p.college || '').toLowerCase().includes(q);
        const matchEvent = (p.event_name || '').toLowerCase().includes(q);
        const matchTeam = (p.team_name || '').toLowerCase().includes(q);
        const matchId = (p.id || '').toLowerCase().includes(q);

        const matchMembers = (p.team_members || []).some(m => 
          (m.name || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q) ||
          (m.phone || '').toLowerCase().includes(q)
        );

        if (!matchName && !matchEmail && !matchPhone && !matchCollege && !matchEvent && !matchTeam && !matchId && !matchMembers) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.registered_at || 0) - new Date(a.registered_at || 0);
      if (sortBy === 'date-asc') return new Date(a.registered_at || 0) - new Date(b.registered_at || 0);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'event-asc') return (a.event_name || '').localeCompare(b.event_name || '');
      if (sortBy === 'amount-desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === 'calls-desc') {
        const cA = callRecords[String(a.id)]?.callCount || 0;
        const cB = callRecords[String(b.id)]?.callCount || 0;
        return cB - cA;
      }
      return 0;
    });
  }, [participants, callRecords, selectedCategory, selectedPayment, selectedCallStatus, selectedEvent, selectedCollege, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / (pageSize === 'all' ? 999999 : pageSize)));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * (pageSize === 'all' ? 999999 : pageSize);
  const endIndex = Math.min(startIndex + (pageSize === 'all' ? 999999 : pageSize), filteredParticipants.length);
  const pageItems = filteredParticipants.slice(startIndex, endIndex);

  const isFiltering = searchQuery || selectedEvent || selectedCollege || selectedCategory !== 'all' || selectedPayment !== 'all' || selectedCallStatus !== 'all';

  const handleCopyEmail = (e, email) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    if (onTriggerToast) onTriggerToast({ type: 'success', message: `Copied ${email}` });
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedPayment('all');
    setSelectedCallStatus('all');
    setSelectedEvent('');
    if (onSelectEventFilter) onSelectEventFilter('');
    setSelectedCollege('');
    setCurrentPage(1);
  };

  const renderTrackBadge = (type) => {
    const t = String(type || 'Competitions').toLowerCase();
    if (t.includes('quiz')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"></span>
          Quizzes
        </span>
      );
    } else if (t.includes('hack')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]"></span>
          Hackathons
        </span>
      );
    } else if (t.includes('cultur')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]"></span>
          Cultural
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-sky-300 bg-sky-500/10 border border-sky-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]"></span>
        Competition
      </span>
    );
  };

  return (
    <div className="surface-card rounded-xl overflow-hidden border border-white/[0.08] transition-all mb-10">
      
      {/* 1. Header Bar: Category Tabs + Payment Segments */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-4 pt-2 border-b border-white/[0.06] bg-[#11141A]">
        
        {/* Category Segment Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Events', count: categoryCounts.all, countClass: 'text-slate-400 bg-white/[0.06]', icon: Sparkles },
            { id: 'competitions', label: 'Competitions', count: categoryCounts.competitions, countClass: 'text-sky-400 bg-sky-500/15', icon: Trophy },
            { id: 'quizzes', label: 'Quizzes', count: categoryCounts.quizzes, countClass: 'text-amber-400 bg-amber-500/15', icon: HelpCircle },
            { id: 'hackathons', label: 'Hackathons', count: categoryCounts.hackathons, countClass: 'text-purple-400 bg-purple-500/15', icon: Terminal },
            { id: 'cultural', label: 'Cultural & Jam', count: categoryCounts.cultural, countClass: 'text-rose-400 bg-rose-500/15', icon: Music },
          ].map(tab => {
            const IconComponent = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setSelectedCategory(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                  isActive 
                    ? 'border-sky-400 text-sky-400 font-semibold' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${tab.countClass}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Payment Filter Segmented Tray */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#161A22] border border-white/[0.08] shrink-0 mb-2 md:mb-0">
          {[
            { id: 'all', label: 'All', count: paymentCounts.all, countClass: 'text-slate-400' },
            { id: 'paid', label: 'Paid', count: paymentCounts.paid, countClass: 'text-emerald-400' },
            { id: 'free', label: 'Free', count: paymentCounts.free, countClass: 'text-slate-400' }
          ].map(p => {
            const isActive = selectedPayment === p.id;
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPayment(p.id); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  isActive 
                    ? 'bg-[#1F2430] text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] font-mono ${p.countClass}`}>({p.count})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 2. Operations Filter Toolbar */}
      <div className="p-4 bg-[#11141A] border-b border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        
        {/* Instant Search Bar */}
        <div className="lg:col-span-4 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search candidate, team, college, email... (Press / to focus)"
            className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Event Dropdown Filter */}
        <div className="lg:col-span-3">
          <select
            value={selectedEvent}
            onChange={(e) => { 
              const val = e.target.value;
              setSelectedEvent(val);
              if (onSelectEventFilter) onSelectEventFilter(val);
              setCurrentPage(1); 
            }}
            className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all truncate"
          >
            <option value="">
              {activeDomain ? `All ${activeDomain.name} Events (${participants.length})` : `All Events (${participants.length})`}
            </option>
            {masterEvents.sortedEvents.map((evName, i) => (
              <option key={i} value={evName}>
                {evName} ({masterEvents.eventCounts[evName] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Calling Status Filter (As requested by Sagar) */}
        <div className="lg:col-span-2">
          <select
            value={selectedCallStatus}
            onChange={(e) => { setSelectedCallStatus(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all truncate"
          >
            <option value="all">All Calling Status</option>
            <option value="never_called">Never Called (0 calls)</option>
            <option value="called">Called (1+ calls)</option>
            <option value="PAYMENT_CLAIMED">Payment Completed</option>
            <option value="INTERESTED">Interested / Follow Up</option>
            <option value="CALL_LATER">Callback Scheduled</option>
            <option value="NOT_PICKED">Not Picked / Busy</option>
          </select>
        </div>

        {/* College Filter Dropdown */}
        <div className="lg:col-span-2">
          <select
            value={selectedCollege}
            onChange={(e) => { setSelectedCollege(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all truncate"
          >
            <option value="">All Colleges & Institutions ({collegesList.length})</option>
            {collegesList.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="lg:col-span-1 flex items-center justify-end">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-2 py-2 text-xs text-slate-300 outline-none transition-all"
            title="Sort Attendees"
          >
            <option value="date-desc">Latest</option>
            <option value="date-asc">Oldest</option>
            <option value="name-asc">Name A-Z</option>
            <option value="calls-desc">Most Calls</option>
            <option value="amount-desc">Paid First</option>
          </select>
        </div>

      </div>

      {/* Active Filter Bar Summary */}
      {isFiltering && (
        <div className="px-4 py-2 bg-[#151922] border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-mono text-sky-400 font-semibold">{filteredParticipants.length}</span>
            <span>attendees matched active filters</span>
            {selectedEvent && (
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-mono text-[10px]">
                Event: {selectedEvent}
              </span>
            )}
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] font-mono text-sky-400 hover:text-sky-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}

      {/* 3. High Density Desktop Table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#161A22] text-slate-400 font-medium">
              <th className="py-2.5 px-3 w-10 text-center font-mono text-[11px]">#</th>
              <th className="py-2.5 px-3 min-w-[200px]">Candidate Details</th>
              <th className="py-2.5 px-3 min-w-[190px]">Phone & Direct Calling</th>
              <th className="py-2.5 px-3 min-w-[180px]">Institution & Course</th>
              <th className="py-2.5 px-3 min-w-[180px]">Competition & Domain</th>
              <th className="py-2.5 px-3 min-w-[130px]">Team Roster</th>
              <th className="py-2.5 px-3 min-w-[120px] text-right">Payment Status</th>
              <th className="py-2.5 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="max-w-xs mx-auto">
                    <Filter className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-300">No participants found</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting search terms or switching categories.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1.5 text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-lg hover:bg-sky-500/20 transition-all"
                    >
                      Reset all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              pageItems.map((p, idx) => {
                const absoluteIndex = startIndex + idx + 1;
                const avatarStyle = getAvatarStyle(p.name);
                const initials = getInitials(p.name);
                const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
                const amt = Number(p.amount) || 0;
                const hasMembers = p.team_members && p.team_members.length > 0;

                // Call CRM record
                const rec = callRecords[String(p.id)];
                const callCount = rec?.callCount || 0;
                const statusDef = rec?.lastStatus ? CALL_STATUSES[rec.lastStatus] : null;

                // Resolve domain
                const domainInfo = getDomainForEvent(p.event_name);

                return (
                  <tr 
                    key={p.id || idx}
                    onClick={() => onSelectParticipant(p)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                      {absoluteIndex}
                    </td>

                    {/* Participant Name & Email */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span 
                          style={avatarStyle}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10.5px] font-bold shrink-0 tracking-tight"
                        >
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate max-w-[190px] text-xs group-hover:text-sky-300 transition-colors">
                            {p.name || 'Participant'}
                          </div>
                          <div 
                            className="flex items-center gap-1 font-mono text-[11px] text-slate-400 mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate max-w-[145px]">{p.email || 'N/A'}</span>
                            {p.email && p.email !== 'N/A' && (
                              <button
                                onClick={(e) => handleCopyEmail(e, p.email)}
                                title="Copy Email"
                                className="text-slate-500 hover:text-white transition-colors"
                              >
                                {copiedEmail === p.email ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Direct Calling (As requested by Sagar) */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      {p.phone && p.phone !== 'N/A' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-slate-300">
                            <span>{p.phone}</span>

                            {/* Prominent Direct Phone Call Button */}
                            <button
                              onClick={() => onTriggerCall && onTriggerCall(p)}
                              title="Direct Phone Call & Log Remarks"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-sky-300 bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 transition-all shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                            >
                              <PhoneCall className="w-3 h-3 text-sky-400" />
                              <span className="font-mono text-[10px]">{callCount > 0 ? callCount : 'Call'}</span>
                            </button>

                            {/* WhatsApp Button */}
                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all"
                              >
                                WA
                              </a>
                            )}
                          </div>

                          {/* Dynamic Calling Status Badge */}
                          {statusDef ? (
                            <div className="flex items-center gap-1">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono border ${statusDef.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusDef.indicator}`} />
                                <span>{statusDef.shortLabel}</span>
                              </span>
                              {rec.leadNumber && (
                                <span className="text-[10px] font-mono text-slate-500">
                                  L: {rec.leadNumber}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] font-mono text-slate-500">
                              Never Called
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-slate-600">--</span>
                      )}
                    </td>

                    {/* College & Specialization */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-200 truncate max-w-[200px]" title={p.college}>
                        {p.college || 'N/A'}
                      </div>
                      {p.specialization && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                          <span>{p.specialization}</span>
                          {p.passing_year && <span className="text-slate-500"> • {p.passing_year}</span>}
                        </div>
                      )}
                    </td>

                    {/* Event, Track & Domain Badge */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-white truncate max-w-[170px]" title={p.event_name}>
                        {p.event_name || 'Event'}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {renderTrackBadge(p.event_type)}
                        {domainInfo && (
                          <span 
                            className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-medium border"
                            style={{ 
                              borderColor: `${domainInfo.accentColor}35`, 
                              color: domainInfo.accentColor, 
                              backgroundColor: `${domainInfo.accentColor}12` 
                            }}
                          >
                            {domainInfo.name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Team Roster */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="text-slate-300 truncate max-w-[110px]" title={p.team_name}>
                        {p.team_name || 'Individual'}
                      </div>
                      <div className="mt-0.5">
                        {hasMembers ? (
                          <button
                            onClick={() => onSelectParticipant(p)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-400 hover:text-purple-300"
                          >
                            <Users className="w-3 h-3" />
                            <span>{p.team_members.length} members</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">Solo</span>
                        )}
                      </div>
                    </td>

                    {/* Payment Status Pill */}
                    <td className="py-3 px-3 text-right">
                      {amt > 0 ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            <span>₹{amt.toLocaleString('en-IN')}</span>
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06]">
                          Free Entry
                        </span>
                      )}
                    </td>

                    {/* View Action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectParticipant(p)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                        title="View Full Candidate Profile"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Responsive Mobile Cards Feed */}
      <div className="md:hidden divide-y divide-white/[0.06]">
        {pageItems.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No participants found matching active filters.
          </div>
        ) : (
          pageItems.map((p, idx) => {
            const avatarStyle = getAvatarStyle(p.name);
            const initials = getInitials(p.name);
            const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
            const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
            const amt = Number(p.amount) || 0;
            const rec = callRecords[String(p.id)];
            const callCount = rec?.callCount || 0;
            const statusDef = rec?.lastStatus ? CALL_STATUSES[rec.lastStatus] : null;
            const domainInfo = getDomainForEvent(p.event_name);

            return (
              <div 
                key={p.id || idx}
                onClick={() => onSelectParticipant(p)}
                className="p-4 space-y-2.5 active:bg-white/[0.02] cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span 
                      style={avatarStyle}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    >
                      {initials}
                    </span>
                    <div>
                      <div className="font-semibold text-white text-xs">{p.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{p.email || 'N/A'}</div>
                    </div>
                  </div>

                  {amt > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      ₹{amt}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/[0.04]">
                      Free
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300">
                  <div className="font-medium text-white flex items-center gap-1.5">
                    <span>{p.event_name}</span>
                    {domainInfo && (
                      <span 
                        className="px-1.5 py-0.2 rounded text-[9.5px] font-mono border"
                        style={{ color: domainInfo.accentColor, borderColor: `${domainInfo.accentColor}30`, backgroundColor: `${domainInfo.accentColor}10` }}
                      >
                        {domainInfo.name}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.college}</div>
                </div>

                {/* Call Status & Direct Action Buttons */}
                <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    {statusDef ? (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${statusDef.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDef.indicator}`} />
                        <span>{statusDef.shortLabel}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">
                        Never Called
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.phone && p.phone !== 'N/A' && (
                      <button
                        onClick={() => onTriggerCall && onTriggerCall(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-sky-300 bg-sky-500/15 border border-sky-500/30"
                      >
                        <PhoneCall className="w-3 h-3 text-sky-400" />
                        <span>Call ({callCount})</span>
                      </button>
                    )}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25"
                      >
                        WA
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Pagination Bar */}
      <div className="p-3 bg-[#11141A] border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <span className="font-mono text-slate-200">{filteredParticipants.length > 0 ? startIndex + 1 : 0}</span>
          <span>to</span>
          <span className="font-mono text-slate-200">{endIndex}</span>
          <span>of</span>
          <span className="font-mono text-slate-200">{filteredParticipants.length}</span>
          <span>verified records</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setPageSize(val);
                setCurrentPage(1);
              }}
              className="bg-[#0B0D11] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-slate-300 outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || pageSize === 'all'}
              className="p-1 rounded bg-[#161A22] border border-white/[0.08] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-slate-300">
              Page {effectivePage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || pageSize === 'all'}
              className="p-1 rounded bg-[#161A22] border border-white/[0.08] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
