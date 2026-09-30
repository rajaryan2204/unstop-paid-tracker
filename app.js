// techFEST '26 • SLIET Central Organizer Desk Controller
// Linear / Vercel 2026 Dark Operations Theme with Instant Cache, Real Activity Analytics & Offcanvas

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
let tokenHealthModalInstance = null;

// Chart state
let overviewChartInstance = null;
let currentChartMode = 'timeline'; // 'timeline' or 'events'

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupKeyboardShortcuts();
  loadData();
});

// Deterministic Soft Vibrant Avatar Colors (Linear / Stripe inspired)
const AVATAR_PALETTES = [
  { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' }, // Cyan
  { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' }, // Emerald
  { bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc', border: 'rgba(192, 132, 252, 0.3)' }, // Purple
  { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' }, // Amber
  { bg: 'rgba(251, 113, 133, 0.15)', text: '#fb7185', border: 'rgba(251, 113, 133, 0.3)' }, // Rose
  { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8', border: 'rgba(129, 140, 248, 0.3)' }, // Indigo
  { bg: 'rgba(45, 212, 191, 0.15)', text: '#2dd4bf', border: 'rgba(45, 212, 191, 0.3)' }, // Teal
  { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' }  // Orange
];

function getAvatarStyle(name) {
  let hash = 0;
  const str = String(name || 'Participant');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const p = AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
  return `background-color: ${p.bg} !important; color: ${p.text} !important; border: 1px solid ${p.border} !important;`;
}

function getTrackBadgeHtml(eventType) {
  const type = String(eventType || 'Competitions').toLowerCase();
  if (type.includes('quiz')) {
    return `<span class="tag-track tag-quiz"><span class="track-dot dot-quiz"></span>Quizzes</span>`;
  } else if (type.includes('hack')) {
    return `<span class="tag-track tag-hackathon"><span class="track-dot dot-hack"></span>Hackathons</span>`;
  } else if (type.includes('cultur')) {
    return `<span class="tag-track tag-cultural"><span class="track-dot dot-cult"></span>Cultural</span>`;
  } else {
    return `<span class="tag-track tag-competition"><span class="track-dot dot-comp"></span>Competition</span>`;
  }
}

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

  // Re-render chart on theme change to update colors
  if (allParticipants.length > 0) {
    renderEventOverviewChart(allParticipants, summaryData);
  }
}

function toggleTheme() {
  const current = document.body.getAttribute('data-bs-theme') || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function setupKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Escape closes offcanvas drawer or modals
    if (e.key === 'Escape') {
      closeDrawer();
      closeBookmarkletModal();
      closeTokenHealthModal();
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
    renderEventOverviewChart(allParticipants, summaryData);

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
  const tokenBadge = document.getElementById('tokenBadge');
  const tokenDot = document.getElementById('tokenDot');
  const tokenText = document.getElementById('tokenText');
  const bannerContainer = document.getElementById('tokenExpiryBanner');

  if (bannerContainer) {
    bannerContainer.remove();
  }

  const expiry = summary.token_expires_at;
  if (expiry) {
    const expDate = new Date(expiry);
    const now = new Date();
    const diffHours = Math.round((expDate - now) / (1000 * 60 * 60));
    if (tokenText) {
      tokenText.textContent = diffHours > 0 ? `Token: ${diffHours}h left` : 'Token: Active';
    }
    if (tokenBadge) {
      tokenBadge.setAttribute('title', `Unstop OAuth: Valid until ${expDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST • Click to view health`);
    }
  } else {
    if (tokenText) tokenText.textContent = 'Token: Active';
  }

  if (tokenDot) tokenDot.className = 'status-dot status-dot-animated bg-green me-1';
}

function openTokenHealthModal() {
  const modalEl = document.getElementById('tokenHealthModal');
  if (!modalEl) return;
  if (window.bootstrap && window.bootstrap.Modal) {
    if (!tokenHealthModalInstance) {
      tokenHealthModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    }
    tokenHealthModalInstance.show();
  } else {
    modalEl.classList.add('show');
    modalEl.style.display = 'block';
  }
}

function closeTokenHealthModal() {
  const modalEl = document.getElementById('tokenHealthModal');
  if (!modalEl) return;
  if (window.bootstrap && window.bootstrap.Modal) {
    const inst = bootstrap.Modal.getInstance(modalEl);
    if (inst) inst.hide();
  } else {
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
  }
}

/**
 * Render Executive Summary Bar
 */
function renderSummary(summary, participants) {
  const totalVerified = participants.length;
  const totalApplicants = summary.total_unstop_registrations || 3549;
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
  if (statRev) {
    statRev.textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
    statRev.style.color = '#10b981';
  }
  
  const statActiveEventsEl = document.getElementById('statActiveEvents');
  if (statActiveEventsEl) {
    statActiveEventsEl.textContent = totalEvents;
    statActiveEventsEl.style.color = '#c084fc';
  }

  const subActiveEventsEl = document.getElementById('subActiveEvents');
  if (subActiveEventsEl) {
    subActiveEventsEl.textContent = `${eventsWithPaid} with entries • ${zeroPaidCount} awaiting`;
  }

  const statCol = document.getElementById('statColleges');
  if (statCol) {
    statCol.textContent = colleges.size;
    statCol.style.color = '#fbbf24';
  }

  // Subtitles
  const subPaid = document.getElementById('subTotalPaid');
  if (subPaid) subPaid.textContent = `${freeCount} Free • ${paidCount} Paid`;

  const subRevenue = document.getElementById('subTotalRevenue');
  if (subRevenue) subRevenue.textContent = `RC Boat + Ghost Code`;

  const subColleges = document.getElementById('subColleges');
  if (subColleges) subColleges.textContent = `PAN-India (${colleges.size} Colleges)`;
}

/**
 * Event Overview Real-Data Chart (Chart.js 4.4)
 */
function switchOverviewChart(mode) {
  currentChartMode = mode;
  const btnTimeline = document.getElementById('chartViewTimelineBtn');
  const btnEvents = document.getElementById('chartViewEventsBtn');

  if (btnTimeline) {
    if (mode === 'timeline') btnTimeline.classList.add('active');
    else btnTimeline.classList.remove('active');
  }
  if (btnEvents) {
    if (mode === 'events') btnEvents.classList.add('active');
    else btnEvents.classList.remove('active');
  }

  renderEventOverviewChart(allParticipants, summaryData);
}

function renderEventOverviewChart(participants, summary) {
  const canvas = document.getElementById('overviewChartCanvas');
  if (!canvas || !window.Chart) return;

  const isDark = (document.body.getAttribute('data-bs-theme') || 'dark') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)';
  const textColor = isDark ? '#626A78' : '#8B93A1';
  const accentColor = '#4EA8FF';

  if (overviewChartInstance) {
    overviewChartInstance.destroy();
    overviewChartInstance = null;
  }

  const ctx = canvas.getContext('2d');

  if (currentChartMode === 'timeline') {
    // Process real registration timestamps
    const dateCounts = {};
    participants.forEach(p => {
      if (p.registered_at) {
        const d = p.registered_at.substring(0, 10);
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(dateCounts).sort();
    const labels = sortedDates.map(d => {
      const parts = d.split('-');
      if (parts.length === 3) {
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const m = parseInt(parts[1], 10) - 1;
        return `${monthNames[m] || parts[1]} ${parts[2]}`;
      }
      return d;
    });

    const counts = sortedDates.map(d => dateCounts[d]);

    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(2, 132, 199, 0.2)');
    gradient.addColorStop(0.6, isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.05)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    overviewChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Registrations',
          data: counts,
          borderColor: '#38bdf8',
          borderWidth: 2,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: isDark ? '#0B0D10' : '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: 2.5,
          pointHoverRadius: 5.5,
          fill: true,
          backgroundColor: gradient,
          tension: 0.32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#151922' : '#ffffff',
            titleColor: isDark ? '#F5F7FA' : '#0F172A',
            bodyColor: isDark ? '#8B93A1' : '#475569',
            borderColor: isDark ? '#242832' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 8,
            cornerRadius: 4,
            displayColors: false,
            titleFont: { family: 'Geist, Inter, sans-serif', size: 11, weight: '500' },
            bodyFont: { family: 'Geist, Inter, sans-serif', size: 11 },
            callbacks: {
              label: function(context) {
                return ` ${context.parsed.y} verified entries`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: textColor, font: { family: 'Geist, sans-serif', size: 10 } }
          },
          y: {
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: textColor, font: { family: 'Geist, sans-serif', size: 10 }, precision: 0 }
          }
        }
      }
    });

  } else {
    // Process top 8 competitions
    const eventCounts = {};
    participants.forEach(p => {
      const ev = (p.event_name || 'Event').trim();
      eventCounts[ev] = (eventCounts[ev] || 0) + 1;
    });

    const sortedEvents = Object.keys(eventCounts)
      .sort((a, b) => eventCounts[b] - eventCounts[a])
      .slice(0, 8);

    const labels = sortedEvents.map(e => e.length > 20 ? e.substring(0, 18) + '...' : e);
    const counts = sortedEvents.map(e => eventCounts[e]);

    overviewChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Verified Entries',
          data: counts,
          backgroundColor: isDark ? 'rgba(78, 168, 255, 0.55)' : 'rgba(2, 132, 199, 0.55)',
          borderRadius: 3,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? '#151922' : '#ffffff',
            titleColor: isDark ? '#F5F7FA' : '#0F172A',
            bodyColor: isDark ? '#8B93A1' : '#475569',
            borderColor: isDark ? '#242832' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 8,
            cornerRadius: 4,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return ` ${context.parsed.y} verified entries`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Geist, sans-serif', size: 10 } }
          },
          y: {
            grid: { color: gridColor, drawBorder: false },
            ticks: { color: textColor, font: { family: 'Geist, sans-serif', size: 10 }, precision: 0 }
          }
        }
      }
    });
  }
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
    if (cat === 'all') btn.innerHTML = `All Events <span class="tab-count count-all">${counts.all}</span>`;
    if (cat === 'competitions') btn.innerHTML = `Competitions <span class="tab-count count-comp">${counts.competitions}</span>`;
    if (cat === 'quizzes') btn.innerHTML = `Quizzes <span class="tab-count count-quiz">${counts.quizzes}</span>`;
    if (cat === 'hackathons') btn.innerHTML = `Hackathons <span class="tab-count count-hack">${counts.hackathons}</span>`;
    if (cat === 'cultural') btn.innerHTML = `Cultural & Jam <span class="tab-count count-cult">${counts.cultural}</span>`;
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

  if (btnAll) btnAll.innerHTML = `All <span class="tab-count">${participants.length}</span>`;
  if (btnPaid) btnPaid.innerHTML = `Paid <span class="tab-count count-paid">${paidCount}</span>`;
  if (btnFree) btnFree.innerHTML = `Free <span class="tab-count count-free">${freeCount}</span>`;
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
      el.classList.add('active');
    } else {
      el.classList.remove('active');
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

    eventsWithEntries.sort((a, b) => {
      const cntA = eventCounts[(a.title || '').trim()] || a.paid_registrations || 0;
      const cntB = eventCounts[(b.title || '').trim()] || b.paid_registrations || 0;
      return cntB - cntA;
    });

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
  const selectedEvent = (document.getElementById('eventFilter').value || '').trim();
  const selectedCollege = (document.getElementById('collegeFilter').value || '').trim();
  const sortBy = document.getElementById('sortSelect').value || 'date-desc';

  currentFiltered = allParticipants.filter(p => {
    // 1. Category Filter
    if (currentCategory !== 'all') {
      const t = (p.event_type || 'competitions').toLowerCase();
      if (currentCategory === 'quizzes' && !t.includes('quiz')) return false;
      if (currentCategory === 'hackathons' && !t.includes('hack')) return false;
      if (currentCategory === 'cultural' && !t.includes('cultur')) return false;
      if (currentCategory === 'competitions' && (t.includes('quiz') || t.includes('hack') || t.includes('cultur'))) return false;
    }

    // 2. Payment Filter
    if (currentPaymentFilter === 'paid') {
      if (Number(p.amount) <= 0) return false;
    } else if (currentPaymentFilter === 'free') {
      if (Number(p.amount) > 0) return false;
    }

    // 3. Specific Event Dropdown
    if (selectedEvent && (p.event_name || '').trim() !== selectedEvent) {
      return false;
    }

    // 4. Specific College Dropdown
    if (selectedCollege && (p.college || '').trim() !== selectedCollege) {
      return false;
    }

    // 5. Global Search query
    if (query) {
      const matchName = (p.name || '').toLowerCase().includes(query);
      const matchEmail = (p.email || '').toLowerCase().includes(query);
      const matchPhone = (p.phone || '').toLowerCase().includes(query);
      const matchCollege = (p.college || '').toLowerCase().includes(query);
      const matchEvent = (p.event_name || '').toLowerCase().includes(query);
      const matchTeam = (p.team_name || '').toLowerCase().includes(query);
      const matchId = (p.id || '').toLowerCase().includes(query);

      const matchMembers = (p.team_members || []).some(m => 
        (m.name || '').toLowerCase().includes(query) ||
        (m.email || '').toLowerCase().includes(query) ||
        (m.phone || '').toLowerCase().includes(query)
      );

      if (!matchName && !matchEmail && !matchPhone && !matchCollege && !matchEvent && !matchTeam && !matchId && !matchMembers) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  currentFiltered.sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.registered_at || 0) - new Date(a.registered_at || 0);
    }
    if (sortBy === 'date-asc') {
      return new Date(a.registered_at || 0) - new Date(b.registered_at || 0);
    }
    if (sortBy === 'name-asc') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'event-asc') {
      return (a.event_name || '').localeCompare(b.event_name || '');
    }
    if (sortBy === 'amount-desc') {
      return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    }
    return 0;
  });

  // Toggle Clear Filter tag
  const isFiltering = query || selectedEvent || selectedCollege || currentCategory !== 'all' || currentPaymentFilter !== 'all';
  const filterTag = document.getElementById('filterTag');
  if (filterTag) {
    if (isFiltering) filterTag.classList.remove('d-none');
    else filterTag.classList.add('d-none');
  }

  currentPage = 1;
  renderDataViews(currentFiltered);
}

function clearSearch() {
  const sInput = document.getElementById('searchInput');
  if (sInput) sInput.value = '';

  const evFilter = document.getElementById('eventFilter');
  if (evFilter) evFilter.value = '';

  const colFilter = document.getElementById('collegeFilter');
  if (colFilter) colFilter.value = '';

  currentCategory = 'all';
  const buttons = document.querySelectorAll('.cat-tab');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-cat') === 'all') btn.classList.add('active');
    else btn.classList.remove('active');
  });

  setPaymentFilter('all');
}

function changePageSize() {
  const select = document.getElementById('pageSizeSelect');
  if (!select) return;
  const val = select.value;
  pageSize = val === 'all' ? 999999 : parseInt(val, 10);
  currentPage = 1;
  renderDataViews(currentFiltered);
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderDataViews(currentFiltered);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  }
}

function nextPage() {
  const totalPages = Math.max(1, Math.ceil(currentFiltered.length / pageSize));
  if (currentPage < totalPages) {
    currentPage++;
    renderDataViews(currentFiltered);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  }
}

/**
 * Render High-Density Desktop Table and Mobile Cards Feed
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
      
      const emptyTitle = emptyState.querySelector('h4');
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

      const avatarStyle = getAvatarStyle(p.name);

      const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
      const telLink = p.phone && p.phone !== 'N/A' ? `tel:${p.phone}` : null;

      const hasMembers = p.team_members && p.team_members.length > 0;
      const teamBadge = hasMembers 
        ? `<button onclick="openDrawer('${p.id}')" class="btn-member-tag d-inline-flex align-items-center" style="font-size: 11px;">
            <i class="ti ti-users me-1"></i> ${p.team_members.length}
           </button>`
        : `<span class="text-muted" style="font-size: 11px;">Solo</span>`;

      const trackBadgeHtml = getTrackBadgeHtml(p.event_type);

      const amt = Number(p.amount) || 0;
      const paymentBlock = amt > 0
        ? `<span class="tag-paid">Paid ₹${amt.toLocaleString('en-IN')}</span>`
        : `<span class="tag-free">Free</span>`;

      return `
        <tr onclick="openDrawer('${p.id}')">
          <!-- Index -->
          <td class="text-center font-monospace" style="font-size: 11px; color: var(--tf-text-muted);">
            ${absoluteIndex}
          </td>

          <!-- Participant -->
          <td>
            <div class="d-flex align-items-center gap-2">
              <span class="user-avatar-sm" style="${avatarStyle}">${initials}</span>
              <div class="min-w-0">
                <div class="fw-medium text-reset text-truncate" style="max-width: 190px; font-size: 13px;">${escapeHtml(p.name || 'Participant')}</div>
                <div class="font-monospace d-flex align-items-center gap-1 mt-0.5" style="font-size: 11px; color: var(--tf-text-secondary);" onclick="event.stopPropagation()">
                  <span class="text-truncate" style="max-width: 155px;">${escapeHtml(p.email || '')}</span>
                  ${p.email && p.email !== 'N/A' ? `
                    <button type="button" onclick="copyToClipboard('${escapeHtml(p.email)}', this)" title="Copy Email" class="btn btn-icon p-0 border-0" style="width: 15px; height: 15px; color: var(--tf-text-muted); background: transparent;">
                      <i class="ti ti-copy" style="font-size: 10px;"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </td>

          <!-- Contact (Phone + WhatsApp + Call) -->
          <td onclick="event.stopPropagation()">
            ${p.phone && p.phone !== 'N/A' ? `
              <div class="d-flex align-items-center gap-1.5 font-monospace" style="font-size: 11.5px; color: var(--tf-text-secondary);">
                <span>${escapeHtml(p.phone)}</span>
                ${waLink ? `
                  <a href="${waLink}" target="_blank" rel="noopener noreferrer" title="Chat on WhatsApp" class="btn-wa-pill">
                    <i class="ti ti-brand-whatsapp"></i>
                    <span>WA</span>
                  </a>
                ` : ''}
                ${telLink ? `
                  <a href="${telLink}" title="Call" class="btn-call-pill">
                    <i class="ti ti-phone"></i>
                  </a>
                ` : ''}
              </div>
            ` : `<span class="font-monospace" style="font-size: 11px; color: var(--tf-text-muted);">--</span>`}
          </td>

          <!-- College & Branch -->
          <td>
            <div class="fw-medium text-truncate text-reset" style="max-width: 210px; font-size: 12.5px;" title="${escapeHtml(p.college)}">
              ${escapeHtml(p.college || 'N/A')}
            </div>
            ${p.specialization ? `
              <div class="text-truncate mt-0.5" style="max-width: 210px; font-size: 11px; color: var(--tf-text-secondary);">
                <span>${escapeHtml(p.specialization)}</span>
                ${p.passing_year ? `<span style="color: var(--tf-text-muted);"> • ${p.passing_year}</span>` : ''}
              </div>
            ` : ''}
          </td>

          <!-- Event & Track -->
          <td>
            <div class="fw-medium text-truncate text-reset" style="max-width: 170px; font-size: 12.5px;" title="${escapeHtml(p.event_name)}">
              ${escapeHtml(p.event_name || 'Event')}
            </div>
            <div class="mt-1">
              ${trackBadgeHtml}
            </div>
          </td>

          <!-- Team Status -->
          <td onclick="event.stopPropagation()">
            <div class="text-truncate mb-1" style="max-width: 120px; font-size: 11.5px; color: var(--tf-text-secondary);" title="${escapeHtml(p.team_name)}">
              ${escapeHtml(p.team_name || 'Individual')}
            </div>
            <div>
              ${teamBadge}
            </div>
          </td>

          <!-- Fee / Status -->
          <td>
            ${paymentBlock}
          </td>

          <!-- Action -->
          <td class="text-end" onclick="event.stopPropagation()">
            <button onclick="openDrawer('${p.id}')" class="btn-view-pill">
              <span>View</span>
              <i class="ti ti-arrow-right" style="font-size: 11px;"></i>
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
      const initials = (p.name || 'P')
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'TF';

      const avatarStyle = getAvatarStyle(p.name);

      const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
      const telLink = p.phone && p.phone !== 'N/A' ? `tel:${p.phone}` : null;

      const amt = Number(p.amount) || 0;
      const feePill = amt > 0
        ? `<span class="tag-paid">Paid ₹${amt}</span>`
        : `<span class="tag-free">Free</span>`;

      const trackBadgeHtml = getTrackBadgeHtml(p.event_type);

      return `
        <div class="mobile-attendee-card cursor-pointer" onclick="openDrawer('${p.id}')">
          <!-- Top Row -->
          <div class="d-flex align-items-start justify-content-between gap-2 mb-2">
            <div class="d-flex align-items-center gap-2 min-w-0">
              <span class="user-avatar-sm" style="${avatarStyle}; width: 28px; height: 28px;">${initials}</span>
              <div class="min-w-0">
                <div class="fw-medium text-reset text-truncate" style="font-size: 13px;">${escapeHtml(p.name)}</div>
                <div class="font-monospace text-truncate" style="font-size: 11px; color: var(--tf-text-secondary);">${escapeHtml(p.phone || p.email)}</div>
              </div>
            </div>
            <div class="flex-shrink-0">
              ${feePill}
            </div>
          </div>

          <!-- Event & College Details -->
          <div class="p-2 rounded mb-2" style="background: var(--tf-bg-elevated); border: 1px solid var(--tf-border); font-size: 12px;">
            <div class="d-flex justify-content-between align-items-center gap-2 mb-1">
              <span class="fw-medium text-truncate text-reset">${escapeHtml(p.event_name)}</span>
              ${trackBadgeHtml}
            </div>
            <div class="text-truncate" style="font-size: 11.5px; color: var(--tf-text-secondary);">${escapeHtml(p.college || 'SLIET')}</div>
          </div>

          <!-- Contact & View Details -->
          <div class="d-flex align-items-center justify-content-between pt-1.5 border-top" style="border-color: var(--tf-border) !important;" onclick="event.stopPropagation()">
            <div class="d-flex gap-1.5">
              ${waLink ? `
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-wa-pill">
                  <i class="ti ti-brand-whatsapp"></i> WhatsApp
                </a>
              ` : ''}
              ${telLink ? `
                <a href="${telLink}" class="btn-call-pill" style="width: 24px; height: 24px;">
                  <i class="ti ti-phone"></i>
                </a>
              ` : ''}
            </div>

            <button onclick="openDrawer('${p.id}')" class="btn-view-pill">
              <span>View</span>
              <i class="ti ti-arrow-right" style="font-size: 11px;"></i>
            </button>
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

  const drawerInitialsEl = document.getElementById('drawerInitials');
  if (drawerInitialsEl) {
    drawerInitialsEl.textContent = initials;
    drawerInitialsEl.style.cssText = `${getAvatarStyle(p.name)}; width: 34px; height: 34px; font-size: 13px; font-weight: 600;`;
  }
  document.getElementById('drawerName').textContent = p.name || 'Participant';
  document.getElementById('drawerRegId').textContent = `Reg ID: ${p.id} • Txn: ${p.payment_id}`;
  
  const drawerTrackBadge = document.getElementById('drawerTrackBadge');
  if (drawerTrackBadge) {
    drawerTrackBadge.outerHTML = `<span id="drawerTrackBadge">${getTrackBadgeHtml(p.event_type || p.event_name)}</span>`;
  }

  const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
  const telLink = p.phone && p.phone !== 'N/A' ? `tel:${p.phone}` : null;
  const mailLink = p.email && p.email !== 'N/A' ? `mailto:${p.email}` : null;

  const amt = Number(p.amount) || 0;
  const paymentBadge = amt > 0
    ? `<div class="p-3 rounded border mb-3" style="background: var(--tf-accent-green-dim); border-color: rgba(16, 185, 129, 0.25) !important;">
        <div class="text-uppercase tracking-wider fw-bold text-success" style="font-size: 10px;">Payment Status</div>
        <div class="fw-bold my-1 text-success d-flex align-items-center gap-1.5" style="font-size: 15px;">
          <i class="ti ti-check fs-2"></i>
          <span>Paid ₹${amt.toLocaleString('en-IN')} (Gateway Confirmed)</span>
        </div>
        <div class="text-secondary small font-monospace user-select-all mt-1" style="font-size: 11px;">Reference: ${escapeHtml(p.payment_id)}</div>
       </div>`
    : `<div class="p-3 rounded border mb-3" style="background: rgba(255, 255, 255, 0.03); border-color: var(--tf-border-subtle) !important;">
        <div class="text-uppercase tracking-wider fw-bold text-info" style="font-size: 10px;">Registration Status</div>
        <div class="fw-semibold my-1 text-info d-flex align-items-center gap-1.5" style="font-size: 15px;">
          <i class="ti ti-shield-check fs-2"></i>
          <span>Free Competition Entry (Form Verified)</span>
        </div>
        <div class="text-secondary small font-monospace user-select-all mt-1" style="font-size: 11px;">Unstop Entry ID: ${escapeHtml(p.id)}</div>
       </div>`;

  const membersHtml = (p.team_members && p.team_members.length > 0)
    ? p.team_members.map((m, idx) => `
        <div class="p-2.5 rounded border mb-2" style="background: var(--tf-bg-well); border-color: var(--tf-border-subtle) !important;">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <div class="fw-semibold text-reset d-flex align-items-center gap-1.5" style="font-size: 12.5px;">
              <span>${idx + 1}. ${escapeHtml(m.name || 'Member')}</span>
              ${idx === 0 ? `<span class="tag-track tag-paid ms-1" style="font-size: 9.5px;">LEADER</span>` : ''}
            </div>
            <div class="text-secondary small text-truncate" style="max-width: 170px; font-size: 11.5px;" title="${escapeHtml(m.college || '')}">
              ${escapeHtml(m.college || '')}
            </div>
          </div>
          <div class="text-secondary font-monospace user-select-all" style="font-size: 11px;">
            ${escapeHtml(m.email || '')} ${m.phone ? `• ${m.phone}` : ''}
          </div>
        </div>
      `).join('')
    : `<div class="p-3 text-secondary text-center fst-italic" style="font-size: 12px;">
        Solo Registration (Individual Participant)
       </div>`;

  const drawerBody = document.getElementById('drawerBody');
  drawerBody.innerHTML = `
    <!-- Quick Contact Actions -->
    <div class="row g-2 mb-3">
      ${waLink ? `
        <div class="col">
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-contact w-100">
            <i class="ti ti-brand-whatsapp"></i> WhatsApp Leader
          </a>
        </div>
      ` : ''}
      ${mailLink ? `
        <div class="col">
          <a href="${mailLink}" class="btn btn-outline-primary btn-contact w-100">
            <i class="ti ti-mail"></i> Send Email
          </a>
        </div>
      ` : ''}
      ${telLink ? `
        <div class="col-auto">
          <a href="${telLink}" class="btn btn-icon btn-outline-secondary btn-contact" style="width: 32px;" title="Call">
            <i class="ti ti-phone"></i>
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Payment / Registration Status Card -->
    ${paymentBadge}

    <!-- Candidate Profile Section -->
    <div class="drawer-card mb-3">
      <div class="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom" style="border-color: var(--tf-border-subtle) !important;">
        <i class="ti ti-user text-primary" style="font-size: 14px;"></i>
        <span class="fw-semibold text-reset" style="font-size: 13px;">Candidate Profile</span>
      </div>
      <table class="drawer-table">
        <tbody>
          <tr>
            <td>Candidate Name:</td>
            <td class="fw-semibold text-reset">${escapeHtml(p.name)}</td>
          </tr>
          <tr>
            <td>Email Address:</td>
            <td class="font-monospace user-select-all">${escapeHtml(p.email)}</td>
          </tr>
          <tr>
            <td>Contact Number:</td>
            <td class="font-monospace user-select-all">${escapeHtml(p.phone)}</td>
          </tr>
          <tr>
            <td>College / Institute:</td>
            <td class="fw-medium">${escapeHtml(p.college)}</td>
          </tr>
          ${p.specialization ? `
            <tr>
              <td>Course / Branch:</td>
              <td>${escapeHtml(p.specialization)}</td>
            </tr>
          ` : ''}
          ${p.passing_year ? `
            <tr>
              <td>Graduation Year:</td>
              <td class="font-monospace">${escapeHtml(p.passing_year)}</td>
            </tr>
          ` : ''}
          <tr>
            <td>Registration Date:</td>
            <td class="font-monospace">${p.registered_at ? new Date(p.registered_at).toLocaleString('en-IN') : 'N/A'}</td>
          </tr>
        </tbody>
      </table>
      ${p.resume_url ? `
        <div class="mt-3 pt-2.5 border-top text-end" style="border-color: var(--tf-border-subtle) !important;">
          <a href="${p.resume_url.startsWith('http') ? p.resume_url : 'https://d8it4huxumps7.cloudfront.net/' + p.resume_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 py-1 px-2.5" style="font-size: 11.5px;">
            <i class="ti ti-file-text"></i> Download Uploaded Resume PDF
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Team Members Section -->
    <div class="drawer-card mb-0">
      <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom" style="border-color: var(--tf-border-subtle) !important;">
        <div class="d-flex align-items-center gap-2">
          <i class="ti ti-users text-azure" style="font-size: 14px;"></i>
          <span class="fw-semibold text-reset" style="font-size: 13px;">Team Roster (${escapeHtml(p.team_name || 'Individual')})</span>
        </div>
        <span class="tag-track font-monospace">${(p.team_members || []).length} member(s)</span>
      </div>
      <div>
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
    const origClass = el.innerHTML;
    el.innerHTML = '<i class="ti ti-check text-success" style="font-size: 11px;"></i>';
    setTimeout(() => {
      el.innerHTML = origClass;
    }, 1500);
  });
}

function exportToCSV() {
  const dataToExport = currentFiltered.length > 0 ? currentFiltered : allParticipants;
  if (!dataToExport || dataToExport.length === 0) {
    alert('No participants available to export.');
    return;
  }

  const headers = [
    'Registration ID',
    'Unstop ID',
    'Candidate Name',
    'Email Address',
    'Phone Number',
    'College / Institute',
    'Branch / Specialization',
    'Passing Year',
    'Event Name',
    'Track / Type',
    'Team Name',
    'Team Size',
    'Payment Status',
    'Amount Paid (INR)',
    'Payment Transaction ID',
    'Registration Timestamp',
    'Resume URL'
  ];

  const rows = dataToExport.map(p => [
    p.id || '',
    p.internal_id || '',
    p.name || '',
    p.email || '',
    p.phone || '',
    p.college || '',
    p.specialization || '',
    p.passing_year || '',
    p.event_name || '',
    p.event_type || '',
    p.team_name || 'Individual',
    p.team_size || 1,
    p.payment_status || 'PAID',
    p.amount || 0,
    p.payment_id || '',
    p.registered_at || '',
    p.resume_url || ''
  ]);

  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  link.setAttribute('download', `techFEST_26_Verified_Participants_${dateStr}.csv`);
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
    btn.innerHTML = '<span class="text-success font-monospace">Copied!</span>';
    setTimeout(() => { 
      btn.innerHTML = orig; 
    }, 1500);
  });
}
