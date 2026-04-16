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

async function main() {
  const domains = new Set();
  let after = undefined;
  let batch = 0;
  
  while (true) {
    batch++;
    let path = `/crm/v3/objects/companies?limit=100&properties=domain`;
    if (after) path += `&after=${after}`;
    
    const res = await hubspotGet(path);
    
    if (!res.results || res.results.length === 0) break;
    
    for (const r of res.results) {
      const d = (r.properties.domain || '').toLowerCase().trim();
      if (d) domains.add(d);
    }
    
    if (batch % 100 === 0) {
      console.log(`Batch ${batch}: ${domains.size} domains so far...`);
    }
    
    if (res.paging && res.paging.next) {
      after = res.paging.next.after;
    } else {
      break;
    }
    
    // Rate limit respect
    if (batch % 20 === 0) await new Promise(r => setTimeout(r, 200));
  }
  
  const domainArray = [...domains].sort();
  fs.writeFileSync(OUTPUT, JSON.stringify(domainArray));
  console.log(`\nDone! ${domainArray.length} unique domains saved to ${OUTPUT}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
