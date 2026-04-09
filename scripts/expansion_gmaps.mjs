import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse } from 'csv-parse/sync';

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const INPUT = `${WORKSPACE}/jordan.ai/pipeline/expansion_batch.csv`;
const CHECKPOINT = `${WORKSPACE}/jordan.ai/pipeline/expansion_gmaps_checkpoint.json`;
const OUTPUT = `${WORKSPACE}/jordan.ai/pipeline/expansion_gmaps_results.json`;

const config = JSON.parse(readFileSync(`${WORKSPACE}/.config/google-maps/config.json`));
const API_KEY = config.api_key;

const csvData = readFileSync(INPUT, 'utf8');
const rows = parse(csvData, { columns: true });

// Load checkpoint
let checkpoint = { processed: 0, results: {} };
if (existsSync(CHECKPOINT)) {
  checkpoint = JSON.parse(readFileSync(CHECKPOINT, 'utf8'));
  console.log(`Resuming from checkpoint: ${checkpoint.processed}`);
}

async function searchPhone(companyName, domain) {
  const query = `${companyName} ${domain}`;
  const url = 'https://places.googleapis.com/v1/places:searchText';
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.nationalPhoneNumber,places.internationalPhoneNumber,places.types,places.formattedAddress'
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 1 })
  });
  const d = await r.json();
  const place = d.places?.[0];
  if (!place) return null;
  return {
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
    types: place.types || [],
    name: place.displayName?.text || '',
    address: place.formattedAddress || ''
  };
}

async function run() {
  let found = 0;
  for (let i = checkpoint.processed; i < rows.length; i++) {
    const row = rows[i];
    const domain = (row.Domain || '').trim().toLowerCase();
    const name = row['Company Name'] || '';

    if (checkpoint.results[domain]) continue;

    try {
      const result = await searchPhone(name, domain);
      checkpoint.results[domain] = result || { phone: null };
      if (result?.phone) found++;
    } catch (e) {
      checkpoint.results[domain] = { phone: null, error: e.message };
    }

    checkpoint.processed = i + 1;
    if ((i + 1) % 200 === 0) {
      writeFileSync(CHECKPOINT, JSON.stringify(checkpoint));
      writeFileSync(OUTPUT, JSON.stringify(checkpoint.results, null, 2));
      const withPhone = Object.values(checkpoint.results).filter(r => r.phone).length;
      console.log(`${i + 1}/${rows.length} checked — ${withPhone} phones found`);
    }

    await new Promise(r => setTimeout(r, 200)); // rate limit
  }

  writeFileSync(CHECKPOINT, JSON.stringify(checkpoint));
  writeFileSync(OUTPUT, JSON.stringify(checkpoint.results, null, 2));

  const withPhone = Object.values(checkpoint.results).filter(r => r.phone).length;
  console.log(`\n=== DONE ===`);
  console.log(`Checked: ${rows.length}`);
  console.log(`Phones found: ${withPhone} (${(withPhone*100/rows.length).toFixed(1)}%)`);
  console.log(`No phone: ${rows.length - withPhone}`);
}

run().catch(e => console.error('Fatal:', e));
