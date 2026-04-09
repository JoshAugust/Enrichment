// Phase 4: Apollo Enrichment — gaps only, 2000 credit budget
// Strategy:
// 1. People match (1 credit) for 631 companies with DM name but no email
// 2. Org enrich (1 credit) for remaining companies missing data
// 3. People match for additional contacts at high-score companies
import { readFileSync, writeFileSync, existsSync } from "fs";

const WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace";
const CSV_PATH = `${WORKSPACE}/jordan.ai/pipeline/blueprint_v3_qualified.csv`;
const GMAPS_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_gmaps.json`;
const OUTPUT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_apollo.json`;
const CHECKPOINT_PATH = `${WORKSPACE}/jordan.ai/pipeline/top4k_apollo_checkpoint.json`;
const CREDIT_LOG_PATH = `${WORKSPACE}/jordan.ai/pipeline/apollo_credit_log.json`;

const MAX_CREDITS = 2000;
const DELAY_MS = 1500;
const TOTAL = 4000;

const APOLLO_KEY = JSON.parse(readFileSync(`${WORKSPACE}/.config/apollo/config.json`, "utf-8")).api_key;
const APOLLO_BASE = "https://api.apollo.io";

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

let creditsUsed = 0;
let emailsFound = 0;
let phonesFound = 0;

async function apolloFetch(endpoint, body) {
  await sleep(DELAY_MS);
  try {
    const resp = await fetch(`${APOLLO_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": APOLLO_KEY },
      body: JSON.stringify(body),
    });
    
    if (resp.status === 429) {
      console.log("  Rate limited, waiting 60s...");
      await sleep(60000);
      return apolloFetch(endpoint, body);
    }
    
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`${resp.status}: ${text.substring(0, 300)}`);
    }
    
    return resp.json();
  } catch (err) {
    if (err.message?.includes("429")) {
      await sleep(60000);
      return apolloFetch(endpoint, body);
    }
    throw err;
  }
}

// Parse "Mr John Smith" → {first: "John", last: "Smith"}
function parseName(fullName) {
  const parts = fullName.replace(/^(Mr|Mrs|Ms|Dr|Prof)\.?\s+/i, "").trim().split(/\s+/);
  if (parts.length < 2) return { first: parts[0] || "", last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

async function enrichPerson(firstName, lastName, domain, orgName) {
  if (creditsUsed >= MAX_CREDITS) return null;
  
  try {
    const result = await apolloFetch("/api/v1/people/match", {
      first_name: firstName,
      last_name: lastName,
      domain: domain,
      organization_name: orgName,
      reveal_personal_emails: true,
    });
    creditsUsed++;
    
    const person = result.person;
    if (!person) return null;
    
    const contact = {
      name: `${person.first_name || firstName} ${person.last_name || lastName}`.trim(),
      title: person.title || "",
      email: person.email || null,
      phone: person.phone_numbers?.[0]?.sanitized_number || person.mobile_phone || null,
      linkedin: person.linkedin_url || null,
    };
    
    if (contact.email) emailsFound++;
    if (contact.phone) phonesFound++;
    
    return contact;
  } catch (err) {
    console.error(`  Match error (${firstName} ${lastName} @ ${domain}): ${err.message?.substring(0, 100)}`);
    creditsUsed++; // assume credit burned
    return null;
  }
}

async function enrichOrg(domain) {
  if (creditsUsed >= MAX_CREDITS) return null;
  
  try {
    const result = await apolloFetch("/api/v1/organizations/enrich", {
      domain: domain,
    });
    creditsUsed++;
    
    const org = result.organization;
    if (!org) return null;
    
    return {
      employees: org.estimated_num_employees || null,
      revenue: org.annual_revenue || null,
      industry: org.industry || null,
      technologies: org.current_technologies?.map(t => t.name) || [],
      phone: org.phone || null,
      linkedin_url: org.linkedin_url || null,
    };
  } catch (err) {
    creditsUsed++;
    return null;
  }
}

async function main() {
  console.log("Phase 4: Apollo Enrichment — 2000 credit budget");
  
  const records = loadCSV();
  const gmaps = loadJSON(GMAPS_PATH);
  let results = loadJSON(CHECKPOINT_PATH);
  
  if (existsSync(CREDIT_LOG_PATH)) {
    const log = JSON.parse(readFileSync(CREDIT_LOG_PATH, "utf-8"));
    creditsUsed = log.credits_used || 0;
    emailsFound = log.emails_found || 0;
    phonesFound = log.phones_found || 0;
    console.log(`Resuming: ${creditsUsed} credits used, ${Object.keys(results).length} done`);
  }
  
  // Priority 1: Companies with DM name but no email (631 companies, 1 credit each)
  const needEmail = records.filter(r => {
    const hasName = r["DM Name"]?.trim();
    const hasEmail = r["DM Email"]?.trim();
    return hasName && !hasEmail && !results[r["Domain"]];
  });
  
  console.log(`Priority 1 — People match for ${needEmail.length} companies with DM name, no email`);
  
  for (let i = 0; i < needEmail.length && creditsUsed < MAX_CREDITS; i++) {
    const r = needEmail[i];
    const domain = r["Domain"];
    const { first, last } = parseName(r["DM Name"]);
    const companyName = r["Company Name"];
    
    const contact = await enrichPerson(first, last, domain, companyName);
    
    results[domain] = {
      contacts: contact ? [contact] : [],
      org: null,
      source: "apollo_match",
    };
    
    if ((i + 1) % 50 === 0) {
      writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
      writeFileSync(CREDIT_LOG_PATH, JSON.stringify({ credits_used: creditsUsed, emails_found: emailsFound, phones_found: phonesFound }));
      console.log(`[P1 ${i + 1}/${needEmail.length}] Credits: ${creditsUsed}/${MAX_CREDITS} | Emails: ${emailsFound} | Phones: ${phonesFound}`);
    }
  }
  
  console.log(`\nPriority 1 done. Credits: ${creditsUsed}/${MAX_CREDITS}`);
  
  // Priority 2: Org enrichment for companies missing phone (1 credit each)
  // Only if we have budget left
  if (creditsUsed < MAX_CREDITS) {
    const needPhone = records.filter(r => {
      const domain = r["Domain"];
      const hasPhone = gmaps[domain]?.phone;
      return !hasPhone && !results[domain]?.org && creditsUsed < MAX_CREDITS;
    }).slice(0, MAX_CREDITS - creditsUsed); // limit to remaining budget
    
    console.log(`\nPriority 2 — Org enrichment for ${needPhone.length} companies missing phone`);
    
    for (let i = 0; i < needPhone.length && creditsUsed < MAX_CREDITS; i++) {
      const r = needPhone[i];
      const domain = r["Domain"];
      
      const org = await enrichOrg(domain);
      
      if (!results[domain]) results[domain] = { contacts: [], source: "apollo_org" };
      results[domain].org = org;
      
      if (org?.phone) phonesFound++;
      
      if ((i + 1) % 50 === 0) {
        writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
        writeFileSync(CREDIT_LOG_PATH, JSON.stringify({ credits_used: creditsUsed, emails_found: emailsFound, phones_found: phonesFound }));
        console.log(`[P2 ${i + 1}/${needPhone.length}] Credits: ${creditsUsed}/${MAX_CREDITS} | Phones: ${phonesFound}`);
      }
    }
  }
  
  // Final save
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(results, null, 2));
  writeFileSync(CREDIT_LOG_PATH, JSON.stringify({ credits_used: creditsUsed, emails_found: emailsFound, phones_found: phonesFound }));
  
  console.log(`\n=== PHASE 4 COMPLETE ===`);
  console.log(`Credits used: ${creditsUsed}/${MAX_CREDITS}`);
  console.log(`Emails found: ${emailsFound}`);
  console.log(`Phones found: ${phonesFound}`);
  console.log(`Companies enriched: ${Object.keys(results).length}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  writeFileSync(CREDIT_LOG_PATH, JSON.stringify({ credits_used: creditsUsed, emails_found: emailsFound, phones_found: phonesFound }));
  process.exit(1);
});
