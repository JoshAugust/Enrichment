'use strict';
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/db');

const DATA_FILE = path.resolve(__dirname, '../../data/discovery_v3_2026-03-21.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// Map extended types to DB enum
const typeMap = {
  operator: 'operator',
  lender: 'lender',
  arranger: 'arranger',
  reinsurer: 'arranger',
  broker: 'arranger',
  adjacent: 'operator',
};

let companiesInserted = 0, contactsInserted = 0, skipped = 0;

for (const company of data.companies) {
  const existing = db.prepare('SELECT id FROM companies WHERE name = ? OR name LIKE ?')
    .get(company.name, `%${company.name}%`);
  if (existing) { skipped++; continue; }

  const companyId = uuidv4();
  const mappedType = typeMap[company.type] || 'operator';

  db.prepare(`INSERT INTO companies (id, name, website, type, priority, qualification_score, description, financing_status, industry_segment, estimated_gpu_scale, headquarters, total_raised, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`).run(
    companyId, company.name, company.website || null, mappedType,
    company.priority || 'B', company.qualification_score || 50,
    company.description || null, company.financing_status || null,
    company.industry_segment || null, company.gpu_scale || null,
    company.headquarters || null, company.total_raised || null
  );
  companiesInserted++;

  for (const contact of (company.key_contacts || [])) {
    if (!contact.name) continue;
    db.prepare(`INSERT INTO contacts (id, company_id, name, title, email, linkedin_url, source, verified, created_at) VALUES (?,?,?,?,?,?,?,0,datetime('now'))`).run(
      uuidv4(), companyId, contact.name, contact.title || null,
      contact.email_guess || null, contact.linkedin || null, 'discovery-v3'
    );
    contactsInserted++;
  }
}

console.log('\n📊 Discovery v3 Import:');
console.log(`   Companies inserted: ${companiesInserted}`);
console.log(`   Contacts inserted: ${contactsInserted}`);
console.log(`   Skipped (duplicates): ${skipped}`);
const tc = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
const cc = db.prepare('SELECT COUNT(*) as n FROM contacts').get().n;
console.log(`\n   Total companies: ${tc}`);
console.log(`   Total contacts: ${cc}`);
