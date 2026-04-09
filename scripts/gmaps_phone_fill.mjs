/**
 * gmaps_phone_fill.mjs — Google Maps phone enrichment for missing-phone companies
 *
 * Reads top4k_enriched.csv, finds companies where both Company Phone and DM Phone
 * are empty, searches Google Maps for each, and fills in Company Phone.
 *
 * Usage: node jordan.ai/scripts/gmaps_phone_fill.mjs
 *
 * Output:
 *   pipeline/gmaps_fill_results.json   — { domain: { phone, address, place_name } }
 *   pipeline/gmaps_fill_checkpoint.json — progress checkpoint (every 100)
 *   pipeline/top4k_enriched.csv        — updated in-place with new Company Phone values
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';

import { searchPlace, getPlaceDetails } from '../sources/google-maps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const CSV_PATH        = resolve(ROOT, 'pipeline', 'top4k_enriched.csv');
const RESULTS_PATH    = resolve(ROOT, 'pipeline', 'gmaps_fill_results.json');
const CHECKPOINT_PATH = resolve(ROOT, 'pipeline', 'gmaps_fill_checkpoint.json');

const CONCURRENCY   = 5;
const DELAY_MS      = 200;
const CHECKPOINT_N  = 100;

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function loadCheckpoint() {
  if (existsSync(CHECKPOINT_PATH)) {
    try {
      return JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf8'));
    } catch {
      return { processed: {}, apiCalls: 0 };
    }
  }
  return { processed: {}, apiCalls: 0 };
}

function saveCheckpoint(state) {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(state, null, 2));
}

function saveResults(results) {
  writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
}

// ── Core enrichment for one company ──────────────────────────────────────────

async function enrichCompany(company, apiCallCounter) {
  const { name, state, domain } = company;
  const query = `${name} ${state}`.trim();

  let phone = null;
  let address = null;
  let place_name = null;
  let calls = 0;

  try {
    // Step 1: Text search
    const place = await searchPlace(query);
    calls++;

    if (place) {
      // Step 2: Place details
      const details = await getPlaceDetails(place.place_id);
      calls++;

      if (details) {
        phone = details.international_phone_number || details.formatted_phone_number || null;
        address = details.formatted_address || place.formatted_address || null;
        place_name = details.name || place.name || null;
      }
    }
  } catch (err) {
    console.warn(`  ⚠️  Error for "${name}": ${err.message}`);
  }

  apiCallCounter.count += calls;

  return { domain, phone, address, place_name, calls };
}

// ── Concurrency pool ──────────────────────────────────────────────────────────

async function runWithConcurrency(tasks, concurrency, delayMs) {
  const results = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
      if (i < tasks.length - 1) await sleep(delayMs);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📋 Reading CSV…');
  const raw = readFileSync(CSV_PATH, 'utf8');
  const rows = csvParse(raw, { columns: true, skip_empty_lines: true });

  // Extract companies missing both phones
  const missing = rows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => {
      const cp = (row['Company Phone'] || '').trim();
      const dp = (row['DM Phone'] || '').trim();
      return !cp && !dp;
    })
    .map(({ row, idx }) => ({
      idx,
      name: row['Company Name'] || '',
      state: row['State'] || '',
      domain: row['Domain'] || '',
    }));

  console.log(`🔍 Found ${missing.length} companies missing both phone fields`);
  console.log(`📡 Will make up to ${missing.length * 2} API calls (text search + details)\n`);

  // Load checkpoint (resume if interrupted)
  const checkpoint = loadCheckpoint();
  const results = existsSync(RESULTS_PATH)
    ? JSON.parse(readFileSync(RESULTS_PATH, 'utf8'))
    : {};

  const apiCallCounter = { count: checkpoint.apiCalls || 0 };
  let phonesFound = 0;
  let processed = 0;

  // Count already-found phones from prior run
  for (const [, v] of Object.entries(results)) {
    if (v.phone) phonesFound++;
  }

  // Filter out already-processed companies
  const todo = missing.filter(c => !(c.domain in checkpoint.processed) && !(c.domain in results));
  const alreadyDone = missing.length - todo.length;
  processed = alreadyDone;
  console.log(`⏩ Resuming: ${alreadyDone} already done, ${todo.length} remaining\n`);

  // Process in batches of CONCURRENCY
  for (let batchStart = 0; batchStart < todo.length; batchStart += CONCURRENCY) {
    const batch = todo.slice(batchStart, batchStart + CONCURRENCY);

    const tasks = batch.map(company => () => enrichCompany(company, apiCallCounter));
    const batchResults = await runWithConcurrency(tasks, CONCURRENCY, DELAY_MS);

    // Store results
    for (const res of batchResults) {
      results[res.domain] = {
        phone: res.phone || null,
        address: res.address || null,
        place_name: res.place_name || null,
      };
      checkpoint.processed[res.domain] = true;
      if (res.phone) phonesFound++;
      processed++;
    }

    checkpoint.apiCalls = apiCallCounter.count;

    // Log every 100
    if (processed % CHECKPOINT_N === 0 || batchStart + CONCURRENCY >= todo.length) {
      const pct = ((phonesFound / processed) * 100).toFixed(1);
      console.log(
        `  ✅ Processed ${processed}/${missing.length} | ` +
        `Phones found: ${phonesFound} (${pct}%) | ` +
        `API calls: ${apiCallCounter.count}`
      );
      saveCheckpoint(checkpoint);
      saveResults(results);
    }
  }

  // Final save
  saveCheckpoint(checkpoint);
  saveResults(results);

  // ── Update CSV ──────────────────────────────────────────────────────────────
  console.log('\n📝 Updating CSV with found phone numbers…');
  let csvUpdated = 0;

  for (const row of rows) {
    const domain = (row['Domain'] || '').trim();
    const cp = (row['Company Phone'] || '').trim();

    // Only fill if Company Phone is still empty and we have a result
    if (!cp && results[domain]?.phone) {
      row['Company Phone'] = results[domain].phone;
      csvUpdated++;
    }
  }

  const updatedCsv = csvStringify(rows, { header: true });
  writeFileSync(CSV_PATH, updatedCsv);
  console.log(`  ✅ Updated ${csvUpdated} rows in CSV\n`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const previouslyHadPhone = 4000 - missing.length; // 2,164
  const newTotal = previouslyHadPhone + phonesFound;
  const newTotalPct = ((newTotal / 4000) * 100).toFixed(1);
  const foundPct = ((phonesFound / missing.length) * 100).toFixed(1);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total companies checked:  ${missing.length}`);
  console.log(`Phones found:             ${phonesFound} (${foundPct}%)`);
  console.log(`Previously had phone:     ${previouslyHadPhone}`);
  console.log(`New total with phone:     ${newTotal}/4,000 (${newTotalPct}%)`);
  console.log(`API calls made:           ${apiCallCounter.count} (of 10,000 monthly limit)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n💾 Results saved to: ${RESULTS_PATH}`);
  console.log(`💾 CSV updated at:   ${CSV_PATH}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
