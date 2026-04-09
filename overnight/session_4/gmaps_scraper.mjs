#!/usr/bin/env node
/**
 * Google Maps Scraper — Session 4
 * Usage: node gmaps_scraper.mjs <city> <state> [query_override]
 * 
 * Scrapes Google Maps for tech/software companies in a given city.
 * Deduplicates against existing domains, writes new companies to shared queue.
 */

import { services } from "orangeslice";
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "fs";

const WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace";
const EXISTING_DOMAINS_FILE = `${WORKSPACE}/jordan.ai/overnight/session_4/existing_domains.txt`;
const QUEUE_FILE = `${WORKSPACE}/jordan.ai/overnight/shared/new_companies_queue.jsonl`;
const CREDITS_FILE = `${WORKSPACE}/jordan.ai/overnight/session_4/gmaps_credits.json`;
const RAW_DIR = `${WORKSPACE}/jordan.ai/overnight/session_4/gmaps_raw`;

// Load existing domains for dedup
const existingDomains = new Set(
  readFileSync(EXISTING_DOMAINS_FILE, "utf8")
    .split("\n")
    .map(d => d.trim().toLowerCase())
    .filter(Boolean)
);

// Also load hubspot domains if available
const hubspotFile = `${WORKSPACE}/jordan.ai/overnight/shared/hubspot_domains_current.json`;
let hubspotDomains = new Set();
if (existsSync(hubspotFile)) {
  try {
    const data = JSON.parse(readFileSync(hubspotFile, "utf8"));
    if (Array.isArray(data)) data.forEach(d => hubspotDomains.add(d.toLowerCase()));
    else if (typeof data === "object") Object.keys(data).forEach(d => hubspotDomains.add(d.toLowerCase()));
  } catch (e) {}
}

// Also load already-queued domains to avoid duplication across runs
const queuedDomains = new Set();
if (existsSync(QUEUE_FILE)) {
  const lines = readFileSync(QUEUE_FILE, "utf8").split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.domain) queuedDomains.add(obj.domain.toLowerCase());
    } catch (e) {}
  }
}

function extractDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) {
    return null;
  }
}

function isDuplicate(domain) {
  if (!domain) return true;
  const d = domain.toLowerCase();
  return existingDomains.has(d) || hubspotDomains.has(d) || queuedDomains.has(d);
}

// Non-tech categories to filter out
const NON_TECH_CATEGORIES = [
  "restaurant", "cafe", "bar", "pub", "salon", "barbershop", "spa",
  "gym", "fitness", "yoga", "dentist", "doctor", "medical", "hospital",
  "pharmacy", "veterinary", "law", "attorney", "lawyer", "accounting",
  "tax", "insurance agent", "real estate", "realty", "mortgage",
  "plumbing", "hvac", "electrician", "roofing", "construction",
  "landscaping", "cleaning", "auto repair", "car dealer", "gas station",
  "church", "school", "university", "store", "shop", "boutique",
  "florist", "bakery", "grocery", "supermarket", "bank", "credit union",
  "hotel", "motel", "inn", "car wash", "laundry", "dry clean",
  "moving", "storage", "funeral", "tattoo", "nail", "pet",
];

function isNonTechCategory(categories) {
  if (!categories) return false;
  const lower = (Array.isArray(categories) ? categories.join(" ") : String(categories)).toLowerCase();
  return NON_TECH_CATEGORIES.some(cat => lower.includes(cat));
}

function updateCredits(newResults) {
  const credits = JSON.parse(readFileSync(CREDITS_FILE, "utf8"));
  credits.gmaps_credits_used += newResults * 10;
  credits.gmaps_results_total += newResults;
  credits.queries_run += 1;
  credits.last_updated = new Date().toISOString();
  writeFileSync(CREDITS_FILE, JSON.stringify(credits, null, 2));
  return credits;
}

async function scrapeCity(city, state, queries) {
  const results = { city, state, total_results: 0, new_companies: 0, duplicates: 0, non_tech: 0, no_domain: 0 };
  const rawResults = [];

  for (const query of queries) {
    const searchTerm = `${query} ${city} ${state}`;
    console.log(`Searching: "${searchTerm}"`);
    
    try {
      const response = await services.googleMaps.scrape({
        query: searchTerm,
        limit: 20,
        country: "US",
      });

      const places = response?.results || response?.places || response?.data || [];
      const placeList = Array.isArray(places) ? places : [];
      
      console.log(`  Got ${placeList.length} results`);
      results.total_results += placeList.length;
      rawResults.push({ query: searchTerm, results: placeList });

      for (const place of placeList) {
        const domain = extractDomain(place.website || place.url || place.web);
        const name = place.name || place.title || place.business_name || "";
        const categories = place.category || place.categories || place.type || "";
        const phone = place.phone || place.phone_number || "";
        const address = place.address || place.full_address || "";

        if (!domain) {
          results.no_domain++;
          continue;
        }

        if (isNonTechCategory(categories)) {
          results.non_tech++;
          continue;
        }

        if (isDuplicate(domain)) {
          results.duplicates++;
          continue;
        }

        // New company — add to queue
        const entry = {
          domain,
          company_name: name,
          source: `gmaps_${city.toLowerCase().replace(/\s+/g, "_")}`,
          phone: phone || null,
          address: address || null,
          gmaps_category: Array.isArray(categories) ? categories.join(", ") : String(categories || ""),
          city,
          state,
          timestamp: new Date().toISOString(),
        };

        appendFileSync(QUEUE_FILE, JSON.stringify(entry) + "\n");
        queuedDomains.add(domain);
        existingDomains.add(domain); // Prevent re-adding in same run
        results.new_companies++;
      }

      // Update credit counter
      const credits = updateCredits(placeList.length);
      console.log(`  Credits used: ${credits.gmaps_credits_used} | New: ${results.new_companies}`);

      // Rate limit
      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      console.error(`  Error on "${searchTerm}": ${err.message}`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // Save raw results
  const rawFile = `${RAW_DIR}/${city.toLowerCase().replace(/\s+/g, "_")}_${state.toLowerCase()}.json`;
  writeFileSync(rawFile, JSON.stringify(rawResults, null, 2));
  
  return results;
}

// Main
const city = process.argv[2];
const state = process.argv[3];
const queryOverride = process.argv[4];

if (!city || !state) {
  console.error("Usage: node gmaps_scraper.mjs <city> <state> [query_override]");
  process.exit(1);
}

const defaultQueries = [
  "software company",
  "SaaS startup",
  "tech startup",
  "software development",
  "app development company",
  "IT company",
  "cloud computing",
  "cybersecurity company",
  "AI startup",
  "data analytics company",
];

const queries = queryOverride ? [queryOverride] : defaultQueries;

console.log(`\n=== Google Maps Scraper — ${city}, ${state} ===`);
console.log(`Queries: ${queries.length} | Existing domains: ${existingDomains.size}`);

const result = await scrapeCity(city, state, queries);
console.log(`\n=== Results for ${city}, ${state} ===`);
console.log(JSON.stringify(result, null, 2));
