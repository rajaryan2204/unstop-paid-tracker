// src/utils/neonDb.js
// Production Neon PostgreSQL Cloud Sync Engine for TechFEST '26
import { neon } from '@neondatabase/serverless';

// Default Neon Database connection provided by central organizer
export const DEFAULT_NEON_DATABASE_URL = 
  import.meta.env?.VITE_NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_Sr9XpW5sKcPU@ep-late-shadow-awcbgs14-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

let sqlClient = null;

export function getSqlClient() {
  if (!sqlClient) {
    const url = localStorage.getItem('tf_custom_neon_url') || DEFAULT_NEON_DATABASE_URL;
    sqlClient = neon(url);
  }
  return sqlClient;
}

// Reactive DB Connection State
export const dbStatus = {
  isConnected: false,
  isSyncing: false,
  lastSyncTime: null,
  error: null,
  pendingWritesCount: 0
};

const listeners = new Set();
export function subscribeDbStatus(listener) {
  listeners.add(listener);
  listener({ ...dbStatus });
  return () => listeners.delete(listener);
}

function notifyStatus() {
  const current = { ...dbStatus };
  listeners.forEach(fn => {
    try { fn(current); } catch (e) { /* ignore */ }
  });
}

/**
 * Fetch and assemble all call records from Neon into the app's participant record map
 */
export async function fetchCallRecordsFromNeon() {
  const sql = getSqlClient();
  const rows = await sql`
    SELECT id, participant_id, call_number, timestamp, caller_name, caller_role, caller_team, status, remark, lead_number
    FROM call_logs
    ORDER BY timestamp DESC
  `;

  const recordMap = {};

  for (const row of rows) {
    const pId = String(row.participant_id);
    if (!recordMap[pId]) {
      recordMap[pId] = {
        participantId: pId,
        callCount: 0,
        lastCalledAt: row.timestamp,
        lastStatus: row.status,
        lastRemark: row.remark,
        leadNumber: row.lead_number || '',
        claimedAt: row.status === 'PAYMENT_CLAIMED' ? row.timestamp : null,
        history: []
      };
    }

    const rec = recordMap[pId];
    rec.callCount = Math.max(rec.callCount, row.call_number || 0);

    // Track latest status/claimed
    if (row.status === 'PAYMENT_CLAIMED' && !rec.claimedAt) {
      rec.claimedAt = row.timestamp;
    }

    rec.history.push({
      id: row.id,
      callNumber: row.call_number,
      timestamp: row.timestamp,
      callerName: row.caller_name || 'Staff Caller',
      callerRole: row.caller_role || 'caller',
      callerTeam: row.caller_team || 'Central Desk',
      status: row.status,
      remark: row.remark || '',
      leadNumber: row.lead_number || ''
    });
  }

  // Ensure call history is sorted newest to oldest
  Object.values(recordMap).forEach(rec => {
    rec.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (rec.history.length > 0) {
      rec.callCount = rec.history.length;
      rec.lastCalledAt = rec.history[0].timestamp;
      rec.lastStatus = rec.history[0].status;
      rec.lastRemark = rec.history[0].remark;
      rec.leadNumber = rec.history[0].leadNumber || rec.leadNumber;
    }
  });

  return recordMap;
}

/**
 * Fetch latest audit logs from Neon
 */
export async function fetchAuditLogsFromNeon(limit = 200) {
  const sql = getSqlClient();
  const rows = await sql`
    SELECT id, timestamp, actor_name, actor_role, actor_team, action, target_id, target_name, event_name, prev_status, next_status, details
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;

  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    actorTeam: r.actor_team,
    action: r.action,
    targetId: r.target_id,
    targetName: r.target_name,
    eventName: r.event_name,
    prevStatus: r.prev_status,
    nextStatus: r.next_status,
    details: r.details
  }));
}

/**
 * Fetch manual payment verifications map
 */
export async function fetchPaymentVerificationsFromNeon() {
  const sql = getSqlClient();
  const rows = await sql`
    SELECT participant_id, verification_state, verified_by, verified_by_name, notes, updated_at
    FROM payment_verifications
  `;

  const map = {};
  rows.forEach(r => {
    map[String(r.participant_id)] = r.verification_state;
  });
  return map;
}

/**
 * Fetch custom domain head passwords
 */
export async function fetchCustomPasswordsFromNeon() {
  const sql = getSqlClient();
  const rows = await sql`
    SELECT username, password, updated_by, updated_at
    FROM custom_passwords
  `;

  const map = {};
  rows.forEach(r => {
    map[r.username.toLowerCase()] = r.password;
  });
  return map;
}

/**
 * Async writers that write directly to Neon Cloud PostgreSQL
 */
export async function writeCallLogToNeon(entry) {
  try {
    const sql = getSqlClient();
    await sql`
      INSERT INTO call_logs (
        id, participant_id, call_number, timestamp, caller_name, caller_role, caller_team, status, remark, lead_number
      ) VALUES (
        ${entry.id}, 
        ${entry.participantId}, 
        ${entry.callNumber}, 
        ${entry.timestamp || new Date().toISOString()}, 
        ${entry.callerName || 'Staff Caller'}, 
        ${entry.callerRole || 'caller'}, 
        ${entry.callerTeam || 'Central Desk'}, 
        ${entry.status}, 
        ${entry.remark || ''}, 
        ${entry.leadNumber || ''}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    dbStatus.isConnected = true;
    dbStatus.error = null;
    notifyStatus();
    return true;
  } catch (err) {
    console.error('Neon writeCallLog error:', err);
    dbStatus.error = err.message;
    notifyStatus();
    return false;
  }
}

export async function writeAuditLogToNeon(entry) {
  try {
    const sql = getSqlClient();
    await sql`
      INSERT INTO audit_logs (
        id, timestamp, actor_name, actor_role, actor_team, action, target_id, target_name, event_name, prev_status, next_status, details
      ) VALUES (
        ${entry.id}, 
        ${entry.timestamp || new Date().toISOString()}, 
        ${entry.actorName}, 
        ${entry.actorRole || 'staff'}, 
        ${entry.actorTeam || 'Central Desk'}, 
        ${entry.action}, 
        ${entry.targetId || ''}, 
        ${entry.targetName || ''}, 
        ${entry.eventName || ''}, 
        ${entry.prevStatus || ''}, 
        ${entry.nextStatus || ''}, 
        ${entry.details || ''}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    dbStatus.isConnected = true;
    dbStatus.error = null;
    notifyStatus();
    return true;
  } catch (err) {
    console.error('Neon writeAuditLog error:', err);
    return false;
  }
}

export async function writePaymentVerificationToNeon(participantId, status, verifiedBy = '', notes = '') {
  try {
    const sql = getSqlClient();
    await sql`
      INSERT INTO payment_verifications (
        participant_id, verification_state, verified_by, notes, updated_at
      ) VALUES (
        ${String(participantId)}, 
        ${status}, 
        ${verifiedBy}, 
        ${notes}, 
        NOW()
      )
      ON CONFLICT (participant_id) 
      DO UPDATE SET 
        verification_state = EXCLUDED.verification_state,
        verified_by = EXCLUDED.verified_by,
        notes = EXCLUDED.notes,
        updated_at = NOW()
    `;
    dbStatus.isConnected = true;
    dbStatus.error = null;
    notifyStatus();
    return true;
  } catch (err) {
    console.error('Neon writePaymentVerification error:', err);
    return false;
  }
}

export async function writeCustomPasswordToNeon(username, password, updatedBy = 'super_admin') {
  try {
    const sql = getSqlClient();
    const clean = username.toLowerCase().trim();
    await sql`
      INSERT INTO custom_passwords (username, password, updated_by, updated_at)
      VALUES (${clean}, ${password.trim()}, ${updatedBy}, NOW())
      ON CONFLICT (username)
      DO UPDATE SET 
        password = EXCLUDED.password,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    `;
    dbStatus.isConnected = true;
    dbStatus.error = null;
    notifyStatus();
    return true;
  } catch (err) {
    console.error('Neon writeCustomPassword error:', err);
    return false;
  }
}

export async function deleteCustomPasswordFromNeon(username) {
  try {
    const sql = getSqlClient();
    const clean = username.toLowerCase().trim();
    await sql`
      DELETE FROM custom_passwords WHERE username = ${clean}
    `;
    dbStatus.isConnected = true;
    dbStatus.error = null;
    notifyStatus();
    return true;
  } catch (err) {
    console.error('Neon deleteCustomPassword error:', err);
    return false;
  }
}
