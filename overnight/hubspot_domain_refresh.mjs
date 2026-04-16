import https from 'https';
import fs from 'fs';

const TOKEN = 'process.env.HUBSPOT_TOKEN';
const OUTPUT = 'jordan.ai/overnight/shared/hubspot_domains_current.json';

function hubspotGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.hubapi.com${path}`);
    const req = https.request(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(data); } });
    });
    req.on('error', reject);
    req.end();
  });
}

function hubspotPost(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.hubapi.com${path}`);
    const payload = JSON.stringify(body);
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(data); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const domains = new Set();
  let after = undefined;
  let batch = 0;
  
  while (true) {
    batch++;
    const body = {
      properties: ['domain'],
      limit: 100,
    };
    if (after) body.after = after;
    
    const res = await hubspotPost('/crm/v3/objects/companies/search', {
      filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'HAS_PROPERTY' }] }],
      properties: ['domain'],
      limit: 100,
      after: after || 0
    });
    
    if (!res.results || res.results.length === 0) break;
    
    for (const r of res.results) {
      const d = (r.properties.domain || '').toLowerCase().trim();
      if (d) domains.add(d);
    }
    
    if (batch % 50 === 0) {
      console.log(`Batch ${batch}: ${domains.size} domains so far...`);
    }
    
    if (res.paging && res.paging.next) {
      after = res.paging.next.after;
    } else {
      break;
    }
    
    // Small delay to avoid rate limits
    if (batch % 10 === 0) await new Promise(r => setTimeout(r, 100));
  }
  
  const domainArray = [...domains].sort();
  fs.writeFileSync(OUTPUT, JSON.stringify(domainArray, null, 0));
  console.log(`\nDone! ${domainArray.length} unique domains saved to ${OUTPUT}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
