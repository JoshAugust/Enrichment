import { readFileSync, writeFileSync, existsSync } from "fs";
import XLSX from "xlsx";

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const INPUT = '/Users/corgi12/.eragon-joshua_augustine/media/inbound/DealScope_GPU_Operators_v2---0ec2ae53-f847-4d65-8d0c-3adecd3c03fe.xlsx';
const CHECKPOINT = `${WORKSPACE}/gpu-operator-expansion/apollo-phone-checkpoint.json`;
const OUTPUT_JSON = `${WORKSPACE}/gpu-operator-expansion/apollo-phone-results.json`;
const OUTPUT_XLSX = `${WORKSPACE}/gpu-operator-expansion/DealScope_GPU_Operators_v3.xlsx`;

// Load Apollo API key from config
const apolloConfig = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8'));
const APOLLO_API_KEY = apolloConfig.api_key;
const APOLLO_BASE = 'https://api.apollo.io/api/v1';

console.log(`Apollo API key loaded: ${APOLLO_API_KEY.slice(0, 6)}...`);

// Load checkpoint
let results = {};
if (existsSync(CHECKPOINT)) {
    results = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
    console.log(`Resuming from checkpoint: ${Object.keys(results).length} already done`);
}

// Read XLSX
const wb = XLSX.readFile(INPUT);
const ws = wb.Sheets['Enriched Leads'];
const data = XLSX.utils.sheet_to_json(ws);
console.log(`Total rows in sheet: ${data.length}`);

// Extract real contacts (not generic team entries)
const contacts = data.map((row, idx) => ({
    idx,
    name: row['Contact Name'] || '',
    title: row['Contact Title'] || '',
    company: row['Company'] || '',
    domain: row['Website'] || '',
    email: row['Email'] || '',
    linkedin: row['LinkedIn URL'] || '',
    existingPhone: row['Direct Phone'] || '',
    companyPhone: row['Company Phone'] || '',
    row, // keep original row for output
})).filter(c => c.name && !['Team', 'Sales Team', 'Support Team', 'Sales', 'General Contact'].includes(c.name));

console.log(`Contacts with real names: ${contacts.length}`);

// Apollo People Match — 1 credit per call, returns email + phone
async function apolloEnrichPerson(contact) {
    const nameParts = contact.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');
    
    // Clean domain
    let domain = (contact.domain || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
    
    const body = {
        first_name: firstName,
        last_name: lastName,
        organization_name: contact.company,
        domain: domain || undefined,
        linkedin_url: (contact.linkedin && contact.linkedin.startsWith('http')) ? contact.linkedin : undefined,
        reveal_personal_emails: false,
        reveal_phone_number: false,
    };

    const res = await fetch(`${APOLLO_BASE}/people/match`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'x-api-key': APOLLO_API_KEY,
        },
        body: JSON.stringify(body),
    });

    if (res.status === 429) {
        console.log(`  ⏳ Rate limited — waiting 60s...`);
        await new Promise(r => setTimeout(r, 60000));
        return apolloEnrichPerson(contact); // retry
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    return json.person || null;
}

// Process contacts
const alreadyDone = new Set(Object.keys(results));
const remaining = contacts.filter(c => !alreadyDone.has(`${c.company}|${c.name}`));
console.log(`Already done: ${alreadyDone.size} | Remaining: ${remaining.length}\n`);

let phonesFound = Object.values(results).filter(r => r.phone).length;

for (let i = 0; i < remaining.length; i++) {
    const contact = remaining[i];
    const key = `${contact.company}|${contact.name}`;

    try {
        console.log(`[${alreadyDone.size + i + 1}/${contacts.length}] ${contact.name} @ ${contact.company}...`);
        const person = await apolloEnrichPerson(contact);

        if (person) {
            const phones = [
                person.sanitized_phone,
                person.phone_number,
                ...(person.phone_numbers || []).map(p => p.sanitized_number || p.raw_number),
            ].filter(Boolean);

            const emails = [
                person.email,
                ...(person.personal_emails || []),
            ].filter(Boolean);

            if (phones.length > 0) {
                phonesFound++;
                console.log(`  ✅ Phone: ${phones[0]}`);
            } else {
                console.log(`  ❌ No phone`);
            }

            results[key] = {
                name: contact.name,
                company: contact.company,
                phone: phones[0] || null,
                allPhones: phones,
                email: emails[0] || null,
                allEmails: emails,
                title: person.title || contact.title,
                linkedin: person.linkedin_url || contact.linkedin,
            };
        } else {
            console.log(`  ❌ No match in Apollo`);
            results[key] = { name: contact.name, company: contact.company, phone: null, allPhones: [], allEmails: [] };
        }
    } catch (e) {
        console.log(`  ⚠️ Error: ${e.message}`);
        results[key] = { name: contact.name, company: contact.company, phone: null, error: e.message };
    }

    // Checkpoint every 5
    if ((i + 1) % 5 === 0) {
        writeFileSync(CHECKPOINT, JSON.stringify(results, null, 2));
        console.log(`  [checkpoint saved — ${phonesFound} phones found so far]\n`);
    }

    // Rate limit: ~1 req/sec to stay safe
    await new Promise(r => setTimeout(r, 1200));
}

// Final save
writeFileSync(CHECKPOINT, JSON.stringify(results, null, 2));
writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));

console.log(`\n=== APOLLO SWEEP COMPLETE ===`);
console.log(`Total processed: ${Object.keys(results).length}`);
console.log(`Phones found: ${phonesFound}`);
console.log(`No phone: ${Object.keys(results).length - phonesFound}`);

// Now build the output XLSX — only contacts WITH phones
console.log(`\nBuilding filtered XLSX (phone-only)...`);

const outputRows = [];
for (const contact of contacts) {
    const key = `${contact.company}|${contact.name}`;
    const r = results[key];
    
    // Use Apollo phone if found, else existing phone
    const phone = r?.phone || contact.existingPhone || null;
    
    if (!phone) continue; // SKIP contacts without any phone

    const row = { ...contact.row };
    // Update with Apollo data
    if (r?.phone) row['Direct Phone'] = r.phone;
    if (r?.allEmails?.length > 0 && !row['Email']) row['Email'] = r.allEmails[0];
    if (r?.title) row['Contact Title'] = r.title;
    if (r?.linkedin && !row['LinkedIn URL']) row['LinkedIn URL'] = r.linkedin;
    
    outputRows.push(row);
}

console.log(`Contacts with phones: ${outputRows.length} / ${contacts.length}`);
console.log(`Removed (no phone): ${contacts.length - outputRows.length}`);

// Write XLSX
const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.json_to_sheet(outputRows);
XLSX.utils.book_append_sheet(newWb, newWs, 'Enriched Leads');
XLSX.writeFile(newWb, OUTPUT_XLSX);
console.log(`\nOutput saved: ${OUTPUT_XLSX}`);
