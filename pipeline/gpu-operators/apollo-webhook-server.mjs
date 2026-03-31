/**
 * Apollo Phone Reveal Webhook Receiver
 * 
 * 1. Starts HTTP server to receive Apollo webhook callbacks
 * 2. Sends enrichment requests with reveal_phone_number=true + webhook_url
 * 3. Collects phone data as it arrives async
 * 4. Outputs final XLSX with only contacts that have phones
 */

import http from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import XLSX from "xlsx";

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const INPUT = '/Users/corgi12/.eragon-joshua_augustine/media/inbound/DealScope_GPU_Operators_v2---0ec2ae53-f847-4d65-8d0c-3adecd3c03fe.xlsx';
const PHONE_STORE = `${WORKSPACE}/gpu-operator-expansion/apollo-phones-received.json`;
const OUTPUT_XLSX = `${WORKSPACE}/gpu-operator-expansion/DealScope_GPU_Operators_v3.xlsx`;
const PORT = 9876;

const apolloConfig = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8'));
const APOLLO_API_KEY = apolloConfig.api_key;

// Phone data store
let phoneData = {};
if (existsSync(PHONE_STORE)) {
    phoneData = JSON.parse(readFileSync(PHONE_STORE, 'utf8'));
    console.log(`Loaded ${Object.keys(phoneData).length} existing phone records`);
}

let pendingCount = 0;
let receivedCount = 0;
let totalSent = 0;

// ── Webhook Server ──────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/apollo-phone') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                receivedCount++;
                
                // Extract phone from webhook payload
                const person = data.person || data;
                const name = [person.first_name, person.last_name].filter(Boolean).join(' ') || 'unknown';
                const org = person.organization?.name || person.organization_name || '';
                
                const phones = [
                    person.sanitized_phone,
                    person.phone_number,
                    ...(person.phone_numbers || []).map(p => p.sanitized_number || p.raw_number),
                ].filter(Boolean);

                const key = `${org}|${name}`;
                phoneData[key] = {
                    name,
                    company: org,
                    phone: phones[0] || null,
                    allPhones: phones,
                    email: person.email || null,
                    title: person.title || null,
                    linkedin: person.linkedin_url || null,
                    receivedAt: new Date().toISOString(),
                };

                if (phones.length > 0) {
                    console.log(`  📞 [${receivedCount}] ${name} @ ${org}: ${phones[0]}`);
                } else {
                    console.log(`  ❌ [${receivedCount}] ${name} @ ${org}: no phone in webhook`);
                }

                pendingCount--;
                writeFileSync(PHONE_STORE, JSON.stringify(phoneData, null, 2));

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (e) {
                console.error(`  ⚠️ Webhook parse error: ${e.message}`);
                res.writeHead(400);
                res.end('bad request');
            }
        });
    } else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ sent: totalSent, pending: pendingCount, received: receivedCount, phones: Object.values(phoneData).filter(p => p.phone).length }));
    } else {
        res.writeHead(404);
        res.end('not found');
    }
});

server.listen(PORT, () => {
    console.log(`Webhook server listening on port ${PORT}`);
    console.log(`Waiting for WEBHOOK_URL env var or --url flag...`);
});

// Get webhook URL from env or args
const WEBHOOK_URL = process.env.WEBHOOK_URL || process.argv[2];
if (!WEBHOOK_URL) {
    console.log(`\n⚠️  No WEBHOOK_URL set. Server is running — set WEBHOOK_URL and restart the sweep.`);
    console.log(`   Or run: WEBHOOK_URL=https://your-tunnel-url/apollo-phone node apollo-webhook-server.mjs`);
    // Keep server running to receive any pending callbacks
} else {
    console.log(`\nWebhook URL: ${WEBHOOK_URL}`);
    startSweep(WEBHOOK_URL);
}

async function startSweep(webhookUrl) {
    // Read XLSX
    const wb = XLSX.readFile(INPUT);
    const ws = wb.Sheets['Enriched Leads'];
    const data = XLSX.utils.sheet_to_json(ws);

    const contacts = data.map((row, idx) => ({
        idx, name: row['Contact Name'] || '', company: row['Company'] || '',
        domain: row['Website'] || '', linkedin: row['LinkedIn URL'] || '',
        existingPhone: row['Direct Phone'] || '', row,
    })).filter(c => c.name && !['Team', 'Sales Team', 'Support Team', 'Sales', 'General Contact'].includes(c.name));

    console.log(`\nTotal contacts to process: ${contacts.length}`);

    // Skip already processed
    const alreadyDone = new Set(Object.keys(phoneData));
    const remaining = contacts.filter(c => !alreadyDone.has(`${c.company}|${c.name}`));
    console.log(`Already done: ${alreadyDone.size} | Remaining: ${remaining.length}\n`);

    for (let i = 0; i < remaining.length; i++) {
        const contact = remaining[i];
        const nameParts = contact.name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        let domain = (contact.domain || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();

        const body = {
            first_name: firstName,
            last_name: lastName,
            organization_name: contact.company,
            domain: domain || undefined,
            linkedin_url: (contact.linkedin && contact.linkedin.startsWith('http')) ? contact.linkedin : undefined,
            reveal_phone_number: true,
            webhook_url: webhookUrl,
        };

        try {
            const res = await fetch('https://api.apollo.io/api/v1/people/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
                body: JSON.stringify(body),
            });

            if (res.status === 429) {
                console.log(`  ⏳ Rate limited — waiting 60s...`);
                await new Promise(r => setTimeout(r, 60000));
                i--; // retry
                continue;
            }

            const json = await res.json();
            totalSent++;
            pendingCount++;

            if (json.person) {
                // Sync data (email, title etc) comes back immediately
                const p = json.person;
                const key = `${contact.company}|${contact.name}`;
                if (!phoneData[key]) {
                    phoneData[key] = {
                        name: contact.name,
                        company: contact.company,
                        phone: null, // will arrive via webhook
                        email: p.email || null,
                        title: p.title || null,
                        linkedin: p.linkedin_url || null,
                    };
                }
                console.log(`[${i + 1}/${remaining.length}] Sent: ${contact.name} @ ${contact.company} (email: ${p.email || 'none'})`);
            } else {
                console.log(`[${i + 1}/${remaining.length}] No match: ${contact.name} @ ${contact.company}`);
                const key = `${contact.company}|${contact.name}`;
                phoneData[key] = { name: contact.name, company: contact.company, phone: null, noMatch: true };
            }

            writeFileSync(PHONE_STORE, JSON.stringify(phoneData, null, 2));

        } catch (e) {
            console.log(`  ⚠️ ${contact.name}: ${e.message}`);
        }

        // Rate limit: ~1.5 req/sec
        await new Promise(r => setTimeout(r, 700));
    }

    console.log(`\n=== ALL REQUESTS SENT ===`);
    console.log(`Total sent: ${totalSent} | Pending webhooks: ${pendingCount}`);
    console.log(`Waiting for remaining webhook callbacks... (will auto-build XLSX after 2 min of silence)\n`);

    // Wait for webhooks to come in, then build XLSX
    let lastReceived = Date.now();
    const checkInterval = setInterval(() => {
        if (pendingCount <= 0 || (Date.now() - lastReceived > 120000 && receivedCount > 0)) {
            clearInterval(checkInterval);
            buildOutputXlsx(contacts);
        }
        // Update lastReceived
        if (receivedCount > 0) lastReceived = Date.now();
    }, 5000);
}

function buildOutputXlsx(contacts) {
    console.log(`\n=== BUILDING OUTPUT XLSX ===`);

    const outputRows = [];
    let phonesFound = 0;

    for (const contact of contacts) {
        const key = `${contact.company}|${contact.name}`;
        const r = phoneData[key];
        const phone = r?.phone || contact.existingPhone || null;

        if (!phone) continue;

        const row = { ...contact.row };
        if (r?.phone) row['Direct Phone'] = r.phone;
        if (r?.email && !row['Email']) row['Email'] = r.email;
        if (r?.title) row['Contact Title'] = r.title;
        if (r?.linkedin && !row['LinkedIn URL']) row['LinkedIn URL'] = r.linkedin;

        outputRows.push(row);
        phonesFound++;
    }

    console.log(`Contacts WITH phones: ${phonesFound} / ${contacts.length}`);
    console.log(`Removed (no phone): ${contacts.length - phonesFound}`);

    const newWb = XLSX.utils.book_new();
    const newWs = XLSX.utils.json_to_sheet(outputRows);
    XLSX.utils.book_append_sheet(newWb, newWs, 'Enriched Leads');
    XLSX.writeFile(newWb, OUTPUT_XLSX);

    console.log(`\n✅ Output: ${OUTPUT_XLSX}`);
    console.log(`Server staying alive for any late webhooks. Ctrl+C to stop.`);
}
