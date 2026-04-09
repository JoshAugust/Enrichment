#!/usr/bin/env node
/**
 * Apollo People Search — finds founders/CTOs at small US tech companies.
 * People Search is FREE (unlimited). No credits consumed.
 * 
 * Usage: node apollo_search.mjs <search_config.json>
 * Config: { titles: [...], cities: [...], industries: [...], min_employees: 1, max_employees: 50, pages: 10 }
 * 
 * Output: writes results to stdout as JSONL (one company per line)
 */

import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'fs';

const APOLLO_KEY = JSON.parse(readFileSync('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/apollo/config.json')).api_key;

const EXISTING_DOMAINS = new Set(
  readFileSync('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/overnight/session_2/existing_domains.txt', 'utf8')
    .split('\n').map(d => d.trim().toLowerCase()).filter(Boolean)
);

// Also load HubSpot domains if available
const HUBSPOT_PATH = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/overnight/shared/hubspot_domains_current.json';
let HUBSPOT_DOMAINS = new Set();
if (existsSync(HUBSPOT_PATH)) {
  try {
    const hs = JSON.parse(readFileSync(HUBSPOT_PATH, 'utf8'));
    HUBSPOT_DOMAINS = new Set((Array.isArray(hs) ? hs : []).map(d => d.toLowerCase()));
  } catch {}
}

const QUEUE_PATH = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/overnight/shared/new_companies_queue.jsonl';
const SEEN_PATH = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/overnight/session_2/seen_domains.json';

// Load seen domains from prior runs
let seenDomains = new Set();
if (existsSync(SEEN_PATH)) {
  try { seenDomains = new Set(JSON.parse(readFileSync(SEEN_PATH, 'utf8'))); } catch {}
}

function isDuplicate(domain) {
  if (!domain) return true;
  const d = domain.toLowerCase().replace(/^www\./, '');
  return EXISTING_DOMAINS.has(d) || HUBSPOT_DOMAINS.has(d) || seenDomains.has(d);
}

function saveSeen() {
  writeFileSync(SEEN_PATH, JSON.stringify([...seenDomains]));
}

async function searchPeople(params, page = 1) {
  const body = {
    api_key: APOLLO_KEY,
    person_titles: params.titles || ["Founder", "CEO", "CTO", "Co-founder"],
    person_locations: params.cities || [],
    organization_num_employees_ranges: [`1,${params.max_employees || 50}`],
    page: page,
    per_page: 100,
  };
  
  // Add industry keywords if provided
  if (params.industry_keywords && params.industry_keywords.length > 0) {
    body.q_organization_keyword_tags = params.industry_keywords;
  }
  
  // Country filter
  body.person_locations = body.person_locations.length > 0 
    ? body.person_locations.map(c => c + ", United States")
    : ["United States"];

  const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (res.status === 429) {
    console.error(`Rate limited, waiting 60s...`);
    await new Promise(r => setTimeout(r, 60000));
    return searchPeople(params, page);
  }
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`Apollo error ${res.status}: ${text}`);
    return { people: [], pagination: { total_pages: 0 } };
  }
  
  return res.json();
}

async function runSearch(config) {
  const stats = { searched: 0, found: 0, dupes: 0, new: 0, errors: 0 };
  const maxPages = config.pages || 10;
  
  for (let page = 1; page <= maxPages; page++) {
    try {
      const data = await searchPeople(config, page);
      const people = data.people || [];
      
      if (people.length === 0) {
        console.error(`Page ${page}: no results, stopping.`);
        break;
      }
      
      stats.searched += people.length;
      
      for (const person of people) {
        const org = person.organization || {};
        const domain = (org.primary_domain || org.website_url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();
        
        if (!domain) continue;
        stats.found++;
        
        if (isDuplicate(domain)) {
          stats.dupes++;
          continue;
        }
        
        seenDomains.add(domain);
        stats.new++;
        
        const record = {
          domain,
          company_name: org.name || '',
          source: `apollo_search`,
          employees: org.estimated_num_employees || null,
          city: person.city || '',
          state: person.state || '',
          industry: org.industry || '',
          founder_name: person.name || '',
          founder_title: person.title || '',
          apollo_org_id: org.id || '',
          timestamp: new Date().toISOString(),
        };
        
        appendFileSync(QUEUE_PATH, JSON.stringify(record) + '\n');
        console.log(JSON.stringify(record));
      }
      
      // Check if more pages
      const totalPages = data.pagination?.total_pages || 0;
      if (page >= totalPages) {
        console.error(`Reached last page (${totalPages})`);
        break;
      }
      
      // Rate limit: small delay between pages
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (err) {
      console.error(`Error on page ${page}: ${err.message}`);
      stats.errors++;
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  saveSeen();
  console.error(`\nStats: ${JSON.stringify(stats)}`);
  return stats;
}

// Main
const configFile = process.argv[2];
if (!configFile) {
  console.error('Usage: node apollo_search.mjs <config.json>');
  process.exit(1);
}

const config = JSON.parse(readFileSync(configFile, 'utf8'));
runSearch(config).then(stats => {
  console.error('Done:', JSON.stringify(stats));
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
