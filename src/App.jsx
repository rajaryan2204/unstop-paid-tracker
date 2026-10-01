// src/App.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import KPIStrip from './components/KPIStrip';
import AnalyticsChart from './components/AnalyticsChart';
import DataTable from './components/DataTable';
import CandidateDrawer from './components/CandidateDrawer';
import TokenModal from './components/TokenModal';
import BookmarkletModal from './components/BookmarkletModal';
import CallRemarkModal from './components/CallRemarkModal';
import AuthModal from './components/AuthModal';
import AuditLogsModal from './components/AuditLogsModal';
import VerificationQueueModal from './components/VerificationQueueModal';
import DomainBanner from './components/DomainBanner';
import LoginScreen from './components/LoginScreen';
import PasswordManagerModal from './components/PasswordManagerModal';
import Toast from './components/Toast';

import { exportParticipantsToCSV } from './utils/csv';
import { 
  getActiveUser, 
  setActiveUser, 
  clearActiveUser,
  getParticipantsForUser, 
  DOMAINS_DIRECTORY 
} from './utils/auth';
import { 
  logCallForParticipant, 
  getPaymentVerificationQueue, 
  CALL_STATUSES 
} from './utils/callStore';

import initialData from '../data.json';

export default function App() {
  const [participants, setParticipants] = useState(() => {
    if (initialData && Array.isArray(initialData.participants)) {
      return initialData.participants;
    }
    return [];
  });

  const [summary, setSummary] = useState(() => {
    if (initialData && initialData.summary) {
      return initialData.summary;
    }
    return {};
  });

  const [currentUser, setCurrentUser] = useState(() => getActiveUser());
  const [selectedDomainOverride, setSelectedDomainOverride] = useState('ALL');
  const [selectedEventFilter, setSelectedEventFilter] = useState('');
  const [callDbVersion, setCallDbVersion] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  
  // Modals state
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isTokenHealthOpen, setIsTokenHealthOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isVerificationQueueOpen, setIsVerificationQueueOpen] = useState(false);
  const [isPasswordManagerOpen, setIsPasswordManagerOpen] = useState(false);
  
  // Active call logging modal state
  const [callingCandidate, setCallingCandidate] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('tf_theme') || 'dark');

  // Trigger toast with auto-hide
  const triggerToast = useCallback((toastData) => {
    setToast(toastData);
    setTimeout(() => {
      setToast(current => current === toastData ? null : current);
    }, 3200);
  }, []);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('tf_theme', next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.style.color = '#0F172A';
    } else {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0B0D11';
      document.body.style.color = '#F5F7FA';
    }
  }, [theme]);

  // Load live data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else if (participants.length === 0) setIsLoading(true);

    try {
      const timestamp = Date.now();
      const urls = [
        `./data.json?t=${timestamp}`,
        `data.json?t=${timestamp}`,
        './data/summary.json',
        'https://raw.githubusercontent.com/sagar-anmol/unstop-paid-tracker/main/data.json'
      ];

      let loaded = false;
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.participants && Array.isArray(data.participants)) {
              setParticipants(data.participants);
              if (data.summary) setSummary(data.summary);
              loaded = true;
              break;
            } else if (Array.isArray(data)) {
              setParticipants(data);
              loaded = true;
              break;
            }
          }
        } catch (e) {
          // try next URL
        }
      }

      if (isManual) {
        triggerToast({ type: 'success', message: 'Dashboard updated with latest records' });
      }
    } catch (err) {
      if (isManual) {
        triggerToast({ type: 'error', message: 'Failed to refresh data' });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [participants.length, triggerToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Active domain identification
  const activeDomainId = useMemo(() => {
    if (currentUser?.role === 'domain_head') {
      return currentUser.domainId;
    }
    if (currentUser?.role === 'super_admin' && selectedDomainOverride !== 'ALL') {
      return selectedDomainOverride;
    }
    return null;
  }, [currentUser, selectedDomainOverride]);

  // Scoped participants according to active user & domain
  const scopedParticipants = useMemo(() => {
    return getParticipantsForUser(currentUser, participants, selectedDomainOverride);
  }, [currentUser, participants, selectedDomainOverride]);

  // Displayed participants (applying event filter if set)
  const displayedParticipants = useMemo(() => {
    if (!selectedEventFilter) return scopedParticipants;
    return scopedParticipants.filter(p => {
      const target = (p.event_name || '').toLowerCase();
      const query = selectedEventFilter.toLowerCase();
      return target === query || target.includes(query) || query.includes(target);
    });
  }, [scopedParticipants, selectedEventFilter]);

  // Handle CSV Export
  const handleExportCSV = () => {
    const success = exportParticipantsToCSV(displayedParticipants);
    if (success) {
      triggerToast({ type: 'success', message: `Exported ${displayedParticipants.length} attendees to CSV` });
    }
  };

  // Handle Login & Session Initialization
  const handleLoginSuccess = useCallback((user) => {
    setActiveUser(user);
    setCurrentUser(user);
    setSelectedDomainOverride('ALL');
    setSelectedEventFilter('');
    triggerToast({
      type: 'success',
      message: `Welcome, ${user.name}! Operations dashboard unlocked.`
    });
  }, [triggerToast]);

  // Handle Explicit Logout
  const handleLogout = useCallback(() => {
    clearActiveUser();
    setCurrentUser(null);
    setSelectedDomainOverride('ALL');
    setSelectedEventFilter('');
    triggerToast({
      type: 'info',
      message: 'Logged out successfully.'
    });
  }, [triggerToast]);

  // Switch Active User / RBAC Persona
  const handleSelectUser = (user) => {
    handleLoginSuccess(user);
  };

  // Initiate Direct Phone Call & Open Post-Call Remark Modal
  const handleTriggerCall = useCallback((participant) => {
    if (!participant) return;
    
    // 1. Direct phone connection
    if (participant.phone && participant.phone !== 'N/A') {
      window.open(`tel:${participant.phone}`, '_self');
    }

    // 2. Open pop box for remark, lead number & status
    setCallingCandidate(participant);
    setIsCallModalOpen(true);
  }, []);

  // Save Call Record & Log
  const handleSaveCall = useCallback(({ participant, callerUser, remark, leadNumber, status }) => {
    try {
      logCallForParticipant({
        participant,
        callerUser,
        remark,
        leadNumber,
        status
      });

      setCallDbVersion(v => v + 1);

      const statusDef = CALL_STATUSES[status];
      if (status === 'PAYMENT_CLAIMED') {
        triggerToast({
          type: 'success',
          message: `Payment claimed for ${participant.name}! Queued to Verification Desk.`
        });
      } else {
        triggerToast({
          type: 'success',
          message: `Call logged for ${participant.name} (${statusDef?.label || status})`
        });
      }
    } catch (err) {
      triggerToast({
        type: 'error',
        message: err.message || 'Failed to save call record'
      });
    }
  }, [triggerToast]);

  // Compute pending verifications count for header badge
  const pendingVerificationCount = useMemo(() => {
    const queue = getPaymentVerificationQueue(participants);
    return queue.filter(q => q.verificationState === 'PENDING_SYNC' || q.verificationState === 'DEFAULTER').length;
  }, [participants, callDbVersion]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Gate dashboard behind dedicated Login Screen on load
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0B0D11] text-[#F5F7FA] font-sans selection:bg-sky-500/20 selection:text-sky-300">
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D11] text-[#F5F7FA] font-sans selection:bg-sky-500/20 selection:text-sky-300">
      
      {/* 1. Header with RBAC Profile, 13 Domain Switcher & Verification Badges */}
      <Header
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
        onOpenPasswordManager={() => setIsPasswordManagerOpen(true)}
        onOpenBookmarklet={() => setIsBookmarkletOpen(true)}
        onOpenTokenHealth={() => setIsTokenHealthOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenVerificationQueue={() => setIsVerificationQueueOpen(true)}
        onExportCSV={handleExportCSV}
        currentUser={currentUser}
        selectedDomainOverride={selectedDomainOverride}
        onSelectDomainOverride={(d) => {
          setSelectedDomainOverride(d);
          setSelectedEventFilter('');
        }}
        verificationCount={pendingVerificationCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        summary={summary}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Loading Spinner Indicator */}
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-mono text-slate-400">Loading verified techFEST '26 records...</p>
          </div>
        ) : (
          <>
            {/* DOMAIN HERO BANNER: Shown when logged in as Domain Head or when Super Admin filters to a domain */}
            {activeDomainId && (
              <DomainBanner
                domainId={activeDomainId}
                currentUser={currentUser}
                participants={scopedParticipants}
                selectedEvent={selectedEventFilter}
                onSelectEventFilter={setSelectedEventFilter}
              />
            )}

            {/* 2. Unified KPI Metrics Strip (Dynamically scoped to active domain) */}
            <KPIStrip summary={summary} participants={displayedParticipants} />

            {/* 3. Event Activity Analytics Chart (Dynamically scoped to active domain) */}
            <AnalyticsChart participants={displayedParticipants} summary={summary} />

            {/* 4. Master Operations Data Table with Direct Calling & Domain Awareness */}
            <DataTable
              key={`${callDbVersion}_${activeDomainId || 'all'}_${selectedEventFilter}`}
              participants={displayedParticipants}
              summary={summary}
              currentUser={currentUser}
              activeDomainId={activeDomainId}
              selectedEventFilter={selectedEventFilter}
              onSelectEventFilter={setSelectedEventFilter}
              onSelectParticipant={setSelectedParticipant}
              onTriggerCall={handleTriggerCall}
              onTriggerToast={triggerToast}
            />
          </>
        )}

      </main>

      {/* Slide-over Candidate Inspector Drawer */}
      <CandidateDrawer
        key={`drawer_${callDbVersion}_${selectedParticipant?.id}`}
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
        onTriggerCall={handleTriggerCall}
      />

      {/* Pop-up Box for Call Remarks, Lead Number & Status (As requested by Sagar) */}
      <CallRemarkModal
        isOpen={isCallModalOpen}
        participant={callingCandidate}
        currentUser={currentUser}
        onClose={() => {
          setIsCallModalOpen(false);
          setCallingCandidate(null);
        }}
        onSubmit={handleSaveCall}
      />

      {/* Operations 17 Logins & Credentials Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        onSelectUser={handleSelectUser}
      />

      {/* Caller Activity & Access Control Audit Logs Modal */}
      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      {/* Payment Verification & Defaulter Desk Modal */}
      <VerificationQueueModal
        isOpen={isVerificationQueueOpen}
        participants={participants}
        currentUser={currentUser}
        onClose={() => setIsVerificationQueueOpen(false)}
        onTriggerCall={handleTriggerCall}
        onTriggerToast={triggerToast}
      />

      {/* Autonomous Token Health Modal */}
      <TokenModal
        summary={summary}
        isOpen={isTokenHealthOpen}
        onClose={() => setIsTokenHealthOpen(false)}
      />

      {/* 1-Click Sync Tool Bookmarklet Modal */}
      <BookmarkletModal
        isOpen={isBookmarkletOpen}
        onClose={() => setIsBookmarkletOpen(false)}
      />

      {/* Super Admin Password Manager & Reset Tool */}
      <PasswordManagerModal
        isOpen={isPasswordManagerOpen}
        currentUser={currentUser}
        onClose={() => setIsPasswordManagerOpen(false)}
        onTriggerToast={triggerToast}
      />

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
