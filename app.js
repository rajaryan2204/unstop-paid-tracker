// techFEST '26 • SLIET Central Organizer Desk Controller
// Tabler UI High-Performance Engine with Instant Cache, Offcanvas & Gatekeeper



let allParticipants = [];
let currentFiltered = [];
let summaryData = {};
let currentCategory = 'all';
let currentPaymentFilter = 'all';

// Pagination state
let currentPage = 1;
let pageSize = 50;

// Bootstrap modal and offcanvas instances
let offcanvasInstance = null;
let bookmarkletModalInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupKeyboardShortcuts();
  loadData();
});

/**
 * Theme Manager: Dark / Light Mode Toggle
 */
function initTheme() {
  const savedTheme = localStorage.getItem('tablerTheme') || 'dark';
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.body.setAttribute('data-bs-theme', theme);
  document.documentElement.setAttribute('data-bs-theme', theme);
  try {
    localStorage.setItem('tablerTheme', theme);
  } catch (e) {}

  const icon = document.getElementById('themeIcon');
  if (icon) {
    if (theme === 'dark') {
      icon.className = 'ti ti-sun fs-2';
      icon.setAttribute('title', 'Switch to light mode');
    } else {
      icon.className = 'ti ti-moon fs-2';
      icon.setAttribute('title', 'Switch to dark mode');
    }
  }
}

function toggleTheme() {
  const current = document.body.getAttribute('data-bs-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Escape closes offcanvas drawer
    if (e.key === 'Escape') {
      closeDrawer();
      closeBookmarkletModal();
    }
    // "/" focuses search input if not inside another text input
    if (e.key === '/' && document.activeElement !== document.getElementById('searchInput')) {
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

  if (refreshIcon) refreshIcon.classList.add('ti-spin');
  if (loading) loading.classList.remove('d-none');
  if (emptyState) emptyState.classList.add('d-none');
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
        'https://raw.githubusercontent.com/sagar-anmol/unstop-paid-tracker/main/data.json',
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
          <td colspan="8" class="py-5 text-center">
            <div class="avatar avatar-lg rounded-circle bg-danger-lt text-danger mx-auto mb-3">
              <i class="ti ti-alert-triangle fs-1"></i>
            </div>
            <h4 class="card-title text-reset fs-3 mb-1">Unable to load participant database</h4>
            <p class="text-secondary small max-w-md mx-auto mb-3">${escapeHtml(err.message || String(err))}</p>
            <div>
              <button onclick="window.location.reload()" class="btn btn-primary btn-sm">
                <i class="ti ti-refresh me-1"></i> Retry Connection
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  } finally {
    if (loading) loading.classList.add('d-none');
    if (refreshIcon) refreshIcon.classList.remove('ti-spin');
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
  const bannerContainer = document.getElementById('tokenExpiryBanner');

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
    if (tokenDot) tokenDot.className = 'status-dot status-dot-animated bg-danger me-1.5';
    if (tokenText) tokenText.textContent = 'Token: Expired';
    if (tokenBadge) tokenBadge.className = 'badge bg-danger-lt d-none d-lg-inline-flex align-items-center py-2 px-2.5 font-monospace text-danger';

    if (bannerContainer) bannerContainer.className = 'alert alert-important alert-danger alert-dismissible d-flex align-items-center justify-content-between p-3 mb-3 shadow-sm';
    if (bannerPill) {
      bannerPill.textContent = 'EXPIRED';
      bannerPill.className = 'badge bg-white text-danger fw-bold';
    }
    if (bannerDetails) bannerDetails.textContent = `Expired on: ${istFormatted} IST. Please update UNSTOP_TOKEN in GitHub repository secrets.`;
    if (bannerIcon) bannerIcon.className = 'avatar avatar-sm bg-white text-danger rounded-3 me-3 shadow-sm';

  } else if (diffHours < 6) {
    if (tokenDot) tokenDot.className = 'status-dot status-dot-animated bg-warning me-1.5';
    if (tokenText) tokenText.textContent = `Token: ${diffHours}h left`;
    if (tokenBadge) tokenBadge.className = 'badge bg-warning-lt d-none d-lg-inline-flex align-items-center py-2 px-2.5 font-monospace text-warning';

    if (bannerContainer) bannerContainer.className = 'alert alert-important alert-warning alert-dismissible d-flex align-items-center justify-content-between p-3 mb-3 shadow-sm';
    if (bannerPill) {
      bannerPill.textContent = 'EXPIRING SOON';
      bannerPill.className = 'badge bg-white text-warning fw-bold';
    }
    if (bannerDetails) bannerDetails.textContent = `Expires on: ${istFormatted} IST (~${diffHours}h remaining). Refresh token before expiration.`;
    if (bannerIcon) bannerIcon.className = 'avatar avatar-sm bg-white text-warning rounded-3 me-3 shadow-sm';

  } else {
    if (tokenDot) tokenDot.className = 'status-dot status-dot-animated bg-green me-1.5';
    if (tokenText) tokenText.textContent = `Token: ~${diffHours}h left`;
    if (tokenBadge) tokenBadge.className = 'badge bg-green-lt d-none d-lg-inline-flex align-items-center py-2 px-2.5 font-monospace text-green';

    if (bannerContainer) bannerContainer.className = 'alert alert-important alert-success alert-dismissible d-flex align-items-center justify-content-between p-3 mb-3 shadow-sm';
    if (bannerPill) {
      bannerPill.textContent = 'ACTIVE';
      bannerPill.className = 'badge bg-white text-success fw-bold';
    }
    if (bannerDetails) bannerDetails.textContent = `Token valid until: ${istFormatted} IST (~${diffHours}h remaining). Auto-sync active.`;
    if (bannerIcon) bannerIcon.className = 'avatar avatar-sm bg-white text-success rounded-3 me-3 shadow-sm';
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
  const statPaid = document.getElementById('statTotalPaid');
  if (statPaid) statPaid.textContent = totalVerified.toLocaleString('en-IN');

  const statApp = document.getElementById('statTotalApplicants');
  if (statApp) statApp.textContent = totalApplicants.toLocaleString('en-IN');

  const statRev = document.getElementById('statTotalRevenue');
  if (statRev) statRev.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  
  const statActiveEventsEl = document.getElementById('statActiveEvents');
  if (statActiveEventsEl) statActiveEventsEl.textContent = totalEvents;

  const subActiveEventsEl = document.getElementById('subActiveEvents');
  if (subActiveEventsEl) {
    subActiveEventsEl.textContent = `${eventsWithPaid} with entries • ${zeroPaidCount} awaiting`;
  }

  const statCol = document.getElementById('statColleges');
  if (statCol) statCol.textContent = colleges.size;

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
      el.className = 'btn btn-primary fw-semibold';
    } else {
      el.className = 'btn btn-outline-secondary';
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
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
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
    opt.textContent = col.length > 38 ? col.substring(0, 36) + '...' : col;
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
    if (filterTag) filterTag.classList.remove('d-none');
  } else {
    if (filterTag) filterTag.classList.add('d-none');
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
      emptyState.classList.remove('d-none');
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
    if (paginationBar) paginationBar.classList.add('d-none');
    return;
  }

  if (emptyState) emptyState.classList.add('d-none');
  if (paginationBar) paginationBar.classList.remove('d-none');

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
      const telLink = p.phone && p.phone !== 'N/A' ? `tel:${p.phone}` : null;

      const hasMembers = p.team_members && p.team_members.length > 0;
      const teamBadge = hasMembers 
        ? `<button onclick="openDrawer('${p.id}')" class="btn btn-sm btn-outline-info py-0 px-2 d-inline-flex align-items-center">
            <i class="ti ti-users me-1"></i> ${p.team_members.length} Members
           </button>`
        : `<span class="badge bg-secondary-lt text-secondary">Solo Entry</span>`;

      // Category styling in Tabler
      let catPill = 'badge bg-azure-lt';
      const evType = (p.event_type || '').toLowerCase();
      if (evType.includes('quiz')) catPill = 'badge bg-warning-lt';
      else if (evType.includes('hack')) catPill = 'badge bg-purple-lt';
      else if (evType.includes('cultur')) catPill = 'badge bg-pink-lt';

      const amt = Number(p.amount) || 0;
      const paymentBlock = amt > 0
        ? `<span class="badge bg-success-lt fw-bold">
            <i class="ti ti-check me-1"></i> Paid ₹${amt.toLocaleString('en-IN')}
           </span>`
        : `<span class="badge bg-secondary-lt text-secondary">
            <i class="ti ti-shield-check me-1 text-info"></i> Free Entry
           </span>`;

      return `
        <tr class="cursor-pointer" onclick="openDrawer('${p.id}')">
          <!-- Index -->
          <td class="text-center font-monospace text-secondary small select-none">
            ${absoluteIndex}
          </td>

          <!-- Participant -->
          <td>
            <div class="d-flex align-items-center">
              <span class="avatar avatar-sm rounded-circle bg-primary-lt text-primary fw-bold font-monospace me-2">
                ${initials}
              </span>
              <div class="min-w-0">
                <div class="fw-bold text-reset">${escapeHtml(p.name || 'Participant')}</div>
                <div class="text-secondary small d-flex align-items-center gap-1 font-monospace mt-0.5" onclick="event.stopPropagation()">
                  <span class="text-truncate" style="max-width: 170px;">${escapeHtml(p.email || '')}</span>
                  ${p.email && p.email !== 'N/A' ? `
                    <button type="button" onclick="copyToClipboard('${escapeHtml(p.email)}', this)" title="Copy Email" class="btn btn-sm btn-icon btn-ghost-secondary p-0 border-0" style="width: 18px; height: 18px;">
                      <i class="ti ti-copy" style="font-size: 11px;"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </td>

          <!-- Contact (Phone + WhatsApp) -->
          <td onclick="event.stopPropagation()">
            ${p.phone && p.phone !== 'N/A' ? `
              <div class="d-flex align-items-center gap-1 font-monospace text-secondary small">
                <span>${escapeHtml(p.phone)}</span>
                ${waLink ? `
                  <a href="${waLink}" target="_blank" rel="noopener noreferrer" title="WhatsApp Message" class="btn btn-sm btn-icon btn-ghost-success p-0 border-0" style="width: 22px; height: 22px;">
                    <i class="ti ti-brand-whatsapp text-success" style="font-size: 15px;"></i>
                  </a>
                ` : ''}
                ${telLink ? `
                  <a href="${telLink}" title="Call" class="btn btn-sm btn-icon btn-ghost-secondary p-0 border-0" style="width: 20px; height: 20px;">
                    <i class="ti ti-phone text-secondary" style="font-size: 13px;"></i>
                  </a>
                ` : ''}
              </div>
            ` : `<span class="text-secondary font-monospace">--</span>`}
          </td>

          <!-- College & Branch -->
          <td>
            <div class="fw-semibold text-truncate" style="max-width: 220px;" title="${escapeHtml(p.college)}">
              ${escapeHtml(p.college || 'N/A')}
            </div>
            ${p.specialization ? `
              <div class="text-secondary small text-truncate mt-0.5" style="max-width: 220px;">
                <span>${escapeHtml(p.specialization)}</span>
                ${p.passing_year ? `<span class="text-secondary font-monospace">• ${p.passing_year}</span>` : ''}
              </div>
            ` : ''}
          </td>

          <!-- Event & Track -->
          <td>
            <div class="fw-semibold text-truncate" style="max-width: 180px;" title="${escapeHtml(p.event_name)}">
              ${escapeHtml(p.event_name || 'Event')}
            </div>
            <div class="mt-1">
              <span class="${catPill} text-uppercase">
                ${escapeHtml(p.event_type || 'Competition')}
              </span>
            </div>
          </td>

          <!-- Team Status -->
          <td onclick="event.stopPropagation()">
            <div class="text-secondary small fw-medium text-truncate mb-1" style="max-width: 120px;" title="${escapeHtml(p.team_name)}">
              ${escapeHtml(p.team_name || 'Individual')}
            </div>
            <div>
              ${teamBadge}
            </div>
          </td>

          <!-- Fee / Payment -->
          <td>
            ${paymentBlock}
          </td>

          <!-- Action -->
          <td class="text-end" onclick="event.stopPropagation()">
            <button onclick="openDrawer('${p.id}')" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center">
              <span>View</span>
              <i class="ti ti-chevron-right ms-1"></i>
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
        ? `<span class="badge bg-success-lt fw-bold">₹${amt} Paid</span>`
        : `<span class="badge bg-secondary-lt text-secondary">Free Entry</span>`;

      let trackPill = 'badge bg-azure-lt';
      const evType = (p.event_type || '').toLowerCase();
      if (evType.includes('quiz')) trackPill = 'badge bg-warning-lt';
      else if (evType.includes('hack')) trackPill = 'badge bg-purple-lt';

      return `
        <div class="card mb-2 shadow-sm cursor-pointer" onclick="openDrawer('${p.id}')">
          <div class="card-body p-3">
            <!-- Header -->
            <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <span class="avatar avatar-sm rounded-3 bg-primary-lt text-primary fw-bold font-monospace">
                  ${initials}
                </span>
                <div class="min-w-0">
                  <div class="fw-bold text-reset text-truncate">${escapeHtml(p.name)}</div>
                  <div class="text-secondary small font-monospace text-truncate">${escapeHtml(p.phone || p.email)}</div>
                </div>
              </div>
              <div class="flex-shrink-0">
                ${feePill}
              </div>
            </div>

            <!-- Event & Track -->
            <div class="bg-body-tertiary p-2.5 rounded border mb-2 small">
              <div class="d-flex justify-content-between align-items-center gap-2 mb-1">
                <span class="fw-semibold text-truncate">${escapeHtml(p.event_name)}</span>
                <span class="${trackPill} text-uppercase">${escapeHtml(p.event_type || 'Event')}</span>
              </div>
              <div class="text-secondary text-truncate">${escapeHtml(p.college || 'SLIET')}</div>
            </div>

            <!-- Bottom Actions -->
            <div class="d-flex align-items-center justify-content-between pt-2 border-top" onclick="event.stopPropagation()">
              <div class="d-flex gap-1">
                ${waLink ? `
                  <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success d-inline-flex align-items-center">
                    <i class="ti ti-brand-whatsapp me-1"></i> WhatsApp
                  </a>
                ` : ''}
                ${telLink ? `
                  <a href="${telLink}" class="btn btn-sm btn-icon btn-outline-secondary">
                    <i class="ti ti-phone text-secondary"></i>
                  </a>
                ` : ''}
              </div>

              <button onclick="openDrawer('${p.id}')" class="btn btn-sm btn-primary d-inline-flex align-items-center">
                <span>View Details</span>
                <i class="ti ti-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    mobileContainer.innerHTML = mobileCardsHtml;
  }
}

/**
 * Slide-over Candidate Offcanvas Drawer (Full screen on mobile, right sheet on desktop)
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
    ? `<div class="card card-sm mb-3 border-success-subtle bg-success-lt shadow-sm">
        <div class="card-body p-3">
          <div class="text-uppercase tracking-wider fw-bold text-success small">Payment Status</div>
          <div class="h3 fw-bold my-1 text-success d-flex align-items-center gap-1.5">
            <i class="ti ti-check fs-2"></i>
            <span>Paid ₹${amt.toLocaleString('en-IN')} (Gateway Confirmed)</span>
          </div>
          <div class="text-secondary small font-monospace user-select-all mt-1">Reference: ${escapeHtml(p.payment_id)}</div>
        </div>
       </div>`
    : `<div class="card card-sm mb-3 border-info-subtle bg-info-lt shadow-sm">
        <div class="card-body p-3">
          <div class="text-uppercase tracking-wider fw-bold text-info small">Registration Status</div>
          <div class="h3 fw-semibold my-1 text-info d-flex align-items-center gap-1.5">
            <i class="ti ti-shield-check fs-2"></i>
            <span>Free Competition Entry (Form Verified)</span>
          </div>
          <div class="text-secondary small font-monospace user-select-all mt-1">Unstop Entry ID: ${escapeHtml(p.id)}</div>
        </div>
       </div>`;

  const membersHtml = (p.team_members && p.team_members.length > 0)
    ? p.team_members.map((m, idx) => `
        <div class="list-group-item p-3">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <div class="fw-bold text-reset d-flex align-items-center gap-1.5">
              <span>${idx + 1}. ${escapeHtml(m.name || 'Member')}</span>
              ${idx === 0 ? `<span class="badge bg-green-lt text-green font-monospace ms-1">LEADER</span>` : ''}
            </div>
            <div class="text-secondary small text-truncate" style="max-width: 180px;" title="${escapeHtml(m.college || '')}">
              ${escapeHtml(m.college || '')}
            </div>
          </div>
          <div class="text-secondary small font-monospace user-select-all">
            ${escapeHtml(m.email || '')} ${m.phone ? `• ${m.phone}` : ''}
          </div>
        </div>
      `).join('')
    : `<div class="p-3 text-secondary text-center fst-italic">
        Solo Registration (Individual Participant)
       </div>`;

  const drawerBody = document.getElementById('drawerBody');
  drawerBody.innerHTML = `
    <!-- Quick Contact Actions -->
    <div class="row g-2 mb-3">
      ${waLink ? `
        <div class="col">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success w-100 d-inline-flex align-items-center justify-content-center">
            <i class="ti ti-brand-whatsapp me-1"></i> WhatsApp Leader
          </a>
        </div>
      ` : ''}
      ${mailLink ? `
        <div class="col">
          <a href="${mailLink}" class="btn btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center">
            <i class="ti ti-mail me-1"></i> Send Email
          </a>
        </div>
      ` : ''}
      ${telLink ? `
        <div class="col-auto">
          <a href="${telLink}" class="btn btn-icon btn-outline-secondary" title="Call">
            <i class="ti ti-phone"></i>
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Payment / Registration Status Card -->
    ${paymentBadge}

    <!-- Candidate Profile Section -->
    <div class="card mb-3 shadow-sm">
      <div class="card-header py-2.5">
        <h4 class="card-title fs-4 mb-0 d-flex align-items-center">
          <i class="ti ti-user me-2 text-primary"></i> Candidate Profile
        </h4>
      </div>
      <div class="card-body p-0">
        <table class="table table-sm table-vcenter card-table table-borderless">
          <tbody>
            <tr>
              <td class="text-secondary" style="width: 140px;">Candidate Name:</td>
              <td class="fw-bold text-reset">${escapeHtml(p.name)}</td>
            </tr>
            <tr>
              <td class="text-secondary">Email Address:</td>
              <td class="font-monospace user-select-all">${escapeHtml(p.email)}</td>
            </tr>
            <tr>
              <td class="text-secondary">Contact Number:</td>
              <td class="font-monospace user-select-all">${escapeHtml(p.phone)}</td>
            </tr>
            <tr>
              <td class="text-secondary">College / Institute:</td>
              <td class="fw-medium">${escapeHtml(p.college)}</td>
            </tr>
            ${p.specialization ? `
              <tr>
                <td class="text-secondary">Course / Branch:</td>
                <td>${escapeHtml(p.specialization)}</td>
              </tr>
            ` : ''}
            ${p.passing_year ? `
              <tr>
                <td class="text-secondary">Graduation Year:</td>
                <td class="font-monospace">${escapeHtml(p.passing_year)}</td>
              </tr>
            ` : ''}
            <tr>
              <td class="text-secondary">Registration Date:</td>
              <td>${p.registered_at ? new Date(p.registered_at).toLocaleString('en-IN') : 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ${p.resume_url ? `
        <div class="card-footer py-2 text-end">
          <a href="${p.resume_url.startsWith('http') ? p.resume_url : 'https://d8it4huxumps7.cloudfront.net/' + p.resume_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center">
            <i class="ti ti-file-text me-1"></i> Download Uploaded Resume PDF
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Team Members Section -->
    <div class="card shadow-sm">
      <div class="card-header py-2.5 d-flex align-items-center justify-content-between">
        <h4 class="card-title fs-4 mb-0 d-flex align-items-center">
          <i class="ti ti-users me-2 text-azure"></i> Team Roster (${escapeHtml(p.team_name || 'Individual')})
        </h4>
        <span class="badge bg-secondary-lt font-monospace">${(p.team_members || []).length} registered member(s)</span>
      </div>
      <div class="list-group list-group-flush">
        ${membersHtml}
      </div>
    </div>
  `;

  const footerTimestamp = document.getElementById('drawerFooterTimestamp');
  if (footerTimestamp) {
    footerTimestamp.textContent = `Unstop ID: ${p.internal_id || p.id}`;
  }

  // Open offcanvas
  const offcanvasEl = document.getElementById('candidateOffcanvas');
  if (window.bootstrap && window.bootstrap.Offcanvas) {
    if (!offcanvasInstance) {
      offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);
    }
    offcanvasInstance.show();
  } else {
    offcanvasEl.classList.add('show');
    offcanvasEl.style.visibility = 'visible';
  }
}

function closeDrawer() {
  const offcanvasEl = document.getElementById('candidateOffcanvas');
  if (window.bootstrap && window.bootstrap.Offcanvas) {
    const inst = bootstrap.Offcanvas.getInstance(offcanvasEl);
    if (inst) inst.hide();
  } else if (offcanvasEl) {
    offcanvasEl.classList.remove('show');
    offcanvasEl.style.visibility = 'hidden';
  }
}

function copyToClipboard(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const original = el.innerHTML;
    el.innerHTML = '<span class="text-success font-monospace" style="font-size: 10px;">Copied!</span>';
    setTimeout(() => {
      el.innerHTML = original;
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

const BOOKMARKLET_RAW = `javascript:(function(){try{const ex=document.getElementById("tfSyncBox");if(ex)ex.remove();const jwtRegex=/eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]+/;let token="";const cookieMatch=document.cookie.match(jwtRegex);if(cookieMatch)token=cookieMatch[0];if(!token){for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);const v=localStorage.getItem(k)||"";const m=v.match(jwtRegex);if(m){token=m[0];break;}}}if(!token){for(let i=0;i<sessionStorage.length;i++){const k=sessionStorage.key(i);const v=sessionStorage.getItem(k)||"";const m=v.match(jwtRegex);if(m){token=m[0];break;}}}function getExp(t){try{const p=JSON.parse(atob(t.split(".")[1]));if(p.exp)return new Date(p.exp*1000).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"});}catch(e){}return "24 hours";}const b=document.createElement("div");b.id="tfSyncBox";b.style.cssText="position:fixed;top:20px;right:20px;z-index:9999999;background:#0d1017;color:#f1f5f9;border:1px solid #10b981;border-radius:14px;padding:16px;box-shadow:0 25px 50px rgba(0,0,0,0.85);font-family:system-ui,-apple-system,sans-serif;width:340px;font-size:12px;line-height:1.4;";if(token){const exp=getExp(token);b.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><strong style="color:#10b981;font-size:13px;">⚡ techFEST \\'26 Sync</strong><button onclick="this.closest(\\'#tfSyncBox\\').remove()" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;">✕</button></div><p style="color:#94a3b8;margin:0 0 10px 0;font-size:11px;">Token captured! Valid until: <b style="color:#f1f5f9;">'+exp+'</b></p><div style="display:flex;flex-direction:column;gap:7px;"><button id="tfCopyBtn" style="background:#10b981;color:#000;border:none;padding:7px 10px;border-radius:6px;font-weight:700;cursor:pointer;font-size:11px;">📋 Copy Bearer Token</button><button id="tfSecretBtn" style="background:#1e293b;color:#f1f5f9;border:1px solid #334155;padding:7px 10px;border-radius:6px;font-weight:600;cursor:pointer;font-size:11px;">⚙️ Open GitHub Secret (Paste & Save)</button><button id="tfTriggerBtn" style="background:#0f172a;color:#38bdf8;border:1px solid #0284c7;padding:7px 10px;border-radius:6px;font-weight:600;cursor:pointer;font-size:11px;">🚀 Trigger GitHub Actions Sync</button></div><div id="tfMsg" style="font-size:10px;color:#64748b;margin-top:8px;text-align:center;">Target: sagar-anmol/unstop-paid-tracker</div>';document.body.appendChild(b);document.getElementById("tfCopyBtn").onclick=function(){navigator.clipboard.writeText(token).then(()=>{this.innerText="✅ Copied!";document.getElementById("tfMsg").innerHTML="<span style=\\'color:#10b981;\\'>Copied to clipboard!</span>";});};document.getElementById("tfSecretBtn").onclick=function(){navigator.clipboard.writeText(token);window.open("https://github.com/sagar-anmol/unstop-paid-tracker/settings/secrets/actions/UNSTOP_TOKEN","_blank");};document.getElementById("tfTriggerBtn").onclick=function(){const pat=prompt("Enter GitHub Personal Access Token (or Cancel):",localStorage.getItem("tf_pat")||"");if(pat){localStorage.setItem("tf_pat",pat);document.getElementById("tfMsg").innerText="⏳ Triggering sync...";fetch("https://api.github.com/repos/sagar-anmol/unstop-paid-tracker/actions/workflows/sync.yml/dispatches",{method:"POST",headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+pat,"Content-Type":"application/json"},body:JSON.stringify({ref:"main",inputs:{unstop_token:token,unstop_cookies:document.cookie}})}).then(r=>{if(r.ok)document.getElementById("tfMsg").innerHTML="<b style=\\'color:#10b981;\\'>🚀 Sync Started! Updates in ~30s.</b>";else document.getElementById("tfMsg").innerText="GitHub Error: "+r.status;}).catch(e=>{document.getElementById("tfMsg").innerText="Network Error: "+e;});}};}else{b.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><strong style="color:#38bdf8;font-size:13px;">⚡ techFEST \\'26 Sync</strong><button onclick="this.closest(\\'#tfSyncBox\\').remove()" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;">✕</button></div><p style="color:#e2e8f0;margin:0 0 8px 0;font-size:11px;">Token memory me hai. Left menu me <b>Opportunities</b> par click karein aur bookmark firse dabayein, YA token yaha paste karein:</p><textarea id="tfInput" placeholder="Paste Authorization header / Bearer token yaha karein..." style="width:100%;height:52px;background:#05070a;border:1px solid #334155;border-radius:6px;color:#fff;padding:6px;font-size:10px;font-family:monospace;box-sizing:border-box;margin-bottom:8px;resize:none;"></textarea><button id="tfManualBtn" style="width:100%;background:#10b981;color:#000;border:none;padding:7px 10px;border-radius:6px;font-weight:700;cursor:pointer;font-size:11px;">🚀 Save & Open Secret</button><div id="tfMsg" style="font-size:10px;color:#94a3b8;margin-top:6px;text-align:center;">F12 -> Network -> Copy Authorization</div>';document.body.appendChild(b);document.getElementById("tfManualBtn").onclick=function(){const raw=document.getElementById("tfInput").value||"";const m=raw.match(jwtRegex);if(m){const tok=m[0];navigator.clipboard.writeText(tok);window.open("https://github.com/sagar-anmol/unstop-paid-tracker/settings/secrets/actions/UNSTOP_TOKEN","_blank");this.innerText="✅ Copied & Opened Secret!";}else{alert("No valid token found in pasted text. Token starts with eyJ...");}};} }catch(err){alert("Sync Bookmarklet Error: "+err);}})();`;

function openBookmarkletModal() {
  const modalEl = document.getElementById('bookmarkletModal');
  const link = document.getElementById('draggableBookmarkLink');
  if (link) link.setAttribute('href', BOOKMARKLET_RAW);

  if (window.bootstrap && window.bootstrap.Modal) {
    if (!bookmarkletModalInstance) {
      bookmarkletModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    }
    bookmarkletModalInstance.show();
  } else {
    modalEl.classList.add('show');
    modalEl.style.display = 'block';
  }
}

function closeBookmarkletModal() {
  const modalEl = document.getElementById('bookmarkletModal');
  if (window.bootstrap && window.bootstrap.Modal) {
    const inst = bootstrap.Modal.getInstance(modalEl);
    if (inst) inst.hide();
  } else if (modalEl) {
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
  }
}

function copyBookmarkletCode(btn) {
  navigator.clipboard.writeText(BOOKMARKLET_RAW).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="text-success font-bold font-monospace">Copied!</span>';
    setTimeout(() => { 
      btn.innerHTML = orig; 
    }, 1500);
  });
}
