import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/apollo/config.json', 'utf8'));
const API_KEY = config.api_key;

const testDomains = ['mavenagi.com', 'singulr.ai', 'plover.insure', 'protunes.com', 'communitytechalliance.org'];

for (const domain of testDomains) {
  const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
    body: JSON.stringify({
      organization_domains: [domain],
      page: 1,
      per_page: 5,
      person_titles: ['CEO', 'CTO', 'Founder', 'Co-founder', 'President', 'VP', 'Director']
    })
  });
  
  if (!res.ok) { console.log(`${domain}: HTTP ${res.status}`); continue; }
  
  const data = await res.json();
  const people = data.people || [];
  
  for (const p of people.slice(0, 3)) {
    const phones = p.phone_numbers || [];
    const hasPhone = phones.length > 0;
    const phoneStr = hasPhone ? phones.map(ph => `${ph.sanitized_number} (${ph.type})`).join(', ') : 'NONE';
    console.log(`${domain} | ${p.first_name} ${p.last_name} (${p.title || '?'}) | email: ${p.email || 'NONE'} | phones: ${phoneStr}`);
  }
  if (people.length === 0) console.log(`${domain}: no people found`);
  
  await new Promise(r => setTimeout(r, 1500));
}
