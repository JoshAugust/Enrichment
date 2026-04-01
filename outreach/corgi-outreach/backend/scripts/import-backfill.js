'use strict';
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/db');

const DATA_FILE = path.resolve(__dirname, '../../data/discovery_backfill_2026-03-21.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

const typeMap = {
  operator: 'operator', lender: 'lender', arranger: 'arranger',
  reinsurer: 'arranger', broker: 'arranger', adjacent: 'operator',
};

let companiesInserted = 0, contactsInserted = 0, skipped = 0;

for (const company of data.companies) {
  const existing = db.prepare('SELECT id FROM companies WHERE name = ?').get(company.name);
  if (existing) { skipped++; continue; }

  const companyId = uuidv4();
  db.prepare(`INSERT INTO companies (id, name, website, type, priority, qualification_score, description, financing_status, industry_segment, estimated_gpu_scale, headquarters, total_raised, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`).run(
    companyId, company.name, company.website || null,
    typeMap[company.type] || 'operator', company.priority || 'B',
    company.qualification_score || 50, company.description || null,
    company.financing_status || null, company.industry_segment || null,
    company.gpu_scale || null, company.headquarters || null,
    company.total_raised || null
  );
  companiesInserted++;

  for (const contact of (company.key_contacts || [])) {
    if (!contact.name) continue;
    db.prepare(`INSERT INTO contacts (id, company_id, name, title, email, linkedin_url, source, verified, created_at) VALUES (?,?,?,?,?,?,?,0,datetime('now'))`).run(
      uuidv4(), companyId, contact.name, contact.title || null,
      contact.email_guess || null, contact.linkedin || null, 'discovery-backfill'
    );
    contactsInserted++;
  }
}

console.log('\n📊 Backfill Import:');
console.log(`   Companies inserted: ${companiesInserted}`);
console.log(`   Contacts inserted: ${contactsInserted}`);
console.log(`   Skipped (duplicates): ${skipped}`);
const tc = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
const cc = db.prepare('SELECT COUNT(*) as n FROM contacts').get().n;
const byType = db.prepare('SELECT type, COUNT(*) as n FROM companies GROUP BY type').all();
console.log(`\n   Total companies: ${tc}`);
console.log(`   Total contacts: ${cc}`);
console.log(`   By type: ${JSON.stringify(byType)}`);
