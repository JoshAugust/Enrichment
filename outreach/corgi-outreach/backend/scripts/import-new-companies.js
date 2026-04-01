'use strict';
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/db');

const DATA_FILE = path.resolve(__dirname, '../../data/new_companies_discovery.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

let companiesInserted = 0, contactsInserted = 0, skipped = 0;

for (const company of data.companies) {
  // Skip if already exists
  const existing = db.prepare('SELECT id FROM companies WHERE name = ?').get(company.name);
  if (existing) { skipped++; continue; }

  const companyId = uuidv4();
  db.prepare(`INSERT INTO companies (id, name, website, type, priority, qualification_score, description, financing_status, industry_segment, estimated_gpu_scale, headquarters, total_raised, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`).run(
    companyId, company.name, company.website, company.type, company.priority,
    company.qualification_score || 50, company.description, company.financing_status,
    company.industry_segment, company.gpu_scale, company.headquarters, company.total_raised
  );
  companiesInserted++;

  for (const contact of (company.key_contacts || [])) {
    if (!contact.name) continue;
    db.prepare(`INSERT INTO contacts (id, company_id, name, title, email, linkedin_url, source, verified, created_at) VALUES (?,?,?,?,?,?,?,0,datetime('now'))`).run(
      uuidv4(), companyId, contact.name, contact.title || null,
      contact.email_guess || null, contact.linkedin || null, 'company-discovery'
    );
    contactsInserted++;
  }
}

console.log('\n📊 Company Discovery Import:');
console.log(`   Companies inserted: ${companiesInserted}`);
console.log(`   Contacts inserted: ${contactsInserted}`);
console.log(`   Skipped (duplicates): ${skipped}`);
const tc = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
const cc = db.prepare('SELECT COUNT(*) as n FROM contacts').get().n;
console.log(`\n   Total companies: ${tc}`);
console.log(`   Total contacts: ${cc}`);
