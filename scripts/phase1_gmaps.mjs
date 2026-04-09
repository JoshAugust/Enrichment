// Phase 1: Google Maps Phone Numbers via Orange Slice
// Cost: 10 credits per result, maxCrawledPlacesPerSearch=1 to minimize spend
import { services } from "orangeslice";
import { readFileSync, writeFileSync, existsSync } from "fs";

const WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace";
const CSV_PATH = `${WORKSPACE}/jordan.ai/pipeline/blueprint_v3_qualified.csv`;
const OUTPUT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_gmaps.json`;
const CHECKPOINT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_gmaps_checkpoint.json`;
const TOTAL = 4000;
const CONCURRENCY = 3;
const DELAY_MS = 800;

// Simple CSV parser that handles quoted fields
function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  
  const header = parseCSVLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length && records.length < TOTAL; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length === header.length) {
      const obj = {};
      header.forEach((h, idx) => obj[h] = vals[idx]);
      records.push(obj);
    }
  }
  return records;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// Load CSV
console.log("Loading CSV...");
const csvData = readFileSync(CSV_PATH, "utf-8");
const records = parseCSV(csvData);
console.log(`Loaded ${records.length} companies for Google Maps enrichment`);

// Load checkpoint if exists
let results = {};
if (existsSync(CHECKPOINT_PATH)) {
  results = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8"));
  console.log(`Resuming from checkpoint: ${Object.keys(results).length} already done`);
}

async function scrapeOne(company) {
  const name = company["Company Name"];
  const state = company["State"] || "";
  
  try {
    const result = await services.googleMaps.scrape({
      searchStringsArray: [name],
      state: state,
      countryCode: "us",
      maxCrawledPlacesPerSearch: 1,
      language: "en",
    });
    
    if (result && result.length > 0) {
      const top = result[0];
      return {
        phone: top.phone || null,
        address: top.address || null,
        website: top.website || null,
        rating: top.rating || null,
        reviews: top.reviewsCount || null,
        gmaps_name: top.title || null,
        city: top.city || null,
        categories: top.categories || [],
      };
    }
    return null;
  } catch (err) {
    console.error(`  Error for ${name}: ${err.message?.substring(0, 100)}`);
    return { error: err.message?.substring(0, 200) };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  let processed = Object.keys(results).length;
  
  for (let i = 0; i < records.length; i += CONCURRENCY) {
    const batch = records.slice(i, i + CONCURRENCY);
    const promises = batch.map(async (company) => {
      const domain = company["Domain"];
      if (results[domain]) return; // skip already done
      const data = await scrapeOne(company);
      if (data) results[domain] = data;
      else results[domain] = { phone: null };
    });
    
    await Promise.all(promises);
    processed = Object.keys(results).length;
    
    // Checkpoint every 100
    if (processed % 100 < CONCURRENCY || i + CONCURRENCY >= records.length) {
      writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
    }
    
    // Progress every 200
    if (processed % 200 < CONCURRENCY) {
      const phoneHits = Object.values(results).filter(r => r.phone).length;
      console.log(`[${processed}/${TOTAL}] Phones: ${phoneHits}`);
    }
    
    await sleep(DELAY_MS);
  }
  
  // Final save
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
  
  const phoneHits = Object.values(results).filter(r => r.phone).length;
  const addressHits = Object.values(results).filter(r => r.address).length;
  console.log(`\n=== PHASE 1 COMPLETE ===`);
  console.log(`Total processed: ${Object.keys(results).length}`);
  console.log(`Phone hits: ${phoneHits}`);
  console.log(`Address hits: ${addressHits}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  process.exit(1);
});
