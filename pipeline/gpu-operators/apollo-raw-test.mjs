import http from "http";
import { readFileSync, writeFileSync } from "fs";

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const apolloConfig = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, 'utf8'));
const APOLLO_API_KEY = apolloConfig.api_key;
const PORT = 9876;

const RAW_LOG = `${WORKSPACE}/gpu-operator-expansion/webhook-raw-payloads.json`;
const payloads = [];

// Simple webhook server that logs raw payloads
const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                payloads.push({ url: req.url, headers: req.headers, body: data, at: new Date().toISOString() });
                writeFileSync(RAW_LOG, JSON.stringify(payloads, null, 2));
                console.log(`\n📥 WEBHOOK RECEIVED (${payloads.length}):`);
                console.log(JSON.stringify(data, null, 2).slice(0, 2000));
                res.writeHead(200);
                res.end('ok');
            } catch (e) {
                console.log(`Parse error: ${e.message}, raw: ${body.slice(0, 500)}`);
                res.writeHead(400);
                res.end('bad');
            }
        });
    } else {
        res.writeHead(200);
        res.end('alive');
    }
});

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

const WEBHOOK_URL = process.env.WEBHOOK_URL;
console.log(`Webhook URL: ${WEBHOOK_URL}`);

// Send just 2 test requests
const testContacts = [
    { first_name: "Stephen", last_name: "Balaban", organization_name: "Lambda Labs", domain: "lambda.ai" },
    { first_name: "Chase", last_name: "Lochmiller", organization_name: "Crusoe Energy Systems", domain: "crusoe.ai" },
];

for (const c of testContacts) {
    console.log(`\nSending: ${c.first_name} ${c.last_name} @ ${c.organization_name}`);
    
    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': APOLLO_API_KEY },
        body: JSON.stringify({
            ...c,
            reveal_phone_number: true,
            webhook_url: WEBHOOK_URL,
        }),
    });
    
    const json = await res.json();
    console.log(`Response status: ${res.status}`);
    console.log(`Sync response person keys: ${json.person ? Object.keys(json.person).join(', ') : 'no person'}`);
    if (json.person) {
        console.log(`  phone fields: sanitized_phone=${json.person.sanitized_phone}, phone_numbers=${JSON.stringify(json.person.phone_numbers)}`);
        console.log(`  has_direct_phone: ${json.person.has_direct_phone}`);
    }
    console.log(`Full sync response (trimmed): ${JSON.stringify(json).slice(0, 1000)}`);
    
    await new Promise(r => setTimeout(r, 2000));
}

console.log(`\n=== All sent. Waiting 60s for webhook callbacks... ===`);
await new Promise(r => setTimeout(r, 60000));
console.log(`\nReceived ${payloads.length} webhooks. Raw log: ${RAW_LOG}`);
process.exit(0);
