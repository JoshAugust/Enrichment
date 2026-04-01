/**
 * db.js — SQLite database layer for Corgi Outreach
 *
 * Uses better-sqlite3 for synchronous, low-latency access.
 * All schema migrations are run on startup via initSchema().
 */

'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ── Config ──────────────────────────────────────────────────────────────────
const config = require('../config/default.json');

// DB_PATH priority: env var → config → default
// On Railway with a volume mounted at /data, set DB_PATH=/data/corgi.db
// This ensures the DB persists across deploys (not wiped by git push)
const DB_PATH = process.env.DB_PATH || config.database.path;

// Ensure the data directory exists
const resolvedDbPath = path.resolve(__dirname, '..', DB_PATH);
const dbDir = path.dirname(resolvedDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// If DB doesn't exist yet (fresh Railway deploy with volume), copy from seed
if (!fs.existsSync(resolvedDbPath)) {
  const seedPath = path.resolve(__dirname, '..', 'data', 'seed.db');
  if (fs.existsSync(seedPath)) {
    console.log('[db] No database found at', resolvedDbPath, '— copying seed DB...');
    fs.copyFileSync(seedPath, resolvedDbPath);
    console.log('[db] Seed DB copied successfully');
  } else {
    console.log('[db] No database or seed found — starting fresh');
  }
}

const db = new Database(resolvedDbPath);

// ── Pragmas for performance and safety ──────────────────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

// ── Schema ───────────────────────────────────────────────────────────────────
function initSchema() {
  db.exec(`
    -- ----------------------------------------------------------------
    -- companies
    -- ----------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS companies (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      type                TEXT NOT NULL CHECK(type IN ('operator', 'lender', 'arranger')),
      website             TEXT,
      description         TEXT,
      priority            TEXT CHECK(priority IN ('A', 'B', 'C')),
      industry_segment    TEXT,
      estimated_gpu_scale TEXT,          -- e.g. "100-500 GPUs", "$50M-$150M"
      financing_status    TEXT,          -- e.g. "active", "upcoming", "unknown"
      qualification_score INTEGER DEFAULT 0,
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ----------------------------------------------------------------
    -- contacts
    -- ----------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS contacts (
      id           TEXT PRIMARY KEY,
      company_id   TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      title        TEXT,
      email        TEXT,
      phone        TEXT,
      linkedin_url TEXT,
      source       TEXT,                 -- e.g. "website", "linkedin", "manual"
      verified     INTEGER NOT NULL DEFAULT 0,  -- 0 = unverified, 1 = verified
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ----------------------------------------------------------------
    -- outreach_log
    -- ----------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS outreach_log (
      id             TEXT PRIMARY KEY,
      contact_id     TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      channel        TEXT NOT NULL CHECK(channel IN ('call', 'email')),
      status         TEXT NOT NULL CHECK(status IN ('draft', 'scheduled', 'completed', 'failed')),
      script_version TEXT,              -- A/B/C/D/E
      notes          TEXT,
      scheduled_at   TEXT,
      completed_at   TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ----------------------------------------------------------------
    -- email_drafts
    -- ----------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS email_drafts (
      id            TEXT PRIMARY KEY,
      contact_id    TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      subject       TEXT NOT NULL,
      body          TEXT NOT NULL,
      template_name TEXT,
      status        TEXT NOT NULL CHECK(status IN ('draft', 'approved', 'sent')) DEFAULT 'draft',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ----------------------------------------------------------------
    -- call_scripts
    -- ----------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS call_scripts (
      id                TEXT PRIMARY KEY,
      company_id        TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      script_version    TEXT NOT NULL CHECK(script_version IN ('A', 'B', 'C', 'D', 'E')),
      customized_script TEXT NOT NULL,  -- JSON: { lines: [...], followups: [...] }
      buyer_type        TEXT NOT NULL,  -- operator / lender / arranger
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ----------------------------------------------------------------
    -- research_notes
    -- ----------------------------------------------------------------
    CREATE TABLE IF NOT EXISTS research_notes (
      id         TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      source_url TEXT,
      summary    TEXT,
      raw_data   TEXT,                  -- JSON blob
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ----------------------------------------------------------------
    -- Indexes
    -- ----------------------------------------------------------------
    CREATE INDEX IF NOT EXISTS idx_contacts_company    ON contacts(company_id);
    CREATE INDEX IF NOT EXISTS idx_outreach_contact    ON outreach_log(contact_id);
    CREATE INDEX IF NOT EXISTS idx_email_drafts_contact ON email_drafts(contact_id);
    CREATE INDEX IF NOT EXISTS idx_call_scripts_company ON call_scripts(company_id);
    CREATE INDEX IF NOT EXISTS idx_research_company    ON research_notes(company_id);
    CREATE INDEX IF NOT EXISTS idx_companies_priority  ON companies(priority);
    CREATE INDEX IF NOT EXISTS idx_companies_type      ON companies(type);
  `);

  // ── Migration: add columns that were added post-initial-schema ──────────
  const migrations = [
    // Companies enrichment columns
    'ALTER TABLE companies ADD COLUMN founded_year INTEGER',
    'ALTER TABLE companies ADD COLUMN employee_count TEXT',
    'ALTER TABLE companies ADD COLUMN total_raised TEXT',
    'ALTER TABLE companies ADD COLUMN last_funding_round TEXT',
    'ALTER TABLE companies ADD COLUMN investors TEXT',
    'ALTER TABLE companies ADD COLUMN headquarters TEXT',
    'ALTER TABLE companies ADD COLUMN linkedin_url TEXT',
    'ALTER TABLE companies ADD COLUMN twitter_url TEXT',
    'ALTER TABLE companies ADD COLUMN github_url TEXT',
    'ALTER TABLE companies ADD COLUMN recent_news TEXT',
    'ALTER TABLE companies ADD COLUMN hiring_signals TEXT',
    'ALTER TABLE companies ADD COLUMN last_enriched_at DATETIME',
    'ALTER TABLE companies ADD COLUMN sec_ticker TEXT',
    'ALTER TABLE companies ADD COLUMN sec_cik TEXT',
    'ALTER TABLE companies ADD COLUMN gpu_asset_value TEXT',
    'ALTER TABLE companies ADD COLUMN depreciation_schedule TEXT',
    'ALTER TABLE companies ADD COLUMN open_roles_count INTEGER',
    'ALTER TABLE companies ADD COLUMN key_hires TEXT',
    'ALTER TABLE companies ADD COLUMN nvidia_partnership TEXT',
    "ALTER TABLE companies ADD COLUMN outreach_status TEXT DEFAULT 'uncontacted'",
    "ALTER TABLE companies ADD COLUMN manual_call_made INTEGER DEFAULT 0",
    // Contacts enrichment columns
    'ALTER TABLE contacts ADD COLUMN twitter_url TEXT',
    'ALTER TABLE contacts ADD COLUMN github_url TEXT',
    'ALTER TABLE contacts ADD COLUMN bio TEXT',
    'ALTER TABLE contacts ADD COLUMN tenure TEXT',
    'ALTER TABLE contacts ADD COLUMN email_pattern TEXT',
    'ALTER TABLE contacts ADD COLUMN email_confidence REAL DEFAULT 0',
    'ALTER TABLE contacts ADD COLUMN last_enriched_at DATETIME',
    // Phone column on companies
    'ALTER TABLE companies ADD COLUMN phone TEXT',
    // Call notes + talking points
    "ALTER TABLE companies ADD COLUMN call_notes TEXT DEFAULT ''",
    'ALTER TABLE companies ADD COLUMN talking_points TEXT',
    // Enrichment log table
    `CREATE TABLE IF NOT EXISTS enrichment_log (
      id TEXT PRIMARY KEY, company_id TEXT NOT NULL, source TEXT NOT NULL, 
      fields_updated TEXT, data_found TEXT, success INTEGER DEFAULT 1,
      error TEXT, duration_ms INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    // Call results table (call log)
    `CREATE TABLE IF NOT EXISTS call_results (
      id TEXT PRIMARY KEY, company_id TEXT, contact_id TEXT,
      call_provider TEXT, call_provider_id TEXT, status TEXT, outcome TEXT,
      duration_seconds INTEGER DEFAULT 0, recording_url TEXT, transcript TEXT,
      summary TEXT, notes TEXT, call_cost REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    // Notes audit trail — NEVER lose a note
    `CREATE TABLE IF NOT EXISTS notes_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT NOT NULL,
      notes_text TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT 'save',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    // ── Verification checks log (Task 1) ─────────────────────────────────
    `CREATE TABLE IF NOT EXISTS verification_checks (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      check_type TEXT NOT NULL,
      result TEXT NOT NULL,
      score_impact INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      source TEXT,
      checked_at DATETIME DEFAULT (datetime('now')),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )`,
    'CREATE INDEX IF NOT EXISTS idx_vc_company ON verification_checks(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_vc_type ON verification_checks(check_type)',
    // ── Additional contacts verification columns ──────────────────────────
    'ALTER TABLE contacts ADD COLUMN verification_notes TEXT',
    'ALTER TABLE contacts ADD COLUMN agent_verified_at DATETIME',
  ];
  for (const sql of migrations) {
    try { db.exec(sql); } catch (_) { /* column already exists */ }
  }

  console.log('[db] Schema initialized');
}

// Run schema on module load
initSchema();

// ── Auto-seed if database is empty ──────────────────────────────────────────
function autoSeed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM companies').get();
  if (count && count.c > 0) {
    console.log(`[db] Database has ${count.c} companies — skipping seed`);
    return;
  }
  const seedPath = path.resolve(__dirname, '../scripts/seed-data.sql');
  if (!fs.existsSync(seedPath)) {
    console.log('[db] No seed file found — starting with empty database');
    return;
  }
  console.log('[db] Empty database detected — running seed...');
  const sql = fs.readFileSync(seedPath, 'utf-8');
  
  // Extract only INSERT statements and run them in a transaction
  const inserts = sql.split('\n')
    .filter(line => line.trim().startsWith('INSERT'))
    .join('\n');
  
  if (!inserts) {
    console.log('[db] No INSERT statements found in seed file');
    return;
  }
  
  try {
    db.exec('BEGIN TRANSACTION;\n' + inserts + '\nCOMMIT;');
    const newCount = db.prepare('SELECT COUNT(*) as c FROM companies').get();
    console.log(`[db] Seed complete — ${newCount.c} companies loaded`);
  } catch (err) {
    console.error('[db] Seed failed:', err.message);
    try { db.exec('ROLLBACK;'); } catch (_) {}
    // Fallback: try line by line
    console.log('[db] Retrying seed line-by-line...');
    let inserted = 0;
    for (const line of inserts.split('\n')) {
      try {
        if (line.trim()) { db.exec(line); inserted++; }
      } catch (e) {
        if (!e.message.includes('UNIQUE')) console.warn('[db] Seed line error:', e.message.slice(0, 80));
      }
    }
    console.log(`[db] Line-by-line seed: ${inserted} statements executed`);
  }
}

autoSeed();

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Touch a company's updated_at timestamp.
 * @param {string} id
 */
function touchCompany(id) {
  db.prepare(`UPDATE companies SET updated_at = datetime('now') WHERE id = ?`).run(id);
}

module.exports = { db, touchCompany };
