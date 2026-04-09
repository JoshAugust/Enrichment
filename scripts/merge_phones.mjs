import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const API_KEY = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8')).api_key;
const RESULTS_FILE = `${WORKSPACE}/jordan.ai/pipeline/apollo_phone_results.json`;
const COMPANIES_FILE = `${WORKSPACE}/jordan.ai/pipeline/phone_missing_companies.json`;
const CSV_FILE = `${WORKSPACE}/jordan.ai/pipeline/top4k_enriched.csv`;

// Load webhook results (person_id -> phone data)
const webhookResults = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
console.log(`Webhook results: ${Object.keys(webhookResults).length} entries`);

// Build person_id -> phone map
const phoneByPersonId = {};
for (const [personId, data] of Object.entries(webhookResults)) {
  const phones = data.phones || [];
  if (phones.length > 0) {
    const phone = typeof phones[0] === 'string' ? phones[0] : phones[0].number;
    if (phone) phoneByPersonId[personId] = phone;
  }
}
console.log(`Phone numbers available: ${Object.keys(phoneByPersonId).length}`);

// Load the 708 missing companies
const companies = JSON.parse(readFileSync(COMPANIES_FILE, 'utf8'));
const TITLES = ["CEO", "CTO", "Founder", "Co-founder", "President", "VP", "Director", "Owner", "Managing Director", "COO", "CFO", "Head of"];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function searchPeople(domain) {
  const res = await fetch(`https://api.apollo.io/api/v1/mixed_people/api_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
    body: JSON.stringify({
      q_organization_domains: domain,
      per_page: 5,
      person_titles: TITLES
    })
  });
  if (res.status === 429) {
    console.log('Rate limited, waiting 60s...');
    await sleep(60000);
    return searchPeople(domain);
  }
  if (!res.ok) return [];
  const data = await res.json();
  return data.people || [];
}

// Map domain -> phone/person data by matching person IDs
const domainPhoneMap = {}; // domain -> { phone, name, email }
let matched = 0;

console.log('Matching person IDs to domains via search...');

for (let i = 0; i < companies.length; i++) {
  const company = companies[i];
  const domain = company.domain;
  if (!domain) continue;

  await sleep(500); // Free endpoint, lighter rate limit
  const people = await searchPeople(domain);
  
  for (const person of people) {
    if (phoneByPersonId[person.id]) {
      domainPhoneMap[domain] = {
        phone: phoneByPersonId[person.id],
        name: person.first_name, // Only first name from search
        person_id: person.id
      };
      matched++;
      break;
    }
  }
  
  if ((i + 1) % 100 === 0) {
    console.log(`[${i + 1}/${companies.length}] Matched: ${matched}`);
  }
}

console.log(`\nTotal domain-phone matches: ${matched}`);

// Save the mapping
writeFileSync(`${WORKSPACE}/jordan.ai/pipeline/domain_phone_map.json`, JSON.stringify(domainPhoneMap, null, 2));

// Now merge into CSV
const csvContent = readFileSync(CSV_FILE, 'utf8');
const rows = parse(csvContent, { columns: true, skip_empty_lines: true });

let phonesAdded = 0;
let emailsAdded = 0;

for (const row of rows) {
  const website = row['Website'] || '';
  const domain = website.replace(/https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  
  if (domainPhoneMap[domain]) {
    const match = domainPhoneMap[domain];
    
    // Only fill if currently empty
    if (!row['DM Phone'] && match.phone) {
      row['DM Phone'] = match.phone;
      phonesAdded++;
    }
  }
}

// Write updated CSV
const output = stringify(rows, { header: true, columns: Object.keys(rows[0]) });
writeFileSync(CSV_FILE, output);

// Count final coverage
let totalPhones = 0;
let totalEmails = 0;
for (const row of rows) {
  if (row['DM Phone'] || row['Company Phone']) totalPhones++;
  if (row['DM Email']) totalEmails++;
}

console.log(`\n=== MERGE COMPLETE ===`);
console.log(`Phones added to CSV: ${phonesAdded}`);
console.log(`Final phone coverage: ${totalPhones}/4,000 (${(totalPhones/40).toFixed(1)}%)`);
console.log(`Final email coverage: ${totalEmails}/4,000 (${(totalEmails/40).toFixed(1)}%)`);
