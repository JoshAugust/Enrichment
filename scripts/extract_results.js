/**
 * extract_results.js — Extract enriched data for all SMB leads from the DB
 * Outputs pipeline_enriched_results.json
 */

'use strict';

const Database = require('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-outreach/backend/node_modules/better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, 'corgi-outreach/backend/data/corgi_outreach.db');
const OUTPUT_PATH = path.resolve(__dirname, 'pipeline_enriched_results.json');

const db = new Database(DB_PATH, { readonly: true });

// Get all SMB companies with their enriched data
const companies = db.prepare(`
  SELECT 
    id, name, website, headquarters, industry_segment,
    founded_year, employee_count, description,
    linkedin_url, twitter_url, github_url,
    recent_news, hiring_signals, last_enriched_at,
    sec_ticker, sec_cik, open_roles_count, key_hires,
    qualification_score, outreach_status,
    created_at, updated_at
  FROM companies 
  WHERE description LIKE '%smb_leads_2026_03_27%'
  ORDER BY name ASC
`).all();

console.log(`Found ${companies.length} SMB companies`);

// For each company, get contacts and enrichment log
const output = companies.map(company => {
  // Get contacts
  const contacts = db.prepare(`
    SELECT id, name, title, email, phone, linkedin_url, twitter_url, 
           bio, email_confidence, source, verified, last_enriched_at
    FROM contacts WHERE company_id = ?
  `).all(company.id);

  // Get enrichment log (last entry per source)
  const enrichLog = db.prepare(`
    SELECT source, data_found, created_at
    FROM enrichment_log
    WHERE entity_id = ?
    ORDER BY created_at DESC
  `).all(company.id);

  // Parse JSON fields
  let recentNews = null;
  try { recentNews = company.recent_news ? JSON.parse(company.recent_news) : null; } catch (_) { recentNews = company.recent_news; }

  let hiringSignals = null;
  try { hiringSignals = company.hiring_signals ? JSON.parse(company.hiring_signals) : null; } catch (_) { hiringSignals = company.hiring_signals; }

  let keyHires = null;
  try { keyHires = company.key_hires ? JSON.parse(company.key_hires) : null; } catch (_) { keyHires = company.key_hires; }

  // Parse enrichment log data
  const enrichmentSummary = {};
  for (const log of enrichLog) {
    if (!enrichmentSummary[log.source]) {
      let dataFound = null;
      try { dataFound = log.data_found ? JSON.parse(log.data_found) : null; } catch (_) { dataFound = log.data_found; }
      enrichmentSummary[log.source] = {
        data_found: dataFound,
        ran_at: log.created_at,
      };
    }
  }

  // Pull primary email from contacts
  const primaryContact = contacts.find(c => c.email) || contacts[0] || null;
  const primaryEmail = primaryContact?.email || null;

  return {
    id: company.id,
    name: company.name,
    website: company.website,
    state: company.headquarters,
    industry: company.industry_segment,
    founded_year: company.founded_year,
    employee_count: company.employee_count,
    description: company.description,
    linkedin_url: company.linkedin_url,
    twitter_url: company.twitter_url,
    github_url: company.github_url,
    sec_ticker: company.sec_ticker,
    sec_cik: company.sec_cik,
    open_roles_count: company.open_roles_count,
    key_hires: keyHires,
    recent_news: recentNews,
    hiring_signals: hiringSignals,
    primary_email: primaryEmail,
    contacts: contacts.map(c => ({
      name: c.name,
      title: c.title,
      email: c.email,
      phone: c.phone,
      linkedin_url: c.linkedin_url,
      bio: c.bio,
      email_confidence: c.email_confidence,
      source: c.source,
      verified: !!c.verified,
    })),
    enrichment_sources: enrichmentSummary,
    last_enriched_at: company.last_enriched_at,
    qualification_score: company.qualification_score,
    outreach_status: company.outreach_status,
    imported_at: company.created_at,
  };
});

db.close();

// Write output
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(`\n✅ Wrote ${output.length} enriched companies to: ${OUTPUT_PATH}`);

// Stats
const withEmail = output.filter(c => c.primary_email).length;
const withLinkedin = output.filter(c => c.linkedin_url).length;
const withNews = output.filter(c => c.recent_news && (Array.isArray(c.recent_news) ? c.recent_news.length > 0 : true)).length;
const withHiring = output.filter(c => c.hiring_signals && (Array.isArray(c.hiring_signals) ? c.hiring_signals.length > 0 : true)).length;
const totalContacts = output.reduce((s, c) => s + c.contacts.length, 0);

console.log(`\nStats:`);
console.log(`  Companies with email: ${withEmail}`);
console.log(`  Companies with LinkedIn: ${withLinkedin}`);
console.log(`  Companies with recent news: ${withNews}`);
console.log(`  Companies with hiring signals: ${withHiring}`);
console.log(`  Total contacts: ${totalContacts}`);

// Save stats for summary
fs.writeFileSync('/tmp/extraction_stats.json', JSON.stringify({
  totalCompanies: output.length,
  withEmail, withLinkedin, withNews, withHiring, totalContacts
}, null, 2));
