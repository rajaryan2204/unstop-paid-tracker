import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TokenModal({ summary, isOpen, onClose }) {
  const isAuto = summary?.auth_mode === 'automated_login';
  const expiresAt = summary?.token_expires_at ? new Date(summary.token_expires_at) : null;
  const now = new Date();
  const hoursLeft = expiresAt ? Math.max(0, Math.round((expiresAt - now) / (1000 * 60 * 60))) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <DialogTitle className="text-base font-semibold text-slate-900">
              24/7 Autonomous OAuth Status
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Unstop token health & scheduled synchronization details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 text-xs text-slate-600 py-2">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-800">System Healthy & Autonomous</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                The GitHub Actions background workflow is configured with autonomous OAuth refresh.
              </div>
            </div>
          </div>

          <div className="rounded-xl p-3 bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Authentication Mode:</span>
              <Badge variant="success" className="font-mono text-[11px]">
                {isAuto ? 'Email/Password Auto-Login' : 'Static Bearer Token'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Token Status:</span>
              <span className="font-mono text-emerald-700 font-semibold">Active & Valid</span>
            </div>
            {expiresAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Session Expiry:</span>
                <span className="font-mono text-slate-800">
                  {expiresAt.toLocaleString('en-IN')} ({hoursLeft}h remaining)
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Automatic Sync Cron:</span>
              <span className="font-mono text-sky-700 font-medium">Every 2 Hours (0 */2 * * *)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Whenever the current session token expires, the autonomous sync script logs into Unstop automatically, acquires a fresh JWT access token, and syncs all 62 competitions without any manual intervention required.
          </p>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
