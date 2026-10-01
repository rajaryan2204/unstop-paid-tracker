// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authenticateUser } from '../utils/auth';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = authenticateUser(username, password);
      if (!res.success) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      onLoginSuccess(res.user);
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative select-none">
      
      {/* Background Decorative Blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-200/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-base mx-auto shadow-md mb-3">
            TF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            techFEST '26
          </h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
            Central Organizer Operations Desk
          </p>
          <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Enter your designated domain or staff credentials to access your operations portal.
          </p>
        </div>

        {/* Credentials Form Card */}
        <Card className="bg-white border-slate-200 shadow-xl rounded-2xl p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field 1: Username */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Username / Domain ID
                </label>
                <span className="text-[10px] font-mono text-slate-400">e.g. plexus, mechanica, raj, sagar</span>
              </div>
              <div className="relative">
                <Input
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter domain name or staff ID"
                  className="pl-10 text-sm bg-white border-slate-200 text-slate-900 h-11"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Password
                </label>
                <span className="text-[10px] font-mono text-slate-400">Official Passkey</span>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter security key"
                  className="pl-10 pr-10 text-sm bg-white border-slate-200 text-slate-900 h-11"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !username.trim() || !password.trim()}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Operations Desk'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

          </form>

          {/* Quick Login Chips for Conveniences */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Quick Login (Click to fill)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => { setUsername('raj'); setPassword('raj@tf26'); setError(''); }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-sky-600">Raj (Super Admin)</div>
                <div className="text-[10px] text-slate-400 font-mono">raj@tf26</div>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('sagar'); setPassword('sagar@tf26'); setError(''); }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-sky-600">Sagar (Super Admin)</div>
                <div className="text-[10px] text-slate-400 font-mono">sagar@tf26</div>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('plexus'); setPassword('plexus@tf26'); setError(''); }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-sky-600">Plexus (CSE/IT)</div>
                <div className="text-[10px] text-slate-400 font-mono">plexus@tf26</div>
              </button>
              <button
                type="button"
                onClick={() => { setUsername('mechanica'); setPassword('mechanica@tf26'); setError(''); }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-all group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-sky-600">Mechanica (Mechanical)</div>
                <div className="text-[10px] text-slate-400 font-mono">mechanica@tf26</div>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role-Scoped Security • SLIET Longowal</span>
        </div>

      </div>
    </div>
  );
}
