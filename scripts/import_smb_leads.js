/**
 * import_smb_leads.js — Import 100 SMB leads into corgi.db
 *
 * Maps all_leads.json fields to the companies + contacts tables.
 * Safe to re-run: skips duplicates by name+headquarters.
 */

'use strict';

const Database = require('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-outreach/backend/node_modules/better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-outreach/backend/node_modules/uuid');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, 'corgi-outreach/backend/data/corgi_outreach.db');
const LEADS_PATH = path.resolve(__dirname, 'all_leads.json');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const leads = JSON.parse(fs.readFileSync(LEADS_PATH, 'utf-8'));
console.log(`Loaded ${leads.length} leads from all_leads.json`);

// Check existing companies count (don't wipe them)
const existingCount = db.prepare('SELECT COUNT(*) as c FROM companies').get().c;
console.log(`Existing companies in DB: ${existingCount}`);

const LIST_TAG = 'smb_leads_2026_03_27';

// Prepare statements
const insertCompany = db.prepare(`
  INSERT INTO companies (
    id, name, type, website, headquarters, industry_segment,
    founded_year, employee_count, qualification_score,
    outreach_status, description, created_at, updated_at
  ) VALUES (
    ?, ?, 'operator', ?, ?, ?,
    ?, ?, 30,
    'uncontacted', ?, datetime('now'), datetime('now')
  )
`);

const insertContact = db.prepare(`
  INSERT INTO contacts (
    id, company_id, name, title, source, verified, created_at
  ) VALUES (
    ?, ?, ?, ?, 'manual', 0, datetime('now')
  )
`);

const checkCompany = db.prepare(`
  SELECT id FROM companies WHERE name = ? AND (headquarters = ? OR (headquarters IS NULL AND ? IS NULL))
`);

let imported = 0;
let skipped = 0;
let contactsInserted = 0;
const errors = [];

// Run everything in a transaction for performance
const runImport = db.transaction(() => {
  for (const lead of leads) {
    const name = (lead['Company Name'] || '').trim();
    const state = (lead['State'] || '').trim() || null;
    const industry = (lead['Industry'] || '').trim() || null;
    const website = lead['Fixed URL'] || null;
    const employees = lead['Employees'] ? String(lead['Employees']) : null;
    const revenue = lead['Revenue (USD 000s)'] ? lead['Revenue (USD 000s)'] : null;
    const contactName = lead['Contact Name'] ? lead['Contact Name'].trim() : null;
    const contactTitle = lead['Contact Title'] ? lead['Contact Title'].trim() : null;

    // Handle "Founded" — sometimes it's an Excel serial date number, sometimes a year string
    let foundedYear = null;
    if (lead['Founded']) {
      const raw = lead['Founded'];
      if (typeof raw === 'number' && raw > 1800 && raw < 2100) {
        foundedYear = Math.round(raw);
      } else if (typeof raw === 'number' && raw > 20000) {
        // Excel serial date: days since 1900-01-01
        const excelEpoch = new Date(1899, 11, 30);
        const d = new Date(excelEpoch.getTime() + raw * 86400000);
        foundedYear = d.getFullYear();
      } else if (typeof raw === 'string' && /^\d{4}$/.test(raw.trim())) {
        foundedYear = parseInt(raw.trim(), 10);
      }
    }

    // Build description with revenue info (no dedicated revenue column)
    const revStr = revenue ? `Revenue: $${Number(revenue).toLocaleString()}K. ` : '';
    const description = `${revStr}List: ${LIST_TAG}. Industry: ${industry || 'Unknown'}. State: ${state || 'Unknown'}.`;

    // Fall back to deriving name from website domain
    let resolvedName = name;
    if (!resolvedName && website) {
      try {
        const url = new URL(website);
        resolvedName = url.hostname.replace(/^www\./, '').split('.')[0].toUpperCase();
      } catch (_) {}
    }

    if (!resolvedName) {
      errors.push({ lead, error: 'Missing company name and no website to derive from' });
      continue;
    }

    const finalName = resolvedName;

    // Check for duplicate
    const existing = checkCompany.get(finalName, state, state);
    if (existing) {
      skipped++;
      continue;
    }

    try {
      const companyId = uuidv4();
      insertCompany.run(
        companyId, finalName, website, state, industry,
        foundedYear, employees,
        description
      );
      imported++;

      // Insert contact if present
      if (contactName) {
        const contactId = uuidv4();
        insertContact.run(contactId, companyId, contactName, contactTitle);
        contactsInserted++;
      }
    } catch (err) {
      errors.push({ lead: name, error: err.message });
    }
  }
});

runImport();

const newCount = db.prepare('SELECT COUNT(*) as c FROM companies').get().c;
console.log(`\n✅ Import complete:`);
console.log(`   Imported: ${imported} companies`);
console.log(`   Skipped (duplicates): ${skipped}`);
console.log(`   Contacts inserted: ${contactsInserted}`);
console.log(`   Errors: ${errors.length}`);
console.log(`   Total companies now in DB: ${newCount}`);

if (errors.length > 0) {
  console.log(`\n⚠️  Errors:`);
  errors.forEach(e => console.log(`   ${e.lead}: ${e.error}`));
}

// Write summary stats to a temp file for pipeline_run_summary.md
fs.writeFileSync('/tmp/import_stats.json', JSON.stringify({
  imported, skipped, contactsInserted, errors, newTotal: newCount, existingBefore: existingCount
}, null, 2));

db.close();
