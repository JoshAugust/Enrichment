#!/usr/bin/env node
/**
 * Import deep research data into the Corgi Outreach database.
 * Updates existing companies with new data and inserts new contacts.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/db');

const DATA_FILE = path.resolve(__dirname, '../../data/deep_research_2026-03-21.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

let companiesUpdated = 0;
let contactsInserted = 0;
let contactsSkipped = 0;

for (const company of data.companies) {
  // Find matching company in DB (fuzzy match on name)
  const namePatterns = [
    company.name,
    company.name.split('(')[0].trim(),
    company.name.split('/')[0].trim(),
  ];

  let dbCompany = null;
  for (const pattern of namePatterns) {
    dbCompany = db.prepare('SELECT * FROM companies WHERE name LIKE ?').get(`%${pattern}%`);
    if (dbCompany) break;
  }

  if (!dbCompany) {
    console.log(`⚠️  Company not found in DB: ${company.name}`);
    continue;
  }

  // Update qualification score if research found a better one
  if (company.corgi_fit_score && company.corgi_fit_score !== dbCompany.qualification_score) {
    db.prepare('UPDATE companies SET qualification_score = ? WHERE id = ?')
      .run(company.corgi_fit_score, dbCompany.id);
  }

  // Update fields that are currently empty
  const updates = {};
  if (company.infrastructure?.gpu_count && !dbCompany.estimated_gpu_scale)
    updates.estimated_gpu_scale = company.infrastructure.gpu_count;
  if (company.infrastructure?.data_centers && !dbCompany.headquarters) {
    const hq = Array.isArray(company.infrastructure.data_centers)
      ? company.infrastructure.data_centers[0] : company.infrastructure.data_centers;
    updates.headquarters = typeof hq === 'string' ? hq : JSON.stringify(hq);
  }
  if (company.funding?.total_raised && !dbCompany.total_raised)
    updates.total_raised = company.funding.total_raised;
  if (company.funding?.last_round && !dbCompany.last_funding_round)
    updates.last_funding_round = JSON.stringify(company.funding.last_round);
  if (company.funding?.last_round?.investors && !dbCompany.investors)
    updates.investors = JSON.stringify(company.funding.last_round.investors);
  if (company.recent_news?.length && !dbCompany.recent_news)
    updates.recent_news = JSON.stringify(company.recent_news.slice(0, 5));

  const setClauses = Object.keys(updates).map(k => `${k} = ?`);
  if (setClauses.length > 0) {
    setClauses.push('last_enriched_at = datetime(\'now\')');
    db.prepare(`UPDATE companies SET ${setClauses.join(', ')} WHERE id = ?`)
      .run(...Object.values(updates), dbCompany.id);
    companiesUpdated++;
  }

  // Insert new contacts
  const allContacts = [
    ...(company.leadership || []),
    ...(company.new_contacts_discovered || []),
  ];

  for (const contact of allContacts) {
    if (!contact.name) continue;

    // Check if contact already exists
    const existing = db.prepare(
      'SELECT id FROM contacts WHERE company_id = ? AND name LIKE ?'
    ).get(dbCompany.id, `%${contact.name.split(' ').pop()}%`);

    if (existing) {
      contactsSkipped++;
      continue;
    }

    db.prepare(`
      INSERT INTO contacts (id, company_id, name, title, email, linkedin_url, source, verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'deep-research-2026-03-21', 0, datetime('now'))
    `).run(
      uuidv4(),
      dbCompany.id,
      contact.name,
      contact.title || null,
      contact.email_guess || contact.email || null,
      contact.linkedin || contact.linkedin_url || null,
    );
    contactsInserted++;
  }
}

console.log('\n📊 Deep Research Import Results:');
console.log(`   Companies updated: ${companiesUpdated}`);
console.log(`   Contacts inserted: ${contactsInserted}`);
console.log(`   Contacts skipped (already exist): ${contactsSkipped}`);

// Final counts
const totalCompanies = db.prepare('SELECT COUNT(*) as n FROM companies').get().n;
const totalContacts = db.prepare('SELECT COUNT(*) as n FROM contacts').get().n;
console.log(`\n   Total companies: ${totalCompanies}`);
console.log(`   Total contacts: ${totalContacts}`);
