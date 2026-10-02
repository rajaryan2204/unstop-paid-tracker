// src/components/PasswordManagerModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  Search, 
  RotateCcw, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Lock, 
  Sparkles,
  ArrowRight,
  Copy,
  CheckCircle2,
  Share2,
  Users,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  OFFICIAL_ACCOUNTS, 
  DOMAINS_DIRECTORY,
  getPasswordForAccount, 
  setAccountPassword, 
  resetAccountPasswordToDefault,
  hasAccountCustomPassword,
  DEFAULT_INITIAL_PASSWORD 
} from '../utils/auth';
import { addAuditLog } from '../utils/callStore';

export default function PasswordManagerModal({ 
  isOpen, 
  currentUser, 
  onClose, 
  onTriggerToast 
}) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('DOMAINS'); // 'ALL' | 'DOMAINS' | 'STAFF' | 'ADMINS'
  const [editingUsername, setEditingUsername] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  if (!isOpen) return null;

  // Filter accounts based on tab and search
  const filteredAccounts = OFFICIAL_ACCOUNTS.filter(acc => {
    // Tab filter
    if (activeTab === 'DOMAINS' && acc.role !== 'domain_head') return false;
    if (activeTab === 'STAFF' && acc.role !== 'webdev' && acc.role !== 'operations_calling') return false;
    if (activeTab === 'ADMINS' && acc.role !== 'super_admin') return false;

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = (acc.name || '').toLowerCase().includes(q);
      const matchUser = (acc.username || '').toLowerCase().includes(q);
      const matchEmail = (acc.email || '').toLowerCase().includes(q);
      const matchDomain = (acc.domainName || '').toLowerCase().includes(q);
      const matchBay = (acc.bay || '').toLowerCase().includes(q);
      const matchAlias = (acc.aliasUsername || '').toLowerCase().includes(q);
      return matchName || matchUser || matchEmail || matchDomain || matchBay || matchAlias;
    }

    return true;
  });

  const domainCount = OFFICIAL_ACCOUNTS.filter(a => a.role === 'domain_head').length;
  const customCount = OFFICIAL_ACCOUNTS.filter(a => hasAccountCustomPassword(a.username)).length;
  const defaultCount = OFFICIAL_ACCOUNTS.length - customCount;

  const togglePasswordVisibility = (username) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  const handleStartEdit = (acc) => {
    setEditingUsername(acc.username);
    setNewPassword(getPasswordForAccount(acc.username));
  };

  const handleCancelEdit = () => {
    setEditingUsername(null);
    setNewPassword('');
  };

  const handleSavePassword = (e, acc) => {
    e.preventDefault();
    if (!acc || !newPassword.trim()) return;

    if (newPassword.trim().length < 4) {
      if (onTriggerToast) {
        onTriggerToast({
          type: 'error',
          message: 'Password must be at least 4 characters long.'
        });
      }
      return;
    }

    try {
      setAccountPassword(currentUser, acc.username, newPassword.trim());

      addAuditLog({
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorTeam: currentUser.teamName || 'Central Desk',
        action: 'PASSWORD_CHANGE',
        targetId: acc.username,
        targetName: acc.name,
        eventName: 'Central Access Control',
        prevStatus: hasAccountCustomPassword(acc.username) ? 'CUSTOM' : 'DEFAULT',
        nextStatus: 'UPDATED',
        details: `Super Admin ${currentUser.name} updated password for ${acc.name} (${acc.username})`
      });

      setRefreshVersion(v => v + 1);
      setEditingUsername(null);
      setNewPassword('');

      if (onTriggerToast) {
        onTriggerToast({
          type: 'success',
          message: `Password updated successfully for ${acc.name}`
        });
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast({
          type: 'error',
          message: err.message || 'Failed to update password'
        });
      }
    }
  };

  const handleResetToDefault = (acc) => {
    try {
      resetAccountPasswordToDefault(currentUser, acc.username);

      addAuditLog({
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorTeam: currentUser.teamName || 'Central Desk',
        action: 'PASSWORD_RESET',
        targetId: acc.username,
        targetName: acc.name,
        eventName: 'Central Access Control',
        prevStatus: 'CUSTOM',
        nextStatus: 'DEFAULT_INITIAL',
        details: `Super Admin ${currentUser.name} reset password to default (${DEFAULT_INITIAL_PASSWORD}) for ${acc.name}`
      });

      setRefreshVersion(v => v + 1);

      if (onTriggerToast) {
        onTriggerToast({
          type: 'success',
          message: `Password reset to default (${DEFAULT_INITIAL_PASSWORD}) for ${acc.name}`
        });
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast({
          type: 'error',
          message: err.message || 'Failed to reset password'
        });
      }
    }
  };

  const copyToClipboard = (text, key) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
      if (onTriggerToast) {
        onTriggerToast({
          type: 'success',
          message: 'Copied to clipboard!'
        });
      }
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const copyWhatsAppCredentials = (acc) => {
    const currentPass = getPasswordForAccount(acc.username);
    const domainText = acc.domainName ? `Domain: ${acc.domainName} (${acc.bay || ''})\n` : '';
    const msg = `⚡ techFEST '26 Operations Portal Login Credentials\n${domainText}Coordinator: ${acc.name}\nOfficial Email: ${acc.username}\nPassword: ${currentPass}\n\nLogin URL: https://sliet-techfest.web.app\n⚠️ Change your password upon initial sign-in.`;
    copyToClipboard(msg, `full_${acc.username}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">
                  Central Desk Password & Credentials Manager
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 text-white font-semibold">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Full authority to change or reset passwords for any of the 13 Domain Leads and Staff
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

        {/* Stats Strip */}
        <div className="px-4 py-2.5 bg-zinc-100/70 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-zinc-600">
            <span>
              Total Accounts: <strong className="text-zinc-900 font-mono">{OFFICIAL_ACCOUNTS.length}</strong>
            </span>
            <span className="text-zinc-300">•</span>
            <span>
              13 Domain Heads: <strong className="text-zinc-900 font-mono">{domainCount}</strong>
            </span>
            <span className="text-zinc-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Custom Active: <strong className="text-emerald-700 font-mono">{customCount}</strong></span>
            </span>
            <span className="text-zinc-300">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Default Initial: <strong className="text-amber-800 font-mono">{defaultCount}</strong></span>
            </span>
          </div>

          <div className="text-[11px] text-zinc-500 font-mono">
            Default Pass: <span className="font-semibold text-zinc-700">{DEFAULT_INITIAL_PASSWORD}</span>
          </div>
        </div>

        {/* Controls: Search & Tabs */}
        <div className="p-3 sm:p-4 bg-white border-b border-zinc-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('DOMAINS')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'DOMAINS' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                13 Domain Heads ({domainCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('STAFF')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'STAFF' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Staff & Ops (2)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ADMINS')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'ADMINS' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Central Admins (2)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'ALL' 
                    ? 'bg-white text-zinc-900 shadow-xs' 
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All (17)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domain, lead name, email..."
                className="w-full bg-zinc-50 border border-zinc-200 focus:border-zinc-900 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 outline-none shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-zinc-50/50">
          {filteredAccounts.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs font-mono">
              No matching accounts found for "{search}".
            </div>
          ) : (
            filteredAccounts.map((acc) => {
              const currentPass = getPasswordForAccount(acc.username);
              const isRevealed = visiblePasswords[acc.username];
              const isEditing = editingUsername === acc.username;
              const hasCustom = hasAccountCustomPassword(acc.username);
              const domainMeta = acc.domainId ? DOMAINS_DIRECTORY[acc.domainId] : null;

              return (
                <div
                  key={acc.username}
                  className="p-3.5 sm:p-4 rounded-xl bg-white border border-zinc-200/90 shadow-2xs hover:border-zinc-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Left: Account Identity & Domain */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border"
                        style={{
                          backgroundColor: domainMeta?.accentColor ? `${domainMeta.accentColor}15` : '#F4F4F5',
                          borderColor: domainMeta?.accentColor ? `${domainMeta.accentColor}40` : '#E4E4E7',
                          color: domainMeta?.accentColor || '#18181B'
                        }}
                      >
                        {acc.avatar || 'TF'}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-zinc-900 truncate">
                            {acc.name}
                          </span>
                          
                          {acc.domainName && (
                            <span 
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                              style={{
                                backgroundColor: `${domainMeta?.accentColor || '#38BDF8'}15`,
                                borderColor: `${domainMeta?.accentColor || '#38BDF8'}30`,
                                color: domainMeta?.accentColor || '#0284C7'
                              }}
                            >
                              {acc.domainName}
                            </span>
                          )}

                          {acc.bay && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {acc.bay}
                            </span>
                          )}

                          {/* Password Status Pill */}
                          {hasCustom ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Custom Password</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Initial Default</span>
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
                          <span>Login Email: <strong className="text-zinc-800 font-semibold">{acc.username}</strong></span>
                          {acc.aliasUsername && (
                            <span className="text-zinc-400">
                              (Alias: <code className="text-zinc-600">{acc.aliasUsername}</code>)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Password Box & Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                      
                      {/* Password Display Box */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono shadow-2xs">
                        <Lock className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-800 font-medium select-all">
                          {isRevealed ? currentPass : '••••••••••••'}
                        </span>
                        
                        {/* Show/Hide */}
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(acc.username)}
                          className="text-zinc-400 hover:text-zinc-800 ml-1 cursor-pointer transition-colors"
                          title={isRevealed ? 'Hide Password' : 'Show Password'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        {/* Copy Password */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(currentPass, `pass_${acc.username}`)}
                          className="text-zinc-400 hover:text-zinc-800 ml-0.5 cursor-pointer transition-colors"
                          title="Copy Password"
                        >
                          {copiedKey === `pass_${acc.username}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* WhatsApp Share / Copy Full Creds */}
                      <button
                        type="button"
                        onClick={() => copyWhatsAppCredentials(acc)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Copy complete formatted credentials for WhatsApp"
                      >
                        {copiedKey === `full_${acc.username}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="hidden sm:inline">Copy Card</span>
                          </>
                        )}
                      </button>

                      {/* Change Password Button */}
                      <button
                        type="button"
                        onClick={() => isEditing ? handleCancelEdit() : handleStartEdit(acc)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                          isEditing
                            ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                        }`}
                      >
                        {isEditing ? 'Cancel' : 'Change'}
                      </button>

                      {/* Reset to Default Button */}
                      <button
                        type="button"
                        onClick={() => handleResetToDefault(acc)}
                        disabled={!hasCustom}
                        title={hasCustom ? `Reset password to default (${DEFAULT_INITIAL_PASSWORD})` : 'Already on default initial password'}
                        className={`p-2 rounded-xl transition-all cursor-pointer border ${
                          hasCustom
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-2xs'
                            : 'bg-zinc-50 text-zinc-300 border-zinc-200 cursor-not-allowed'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>

                  {/* Inline Edit Form */}
                  {isEditing && (
                    <form 
                      onSubmit={(e) => handleSavePassword(e, acc)} 
                      className="mt-3 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in duration-100"
                    >
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          required
                          autoFocus
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new custom password (min 4 chars)"
                          className="w-full bg-white border border-zinc-300 focus:border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-900 outline-none font-mono shadow-xs"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Password</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All modifications are cryptographically synced with Neon Cloud PostgreSQL and logged in Central Audit Trail.
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-zinc-700 bg-white hover:bg-zinc-100 border-zinc-200 shadow-xs self-end sm:self-auto cursor-pointer"
          >
            Done
          </Button>
        </div>

      </div>
    </div>
  );
}
