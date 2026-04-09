// Google Maps Scraper for Session 4
// Usage: HOME=$WORKSPACE node gmaps_scrape.mjs '["query1","query2"]' output.json
import { services } from "orangeslice";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";

const WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace";
const QUEUE_FILE = `${WORKSPACE}/jordan.ai/overnight/shared/new_companies_queue.jsonl`;
const MASTER_DOMAINS_FILE = `${WORKSPACE}/jordan.ai/overnight/shared/master_domains.json`;
const CREDITS_FILE = `${WORKSPACE}/jordan.ai/overnight/session_4/gmaps_credits.json`;

// Load dedup set
const masterDomains = new Set(JSON.parse(readFileSync(MASTER_DOMAINS_FILE, "utf8")));
console.log(`Loaded ${masterDomains.size} domains for dedup`);

// Load existing queue domains to avoid duplicates from other sessions
let queueDomains = new Set();
if (existsSync(QUEUE_FILE)) {
  const lines = readFileSync(QUEUE_FILE, "utf8").trim().split("\n").filter(Boolean);
  for (const line of lines) {
    try { queueDomains.add(JSON.parse(line).domain?.toLowerCase()); } catch {}
  }
}
console.log(`Loaded ${queueDomains.size} domains from queue for dedup`);

function extractDomain(url) {
  if (!url) return null;
  try {
    let d = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    d = d.replace(/^www\./, "").toLowerCase().trim();
    return d || null;
  } catch { return null; }
}

function isDuplicate(domain) {
  if (!domain) return true;
  const d = domain.toLowerCase();
  return masterDomains.has(d) || queueDomains.has(d);
}

function isLikelyTech(categories, name) {
  if (!categories && !name) return true; // If no info, let it through for verification
  const text = ((categories || "") + " " + (name || "")).toLowerCase();
  const nonTech = ["restaurant", "cafe", "bar", "salon", "spa", "dentist", "doctor", "attorney",
    "plumber", "electrician", "roofing", "landscaping", "real estate agent", "insurance agent",
    "church", "school", "gym", "fitness", "hotel", "motel", "bakery", "florist", "veterinar",
    "auto repair", "car wash", "laundry", "cleaning service", "moving company", "storage",
    "pet grooming", "nail salon", "hair salon", "tattoo", "jewelry", "clothing store"];
  return !nonTech.some(t => text.includes(t));
}

async function scrapeCity(queries) {
  const results = [];
  const newDomains = new Set();
  
  for (const query of queries) {
    // Check credits
    const credits = JSON.parse(readFileSync(CREDITS_FILE, "utf8"));
    if (credits.used_results >= credits.budget_results) {
      console.log(`Budget exhausted (${credits.used_results}/${credits.budget_results} results). Stopping.`);
      break;
    }
    
    console.log(`Searching: "${query}"`);
    try {
      const resp = await services.googleMaps.scrape({ query, limit: 20 });
      const places = resp?.results || resp?.data || resp || [];
      if (!Array.isArray(places)) {
        console.log(`Unexpected response shape for "${query}":`, typeof places);
        continue;
      }
      
      // Update credits
      credits.used_results += places.length;
      credits.used_credits = credits.used_results * 10;
      writeFileSync(CREDITS_FILE, JSON.stringify(credits));
      console.log(`Got ${places.length} results. Credits: ${credits.used_results}/${credits.budget_results}`);
      
      for (const place of places) {
        const domain = extractDomain(place.website || place.url);
        if (!domain || isDuplicate(domain) || newDomains.has(domain)) continue;
        if (!isLikelyTech(place.category || place.type, place.name || place.title)) continue;
        
        newDomains.add(domain);
        const entry = {
          domain,
          company_name: place.name || place.title || "",
          source: `gmaps_${query.split(" ").pop()}`, // city name
          phone: place.phone || place.phoneNumber || "",
          address: place.address || place.fullAddress || "",
          gmaps_category: place.category || place.type || "",
          city: place.city || "",
          state: place.state || "",
          timestamp: new Date().toISOString()
        };
        results.push(entry);
        
        // Append to shared queue
        appendFileSync(QUEUE_FILE, JSON.stringify(entry) + "\n");
        // Add to runtime dedup
        queueDomains.add(domain);
      }
      
      // Small delay between queries
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`Error for "${query}":`, err.message || err);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  return results;
}

// Main
const queries = JSON.parse(process.argv[2] || '[]');
const outputFile = process.argv[3] || "results.json";

console.log(`Running ${queries.length} queries...`);
const results = await scrapeCity(queries);
writeFileSync(`${WORKSPACE}/jordan.ai/overnight/session_4/gmaps_raw/${outputFile}`, JSON.stringify(results, null, 2));
console.log(`\nDone! Found ${results.length} new unique tech companies.`);
console.log(`Results saved to gmaps_raw/${outputFile}`);
