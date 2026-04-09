#!/usr/bin/env node
/**
 * Sub-agent runner: iterates through search configs and runs Apollo People Search.
 * Usage: node run_agent.mjs <config_file.json>
 * 
 * Each config has { agent_id, label, searches: [...] }
 * Each search: { cities, industry_keywords, titles, max_employees, pages }
 */

import { readFileSync, appendFileSync, writeFileSync, existsSync } from 'fs';

const APOLLO_KEY = JSON.parse(readFileSync('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/apollo/config.json')).api_key;
const WS = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';

// Load dedup sets
const EXISTING_DOMAINS = new Set(
  readFileSync(`${WS}/jordan.ai/overnight/session_2/existing_domains.txt`, 'utf8')
    .split('\n').map(d => d.trim().toLowerCase()).filter(Boolean)
);

const HUBSPOT_PATH = `${WS}/jordan.ai/overnight/shared/hubspot_domains_current.json`;
let HUBSPOT_DOMAINS = new Set();
if (existsSync(HUBSPOT_PATH)) {
  try {
    const hs = JSON.parse(readFileSync(HUBSPOT_PATH, 'utf8'));
    HUBSPOT_DOMAINS = new Set((Array.isArray(hs) ? hs : []).map(d => d.toLowerCase()));
  } catch {}
}

const QUEUE_PATH = `${WS}/jordan.ai/overnight/shared/new_companies_queue.jsonl`;

// Global seen domains (cross-agent dedup via file)
let seenDomains = new Set();
const SEEN_PATH = `${WS}/jordan.ai/overnight/session_2/seen_domains.json`;
if (existsSync(SEEN_PATH)) {
  try { seenDomains = new Set(JSON.parse(readFileSync(SEEN_PATH, 'utf8'))); } catch {}
}

function normDomain(d) {
  if (!d) return '';
  return d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
}

function isDuplicate(domain) {
  const d = normDomain(domain);
  if (!d) return true;
  return EXISTING_DOMAINS.has(d) || HUBSPOT_DOMAINS.has(d) || seenDomains.has(d);
}

function saveSeen() {
  writeFileSync(SEEN_PATH, JSON.stringify([...seenDomains]));
}

async function apolloSearch(params, page = 1) {
  const body = {
    api_key: APOLLO_KEY,
    person_titles: params.titles || ["Founder", "CEO", "CTO", "Co-founder"],
    organization_num_employees_ranges: [`1,${params.max_employees || 50}`],
    page,
    per_page: 100,
  };

  if (params.industry_keywords?.length > 0) {
    body.q_organization_keyword_tags = params.industry_keywords;
  }

  body.person_locations = (params.cities || []).length > 0
    ? params.cities.map(c => `${c}, United States`)
    : ["United States"];

  let attempts = 0;
  while (attempts < 3) {
    try {
      const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        console.error(`[Rate limited] Waiting 60s (attempt ${attempts + 1})...`);
        await new Promise(r => setTimeout(r, 60000));
        attempts++;
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        console.error(`[Apollo ${res.status}] ${text.slice(0, 200)}`);
        return { people: [], pagination: { total_pages: 0 } };
      }

      return await res.json();
    } catch (err) {
      console.error(`[Fetch error] ${err.message}`);
      await new Promise(r => setTimeout(r, 5000));
      attempts++;
    }
  }
  return { people: [], pagination: { total_pages: 0 } };
}

async function runSearch(search, agentId) {
  const stats = { searched: 0, found: 0, dupes: 0, new: 0 };
  const maxPages = search.pages || 10;
  const label = `${(search.cities || ['US']).join('+')}/${(search.industry_keywords || ['all']).join('+')}`;

  console.error(`\n[Agent ${agentId}] Starting: ${label} (${maxPages} pages)`);

  for (let page = 1; page <= maxPages; page++) {
    const data = await apolloSearch(search, page);
    const people = data.people || [];

    if (people.length === 0) {
      console.error(`  Page ${page}: empty, stopping this search.`);
      break;
    }

    stats.searched += people.length;

    for (const person of people) {
      const org = person.organization || {};
      const domain = normDomain(org.primary_domain || org.website_url || '');

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
        timestamp: new Date().toISOString(),
      };

      appendFileSync(QUEUE_PATH, JSON.stringify(record) + '\n');
    }

    // Save seen periodically
    if (page % 5 === 0) saveSeen();

    console.error(`  Page ${page}/${maxPages}: ${people.length} people, ${stats.new} new domains so far`);

    const totalPages = data.pagination?.total_pages || 0;
    if (page >= totalPages) {
      console.error(`  Reached end (${totalPages} total pages)`);
      break;
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  return stats;
}

// Main
const configFile = process.argv[2];
if (!configFile) { console.error('Usage: node run_agent.mjs <config.json>'); process.exit(1); }

const config = JSON.parse(readFileSync(configFile, 'utf8'));
const agentId = config.agent_id;
const allStats = { total_searched: 0, total_found: 0, total_dupes: 0, total_new: 0, searches_completed: 0 };

console.error(`[Agent ${agentId}] ${config.label} — ${config.searches.length} search combos`);

(async () => {
  for (const search of config.searches) {
    const stats = await runSearch(search, agentId);
    allStats.total_searched += stats.searched;
    allStats.total_found += stats.found;
    allStats.total_dupes += stats.dupes;
    allStats.total_new += stats.new;
    allStats.searches_completed++;

    // Progress file
    writeFileSync(`${WS}/jordan.ai/overnight/session_2/agent_${agentId}_progress.json`,
      JSON.stringify({ ...allStats, agent_id: agentId, label: config.label, updated: new Date().toISOString() }, null, 2));
  }

  saveSeen();
  console.error(`\n[Agent ${agentId}] COMPLETE:`, JSON.stringify(allStats));

  // Final progress
  writeFileSync(`${WS}/jordan.ai/overnight/session_2/agent_${agentId}_progress.json`,
    JSON.stringify({ ...allStats, agent_id: agentId, label: config.label, status: 'complete', updated: new Date().toISOString() }, null, 2));
})();
