// techFEST '26 • SLIET Central Organizer Desk Controller
// Responsive Mobile + Desktop Engine with Instant Cache, Drawer & Gatekeeper

const ACCESS_KEY = 'sliet@tf26';
let inMemoryAuth = false;

let allParticipants = [];
let currentFiltered = [];
let summaryData = {};
let currentCategory = 'all';
let currentPaymentFilter = 'all';

// Pagination state
let currentPage = 1;
let pageSize = 50;

document.addEventListener('DOMContentLoaded', () => {
  setupKeyboardShortcuts();
  checkAuthentication();
});

/**
 * Gatekeeper Authentication with Multi-Storage & Query Param Fallback
 */
function isUserAuthorized() {
  if (inMemoryAuth) return true;

  // 1. Check URL query params (?pass=sliet@tf26 or ?auth=sliet@tf26)
  try {
    const params = new URLSearchParams(window.location.search);
    const qPass = params.get('pass') || params.get('auth');
    if (qPass && qPass.trim().toLowerCase() === ACCESS_KEY) {
      setUserAuthorized(true);
      return true;
    }
  } catch (e) {}

  // 2. Check localStorage
  try {
    if (localStorage.getItem('tf26_authorized') === 'true') return true;
  } catch (e) {}

  // 3. Check sessionStorage
  try {
    if (sessionStorage.getItem('tf26_authorized') === 'true') return true;
  } catch (e) {}

  // 4. Check Cookie
  try {
    if (document.cookie.includes('tf26_auth=1')) return true;
  } catch (e) {}

  return false;
}

function setUserAuthorized(val) {
  inMemoryAuth = !!val;
  if (val) {
    try { localStorage.setItem('tf26_authorized', 'true'); } catch (e) {}
    try { sessionStorage.setItem('tf26_authorized', 'true'); } catch (e) {}
    try { document.cookie = 'tf26_auth=1; max-age=604800; path=/; SameSite=Lax'; } catch (e) {}
  } else {
    try { localStorage.removeItem('tf26_authorized'); } catch (e) {}
    try { sessionStorage.removeItem('tf26_authorized'); } catch (e) {}
    try { document.cookie = 'tf26_auth=0; max-age=0; path=/'; } catch (e) {}
  }
}

function checkAuthentication() {
  const isAuth = isUserAuthorized();
  const lockScreen = document.getElementById('lockScreen');
  const appContainer = document.getElementById('authenticatedApp');

  if (isAuth) {
    if (lockScreen) lockScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    loadData();
  } else {
    if (lockScreen) lockScreen.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
    const passInput = document.getElementById('passInput');
    if (passInput) setTimeout(() => passInput.focus(), 150);
  }
  if (window.lucide) lucide.createIcons();
}

function handleAuthSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  const input = document.getElementById('passInput');
  const errorMsg = document.getElementById('authErrorMsg');
  const lockCard = document.getElementById('lockCard');
  const val = (input ? input.value : '').trim().toLowerCase();

  if (val === ACCESS_KEY) {
    setUserAuthorized(true);
    if (errorMsg) errorMsg.classList.add('hidden');
    
    // Unlock immediate UI
    const lockScreen = document.getElementById('lockScreen');
    const appContainer = document.getElementById('authenticatedApp');
    if (lockScreen) lockScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');

    loadData();
    if (window.lucide) lucide.createIcons();
  } else {
    if (errorMsg) errorMsg.classList.remove('hidden');
    if (lockCard) {
      lockCard.classList.remove('shake-card');
      void lockCard.offsetWidth; // trigger reflow
      lockCard.classList.add('shake-card');
    }
    if (input) {
      input.value = '';
      input.focus();
    }
  }
  return false;
}

function togglePassVisibility() {
  const input = document.getElementById('passInput');
  const icon = document.getElementById('passEyeIcon');
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) lucide.createIcons();
}

function lockDesk() {
  setUserAuthorized(false);
  const lockScreen = document.getElementById('lockScreen');
  const appContainer = document.getElementById('authenticatedApp');
  const passInput = document.getElementById('passInput');
  const errorMsg = document.getElementById('authErrorMsg');

  if (errorMsg) errorMsg.classList.add('hidden');
  if (passInput) passInput.value = '';
  if (appContainer) appContainer.classList.add('hidden');
  if (lockScreen) lockScreen.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
  if (passInput) setTimeout(() => passInput.focus(), 150);
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Escape closes drawer
    if (e.key === 'Escape') {
      closeDrawer();
    }
    // "/" focuses search input if not inside input
    if (e.key === '/' && document.activeElement !== document.getElementById('searchInput') && document.activeElement !== document.getElementById('passInput')) {
      e.preventDefault();
      const input = document.getElementById('searchInput');
      if (input) input.focus();
    }
  });
}

/**
 * High resilience data loader
 */
async function loadData() {
  const loading = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const tableBody = document.getElementById('tableBody');
  const mobileContainer = document.getElementById('mobileCardsContainer');
  const refreshIcon = document.getElementById('refreshIcon');

  if (refreshIcon) refreshIcon.classList.add('animate-spin');
  if (loading) loading.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');
  if (tableBody) tableBody.innerHTML = '';
  if (mobileContainer) mobileContainer.innerHTML = '';

  try {
    let data = null;

    // 1. Instant Synchronous Load from window.__TECHFEST_DATA__
    if (window.__TECHFEST_DATA__ && window.__TECHFEST_DATA__.participants && window.__TECHFEST_DATA__.participants.length > 0) {
      data = window.__TECHFEST_DATA__;
    }

    // 2. Network Fallback Candidates
    if (!data) {
      const pathname = window.location.pathname;
      const dirPath = pathname.substring(0, pathname.lastIndexOf('/') + 1) || '/';

      const fetchUrls = [
        'data.json',
        './data.json',
        `${dirPath}data.json`,
        '/unstop-paid-tracker/data.json',
        'data/paid_participants.json',
        'https://raw.githubusercontent.com/rajaryan2204/unstop-paid-tracker/main/data.json'
      ];

      for (const url of fetchUrls) {
        try {
          const res = await fetch(`${url}?_t=${Date.now()}`);
          if (res.ok) {
            const parsed = await res.json();
            if (parsed && (parsed.participants || Array.isArray(parsed))) {
              data = Array.isArray(parsed) ? { participants: parsed, summary: {} } : parsed;
              break;
            }
          }
        } catch (e) {
          // Continue to next candidate
        }
      }
    }

    if (!data || !data.participants || data.participants.length === 0) {
      throw new Error('No registration records found.');
    }

    summaryData = data.summary || {};
    allParticipants = data.participants || [];

    renderSummary(summaryData, allParticipants);
    renderTokenExpiry(summaryData);
    populateEventFilter(allParticipants, summaryData);
    populateCollegeFilter(allParticipants);
    updateCategoryCounts(allParticipants);
    updatePaymentFilterCounts(allParticipants);
    applyFilters();

    const timestampEl = document.getElementById('syncTimestamp');
    if (timestampEl) {
      const now = new Date();
      timestampEl.textContent = `Live as of ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

  } catch (err) {
    console.error('Data load exception:', err);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="py-14 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
              <i data-lucide="alert-triangle" class="w-6 h-6"></i>
            </div>
            <h4 class="text-sm font-semibold text-slate-100">Unable to load participant database</h4>
            <p class="text-xs text-slate-400 max-w-md mx-auto mt-1">${escapeHtml(err.message || String(err))}</p>
            <div class="mt-4">
              <button onclick="window.location.reload()" class="px-4 py-2 text-xs font-semibold text-white bg-[#141824] hover:bg-[#1a2030] border border-[#23293d] rounded-lg shadow-sm transition">
                Retry Connection
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  } finally {
    if (loading) loading.classList.add('hidden');
    if (refreshIcon) refreshIcon.classList.remove('animate-spin');
    if (window.lucide) lucide.createIcons();
  }
}

/**
 * Render Token Expiry Status
 */
function renderTokenExpiry(summary) {
  const tokenExpiryIso = summary.token_expires_at;
  const tokenBadge = document.getElementById('tokenBadge');
  const tokenDot = document.getElementById('tokenDot');
  const tokenText = document.getElementById('tokenText');

  const bannerPill = document.getElementById('bannerTokenStatusPill');
  const bannerDetails = document.getElementById('bannerTokenDetails');
  const bannerIcon = document.getElementById('bannerTokenIcon');

  if (!tokenExpiryIso) {
    if (tokenText) tokenText.textContent = 'Token: Active';
    return;
  }

  const expiryDate = new Date(tokenExpiryIso);
  const now = new Date();
  const diffMs = expiryDate - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  const istFormatted = expiryDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });

  if (diffMs <= 0) {
    if (tokenDot) tokenDot.className = 'w-2 h-2 rounded-full bg-rose-400 animate-pulse';
    if (tokenText) tokenText.textContent = 'Token: Expired';
    if (tokenBadge) tokenBadge.className = 'hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-rose-500/10 border border-rose-500/30 text-rose-300';

    if (bannerPill) {
      bannerPill.textContent = 'EXPIRED';
      bannerPill.className = 'px-2 py-0.2 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30';
    }
    if (bannerDetails) bannerDetails.textContent = `Expired on: ${istFormatted} IST. Please update UNSTOP_TOKEN in GitHub secrets.`;
    if (bannerIcon) bannerIcon.className = 'w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0';

  } else if (diffHours < 6) {
    if (tokenDot) tokenDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    if (tokenText) tokenText.textContent = `Token: ${diffHours}h left`;
    if (tokenBadge) tokenBadge.className = 'hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300';

    if (bannerPill) {
      bannerPill.textContent = 'EXPIRING SOON';
      bannerPill.className = 'px-2 py-0.2 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30';
    }
    if (bannerDetails) bannerDetails.textContent = `Expires on: ${istFormatted} IST (~${diffHours}h remaining). Update secret before expiration.`;
    if (bannerIcon) bannerIcon.className = 'w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0';

  } else {
    if (tokenDot) tokenDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
    if (tokenText) tokenText.textContent = `Token: ~${diffHours}h left`;
    if (tokenBadge) tokenBadge.className = 'hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-[#0e111a] border border-[#1e2436] text-slate-300';

    if (bannerPill) {
      bannerPill.textContent = 'ACTIVE';
      bannerPill.className = 'px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    }
    if (bannerDetails) bannerDetails.textContent = `Token valid until: ${istFormatted} IST (~${diffHours}h remaining). Auto-sync active.`;
    if (bannerIcon) bannerIcon.className = 'w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0';
  }
}

/**
 * Render Executive Summary Bar
 */
function renderSummary(summary, participants) {
  const totalVerified = participants.length;
  const totalApplicants = summary.total_unstop_registrations || 3501;
  const colleges = new Set(participants.map(p => p.college).filter(c => c && c !== 'N/A'));
  
  const totalEvents = summary.total_events_scanned || (summary.events_list ? summary.events_list.length : 62);
  const eventsWithPaid = summary.events_with_paid || new Set(participants.map(p => p.event_name)).size;
  const zeroPaidCount = Math.max(0, totalEvents - eventsWithPaid);

  const totalRevenue = participants.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const paidCount = participants.filter(p => Number(p.amount) > 0).length;
  const freeCount = totalVerified - paidCount;

  // Primary Metrics
  document.getElementById('statTotalPaid').textContent = totalVerified.toLocaleString('en-IN');
  document.getElementById('statTotalApplicants').textContent = totalApplicants.toLocaleString('en-IN');
  document.getElementById('statTotalRevenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  
  const statActiveEventsEl = document.getElementById('statActiveEvents');
  if (statActiveEventsEl) statActiveEventsEl.textContent = totalEvents;

  const subActiveEventsEl = document.getElementById('subActiveEvents');
  if (subActiveEventsEl) {
    subActiveEventsEl.textContent = `${eventsWithPaid} with entries • ${zeroPaidCount} awaiting`;
  }

  document.getElementById('statColleges').textContent = colleges.size;

  // Subtitles
  const subPaid = document.getElementById('subTotalPaid');
  if (subPaid) subPaid.textContent = `${freeCount} Free • ${paidCount} Paid`;

  const subRevenue = document.getElementById('subTotalRevenue');
  if (subRevenue) subRevenue.textContent = `RC Boat + Ghost Code`;

  const subColleges = document.getElementById('subColleges');
  if (subColleges) subColleges.textContent = `PAN-India (${colleges.size} Colleges)`;
}

/**
 * Update Track Tab numbers
 */
function updateCategoryCounts(participants) {
  const counts = { all: participants.length, competitions: 0, quizzes: 0, hackathons: 0, cultural: 0 };
  participants.forEach(p => {
    const t = (p.event_type || 'competitions').toLowerCase();
    if (counts[t] !== undefined) counts[t]++;
    else if (t.includes('quiz')) counts.quizzes++;
    else if (t.includes('hack')) counts.hackathons++;
    else counts.competitions++;
  });

  const buttons = document.querySelectorAll('.cat-tab');
  buttons.forEach(btn => {
    const cat = btn.getAttribute('data-cat');
    if (cat === 'all') btn.textContent = `All Events (${counts.all})`;
    if (cat === 'competitions') btn.textContent = `Competitions (${counts.competitions})`;
    if (cat === 'quizzes') btn.textContent = `Quizzes (${counts.quizzes})`;
    if (cat === 'hackathons') btn.textContent = `Hackathons (${counts.hackathons})`;
    if (cat === 'cultural') btn.textContent = `Cultural & Jam (${counts.cultural})`;
  });
}

/**
 * Update Payment Filter counts
 */
function updatePaymentFilterCounts(participants) {
  const paidCount = participants.filter(p => Number(p.amount) > 0).length;
  const freeCount = participants.length - paidCount;

  const btnAll = document.getElementById('payFilterAll');
  const btnPaid = document.getElementById('payFilterPaid');
  const btnFree = document.getElementById('payFilterFree');

  if (btnAll) btnAll.textContent = `All (${participants.length})`;
  if (btnPaid) btnPaid.textContent = `💰 Paid (${paidCount})`;
  if (btnFree) btnFree.textContent = `Free (${freeCount})`;
}

function setPaymentFilter(type) {
  currentPaymentFilter = type;
  
  const buttons = [
    { id: 'payFilterAll', val: 'all' },
    { id: 'payFilterPaid', val: 'paid' },
    { id: 'payFilterFree', val: 'free' }
  ];

  buttons.forEach(b => {
    const el = document.getElementById(b.id);
    if (!el) return;
    if (b.val === type) {
      el.className = 'px-2.5 py-1.5 rounded-md font-semibold bg-[#1a2032] text-emerald-400 border border-emerald-500/30 whitespace-nowrap transition';
    } else {
      el.className = 'px-2.5 py-1.5 rounded-md font-medium text-slate-400 hover:text-slate-200 hover:bg-[#121624] border border-transparent whitespace-nowrap transition';
    }
  });

  currentPage = 1;
  applyFilters();
}

function setCategoryFilter(category) {
  currentCategory = category;
  const buttons = document.querySelectorAll('.cat-tab');
  buttons.forEach(btn => {
    const isSelected = btn.getAttribute('data-cat') === category;
    if (isSelected) {
      btn.className = 'cat-tab px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30 whitespace-nowrap transition';
    } else {
      btn.className = 'cat-tab px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#121624] border border-transparent whitespace-nowrap transition';
    }
  });

  currentPage = 1;
  applyFilters();
}

function populateEventFilter(participants, summary) {
  const select = document.getElementById('eventFilter');
  if (!select) return;
  const selectedVal = select.value;

  // Compute verified counts from participants
  const eventCounts = {};
  participants.forEach(p => {
    const evName = (p.event_name || 'Event').trim();
    eventCounts[evName] = (eventCounts[evName] || 0) + 1;
  });

  const masterList = (summary && Array.isArray(summary.events_list) && summary.events_list.length > 0)
    ? summary.events_list
    : (summaryData && Array.isArray(summaryData.events_list) && summaryData.events_list.length > 0)
      ? summaryData.events_list
      : null;

  select.innerHTML = '';

  if (masterList) {
    const totalEvents = masterList.length;
    const eventsWithEntries = masterList.filter(e => {
      const t = (e.title || '').trim();
      return (eventCounts[t] !== undefined ? eventCounts[t] : (e.paid_registrations || 0)) > 0;
    });
    const eventsAwaiting = masterList.filter(e => {
      const t = (e.title || '').trim();
      return (eventCounts[t] !== undefined ? eventCounts[t] : (e.paid_registrations || 0)) === 0;
    });

    // Sort eventsWithEntries by verified count descending
    eventsWithEntries.sort((a, b) => {
      const cntA = eventCounts[(a.title || '').trim()] || a.paid_registrations || 0;
      const cntB = eventCounts[(b.title || '').trim()] || b.paid_registrations || 0;
      return cntB - cntA;
    });

    // Sort eventsAwaiting by total unstop registrations descending
    eventsAwaiting.sort((a, b) => (b.total_registrations || 0) - (a.total_registrations || 0));

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = `All Competitions & Events (${totalEvents} Total • ${eventsWithEntries.length} with entries)`;
    select.appendChild(defaultOpt);

    // Group 1: Events with verified entries
    if (eventsWithEntries.length > 0) {
      const grpWithEntries = document.createElement('optgroup');
      grpWithEntries.label = `── Competitions With Entries (${eventsWithEntries.length}) ──`;
      eventsWithEntries.forEach(ev => {
        const title = (ev.title || '').trim();
        const verifiedCount = eventCounts[title] !== undefined ? eventCounts[title] : (ev.paid_registrations || 0);
        const opt = document.createElement('option');
        opt.value = title;
        opt.textContent = `${title} (${verifiedCount} verified)`;
        if (title === selectedVal) opt.selected = true;
        grpWithEntries.appendChild(opt);
      });
      select.appendChild(grpWithEntries);
    }

    // Group 2: Events awaiting verified entries
    if (eventsAwaiting.length > 0) {
      const grpAwaiting = document.createElement('optgroup');
      grpAwaiting.label = `── Awaiting Paid Submissions (${eventsAwaiting.length}) ──`;
      eventsAwaiting.forEach(ev => {
        const title = (ev.title || '').trim();
        const totalReg = ev.total_registrations || 0;
        const opt = document.createElement('option');
        opt.value = title;
        opt.textContent = `${title} (0 verified • ${totalReg} applicants)`;
        if (title === selectedVal) opt.selected = true;
        grpAwaiting.appendChild(opt);
      });
      select.appendChild(grpAwaiting);
    }

  } else {
    // Fallback if master list not available
    const sortedEvents = Object.keys(eventCounts).sort((a, b) => eventCounts[b] - eventCounts[a]);
    select.innerHTML = `<option value="">All Competitions (${sortedEvents.length} Active)</option>`;
    sortedEvents.forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev;
      opt.textContent = `${ev} (${eventCounts[ev]})`;
      if (ev === selectedVal) opt.selected = true;
      select.appendChild(opt);
    });
  }
}

function populateCollegeFilter(participants) {
  const select = document.getElementById('collegeFilter');
  if (!select) return;
  const selectedVal = select.value;
  const colleges = Array.from(new Set(participants.map(p => p.college).filter(Boolean))).sort();

  select.innerHTML = '<option value="">All Colleges</option>';
  colleges.forEach(col => {
    const opt = document.createElement('option');
    opt.value = col;
    opt.textContent = col.length > 36 ? col.substring(0, 34) + '...' : col;
    if (col === selectedVal) opt.selected = true;
    select.appendChild(opt);
  });
}

function applyFilters() {
  const query = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  const event = document.getElementById('eventFilter') ? document.getElementById('eventFilter').value : '';
  const college = document.getElementById('collegeFilter') ? document.getElementById('collegeFilter').value : '';
  const sort = document.getElementById('sortSelect') ? document.getElementById('sortSelect').value : 'date-desc';

  const filterTag = document.getElementById('filterTag');
  if (query || event || college || currentCategory !== 'all' || currentPaymentFilter !== 'all') {
    if (filterTag) filterTag.classList.remove('hidden');
  } else {
    if (filterTag) filterTag.classList.add('hidden');
  }

  let filtered = allParticipants.filter(p => {
    // Payment filter
    const amt = Number(p.amount) || 0;
    if (currentPaymentFilter === 'paid' && amt <= 0) return false;
    if (currentPaymentFilter === 'free' && amt > 0) return false;

    // Track tab filter
    if (currentCategory !== 'all') {
      const pType = (p.event_type || 'competitions').toLowerCase();
      if (currentCategory === 'quizzes' && !pType.includes('quiz')) return false;
      if (currentCategory === 'hackathons' && !pType.includes('hack')) return false;
      if (currentCategory === 'cultural' && !pType.includes('cultur') && !pType.includes('jam')) return false;
      if (currentCategory === 'competitions' && (pType.includes('quiz') || pType.includes('hack') || pType.includes('cultur'))) return false;
    }

    // Event filter
    if (event && p.event_name !== event && String(p.event_id) !== event) {
      return false;
    }

    // College filter
    if (college && p.college !== college) {
      return false;
    }

    // Search query
    if (query) {
      const matchName = (p.name || '').toLowerCase().includes(query);
      const matchEmail = (p.email || '').toLowerCase().includes(query);
      const matchPhone = (p.phone || '').toLowerCase().includes(query);
      const matchCollege = (p.college || '').toLowerCase().includes(query);
      const matchTeam = (p.team_name || '').toLowerCase().includes(query);
      const matchEvent = (p.event_name || '').toLowerCase().includes(query);
      const matchPayId = (p.payment_id || '').toLowerCase().includes(query);
      const matchMembers = (p.team_members || []).some(m => 
        (m.name || '').toLowerCase().includes(query) || 
        (m.email || '').toLowerCase().includes(query) ||
        (m.phone || '').toLowerCase().includes(query)
      );

      if (!matchName && !matchEmail && !matchPhone && !matchCollege && !matchTeam && !matchEvent && !matchPayId && !matchMembers) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sort === 'date-desc') {
      return new Date(b.registered_at || 0) - new Date(a.registered_at || 0);
    } else if (sort === 'date-asc') {
      return new Date(a.registered_at || 0) - new Date(b.registered_at || 0);
    } else if (sort === 'event-asc') {
      return (a.event_name || '').localeCompare(b.event_name || '');
    } else if (sort === 'name-asc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sort === 'amount-desc') {
      return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    }
    return 0;
  });

  currentFiltered = filtered;
  renderDataViews(filtered);
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  if (document.getElementById('eventFilter')) document.getElementById('eventFilter').value = '';
  if (document.getElementById('collegeFilter')) document.getElementById('collegeFilter').value = '';
  setCategoryFilter('all');
  setPaymentFilter('all');
}

function changePageSize() {
  const val = document.getElementById('pageSizeSelect').value;
  pageSize = val === 'all' ? 99999 : parseInt(val, 10);
  currentPage = 1;
  renderDataViews(currentFiltered);
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderDataViews(currentFiltered);
    window.scrollTo({ top: 220, behavior: 'smooth' });
  }
}

function nextPage() {
  const totalPages = Math.ceil(currentFiltered.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderDataViews(currentFiltered);
    window.scrollTo({ top: 220, behavior: 'smooth' });
  }
}

/**
 * Render Both Desktop Table & Mobile Cards Feed
 */
function renderDataViews(participants) {
  const tableBody = document.getElementById('tableBody');
  const mobileContainer = document.getElementById('mobileCardsContainer');
  const emptyState = document.getElementById('emptyState');
  const visibleCount = document.getElementById('visibleCount');
  const totalCount = document.getElementById('totalCount');
  const paginationBar = document.getElementById('paginationBar');

  if (visibleCount) visibleCount.textContent = participants.length;
  if (totalCount) totalCount.textContent = allParticipants.length;

  if (participants.length === 0) {
    if (tableBody) tableBody.innerHTML = '';
    if (mobileContainer) mobileContainer.innerHTML = '';
    if (emptyState) {
      emptyState.classList.remove('hidden');
      const selectedEvent = document.getElementById('eventFilter') ? document.getElementById('eventFilter').value : '';
      const eventObj = summaryData && summaryData.events_list ? summaryData.events_list.find(e => (e.title || '').trim() === (selectedEvent || '').trim()) : null;
      
      const emptyTitle = emptyState.querySelector('h3');
      const emptyDesc = emptyState.querySelector('p');
      if (selectedEvent && eventObj && (eventObj.paid_registrations || 0) === 0) {
        if (emptyTitle) emptyTitle.textContent = `No Verified Paid Entries for "${selectedEvent}" Yet`;
        if (emptyDesc) emptyDesc.textContent = `Unstop shows ${eventObj.total_registrations || 0} registered applicant(s) for this event awaiting payment / verification.`;
      } else if (selectedEvent) {
        if (emptyTitle) emptyTitle.textContent = `No verified participants match your filters for "${selectedEvent}"`;
        if (emptyDesc) emptyDesc.textContent = 'Try adjusting search terms or toggling the payment filter.';
      } else {
        if (emptyTitle) emptyTitle.textContent = 'No attendees found';
        if (emptyDesc) emptyDesc.textContent = 'Try resetting search filters or selecting another track.';
      }
    }
    if (paginationBar) paginationBar.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (paginationBar) paginationBar.classList.remove('hidden');

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(participants.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, participants.length);
  const pageItems = participants.slice(startIndex, endIndex);

  // Update pagination info
  const pageInfo = document.getElementById('pageInfoText');
  if (pageInfo) pageInfo.textContent = `Showing ${startIndex + 1}–${endIndex} of ${participants.length} (Page ${currentPage} of ${totalPages})`;
  
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  // 1. Render Desktop Table Rows
  if (tableBody) {
    const desktopRowsHtml = pageItems.map((p, idx) => {
      const absoluteIndex = startIndex + idx + 1;
      const initials = (p.name || 'P')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'TF';

      const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;

      const hasMembers = p.team_members && p.team_members.length > 0;
      const teamBadge = hasMembers 
        ? `<button onclick="openDrawer('${p.id}')" class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border border-sky-500/30 transition">
            <i data-lucide="users" class="w-3 h-3"></i> ${p.team_members.length} Members
           </button>`
        : `<span class="text-[11px] text-slate-500">Solo Entry</span>`;

      // Category styling
      let catPill = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      const evType = (p.event_type || '').toLowerCase();
      if (evType.includes('quiz')) catPill = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      else if (evType.includes('hack')) catPill = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      else if (evType.includes('cultur')) catPill = 'bg-pink-500/10 text-pink-300 border-pink-500/20';

      const amt = Number(p.amount) || 0;
      const paymentBlock = amt > 0
        ? `<div>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <i data-lucide="check-check" class="w-3 h-3 text-emerald-400"></i> Paid ₹${amt.toLocaleString('en-IN')}
            </span>
          </div>`
        : `<div>
            <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-[#141824] text-slate-300 border border-[#23293d]">
              <i data-lucide="shield-check" class="w-3 h-3 text-sky-400"></i> Free Entry
            </span>
          </div>`;

      return `
        <tr class="hover:bg-[#121623] transition group border-b border-[#171c2b] cursor-pointer" onclick="openDrawer('${p.id}')">
          <!-- Index -->
          <td class="py-3 px-3 text-center font-mono text-[11px] text-slate-500 select-none">
            ${absoluteIndex}
          </td>

          <!-- Participant -->
          <td class="py-3 px-4">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-[#141824] border border-[#23293d] flex items-center justify-center font-bold text-[11px] text-emerald-400 shrink-0">
                ${initials}
              </div>
              <div class="min-w-0">
                <div class="font-semibold text-slate-100 text-xs truncate group-hover:text-emerald-300 transition">
                  ${escapeHtml(p.name || 'Participant')}
                </div>
                <div class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate" onclick="event.stopPropagation()">
                  <span class="truncate">${escapeHtml(p.email || '')}</span>
                  ${p.email && p.email !== 'N/A' ? `
                    <button onclick="copyToClipboard('${escapeHtml(p.email)}', this)" title="Copy Email" class="text-slate-500 hover:text-slate-300 shrink-0">
                      <i data-lucide="copy" class="w-3 h-3"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </td>

          <!-- Contact (Phone + WhatsApp) -->
          <td class="py-3 px-3 text-[11px]" onclick="event.stopPropagation()">
            ${p.phone && p.phone !== 'N/A' ? `
              <div class="flex items-center gap-1.5 font-mono text-slate-300">
                <span>${escapeHtml(p.phone)}</span>
                ${waLink ? `
                  <a href="${waLink}" target="_blank" rel="noopener noreferrer" title="WhatsApp Message" class="text-emerald-400 hover:text-emerald-300 p-0.5 rounded hover:bg-emerald-500/10">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                  </a>
                ` : ''}
              </div>
            ` : `<span class="text-slate-500 font-mono">--</span>`}
          </td>

          <!-- College & Branch -->
          <td class="py-3 px-4 max-w-[200px]">
            <div class="text-xs font-medium text-slate-200 truncate" title="${escapeHtml(p.college)}">
              ${escapeHtml(p.college || 'N/A')}
            </div>
            ${p.specialization ? `
              <div class="text-[11px] text-slate-400 mt-0.5 truncate">
                <span>${escapeHtml(p.specialization)}</span>
                ${p.passing_year ? `<span class="text-slate-500 font-mono">• ${p.passing_year}</span>` : ''}
              </div>
            ` : ''}
          </td>

          <!-- Event & Track -->
          <td class="py-3 px-3">
            <div class="font-medium text-slate-100 text-xs truncate max-w-[160px]" title="${escapeHtml(p.event_name)}">
              ${escapeHtml(p.event_name || 'Event')}
            </div>
            <div class="mt-0.5">
              <span class="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border ${catPill}">
                ${escapeHtml(p.event_type || 'Competition')}
              </span>
            </div>
          </td>

          <!-- Team Status -->
          <td class="py-3 px-3" onclick="event.stopPropagation()">
            <div class="text-xs text-slate-300 font-medium truncate max-w-[110px]" title="${escapeHtml(p.team_name)}">
              ${escapeHtml(p.team_name || 'Individual')}
            </div>
            <div class="mt-0.5">
              ${teamBadge}
            </div>
          </td>

          <!-- Fee / Payment -->
          <td class="py-3 px-3">
            ${paymentBlock}
          </td>

          <!-- Action (View Drawer Button - Always Visible) -->
          <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
            <button onclick="openDrawer('${p.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1 transition shadow-sm active:scale-95 cursor-pointer">
              <span>View</span>
              <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.innerHTML = desktopRowsHtml;
  }

  // 2. Render Mobile Cards Feed (For Phones)
  if (mobileContainer) {
    const mobileCardsHtml = pageItems.map((p, idx) => {
      const absoluteIndex = startIndex + idx + 1;
      const initials = (p.name || 'P')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'TF';

      const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
      const telLink = p.phone && p.phone !== 'N/A' ? `tel:${p.phone}` : null;

      const amt = Number(p.amount) || 0;
      const feePill = amt > 0
        ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">₹${amt} Paid</span>`
        : `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-[#141824] text-slate-300 border border-[#23293d]">Free Entry</span>`;

      let trackColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      const evType = (p.event_type || '').toLowerCase();
      if (evType.includes('quiz')) trackColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      else if (evType.includes('hack')) trackColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';

      return `
        <div class="p-3.5 rounded-xl bg-[#0d1017] border border-[#1b2030] space-y-2.5 shadow-md" onclick="openDrawer('${p.id}')">
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-[#141824] border border-[#23293d] flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                ${initials}
              </div>
              <div class="min-w-0">
                <div class="font-bold text-slate-100 text-sm truncate">${escapeHtml(p.name)}</div>
                <div class="text-[11px] text-slate-400 font-mono mt-0.5 truncate">${escapeHtml(p.phone || p.email)}</div>
              </div>
            </div>
            <div>
              ${feePill}
            </div>
          </div>

          <!-- Event & Track -->
          <div class="text-xs bg-[#07090e] p-2.5 rounded-lg border border-[#171c2b] space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-slate-200 truncate">${escapeHtml(p.event_name)}</span>
              <span class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${trackColor} shrink-0">
                ${escapeHtml(p.event_type || 'Event')}
              </span>
            </div>
            <div class="text-[11px] text-slate-400 truncate">
              ${escapeHtml(p.college || 'SLIET Longowal')}
            </div>
          </div>

          <!-- Bottom Action Toolbar -->
          <div class="flex items-center justify-between pt-1 border-t border-[#171c2b]" onclick="event.stopPropagation()">
            <div class="flex items-center gap-1.5">
              ${waLink ? `
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold inline-flex items-center gap-1 transition">
                  <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                  <span>WhatsApp</span>
                </a>
              ` : ''}
              ${telLink ? `
                <a href="${telLink}" class="p-1.5 rounded-md bg-[#141824] text-slate-300 border border-[#23293d]">
                  <i data-lucide="phone" class="w-3.5 h-3.5 text-emerald-400"></i>
                </a>
              ` : ''}
            </div>

            <!-- Prominent View Details Button -->
            <button onclick="openDrawer('${p.id}')" class="px-3 py-1.5 rounded-md bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs inline-flex items-center gap-1 transition shadow-sm active:scale-95 cursor-pointer">
              <span>View Details</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    mobileContainer.innerHTML = mobileCardsHtml;
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Slide-over Candidate Drawer (Full screen on mobile, right sheet on desktop)
 */
function openDrawer(participantId) {
  const p = allParticipants.find(item => item.id == participantId);
  if (!p) return;

  const initials = (p.name || 'P')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'TF';

  document.getElementById('drawerInitials').textContent = initials;
  document.getElementById('drawerName').textContent = p.name || 'Participant';
  document.getElementById('drawerRegId').textContent = `Reg ID: ${p.id} • Txn: ${p.payment_id}`;
  document.getElementById('drawerTrackBadge').textContent = p.event_name || 'Event';

  const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
  const telLink = p.phone && p.phone !== 'N/A' ? `tel:${p.phone}` : null;
  const mailLink = p.email && p.email !== 'N/A' ? `mailto:${p.email}` : null;

  const amt = Number(p.amount) || 0;
  const paymentBadge = amt > 0
    ? `<div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
        <div class="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">Payment Status</div>
        <div class="text-sm font-bold mt-0.5 flex items-center gap-1.5">
          <i data-lucide="check-check" class="w-4 h-4 text-emerald-400"></i>
          <span>Paid ₹${amt.toLocaleString('en-IN')} (Gateway Confirmed)</span>
        </div>
        <div class="text-[11px] font-mono text-emerald-400/80 mt-1 select-all">Reference: ${escapeHtml(p.payment_id)}</div>
       </div>`
    : `<div class="p-3 rounded-lg bg-[#141824] border border-[#23293d] text-slate-300">
        <div class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Registration Status</div>
        <div class="text-sm font-semibold mt-0.5 flex items-center gap-1.5 text-sky-400">
          <i data-lucide="shield-check" class="w-4 h-4"></i>
          <span>Free Competition Entry (Form Verified)</span>
        </div>
        <div class="text-[11px] font-mono text-slate-400 mt-1 select-all">Unstop Entry ID: ${escapeHtml(p.id)}</div>
       </div>`;

  const membersHtml = (p.team_members && p.team_members.length > 0)
    ? p.team_members.map((m, idx) => `
        <div class="p-3 rounded-lg bg-[#07090e] border border-[#1e2436] flex items-center justify-between text-xs">
          <div>
            <div class="font-semibold text-slate-100 flex items-center gap-1.5">
              <span>${idx + 1}. ${escapeHtml(m.name || 'Member')}</span>
              ${idx === 0 ? `<span class="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">LEADER</span>` : ''}
            </div>
            <div class="text-slate-400 select-all mt-0.5">${escapeHtml(m.email || '')} ${m.phone ? `• ${m.phone}` : ''}</div>
          </div>
          <div class="text-slate-400 text-right max-w-[180px] text-[11px] truncate" title="${escapeHtml(m.college || '')}">
            ${escapeHtml(m.college || '')}
          </div>
        </div>
      `).join('')
    : `<div class="p-3 rounded-lg bg-[#07090e] border border-[#1e2436] text-slate-400 italic text-center">
        Solo Registration (Individual Participant)
       </div>`;

  const drawerBody = document.getElementById('drawerBody');
  drawerBody.innerHTML = `
    <!-- Quick Contact Actions -->
    <div class="flex items-center gap-2">
      ${waLink ? `
        <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold transition text-xs">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>WhatsApp Leader</span>
        </a>
      ` : ''}
      ${mailLink ? `
        <a href="${mailLink}" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-[#23293d] font-semibold transition text-xs">
          <i data-lucide="mail" class="w-4 h-4 text-sky-400"></i>
          <span>Send Email</span>
        </a>
      ` : ''}
      ${telLink ? `
        <a href="${telLink}" class="inline-flex items-center justify-center p-2 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-slate-200 border border-[#23293d] transition">
          <i data-lucide="phone" class="w-4 h-4 text-emerald-400"></i>
        </a>
      ` : ''}
    </div>

    <!-- Payment / Registration Status Card -->
    ${paymentBadge}

    <!-- Candidate Profile Section -->
    <div class="p-3.5 sm:p-4 rounded-xl bg-[#07090e] border border-[#1b2030] space-y-2">
      <div class="text-[11px] uppercase tracking-wider font-semibold text-slate-400 pb-1 border-b border-[#1b2030]">
        Candidate Profile
      </div>
      <div class="flex justify-between py-1">
        <span class="text-slate-400">Candidate Name:</span>
        <span class="font-semibold text-slate-100">${escapeHtml(p.name)}</span>
      </div>
      <div class="flex justify-between py-1">
        <span class="text-slate-400">Email Address:</span>
        <span class="font-medium text-slate-200 font-mono select-all truncate max-w-[200px] sm:max-w-none">${escapeHtml(p.email)}</span>
      </div>
      <div class="flex justify-between py-1">
        <span class="text-slate-400">Contact Number:</span>
        <span class="font-medium text-slate-200 select-all font-mono">${escapeHtml(p.phone)}</span>
      </div>
      <div class="flex justify-between py-1">
        <span class="text-slate-400">College / Institute:</span>
        <span class="font-medium text-slate-200 text-right max-w-[200px] sm:max-w-[280px]">${escapeHtml(p.college)}</span>
      </div>
      ${p.specialization ? `
        <div class="flex justify-between py-1">
          <span class="text-slate-400">Course / Branch:</span>
          <span class="font-medium text-slate-200">${escapeHtml(p.specialization)}</span>
        </div>
      ` : ''}
      ${p.passing_year ? `
        <div class="flex justify-between py-1">
          <span class="text-slate-400">Graduation Year:</span>
          <span class="font-medium text-slate-200 font-mono">${escapeHtml(p.passing_year)}</span>
        </div>
      ` : ''}
      <div class="flex justify-between py-1">
        <span class="text-slate-400">Registration Date:</span>
        <span class="font-medium text-slate-200">${p.registered_at ? new Date(p.registered_at).toLocaleString('en-IN') : 'N/A'}</span>
      </div>
      ${p.resume_url ? `
        <div class="pt-2 border-t border-[#1b2030] flex justify-end">
          <a href="${p.resume_url.startsWith('http') ? p.resume_url : 'https://d8it4huxumps7.cloudfront.net/' + p.resume_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
            <span>Download Uploaded Resume PDF</span>
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Team Members Section -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-xs uppercase font-semibold tracking-wider text-slate-400">
          Team Roster (${escapeHtml(p.team_name || 'Individual')})
        </h4>
        <span class="text-[11px] text-slate-400 font-mono">${(p.team_members || []).length} registered member(s)</span>
      </div>
      <div class="space-y-1.5">
        ${membersHtml}
      </div>
    </div>
  `;

  const footerTimestamp = document.getElementById('drawerFooterTimestamp');
  if (footerTimestamp) {
    footerTimestamp.textContent = `Unstop ID: ${p.internal_id || p.id}`;
  }

  // Open drawer
  document.body.classList.remove('drawer-closed');
  document.body.classList.add('drawer-open');
  if (window.lucide) lucide.createIcons();
}

function closeDrawer() {
  document.body.classList.remove('drawer-open');
  document.body.classList.add('drawer-closed');
}

function copyToClipboard(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const original = el.innerHTML;
    el.innerHTML = '<span class="text-emerald-400 text-[10px] font-mono">Copied!</span>';
    setTimeout(() => {
      el.innerHTML = original;
      if (window.lucide) lucide.createIcons();
    }, 1500);
  });
}

function exportToCSV() {
  if (!currentFiltered || currentFiltered.length === 0) {
    alert('No records available to export.');
    return;
  }

  const headers = [
    'Event Name',
    'Event Track',
    'Registration ID',
    'Participant Name',
    'Email',
    'Phone',
    'College',
    'Specialization',
    'Passing Year',
    'Team Name',
    'Team Size',
    'Fee Paid (INR)',
    'Payment Type',
    'Registration Status',
    'Registered At'
  ];

  const csvRows = [headers.join(',')];

  currentFiltered.forEach(p => {
    const row = [
      p.event_name,
      p.event_type || 'competitions',
      p.id,
      p.name,
      p.email,
      p.phone,
      p.college,
      p.specialization || '',
      p.passing_year || '',
      p.team_name,
      p.team_size || 1,
      p.amount || 0,
      Number(p.amount) > 0 ? 'Gateway Paid' : 'Free Entry',
      p.status_label || 'Complete Registration',
      p.registered_at
    ].map(val => `"${String(val || '').replace(/"/g, '""')}"`);
    
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const currentEvent = document.getElementById('eventFilter') ? document.getElementById('eventFilter').value : '';
  const filePrefix = currentEvent ? currentEvent.replace(/[^a-zA-Z0-9]/g, '_') : 'techfest26_master';
  link.setAttribute('download', `${filePrefix}_attendees_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const BOOKMARKLET_RAW = `javascript:(function(){try{let t="";const m=document.cookie.match(/(?:^|;\\s*)access_token=([^;]+)/);if(m)t=decodeURIComponent(m[1]);if(!t){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);const v=localStorage.getItem(k);if(typeof v==="string"&&v.startsWith("eyJ")&&v.split(".").length===3){t=v;break;}}}if(!t){alert("⚠️ No Unstop session token found. Please open this while logged into Unstop Organiser Panel.");return;}let exp="24 hours";try{const p=JSON.parse(atob(t.split(".")[1]));if(p.exp)exp=new Date(p.exp*1000).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"});}catch(e){}const ex=document.getElementById("tfSyncBox");if(ex)ex.remove();const b=document.createElement("div");b.id="tfSyncBox";b.style.cssText="position:fixed;top:24px;right:24px;z-index:9999999;background:#0d1017;color:#f1f5f9;border:1px solid #10b981;border-radius:14px;padding:18px;box-shadow:0 25px 50px rgba(0,0,0,0.85);font-family:system-ui,-apple-system,sans-serif;max-width:360px;";b.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;"><strong style="color:#10b981;font-size:14px;">⚡ techFEST \\'26 Sync</strong><button onclick="this.closest(\\'#tfSyncBox\\').remove()" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;">✕</button></div><p style="font-size:12px;color:#cbd5e1;margin:0 0 12px 0;">Token extracted! Valid until <b>'+exp+'</b>.</p><div style="display:flex;flex-direction:column;gap:8px;"><button id="tfCopyBtn" style="background:#10b981;color:#000;border:none;padding:8px 12px;border-radius:7px;font-weight:700;font-size:12px;cursor:pointer;">📋 Copy Token to Clipboard</button><button id="tfSecretBtn" style="background:#1e293b;color:#f1f5f9;border:1px solid #334155;padding:8px 12px;border-radius:7px;font-weight:600;font-size:12px;cursor:pointer;">⚙️ Open GitHub Secret (Paste & Save)</button><button id="tfTriggerBtn" style="background:#0f172a;color:#38bdf8;border:1px solid #0284c7;padding:8px 12px;border-radius:7px;font-weight:600;font-size:11px;cursor:pointer;">🚀 Trigger GitHub Actions Sync</button></div><div id="tfMsg" style="font-size:11px;color:#94a3b8;margin-top:8px;text-align:center;">Click to copy or update secret</div>';document.body.appendChild(b);document.getElementById("tfCopyBtn").onclick=function(){navigator.clipboard.writeText(t).then(()=>{this.innerText="✅ Copied!";document.getElementById("tfMsg").innerHTML="<span style=\\'color:#10b981;\\'>Copied to clipboard!</span>";});};document.getElementById("tfSecretBtn").onclick=function(){navigator.clipboard.writeText(t);window.open("https://github.com/rajaryan2204/unstop-paid-tracker/settings/secrets/actions/UNSTOP_TOKEN","_blank");};document.getElementById("tfTriggerBtn").onclick=function(){const pat=prompt("Enter your GitHub Personal Access Token (or click cancel):",localStorage.getItem("tf_pat")||"");if(pat){localStorage.setItem("tf_pat",pat);document.getElementById("tfMsg").innerText="⏳ Triggering sync on GitHub...";fetch("https://api.github.com/repos/rajaryan2204/unstop-paid-tracker/actions/workflows/sync.yml/dispatches",{method:"POST",headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+pat,"Content-Type":"application/json"},body:JSON.stringify({ref:"main",inputs:{unstop_token:t,unstop_cookies:document.cookie}})}).then(r=>{if(r.ok)document.getElementById("tfMsg").innerHTML="<b style=\\'color:#10b981;\\'>🚀 Sync Started! Updates in ~30s.</b>";else document.getElementById("tfMsg").innerText="GitHub Error: "+r.status;}).catch(e=>{document.getElementById("tfMsg").innerText="Network Error: "+e;});}};}catch(e){alert("Error: "+e);}})();`;

function openBookmarkletModal() {
  const modal = document.getElementById('bookmarkletModal');
  const link = document.getElementById('draggableBookmarkLink');
  if (link) link.setAttribute('href', BOOKMARKLET_RAW);
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeBookmarkletModal() {
  const modal = document.getElementById('bookmarkletModal');
  if (modal) modal.classList.add('hidden');
}

function copyBookmarkletCode(btn) {
  navigator.clipboard.writeText(BOOKMARKLET_RAW).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="text-emerald-400 font-bold">Copied!</span>';
    setTimeout(() => { btn.innerHTML = orig; if (window.lucide) lucide.createIcons(); }, 1500);
  });
}

