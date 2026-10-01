import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-600 shrink-0" />
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-medium shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      {icons[toast.type || 'info']}
      <span className="leading-snug">{toast.message}</span>
      <button 
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded hover:bg-slate-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
