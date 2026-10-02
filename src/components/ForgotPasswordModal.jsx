// src/components/ForgotPasswordModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldAlert, 
  PhoneCall, 
  MessageSquare, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  OFFICIAL_ACCOUNTS, 
  DOMAINS_DIRECTORY,
  adminAuthorizeAndResetPassword,
  DEFAULT_INITIAL_PASSWORD 
} from '../utils/auth';
import { addAuditLog } from '../utils/callStore';

export default function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  onSuccessReset 
}) {
  const [activeTab, setActiveTab] = useState('COORDINATOR'); // 'COORDINATOR' | 'ADMIN'
  
  // Tab 1 (Coordinator Assistance) state
  const [selectedDomainId, setSelectedDomainId] = useState('plexus');
  
  // Tab 2 (Admin On-Spot Reset) state
  const [adminIdentifier, setAdminIdentifier] = useState('sagaranmol@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [targetAccountUser, setTargetAccountUser] = useState('sumitbansal1290@gmail.com');
  const [resetType, setResetType] = useState('DEFAULT'); // 'DEFAULT' | 'CUSTOM'
  const [customPassword, setCustomPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter domain accounts
  const domainAccounts = OFFICIAL_ACCOUNTS.filter(a => a.role === 'domain_head');
  const selectedDomainAcc = OFFICIAL_ACCOUNTS.find(a => 
    a.domainId === selectedDomainId || a.username === selectedDomainId
  ) || domainAccounts[0];

  const handleAdminReset = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const passToSet = resetType === 'CUSTOM' ? customPassword.trim() : null;
        const result = adminAuthorizeAndResetPassword(
          adminIdentifier,
          adminPassword,
          targetAccountUser,
          passToSet
        );

        // Record in audit log
        addAuditLog({
          actorName: result.adminAccount.name,
          actorRole: result.adminAccount.role,
          actorTeam: 'Central Desk',
          action: 'ADMIN_ONSPOT_PASSWORD_RESET',
          targetId: result.targetAccount.username,
          targetName: result.targetAccount.name,
          eventName: 'Login Screen Access Recovery',
          prevStatus: 'FORGOT_PASSWORD',
          nextStatus: result.isDefault ? 'DEFAULT_RESTORED' : 'CUSTOM_SET',
          details: `Admin ${result.adminAccount.name} reset password for ${result.targetAccount.name} (${result.targetAccount.username}). Mode: ${result.isDefault ? 'Default Initial' : 'Custom Password'}`
        });

        setSuccessData(result);
        setIsSubmitting(false);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to authorize password reset.');
        setIsSubmitting(false);
      }
    }, 250);
  };

  const handleCopy = (text) => {
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUseAndLogin = () => {
    if (successData && onSuccessReset) {
      onSuccessReset(successData.targetAccount.username, successData.password);
      onClose();
    }
  };

  // WhatsApp template
  const coordName = selectedDomainAcc?.name || 'Coordinator';
  const coordDomain = selectedDomainAcc?.domainName || 'Domain Lead';
  const coordEmail = selectedDomainAcc?.username || '';
  const waMessage = `Hi Sagar / Raj bhaiya, I am ${coordName} (${coordDomain} Lead). I forgot my techFEST '26 portal password for official account ${coordEmail}. Please reset my password to default (Techfest@2026).`;
  const waUrl = `https://wa.me/919771174465?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Password Recovery & Reset Desk
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Central Operations Security • techFEST '26
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="p-3 bg-zinc-100/70 border-b border-zinc-200">
          <div className="flex rounded-xl bg-zinc-200/70 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('COORDINATOR');
                setErrorMsg('');
                setSuccessData(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'COORDINATOR'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Domain Coordinator Help
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ADMIN');
                setErrorMsg('');
                setSuccessData(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ADMIN'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Admin On-Spot Reset</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Domain Coordinator Help */}
        {activeTab === 'COORDINATOR' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Central Security Policy:</span>
                <span>
                  All domain lead accounts are protected. If you forgot your customized password, Central Desk Admins (Sagar Anmol or Raj Aryan) can instantly reset your account back to <strong className="font-mono text-amber-950">{DEFAULT_INITIAL_PASSWORD}</strong>.
                </span>
              </div>
            </div>

            {/* Select Your Domain */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Select Your Domain / Role:
              </label>
              <select
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
                className="w-full bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none shadow-xs font-medium"
              >
                {OFFICIAL_ACCOUNTS.filter(a => a.role === 'domain_head' || a.role === 'webdev' || a.role === 'operations_calling').map((acc) => (
                  <option key={acc.username} value={acc.domainId || acc.username}>
                    {acc.domainName ? `${acc.domainName} (${acc.name} - ${acc.bay || 'Desk'})` : `${acc.name} (${acc.username})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Account Card */}
            {selectedDomainAcc && (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Coordinator:</span>
                  <span className="text-zinc-900 font-semibold">{selectedDomainAcc.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Official Email:</span>
                  <span className="text-zinc-900 font-semibold">{selectedDomainAcc.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Bay / Location:</span>
                  <span className="text-zinc-900 font-semibold">{selectedDomainAcc.bay || 'Operations'}</span>
                </div>
              </div>
            )}

            {/* Direct Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Request Reset on WhatsApp (+91 97711 74465)</span>
              </a>

              <a
                href="tel:+919771174465"
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-zinc-600" />
                <span>Call Sagar Anmol (Central Operations Lead)</span>
              </a>
            </div>

            <div className="pt-2 text-center text-[11px] text-zinc-400">
              For immediate technical assistance: <span className="font-semibold text-zinc-600">raj.aryan@gmail.com</span>
            </div>
          </div>
        )}

        {/* Tab 2: Admin Master On-Spot Reset */}
        {activeTab === 'ADMIN' && (
          <div className="p-5 overflow-y-auto space-y-4">
            {successData ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950">Password Successfully Updated!</h4>
                  <p className="text-xs text-emerald-800">
                    The credentials for <strong>{successData.targetAccount.name}</strong> have been updated and synced to the cloud.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Account:</span>
                    <span className="text-zinc-900 font-semibold">{successData.targetAccount.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Login Email:</span>
                    <span className="text-zinc-900 font-semibold">{successData.targetAccount.username}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-200">
                    <span className="text-zinc-500">New Password:</span>
                    <span className="text-emerald-700 font-bold text-sm select-all">{successData.password}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(`Domain: ${successData.targetAccount.domainName || 'TechFEST'}\nEmail: ${successData.targetAccount.username}\nPassword: ${successData.password}`)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Details' : 'Copy Credentials'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUseAndLogin}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Auto-Fill & Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdminReset} className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px]">
                  Authorize with your Super Admin credentials to change or reset any domain lead's password on the spot.
                </div>

                {/* Field 1: Admin Selection */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Super Admin Identity:
                  </label>
                  <select
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    className="w-full bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none font-medium shadow-xs"
                  >
                    <option value="sagaranmol@gmail.com">Sagar Anmol (sagaranmol@gmail.com)</option>
                    <option value="raj.aryan@gmail.com">Raj Aryan (raj.aryan@gmail.com)</option>
                  </select>
                </div>

                {/* Field 2: Admin Password */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Your Admin Master Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? "text" : "password"}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter Sagar or Raj's password"
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl pl-3 pr-9 py-2 text-xs text-zinc-900 outline-none font-mono shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Field 3: Target Account */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">
                    Target Domain Lead to Reset:
                  </label>
                  <select
                    value={targetAccountUser}
                    onChange={(e) => setTargetAccountUser(e.target.value)}
                    className="w-full bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none font-medium shadow-xs"
                  >
                    {OFFICIAL_ACCOUNTS.map((acc) => (
                      <option key={acc.username} value={acc.username}>
                        {acc.domainName ? `[${acc.domainName}] ${acc.name} (${acc.username})` : `${acc.name} (${acc.username})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 4: Reset Action Type */}
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1.5">
                    Reset Action:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setResetType('DEFAULT')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                        resetType === 'DEFAULT'
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="font-semibold text-xs">Reset to Default</div>
                      <div className="text-[10px] opacity-80 font-mono mt-0.5">{DEFAULT_INITIAL_PASSWORD}</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResetType('CUSTOM')}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                        resetType === 'CUSTOM'
                          ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="font-semibold text-xs">Set Custom Pass</div>
                      <div className="text-[10px] opacity-80 mt-0.5">Type new password</div>
                    </button>
                  </div>
                </div>

                {/* Field 5: Custom Password input if chosen */}
                {resetType === 'CUSTOM' && (
                  <div className="animate-in fade-in duration-100">
                    <label className="block font-semibold text-zinc-700 mb-1">
                      New Password for Coordinator:
                    </label>
                    <input
                      type="text"
                      required
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Enter new password (min 4 chars)"
                      className="w-full bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none font-mono shadow-xs"
                    />
                  </div>
                )}

                {/* Error Box */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Authorizing Reset..." : "Authorize & Apply Password Reset"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <span>techFEST '26 • SLIET Longowal</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-900"
          >
            Close
          </Button>
        </div>

      </div>
    </div>
  );
}
