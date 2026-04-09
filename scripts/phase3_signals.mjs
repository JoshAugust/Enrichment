// Phase 3: News + Hiring + Tech Stack + Social signals
// Uses PredictLeads for tech/jobs/news, web.batchSearch for social, scrape.website for tech detection
import { services } from "orangeslice";
import { readFileSync, writeFileSync, existsSync } from "fs";

const WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace";
const CSV_PATH = `${WORKSPACE}/jordan.ai/pipeline/blueprint_v3_qualified.csv`;
const OUTPUT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_signals.json`;
const CHECKPOINT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_signals_checkpoint.json`;
const TOTAL = 4000;
const BATCH_SIZE = 5;
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

async function getNews(domain) {
  try {
    const result = await services.predictLeads.companyNewsEvents({
      company_id_or_domain: domain,
      limit: 5,
    });
    return (result.data || []).map(e => e.attributes?.summary || "").filter(Boolean);
  } catch { return []; }
}

async function getJobs(domain) {
  try {
    const result = await services.predictLeads.companyJobOpenings({
      company_id_or_domain: domain,
      active_only: true,
      limit: 50,
    });
    const data = result.data || [];
    const swJobs = data.filter(j => {
      const title = (j.attributes?.title || "").toLowerCase();
      return title.includes("software") || title.includes("engineer") || title.includes("developer") || title.includes("frontend") || title.includes("backend") || title.includes("full stack");
    });
    return {
      open_roles: data.length,
      sw_dev_roles: swJobs.length,
      careers_url: data[0]?.attributes?.url || null,
    };
  } catch { return { open_roles: 0, sw_dev_roles: 0, careers_url: null }; }
}

async function getTechStack(domain) {
  try {
    const result = await services.predictLeads.companyTechnologyDetections({
      company_id_or_domain: domain,
      limit: 50,
    });
    // We need the technology names — they're in relationships
    // Actually, let's get the technology IDs from the relationships
    const techs = (result.data || []).map(d => {
      const techRel = d.relationships?.technology?.data;
      return techRel?.id || null;
    }).filter(Boolean);
    return techs;
  } catch { return []; }
}

async function getSocial(companyName) {
  try {
    const results = await services.web.batchSearch({
      queries: [
        { query: `"${companyName}" site:twitter.com OR site:x.com` },
        { query: `"${companyName}" site:github.com` },
      ],
    });
    
    let twitter = null;
    let github = null;
    
    const twResults = results[0]?.results || [];
    for (const r of twResults) {
      const m = r.link?.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[a-zA-Z0-9_]+/);
      if (m) { twitter = m[0]; break; }
    }
    
    const ghResults = results[1]?.results || [];
    for (const r of ghResults) {
      const m = r.link?.match(/https?:\/\/github\.com\/[a-zA-Z0-9_-]+/);
      if (m) { github = m[0]; break; }
    }
    
    return { twitter, github };
  } catch { return { twitter: null, github: null }; }
}

async function processCompany(company) {
  const domain = company["Domain"];
  const name = company["Company Name"];
  
  const [news, hiring, techStack, social] = await Promise.all([
    getNews(domain),
    getJobs(domain),
    getTechStack(domain),
    getSocial(name),
  ]);
  
  return {
    news,
    hiring,
    tech_stack: techStack,
    social,
  };
}

async function main() {
  const records = loadCSV();
  let results = loadJSON(CHECKPOINT_PATH);
  const done = new Set(Object.keys(results));
  console.log(`Phase 3: ${records.length} companies, ${done.size} already done`);

  const todo = records.filter(r => !done.has(r["Domain"]));
  console.log(`Remaining: ${todo.length}`);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    
    try {
      const batchResults = await Promise.all(batch.map(c => processCompany(c)));
      
      for (let j = 0; j < batch.length; j++) {
        results[batch[j]["Domain"]] = batchResults[j];
      }
    } catch (err) {
      console.error(`  Batch error at ${i}: ${err.message?.substring(0, 200)}`);
      for (const c of batch) {
        if (!results[c["Domain"]]) {
          results[c["Domain"]] = { news: [], hiring: { open_roles: 0 }, tech_stack: [], social: { twitter: null, github: null } };
        }
      }
    }
    
    const processed = Object.keys(results).length;
    
    if (processed % CHECKPOINT_EVERY < BATCH_SIZE || i + BATCH_SIZE >= todo.length) {
      writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
      const newsHits = Object.values(results).filter(r => r.news?.length > 0).length;
      const hiringHits = Object.values(results).filter(r => r.hiring?.open_roles > 0).length;
      const techHits = Object.values(results).filter(r => r.tech_stack?.length > 0).length;
      const socialHits = Object.values(results).filter(r => r.social?.twitter || r.social?.github).length;
      console.log(`[${processed}/${TOTAL}] News: ${newsHits} | Hiring: ${hiringHits} | Tech: ${techHits} | Social: ${socialHits}`);
    }
    
    await sleep(200);
  }
  
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
  
  const newsHits = Object.values(results).filter(r => r.news?.length > 0).length;
  const hiringHits = Object.values(results).filter(r => r.hiring?.open_roles > 0).length;
  const techHits = Object.values(results).filter(r => r.tech_stack?.length > 0).length;
  const socialHits = Object.values(results).filter(r => r.social?.twitter || r.social?.github).length;
  console.log(`\n=== PHASE 3 COMPLETE ===`);
  console.log(`Total: ${Object.keys(results).length}`);
  console.log(`News: ${newsHits} | Hiring: ${hiringHits} | Tech: ${techHits} | Social: ${socialHits}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
