// src/components/CallRemarkModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  Check, 
  AlertCircle, 
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  Settings2
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
import { getDeviceInfo, setCustomDeviceName, getCustomDeviceName } from '../utils/device';

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
  const [deviceInfo, setDeviceInfo] = useState(() => getDeviceInfo());
  const [isEditingStation, setIsEditingStation] = useState(false);
  const [stationName, setStationName] = useState(() => getCustomDeviceName());

  const existingRecord = participant ? getParticipantCallRecord(participant.id) : null;
  const nextCallNum = (existingRecord?.callCount || 0) + 1;

  useEffect(() => {
    if (participant) {
      setRemark('');
      setSelectedStatus('');
      setHasError(false);
      setLeadNumber(existingRecord?.leadNumber || participant.phone || '');
      setDeviceInfo(getDeviceInfo());
      setStationName(getCustomDeviceName());
      setIsEditingStation(false);
    }
  }, [participant]);

  const handleSaveStation = (e) => {
    e.preventDefault();
    setCustomDeviceName(stationName);
    setDeviceInfo(getDeviceInfo());
    setIsEditingStation(false);
  };

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
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900 p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-sm font-semibold text-slate-900">Log Call Details</DialogTitle>
                <Badge variant="warning" className="text-[10px] font-mono">
                  Call #{nextCallNum}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Calling as <span className="text-sky-700 font-semibold">{currentUser?.name}</span> ({currentUser?.teamName || 'Staff'})
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Candidate Context Pill */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="truncate mr-2">
            <span className="text-slate-500">Candidate: </span>
            <span className="font-semibold text-slate-900">{participant.name}</span>
            <span className="text-slate-400 mx-2">•</span>
            <span className="text-slate-600 font-medium">{participant.event_name}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRedial}
            className="h-7 px-2.5 text-[11px] font-mono text-sky-700 hover:text-sky-800 hover:bg-sky-100/60 border border-sky-200 bg-white"
            title="Redial via phone app"
          >
            <Phone className="w-3 h-3 mr-1" />
            <span>Redial</span>
          </Button>
        </div>

        {/* Active Caller Device Recognition Bar */}
        <div className="px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5 text-zinc-600 truncate">
              <span className="text-[11px] text-zinc-500">Device:</span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-zinc-800 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-2xs">
                {deviceInfo.deviceType === 'mobile' ? (
                  <Smartphone className="w-3 h-3 text-zinc-600 shrink-0" />
                ) : deviceInfo.deviceType === 'tablet' ? (
                  <Tablet className="w-3 h-3 text-zinc-600 shrink-0" />
                ) : (
                  <Laptop className="w-3 h-3 text-zinc-600 shrink-0" />
                )}
                <span className="truncate max-w-[180px] sm:max-w-[260px]">
                  {deviceInfo.deviceName}
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingStation(!isEditingStation)}
            className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
            title="Customize device nickname or station"
          >
            <Settings2 className="w-3 h-3" />
            <span>{isEditingStation ? 'Close' : 'Nickname'}</span>
          </button>
        </div>

        {/* Optional Custom Device Station Editor */}
        {isEditingStation && (
          <form onSubmit={handleSaveStation} className="px-5 py-2.5 bg-zinc-100/90 border-b border-zinc-200 flex items-center gap-2 animate-in fade-in duration-150">
            <input
              type="text"
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              placeholder="e.g. Plexus Desk #1 or Sagar's iPhone"
              className="flex-1 bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs text-zinc-900 outline-none focus:border-zinc-900"
              autoFocus
            />
            <Button type="submit" size="sm" className="h-7 text-xs px-2.5 bg-zinc-900 text-white hover:bg-zinc-800">
              Save
            </Button>
          </form>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Field 1: Remark */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Enter call remarks & notes</span>
              <span className="text-[10px] font-mono text-slate-400">Summary</span>
            </label>
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Spoke with candidate, promised payment tonight via UPI, requested brochure on WhatsApp..."
              className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all resize-none shadow-xs"
              autoFocus
            />
          </div>

          {/* Field 2: Lead Number */}
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Lead Number</span>
              <span className="text-[10px] font-mono text-slate-400">Alternate phone / WhatsApp</span>
            </label>
            <Input
              type="text"
              value={leadNumber}
              onChange={(e) => setLeadNumber(e.target.value)}
              placeholder="e.g. 9876543210 (Direct candidate number)"
              className="font-mono text-xs bg-white border-slate-200 text-slate-900"
            />
          </div>

          {/* Field 3: Compulsory Status Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <span>Select Call Status</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[10px] font-mono text-amber-700 font-medium">
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
                        ? `${st.badge} ring-2 ring-slate-900/10 shadow-xs font-medium`
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${st.indicator} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {st.shortLabel}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {hasError && (
              <p className="flex items-center gap-1 text-[11px] text-rose-600 mt-2 font-mono">
                <AlertCircle className="w-3.5 h-3.5" />
                Please select a call status before saving.
              </p>
            )}
          </div>

          {/* Notice for Payment Completed */}
          {selectedStatus === 'PAYMENT_CLAIMED' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">Moves to Verification Desk</p>
                <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                  This candidate will be added to the Payment Verification Queue. Scheduled Unstop sync will automatically match payment or flag as defaulter if unpaid.
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <DialogFooter className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!selectedStatus}
              className={selectedStatus ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs' : ''}
            >
              Save Call Record
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
