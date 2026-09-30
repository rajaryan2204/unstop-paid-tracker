import React, { useEffect } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  User, 
  Users, 
  Download, 
  ExternalLink,
  Crown
} from 'lucide-react';
import { getAvatarStyle, getInitials } from '../utils/avatar';

export default function CandidateDrawer({ participant, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!participant) return null;

  const initials = getInitials(participant.name);
  const avatarStyle = getAvatarStyle(participant.name);

  const cleanPhone = (participant.phone || '').replace(/[^0-9]/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
  const telLink = participant.phone && participant.phone !== 'N/A' ? `tel:${participant.phone}` : null;
  const mailLink = participant.email && participant.email !== 'N/A' ? `mailto:${participant.email}` : null;

  const amt = Number(participant.amount) || 0;
  const hasMembers = participant.team_members && Array.isArray(participant.team_members) && participant.team_members.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Right Sheet */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md lg:max-w-lg bg-[#11141A] border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#161A22]">
            <div className="flex items-center gap-3">
              <span 
                style={avatarStyle}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold tracking-tight shadow-sm"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-sm truncate max-w-[200px]">
                    {participant.name || 'Participant'}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {participant.event_type || 'Event'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                  ID: {participant.id} • Ref: {participant.payment_id || '--'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            
            {/* Quick Contact Actions Bar */}
            <div className="grid grid-cols-2 gap-2">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-[0_0_15px_-3px_rgba(37,211,102,0.2)]"
                >
                  <span>WhatsApp Leader</span>
                </a>
              )}
              {mailLink && (
                <a
                  href={mailLink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-sky-300 bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
              )}
            </div>

            {/* Payment Verification Status Banner */}
            {amt > 0 ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300/80 mb-0.5">
                  Payment Status
                </div>
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Paid ₹{amt.toLocaleString('en-IN')} (Gateway Confirmed)</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-300/70 mt-1 select-all">
                  Txn ID: {participant.payment_id}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-300">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-0.5">
                  Registration Status
                </div>
                <div className="flex items-center gap-2 font-semibold text-sm text-sky-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Free Competition Entry (Form Verified)</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-1 select-all">
                  Unstop Reg ID: {participant.id}
                </div>
              </div>
            )}

            {/* Candidate Profile Details */}
            <div className="surface-elevated rounded-xl p-3.5 border border-white/[0.08]">
              <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-white/[0.06]">
                <User className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-xs text-white">Candidate Profile</span>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <dt className="text-slate-400">Candidate:</dt>
                <dd className="col-span-2 font-medium text-white select-all">{participant.name}</dd>

                <dt className="text-slate-400">Email:</dt>
                <dd className="col-span-2 font-mono text-slate-300 select-all truncate">{participant.email || 'N/A'}</dd>

                <dt className="text-slate-400">Mobile:</dt>
                <dd className="col-span-2 font-mono text-slate-300 select-all">{participant.phone || 'N/A'}</dd>

                <dt className="text-slate-400">College:</dt>
                <dd className="col-span-2 text-slate-200">{participant.college || 'N/A'}</dd>

                {participant.specialization && (
                  <>
                    <dt className="text-slate-400">Course / Branch:</dt>
                    <dd className="col-span-2 text-slate-300">{participant.specialization}</dd>
                  </>
                )}

                {participant.passing_year && (
                  <>
                    <dt className="text-slate-400">Graduation Year:</dt>
                    <dd className="col-span-2 font-mono text-slate-300">{participant.passing_year}</dd>
                  </>
                )}

                <dt className="text-slate-400">Registered At:</dt>
                <dd className="col-span-2 font-mono text-slate-400">
                  {participant.registered_at ? new Date(participant.registered_at).toLocaleString('en-IN') : 'N/A'}
                </dd>
              </dl>

              {/* Download Resume Link if Available */}
              {participant.resume_url && (
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex justify-end">
                  <a
                    href={participant.resume_url.startsWith('http') ? participant.resume_url : 'https://d8it4huxumps7.cloudfront.net/' + participant.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Uploaded Resume PDF</span>
                  </a>
                </div>
              )}
            </div>

            {/* Team Roster Section */}
            <div className="surface-elevated rounded-xl p-3.5 border border-white/[0.08]">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-xs text-white">
                    Team: {participant.team_name || 'Individual'}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                  {(participant.team_members || []).length} Member(s)
                </span>
              </div>

              {hasMembers ? (
                <div className="space-y-2">
                  {participant.team_members.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          <span>{m.name || 'Member'}</span>
                          {idx === 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Crown className="w-2.5 h-2.5" /> LEADER
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{m.college}</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 select-all">
                        {m.email} {m.phone && `• ${m.phone}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-500 fst-italic">
                  Solo Participant (Individual Registration)
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/[0.08] bg-[#161A22] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Unstop ID: {participant.internal_id || participant.id}</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-white transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
