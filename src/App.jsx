import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import KPIStrip from './components/KPIStrip';
import AnalyticsChart from './components/AnalyticsChart';
import DataTable from './components/DataTable';
import CandidateDrawer from './components/CandidateDrawer';
import TokenModal from './components/TokenModal';
import BookmarkletModal from './components/BookmarkletModal';
import Toast from './components/Toast';
import { exportParticipantsToCSV } from './utils/csv';

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

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isBookmarkletOpen, setIsBookmarkletOpen] = useState(false);
  const [isTokenHealthOpen, setIsTokenHealthOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('tf_theme') || 'dark');

  // Trigger toast with auto-hide
  const triggerToast = useCallback((toastData) => {
    setToast(toastData);
    setTimeout(() => {
      setToast(current => current === toastData ? null : current);
    }, 3000);
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

  // Handle CSV Export
  const handleExportCSV = () => {
    const success = exportParticipantsToCSV(participants);
    if (success) {
      triggerToast({ type: 'success', message: `Exported ${participants.length} attendees to CSV` });
    }
  };

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

  return (
    <div className="min-h-screen bg-[#0B0D11] text-[#F5F7FA] font-sans selection:bg-sky-500/20 selection:text-sky-300">
      
      {/* 1. Glassmorphism Navigation Bar */}
      <Header
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
        onOpenBookmarklet={() => setIsBookmarkletOpen(true)}
        onOpenTokenHealth={() => setIsTokenHealthOpen(true)}
        onExportCSV={handleExportCSV}
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
            {/* 2. Unified KPI Metrics Strip */}
            <KPIStrip summary={summary} participants={participants} />

            {/* 3. Event Activity Analytics Chart */}
            <AnalyticsChart participants={participants} summary={summary} />

            {/* 4. Master Operations Data Table */}
            <DataTable
              participants={participants}
              summary={summary}
              onSelectParticipant={setSelectedParticipant}
              onTriggerToast={triggerToast}
            />
          </>
        )}

      </main>

      {/* Slide-over Candidate Inspector Drawer */}
      <CandidateDrawer
        participant={selectedParticipant}
        onClose={() => setSelectedParticipant(null)}
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

      {/* Floating Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

    </div>
  );
}
