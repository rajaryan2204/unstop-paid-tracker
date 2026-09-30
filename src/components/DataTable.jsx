import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Copy, 
  Check, 
  Phone, 
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
  Filter
} from 'lucide-react';
import { getAvatarStyle, getInitials } from '../utils/avatar';

export default function DataTable({ 
  participants, 
  summary, 
  onSelectParticipant, 
  onTriggerToast 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Category counts
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

    const list = summary?.events_list || [];
    if (list.length > 0) {
      const withEntries = list.filter(e => (eventCounts[(e.title || '').trim()] || e.paid_registrations || 0) > 0);
      const awaiting = list.filter(e => (eventCounts[(e.title || '').trim()] || e.paid_registrations || 0) === 0);
      
      withEntries.sort((a, b) => {
        const cntA = eventCounts[(a.title || '').trim()] || a.paid_registrations || 0;
        const cntB = eventCounts[(b.title || '').trim()] || b.paid_registrations || 0;
        return cntB - cntA;
      });

      return { withEntries, awaiting, total: list.length, eventCounts };
    }

    const sortedEvents = Object.keys(eventCounts).sort((a, b) => eventCounts[b] - eventCounts[a]);
    return { fallback: sortedEvents, eventCounts };
  }, [participants, summary]);

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

      // 3. Event
      if (selectedEvent && (p.event_name || '').trim() !== selectedEvent) return false;

      // 4. College
      if (selectedCollege && (p.college || '').trim() !== selectedCollege) return false;

      // 5. Query
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
      return 0;
    });
  }, [participants, selectedCategory, selectedPayment, selectedEvent, selectedCollege, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / (pageSize === 'all' ? 999999 : pageSize)));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = (effectivePage - 1) * (pageSize === 'all' ? 999999 : pageSize);
  const endIndex = Math.min(startIndex + (pageSize === 'all' ? 999999 : pageSize), filteredParticipants.length);
  const pageItems = filteredParticipants.slice(startIndex, endIndex);

  const isFiltering = searchQuery || selectedEvent || selectedCollege || selectedCategory !== 'all' || selectedPayment !== 'all';

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
    setSelectedEvent('');
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
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isActive 
                    ? 'bg-[#11141A] text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] font-mono ${p.countClass}`}>{p.count}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 2. Operations Toolbar: Search + Filter Dropdowns */}
      <div className="p-3 bg-[#11141A] border-b border-white/[0.06] flex flex-wrap gap-2.5 items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search attendee, email, phone, college, team..."
            className="w-full pl-9 pr-14 py-1.5 rounded-lg text-xs bg-[#161A22] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/30 transition-all font-sans"
          />
          {searchQuery ? (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
              /
            </span>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Specific Event Filter */}
          <select
            value={selectedEvent}
            onChange={(e) => { setSelectedEvent(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-[#161A22] border border-white/[0.08] text-slate-300 focus:outline-none focus:border-sky-400/50 cursor-pointer max-w-[220px] truncate"
          >
            <option value="">All Competitions ({masterEvents.total || masterEvents.fallback?.length || 62})</option>
            {masterEvents.withEntries ? (
              <>
                <optgroup label="── With Verified Entries ──">
                  {masterEvents.withEntries.map(ev => {
                    const cnt = masterEvents.eventCounts[ev.title?.trim()] || ev.paid_registrations || 0;
                    return (
                      <option key={ev.id} value={ev.title}>
                        {ev.title} ({cnt} verified)
                      </option>
                    );
                  })}
                </optgroup>
                {masterEvents.awaiting.length > 0 && (
                  <optgroup label="── Awaiting Entries ──">
                    {masterEvents.awaiting.map(ev => (
                      <option key={ev.id} value={ev.title}>
                        {ev.title} (0 verified • {ev.total_registrations || 0} applicants)
                      </option>
                    ))}
                  </optgroup>
                )}
              </>
            ) : (
              masterEvents.fallback?.map(ev => (
                <option key={ev} value={ev}>
                  {ev} ({masterEvents.eventCounts[ev]})
                </option>
              ))
            )}
          </select>

          {/* College Filter */}
          <select
            value={selectedCollege}
            onChange={(e) => { setSelectedCollege(e.target.value); setCurrentPage(1); }}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-[#161A22] border border-white/[0.08] text-slate-300 focus:outline-none focus:border-sky-400/50 cursor-pointer max-w-[160px] truncate"
          >
            <option value="">All Colleges ({collegesList.length})</option>
            {collegesList.map(col => (
              <option key={col} value={col}>
                {col.length > 28 ? col.substring(0, 26) + '...' : col}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-[#161A22] border border-white/[0.08] text-slate-300 focus:outline-none focus:border-sky-400/50 cursor-pointer"
          >
            <option value="date-desc">Latest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="event-asc">Event (A-Z)</option>
            <option value="amount-desc">Highest Fee</option>
          </select>

          {/* Clear Filters Button */}
          {isFiltering && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 transition-all"
              title="Reset all search filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

        </div>

      </div>

      {/* 3. Desktop High-Density Data Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#11141A] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3 min-w-[220px]">Participant</th>
              <th className="py-2.5 px-3 min-w-[140px]">Contact</th>
              <th className="py-2.5 px-3 min-w-[200px]">College & Branch</th>
              <th className="py-2.5 px-3 min-w-[170px]">Event & Track</th>
              <th className="py-2.5 px-3 min-w-[120px]">Team Roster</th>
              <th className="py-2.5 px-3 min-w-[110px]">Payment</th>
              <th className="py-2.5 px-3 text-end w-20">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <Filter className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="font-medium text-slate-200 text-sm">No attendees match your filter</p>
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
                const telLink = p.phone && p.phone !== 'N/A' ? `tel:${p.phone}` : null;
                const amt = Number(p.amount) || 0;
                const hasMembers = p.team_members && p.team_members.length > 0;

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

                    {/* Contact Phone & Actions */}
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      {p.phone && p.phone !== 'N/A' ? (
                        <div className="flex items-center gap-1.5 font-mono text-[11.5px] text-slate-300">
                          <span>{p.phone}</span>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-[0_0_8px_rgba(37,211,102,0.15)]"
                            >
                              <span>WA</span>
                            </a>
                          )}
                          {telLink && (
                            <a
                              href={telLink}
                              title="Direct Phone Call"
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white bg-[#161A22] border border-white/[0.08] hover:border-white/20 transition-all"
                            >
                              <Phone className="w-2.5 h-2.5" />
                            </a>
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

                    {/* Event & Track Badge */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-white truncate max-w-[170px]" title={p.event_name}>
                        {p.event_name || 'Event'}
                      </div>
                      <div className="mt-1">
                        {renderTrackBadge(p.event_type)}
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
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                          >
                            <Users className="w-3 h-3 text-purple-400" />
                            <span>{p.team_members.length} members</span>
                          </button>
                        ) : (
                          <span className="text-[10.5px] text-slate-500 font-mono">Solo</span>
                        )}
                      </div>
                    </td>

                    {/* Payment Fee */}
                    <td className="py-3 px-3">
                      {amt > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]"></span>
                          Paid ₹{amt.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Free Entry
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectParticipant(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 transition-all"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Mobile Cards Feed (For Small Screens) */}
      <div className="md:hidden divide-y divide-white/[0.06] p-3 space-y-3">
        {pageItems.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm font-medium">No attendees found</p>
          </div>
        ) : (
          pageItems.map((p, idx) => {
            const avatarStyle = getAvatarStyle(p.name);
            const initials = getInitials(p.name);
            const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
            const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
            const amt = Number(p.amount) || 0;

            return (
              <div
                key={p.id || idx}
                onClick={() => onSelectParticipant(p)}
                className="surface-elevated rounded-lg p-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      style={avatarStyle}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[10.5px] font-bold shrink-0"
                    >
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-white text-xs truncate">{p.name}</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">{p.phone || p.email}</div>
                    </div>
                  </div>
                  <div>
                    {amt > 0 ? (
                      <span className="text-[10.5px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Paid ₹{amt}
                      </span>
                    ) : (
                      <span className="text-[10.5px] text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
                        Free
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded bg-black/30 border border-white/[0.04] mb-2 text-xs">
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="font-medium text-slate-200 truncate">{p.event_name}</span>
                    {renderTrackBadge(p.event_type)}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{p.college}</div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.06]" onClick={(e) => e.stopPropagation()}>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <span>WhatsApp</span>
                    </a>
                  ) : <span></span>}

                  <button
                    onClick={() => onSelectParticipant(p)}
                    className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Master Card Footer: Pagination */}
      <div className="p-3 bg-[#11141A] border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded bg-[#161A22] border border-white/[0.08] text-white focus:outline-none"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">All</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Showing {filteredParticipants.length === 0 ? 0 : startIndex + 1}–{endIndex} of {filteredParticipants.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={effectivePage <= 1}
              className="p-1 rounded bg-[#161A22] border border-white/[0.08] disabled:opacity-40 hover:text-white transition-all"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-300 font-semibold">{effectivePage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={effectivePage >= totalPages}
              className="p-1 rounded bg-[#161A22] border border-white/[0.08] disabled:opacity-40 hover:text-white transition-all"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
