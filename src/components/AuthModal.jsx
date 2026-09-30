// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Users, 
  Check, 
  KeyRound, 
  LogIn, 
  Sparkles,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { ROLES, TEAMS, PRESET_USERS } from '../utils/auth';

export default function AuthModal({ 
  isOpen, 
  currentUser, 
  onClose, 
  onSelectUser 
}) {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' or 'custom'
  const [customName, setCustomName] = useState('');
  const [customTeam, setCustomTeam] = useState('invitation');
  const [customRole, setCustomRole] = useState('team_member');
  const [customEvent, setCustomEvent] = useState('');
  const [customPin, setCustomPin] = useState('2026');

  if (!isOpen) return null;

  const handleCustomLogin = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const teamObj = TEAMS.find(t => t.id === customTeam);
    const userObj = {
      id: 'usr_' + Date.now(),
      name: customName.trim(),
      role: customRole,
      team: customTeam,
      teamName: teamObj ? teamObj.name : 'TechFEST Operations',
      title: `${teamObj ? teamObj.name : 'Team'} Member`,
      email: `${customName.toLowerCase().replace(/\s+/g, '.')}@sliet.ac.in`,
      allowedDomains: customRole === 'domain_coordinator' ? [customEvent || 'Competitions'] : ['ALL'],
      allowedEvents: (customRole === 'event_coordinator' || customRole === 'event_member') ? [customEvent || 'ALL'] : ['ALL'],
      avatarInitials: customName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };

    onSelectUser(userObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#11141A] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#161A22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Central Operations Authentication & RBAC</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Role-based access control for Invitation, Reception, Outreach, and Domain Leads
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Session Bar */}
        <div className="px-5 py-3 bg-[#151922] border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Session:</span>
            <span className="font-semibold text-white">{currentUser?.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${ROLES[currentUser?.role]?.badgeColor || 'border-slate-500 text-slate-300'}`}>
              {ROLES[currentUser?.role]?.name || currentUser?.role}
            </span>
            <span className="text-slate-400 font-mono text-[11px] truncate">
              ({currentUser?.teamName || 'Staff'})
            </span>
          </div>

          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Authenticated
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="p-5 pb-0">
          <div className="flex items-center gap-2 p-1 bg-[#0B0D11] rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'quick'
                  ? 'bg-[#151922] text-white shadow-sm border border-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1-Click Persona Switcher (Staff Roster)
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'custom'
                  ? 'bg-[#151922] text-white shadow-sm border border-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Custom Coordinator / Member Login
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {activeTab === 'quick' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Select an organizer persona to test the view restrictions, calling scope, and audit log generation:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_USERS.map((usr) => {
                  const isActive = currentUser?.id === usr.id;
                  const roleDef = ROLES[usr.role] || {};

                  return (
                    <button
                      key={usr.id}
                      onClick={() => {
                        onSelectUser(usr);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative group ${
                        isActive
                          ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/30'
                          : 'bg-[#151922] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center font-bold text-xs text-white">
                            {usr.avatarInitials}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-white group-hover:text-sky-300 transition-colors">
                              {usr.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {usr.teamName}
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${roleDef.badgeColor}`}>
                          {roleDef.name}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                        {usr.title}
                      </p>

                      {isActive && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Jaspreet Singh"
                    className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* Team Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Team / Vertical
                  </label>
                  <select
                    value={customTeam}
                    onChange={(e) => setCustomTeam(e.target.value)}
                    className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    {TEAMS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Role & Authority Level
                  </label>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    {Object.values(ROLES).map((r) => (
                      <option key={r.id} value={r.id}>{r.name} (Lvl {r.level})</option>
                    ))}
                  </select>
                </div>

                {/* Specific Event or Domain */}
                {(customRole === 'event_coordinator' || customRole === 'event_member' || customRole === 'domain_coordinator') && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Event or Domain Keyword
                    </label>
                    <input
                      type="text"
                      value={customEvent}
                      onChange={(e) => setCustomEvent(e.target.value)}
                      placeholder="e.g. Robowars, Hackathon, Quiz, Code Golf"
                      className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Limits candidate visibility strictly to records matching this keyword.
                    </p>
                  </div>
                )}

                {/* Passcode / PIN */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Organizer Access PIN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={customPin}
                      onChange={(e) => setCustomPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                    />
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                </div>

              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-lg shadow-sky-500/20"
                >
                  Create & Launch Session
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
