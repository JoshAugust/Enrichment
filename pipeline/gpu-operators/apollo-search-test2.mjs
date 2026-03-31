import { readFileSync } from "fs";

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const apolloConfig = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8'));
const APOLLO_API_KEY = apolloConfig.api_key;

// Test: mixed_people/api_search (the current endpoint)
console.log("=== People API Search ===");
const searchRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
    body: JSON.stringify({
        person_titles: ["CEO", "CTO", "CFO", "Founder", "Co-Founder"],
        organization_domains: ["lambda.ai"],
        per_page: 5,
    }),
});
const data = await searchRes.json();
console.log(`Status: ${searchRes.status}`);
if (data.people) {
    for (const p of data.people.slice(0, 5)) {
        console.log(`\n  ${p.first_name} ${p.last_name} | ${p.title}`);
        console.log(`    sanitized_phone: ${p.sanitized_phone || 'none'}`);
        console.log(`    phone_number: ${JSON.stringify(p.phone_number || 'none')}`);
        console.log(`    phone_numbers: ${JSON.stringify(p.phone_numbers || [])}`);
        console.log(`    email: ${p.email || 'none'}`);
        console.log(`    organization: ${p.organization?.name || 'none'}`);
        // Print all keys that have 'phone' in them
        const phoneKeys = Object.keys(p).filter(k => k.toLowerCase().includes('phone'));
        console.log(`    phone-related keys: ${JSON.stringify(phoneKeys)}`);
    }
} else {
    console.log(JSON.stringify(data).slice(0, 500));
}

// Also test: bulk people enrich
console.log("\n=== Bulk People Enrich ===");
const bulkRes = await fetch('https://api.apollo.io/api/v1/people/bulk_match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
    body: JSON.stringify({
        reveal_phone_number: false,
        details: [
            { first_name: "Stephen", last_name: "Balaban", domain: "lambda.ai" },
            { first_name: "Chase", last_name: "Lochmiller", domain: "crusoe.ai" },
        ]
    }),
});
console.log(`Status: ${bulkRes.status}`);
const bulkData = await bulkRes.json();
if (bulkData.matches) {
    for (const m of bulkData.matches) {
        const p = m;
        console.log(`  ${p.first_name} ${p.last_name} | phone: ${p.sanitized_phone || 'none'} | phone_numbers: ${JSON.stringify(p.phone_numbers || [])}`);
    }
} else {
    console.log(JSON.stringify(bulkData).slice(0, 500));
}
