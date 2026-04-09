// Phase 2: LinkedIn employee count + software engineer flag
// Uses Orange Slice web.batchSearch (1 credit/query) for LinkedIn lookups
import { services } from "orangeslice";
import { readFileSync, writeFileSync, existsSync } from "fs";

const WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace";
const CSV_PATH = `${WORKSPACE}/jordan.ai/pipeline/blueprint_v3_qualified.csv`;
const OUTPUT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_linkedin.json`;
const CHECKPOINT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_linkedin_checkpoint.json`;
const TOTAL = 4000;
const BATCH_SIZE = 10; // queries per batchSearch call
const CHECKPOINT_EVERY = 200;

function parseCSVLine(line) {
  const result = [];
  let current = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i+1] === '"') { current += '"'; i++; } else inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(current.trim()); current = ''; }
    else current += ch;
  }
  result.push(current.trim());
  return result;
}

function loadCSV() {
  const text = readFileSync(CSV_PATH, "utf-8");
  const lines = text.split('\n').filter(l => l.trim());
  const header = parseCSVLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length && records.length < TOTAL; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length >= header.length) {
      const obj = {};
      header.forEach((h, idx) => obj[h] = vals[idx] || "");
      records.push(obj);
    }
  }
  return records;
}

function loadJSON(path) {
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf-8"));
  return {};
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseEmployeeCount(snippet) {
  const m = snippet.match(/([\d,]+)\s*(?:employees?(?:\s+on\s+LinkedIn)?|associated\s+members|followers)/i);
  if (m) {
    const n = parseInt(m[1].replace(/,/g, ""));
    if (!isNaN(n) && n > 0 && n < 10000000) return n;
  }
  // Try "Company size: X-Y" pattern
  const m2 = snippet.match(/company\s+size[:\s]+([\d,]+)/i);
  if (m2) return parseInt(m2[1].replace(/,/g, ""));
  return null;
}

function extractLinkedInUrl(results) {
  for (const r of results) {
    const m = r.link?.match(/https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+/);
    if (m) return m[0];
  }
  return null;
}

async function main() {
  const records = loadCSV();
  let results = loadJSON(CHECKPOINT_PATH);
  const done = new Set(Object.keys(results));
  console.log(`Phase 2: ${records.length} companies, ${done.size} already done`);

  const todo = records.filter(r => !done.has(r["Domain"]));
  console.log(`Remaining: ${todo.length}`);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    
    // Build queries: company LinkedIn profile search
    const companyQueries = batch.map(c => ({
      query: `"${c["Company Name"]}" site:linkedin.com/company`,
    }));
    
    // Build queries: software engineer search
    const engineerQueries = batch.map(c => ({
      query: `"${c["Company Name"]}" "software engineer" OR "developer" site:linkedin.com/in`,
    }));
    
    try {
      // Batch search for company profiles
      const companyResults = await services.web.batchSearch({ queries: companyQueries });
      
      await sleep(500);
      
      // Batch search for engineers
      const engineerResults = await services.web.batchSearch({ queries: engineerQueries });
      
      // Process results
      for (let j = 0; j < batch.length; j++) {
        const domain = batch[j]["Domain"];
        const compR = companyResults[j]?.results || [];
        const engR = engineerResults[j]?.results || [];
        
        // Parse company info
        let employees = null;
        let linkedinUrl = null;
        
        for (const r of compR) {
          const snippet = `${r.title || ""} ${r.snippet || ""}`;
          if (!employees) employees = parseEmployeeCount(snippet);
          if (!linkedinUrl) linkedinUrl = extractLinkedInUrl([r]);
        }
        
        // Parse engineer presence
        const hasEngineer = engR.length > 0;
        const engineerNames = [];
        for (const r of engR.slice(0, 5)) {
          const title = r.title || "";
          // LinkedIn titles often: "Name - Title at Company | LinkedIn"
          const m = title.match(/^([^-–|]+)\s*[-–|]\s*(.+?)(?:\s*\||\s*-\s*LinkedIn)/i);
          if (m) {
            engineerNames.push({ name: m[1].trim(), title: m[2].trim() });
          }
        }
        
        results[domain] = {
          linkedin_employees: employees,
          has_software_engineer: hasEngineer,
          engineer_names: engineerNames,
          linkedin_url: linkedinUrl,
        };
      }
    } catch (err) {
      console.error(`  Batch error at ${i}: ${err.message?.substring(0, 200)}`);
      // Mark batch as attempted with empty results
      for (const c of batch) {
        if (!results[c["Domain"]]) {
          results[c["Domain"]] = { linkedin_employees: null, has_software_engineer: false, engineer_names: [], linkedin_url: null };
        }
      }
    }
    
    const processed = Object.keys(results).length;
    
    // Checkpoint
    if (processed % CHECKPOINT_EVERY < BATCH_SIZE || i + BATCH_SIZE >= todo.length) {
      writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
      const empHits = Object.values(results).filter(r => r.linkedin_employees).length;
      const swFlags = Object.values(results).filter(r => r.has_software_engineer).length;
      console.log(`[${processed}/${TOTAL}] Employees: ${empHits} | SW Engineers: ${swFlags}`);
    }
    
    await sleep(300);
  }
  
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
  
  const empHits = Object.values(results).filter(r => r.linkedin_employees).length;
  const swFlags = Object.values(results).filter(r => r.has_software_engineer).length;
  const urlHits = Object.values(results).filter(r => r.linkedin_url).length;
  console.log(`\n=== PHASE 2 COMPLETE ===`);
  console.log(`Total: ${Object.keys(results).length}`);
  console.log(`Employee hits: ${empHits}`);
  console.log(`SW Engineer flags: ${swFlags}`);
  console.log(`LinkedIn URLs: ${urlHits}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
