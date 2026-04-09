import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/apollo/config.json', 'utf8'));
const API_KEY = config.api_key;

// Try api_search with just domain, no title filter
const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
  body: JSON.stringify({
    q_organization_domains: 'stripe.com',
    page: 1,
    per_page: 5
  })
});

console.log('Status:', res.status);
const data = await res.json();
const people = data.people || [];
console.log(`Found ${people.length} people:`);
for (const p of people) {
  const phones = p.phone_numbers || [];
  console.log(`  ${p.first_name} ${p.last_name} (${p.title}) | email: ${p.email || 'N'} | phones: ${phones.length > 0 ? JSON.stringify(phones.map(ph=>ph.sanitized_number)) : 'NONE'} | org: ${p.organization?.name || '?'}`);
}

// Also check credits/usage
const healthRes = await fetch('https://api.apollo.io/api/v1/auth/health', {
  headers: { 'X-Api-Key': API_KEY }
});
console.log('\nHealth:', healthRes.status, await healthRes.text());
