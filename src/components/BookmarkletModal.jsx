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
      <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <DialogTitle className="text-base font-semibold text-slate-900">
              1-Click Unstop Sync Tool
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Drag and drop this button to your browser's Bookmarks bar for 1-click token extraction and sync.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 text-xs text-slate-600 py-2">
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-mono">
              <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
              <span>Drag this button to Bookmarks Bar</span>
            </div>
            <div>
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please DRAG this button to your browser Bookmarks Bar (Cmd/Ctrl + Shift + B)!");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-all cursor-grab active:cursor-grabbing shadow-xs"
              >
                <Zap className="w-4 h-4 fill-slate-900" />
                <span>⚡ Sync techFEST '26</span>
              </a>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Works on Chrome, Edge, Brave, Safari, Firefox
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900">How it works:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 leading-relaxed">
              <li>Open <a href="https://unstop.com" target="_blank" rel="noreferrer" className="text-sky-600 font-medium hover:underline inline-flex items-center gap-0.5">unstop.com <ExternalLink className="w-2.5 h-2.5" /></a> and ensure you are logged in.</li>
              <li>Click the saved bookmark in your bookmarks bar.</li>
              <li>It auto-extracts your session token and opens GitHub Actions to trigger the sync.</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-slate-700 border-slate-200 hover:bg-slate-100"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
