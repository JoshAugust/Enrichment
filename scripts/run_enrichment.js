/**
 * run_enrichment.js — Run enrichment sources on the 100 imported SMB companies
 *
 * Fetches SMB company IDs from the DB, then calls POST /api/enrichment/company/:id
 * for each one with the specified sources.
 */

'use strict';

const Database = require('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-outreach/backend/node_modules/better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, 'corgi-outreach/backend/data/corgi_outreach.db');
const BASE_URL = 'http://localhost:3001';
const SOURCES = ['web-search', 'company-website', 'email-discovery', 'news-monitor', 'job-postings', 'sec-edgar'];

// Get all SMB company IDs
const db = new Database(DB_PATH, { readonly: true });
const companies = db.prepare("SELECT id, name FROM companies WHERE description LIKE '%smb_leads_2026_03_27%'").all();
db.close();

console.log(`Found ${companies.length} SMB companies to enrich`);
console.log(`Sources: ${SOURCES.join(', ')}`);
console.log(`API: ${BASE_URL}\n`);

const results = {
  success: [],
  failed: [],
  errors: [],
};

async function enrichCompany(company, index) {
  const url = `${BASE_URL}/api/enrichment/company/${company.id}`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcesToRun: SOURCES }),
    });
    const data = await resp.json();
    if (data.success) {
      const fieldsFound = data.results 
        ? Object.values(data.results).filter(r => r && r.fieldsFound > 0).length 
        : '?';
      console.log(`[${index + 1}/100] ✅ ${company.name} — ${fieldsFound} sources returned data`);
      results.success.push({ id: company.id, name: company.name, results: data.results });
    } else {
      console.log(`[${index + 1}/100] ⚠️  ${company.name} — ${data.error || 'Unknown error'}`);
      results.failed.push({ id: company.id, name: company.name, error: data.error });
    }
  } catch (err) {
    console.log(`[${index + 1}/100] ❌ ${company.name} — ${err.message}`);
    results.errors.push({ id: company.id, name: company.name, error: err.message });
  }
}

// Process in batches of 5 to avoid overwhelming the server
async function main() {
  const BATCH_SIZE = 5;
  const startTime = Date.now();

  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((c, j) => enrichCompany(c, i + j)));
    
    // Small delay between batches to be polite to external APIs
    if (i + BATCH_SIZE < companies.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n--- Batch ${Math.floor(i / BATCH_SIZE) + 1} done (${elapsed}s elapsed) ---\n`);
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n✅ Enrichment complete in ${totalTime}s`);
  console.log(`   Success: ${results.success.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  console.log(`   Errors: ${results.errors.length}`);

  // Save enrichment results summary
  fs.writeFileSync('/tmp/enrichment_results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to /tmp/enrichment_results.json');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
