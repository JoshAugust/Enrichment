import { services } from "orangeslice";
import { readFileSync, writeFileSync } from "fs";

const noPhone = JSON.parse(readFileSync("lender-enrich-phones.json", "utf8"));
const contactsLI = JSON.parse(readFileSync("lender-enrich-contacts-li.json", "utf8"));

// === PHASE 1: Google Maps phones ===
console.log(`=== PHASE 1: Google Maps (${noPhone.length} companies) ===`);
const phoneResults = {};
const BATCH = 10;

for (let i = 0; i < noPhone.length; i += BATCH) {
    const batch = noPhone.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (co) => {
        try {
            const search = co.name.replace(/\s*\(.*?\)/g, '').replace(/\s+(INC\.?|LLC|LP|CORP\.?)$/i, '').trim();
            const r = await services.googleMaps.scrape({ searchStringsArray: [search], countryCode: "us", maxCrawledPlacesPerSearch: 1 });
            if (r?.[0]?.phone) { console.log(`  📞 ${co.name}: ${r[0].phone}`); return { name: co.name, phone: r[0].phone, found: true }; }
            return { name: co.name, found: false };
        } catch (e) { return { name: co.name, found: false }; }
    }));
    for (const r of results) phoneResults[r.name] = r;
    console.log(`  [${Math.min(i+BATCH, noPhone.length)}/${noPhone.length}] phones: ${Object.values(phoneResults).filter(r=>r.found).length}`);
}

const phonesFound = Object.values(phoneResults).filter(r => r.found).length;
console.log(`\nPhase 1 done: ${phonesFound} phones from ${noPhone.length} companies`);

// === PHASE 2: Contact enrichment (LinkedIn) ===
console.log(`\n=== PHASE 2: Contact Enrichment (${contactsLI.length} contacts) ===`);
const contactResults = {};
const CB = 3;

for (let i = 0; i < contactsLI.length; i += CB) {
    const batch = contactsLI.slice(i, i + CB);
    const results = await Promise.all(batch.map(async (c) => {
        try {
            const required = [];
            if (c.needs_email) required.push("email");
            if (c.needs_phone) required.push("phone");
            if (!required.length) required.push("email", "phone");
            const r = await services.person.contact.get({ linkedinUrl: c.linkedin, required });
            const emails = [...(r.work_emails||[]), ...(r.personal_emails||[])];
            const phones = [...(r.work_phones||[]), ...(r.personal_phones||[]), ...(r.unknown_phones||[])];
            console.log(`  ✓ ${c.name}: ${emails.length} emails, ${phones.length} phones`);
            return { name: c.name, company: c.company, emails, phones, found: emails.length>0 || phones.length>0 };
        } catch (e) {
            console.log(`  ✗ ${c.name}: ${e.message}`);
            return { name: c.name, company: c.company, found: false };
        }
    }));
    for (const r of results) contactResults[r.name] = r;
    const done = Math.min(i+CB, contactsLI.length);
    const found = Object.values(contactResults).filter(r=>r.found).length;
    console.log(`  [${done}/${contactsLI.length}] enriched: ${found}`);
    writeFileSync("lender-contacts-checkpoint.json", JSON.stringify(contactResults, null, 2));
}

const contactsFound = Object.values(contactResults).filter(r=>r.found).length;
const totalEmails = Object.values(contactResults).reduce((s,v) => s + (v.emails?.length||0), 0);
const totalPhones = Object.values(contactResults).reduce((s,v) => s + (v.phones?.length||0), 0);

console.log(`\n${"=".repeat(50)}`);
console.log("LENDER ENRICHMENT COMPLETE");
console.log(`${"=".repeat(50)}`);
console.log(`Company phones: ${phonesFound}/${noPhone.length}`);
console.log(`Contact enrichment: ${contactsFound}/${contactsLI.length} (${totalEmails} emails, ${totalPhones} phones)`);

writeFileSync("lender-sweep-results.json", JSON.stringify({ phones: phoneResults, contacts: contactResults, timestamp: new Date().toISOString() }, null, 2));
console.log("Saved to lender-sweep-results.json");
