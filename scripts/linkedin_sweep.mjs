import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const CSV_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_enriched.csv`;
const SAMPLE_PATH = `${WORKSPACE}/jordan.ai/pipeline/linkedin_sample_400.json`;
const CHECKPOINT_PATH = `${WORKSPACE}/jordan.ai/pipeline/linkedin_full_checkpoint.json`;
const RESULTS_PATH = `${WORKSPACE}/jordan.ai/pipeline/linkedin_full_results.json`;
const OUTPUT_CSV = `${WORKSPACE}/jordan.ai/pipeline/top_leads_verified.csv`;

const config = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`));
const API_KEY = config.api_key;

// Load CSV
const csvData = readFileSync(CSV_PATH, 'utf8');
const rows = parse(csvData, { columns: true });

// Filter to companies with phones only
const withPhones = rows.filter(r => {
  const cp = (r['Company Phone'] || '').trim();
  const dp = (r['DM Phone'] || '').trim();
  return cp || dp;
});
console.log(`Companies with phones: ${withPhones.length}`);

// Load existing sample results (400 already checked)
const sample = JSON.parse(readFileSync(SAMPLE_PATH, 'utf8'));
const alreadyChecked = new Map();
for (const s of sample) {
  alreadyChecked.set(s.domain.toLowerCase(), { liEmp: s.liEmp, apolloName: s.apolloName || '', industry: s.industry || '' });
}
console.log(`Already checked (sample): ${alreadyChecked.size}`);

// Load checkpoint if exists
let checkpoint = { processed: 0, results: {} };
if (existsSync(CHECKPOINT_PATH)) {
  checkpoint = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf8'));
  console.log(`Resuming from checkpoint: ${checkpoint.processed} already done`);
}

// Build list of domains still needing checking
const needsCheck = [];
for (const row of withPhones) {
  const domain = (row.Domain || '').trim().toLowerCase();
  if (!domain) continue;
  if (alreadyChecked.has(domain)) continue;
  if (checkpoint.results[domain]) continue;
  needsCheck.push(domain);
}
console.log(`Still need to check: ${needsCheck.length}`);

// Apollo org enrichment
async function enrichDomain(domain) {
  const url = `https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`;
  const r = await fetch(url, {
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' }
  });
  if (r.status === 429) {
    console.log('Rate limited, waiting 60s...');
    await new Promise(r => setTimeout(r, 60000));
    return enrichDomain(domain); // retry
  }
  const d = await r.json();
  const org = d.organization || {};
  return {
    liEmp: org.estimated_num_employees || 0,
    apolloName: org.name || '',
    industry: org.industry || ''
  };
}

async function run() {
  let over100 = 0;
  let processed = checkpoint.processed;
  
  for (let i = 0; i < needsCheck.length; i++) {
    const domain = needsCheck[i];
    try {
      const result = await enrichDomain(domain);
      checkpoint.results[domain] = result;
      processed++;
      
      if (result.liEmp > 100) over100++;
      
      if ((i + 1) % 200 === 0) {
        checkpoint.processed = processed;
        writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
        console.log(`Checked ${i + 1}/${needsCheck.length} — ${over100} over 100 so far`);
      }
    } catch (e) {
      console.error(`Error on ${domain}: ${e.message}`);
      checkpoint.results[domain] = { liEmp: 0, apolloName: '', industry: '', error: e.message };
    }
    
    await new Promise(r => setTimeout(r, 1200)); // rate limit
  }
  
  // Save final checkpoint
  checkpoint.processed = processed;
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint));
  console.log(`\nAll done. Checked ${processed} new domains.`);
  
  // Merge all results: sample + new
  const allResults = new Map();
  for (const [domain, data] of alreadyChecked) {
    allResults.set(domain, data);
  }
  for (const [domain, data] of Object.entries(checkpoint.results)) {
    allResults.set(domain.toLowerCase(), data);
  }
  
  // Save full results
  writeFileSync(RESULTS_PATH, JSON.stringify(Object.fromEntries(allResults), null, 2));
  
  // Filter and build output
  const qualified = [];
  const removed = [];
  
  for (const row of withPhones) {
    const domain = (row.Domain || '').trim().toLowerCase();
    const result = allResults.get(domain);
    const bvdEmp = parseFloat(row.Employees) || 0;
    const liEmp = result ? result.liEmp : 0;
    
    // Update LinkedIn Employees column
    if (result && result.liEmp > 0) {
      row['LinkedIn Employees'] = String(result.liEmp);
    }
    
    const maxEmp = Math.max(bvdEmp, liEmp);
    if (maxEmp > 100) {
      removed.push({ name: row['Company Name'], domain, bvdEmp, liEmp, apolloName: result?.apolloName || '' });
    } else {
      qualified.push(row);
    }
  }
  
  // Sort by Blueprint Score
  qualified.sort((a, b) => (parseFloat(b['Blueprint Score']) || 0) - (parseFloat(a['Blueprint Score']) || 0));
  
  // Write CSV
  const headers = Object.keys(rows[0]);
  const output = stringify(qualified, { header: true, columns: headers });
  writeFileSync(OUTPUT_CSV, output);
  
  // Stats
  const grades = { A: 0, B: 0, C: 0, D: 0 };
  const hasEmail = qualified.filter(r => (r['DM Email'] || '').trim()).length;
  const hasPhone = qualified.filter(r => (r['Company Phone'] || '').trim() || (r['DM Phone'] || '').trim()).length;
  
  for (const r of qualified) {
    const g = (r.Grade || '').trim();
    if (grades[g] !== undefined) grades[g]++;
  }
  
  const scores = qualified.map(r => parseFloat(r['Blueprint Score']) || 0);
  
  console.log(`\n=== FINAL REPORT ===`);
  console.log(`Companies with phones: ${withPhones.length}`);
  console.log(`Removed (>100 employees): ${removed.length}`);
  console.log(`FINAL QUALIFIED: ${qualified.length}`);
  console.log(`Score range: ${Math.max(...scores)} - ${Math.min(...scores)}`);
  console.log(`Grades: A=${grades.A}, B=${grades.B}, C=${grades.C}, D=${grades.D}`);
  console.log(`Email coverage: ${hasEmail}/${qualified.length} (${(hasEmail*100/qualified.length).toFixed(1)}%)`);
  console.log(`Phone coverage: ${hasPhone}/${qualified.length} (${(hasPhone*100/qualified.length).toFixed(1)}%)`);
  console.log(`\nRemoved companies (top 20 by LinkedIn size):`);
  removed.sort((a, b) => b.liEmp - a.liEmp);
  for (const r of removed.slice(0, 20)) {
    console.log(`  ${r.name} (${r.domain}) BvD:${r.bvdEmp} → LI:${r.liEmp} [${r.apolloName}]`);
  }
  console.log(`CSV written to: ${OUTPUT_CSV}`);
}

run().catch(e => console.error('Fatal:', e));
