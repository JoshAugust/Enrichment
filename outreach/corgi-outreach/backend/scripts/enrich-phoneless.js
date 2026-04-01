/**
 * enrich-phoneless.js — Re-enrich all companies that have no phone numbers
 * 
 * Targets only company-website and web-search sources (the ones that find phones)
 * to minimize API calls and focus on phone discovery.
 */

'use strict';

require('dotenv').config();
const { db } = require('../src/db');
const pipeline = require('../src/research/enrichment-pipeline');

async function main() {
  // Find companies with no phone coverage
  const phonelessCompanies = db.prepare(`
    SELECT c.id, c.name, c.website, c.priority
    FROM companies c
    WHERE (c.phone IS NULL OR c.phone = '')
    AND c.id NOT IN (
      SELECT DISTINCT company_id FROM contacts WHERE phone IS NOT NULL AND phone != ''
    )
    ORDER BY c.priority ASC, c.qualification_score DESC
  `).all();

  console.log(`\n🐕 Phone enrichment: ${phonelessCompanies.length} companies without phones\n`);

  let found = 0;
  let failed = 0;
  let processed = 0;

  for (const company of phonelessCompanies) {
    processed++;
    const pct = Math.round((processed / phonelessCompanies.length) * 100);
    
    try {
      console.log(`[${processed}/${phonelessCompanies.length}] (${pct}%) Enriching: ${company.name} (${company.priority}) — ${company.website || 'no website'}`);
      
      const result = await pipeline.enrichCompany(company.id, {
        sourcesToRun: ['company-website', 'web-search'],
      });

      // Check if we found a phone
      const hasPhone = result.updatedFields.phone || false;
      const contactPhones = db.prepare(
        `SELECT COUNT(*) as c FROM contacts WHERE company_id = ? AND phone IS NOT NULL AND phone != ''`
      ).get(company.id).c;

      if (hasPhone || contactPhones > 0) {
        found++;
        console.log(`  ✅ PHONE FOUND for ${company.name}! (${hasPhone || 'via contacts'})`);
      } else {
        console.log(`  ⚠️  No phone found for ${company.name}`);
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ Error enriching ${company.name}:`, err.message);
    }

    // Polite delay between companies (2s)
    await new Promise(r => setTimeout(r, 2000));
  }

  // Final stats
  const totalWithPhones = db.prepare(`
    SELECT COUNT(DISTINCT c.id) as c FROM companies c
    LEFT JOIN contacts ct ON ct.company_id = c.id
    WHERE c.phone IS NOT NULL AND c.phone != ''
    OR (ct.phone IS NOT NULL AND ct.phone != '')
  `).get().c;

  console.log(`\n🏁 Phone enrichment complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   New phones found: ${found}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total companies with phones now: ${totalWithPhones} / 327\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
