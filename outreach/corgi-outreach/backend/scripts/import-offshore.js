'use strict';
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/db');

const DATA_FILE = path.resolve(__dirname, '../../data/offshore_reinsurers_2026-03-21.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

let inserted = 0, contactsInserted = 0, skipped = 0;

for (const company of data.companies) {
  const existing = db.prepare('SELECT id FROM companies WHERE name = ? OR name LIKE ?')
    .get(company.name, `%${company.name.split(' ')[0]}%${company.name.split(' ').slice(-1)[0]}%`);
  if (existing) { skipped++; console.log(`  SKIP: ${company.name}`); continue; }

  const companyId = uuidv4();
  db.prepare(`INSERT INTO companies (id, name, website, type, priority, qualification_score, description, headquarters, created_at) VALUES (?,?,?,?,?,?,?,?,datetime('now'))`).run(
    companyId, company.name, company.website || null, 'arranger',
    company.priority || 'B', company.qualification_score || 50,
    [company.description, company.corgi_fit_rationale, `Domicile: ${company.domicile}`, `Go-direct: ${company.go_direct_feasibility}`, `Specialty: ${company.specialty_lines}`].filter(Boolean).join(' | '),
    company.headquarters || null
  );
  inserted++;

  for (const contact of (company.key_contacts || [])) {
    if (!contact.name) continue;
    db.prepare(`INSERT INTO contacts (id, company_id, name, title, email, source, verified, created_at) VALUES (?,?,?,?,?,?,0,datetime('now'))`).run(
      uuidv4(), companyId, contact.name, contact.title || null,
      contact.email_guess || null, 'offshore-discovery'
    );
    contactsInserted++;
  }
}

console.log(`\n📊 Offshore Import: ${inserted} companies, ${contactsInserted} contacts (${skipped} skipped)`);
const tc = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
const cc = db.prepare('SELECT COUNT(*) as n FROM contacts').get().n;
const byPriority = db.prepare('SELECT priority, COUNT(*) as n FROM companies GROUP BY priority ORDER BY priority').all();
console.log(`Total: ${tc} companies, ${cc} contacts`);
console.log('By priority:', JSON.stringify(byPriority));
