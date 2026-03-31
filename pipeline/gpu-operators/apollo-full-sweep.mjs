/**
 * Apollo Phone Reveal — Full Sweep
 * Webhook-based: sends enrichment requests, collects phone numbers async
 */

import http from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import XLSX from "xlsx";

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const INPUT = '/Users/corgi12/.eragon-joshua_augustine/media/inbound/DealScope_GPU_Operators_v2---0ec2ae53-f847-4d65-8d0c-3adecd3c03fe.xlsx';
const CHECKPOINT = `${WORKSPACE}/gpu-operator-expansion/apollo-sweep-checkpoint.json`;
const OUTPUT_XLSX = `${WORKSPACE}/gpu-operator-expansion/DealScope_GPU_Operators_v3.xlsx`;
const PORT = 9876;

const apolloConfig = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8'));
const APOLLO_API_KEY = apolloConfig.api_key;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!WEBHOOK_URL) { console.error('WEBHOOK_URL required'); process.exit(1); }

// State
let checkpoint = { sent: {}, phones: {}, emails: {} };
if (existsSync(CHECKPOINT)) {
    checkpoint = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
    console.log(`Resumed: ${Object.keys(checkpoint.sent).length} sent, ${Object.keys(checkpoint.phones).length} phones received`);
}

let webhooksReceived = 0;
let pendingWebhooks = 0;

// ── Read spreadsheet ────────────────────────────────────────────────────────
const wb = XLSX.readFile(INPUT);
const ws = wb.Sheets['Enriched Leads'];
const allRows = XLSX.utils.sheet_to_json(ws);

const contacts = allRows.map((row, idx) => ({
    idx, name: row['Contact Name'] || '', company: row['Company'] || '',
    domain: row['Website'] || '', linkedin: row['LinkedIn URL'] || '',
    existingPhone: row['Direct Phone'] || '', email: row['Email'] || '',
    row,
})).filter(c => c.name && !['Team', 'Sales Team', 'Support Team', 'Sales', 'General Contact'].includes(c.name));

console.log(`Total contacts: ${contacts.length}`);

// Map Apollo person IDs back to our contact keys
const apolloIdToKey = {};

// ── Webhook server ──────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
    if (req.method !== 'POST') { res.writeHead(200); res.end('ok'); return; }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            webhooksReceived++;

            for (const person of (data.people || [])) {
                const key = apolloIdToKey[person.id];
                if (!key) {
                    console.log(`  ⚠️ Unknown Apollo ID: ${person.id}`);
                    continue;
                }

                pendingWebhooks--;

                if (person.status === 'success' && person.phone_numbers?.length > 0) {
                    const best = person.phone_numbers.find(p => p.confidence_cd === 'high') || person.phone_numbers[0];
                    checkpoint.phones[key] = {
                        phone: best.sanitized_number || best.raw_number,
                        type: best.type_cd,
                        confidence: best.confidence_cd,
                        allPhones: person.phone_numbers.map(p => p.sanitized_number || p.raw_number),
                    };
                    const name = key.split('|')[1];
                    console.log(`  📞 ${name}: ${best.sanitized_number} (${best.type_cd}, ${best.confidence_cd})`);
                } else {
                    const name = key.split('|')[1];
                    console.log(`  ❌ ${name}: no phone (${person.status})`);
                }
            }

            saveCheckpoint();
            res.writeHead(200);
            res.end('ok');
        } catch (e) {
            console.error(`Webhook error: ${e.message}`);
            res.writeHead(400);
            res.end('error');
        }
    });
});

function saveCheckpoint() {
    writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
}

server.listen(PORT, async () => {
    console.log(`Webhook server on port ${PORT}`);
    console.log(`Webhook URL: ${WEBHOOK_URL}\n`);
    await runSweep();
});

async function runSweep() {
    const remaining = contacts.filter(c => !checkpoint.sent[`${c.company}|${c.name}`]);
    console.log(`Already sent: ${Object.keys(checkpoint.sent).length} | Remaining: ${remaining.length}\n`);

    for (let i = 0; i < remaining.length; i++) {
        const c = remaining[i];
        const key = `${c.company}|${c.name}`;
        const nameParts = c.name.trim().split(/\s+/);
        const domain = (c.domain || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();

        const body = {
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' '),
            organization_name: c.company,
            domain: domain || undefined,
            linkedin_url: (c.linkedin?.startsWith('http')) ? c.linkedin : undefined,
            reveal_phone_number: true,
            webhook_url: WEBHOOK_URL,
        };

        try {
            const res = await fetch('https://api.apollo.io/api/v1/people/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
                body: JSON.stringify(body),
            });

            if (res.status === 429) {
                console.log(`⏳ Rate limited — waiting 60s...`);
                await new Promise(r => setTimeout(r, 60000));
                i--;
                continue;
            }

            const json = await res.json();

            if (json.person) {
                apolloIdToKey[json.person.id] = key;
                checkpoint.sent[key] = { apolloId: json.person.id, email: json.person.email || null };
                if (json.person.email) checkpoint.emails[key] = json.person.email;
                pendingWebhooks++;
                console.log(`[${Object.keys(checkpoint.sent).length}/${contacts.length}] ${c.name} @ ${c.company} — email: ${json.person.email || 'none'}`);
            } else {
                checkpoint.sent[key] = { noMatch: true };
                console.log(`[${Object.keys(checkpoint.sent).length}/${contacts.length}] ${c.name} @ ${c.company} — NO MATCH`);
            }

            if (Object.keys(checkpoint.sent).length % 10 === 0) saveCheckpoint();

        } catch (e) {
            console.log(`⚠️ ${c.name}: ${e.message}`);
            checkpoint.sent[key] = { error: e.message };
        }

        await new Promise(r => setTimeout(r, 800));
    }

    saveCheckpoint();
    console.log(`\n=== ALL ${contacts.length} REQUESTS SENT ===`);
    console.log(`Phones received so far: ${Object.keys(checkpoint.phones).length}`);
    console.log(`Pending webhooks: ~${pendingWebhooks}`);
    console.log(`Waiting 90s for remaining callbacks...\n`);

    await new Promise(r => setTimeout(r, 90000));

    // Build final XLSX
    buildOutput();
}

function buildOutput() {
    console.log(`\n=== BUILDING FINAL XLSX ===`);
    const phonesFromApollo = Object.keys(checkpoint.phones).length;
    console.log(`Apollo phones received: ${phonesFromApollo}`);
    console.log(`Apollo emails received: ${Object.keys(checkpoint.emails).length}`);

    const outputRows = [];
    for (const c of contacts) {
        const key = `${c.company}|${c.name}`;
        const apolloPhone = checkpoint.phones[key]?.phone;
        const apolloEmail = checkpoint.emails[key];
        const phone = apolloPhone || c.existingPhone || null;

        if (!phone) continue; // Remove contacts without phone

        const row = { ...c.row };
        if (apolloPhone) row['Direct Phone'] = apolloPhone;
        if (apolloEmail && !row['Email']) row['Email'] = apolloEmail;

        outputRows.push(row);
    }

    console.log(`\nContacts WITH phone: ${outputRows.length} / ${contacts.length}`);
    console.log(`Removed (no phone): ${contacts.length - outputRows.length}`);

    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.json_to_sheet(outputRows);
    XLSX.utils.book_append_sheet(newWb, newWs, 'Enriched Leads');
    XLSX.writeFile(newWb, OUTPUT_XLSX);

    console.log(`\n✅ Saved: ${OUTPUT_XLSX}`);
    process.exit(0);
}
