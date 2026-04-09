import { readFileSync, writeFileSync } from 'fs';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const API_KEY = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8')).api_key;
const RESULTS_FILE = `${WORKSPACE}/jordan.ai/pipeline/apollo_phone_results.json`;
const COMPANIES_FILE = `${WORKSPACE}/jordan.ai/pipeline/phone_missing_companies.json`;
const CSV_FILE = `${WORKSPACE}/jordan.ai/pipeline/top4k_enriched.csv`;

// Load webhook results (person_id -> phone data)
const webhookResults = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
const personIds = Object.keys(webhookResults);
console.log(`Webhook results: ${personIds.length} person IDs with phones`);

// We need to map person IDs back to company domains
// Strategy: batch lookup person IDs via Apollo enrichment (just get info, no phone reveal)
// This costs 1 credit per person but we already spent those credits

const TITLES = ["CEO", "CTO", "Founder", "Co-founder", "President", "VP", "Director", "Owner", "Managing Director", "COO", "CFO", "Head of"];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Load companies
const companies = JSON.parse(readFileSync(COMPANIES_FILE, 'utf8'));

// Step 1: Free people search to get person_id -> domain mapping
const domainPhoneMap = {};
let matched = 0;
let searched = 0;

console.log(`Searching ${companies.length} companies to match person IDs...`);

for (let i = 0; i < companies.length; i++) {
  const company = companies[i];
  const domain = company.domain;
  if (!domain) continue;
  
  // Already matched? skip
  if (domainPhoneMap[domain]) continue;
  
  await sleep(600);
  searched++;
  
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
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
      i--; // retry
      continue;
    }
    
    if (!res.ok) continue;
    
    const data = await res.json();
    const people = data.people || [];
    
    for (const person of people) {
      if (webhookResults[person.id]) {
        const phoneData = webhookResults[person.id];
        const phones = phoneData.phones || [];
        const phone = phones.length > 0 
          ? (typeof phones[0] === 'string' ? phones[0] : phones[0].number)
          : null;
        
        if (phone) {
          domainPhoneMap[domain] = {
            phone,
            company_name: company.name,
            person_id: person.id
          };
          matched++;
          break;
        }
      }
    }
  } catch (err) {
    // skip errors
  }
  
  if ((i + 1) % 100 === 0) {
    console.log(`[${i + 1}/${companies.length}] Searched: ${searched} | Matched: ${matched}`);
  }
}

console.log(`\nSearch complete. Matched: ${matched} domains to phones`);
writeFileSync(`${WORKSPACE}/jordan.ai/pipeline/domain_phone_map.json`, JSON.stringify(domainPhoneMap, null, 2));

// Now merge into CSV using Python (more reliable CSV handling)
console.log('\nMerging into CSV...');
