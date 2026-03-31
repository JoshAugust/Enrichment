import { readFileSync } from "fs";

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const apolloConfig = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8'));
const APOLLO_API_KEY = apolloConfig.api_key;

// Test 1: People Search (free, no credits)
console.log("=== Test 1: People Search ===");
const searchRes = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
    body: JSON.stringify({
        person_titles: ["CEO", "CTO", "CFO", "Founder"],
        organization_domains: ["lambda.ai"],
        per_page: 5,
    }),
});
const searchData = await searchRes.json();
console.log(`Status: ${searchRes.status}`);
if (searchData.people) {
    for (const p of searchData.people.slice(0, 3)) {
        console.log(`  ${p.first_name} ${p.last_name} | ${p.title}`);
        console.log(`    phone: ${p.sanitized_phone || p.phone_number || 'none'}`);
        console.log(`    phone_numbers: ${JSON.stringify(p.phone_numbers || [])}`);
        console.log(`    email: ${p.email || 'none'}`);
    }
} else {
    console.log(JSON.stringify(searchData).slice(0, 500));
}

// Test 2: People Match with reveal via webhook simulation
console.log("\n=== Test 2: People Enrich (different endpoint) ===");
const enrichRes = await fetch('https://api.apollo.io/api/v1/people/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
    body: JSON.stringify({
        first_name: "Stephen",
        last_name: "Balaban",
        domain: "lambda.ai",
        organization_name: "Lambda Labs",
    }),
});
const enrichData = await enrichRes.json();
console.log(`Status: ${enrichRes.status}`);
if (enrichData.person) {
    const p = enrichData.person;
    console.log(`  ${p.first_name} ${p.last_name} | ${p.title}`);
    console.log(`  phone: ${p.sanitized_phone || 'none'}`);
    console.log(`  phone_numbers: ${JSON.stringify(p.phone_numbers || [])}`);
    console.log(`  email: ${p.email || 'none'}`);
} else {
    console.log(JSON.stringify(enrichData).slice(0, 500));
}

// Test 3: Bulk phone number lookup
console.log("\n=== Test 3: Phone number endpoint ===");
const phoneRes = await fetch('https://api.apollo.io/api/v1/phone_numbers/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
    body: JSON.stringify({
        person_id: searchData.people?.[0]?.id,
    }),
});
console.log(`Status: ${phoneRes.status}`);
const phoneData = await phoneRes.text();
console.log(phoneData.slice(0, 500));
