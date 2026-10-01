// src/utils/callStore.js
// TechFEST '26 Operations Calling CRM, Timeline History & Audit Trail Engine
import { 
  fetchCallRecordsFromNeon, 
  fetchAuditLogsFromNeon, 
  fetchPaymentVerificationsFromNeon,
  writeCallLogToNeon, 
  writeAuditLogToNeon, 
  writePaymentVerificationToNeon,
  dbStatus
} from './neonDb';

export const CALL_STATUSES = {
  PAYMENT_CLAIMED: {
    id: 'PAYMENT_CLAIMED',
    label: 'Payment Completed',
    shortLabel: 'Paid Claimed',
    color: 'emerald',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    indicator: 'bg-emerald-400',
    description: 'Participant claims to have completed registration payment. Moved to Verification Queue.'
  },
  INTERESTED: {
    id: 'INTERESTED',
    label: 'Interested / Follow Up',
    shortLabel: 'Interested',
    color: 'amber',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    indicator: 'bg-amber-400',
    description: 'Hot/warm lead. Promised to register or pay soon.'
  },
  CALL_LATER: {
    id: 'CALL_LATER',
    label: 'Call Later / Callback',
    shortLabel: 'Callback',
    color: 'sky',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    indicator: 'bg-sky-400',
    description: 'Requested call back at a later specific time or evening.'
  },
  NOT_PICKED: {
    id: 'NOT_PICKED',
    label: 'Not Picked / Busy',
    shortLabel: 'Not Picked',
    color: 'rose',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    indicator: 'bg-rose-400',
    description: 'Ringing, busy, call rejected, or phone switched off.'
  },
  DECLINED: {
    id: 'DECLINED',
    label: 'Declined / Not Interested',
    shortLabel: 'Declined',
    color: 'slate',
    badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    indicator: 'bg-slate-400',
    description: 'Cannot attend TechFEST or declined participation.'
  },
  WRONG_NUMBER: {
    id: 'WRONG_NUMBER',
    label: 'Wrong Number / Invalid',
    shortLabel: 'Wrong No.',
    color: 'purple',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    indicator: 'bg-purple-400',
    description: 'Invalid phone number, not reachable or wrong person.'
  }
};

const CALL_RECORDS_KEY = 'tf_call_records_v2';
const AUDIT_LOGS_KEY = 'tf_audit_logs_v2';
const MANUAL_VERIFICATIONS_KEY = 'tf_payment_verifications_v2';

// Realistic sample seed data to demonstrate calling history & timeline immediately
const INITIAL_CALL_RECORDS_SEED = {
  // Sample participant with 4 calls by Invitation and Outreach teams as requested by Sagar
  'p_demo_seed_1': {
    participantId: 'p_demo_seed_1',
    callCount: 4,
    lastCalledAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    lastStatus: 'PAYMENT_CLAIMED',
    lastRemark: 'Participant said paid ₹199 via UPI to TechFEST QR. Sent screenshot to WhatsApp.',
    leadNumber: '9876543210',
    claimedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    history: [
      {
        id: 'call_1',
        callNumber: 1,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
        callerName: 'Priya Sharma',
        callerRole: 'team_head',
        callerTeam: 'Invitation Team',
        status: 'NOT_PICKED',
        remark: 'Ringing, no response. Will retry in evening.',
        leadNumber: ''
      },
      {
        id: 'call_2',
        callNumber: 2,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        callerName: 'Rohit Kumar',
        callerRole: 'team_member',
        callerTeam: 'Outreach Team',
        status: 'CALL_LATER',
        remark: 'Candidate was in college lectures. Asked to call back after 6 PM.',
        leadNumber: '9876543210'
      },
      {
        id: 'call_3',
        callNumber: 3,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        callerName: 'Priya Sharma',
        callerRole: 'team_head',
        callerTeam: 'Invitation Team',
        status: 'INTERESTED',
        remark: 'Convinced for Robowars track. Explaining prize pool. Promised to pay tonight.',
        leadNumber: '9876543210'
      },
      {
        id: 'call_4',
        callNumber: 4,
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        callerName: 'Raj Aryan',
        callerRole: 'super_admin',
        callerTeam: 'Central Desk',
        status: 'PAYMENT_CLAIMED',
        remark: 'Participant said paid ₹199 via UPI to TechFEST QR. Sent screenshot to WhatsApp.',
        leadNumber: '9876543210'
      }
    ]
  }
};

const INITIAL_AUDIT_LOGS_SEED = [
  {
    id: 'log_seed_4',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    actorName: 'Raj Aryan',
    actorRole: 'super_admin',
    actorTeam: 'Central Desk',
    action: 'LOG_CALL',
    targetId: 'p_demo_seed_1',
    targetName: 'Aarav Sharma',
    eventName: 'Robowars Championship',
    prevStatus: 'INTERESTED',
    nextStatus: 'PAYMENT_CLAIMED',
    details: 'Logged Call #4. Status changed to Payment Completed (Sent to Verification Desk).'
  },
  {
    id: 'log_seed_3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    actorName: 'Priya Sharma',
    actorRole: 'team_head',
    actorTeam: 'Invitation Team',
    action: 'LOG_CALL',
    targetId: 'p_demo_seed_1',
    targetName: 'Aarav Sharma',
    eventName: 'Robowars Championship',
    prevStatus: 'CALL_LATER',
    nextStatus: 'INTERESTED',
    details: 'Logged Call #3. Marked Interested / Follow Up.'
  },
  {
    id: 'log_seed_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    actorName: 'Rohit Kumar',
    actorRole: 'team_member',
    actorTeam: 'Outreach Team',
    action: 'LOG_CALL',
    targetId: 'p_demo_seed_1',
    targetName: 'Aarav Sharma',
    eventName: 'Robowars Championship',
    prevStatus: 'NOT_PICKED',
    nextStatus: 'CALL_LATER',
    details: 'Logged Call #2. Callback scheduled.'
  },
  {
    id: 'log_seed_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    actorName: 'Priya Sharma',
    actorRole: 'team_head',
    actorTeam: 'Invitation Team',
    action: 'LOG_CALL',
    targetId: 'p_demo_seed_1',
    targetName: 'Aarav Sharma',
    eventName: 'Robowars Championship',
    prevStatus: 'NONE',
    nextStatus: 'NOT_PICKED',
    details: 'Logged Call #1. Participant did not pick up.'
  }
];

export function getCallRecords() {
  try {
    const raw = localStorage.getItem(CALL_RECORDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading call records:', e);
  }
  return INITIAL_CALL_RECORDS_SEED;
}

export function saveCallRecords(records) {
  try {
    localStorage.setItem(CALL_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving call records:', e);
  }
}

export function getParticipantCallRecord(participantId, defaultId = null) {
  const records = getCallRecords();
  return records[participantId] || (defaultId ? records[defaultId] : null);
}

export function getAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading audit logs:', e);
  }
  return INITIAL_AUDIT_LOGS_SEED;
}

export function saveAuditLogs(logs) {
  try {
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving audit logs:', e);
  }
}

export function addAuditLog(entry) {
  const logs = getAuditLogs();
  const newEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    ...entry
  };
  logs.unshift(newEntry);
  saveAuditLogs(logs.slice(0, 500)); // retain latest 500 logs
  return newEntry;
}

/**
 * Full two-way sync with Neon PostgreSQL:
 * Pulls call logs, audit records, and verifications from Neon cloud,
 * merges them into local storage, and emits event to update UI.
 */
export async function syncWithNeonDatabase() {
  if (dbStatus.isSyncing) return;
  dbStatus.isSyncing = true;

  try {
    const [neonCalls, neonAudits, neonVerifications] = await Promise.all([
      fetchCallRecordsFromNeon(),
      fetchAuditLogsFromNeon(300),
      fetchPaymentVerificationsFromNeon()
    ]);

    // 1. Merge call records
    const localRecords = getCallRecords();
    const mergedRecords = { ...localRecords };

    Object.entries(neonCalls).forEach(([pId, neonRec]) => {
      if (!mergedRecords[pId]) {
        mergedRecords[pId] = neonRec;
      } else {
        const existingHistory = mergedRecords[pId].history || [];
        const neonHistory = neonRec.history || [];
        const seenIds = new Set(existingHistory.map(h => h.id));

        neonHistory.forEach(h => {
          if (!seenIds.has(h.id)) {
            existingHistory.push(h);
            seenIds.add(h.id);
          }
        });

        existingHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        mergedRecords[pId].history = existingHistory;
        mergedRecords[pId].callCount = existingHistory.length;
        if (existingHistory[0]) {
          mergedRecords[pId].lastCalledAt = existingHistory[0].timestamp;
          mergedRecords[pId].lastStatus = existingHistory[0].status;
          mergedRecords[pId].lastRemark = existingHistory[0].remark;
          mergedRecords[pId].leadNumber = existingHistory[0].leadNumber || mergedRecords[pId].leadNumber;
        }
      }
    });

    saveCallRecords(mergedRecords);

    // 2. Merge audit logs
    if (neonAudits && neonAudits.length > 0) {
      const localAudits = getAuditLogs();
      const seenAuditIds = new Set(neonAudits.map(a => a.id));
      const combined = [...neonAudits];
      localAudits.forEach(a => {
        if (!seenAuditIds.has(a.id)) {
          combined.push(a);
        }
      });
      combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      saveAuditLogs(combined.slice(0, 500));
    }

    // 3. Merge payment verifications
    if (neonVerifications && Object.keys(neonVerifications).length > 0) {
      const localVerifications = getManualVerifications();
      const mergedVerifications = { ...localVerifications, ...neonVerifications };
      localStorage.setItem(MANUAL_VERIFICATIONS_KEY, JSON.stringify(mergedVerifications));
    }

    dbStatus.isConnected = true;
    dbStatus.lastSyncTime = new Date();
    dbStatus.error = null;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tf_neon_synced', { 
        detail: { timestamp: new Date().toISOString() } 
      }));
    }
  } catch (err) {
    console.error('Error syncing with Neon PostgreSQL:', err);
    dbStatus.error = err.message;
  } finally {
    dbStatus.isSyncing = false;
  }
}

/**
 * Log a new call with caller details, compulsory status, and remark
 */
export function logCallForParticipant({
  participant,
  callerUser,
  remark,
  leadNumber,
  status
}) {
  if (!participant || !participant.id) throw new Error('Invalid participant');
  if (!callerUser) throw new Error('Active user required to log call');
  if (!status) throw new Error('Call status is compulsory');

  const pId = String(participant.id);
  const records = getCallRecords();
  const existing = records[pId] || {
    participantId: pId,
    callCount: 0,
    history: []
  };

  const newCallNumber = (existing.callCount || 0) + 1;
  const nowIso = new Date().toISOString();

  const callEntry = {
    id: 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    callNumber: newCallNumber,
    timestamp: nowIso,
    callerName: callerUser.name,
    callerRole: callerUser.role,
    callerTeam: callerUser.teamName || callerUser.team,
    status,
    remark: remark?.trim() || 'No remarks entered.',
    leadNumber: leadNumber?.trim() || existing.leadNumber || ''
  };

  const prevStatus = existing.lastStatus || 'NONE';

  const updatedRecord = {
    participantId: pId,
    callCount: newCallNumber,
    lastCalledAt: nowIso,
    lastStatus: status,
    lastRemark: callEntry.remark,
    leadNumber: callEntry.leadNumber,
    claimedAt: status === 'PAYMENT_CLAIMED' ? nowIso : existing.claimedAt,
    history: [callEntry, ...(existing.history || [])]
  };

  records[pId] = updatedRecord;
  saveCallRecords(records);

  // Add immutable Audit Log entry
  const auditEntry = addAuditLog({
    actorName: callerUser.name,
    actorRole: callerUser.role,
    actorTeam: callerUser.teamName || callerUser.team,
    action: 'LOG_CALL',
    targetId: pId,
    targetName: participant.name || 'Participant',
    eventName: participant.event_name || 'Event',
    prevStatus,
    nextStatus: status,
    details: `Logged Call #${newCallNumber}. Status: ${CALL_STATUSES[status]?.label || status}. Remark: ${callEntry.remark}`
  });

  // Background Cloud Sync to Neon PostgreSQL
  writeCallLogToNeon({
    id: callEntry.id,
    participantId: pId,
    callNumber: newCallNumber,
    timestamp: nowIso,
    callerName: callerUser.name,
    callerRole: callerUser.role,
    callerTeam: callerUser.teamName || callerUser.team,
    status,
    remark: callEntry.remark,
    leadNumber: callEntry.leadNumber
  }).catch(e => console.error('Neon writeCallLog error:', e));

  writeAuditLogToNeon(auditEntry)
    .catch(e => console.error('Neon writeAuditLog error:', e));

  return updatedRecord;
}

/**
 * Verification Queue Engine
 * Evaluates payment claims vs Unstop gateway records and flags defaulters
 */
export function getPaymentVerificationQueue(participants = []) {
  const records = getCallRecords();
  const manualVerifications = getManualVerifications();
  const results = [];

  // Index participants by ID
  const pMap = {};
  participants.forEach(p => {
    pMap[String(p.id)] = p;
  });

  Object.entries(records).forEach(([pId, record]) => {
    if (record.lastStatus === 'PAYMENT_CLAIMED' || record.claimedAt) {
      const p = pMap[pId] || { id: pId, name: 'Participant ' + pId, event_name: 'TechFEST Event', amount: 0 };
      const isGatewayPaid = Boolean(p.is_paid || (Number(p.amount) > 0 && p.payment_id));
      const manualStatus = manualVerifications[pId];

      const claimedTime = new Date(record.claimedAt || record.lastCalledAt).getTime();
      const elapsedHours = (Date.now() - claimedTime) / (1000 * 60 * 60);

      let verificationState = 'PENDING_SYNC';
      let stateBadge = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      let stateLabel = 'Pending Unstop Sync';

      if (manualStatus === 'APPROVED' || isGatewayPaid) {
        verificationState = 'VERIFIED_PAID';
        stateBadge = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        stateLabel = 'Verified Gateway Payment';
      } else if (manualStatus === 'REJECTED' || elapsedHours > 24) {
        // Flagged as Defaulter after 24h without unstop payment match
        verificationState = 'DEFAULTER';
        stateBadge = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        stateLabel = '⚠️ Defaulter (Unpaid in Gateway >24h)';
      }

      results.push({
        participantId: pId,
        participant: p,
        record,
        elapsedHours: Math.round(elapsedHours),
        verificationState,
        stateBadge,
        stateLabel,
        isGatewayPaid,
        manualStatus
      });
    }
  });

  return results;
}

export function getManualVerifications() {
  try {
    const raw = localStorage.getItem(MANUAL_VERIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading manual verifications:', e);
  }
  return {};
}

export function setManualVerification(participantId, status, adminUser, reason = '') {
  const map = getManualVerifications();
  map[participantId] = status;
  try {
    localStorage.setItem(MANUAL_VERIFICATIONS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving manual verification:', e);
  }

  const auditEntry = addAuditLog({
    actorName: adminUser.name,
    actorRole: adminUser.role,
    actorTeam: adminUser.teamName || adminUser.team,
    action: 'VERIFY_PAYMENT',
    targetId: participantId,
    targetName: `Participant #${participantId}`,
    eventName: 'TechFEST Payment Desk',
    prevStatus: 'PENDING_VERIFICATION',
    nextStatus: status,
    details: `Manual verification set to: ${status}. Reason/Txn: ${reason}`
  });

  // Background Cloud Sync to Neon PostgreSQL
  writePaymentVerificationToNeon(participantId, status, adminUser.name, reason)
    .catch(e => console.error('Neon writePaymentVerification error:', e));

  writeAuditLogToNeon(auditEntry)
    .catch(e => console.error('Neon writeAuditLog error:', e));
}
