import { services } from "orangeslice";
import { readFileSync, writeFileSync, existsSync } from "fs";
import XLSX from "xlsx";

const INPUT = '/Users/corgi12/.eragon-joshua_augustine/media/inbound/DealScope_GPU_Operators_v2---0ec2ae53-f847-4d65-8d0c-3adecd3c03fe.xlsx';
const CHECKPOINT = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/gpu-operator-expansion/phone-checkpoint.json';
const OUTPUT_JSON = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/gpu-operator-expansion/phone-results.json';

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

console.log(`Total contacts in sheet: ${data.length}`);

// Extract contacts needing phone lookup
const contacts = data.map((row, idx) => ({
    idx,
    name: row['Contact Name'] || '',
    title: row['Contact Title'] || '',
    company: row['Company'] || '',
    email: row['Email'] || '',
    linkedin: row['LinkedIn URL'] || '',
    existingPhone: row['Direct Phone'] || '',
    companyPhone: row['Company Phone'] || '',
})).filter(c => c.name && c.name !== 'Team' && c.name !== 'Sales Team' && c.name !== 'Support Team' && c.name !== 'Sales');

console.log(`Contacts with real names: ${contacts.length}`);

const alreadyDone = new Set(Object.keys(results));
const remaining = contacts.filter(c => !alreadyDone.has(`${c.company}|${c.name}`));
console.log(`Already done: ${alreadyDone.size} | Remaining: ${remaining.length}`);

// Process in batches of 3 (person.contact.get is slow — up to 10min each)
const BATCH = 3;
let totalPhones = Object.values(results).filter(r => r.found).length;

for (let i = 0; i < remaining.length; i += BATCH) {
    const batch = remaining.slice(i, i + BATCH);
    
    const promises = batch.map(async (contact) => {
        const key = `${contact.company}|${contact.name}`;
        try {
            const nameParts = contact.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            
            const params = { required: ["phone"] };
            
            // Prefer LinkedIn URL if available
            if (contact.linkedin && contact.linkedin.startsWith('http')) {
                params.linkedinUrl = contact.linkedin;
            } else {
                params.firstName = firstName;
                params.lastName = lastName;
                params.company = contact.company;
            }
            
            console.log(`  Looking up: ${contact.name} @ ${contact.company}...`);
            const result = await services.person.contact.get(params);
            
            const allPhones = [
                ...(result.work_phones || []),
                ...(result.personal_phones || []),
                ...(result.unknown_phones || []),
            ];
            
            const allEmails = [
                ...(result.work_emails || []),
                ...(result.personal_emails || []),
            ];
            
            if (allPhones.length > 0) {
                console.log(`  ✅ ${contact.name}: ${allPhones[0]}`);
                return { key, name: contact.name, company: contact.company, found: true, phone: allPhones[0], allPhones, allEmails };
            } else {
                console.log(`  ❌ ${contact.name}: no phone found`);
                return { key, name: contact.name, company: contact.company, found: false, allEmails };
            }
        } catch (e) {
            console.log(`  ⚠️ ${contact.name}: error — ${e.message}`);
            return { key, name: contact.name, company: contact.company, found: false, error: e.message };
        }
    });

    const batchResults = await Promise.all(promises);
    
    for (const r of batchResults) {
        results[r.key] = r;
        if (r.found) totalPhones++;
    }

    const done = alreadyDone.size + i + batch.length;
    console.log(`\n[${done}/${contacts.length}] Total phones found: ${totalPhones}\n`);

    // Checkpoint every batch
    writeFileSync(CHECKPOINT, JSON.stringify(results, null, 2));
}

// Final save
writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2));
console.log(`\n=== COMPLETE ===`);
console.log(`Total contacts processed: ${Object.keys(results).length}`);
console.log(`Phones found: ${totalPhones}`);
console.log(`No phone: ${Object.keys(results).length - totalPhones}`);
console.log(`Results saved to: ${OUTPUT_JSON}`);
