import { readFileSync, writeFileSync, existsSync } from 'fs';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const API_KEY = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8')).api_key;
const WEBHOOK_URL = 'https://plugin-things-entertainment-beyond.trycloudflare.com/webhook/apollo-phone';
const COMPANIES_FILE = `${WORKSPACE}/jordan.ai/pipeline/phone_missing_companies.json`;
const PROGRESS_FILE = `${WORKSPACE}/jordan.ai/pipeline/apollo_phone_progress.json`;
const RESULTS_FILE = `${WORKSPACE}/jordan.ai/pipeline/apollo_phone_results.json`;

const companies = JSON.parse(readFileSync(COMPANIES_FILE, 'utf8'));

// Load progress checkpoint
let progress = { lastIndex: -1, creditsUsed: 0, submitted: 0, phonesFound: 0, noResults: 0, errors: 0 };
if (existsSync(PROGRESS_FILE)) {
  progress = JSON.parse(readFileSync(PROGRESS_FILE, 'utf8'));
}

// Results keyed by domain
let results = {};
if (existsSync(RESULTS_FILE)) {
  results = JSON.parse(readFileSync(RESULTS_FILE, 'utf8'));
}

const RATE_LIMIT_MS = 1500;
const TITLES = ["CEO", "CTO", "Founder", "Co-founder", "President", "VP", "Director", "Owner", "Managing Director", "COO", "CFO", "Head of"];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apolloPost(endpoint, body) {
  const res = await fetch(`https://api.apollo.io/api/v1${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
    body: JSON.stringify(body)
  });
  
  if (res.status === 429) {
    console.log('⚠️ Rate limited, waiting 60s...');
    await sleep(60000);
    return apolloPost(endpoint, body);
  }
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apollo ${endpoint} ${res.status}: ${text.substring(0, 300)}`);
  }
  
  return res.json();
}

function saveProgress() {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

console.log(`Starting Apollo phone enrichment for ${companies.length} companies`);
console.log(`Resuming from index ${progress.lastIndex + 1}, credits used so far: ${progress.creditsUsed}`);
console.log('---');

const startIdx = progress.lastIndex + 1;

for (let i = startIdx; i < companies.length; i++) {
  const company = companies[i];
  const domain = company.domain;
  
  if (!domain) {
    progress.lastIndex = i;
    continue;
  }
  
  try {
    // Step 1: People search (FREE) - get person IDs
    await sleep(RATE_LIMIT_MS);
    const searchData = await apolloPost('/mixed_people/api_search', {
      q_organization_domains: domain,
      per_page: 3,
      person_titles: TITLES
    });
    
    const people = searchData.people || [];
    
    if (people.length === 0) {
      progress.noResults++;
      progress.lastIndex = i;
      if (i % 50 === 0) saveProgress();
      continue;
    }
    
    // Step 2: Enrich top person by ID with phone reveal (9 credits)
    const person = people[0];
    const personId = person.id;
    
    if (!personId) {
      progress.noResults++;
      progress.lastIndex = i;
      continue;
    }
    
    await sleep(RATE_LIMIT_MS);
    const matchData = await apolloPost('/people/match', {
      id: personId,
      reveal_phone_number: true,
      webhook_url: WEBHOOK_URL
    });
    
    progress.creditsUsed += 9;
    progress.submitted++;
    
    // Check for synchronous phone data
    const matchPerson = matchData.person || {};
    const phones = matchPerson.phone_numbers || matchPerson.contact?.phone_numbers || [];
    const contactPhones = matchPerson.contact?.phone_numbers || phones;
    
    const allPhones = [...new Set([
      ...phones.map(p => p.sanitized_number).filter(Boolean),
      ...contactPhones.map(p => p.sanitized_number).filter(Boolean),
      matchPerson.contact?.sanitized_phone
    ].filter(Boolean))];
    
    results[domain] = {
      company_name: company.name,
      person_name: matchPerson.name || `${matchPerson.first_name} ${matchPerson.last_name}`,
      person_email: matchPerson.email,
      person_title: matchPerson.title,
      phones: allPhones,
      org_phone: matchPerson.organization?.phone,
      person_id: personId
    };
    
    if (allPhones.length > 0) {
      progress.phonesFound++;
    }
    
    progress.lastIndex = i;
    
    if ((i + 1) % 50 === 0 || i === companies.length - 1) {
      saveProgress();
      console.log(`📊 [${i + 1}/${companies.length}] Submitted: ${progress.submitted} | Phones found: ${progress.phonesFound} | No results: ${progress.noResults} | Credits: ~${progress.creditsUsed} | Errors: ${progress.errors}`);
    }
    
  } catch (err) {
    progress.errors++;
    progress.lastIndex = i;
    console.log(`[${i}] ❌ ${company.name} — ${err.message}`);
    
    if (err.message.includes('402') || err.message.includes('insufficient') || err.message.includes('credit')) {
      console.log('💰 Possible credit issue! Stopping.');
      saveProgress();
      break;
    }
    
    saveProgress();
    await sleep(3000);
  }
}

saveProgress();
console.log('\n=== ENRICHMENT COMPLETE ===');
console.log(`Companies processed: ${progress.lastIndex + 1}/${companies.length}`);
console.log(`Submitted for phone reveal: ${progress.submitted}`);
console.log(`Phones found (sync): ${progress.phonesFound}`);
console.log(`No search results: ${progress.noResults}`);
console.log(`Errors: ${progress.errors}`);
console.log(`Estimated credits used: ${progress.creditsUsed}`);
