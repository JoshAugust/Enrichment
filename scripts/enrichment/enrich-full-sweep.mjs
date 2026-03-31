import { services } from "orangeslice";
import { readFileSync, writeFileSync, existsSync } from "fs";

// ============================================================
// PHASE 1: Google Maps phone sweep — ALL remaining companies
// ============================================================
const companies = JSON.parse(readFileSync("enrich-all-phones.json", "utf8"));
const BATCH = 10;

// Resume from checkpoint if exists
let phoneResults = {};
if (existsSync("sweep-phones-checkpoint.json")) {
    phoneResults = JSON.parse(readFileSync("sweep-phones-checkpoint.json", "utf8"));
    console.log(`Resuming from checkpoint: ${Object.keys(phoneResults).length} already done`);
}

const alreadyDone = new Set(Object.keys(phoneResults));
const remaining = companies.filter(c => !alreadyDone.has(c.name));

console.log(`\n=== PHASE 1: Google Maps Phone Sweep ===`);
console.log(`Total: ${companies.length} | Already done: ${alreadyDone.size} | Remaining: ${remaining.length}`);

for (let i = 0; i < remaining.length; i += BATCH) {
    const batch = remaining.slice(i, i + BATCH);
    const promises = batch.map(async (co) => {
        try {
            const searchTerm = co.name
                .replace(/\s*\(.*?\)\s*/g, ' ')
                .replace(/\s+(INC\.?|LLC|CORP\.?|CORPORATION|LTD\.?|CO\.?)$/i, '')
                .trim();
            const results = await services.googleMaps.scrape({
                searchStringsArray: [searchTerm],
                countryCode: "us",
                maxCrawledPlacesPerSearch: 1,
            });
            if (results?.[0]?.phone) {
                return { name: co.name, phone: results[0].phone, address: results[0].address, found: true };
            }
            return { name: co.name, found: false };
        } catch (e) {
            return { name: co.name, found: false, error: e.message };
        }
    });

    const results = await Promise.all(promises);
    let batchFound = 0;
    for (const r of results) {
        phoneResults[r.name] = r;
        if (r.found) batchFound++;
    }

    const done = alreadyDone.size + i + batch.length;
    const totalFound = Object.values(phoneResults).filter(r => r.found).length;
    console.log(`  [${done}/${companies.length}] batch: +${batchFound} | total phones: ${totalFound}`);

    // Checkpoint every 50
    if ((i + BATCH) % 50 === 0) {
        writeFileSync("sweep-phones-checkpoint.json", JSON.stringify(phoneResults, null, 2));
    }
}

writeFileSync("sweep-phones-checkpoint.json", JSON.stringify(phoneResults, null, 2));
const totalPhones = Object.values(phoneResults).filter(r => r.found).length;
console.log(`\nPhase 1 complete: ${totalPhones} phones found out of ${companies.length} companies`);

// ============================================================
// PHASE 2: person.contact.get — contacts WITH LinkedIn URLs
// ============================================================
const contactsLI = JSON.parse(readFileSync("enrich-contacts-li.json", "utf8"));

let contactResults = {};
if (existsSync("sweep-contacts-checkpoint.json")) {
    contactResults = JSON.parse(readFileSync("sweep-contacts-checkpoint.json", "utf8"));
    console.log(`Resuming contacts from checkpoint: ${Object.keys(contactResults).length} already done`);
}

const contactsDone = new Set(Object.keys(contactResults));
const contactsRemaining = contactsLI.filter(c => !contactsDone.has(c.name));

console.log(`\n=== PHASE 2: Contact Enrichment (LinkedIn) ===`);
console.log(`Total: ${contactsLI.length} | Already done: ${contactsDone.size} | Remaining: ${contactsRemaining.length}`);

// Run 3 at a time (these take ~10min each)
const CONTACT_BATCH = 3;
for (let i = 0; i < contactsRemaining.length; i += CONTACT_BATCH) {
    const batch = contactsRemaining.slice(i, i + CONTACT_BATCH);
    const promises = batch.map(async (contact) => {
        try {
            const required = [];
            if (contact.needs_email) required.push("email");
            if (contact.needs_phone) required.push("phone");
            if (required.length === 0) required.push("email", "phone");

            const result = await services.person.contact.get({
                linkedinUrl: contact.linkedin,
                required,
            });

            const emails = [...(result.work_emails || []), ...(result.personal_emails || [])];
            const phones = [...(result.work_phones || []), ...(result.personal_phones || []), ...(result.unknown_phones || [])];

            console.log(`  ✓ ${contact.name}: ${emails.length} emails, ${phones.length} phones`);
            return { name: contact.name, company: contact.company, emails, phones, found: emails.length > 0 || phones.length > 0 };
        } catch (e) {
            console.log(`  ✗ ${contact.name}: ${e.message}`);
            return { name: contact.name, company: contact.company, found: false, error: e.message };
        }
    });

    const results = await Promise.all(promises);
    for (const r of results) {
        contactResults[r.name] = r;
    }

    const done = contactsDone.size + i + batch.length;
    const found = Object.values(contactResults).filter(r => r.found).length;
    console.log(`  [${done}/${contactsLI.length}] contacts enriched: ${found}`);

    // Checkpoint every batch
    writeFileSync("sweep-contacts-checkpoint.json", JSON.stringify(contactResults, null, 2));
}

// ============================================================
// PHASE 3: person.contact.get — top contacts WITHOUT LinkedIn
// ============================================================
const contactsNoLI = JSON.parse(readFileSync("enrich-contacts-noli.json", "utf8"));

let contactNoLIResults = {};
if (existsSync("sweep-contacts-noli-checkpoint.json")) {
    contactNoLIResults = JSON.parse(readFileSync("sweep-contacts-noli-checkpoint.json", "utf8"));
    console.log(`Resuming no-LI contacts: ${Object.keys(contactNoLIResults).length} already done`);
}

const noliDone = new Set(Object.keys(contactNoLIResults));
const noliRemaining = contactsNoLI.filter(c => !noliDone.has(c.name));

console.log(`\n=== PHASE 3: Contact Enrichment (Name+Company) ===`);
console.log(`Total: ${contactsNoLI.length} | Already done: ${noliDone.size} | Remaining: ${noliRemaining.length}`);

for (let i = 0; i < noliRemaining.length; i += CONTACT_BATCH) {
    const batch = noliRemaining.slice(i, i + CONTACT_BATCH);
    const promises = batch.map(async (contact) => {
        try {
            const result = await services.person.contact.get({
                firstName: contact.firstName,
                lastName: contact.lastName,
                company: contact.company,
                required: ["email", "phone"],
            });

            const emails = [...(result.work_emails || []), ...(result.personal_emails || [])];
            const phones = [...(result.work_phones || []), ...(result.personal_phones || []), ...(result.unknown_phones || [])];

            console.log(`  ✓ ${contact.name} @ ${contact.company}: ${emails.length} emails, ${phones.length} phones`);
            return { name: contact.name, company: contact.company, emails, phones, found: emails.length > 0 || phones.length > 0 };
        } catch (e) {
            console.log(`  ✗ ${contact.name}: ${e.message}`);
            return { name: contact.name, company: contact.company, found: false, error: e.message };
        }
    });

    const results = await Promise.all(promises);
    for (const r of results) {
        contactNoLIResults[r.name] = r;
    }

    const done = noliDone.size + i + batch.length;
    const found = Object.values(contactNoLIResults).filter(r => r.found).length;
    console.log(`  [${done}/${contactsNoLI.length}] contacts enriched: ${found}`);

    writeFileSync("sweep-contacts-noli-checkpoint.json", JSON.stringify(contactNoLIResults, null, 2));
}

// ============================================================
// FINAL SUMMARY
// ============================================================
console.log(`\n${"=".repeat(60)}`);
console.log("ENRICHMENT COMPLETE");
console.log(`${"=".repeat(60)}`);
console.log(`Phones (Google Maps): ${totalPhones}/${companies.length} companies`);
console.log(`Contacts (LinkedIn): ${Object.values(contactResults).filter(r=>r.found).length}/${contactsLI.length}`);
console.log(`Contacts (Name+Co): ${Object.values(contactNoLIResults).filter(r=>r.found).length}/${contactsNoLI.length}`);

// Save final combined results
writeFileSync("sweep-final-results.json", JSON.stringify({
    phones: phoneResults,
    contactsLI: contactResults,
    contactsNoLI: contactNoLIResults,
    timestamp: new Date().toISOString(),
}, null, 2));
console.log("\nAll results saved to sweep-final-results.json");
