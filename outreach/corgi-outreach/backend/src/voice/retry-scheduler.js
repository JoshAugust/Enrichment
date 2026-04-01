/**
 * retry-scheduler.js — Retry scheduling for unanswered / failed calls
 *
 * After a `no_answer` or `failed` call, schedules a follow-up attempt.
 * Max 3 attempts per contact:
 *   Attempt 1 → original call
 *   Attempt 2 → 48 hours later
 *   Attempt 3 → 96 hours (4 days) later
 *
 * Exports:
 *   scheduleRetry(callResult)    — schedule next attempt if under max
 *   getDueRetries()              — retries where scheduled_for <= now
 *   cancelRetries(contactId)     — cancel all pending retries for a contact
 *   getRetryStatus(contactId)    — current retry state for a contact
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS call_retries (
    id             TEXT PRIMARY KEY,
    company_id     TEXT NOT NULL,
    contact_id     TEXT NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    max_attempts   INTEGER NOT NULL DEFAULT 3,
    scheduled_for  TEXT NOT NULL,
    status         TEXT DEFAULT 'scheduled'
      CHECK(status IN ('scheduled','completed','cancelled','expired')),
    call_result_id TEXT,
    created_at     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_call_retries_contact   ON call_retries(contact_id);
  CREATE INDEX IF NOT EXISTS idx_call_retries_status    ON call_retries(status);
  CREATE INDEX IF NOT EXISTS idx_call_retries_scheduled ON call_retries(scheduled_for);
`);

console.log('[retry-scheduler] Schema ready');

// ── Retry interval map (attempt_number → delay in hours) ─────────────────────
const RETRY_DELAY_HOURS = {
  2: 48,   // second attempt: 48 hours after first
  3: 96,   // third attempt:  96 hours (4 days) after first
};

const MAX_ATTEMPTS = 3;

// ── scheduleRetry ─────────────────────────────────────────────────────────────

/**
 * Schedule the next retry for a contact after a failed/no_answer call.
 * Checks how many attempts have already been made — if under MAX_ATTEMPTS,
 * inserts a new scheduled retry.
 *
 * @param {Object} callResult — row from call_results (must have contact_id, company_id, id)
 * @returns {Object|null} newly created retry record, or null if max attempts reached
 */
function scheduleRetry(callResult) {
  const { contact_id, company_id, id: call_result_id } = callResult;

  if (!contact_id || !company_id) {
    console.warn('[retry-scheduler] scheduleRetry: missing contact_id or company_id');
    return null;
  }

  // Count total call attempts for this contact (all call_results + all retries)
  const existingRetries = db.prepare(`
    SELECT COUNT(*) AS cnt FROM call_retries
    WHERE contact_id = ? AND status IN ('scheduled','completed')
  `).get(contact_id);

  // attempt_number for the NEXT retry = existing completed retries + 1 (for original call) + 1
  // Simpler: count how many retries (any status) already exist for this contact
  const allRetries = db.prepare(`
    SELECT COUNT(*) AS cnt FROM call_retries WHERE contact_id = ?
  `).get(contact_id);

  const nextAttemptNumber = (allRetries?.cnt || 0) + 2; // +1 for original call, +1 for this retry

  if (nextAttemptNumber > MAX_ATTEMPTS) {
    console.log(`[retry-scheduler] Max attempts (${MAX_ATTEMPTS}) reached for contact ${contact_id} — not scheduling retry`);
    return null;
  }

  const delayHours = RETRY_DELAY_HOURS[nextAttemptNumber] || 48;
  const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000).toISOString();

  const id  = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO call_retries
      (id, company_id, contact_id, attempt_number, max_attempts, scheduled_for, status, call_result_id, created_at)
    VALUES
      (@id, @company_id, @contact_id, @attempt_number, @max_attempts, @scheduled_for, 'scheduled', @call_result_id, @created_at)
  `).run({
    id,
    company_id,
    contact_id,
    attempt_number: nextAttemptNumber,
    max_attempts:   MAX_ATTEMPTS,
    scheduled_for:  scheduledFor,
    call_result_id: call_result_id || null,
    created_at:     now,
  });

  const retry = db.prepare(`SELECT * FROM call_retries WHERE id = ?`).get(id);

  console.log(
    `[retry-scheduler] Scheduled attempt #${nextAttemptNumber} for contact ${contact_id} ` +
    `at ${scheduledFor} (in ${delayHours}h)`
  );

  return retry;
}

// ── getDueRetries ─────────────────────────────────────────────────────────────

/**
 * Return all scheduled retries whose scheduled_for time has passed.
 * Joins with companies and contacts for convenience.
 *
 * @returns {Object[]}
 */
function getDueRetries() {
  return db.prepare(`
    SELECT
      r.*,
      co.name AS company_name,
      co.type AS company_type,
      ct.name AS contact_name,
      ct.phone AS contact_phone,
      ct.email AS contact_email
    FROM call_retries r
    LEFT JOIN companies co ON co.id = r.company_id
    LEFT JOIN contacts  ct ON ct.id = r.contact_id
    WHERE r.status = 'scheduled'
      AND r.scheduled_for <= datetime('now')
    ORDER BY r.scheduled_for ASC
  `).all();
}

// ── cancelRetries ─────────────────────────────────────────────────────────────

/**
 * Cancel all pending (scheduled) retries for a contact.
 * Called when a call succeeds (meeting_booked, interested, not_interested).
 *
 * @param {string} contactId
 * @returns {number} number of retries cancelled
 */
function cancelRetries(contactId) {
  const info = db.prepare(`
    UPDATE call_retries
    SET status = 'cancelled'
    WHERE contact_id = ? AND status = 'scheduled'
  `).run(contactId);

  if (info.changes > 0) {
    console.log(`[retry-scheduler] Cancelled ${info.changes} pending retry(ies) for contact ${contactId}`);
  }

  return info.changes;
}

// ── getRetryStatus ────────────────────────────────────────────────────────────

/**
 * Get the current retry state for a contact.
 *
 * @param {string} contactId
 * @returns {{ totalScheduled: number, nextRetry: Object|null, allRetries: Object[] }}
 */
function getRetryStatus(contactId) {
  const allRetries = db.prepare(`
    SELECT * FROM call_retries WHERE contact_id = ? ORDER BY created_at ASC
  `).all(contactId);

  const nextRetry = db.prepare(`
    SELECT * FROM call_retries
    WHERE contact_id = ? AND status = 'scheduled'
    ORDER BY scheduled_for ASC
    LIMIT 1
  `).get(contactId) || null;

  return {
    totalScheduled: allRetries.filter(r => r.status === 'scheduled').length,
    nextRetry,
    allRetries,
  };
}

// ── markRetryCompleted ────────────────────────────────────────────────────────

/**
 * Mark a retry as completed (called after the retry call is initiated).
 * @param {string} retryId
 * @returns {Object|null}
 */
function markRetryCompleted(retryId) {
  db.prepare(`
    UPDATE call_retries SET status = 'completed' WHERE id = ?
  `).run(retryId);
  return db.prepare(`SELECT * FROM call_retries WHERE id = ?`).get(retryId) || null;
}

/**
 * Cancel a single retry by ID.
 * @param {string} retryId
 * @returns {boolean}
 */
function cancelRetry(retryId) {
  const info = db.prepare(`
    UPDATE call_retries SET status = 'cancelled' WHERE id = ? AND status = 'scheduled'
  `).run(retryId);
  return info.changes > 0;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  scheduleRetry,
  getDueRetries,
  cancelRetries,
  cancelRetry,
  getRetryStatus,
  markRetryCompleted,
};
