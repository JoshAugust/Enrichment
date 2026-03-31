/**
 * hubspot-audit.mjs — Read-only audit of our data vs HubSpot
 * 
 * Checks how many of our enriched companies already exist in HubSpot,
 * identifies duplicates, and produces a report.
 * 
 * Usage: node hubspot-audit.mjs <xlsx-file> [--sheet "Name"] [--limit N]
 * 
 * DOES NOT WRITE TO HUBSPOT. Read-only.
 */

import { readFileSync } from "fs";
import XLSX from "xlsx";

const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const HS_CONFIG = JSON.parse(readFileSync(`${WORKSPACE}/.config/hubspot/config.json`, 'utf8'));
const TOKEN = HS_CONFIG.access_token;
const BASE = 'https://api.hubapi.com';

const args = process.argv.slice(2);
const inputFile = args.find(a => !a.startsWith('--'));
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const SHEET = args.includes('--sheet') ? args[args.indexOf('--sheet') + 1] : 'Enriched Leads';

if (!inputFile) {
  console.error('Usage: node hubspot-audit.mjs <xlsx-file> [--sheet "Name"] [--limit N]');
  process.exit(1);
}

const RATE_LIMIT_MS = 150;
let lastReq = 0;

async function hsApi(method, path, body) {
  const wait = RATE_LIMIT_MS - (Date.now() - lastReq);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastReq = Date.now();
  const opts = { method, headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, 10000));
    return hsApi(method, path, body);
  }
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

function extractDomain(website) {
  if (!website) return null;
  try {
    let url = website.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch { return null; }
}

async function main() {
  console.log(`\n📊 HubSpot Audit (READ-ONLY)`);
  console.log(`📂 ${inputFile} → Sheet: ${SHEET}\n`);

  const wb = XLSX.readFile(inputFile);
  let rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEET]);
  if (LIMIT) rows = rows.slice(0, LIMIT);

  // Get unique domains
  const domains = new Map();
  for (const row of rows) {
    const website = row['Website'] || row['website'] || '';
    const domain = extractDomain(website);
    const name = row['Company Name'] || row['Company'] || '';
    if (domain && !domains.has(domain)) {
      domains.set(domain, name);
    }
  }

  console.log(`🏢 Unique domains to check: ${domains.size}`);
  
  let existing = 0, newOnes = 0, noWebsite = 0;
  const existingList = [];
  const newList = [];
  let i = 0;

  for (const [domain, name] of domains) {
    i++;
    try {
      const { data } = await hsApi('POST', '/crm/v3/objects/companies/search', {
        filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
        properties: ['name', 'domain', 'hs_lead_status', 'lifecyclestage'],
        limit: 1,
      });
      
      if (data.results && data.results.length > 0) {
        existing++;
        existingList.push({ ourName: name, domain, hsName: data.results[0].properties.name, hsId: data.results[0].id });
      } else {
        newOnes++;
        newList.push({ name, domain });
      }
    } catch (e) {
      console.error(`  ⚠ Error checking ${domain}: ${e.message.substring(0, 80)}`);
    }

    if (i % 50 === 0) {
      console.log(`  Checked ${i}/${domains.size}... (${existing} exist, ${newOnes} new)`);
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 AUDIT RESULTS`);
  console.log(`   Total unique domains: ${domains.size}`);
  console.log(`   Already in HubSpot:   ${existing} (${(existing/domains.size*100).toFixed(1)}%)`);
  console.log(`   New (not in HubSpot): ${newOnes} (${(newOnes/domains.size*100).toFixed(1)}%)`);
  console.log(`${'═'.repeat(60)}`);

  if (existingList.length > 0) {
    console.log(`\n🔄 Already in HubSpot (sample):`);
    existingList.slice(0, 15).forEach(e => {
      console.log(`   ${e.domain} — Our: "${e.ourName}" → HS: "${e.hsName}" (${e.hsId})`);
    });
    if (existingList.length > 15) console.log(`   ... and ${existingList.length - 15} more`);
  }

  if (newList.length > 0) {
    console.log(`\n✨ New companies (sample):`);
    newList.slice(0, 15).forEach(n => {
      console.log(`   ${n.domain} — "${n.name}"`);
    });
    if (newList.length > 15) console.log(`   ... and ${newList.length - 15} more`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
