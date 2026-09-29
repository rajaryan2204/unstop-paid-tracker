// Global state
let allParticipants = [];
let currentFiltered = [];
let summaryData = {};

document.addEventListener('DOMContentLoaded', () => {
  loadData();
});

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
    let data;
    try {
      const response = await fetch(`./data.json?t=${Date.now()}`);
      if (response.ok) {
        data = await response.json();
        summaryData = data.summary || {};
        allParticipants = data.participants || [];
      } else {
        throw new Error('data.json not found');
      }
    } catch {
      // Fallback
      const resPart = await fetch(`./data/paid_participants.json?t=${Date.now()}`);
      allParticipants = await resPart.json();
      try {
        const resSum = await fetch(`./data/summary.json?t=${Date.now()}`);
        summaryData = await resSum.json();
      } catch {
        summaryData = {};
      }
    }

    renderSummary(summaryData, allParticipants);
    populateEventFilter(allParticipants, summaryData);
    populateCollegeFilter(allParticipants);
    applyFilters();

  } catch (err) {
    console.error('Error fetching data:', err);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="py-8 text-center text-rose-400 text-sm">
            <i data-lucide="alert-triangle" class="w-6 h-6 mx-auto mb-2 text-rose-400"></i>
            Failed to load data. Make sure data.json exists or run <code>python scripts/fetch_registrations.py</code>.
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

function renderSummary(summary, participants) {
  const totalPaid = participants.length;
  const totalApplicants = summary.total_unstop_registrations || participants.length;
  const colleges = new Set(participants.map(p => p.college).filter(c => c && c !== 'N/A'));
  
  let totalMembers = 0;
  participants.forEach(p => {
    totalMembers += (p.team_members && p.team_members.length > 0) ? p.team_members.length : 1;
  });

  const statTotalPaidEl = document.getElementById('statTotalPaid');
  const statTotalApplicantsEl = document.getElementById('statTotalApplicants');
  const statCollegesEl = document.getElementById('statColleges');
  const statTotalMembersEl = document.getElementById('statTotalMembers');

  if (statTotalPaidEl) statTotalPaidEl.textContent = totalPaid.toLocaleString();
  if (statTotalApplicantsEl) statTotalApplicantsEl.textContent = totalApplicants.toLocaleString();
  if (statCollegesEl) statCollegesEl.textContent = colleges.size;
  if (statTotalMembersEl) statTotalMembersEl.textContent = totalMembers;

  // Last sync time
  const lastSyncEl = document.getElementById('lastSyncTime');
  const tokenExpiryEl = document.getElementById('tokenExpiryTime');
  const modeBadge = document.getElementById('modeBadge');

  if (summary && summary.last_synced_at) {
    const d = new Date(summary.last_synced_at);
    lastSyncEl.textContent = d.toLocaleString('en-IN', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  } else {
    lastSyncEl.textContent = 'Recent';
  }

  // Token expiry time
  if (tokenExpiryEl) {
    if (summary && summary.token_expires_at) {
      const expDate = new Date(summary.token_expires_at);
      tokenExpiryEl.textContent = expDate.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
      });
    } else {
      tokenExpiryEl.textContent = 'Active';
    }
  }

  if (summary && summary.is_mock) {
    modeBadge.textContent = 'Preview (Mock Data)';
    modeBadge.className = 'text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30';
  } else {
    modeBadge.textContent = 'Status: Live Multi-Event Sync';
    modeBadge.className = 'text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  }
}

function populateEventFilter(participants, summary) {
  const select = document.getElementById('eventFilter');
  if (!select) return;
  const selectedVal = select.value;

  // Group count by event
  const eventCounts = {};
  participants.forEach(p => {
    const evName = p.event_name || 'Event';
    eventCounts[evName] = (eventCounts[evName] || 0) + 1;
  });

  const sortedEvents = Object.keys(eventCounts).sort((a, b) => eventCounts[b] - eventCounts[a]);

  select.innerHTML = `<option value="">All Events (${participants.length} paid across ${sortedEvents.length} events)</option>`;
  sortedEvents.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev;
    opt.textContent = `${ev} (${eventCounts[ev]} paid)`;
    if (ev === selectedVal) opt.selected = true;
    select.appendChild(opt);
  });

  const activeEventsBadge = document.getElementById('activeEventsBadge');
  if (activeEventsBadge) {
    activeEventsBadge.textContent = sortedEvents.length;
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
    opt.textContent = col.length > 40 ? col.substring(0, 38) + '...' : col;
    if (col === selectedVal) opt.selected = true;
    select.appendChild(opt);
  });
}

function applyFilters() {
  const query = (document.getElementById('searchInput').value || '').trim().toLowerCase();
  const event = document.getElementById('eventFilter') ? document.getElementById('eventFilter').value : '';
  const college = document.getElementById('collegeFilter').value;
  const sort = document.getElementById('sortSelect').value;

  const filterTag = document.getElementById('filterTag');
  if (query || event || college) {
    filterTag.classList.remove('hidden');
  } else {
    filterTag.classList.add('hidden');
  }

  let filtered = allParticipants.filter(p => {
    if (event && p.event_name !== event && String(p.event_id) !== event) {
      return false;
    }

    if (college && p.college !== college) {
      return false;
    }

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
        (m.email || '').toLowerCase().includes(query)
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
  document.getElementById('collegeFilter').value = '';
  applyFilters();
}

function renderTable(participants) {
  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const visibleCount = document.getElementById('visibleCount');
  const totalCount = document.getElementById('totalCount');

  visibleCount.textContent = participants.length;
  totalCount.textContent = allParticipants.length;

  if (participants.length === 0) {
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  const rowsHtml = participants.map((p, index) => {
    const initials = (p.name || 'P')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const formattedDate = p.registered_at 
      ? new Date(p.registered_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
      : 'N/A';

    const hasMembers = p.team_members && p.team_members.length > 0;
    const teamBadge = hasMembers 
      ? `<span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <i data-lucide="users" class="w-3 h-3"></i> ${p.team_members.length} members
         </span>`
      : `<span class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
          Individual
         </span>`;

    return `
      <tr class="hover:bg-slate-800/40 transition group">
        <!-- Index -->
        <td class="py-4 px-4 text-center font-mono text-xs text-slate-400">
          ${index + 1}
        </td>

        <!-- Participant / Leader -->
        <td class="py-4 px-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600/50 flex items-center justify-center font-semibold text-xs text-emerald-400 shadow-sm shrink-0">
              ${initials}
            </div>
            <div class="min-w-0">
              <div class="font-medium text-slate-100 flex items-center gap-1.5 truncate">
                <span>${escapeHtml(p.name || 'N/A')}</span>
              </div>
              <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span class="truncate max-w-[160px]" title="${escapeHtml(p.email)}">${escapeHtml(p.email || 'N/A')}</span>
                ${p.email && p.email !== 'N/A' ? `<button onclick="copyToClipboard('${escapeHtml(p.email)}', this)" title="Copy Email" class="text-slate-500 hover:text-slate-300"><i data-lucide="copy" class="w-3 h-3"></i></button>` : ''}
              </div>
              ${p.phone && p.phone !== 'N/A' ? `
                <div class="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <i data-lucide="phone" class="w-3 h-3 text-slate-400"></i>
                  <span>${escapeHtml(p.phone)}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </td>

        <!-- Event Name -->
        <td class="py-4 px-4">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-xs">
            <i data-lucide="award" class="w-3.5 h-3.5 text-indigo-400"></i>
            <span class="truncate max-w-[150px]" title="${escapeHtml(p.event_name || 'Event')}">${escapeHtml(p.event_name || 'Event')}</span>
          </div>
        </td>

        <!-- Team -->
        <td class="py-4 px-4">
          <div class="font-medium text-slate-200 text-xs sm:text-sm">
            ${escapeHtml(p.team_name || 'Individual')}
          </div>
          <div class="mt-1">
            ${teamBadge}
          </div>
        </td>

        <!-- College -->
        <td class="py-4 px-4 text-xs text-slate-300 max-w-[200px]">
          <div class="truncate" title="${escapeHtml(p.college)}">
            ${escapeHtml(p.college || 'N/A')}
          </div>
        </td>

        <!-- Payment & Amount -->
        <td class="py-4 px-4">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <i data-lucide="check" class="w-3 h-3"></i> PAID
            </span>
            <span class="font-semibold text-white text-xs sm:text-sm">
              ₹${Number(p.amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div class="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-[140px]" title="${escapeHtml(p.payment_id)}">
            ${escapeHtml(p.payment_id || '--')}
          </div>
        </td>

        <!-- Date -->
        <td class="py-4 px-4 text-xs text-slate-400">
          ${formattedDate}
        </td>

        <!-- Action / View Button -->
        <td class="py-4 px-4 text-center">
          <button onclick="openModal('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition inline-flex items-center gap-1 border border-slate-700">
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

function openModal(participantId) {
  const p = allParticipants.find(item => item.id == participantId);
  if (!p) return;

  const modal = document.getElementById('detailModal');
  const title = document.getElementById('modalTitle');
  const regId = document.getElementById('modalRegId');
  const body = document.getElementById('modalBody');

  title.textContent = p.name || 'Participant Details';
  regId.textContent = `Reg ID: ${p.id} • Txn: ${p.payment_id}`;

  const membersHtml = (p.team_members && p.team_members.length > 0)
    ? p.team_members.map((m, idx) => `
        <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <div class="font-medium text-slate-200">${idx + 1}. ${escapeHtml(m.name || 'Member')}</div>
            <div class="text-slate-400">${escapeHtml(m.email || 'No email')}</div>
          </div>
          <div class="text-slate-400 text-right max-w-[160px] truncate">
            ${escapeHtml(m.college || '')}
          </div>
        </div>
      `).join('')
    : '<div class="text-xs text-slate-400 italic">No additional team members (Individual Registration).</div>';

  body.innerHTML = `
    <!-- Top Highlights -->
    <div class="grid grid-cols-2 gap-3">
      <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
        <div class="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Event</div>
        <div class="mt-1 text-indigo-400 font-semibold text-sm truncate">
          ${escapeHtml(p.event_name || 'Event')}
        </div>
      </div>
      <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
        <div class="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Payment Status</div>
        <div class="mt-1 text-emerald-400 font-semibold text-sm flex items-center gap-1">
          <i data-lucide="check-circle-2" class="w-4 h-4"></i> Success (₹${Number(p.amount || 0).toLocaleString('en-IN')})
        </div>
      </div>
    </div>

    <!-- Contact Details -->
    <div class="space-y-2 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs">
      <div class="flex justify-between py-1 border-b border-slate-800/50">
        <span class="text-slate-400">Leader / Name:</span>
        <span class="font-medium text-slate-200">${escapeHtml(p.name)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800/50">
        <span class="text-slate-400">Email:</span>
        <span class="font-medium text-slate-200 font-mono">${escapeHtml(p.email)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800/50">
        <span class="text-slate-400">Phone:</span>
        <span class="font-medium text-slate-200">${escapeHtml(p.phone)}</span>
      </div>
      <div class="flex justify-between py-1 border-b border-slate-800/50">
        <span class="text-slate-400">College / Institute:</span>
        <span class="font-medium text-slate-200 text-right max-w-[240px] truncate">${escapeHtml(p.college)}</span>
      </div>
      ${p.specialization ? `
        <div class="flex justify-between py-1 border-b border-slate-800/50">
          <span class="text-slate-400">Course / Branch:</span>
          <span class="font-medium text-slate-200 text-right max-w-[240px] truncate">${escapeHtml(p.specialization)}</span>
        </div>
      ` : ''}
      ${p.passing_year ? `
        <div class="flex justify-between py-1 border-b border-slate-800/50">
          <span class="text-slate-400">Graduation Year:</span>
          <span class="font-medium text-slate-200">${escapeHtml(p.passing_year)}</span>
        </div>
      ` : ''}
      <div class="flex justify-between py-1">
        <span class="text-slate-400">Registration Date:</span>
        <span class="font-medium text-slate-200">${p.registered_at ? new Date(p.registered_at).toLocaleString('en-IN') : 'N/A'}</span>
      </div>
      ${p.resume_url ? `
        <div class="pt-2 border-t border-slate-800/50 flex justify-end">
          <a href="${p.resume_url.startsWith('http') ? p.resume_url : 'https://d8it4huxumps7.cloudfront.net/' + p.resume_url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
            <span>View Resume PDF</span>
          </a>
        </div>
      ` : ''}
    </div>

    <!-- Team Members Section -->
    <div class="space-y-2">
      <h4 class="text-xs uppercase font-semibold tracking-wider text-slate-400">
        Team Members (${p.team_members ? p.team_members.length : 1})
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
    alert('No data available to export.');
    return;
  }

  const headers = [
    'Event Name',
    'Event ID',
    'Registration ID',
    'Participant Name',
    'Email',
    'Phone',
    'College',
    'Team Name',
    'Team Size',
    'Payment ID',
    'Amount (INR)',
    'Payment Status',
    'Registered At'
  ];

  const csvRows = [headers.join(',')];

  currentFiltered.forEach(p => {
    const row = [
      p.event_name,
      p.event_id,
      p.id,
      p.name,
      p.email,
      p.phone,
      p.college,
      p.team_name,
      p.team_size || 1,
      p.payment_id,
      p.amount,
      p.payment_status,
      p.registered_at
    ].map(val => `"${String(val || '').replace(/"/g, '""')}"`);
    
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const currentEvent = document.getElementById('eventFilter') ? document.getElementById('eventFilter').value : '';
  const filePrefix = currentEvent ? currentEvent.replace(/[^a-zA-Z0-9]/g, '_') : 'all_events';
  link.setAttribute('download', `unstop_paid_${filePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
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
