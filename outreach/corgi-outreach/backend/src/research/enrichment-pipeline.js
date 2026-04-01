/**
 * enrichment-pipeline.js — Multi-source enrichment pipeline orchestrator
 *
 * Accepts a company ID or contact ID, runs all enrichment sources in parallel
 * (subject to rate limits), merges results intelligently, and persists back to DB.
 *
 * Merge strategy:
 *   - Verified data always wins over unverified
 *   - Existing non-null DB values are preserved unless a source returns something better
 *   - enrichment_log records every result for audit trail
 *
 * Usage:
 *   const pipeline = require('./enrichment-pipeline');
 *   await pipeline.enrichCompany(companyId);
 *   await pipeline.enrichContact(contactId);
 *   await pipeline.enrichAll();
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// ── Source modules ────────────────────────────────────────────────────────────

const sources = {
  'web-search':         require('./sources/web-search'),
  'company-website':    require('./sources/company-website'),
  'linkedin-enrichment': require('./sources/linkedin-enrichment'),
  'funding-research':   require('./sources/funding-research'),
  'social-signals':     require('./sources/social-signals'),
  'email-discovery':    require('./sources/email-discovery'),
  'news-monitor':       require('./sources/news-monitor'),
  'sec-edgar':          require('./sources/sec-edgar'),
  'job-postings':       require('./sources/job-postings'),
  'nvidia-partners':    require('./sources/nvidia-partners'),
  'hunter':             require('./sources/hunter'),
  'apollo':             require('./sources/apollo'),
  'rocketreach':        require('./sources/rocketreach'),
};

// ── DB migrations (idempotent) ────────────────────────────────────────────────

/**
 * Run all enrichment-related DB migrations.
 * All ALTER TABLE statements are wrapped in try/catch to handle
 * "duplicate column name" errors gracefully.
 */
function runMigrations() {
  // enrichment_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrichment_log (
      id          TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      source      TEXT NOT NULL,
      data_found  TEXT,
      created_at  DATETIME DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_enrichment_log_entity
      ON enrichment_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_enrichment_log_source
      ON enrichment_log(source);
    CREATE INDEX IF NOT EXISTS idx_enrichment_log_created
      ON enrichment_log(created_at);
  `);

  // Company enrichment columns
  const companyColumns = [
    ['founded_year',        'INTEGER'],
    ['employee_count',      'TEXT'],
    ['total_raised',        'TEXT'],
    ['last_funding_round',  'TEXT'],
    ['investors',           'TEXT'],
    ['headquarters',        'TEXT'],
    ['linkedin_url',        'TEXT'],
    ['twitter_url',         'TEXT'],
    ['github_url',          'TEXT'],
    ['recent_news',         'TEXT'],
    ['hiring_signals',      'TEXT'],
    ['last_enriched_at',    'DATETIME'],
    ['sec_ticker',          'TEXT'],
    ['sec_cik',             'TEXT'],
    ['gpu_asset_value',     'TEXT'],
    ['depreciation_schedule', 'TEXT'],
    ['open_roles_count',    'INTEGER'],
    ['key_hires',           'TEXT'],
    ['nvidia_partnership',  'TEXT'],
    ['phone',               'TEXT'],
    ['call_notes',          'TEXT DEFAULT ""'],
  ];

  for (const [col, type] of companyColumns) {
    try {
      db.exec(`ALTER TABLE companies ADD COLUMN ${col} ${type}`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.warn(`[enrichment-pipeline] Migration warning (companies.${col}):`, err.message);
      }
    }
  }

  // Contact enrichment columns
  const contactColumns = [
    ['twitter_url',       'TEXT'],
    ['github_url',        'TEXT'],
    ['bio',               'TEXT'],
    ['tenure',            'TEXT'],
    ['email_pattern',     'TEXT'],
    ['email_confidence',  'REAL DEFAULT 0'],
    ['last_enriched_at',  'DATETIME'],
  ];

  for (const [col, type] of contactColumns) {
    try {
      db.exec(`ALTER TABLE contacts ADD COLUMN ${col} ${type}`);
    } catch (err) {
      if (!err.message.includes('duplicate column name')) {
        console.warn(`[enrichment-pipeline] Migration warning (contacts.${col}):`, err.message);
      }
    }
  }

  console.log('[enrichment-pipeline] DB migrations complete');
}

// Run migrations when module is loaded
runMigrations();

// ── Enrichment log ────────────────────────────────────────────────────────────

/**
 * Persist an enrichment result to the audit log.
 */
function logEnrichment(entityType, entityId, source, dataFound) {
  const stmt = db.prepare(`
    INSERT INTO enrichment_log (id, entity_type, entity_id, source, data_found, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(uuidv4(), entityType, entityId, source, JSON.stringify(dataFound));
}

// ── Company field updater ─────────────────────────────────────────────────────

/**
 * Merge enrichment results into the companies table.
 * Only updates fields that are currently null/empty (won't overwrite good data).
 *
 * @param {string} companyId
 * @param {object} updates  - Map of column → new value
 */
function updateCompanyFields(companyId, updates) {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!company) return;

  const UPDATABLE = [
    'founded_year', 'employee_count', 'total_raised', 'last_funding_round',
    'investors', 'headquarters', 'linkedin_url', 'twitter_url', 'github_url',
    'recent_news', 'hiring_signals', 'description', 'type',
    'industry_segment', 'estimated_gpu_scale', 'financing_status',
    'sec_ticker', 'sec_cik', 'gpu_asset_value', 'depreciation_schedule',
    'open_roles_count', 'key_hires', 'nvidia_partnership', 'phone',
  ];

  const setClauses = [];
  const values = [];

  for (const field of UPDATABLE) {
    if (updates[field] === undefined || updates[field] === null) continue;
    // Serialize arrays to JSON strings; skip empty arrays
    let val = updates[field];
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      val = JSON.stringify(val);
    }
    // Don't overwrite existing non-null values (preserve manual data)
    if (company[field] !== null && company[field] !== undefined && company[field] !== '') continue;
    setClauses.push(`${field} = ?`);
    values.push(val);
  }

  // Always update last_enriched_at
  setClauses.push(`last_enriched_at = datetime('now')`);
  values.push(companyId);

  if (setClauses.length > 1) { // >1 because last_enriched_at always added
    db.prepare(`
      UPDATE companies SET ${setClauses.join(', ')} WHERE id = ?
    `).run(...values);
  } else {
    // Just update the timestamp
    db.prepare(`UPDATE companies SET last_enriched_at = datetime('now') WHERE id = ?`).run(companyId);
  }
}

/**
 * Merge enrichment results into the contacts table.
 */
function updateContactFields(contactId, updates) {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
  if (!contact) return;

  const UPDATABLE = [
    'email', 'phone', 'linkedin_url', 'twitter_url', 'github_url',
    'bio', 'tenure', 'email_pattern', 'email_confidence', 'title',
  ];

  const setClauses = [];
  const values = [];

  for (const field of UPDATABLE) {
    if (updates[field] === undefined || updates[field] === null) continue;
    // Serialize arrays to JSON strings; skip empty arrays
    let val = updates[field];
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      val = JSON.stringify(val);
    }
    if (contact[field] !== null && contact[field] !== undefined && contact[field] !== '') continue;
    setClauses.push(`${field} = ?`);
    values.push(val);
  }

  setClauses.push(`last_enriched_at = datetime('now')`);
  values.push(contactId);

  if (setClauses.length > 1) {
    db.prepare(`
      UPDATE contacts SET ${setClauses.join(', ')} WHERE id = ?
    `).run(...values);
  } else {
    db.prepare(`UPDATE contacts SET last_enriched_at = datetime('now') WHERE id = ?`).run(contactId);
  }
}

// ── Also store generated emails for contacts ──────────────────────────────────

/**
 * Upsert contacts discovered by Hunter.io domain-search.
 * If a contact with the same email already exists for this company, skip.
 * Otherwise, insert a new contact record with the discovered data.
 *
 * @param {string} companyId
 * @param {Array}  hunterContacts - Array of contact objects from hunter.js
 */
function applyHunterContacts(companyId, hunterContacts) {
  if (!hunterContacts || !hunterContacts.length) return;

  const { v4: uuidv4 } = require('uuid');

  let inserted = 0;
  let skipped = 0;

  for (const hc of hunterContacts) {
    if (!hc.email || !hc.name) {
      skipped++;
      continue;
    }

    // Check if a contact with this email already exists for this company
    const existing = db.prepare(
      'SELECT id FROM contacts WHERE company_id = ? AND email = ?'
    ).get(companyId, hc.email);

    if (existing) {
      // Update email_confidence if we have a better value
      if (hc.confidence) {
        const normalizedConf = hc.confidence / 100; // Hunter 0–100 → 0–1
        db.prepare(
          'UPDATE contacts SET email_confidence = MAX(COALESCE(email_confidence, 0), ?) WHERE id = ?'
        ).run(normalizedConf, existing.id);
      }
      skipped++;
      continue;
    }

    // Also check by name to avoid duplicates
    const existingByName = db.prepare(
      'SELECT id, email FROM contacts WHERE company_id = ? AND name = ? COLLATE NOCASE'
    ).get(companyId, hc.name);

    if (existingByName) {
      // Update their email if they don't have one
      if (!existingByName.email) {
        db.prepare(
          'UPDATE contacts SET email = ?, email_confidence = ?, last_enriched_at = datetime(\'now\') WHERE id = ?'
        ).run(hc.email, hc.confidence ? hc.confidence / 100 : 0.7, existingByName.id);
      }
      skipped++;
      continue;
    }

    // Insert a new contact
    try {
      db.prepare(`
        INSERT INTO contacts (
          id, company_id, name, title, email, email_confidence,
          linkedin_url, twitter_url, phone, last_enriched_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        uuidv4(),
        companyId,
        hc.name,
        hc.title   || null,
        hc.email,
        hc.confidence ? hc.confidence / 100 : 0.7,
        hc.linkedin_url || null,
        hc.twitter_url  || null,
        hc.phone        || null,
      );
      inserted++;
    } catch (err) {
      // Swallow insert errors (e.g. constraint violations) — log only
      console.warn(`[enrichment-pipeline] Hunter contact insert failed (${hc.email}):`, err.message);
      skipped++;
    }
  }

  if (inserted > 0 || skipped > 0) {
    console.log(
      `[enrichment-pipeline] 🎯 Hunter contacts: ${inserted} inserted, ${skipped} skipped for company ${companyId}`
    );
  }
}

/**
 * Upsert contacts discovered by Apollo.io People Search.
 *
 * Apollo's free People Search returns names, titles, and LinkedIn URLs
 * but NOT emails (those require credit-consuming enrichment calls).
 * This function inserts contacts that don't yet exist in the DB,
 * and updates title/linkedin_url on existing contacts if empty.
 *
 * @param {string} companyId
 * @param {Array}  apolloContacts - Array of contact objects from apollo.js
 */
function applyApolloContacts(companyId, apolloContacts) {
  if (!apolloContacts || !apolloContacts.length) return;

  const { v4: uuidv4 } = require('uuid');

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const ac of apolloContacts) {
    if (!ac.name) {
      skipped++;
      continue;
    }

    // 1. If contact has an email, check for email duplicate
    if (ac.email) {
      const existingByEmail = db.prepare(
        'SELECT id FROM contacts WHERE company_id = ? AND email = ?'
      ).get(companyId, ac.email);

      if (existingByEmail) {
        skipped++;
        continue;
      }
    }

    // 2. Check by name (case-insensitive)
    const existingByName = db.prepare(
      'SELECT id, email, title, linkedin_url FROM contacts WHERE company_id = ? AND name = ? COLLATE NOCASE'
    ).get(companyId, ac.name);

    if (existingByName) {
      // Update fields that are currently empty
      const updates = [];
      const vals = [];
      if (!existingByName.email && ac.email) { updates.push('email = ?'); vals.push(ac.email); }
      if (!existingByName.title && ac.title) { updates.push('title = ?'); vals.push(ac.title); }
      if (!existingByName.linkedin_url && ac.linkedin_url) { updates.push('linkedin_url = ?'); vals.push(ac.linkedin_url); }
      if (ac.phone) { updates.push('phone = COALESCE(phone, ?)'); vals.push(ac.phone); }

      if (updates.length > 0) {
        updates.push('last_enriched_at = datetime(\'now\')');
        vals.push(existingByName.id);
        db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    // 3. Insert new contact (may have no email — that's fine, we have name/title/linkedin)
    try {
      db.prepare(`
        INSERT INTO contacts (
          id, company_id, name, title, email, email_confidence,
          linkedin_url, phone, last_enriched_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        uuidv4(),
        companyId,
        ac.name,
        ac.title        || null,
        ac.email        || null,
        ac.email ? 0.8  : 0,    // email confidence: 0.8 if Apollo returned one
        ac.linkedin_url || null,
        ac.phone        || null,
      );
      inserted++;
    } catch (err) {
      console.warn(`[enrichment-pipeline] Apollo contact insert failed (${ac.name}):`, err.message);
      skipped++;
    }
  }

  if (inserted > 0 || updated > 0) {
    console.log(
      `[enrichment-pipeline] 🎯 Apollo contacts: ${inserted} inserted, ${updated} updated, ${skipped} skipped for company ${companyId}`
    );
  }
}

function applyEmailDiscoveryToContacts(companyId, emailDiscoveryData) {
  if (!emailDiscoveryData?.generatedEmails) return;

  for (const gen of emailDiscoveryData.generatedEmails) {
    if (!gen.contactId || (!gen.email && !gen.candidates)) continue;

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(gen.contactId);
    if (!contact || contact.email) continue; // skip if already has email

    const updates = {};
    if (gen.email) {
      updates.email = gen.email;
      updates.email_confidence = gen.confidence || 0.3;
      updates.email_pattern = gen.patternId || null;
    }
    updateContactFields(gen.contactId, updates);
  }
}

// ── Phone normalization & propagation ──────────────────────────────────────────

/**
 * Normalize a phone string to E.164-ish format.
 * Returns null if it doesn't look like a real number.
 */
function normalizePhone(raw) {
  if (!raw) return null;
  // Strip everything except digits and leading +
  let digits = raw.replace(/[^\d+]/g, '');
  // If it starts with +, keep it; otherwise prepend +1 if 10 digits (US)
  if (!digits.startsWith('+')) {
    if (digits.length === 10) digits = '+1' + digits;
    else if (digits.length === 11 && digits.startsWith('1')) digits = '+' + digits;
    else digits = '+' + digits;
  }
  // Reject clearly garbage numbers (too short / too long)
  const justDigits = digits.replace(/\D/g, '');
  if (justDigits.length < 10 || justDigits.length > 15) return null;
  return digits;
}

/**
 * Apply scraped phone numbers to contacts of a company that lack phones.
 * Uses the first available phone for all phoneless contacts.
 */
function applyPhonesToContacts(companyId, phones) {
  if (!phones || !phones.length) return;

  const normalized = phones.map(normalizePhone).filter(Boolean);
  if (!normalized.length) return;

  const phone = normalized[0];
  const phonelessContacts = db.prepare(
    `SELECT id FROM contacts WHERE company_id = ? AND (phone IS NULL OR phone = ?)`
  ).all(companyId, '');

  if (!phonelessContacts.length) return;

  const stmt = db.prepare('UPDATE contacts SET phone = ? WHERE id = ?');
  for (const { id } of phonelessContacts) {
    stmt.run(phone, id);
  }

  console.log(`[enrichment-pipeline] 📞 Applied phone ${phone} to ${phonelessContacts.length} contacts for company ${companyId}`);
}

// ── Pipeline executors ────────────────────────────────────────────────────────

/**
 * Enrich a single company by running all sources.
 *
 * @param {string} companyId
 * @param {object} [opts]
 * @param {string[]} [opts.sourcesToRun]  - Subset of source names to run (defaults to all)
 * @returns {Promise<{ companyId, results, updatedFields }>}
 */
async function enrichCompany(companyId, opts = {}) {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!company) throw new Error(`Company not found: ${companyId}`);

  // Attach existing contacts for email pattern detection
  const contacts = db.prepare('SELECT id, name, email, title FROM contacts WHERE company_id = ?').all(companyId);
  const existingData = { ...company, contacts };

  const sourcesToRun = opts.sourcesToRun || Object.keys(sources);

  console.log(`\n[enrichment-pipeline] 🚀 Enriching company: ${company.name} (${companyId})`);
  console.log(`[enrichment-pipeline] Running sources: ${sourcesToRun.join(', ')}`);

  // Run sources in parallel (rate limiter inside each source handles concurrency)
  const sourcePromises = sourcesToRun.map(async (sourceName) => {
    const source = sources[sourceName];
    if (!source) return { sourceName, error: 'Source not found' };

    try {
      const result = await source.enrich('company', companyId, existingData);
      return { sourceName, result };
    } catch (err) {
      console.error(`[enrichment-pipeline] Source ${sourceName} threw:`, err.message);
      return { sourceName, result: { success: false, error: err.message, data: {} } };
    }
  });

  const settled = await Promise.all(sourcePromises);

  // Merge all results
  const allUpdates = {};
  const resultSummary = [];

  for (const { sourceName, result } of settled) {
    if (!result) continue;

    // Log to audit trail
    logEnrichment('company', companyId, sourceName, result);

    // Collect DB-updateable fields from result.data
    if (result.data && !result.skipped) {
      const DB_FIELDS = [
        'founded_year', 'employee_count', 'total_raised', 'last_funding_round',
        'investors', 'headquarters', 'linkedin_url', 'twitter_url', 'github_url',
        'recent_news', 'hiring_signals', 'description', 'type',
        'industry_segment', 'estimated_gpu_scale', 'financing_status', 'email_pattern',
        'sec_ticker', 'sec_cik', 'gpu_asset_value', 'depreciation_schedule',
        'open_roles_count', 'key_hires', 'nvidia_partnership',
      ];

      for (const field of DB_FIELDS) {
        if (result.data[field] && !allUpdates[field]) {
          allUpdates[field] = result.data[field];
        }
      }

      // Handle email discovery's generated emails
      if (sourceName === 'email-discovery') {
        applyEmailDiscoveryToContacts(companyId, result.data);
      }

      // Handle Hunter.io discovered contacts (new contacts found via domain search)
      if (sourceName === 'hunter' && result.contacts && result.contacts.length > 0) {
        applyHunterContacts(companyId, result.contacts);
      }

      // Handle Apollo.io discovered contacts (decision-makers found via People Search)
      if (sourceName === 'apollo' && result.contacts && result.contacts.length > 0) {
        applyApolloContacts(companyId, result.contacts);
      }

      // Handle phones array from sources (e.g. company-website)
      // Store first phone on company, and propagate to phoneless contacts
      if (result.data.phones && Array.isArray(result.data.phones) && result.data.phones.length > 0) {
        const firstPhone = normalizePhone(result.data.phones[0]);
        if (firstPhone && !allUpdates.phone) {
          allUpdates.phone = firstPhone;
        }
        // Apply phone to contacts that don't have one
        applyPhonesToContacts(companyId, result.data.phones);
      }
    }

    resultSummary.push({
      source: sourceName,
      success: result.success,
      skipped: result.skipped || false,
      error: result.error || null,
      fieldsFound: result.data ? Object.keys(result.data).filter(k => result.data[k] !== null).length : 0,
    });
  }

  // Persist merged updates to companies table
  updateCompanyFields(companyId, allUpdates);

  console.log(`[enrichment-pipeline] ✅ Company ${company.name} enriched. Fields updated: ${Object.keys(allUpdates).join(', ') || 'none'}`);

  return {
    companyId,
    companyName: company.name,
    results: resultSummary,
    updatedFields: allUpdates,
  };
}

/**
 * Enrich a single contact by running relevant sources.
 *
 * @param {string} contactId
 * @param {object} [opts]
 * @returns {Promise<{ contactId, results, updatedFields }>}
 */
async function enrichContact(contactId, opts = {}) {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
  if (!contact) throw new Error(`Contact not found: ${contactId}`);

  // Get associated company for context
  const company = db.prepare('SELECT name, website FROM companies WHERE id = ?').get(contact.company_id);
  const existingData = {
    ...contact,
    company_name: company?.name,
    company_website: company?.website,
  };

  // Sources relevant to contacts
  const CONTACT_SOURCES = ['web-search', 'linkedin-enrichment', 'social-signals', 'email-discovery', 'news-monitor'];
  const sourcesToRun = (opts.sourcesToRun || CONTACT_SOURCES).filter(s => sources[s]);

  console.log(`\n[enrichment-pipeline] 🚀 Enriching contact: ${contact.name} (${contactId})`);
  console.log(`[enrichment-pipeline] Running sources: ${sourcesToRun.join(', ')}`);

  const sourcePromises = sourcesToRun.map(async (sourceName) => {
    const source = sources[sourceName];
    try {
      const result = await source.enrich('contact', contactId, existingData);
      return { sourceName, result };
    } catch (err) {
      console.error(`[enrichment-pipeline] Source ${sourceName} threw:`, err.message);
      return { sourceName, result: { success: false, error: err.message, data: {} } };
    }
  });

  const settled = await Promise.all(sourcePromises);

  const allUpdates = {};
  const resultSummary = [];

  for (const { sourceName, result } of settled) {
    if (!result) continue;

    logEnrichment('contact', contactId, sourceName, result);

    if (result.data && !result.skipped) {
      const CONTACT_DB_FIELDS = [
        'email', 'phone', 'linkedin_url', 'twitter_url', 'github_url',
        'bio', 'tenure', 'email_pattern', 'email_confidence', 'title',
      ];
      for (const field of CONTACT_DB_FIELDS) {
        if (result.data[field] !== undefined && result.data[field] !== null && !allUpdates[field]) {
          allUpdates[field] = result.data[field];
        }
      }
    }

    resultSummary.push({
      source: sourceName,
      success: result.success,
      skipped: result.skipped || false,
      error: result.error || null,
      fieldsFound: result.data ? Object.keys(result.data).filter(k => result.data[k] !== null).length : 0,
    });
  }

  updateContactFields(contactId, allUpdates);

  console.log(`[enrichment-pipeline] ✅ Contact ${contact.name} enriched. Fields updated: ${Object.keys(allUpdates).join(', ') || 'none'}`);

  return {
    contactId,
    contactName: contact.name,
    results: resultSummary,
    updatedFields: allUpdates,
  };
}

/**
 * Batch enrich all companies (and optionally contacts).
 *
 * @param {object} [opts]
 * @param {boolean} [opts.includeContacts=false] - Also enrich all contacts
 * @param {number}  [opts.limit]                 - Max entities to process
 * @param {string}  [opts.priority]              - Filter by priority (A/B/C)
 * @returns {Promise<batchResult>}
 */
async function enrichAll(opts = {}) {
  const { includeContacts = false, limit, priority } = opts;

  let query = 'SELECT id, name FROM companies';
  const params = [];
  if (priority) {
    query += ' WHERE priority = ?';
    params.push(priority);
  }
  query += ' ORDER BY priority ASC, last_enriched_at ASC NULLS FIRST';
  if (limit) query += ` LIMIT ${parseInt(limit, 10)}`;

  const companies = db.prepare(query).all(...params);

  console.log(`\n[enrichment-pipeline] 🐕 Batch enriching ${companies.length} companies...`);

  const companyResults = [];
  for (const { id, name } of companies) {
    try {
      const r = await enrichCompany(id);
      companyResults.push({ id, name, status: 'success', fieldsUpdated: Object.keys(r.updatedFields).length });
    } catch (err) {
      console.error(`[enrichment-pipeline] Failed to enrich company ${name}:`, err.message);
      companyResults.push({ id, name, status: 'error', error: err.message });
    }
    // Pause between companies to be polite
    await new Promise(r => setTimeout(r, 2000));
  }

  let contactResults = [];
  if (includeContacts) {
    const contacts = db.prepare(
      `SELECT id, name FROM contacts ORDER BY last_enriched_at ASC NULLS FIRST${limit ? ` LIMIT ${parseInt(limit, 10)}` : ''}`
    ).all();

    console.log(`[enrichment-pipeline] 🐕 Batch enriching ${contacts.length} contacts...`);

    for (const { id, name } of contacts) {
      try {
        const r = await enrichContact(id);
        contactResults.push({ id, name, status: 'success', fieldsUpdated: Object.keys(r.updatedFields).length });
      } catch (err) {
        contactResults.push({ id, name, status: 'error', error: err.message });
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const summary = {
    companiesProcessed: companyResults.length,
    companiesSucceeded: companyResults.filter(r => r.status === 'success').length,
    companiesFailed: companyResults.filter(r => r.status === 'error').length,
    contactsProcessed: contactResults.length,
    contactsSucceeded: contactResults.filter(r => r.status === 'success').length,
    contactsFailed: contactResults.filter(r => r.status === 'error').length,
    completedAt: new Date().toISOString(),
  };

  console.log(`\n[enrichment-pipeline] 🏁 Batch complete:`, summary);

  return { summary, companyResults, contactResults };
}

/**
 * Fetch the latest news for a specific company.
 * Convenience wrapper for the news-monitor source.
 *
 * @param {string} companyId
 * @param {object} [opts] - Passed to news-monitor (e.g. { days: 30 })
 */
async function fetchCompanyNews(companyId, opts = {}) {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!company) throw new Error(`Company not found: ${companyId}`);

  console.log(`[enrichment-pipeline] 📰 Fetching news for: ${company.name}`);

  const newsMonitor = sources['news-monitor'];
  const result = await newsMonitor.enrich('company', companyId, company, opts);

  logEnrichment('company', companyId, 'news-monitor', result);

  if (result.success && result.data.recent_news) {
    updateCompanyFields(companyId, { recent_news: result.data.recent_news });
  }

  return result;
}

/**
 * Get enrichment pipeline health status.
 */
function getPipelineStatus() {
  const availableSources = Object.keys(sources);

  // Count enrichment logs by source
  const logStats = db.prepare(`
    SELECT source, COUNT(*) as count, MAX(created_at) as last_run
    FROM enrichment_log
    GROUP BY source
  `).all();

  const logBySource = {};
  for (const row of logStats) {
    logBySource[row.source] = { count: row.count, lastRun: row.last_run };
  }

  const totalLogs = db.prepare('SELECT COUNT(*) as n FROM enrichment_log').get().n;
  const companiesEnriched = db.prepare("SELECT COUNT(*) as n FROM companies WHERE last_enriched_at IS NOT NULL").get().n;
  const contactsEnriched = db.prepare("SELECT COUNT(*) as n FROM contacts WHERE last_enriched_at IS NOT NULL").get().n;

  return {
    status: 'operational',
    availableSources,
    sourceStats: logBySource,
    totalEnrichmentRuns: totalLogs,
    companiesEnriched,
    contactsEnriched,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  enrichCompany,
  enrichContact,
  enrichAll,
  fetchCompanyNews,
  getPipelineStatus,
  runMigrations,
};
