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
  ArrowRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  OFFICIAL_ACCOUNTS, 
  getPasswordForAccount, 
  setAccountPassword, 
  resetAccountPasswordToDefault 
} from '../utils/auth';
import { addAuditLog } from '../utils/callStore';

export default function PasswordManagerModal({ 
  isOpen, 
  currentUser, 
  onClose, 
  onTriggerToast 
}) {
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [refreshVersion, setRefreshVersion] = useState(0);

  if (!isOpen) return null;

  // Filter accounts for password management
  const targetAccounts = OFFICIAL_ACCOUNTS.filter(a => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchUser = a.username.toLowerCase().includes(q);
      const matchBay = (a.bay || '').toLowerCase().includes(q);
      return matchName || matchUser || matchBay;
    }
    return true;
  });

  const togglePasswordVisibility = (username) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  const handleStartEdit = (acc) => {
    setEditingUser(acc);
    setNewPassword(getPasswordForAccount(acc.username));
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!editingUser || !newPassword.trim()) return;

    try {
      setAccountPassword(currentUser, editingUser.username, newPassword.trim());

      addAuditLog({
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorTeam: currentUser.teamName || 'Central Desk',
        action: 'PASSWORD_RESET',
        targetId: editingUser.username,
        targetName: editingUser.name,
        eventName: 'Security & Access Control',
        prevStatus: 'CUSTOM',
        nextStatus: 'UPDATED',
        details: `Reset password for ${editingUser.name} (${editingUser.username})`
      });

      setRefreshVersion(v => v + 1);
      setEditingUser(null);
      setNewPassword('');

      if (onTriggerToast) {
        onTriggerToast({
          type: 'success',
          message: `Password updated for ${editingUser.name}`
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
        eventName: 'Security & Access Control',
        prevStatus: 'MODIFIED',
        nextStatus: 'DEFAULT',
        details: `Restored default password (${acc.defaultPassword}) for ${acc.name}`
      });

      setRefreshVersion(v => v + 1);

      if (onTriggerToast) {
        onTriggerToast({
          type: 'success',
          message: `Password reset to default for ${acc.name}`
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Central Desk Password Manager</h3>
                <Badge variant="purple" className="text-[10px] font-mono">
                  Super Admin Exclusive
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage and reset access credentials for 13 Domain Heads and Operations Calling Desks
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-50/50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domain name, username, or bay code..."
              className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none shadow-xs"
            />
          </div>
        </div>

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-slate-50/30">
          {targetAccounts.map((acc) => {
            const currentPass = getPasswordForAccount(acc.username);
            const isRevealed = visiblePasswords[acc.username];
            const isEditing = editingUser?.username === acc.username;

            return (
              <div
                key={acc.username}
                className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Account Metadata */}
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
                      {acc.avatar || 'TF'}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{acc.name}</span>
                        {acc.bay && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {acc.bay}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Username: <span className="text-sky-700 font-semibold">{acc.username}</span>
                      </div>
                    </div>
                  </div>

                  {/* Password & Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    
                    {/* Password Display Box */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
                      <span className="text-slate-700">
                        {isRevealed ? currentPass : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(acc.username)}
                        className="text-slate-400 hover:text-slate-700 ml-1"
                        title={isRevealed ? 'Hide Password' : 'Show Password'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Change Button */}
                    <button
                      onClick={() => handleStartEdit(acc)}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition-all shadow-xs"
                    >
                      Change
                    </button>

                    {/* Reset to Default Button */}
                    <button
                      onClick={() => handleResetToDefault(acc)}
                      title={`Reset to default (${acc.defaultPassword})`}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>

                {/* Inline Editing Form */}
                {isEditing && (
                  <form onSubmit={handleSavePassword} className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="flex-1 bg-white border border-slate-300 focus:border-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none font-mono shadow-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 text-xs"
                    >
                      Cancel
                    </button>
                  </form>
                )}

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>All password resets are logged in the Central Operations Audit Trail</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-slate-700 bg-white hover:bg-slate-100 border-slate-200 shadow-xs"
          >
            Done
          </Button>
        </div>

      </div>
    </div>
  );
}
