// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { 
  User, 
  KeyRound, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

  const quickLogins = [
    { label: "Sagar Anmol", user: "sagar", pass: "sagar@sliet", role: "Super Admin", variant: "default" },
    { label: "Raj Aryan", user: "raj", pass: "raj@sliet", role: "Super Admin", variant: "default" },
    { label: "Plexus", user: "plexus", pass: "plexus@sliet", role: "Robowars", variant: "outline" },
    { label: "Mechanica", user: "mechanica", pass: "mechanica@sliet", role: "CAD Bay", variant: "outline" },
    { label: "Calling Desk 1", user: "caller1", pass: "caller1@sliet", role: "Calling Desk", variant: "outline" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-zinc-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 relative select-none font-sans">
      
      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-xs mb-3">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            techFEST '26
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Central Organizer Operations Command Center
          </p>
        </div>

        {/* Credentials Form Card */}
        <div className="bg-white border border-zinc-200/80 shadow-xs rounded-2xl p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field 1: Username */}
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Username / Domain ID
              </label>
              <div className="relative">
                <input
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
                  placeholder="e.g. plexus, mechanica, raj, sagar"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 outline-none shadow-xs h-10 font-mono"
                />
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Field 2: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Password
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  &lt;username&gt;@sliet
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 outline-none shadow-xs h-10 font-mono"
                />
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <span>{isSubmitting ? "Authenticating..." : "Sign In to Operations Portal"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Access Roster Chips */}
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="text-[11px] font-medium text-zinc-400 mb-2.5">
              Quick Sign In:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickLogins.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUsername(item.user);
                    setPassword(item.pass);
                    setError('');
                    const res = authenticateUser(item.user, item.pass);
                    if (res.success) onLoginSuccess(res.user);
                  }}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    item.variant === 'default'
                      ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-400 mt-6">
          SLIET Longowal • techFEST '26 Core Operations Team
        </p>
      </div>
    </div>
  );
}
