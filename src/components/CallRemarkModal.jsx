// src/components/CallRemarkModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  Check, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CALL_STATUSES, getParticipantCallRecord } from '../utils/callStore';

export default function CallRemarkModal({ 
  isOpen, 
  participant, 
  currentUser, 
  onClose, 
  onSubmit 
}) {
  const [remark, setRemark] = useState('');
  const [leadNumber, setLeadNumber] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [hasError, setHasError] = useState(false);

  const existingRecord = participant ? getParticipantCallRecord(participant.id) : null;
  const nextCallNum = (existingRecord?.callCount || 0) + 1;

  useEffect(() => {
    if (participant) {
      setRemark('');
      setSelectedStatus('');
      setHasError(false);
      setLeadNumber(existingRecord?.leadNumber || participant.phone || '');
    }
  }, [participant]);

  if (!isOpen || !participant) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      setHasError(true);
      return;
    }

    onSubmit({
      participant,
      callerUser: currentUser,
      remark: remark.trim() || 'Call completed.',
      leadNumber: leadNumber.trim(),
      status: selectedStatus
    });
    onClose();
  };

  const handleRedial = () => {
    if (participant.phone && participant.phone !== 'N/A') {
      window.open(`tel:${participant.phone}`, '_self');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-[#11141A] border-white/[0.1] text-white p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] bg-[#161A22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-semibold text-white">Log Call Details</DialogTitle>
                <Badge variant="warning" className="text-[10px] font-mono">
                  Call #{nextCallNum}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-400 mt-0.5">
                Calling as <span className="text-sky-300 font-medium">{currentUser?.name}</span> ({currentUser?.teamName || 'Staff'})
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Candidate Context Pill */}
        <div className="px-5 py-3 bg-[#151922] border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div className="truncate mr-2">
            <span className="text-slate-400">Candidate: </span>
            <span className="font-semibold text-white">{participant.name}</span>
            <span className="text-slate-500 mx-2">•</span>
            <span className="text-slate-300">{participant.event_name}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRedial}
            className="h-7 px-2 text-[11px] font-mono text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/20"
            title="Redial via phone app"
          >
            <Phone className="w-3 h-3 mr-1" />
            <span>Redial</span>
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Field 1: Remark */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Enter the remark of the call</span>
              <span className="text-[10px] font-mono text-slate-500">Summary notes</span>
            </label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Spoke with candidate, promised payment tonight via UPI, father asked to send brochure on WhatsApp..."
              className="w-full bg-[#0B0D11] border border-white/[0.08] focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none"
              autoFocus
            />
          </div>

          {/* Field 2: Lead Number */}
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Lead Number</span>
              <span className="text-[10px] font-mono text-slate-500">Alternate phone / WhatsApp ID</span>
            </label>
            <Input
              type="text"
              value={leadNumber}
              onChange={(e) => setLeadNumber(e.target.value)}
              placeholder="e.g. 9876543210 (Direct candidate number)"
              className="font-mono text-xs"
            />
          </div>

          {/* Field 3: Compulsory Status Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span>Select Call Status</span>
                <span className="text-rose-400 font-bold">*</span>
              </label>
              <span className="text-[10px] font-mono text-amber-400">
                Compulsory Selection
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.values(CALL_STATUSES).map((st) => {
                const isSelected = selectedStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(st.id);
                      setHasError(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${st.badge} ring-1 ring-offset-1 ring-offset-[#11141A] shadow-md`
                        : 'bg-[#151922] border-white/[0.06] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${st.indicator} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5 opacity-80">
                        {st.shortLabel}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {hasError && (
              <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                Please select a call status before saving.
              </p>
            )}
          </div>

          {/* Notice for Payment Completed */}
          {selectedStatus === 'PAYMENT_CLAIMED' && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">Moves to Verification Desk</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  This candidate will be added to the Payment Verification Queue. The midnight Unstop sync will automatically match payment or flag as defaulter if unpaid.
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <DialogFooter className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedStatus}
              className={selectedStatus ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20' : ''}
            >
              Save Call Record
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
