import React from 'react';
import { Zap, ArrowDown, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function BookmarkletModal({ isOpen, onClose }) {
  const bookmarkletCode = `javascript:(function(){
    var token = localStorage.getItem('token') || (document.cookie.match(/access_token=([^;]+)/)||[])[1];
    if(!token){
      alert('⚠️ Unstop Token not found! Please log in to Unstop first.');
      return;
    }
    window.open('https://github.com/sagar-anmol/unstop-paid-tracker/actions/workflows/sync.yml', '_blank');
    navigator.clipboard.writeText(token);
    alert('✅ Fresh Unstop Token copied to clipboard! Opening GitHub Actions to run sync.');
  })();`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#11141A] border-white/[0.1] text-white">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <DialogTitle className="text-base font-semibold text-white">
              1-Click Unstop Sync Tool
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Drag and drop this button to your browser's Bookmarks bar for 1-click token extraction and sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 text-xs text-slate-300 py-2">
          <div className="p-4 rounded-xl border border-dashed border-white/20 bg-black/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 font-mono">
              <ArrowDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Drag this button to Bookmarks Bar</span>
            </div>
            <div>
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please DRAG this button to your browser Bookmarks Bar (Cmd/Ctrl + Shift + B)!");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 transition-all cursor-grab active:cursor-grabbing shadow-lg"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>⚡ Sync techFEST '26</span>
              </a>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Works on Chrome, Edge, Brave, Safari, Firefox
            </div>
          </div>

          <div className="rounded-xl p-3 bg-[#161A22] border border-white/[0.06] space-y-1.5 text-[11.5px]">
            <div className="font-semibold text-white">How it works:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Open your Unstop Organiser Dashboard in your browser.</li>
              <li>Click this bookmark on your bookmarks bar.</li>
              <li>It automatically grabs your session token and triggers live sync.</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="border-t border-white/[0.08] pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-white/[0.1] bg-white/[0.04] text-white hover:bg-white/[0.08]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
