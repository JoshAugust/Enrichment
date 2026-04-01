/**
 * call-results-db.js — Database layer for call results, recordings & transcripts
 *
 * Creates and manages the `call_results` table.
 * All timestamps use SQLite datetime('now') with single quotes.
 * UUIDs generated via uuid v4.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS call_results (
    id               TEXT PRIMARY KEY,
    company_id       TEXT NOT NULL,
    contact_id       TEXT,
    call_provider    TEXT DEFAULT 'vapi',
    call_provider_id TEXT,
    status           TEXT NOT NULL DEFAULT 'initiated'
      CHECK(status IN ('initiated','ringing','in_progress','voicemail','completed','failed','no_answer')),
    outcome          TEXT
      CHECK(outcome IN ('meeting_booked','interested','not_interested','callback_requested','wrong_person','voicemail_left','no_answer','failed')),
    duration_seconds INTEGER,
    recording_url    TEXT,
    transcript       TEXT,
    summary          TEXT,
    notes            TEXT,
    call_cost        REAL,
    created_at       TEXT NOT NULL,
    updated_at       TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_call_results_company  ON call_results(company_id);
  CREATE INDEX IF NOT EXISTS idx_call_results_status   ON call_results(status);
  CREATE INDEX IF NOT EXISTS idx_call_results_outcome  ON call_results(outcome);
  CREATE INDEX IF NOT EXISTS idx_call_results_created  ON call_results(created_at);
`);

// Add new columns if they don't exist (safe migration)
try { db.exec(`ALTER TABLE call_results ADD COLUMN prospect_email TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE call_results ADD COLUMN preferred_times TEXT`); } catch (_) {}

console.log('[call-results-db] Schema ready');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Insert a new call result record.
 *
 * @param {Object} data
 * @param {string} data.company_id         - Required
 * @param {string} [data.contact_id]
 * @param {string} [data.call_provider]    - Default 'vapi'
 * @param {string} [data.call_provider_id]
 * @param {string} [data.status]           - Default 'initiated'
 * @param {string} [data.outcome]
 * @param {number} [data.duration_seconds]
 * @param {string} [data.recording_url]
 * @param {string} [data.transcript]
 * @param {string} [data.summary]
 * @param {string} [data.notes]
 * @param {number} [data.call_cost]
 * @returns {Object} The inserted record
 */
function createCallResult(data) {
  try {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO call_results (
        id, company_id, contact_id, call_provider, call_provider_id,
        status, outcome, duration_seconds, recording_url,
        transcript, summary, notes, call_cost, created_at, updated_at
      ) VALUES (
        @id, @company_id, @contact_id, @call_provider, @call_provider_id,
        @status, @outcome, @duration_seconds, @recording_url,
        @transcript, @summary, @notes, @call_cost, @created_at, @updated_at
      )
    `).run({
      id,
      company_id:       data.company_id,
      contact_id:       data.contact_id       || null,
      call_provider:    data.call_provider    || 'vapi',
      call_provider_id: data.call_provider_id || null,
      status:           data.status           || 'initiated',
      outcome:          data.outcome          || null,
      duration_seconds: data.duration_seconds || null,
      recording_url:    data.recording_url    || null,
      transcript:       data.transcript       || null,
      summary:          data.summary          || null,
      notes:            data.notes            || null,
      call_cost:        data.call_cost        || null,
      created_at:       now,
      updated_at:       now,
    });

    return getCallResultById(id);
  } catch (err) {
    console.error('[call-results-db] createCallResult error:', err.message);
    throw err;
  }
}

/**
 * Update an existing call result (partial update — only provided fields are changed).
 *
 * @param {string} id
 * @param {Object} data - Fields to update
 * @returns {Object|null} Updated record, or null if not found
 */
function updateCallResult(id, data) {
  try {
    const allowed = [
      'status', 'outcome', 'duration_seconds', 'recording_url',
      'transcript', 'summary', 'notes', 'call_cost', 'call_provider_id',
      'prospect_email', 'preferred_times',
    ];

    const fields = allowed.filter(f => data[f] !== undefined);
    if (fields.length === 0) return getCallResultById(id);

    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const params = { id, updated_at: new Date().toISOString() };
    fields.forEach(f => { params[f] = data[f]; });

    db.prepare(`
      UPDATE call_results
      SET ${setClause}, updated_at = @updated_at
      WHERE id = @id
    `).run(params);

    return getCallResultById(id);
  } catch (err) {
    console.error('[call-results-db] updateCallResult error:', err.message);
    throw err;
  }
}

/**
 * Retrieve call results with optional filters and pagination.
 *
 * @param {Object} [filters]
 * @param {string} [filters.company_id]
 * @param {string} [filters.status]
 * @param {string} [filters.outcome]
 * @param {number} [filters.limit]   - Default 50
 * @param {number} [filters.offset]  - Default 0
 * @returns {Object[]}
 */
function getCallResults(filters = {}) {
  try {
    const conditions = [];
    const params = {};

    if (filters.company_id) {
      conditions.push('company_id = @company_id');
      params.company_id = filters.company_id;
    }
    if (filters.status) {
      conditions.push('status = @status');
      params.status = filters.status;
    }
    if (filters.outcome) {
      conditions.push('outcome = @outcome');
      params.outcome = filters.outcome;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit  = Math.min(parseInt(filters.limit  || 50, 10), 500);
    const offset = parseInt(filters.offset || 0, 10);

    return db.prepare(`
      SELECT cr.*, c.name AS company_name
      FROM call_results cr
      LEFT JOIN companies c ON c.id = cr.company_id
      ${where}
      ORDER BY cr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `).all(params);
  } catch (err) {
    console.error('[call-results-db] getCallResults error:', err.message);
    throw err;
  }
}

/**
 * Get a single call result by ID.
 *
 * @param {string} id
 * @returns {Object|null}
 */
function getCallResultById(id) {
  try {
    return db.prepare(`
      SELECT cr.*, c.name AS company_name
      FROM call_results cr
      LEFT JOIN companies c ON c.id = cr.company_id
      WHERE cr.id = ?
    `).get(id) || null;
  } catch (err) {
    console.error('[call-results-db] getCallResultById error:', err.message);
    throw err;
  }
}

/**
 * Get all call results for a specific company, newest first.
 *
 * @param {string} companyId
 * @returns {Object[]}
 */
function getCallResultsByCompany(companyId) {
  try {
    return db.prepare(`
      SELECT cr.*, c.name AS company_name
      FROM call_results cr
      LEFT JOIN companies c ON c.id = cr.company_id
      WHERE cr.company_id = ?
      ORDER BY cr.created_at DESC
    `).all(companyId);
  } catch (err) {
    console.error('[call-results-db] getCallResultsByCompany error:', err.message);
    throw err;
  }
}

module.exports = {
  createCallResult,
  updateCallResult,
  getCallResults,
  getCallResultById,
  getCallResultsByCompany,
};
