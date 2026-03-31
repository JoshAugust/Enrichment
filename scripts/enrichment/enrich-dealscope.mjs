import { services } from "orangeslice";
import { readFileSync, writeFileSync } from "fs";

// Phase 1: company.revenue() on Grade A companies (2 credits each — cheapest enrichment)
// Phase 2: googleMaps.scrape() for company phones (10 credits/result)
// Phase 3: person.contact.get() on top contacts missing email/phone (275 credits each)

// Load company data from a JSON we'll pre-extract
const companies = JSON.parse(readFileSync("enrich-companies.json", "utf8"));

console.log(`Loaded ${companies.length} companies to enrich`);

// Phase 1: Company revenue/employee data
const revenueResults = {};
const BATCH_SIZE = 5;

console.log("\n=== PHASE 1: Company Revenue Enrichment ===");
for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (co) => {
        if (!co.website) return { company: co.name, result: null };
        try {
            const domain = co.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            const result = await services.company.revenue({ domain });
            console.log(`  ✓ ${co.name}: rev=${result.revenue}, emp=${result.employees}, funding=${result.funding}`);
            return { company: co.name, domain, result };
        } catch (e) {
            console.log(`  ✗ ${co.name}: ${e.message}`);
            return { company: co.name, result: null, error: e.message };
        }
    });
    
    const results = await Promise.all(promises);
    for (const r of results) {
        revenueResults[r.company] = r.result;
    }
    
    console.log(`  [${Math.min(i + BATCH_SIZE, companies.length)}/${companies.length}]`);
}

// Phase 2: Google Maps for phone numbers
const phoneResults = {};
console.log("\n=== PHASE 2: Google Maps Phone Lookup ===");
for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (co) => {
        if (!co.name || co.has_phone) return { company: co.name, result: null };
        try {
            const searchTerm = co.name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+(INC\.?|LLC|CORP\.?)$/i, '').trim();
            const results = await services.googleMaps.scrape({
                searchStringsArray: [searchTerm],
                countryCode: "us",
                maxCrawledPlacesPerSearch: 1,
            });
            if (results && results.length > 0 && results[0].phone) {
                console.log(`  📞 ${co.name}: ${results[0].phone}`);
                return { company: co.name, result: results[0] };
            } else {
                console.log(`  ❌ ${co.name}: no phone found`);
                return { company: co.name, result: null };
            }
        } catch (e) {
            console.log(`  ✗ ${co.name}: ${e.message}`);
            return { company: co.name, result: null, error: e.message };
        }
    });
    
    const results = await Promise.all(promises);
    for (const r of results) {
        if (r.result) phoneResults[r.company] = r.result;
    }
    
    console.log(`  [${Math.min(i + BATCH_SIZE, companies.length)}/${companies.length}]`);
}

// Save results
const output = { revenueResults, phoneResults };
writeFileSync("enrich-results.json", JSON.stringify(output, null, 2));
console.log(`\nSaved results: ${Object.keys(revenueResults).length} revenue, ${Object.keys(phoneResults).length} phones`);
console.log("Done!");
