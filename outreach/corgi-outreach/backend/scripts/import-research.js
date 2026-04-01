#!/usr/bin/env node
/**
 * import-research.js — Load research_enrichment.json into the DB
 *
 * For each company in the JSON:
 *   1. Match by name (fuzzy-ish: case-insensitive, also tries domain match)
 *   2. Update company fields (gpu_scale, financing_status, priority, etc.)
 *   3. Upsert contacts (match by email; insert if new)
 *   4. Insert research notes
 *
 * Usage: node backend/scripts/import-research.js
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Resolve paths from repo root
const ROOT = path.resolve(__dirname, '../..');
const DATA_FILE = path.join(ROOT, 'data/research_enrichment.json');
const DB_PATH = path.join(ROOT, 'backend/src/db.js');

// Load DB module (uses the same singleton as the server)
const { db } = require(path.join(ROOT, 'backend/src/db.js'));

// ─────────────────────────────────────────────────────────────────────────────

function normalise(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Try to find an existing company row by name or website domain.
 */
function findCompany(research) {
  const normName = normalise(research.name);

  // Exact name match (case-insensitive)
  const byName = db.prepare('SELECT * FROM companies WHERE lower(name) = ?').get(research.name.toLowerCase());
  if (byName) return byName;

  // Normalised match
  const allCompanies = db.prepare('SELECT * FROM companies').all();
  const normMatch = allCompanies.find(c => normalise(c.name) === normName);
  if (normMatch) return normMatch;

  // Domain match via website
  if (research.domain) {
    const domainMatch = allCompanies.find(c => c.website && c.website.includes(research.domain));
    if (domainMatch) return domainMatch;
  }

  return null;
}

/**
 * Map research details to DB column updates.
 */
function buildCompanyUpdates(research) {
  const d = research.details || {};
  const updates = {};

  if (d.gpu_scale)           updates.estimated_gpu_scale = d.gpu_scale.slice(0, 200);
  if (d.financing_activity)  updates.financing_status = d.financing_activity.slice(0, 200);
  if (research.priority)     updates.priority = research.priority.toUpperCase();
  if (research.domain && !updates.website) {
    updates.website = `https://${research.domain}`;
  }

  return updates;
}

/**
 * Insert or update a contact for a company.
 */
function upsertContact(companyId, contact) {
  if (!contact.email) {
    // No email — check by name
    const existing = db
      .prepare('SELECT id FROM contacts WHERE company_id = ? AND lower(name) = ?')
      .get(companyId, (contact.name || '').toLowerCase());
    if (existing) return { action: 'skipped (no email, name match exists)', id: existing.id };
  } else {
    const existing = db
      .prepare('SELECT id FROM contacts WHERE email = ?')
      .get(contact.email.toLowerCase());
    if (existing) {
      // Update title if we have better info
      if (contact.title) {
        db.prepare('UPDATE contacts SET title = ? WHERE id = ?')
          .run(contact.title, existing.id);
      }
      return { action: 'updated', id: existing.id };
    }
  }

  // Insert new contact
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO contacts (id, company_id, name, title, email, linkedin_url, verified, source)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      companyId,
      contact.name || null,
      contact.title || null,
      contact.email ? contact.email.toLowerCase() : null,
      contact.linkedin || null,
      contact.source || 'research_enrichment'
    );
    return { action: 'inserted', id };
  } catch (err) {
    return { action: `error: ${err.message}`, id: null };
  }
}

/**
 * Insert a research note for a company.
 */
function insertResearchNote(companyId, research) {
  const d = research.details || {};

  const summaryParts = [
    research.qualification_notes,
    d.gpu_scale ? `GPU scale: ${d.gpu_scale}` : null,
    d.recent_funding ? `Funding: ${d.recent_funding}` : null,
    d.financing_activity ? `Financing: ${d.financing_activity}` : null,
    d.key_partnerships ? `Partners: ${d.key_partnerships}` : null,
    research.recent_news && research.recent_news.length
      ? `Recent news:\n${research.recent_news.map(n => `• ${n}`).join('\n')}`
      : null,
  ].filter(Boolean);

  const summary = summaryParts.join('\n\n');
  const sourceUrl = research.domain ? `https://${research.domain}` : null;

  const id = uuidv4();
  db.prepare(`
    INSERT INTO research_notes (id, company_id, source_url, summary, raw_data)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    companyId,
    sourceUrl,
    summary.slice(0, 2000),
    JSON.stringify(research)
  );
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n🐕 Corgi Research Importer\n');

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Data file not found: ${DATA_FILE}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const companies = raw.companies || [];

  console.log(`📄 Loaded ${companies.length} companies from research_enrichment.json`);
  console.log(`📊 Research date: ${raw.research_date || 'unknown'}\n`);

  const stats = { matched: 0, notFound: 0, contacts: { inserted: 0, updated: 0, skipped: 0 }, notes: 0 };
  const notFound = [];

  for (const research of companies) {
    console.log(`\n─── ${research.name} ───`);

    const company = findCompany(research);

    if (!company) {
      console.log(`  ⚠️  No DB match found — skipping`);
      stats.notFound++;
      notFound.push(research.name);
      continue;
    }

    console.log(`  ✅ Matched: ${company.name} (id: ${company.id})`);
    stats.matched++;

    // 1. Update company fields
    const updates = buildCompanyUpdates(research);
    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), company.id];
      db.prepare(`UPDATE companies SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`).run(...values);
      console.log(`  📝 Updated fields: ${Object.keys(updates).join(', ')}`);
    }

    // 2. Upsert contacts
    for (const contact of (research.contacts || [])) {
      const result = upsertContact(company.id, contact);
      console.log(`  👤 ${contact.name} (${contact.title}): ${result.action}`);
      if (result.action === 'inserted') stats.contacts.inserted++;
      else if (result.action === 'updated') stats.contacts.updated++;
      else stats.contacts.skipped++;
    }

    // 3. Insert research note
    const noteId = insertResearchNote(company.id, research);
    console.log(`  📌 Research note saved: ${noteId}`);
    stats.notes++;
  }

  console.log('\n══════════════════════════════════════');
  console.log('📊 Import Summary');
  console.log(`  Companies matched:    ${stats.matched}/${companies.length}`);
  console.log(`  Companies not found:  ${stats.notFound}`);
  console.log(`  Contacts inserted:    ${stats.contacts.inserted}`);
  console.log(`  Contacts updated:     ${stats.contacts.updated}`);
  console.log(`  Contacts skipped:     ${stats.contacts.skipped}`);
  console.log(`  Research notes added: ${stats.notes}`);
  if (notFound.length) {
    console.log(`\n  Not found in DB:`);
    notFound.forEach(n => console.log(`    - ${n}`));
  }
  console.log('══════════════════════════════════════\n');
}

main();
