// techFEST '26 • SLIET Longowal Organizer Registration Desk
// High-performance client-side controller

let allParticipants = [];
let currentFiltered = [];
let summaryData = {};
let currentCategory = 'all';
let currentPaymentFilter = 'all'; // 'all' | 'paid' | 'free'

// Pagination state
let currentPage = 1;
let pageSize = 50;

document.addEventListener('DOMContentLoaded', () => {
  loadData();
});

/**
 * Robust data loader:
 * 1. Immediate synchronous load from window.__TECHFEST_DATA__ (via data.js)
 * 2. Multi-URL fallback fetch if needed
 */
async function loadData() {
  const loading = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const tableBody = document.getElementById('tableBody');
  const refreshIcon = document.getElementById('refreshIcon');

  if (refreshIcon) refreshIcon.classList.add('animate-spin');
  if (loading) loading.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');
  if (tableBody) tableBody.innerHTML = '';

  try {
    let data = null;

    // Check if pre-bundled via data.js
    if (window.__TECHFEST_DATA__ && window.__TECHFEST_DATA__.participants && window.__TECHFEST_DATA__.participants.length > 0) {
      data = window.__TECHFEST_DATA__;
    }

    // If data not yet in memory, try network candidates
    if (!data) {
      // Determine base URL dynamically
      const pathname = window.location.pathname;
      const origin = window.location.origin;
      const dirPath = pathname.substring(0, pathname.lastIndexOf('/') + 1) || '/';

      const fetchUrls = [
        'data.json',
        './data.json',
        `${dirPath}data.json`,
        '/unstop-paid-tracker/data.json',
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
      throw new Error('Registration records could not be retrieved.');
    }

    summaryData = data.summary || {};
    allParticipants = data.participants || [];

    renderSummary(summaryData, allParticipants);
    populateEventFilter(allParticipants);
    populateCollegeFilter(allParticipants);
    updateCategoryCounts(allParticipants);
    updatePaymentFilterCounts(allParticipants);
    applyFilters();

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
              <button onclick="window.location.reload()" class="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition">
                Refresh Page
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
 * Render Executive KPI cards
 */
function renderSummary(summary, participants) {
  const totalVerified = participants.length;
  const totalApplicants = summary.total_unstop_registrations || 3501;
  const colleges = new Set(participants.map(p => p.college).filter(c => c && c !== 'N/A'));
  
  const activeEventsCount = summary.events_with_paid || new Set(participants.map(p => p.event_name)).size;
  const totalEventsScanned = summary.total_events_scanned || 62;
  
  const totalRevenue = participants.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const paidCount = participants.filter(p => Number(p.amount) > 0).length;
  const freeCount = totalVerified - paidCount;

  // Primary Metrics
  document.getElementById('statTotalPaid').textContent = totalVerified.toLocaleString('en-IN');
  document.getElementById('statTotalRevenue').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
  document.getElementById('statActiveEvents').innerHTML = `${activeEventsCount} <span class="text-xs font-normal text-slate-400">/ ${totalEventsScanned}</span>`;
  document.getElementById('statColleges').textContent = colleges.size;

  // Subtitles / Badges
  const subPaid = document.getElementById('subTotalPaid');
  if (subPaid) subPaid.textContent = `${freeCount} Free Entry • ${paidCount} Gateway Paid`;

  const subRevenue = document.getElementById('subTotalRevenue');
  if (subRevenue) subRevenue.textContent = `RC Boat (₹2,995) + Ghost Code (₹200)`;

  const subEvents = document.getElementById('subActiveEvents');
  if (subEvents) subEvents.textContent = `Scanned from 62 official Unstop listings`;

  const subColleges = document.getElementById('subColleges');
  if (subColleges) subColleges.textContent = `SLIET, IITs, NITs, LPU & State Univs`;
}

/**
 * Update Category pill numbers
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
 * Update Payment Filter pill counts
 */
function updatePaymentFilterCounts(participants) {
  const paidCount = participants.filter(p => Number(p.amount) > 0).length;
  const freeCount = participants.length - paidCount;

  const btnAll = document.getElementById('payFilterAll');
  const btnPaid = document.getElementById('payFilterPaid');
  const btnFree = document.getElementById('payFilterFree');

  if (btnAll) btnAll.textContent = `All Registrations (${participants.length})`;
  if (btnPaid) btnPaid.textContent = `💰 Gateway Paid (${paidCount})`;
  if (btnFree) btnFree.textContent = `Free Entry (${freeCount})`;
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
      el.className = 'px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 transition';
    } else {
      el.className = 'px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent transition';
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
      btn.className = 'cat-tab px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30';
    } else {
      btn.className = 'cat-tab px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition';
    }
  });

  currentPage = 1;
  applyFilters();
}

function populateEventFilter(participants) {
  const select = document.getElementById('eventFilter');
  if (!select) return;
  const selectedVal = select.value;

  const eventCounts = {};
  participants.forEach(p => {
    const evName = p.event_name || 'Event';
    eventCounts[evName] = (eventCounts[evName] || 0) + 1;
  });

  const sortedEvents = Object.keys(eventCounts).sort((a, b) => eventCounts[b] - eventCounts[a]);

  select.innerHTML = `<option value="">All Events (All ${sortedEvents.length} Competitions)</option>`;
  sortedEvents.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev;
    opt.textContent = `${ev} (${eventCounts[ev]} verified)`;
    if (ev === selectedVal) opt.selected = true;
    select.appendChild(opt);
  });
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
    opt.textContent = col.length > 40 ? col.substring(0, 38) + '...' : col;
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

    // Category tab filter
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

    // Live Search
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
  renderTable(filtered);
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
  renderTable(currentFiltered);
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderTable(currentFiltered);
    window.scrollTo({ top: 220, behavior: 'smooth' });
  }
}

function nextPage() {
  const totalPages = Math.ceil(currentFiltered.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderTable(currentFiltered);
    window.scrollTo({ top: 220, behavior: 'smooth' });
  }
}

/**
 * Render Table Rows with High Polish
 */
function renderTable(participants) {
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const visibleCount = document.getElementById('visibleCount');
  const totalCount = document.getElementById('totalCount');
  const paginationBar = document.getElementById('paginationBar');

  if (visibleCount) visibleCount.textContent = participants.length;
  if (totalCount) totalCount.textContent = allParticipants.length;

  if (participants.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
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

  const rowsHtml = pageItems.map((p, idx) => {
    const absoluteIndex = startIndex + idx + 1;
    const initials = (p.name || 'P')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TF';

    const formattedDate = p.registered_at 
      ? new Date(p.registered_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      : 'N/A';

    const hasMembers = p.team_members && p.team_members.length > 0;
    const teamBadge = hasMembers 
      ? `<button onclick="openModal('${p.id}')" class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition">
          <i data-lucide="users" class="w-3 h-3"></i> ${p.team_members.length} Members
         </button>`
      : `<span class="inline-flex items-center gap-1 text-[11px] text-slate-400">Solo Entry</span>`;

    // Category badge styling
    let catClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    const evType = (p.event_type || '').toLowerCase();
    if (evType.includes('quiz')) {
      catClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else if (evType.includes('hack')) {
      catClass = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    } else if (evType.includes('cultur')) {
      catClass = 'bg-pink-500/10 text-pink-400 border-pink-500/30';
    }

    // Payment display: Free Event vs Paid Fee
    const amt = Number(p.amount) || 0;
    let paymentBlock = '';
    if (amt > 0) {
      paymentBlock = `
        <div>
          <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <i data-lucide="check-check" class="w-3 h-3 text-emerald-400"></i> Paid ₹${amt.toLocaleString('en-IN')}
          </span>
          <div class="text-[10px] text-emerald-400/80 font-mono mt-0.5 select-all">
            Txn: ${escapeHtml(p.payment_id)}
          </div>
        </div>
      `;
    } else {
      paymentBlock = `
        <div>
          <span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80">
            <i data-lucide="shield-check" class="w-3 h-3 text-sky-400"></i> Free Entry • Verified
          </span>
          <div class="text-[10px] text-slate-500 font-mono mt-0.5 select-all">
            ID: ${escapeHtml(p.id)}
          </div>
        </div>
      `;
    }

    return `
      <tr class="hover:bg-slate-800/40 transition group border-b border-slate-800/60">
        <!-- Index -->
        <td class="py-3 px-3 text-center font-mono text-xs text-slate-500 select-none">
          ${absoluteIndex}
        </td>

        <!-- Candidate / Team Leader -->
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-xs text-slate-200 shrink-0">
              ${initials}
            </div>
            <div>
              <div class="font-semibold text-white text-xs sm:text-sm group-hover:text-emerald-300 transition">
                ${escapeHtml(p.name || 'Participant')}
              </div>
              <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span class="text-slate-300 select-all">${escapeHtml(p.email || '')}</span>
                ${p.email && p.email !== 'N/A' ? `
                  <button onclick="copyToClipboard('${escapeHtml(p.email)}', this)" title="Copy Email" class="text-slate-500 hover:text-slate-300">
                    <i data-lucide="copy" class="w-3 h-3"></i>
                  </button>
                ` : ''}
              </div>
              ${p.phone && p.phone !== 'N/A' ? `
                <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 select-all">
                  <i data-lucide="phone" class="w-3 h-3 text-slate-500"></i>
                  <span>${escapeHtml(p.phone)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </td>

        <!-- Institution / College -->
        <td class="py-3 px-4 max-w-[220px]">
          <div class="text-xs font-medium text-slate-200 leading-snug line-clamp-2" title="${escapeHtml(p.college)}">
            ${escapeHtml(p.college || 'N/A')}
          </div>
          ${p.specialization ? `
            <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
              <span>${escapeHtml(p.specialization)}</span>
              ${p.passing_year ? `<span class="text-slate-500">• ${p.passing_year}</span>` : ''}
            </div>
          ` : ''}
        </td>

        <!-- Event & Track -->
        <td class="py-3 px-4">
          <div class="font-semibold text-white text-xs sm:text-sm">
            ${escapeHtml(p.event_name || 'Event')}
          </div>
          <div class="mt-1">
            <span class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${catClass}">
              ${escapeHtml(p.event_type || 'Competition')}
            </span>
          </div>
        </td>

        <!-- Team Status -->
        <td class="py-3 px-4">
          <div class="text-xs font-medium text-slate-300">
            ${escapeHtml(p.team_name || 'Individual')}
          </div>
          <div class="mt-1">
            ${teamBadge}
          </div>
        </td>

        <!-- Fee / Payment -->
        <td class="py-3 px-4">
          ${paymentBlock}
        </td>

        <!-- Registration Date -->
        <td class="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
          ${formattedDate}
        </td>

        <!-- Action / View Button -->
        <td class="py-3 px-3 text-center">
          <button onclick="openModal('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition inline-flex items-center gap-1 border border-slate-700 shadow-sm">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            <span>View</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.innerHTML = rowsHtml;
  if (window.lucide) lucide.createIcons();
}

/**
 * Open Candidate Details Drawer/Modal
 */
function openModal(participantId) {
  const p = allParticipants.find(item => item.id == participantId);
  if (!p) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const regId = document.getElementById('modalRegId');
  const eventBadge = document.getElementById('modalEventBadge');
  const body = document.getElementById('modalBody');

  title.textContent = p.name || 'Candidate Details';
  regId.textContent = `Reg ID: ${p.id} • Txn: ${p.payment_id}`;
  eventBadge.textContent = p.event_name || 'Event';

  const amt = Number(p.amount) || 0;
  const statusBadge = amt > 0
    ? `<span class="text-emerald-400 font-semibold flex items-center gap-1"><i data-lucide="check-check" class="w-4 h-4"></i> Paid ₹${amt} (Gateway Verified)</span>`
    : `<span class="text-sky-400 font-medium flex items-center gap-1"><i data-lucide="shield-check" class="w-4 h-4"></i> Free Entry (Form Completed)</span>`;

  const membersHtml = (p.team_members && p.team_members.length > 0)
    ? p.team_members.map((m, idx) => `
        <div class="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <div class="font-medium text-slate-200">${idx + 1}. ${escapeHtml(m.name || 'Member')}</div>
            <div class="text-slate-400 select-all">${escapeHtml(m.email || 'No email')} ${m.phone ? `• ${m.phone}` : ''}</div>
          </div>
          <div class="text-slate-400 text-right max-w-[200px] text-xs">
            ${escapeHtml(m.college || '')}
          </div>
        </div>
      `).join('')
    : '<div class="text-xs text-slate-400 italic">Solo Registration (No additional team members).</div>';

  body.innerHTML = `
    <!-- Top Summary Highlights -->
    <div class="grid grid-cols-2 gap-3">
      <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Registered Competition</div>
        <div class="mt-1 text-white font-semibold text-sm truncate" title="${escapeHtml(p.event_name)}">
          ${escapeHtml(p.event_name || 'Event')}
        </div>
      </div>
      <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
        <div class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Registration Status</div>
        <div class="mt-1 text-sm">
          ${statusBadge}
        </div>
      </div>
    </div>

    <!-- Candidate Profile Details -->
    <div class="space-y-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
      <div class="flex justify-between py-1 border-b border-slate-800/70">
        <span class="text-slate-400">Candidate Name:</span>
        <span class="font-semibold text-slate-100">${escapeHtml(p.name)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800/70">
        <span class="text-slate-400">Email Address:</span>
        <span class="font-medium text-slate-200 font-mono select-all">${escapeHtml(p.email)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800/70">
        <span class="text-slate-400">Contact Number:</span>
        <span class="font-medium text-slate-200 select-all">${escapeHtml(p.phone)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800/70">
        <span class="text-slate-400">College / Institute:</span>
        <span class="font-medium text-slate-200 text-right max-w-[280px]">${escapeHtml(p.college)}</span>
      </div>
      ${p.specialization ? `
        <div class="flex justify-between py-1 border-b border-slate-800/70">
          <span class="text-slate-400">Course / Branch:</span>
          <span class="font-medium text-slate-200">${escapeHtml(p.specialization)}</span>
        </div>
      ` : ''}
      ${p.passing_year ? `
        <div class="flex justify-between py-1 border-b border-slate-800/70">
          <span class="text-slate-400">Graduation Year:</span>
          <span class="font-medium text-slate-200">${escapeHtml(p.passing_year)}</span>
        </div>
      ` : ''}
      <div class="flex justify-between py-1">
        <span class="text-slate-400">Registration Timestamp:</span>
        <span class="font-medium text-slate-200">${p.registered_at ? new Date(p.registered_at).toLocaleString('en-IN') : 'N/A'}</span>
      </div>
      ${p.resume_url ? `
        <div class="pt-2.5 border-t border-slate-800/70 flex justify-end">
          <a href="${p.resume_url.startsWith('http') ? p.resume_url : 'https://d8it4huxumps7.cloudfront.net/' + p.resume_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
            <span>Download Uploaded Resume</span>
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Team Members Roster -->
    <div class="space-y-2">
      <h4 class="text-xs uppercase font-semibold tracking-wider text-slate-400">
        Team Roster (${p.team_name || 'Individual'})
      </h4>
      <div class="space-y-1.5">
        ${membersHtml}
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeModal() {
  document.getElementById('detailModal').classList.add('hidden');
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function copyToClipboard(text, el) {
  navigator.clipboard.writeText(text).then(() => {
    const original = el.innerHTML;
    el.innerHTML = '<span class="text-emerald-400 text-[10px]">Copied!</span>';
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
    'Event Category',
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
    'Payment Status',
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
  link.setAttribute('download', `${filePrefix}_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
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
