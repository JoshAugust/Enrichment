import { services } from "orangeslice";
import { readFileSync, appendFileSync, existsSync } from "fs";
import { createRequire } from "module";

const WS = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai";
const HUBSPOT_FILE = `${WS}/overnight/shared/hubspot_domains_current.json`;
const DB_FILE = `${WS}/pipeline/master.db`;
const QUEUE_FILE = `${WS}/overnight/shared/new_companies_queue.jsonl`;
const LOG_FILE = `${WS}/overnight/session_1/wellfound_crunchbase_log.md`;

// Load existing domains
const hubspotDomains = new Set(JSON.parse(readFileSync(HUBSPOT_FILE, 'utf-8')));
console.log(`HubSpot domains loaded: ${hubspotDomains.size}`);

// Load master DB domains from pre-dumped JSON
const DB_DOMAINS_FILE = `${WS}/overnight/shared/master_db_domains.json`;
const dbDomains = new Set(JSON.parse(readFileSync(DB_DOMAINS_FILE, 'utf-8')));
console.log(`Master DB domains loaded: ${dbDomains.size}`);

// Load already-queued domains
const existingQueued = new Set();
if (existsSync(QUEUE_FILE)) {
  const lines = readFileSync(QUEUE_FILE, 'utf-8').split('\n').filter(Boolean);
  for (const line of lines) {
    try { existingQueued.add(JSON.parse(line).domain); } catch {}
  }
}
console.log(`Already queued: ${existingQueued.size}`);

function normalizeDomain(url) {
  if (!url) return null;
  let d = url.toLowerCase().trim();
  // Remove protocol
  d = d.replace(/^https?:\/\//, '');
  // Remove www.
  if (d.startsWith('www.')) d = d.slice(4);
  // Remove trailing slash and path
  d = d.split('/')[0];
  // Remove port
  d = d.split(':')[0];
  d = d.trim();
  if (!d || !d.includes('.')) return null;
  return d;
}

function isNew(domain) {
  if (!domain) return false;
  return !hubspotDomains.has(domain) && !dbDomains.has(domain) && !existingQueued.has(domain);
}

function appendToQueue(rec) {
  const domain = normalizeDomain(rec.website_url);
  if (!isNew(domain)) return false;
  existingQueued.add(domain);
  const entry = {
    domain,
    company_name: rec.name || '',
    source: 'crunchbase-orangeslice',
    employees: rec.num_employees_enum || null,
    state: rec.state || null,
    description: rec.short_description || null,
    timestamp: new Date().toISOString()
  };
  appendFileSync(QUEUE_FILE, JSON.stringify(entry) + '\n');
  return true;
}

// Define queries by state
const stateQueries = [
  { state: 'Texas', location: 'Texas' },
  { state: 'Colorado', location: 'Colorado' },
  { state: 'Utah', location: 'Utah' },
  { state: 'North Carolina', location: 'North Carolina' },
  { state: 'Tennessee', location: 'Tennessee' },
  { state: 'Georgia', location: 'Georgia' },
  { state: 'Florida', location: 'Florida' },
  { state: 'Virginia', location: 'Virginia' },
  { state: 'Oregon', location: 'Oregon' },
  { state: 'Arizona', location: 'Arizona' },
];

// Category queries
const categoryQueries = [
  { label: 'DevTools', cats: ['Developer Tools', 'Developer Platform', 'Software Development'] },
  { label: 'SaaS-B2B', cats: ['SaaS', 'Enterprise Software', 'B2B'] },
  { label: 'Cybersecurity', cats: ['Cybersecurity', 'Network Security', 'Information Security'] },
  { label: 'DataAnalytics', cats: ['Data Analytics', 'Business Intelligence', 'Big Data'] },
  { label: 'AI-ML', cats: ['Artificial Intelligence (AI)', 'Machine Learning', 'Natural Language Processing'] },
  { label: 'Fintech', cats: ['FinTech', 'Financial Services', 'Payments'] },
  { label: 'HRtech', cats: ['Human Resources', 'HR Tech', 'Recruiting'] },
  { label: 'Martech', cats: ['Marketing Automation', 'AdTech', 'Marketing'] },
  { label: 'Edtech', cats: ['EdTech', 'Education Technology', 'E-Learning'] },
];

let totalAdded = 0;
let totalFetched = 0;

async function runStateQuery(stateLabel, locationValue) {
  console.log(`\nQuerying state: ${stateLabel}...`);
  const sql = `
    SELECT
      name,
      website_url,
      short_description,
      funding_stage,
      last_funding_type,
      last_funding_date,
      num_employees_enum
    FROM public.crunchbase_scraper_lean
    WHERE operating_status = 'active'
      AND company_type = 'for_profit'
      AND funding_stage IN ('seed', 'early_stage_venture')
      AND website_url IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(location_identifiers) AS l(location)
        WHERE l.location = '${locationValue}'
      )
    ORDER BY last_funding_date DESC NULLS LAST
    LIMIT 100
  `;
  
  try {
    const rows = await services.crunchbase.search({ sql });
    console.log(`  ${stateLabel}: ${rows.length} rows returned`);
    totalFetched += rows.length;
    let added = 0;
    for (const row of rows) {
      if (appendToQueue({ ...row, state: stateLabel })) {
        added++;
        totalAdded++;
      }
    }
    console.log(`  ${stateLabel}: ${added} new companies added`);
    return added;
  } catch (err) {
    console.error(`  ERROR for ${stateLabel}: ${err.message}`);
    return 0;
  }
}

async function runCategoryQuery(label, cats) {
  console.log(`\nQuerying category: ${label}...`);
  const catList = cats.map(c => `'${c}'`).join(', ');
  const sql = `
    SELECT
      name,
      website_url,
      short_description,
      funding_stage,
      last_funding_type,
      last_funding_date,
      num_employees_enum,
      location_identifiers
    FROM public.crunchbase_scraper_lean
    WHERE operating_status = 'active'
      AND company_type = 'for_profit'
      AND funding_stage = 'seed'
      AND website_url IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(location_identifiers) AS l(location)
        WHERE l.location = 'United States'
      )
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(categories) AS c(category)
        WHERE c.category IN (${catList})
      )
    ORDER BY last_funding_date DESC NULLS LAST
    LIMIT 100
  `;
  
  try {
    const rows = await services.crunchbase.search({ sql });
    console.log(`  ${label}: ${rows.length} rows returned`);
    totalFetched += rows.length;
    let added = 0;
    for (const row of rows) {
      if (appendToQueue(row)) {
        added++;
        totalAdded++;
      }
    }
    console.log(`  ${label}: ${added} new companies added`);
    return added;
  } catch (err) {
    console.error(`  ERROR for ${label}: ${err.message}`);
    return 0;
  }
}

async function runRecentFunding() {
  console.log(`\nQuerying recent funding (last 18 months, US, seed)...`);
  const sql = `
    SELECT
      name,
      website_url,
      short_description,
      funding_stage,
      last_funding_type,
      last_funding_date,
      num_employees_enum
    FROM public.crunchbase_scraper_lean
    WHERE operating_status = 'active'
      AND company_type = 'for_profit'
      AND last_funding_type = 'seed'
      AND last_funding_date >= CURRENT_DATE - INTERVAL '18 months'
      AND website_url IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(location_identifiers) AS l(location)
        WHERE l.location = 'United States'
      )
    ORDER BY last_funding_date DESC NULLS LAST
    LIMIT 100
  `;
  
  try {
    const rows = await services.crunchbase.search({ sql });
    console.log(`  Recent funding: ${rows.length} rows returned`);
    totalFetched += rows.length;
    let added = 0;
    for (const row of rows) {
      if (appendToQueue(row)) {
        added++;
        totalAdded++;
      }
    }
    console.log(`  Recent funding: ${added} new companies added`);
    return added;
  } catch (err) {
    console.error(`  ERROR for recent funding: ${err.message}`);
    return 0;
  }
}

async function main() {
  console.log('=== Crunchbase Sourcing via OrangeSlice ===\n');
  
  // Run state queries
  for (const { state, location } of stateQueries) {
    await runStateQuery(state, location);
    await new Promise(r => setTimeout(r, 500)); // Small delay between requests
  }
  
  // Run category queries (US-wide)
  for (const { label, cats } of categoryQueries) {
    await runCategoryQuery(label, cats);
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Run recent funding query
  await runRecentFunding();
  
  // Count final queue
  const queueCount = readFileSync(QUEUE_FILE, 'utf-8').split('\n').filter(Boolean).length;
  
  console.log(`\n=== FINAL RESULTS ===`);
  console.log(`Total fetched from Crunchbase: ${totalFetched}`);
  console.log(`Total new companies added: ${totalAdded}`);
  console.log(`Queue total: ${queueCount}`);
  
  // Update log
  const logEntry = `\n## Crunchbase OrangeSlice Run - ${new Date().toISOString()}\n- Total fetched: ${totalFetched}\n- New added: ${totalAdded}\n- Queue total: ${queueCount}\n`;
  appendFileSync(LOG_FILE, logEntry);
}

main().catch(console.error);
