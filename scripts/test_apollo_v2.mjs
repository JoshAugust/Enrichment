import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/apollo/config.json', 'utf8'));
const API_KEY = config.api_key;

// Try the old endpoint and a well-known company
const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
  body: JSON.stringify({
    organization_domains: ['stripe.com'],
    page: 1,
    per_page: 3,
    person_titles: ['CEO', 'CTO', 'Founder']
  })
});

console.log('Status:', res.status);
const data = await res.json();
const people = data.people || [];
console.log(`Found ${people.length} people at stripe.com:`);
for (const p of people) {
  const phones = p.phone_numbers || [];
  console.log(`  ${p.first_name} ${p.last_name} (${p.title}) | email: ${p.email || 'N'} | phones: ${phones.length > 0 ? JSON.stringify(phones) : 'NONE'} | org: ${p.organization?.name || '?'}`);
}
