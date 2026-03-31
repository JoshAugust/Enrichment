/**
 * hubspot-sync.mjs — Push enriched DealScope data into HubSpot CRM
 * 
 * Usage:
 *   node hubspot-sync.mjs <xlsx-file> [--dry-run] [--sheet "Enriched Leads"] [--limit 5]
 * 
 * Supports both DealScope v3 and GPU Operators v3 column formats.
 * Creates/updates companies, creates/updates contacts, associates them.
 * Uses domain-based dedup for companies, email-based dedup for contacts.
 */

import { readFileSync } from "fs";
import XLSX from "xlsx";

// ── Config ──────────────────────────────────────────────────────────────────
const WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace';
const HS_CONFIG = JSON.parse(readFileSync(`${WORKSPACE}/.config/hubspot/config.json`, 'utf8'));
const TOKEN = HS_CONFIG.access_token;
const BASE = 'https://api.hubapi.com';

// ── CLI Args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const inputFile = args.find(a => !a.startsWith('--'));
const DRY_RUN = args.includes('--dry-run');
const LIMIT = args.find(a => a.startsWith('--limit')) ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const SHEET = args.find(a => a.startsWith('--sheet')) ? args[args.indexOf('--sheet') + 1] : 'Enriched Leads';

if (!inputFile) {
  console.error('Usage: node hubspot-sync.mjs <xlsx-file> [--dry-run] [--sheet "Enriched Leads"] [--limit 5]');
  process.exit(1);
}

// ── HubSpot API helpers ─────────────────────────────────────────────────────
const RATE_LIMIT_MS = 120; // ~8 req/sec (HubSpot allows 10/sec)
let lastRequest = 0;

async function hsApi(method, path, body = null) {
  // Rate limiting
  const now = Date.now();
  const wait = RATE_LIMIT_MS - (now - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '10') * 1000;
    console.log(`  ⏳ Rate limited, waiting ${retryAfter / 1000}s...`);
    await new Promise(r => setTimeout(r, retryAfter));
    return hsApi(method, path, body); // Retry
  }

  if (!res.ok && res.status !== 409) {
    throw new Error(`HubSpot ${method} ${path} → ${res.status}: ${text.substring(0, 300)}`);
  }

  return { status: res.status, data: text ? JSON.parse(text) : null };
}

// ── Search for existing company by domain ───────────────────────────────────
async function findCompanyByDomain(domain) {
  if (!domain) return null;
  const { data } = await hsApi('POST', '/crm/v3/objects/companies/search', {
    filterGroups: [{
      filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }]
    }],
    properties: ['name', 'domain', 'phone'],
    limit: 1,
  });
  return data.results?.[0] || null;
}

// ── Check if email is a generic company email ───────────────────────────────
function isGenericEmail(email) {
  if (!email) return true;
  const prefix = email.split('@')[0].toLowerCase();
  return ['info', 'contact', 'hello', 'sales', 'support', 'team', 'admin', 'office', 'general', 'enquiries', 'inquiries', 'mail'].includes(prefix);
}

// ── Search for existing contact by email ────────────────────────────────────
async function findContactByEmail(email) {
  if (!email) return null;
  const { data } = await hsApi('POST', '/crm/v3/objects/contacts/search', {
    filterGroups: [{
      filters: [{ propertyName: 'email', operator: 'EQ', value: email }]
    }],
    properties: ['email', 'firstname', 'lastname', 'phone'],
    limit: 1,
  });
  return data.results?.[0] || null;
}

// ── Search for existing contact by name + company ───────────────────────────
async function findContactByName(firstName, lastName, companyName) {
  if (!firstName || !lastName) return null;
  const { data } = await hsApi('POST', '/crm/v3/objects/contacts/search', {
    filterGroups: [{
      filters: [
        { propertyName: 'firstname', operator: 'EQ', value: firstName },
        { propertyName: 'lastname', operator: 'EQ', value: lastName },
        { propertyName: 'company', operator: 'EQ', value: companyName },
      ]
    }],
    properties: ['email', 'firstname', 'lastname', 'phone'],
    limit: 1,
  });
  return data.results?.[0] || null;
}

// ── Create or update company ────────────────────────────────────────────────
async function upsertCompany(props) {
  const domain = extractDomain(props.website);
  const existing = await findCompanyByDomain(domain);

  const hsProps = {
    name: props.companyName,
    domain: domain,
    description: [props.description, props.industry ? `Industry: ${props.industry}` : ''].filter(Boolean).join('\n\n'),
    phone: props.phone || '',
    numberofemployees: props.employees ? parseInt(String(props.employees).replace(/[^0-9]/g, '')) || null : null,
    website: props.website || '',
    founded_year: props.founded || '',
    linkedin_company_page: props.linkedin || '',
    state: props.state || props.hq || '',
    annualrevenue: props.revenue ? Math.round(parseFloat(String(props.revenue).replace(/[^0-9.]/g, '')) * 1000000) || null : null,
    total_money_raised: props.totalRaised || '',
    hs_lead_status: 'NEW',
  };

  // Remove null/undefined
  Object.keys(hsProps).forEach(k => {
    if (hsProps[k] === null || hsProps[k] === undefined || hsProps[k] === '') delete hsProps[k];
  });

  if (existing) {
    // Update
    const { data } = await hsApi('PATCH', `/crm/v3/objects/companies/${existing.id}`, { properties: hsProps });
    return { id: data.id, action: 'updated' };
  } else {
    // Create
    const { data } = await hsApi('POST', '/crm/v3/objects/companies', { properties: hsProps });
    return { id: data.id, action: 'created' };
  }
}

// ── Create or update contact ────────────────────────────────────────────────
async function upsertContact(props, companyId) {
  const nameParts = splitName(props.contactName);
  const genericEmail = isGenericEmail(props.email);
  
  // For generic emails (info@, sales@), search by name instead to avoid overwriting
  let existing = null;
  if (genericEmail) {
    existing = await findContactByName(nameParts.first, nameParts.last, props.companyName);
  } else if (props.email) {
    existing = await findContactByEmail(props.email);
  }

  const hsProps = {
    firstname: nameParts.first,
    lastname: nameParts.last,
    phone: props.phone || '',
    jobtitle: props.title || '',
    company: props.companyName || '',
    lifecyclestage: 'lead',
  };

  // Only set email if it's personal — generic emails (info@, sales@) cause dedup collisions
  if (props.email && !genericEmail) {
    hsProps.email = props.email;
  }

  // Remove empty
  Object.keys(hsProps).forEach(k => {
    if (!hsProps[k]) delete hsProps[k];
  });

  let contactId;
  let action;

  if (existing) {
    const { data } = await hsApi('PATCH', `/crm/v3/objects/contacts/${existing.id}`, { properties: hsProps });
    contactId = data.id;
    action = 'updated';
  } else {
    try {
      const { data } = await hsApi('POST', '/crm/v3/objects/contacts', { properties: hsProps });
      contactId = data.id;
      action = 'created';
    } catch (e) {
      if (e.message.includes('409')) {
        // Contact already exists (conflict on email) — try to find and update
        const found = await findContactByEmail(props.email);
        if (found) {
          await hsApi('PATCH', `/crm/v3/objects/contacts/${found.id}`, { properties: hsProps });
          contactId = found.id;
          action = 'updated (conflict resolved)';
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }

  // Associate contact → company
  if (contactId && companyId) {
    try {
      await hsApi('PUT', `/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/contact_to_company`, null);
    } catch (e) {
      // Non-fatal — association might already exist
      console.log(`    ⚠ Association failed (non-fatal): ${e.message.substring(0, 100)}`);
    }
  }

  return { id: contactId, action };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function extractDomain(website) {
  if (!website) return null;
  try {
    let url = website.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

function splitName(fullName) {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

// ── Column mapping (handles both DealScope v3 and GPU Operators v3) ─────────
function mapRow(row) {
  return {
    companyName: row['Company Name'] || row['Company'] || '',
    description: row['Company Description'] || row['Description'] || '',
    industry: row['Industry / Vertical'] || row['Industry'] || '',
    website: row['Website'] || '',
    state: row['State'] || '',
    hq: row['HQ'] || '',
    founded: row['Founded'] || '',
    employees: row['Employees'] || '',
    revenue: row['Revenue (USD M)'] || row['Est. GPU Value ($M)'] || '',
    totalRaised: row['Total Raised'] || '',
    linkedin: row['Company LinkedIn'] || '',
    phone: row['Direct Phone'] || row['Company Phone'] || '',
    contactName: row['Contact Name'] || '',
    title: row['Contact Title'] || '',
    email: row['Email Address'] || row['Email'] || '',
    contactPhone: row['Direct Phone'] || '',
    score: row['Blueprint Score'] || row['RVG Score'] || '',
    grade: row['Grade'] || row['Startup Stage'] || '',
  };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔄 HubSpot Sync — ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`📂 Input: ${inputFile}`);
  console.log(`📋 Sheet: ${SHEET}`);
  if (LIMIT) console.log(`🔢 Limit: ${LIMIT}`);
  console.log('');

  // Read XLSX
  const wb = XLSX.readFile(inputFile);
  if (!wb.SheetNames.includes(SHEET)) {
    console.error(`Sheet "${SHEET}" not found. Available: ${wb.SheetNames.join(', ')}`);
    process.exit(1);
  }

  let rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEET]);
  console.log(`📊 Total rows: ${rows.length}`);

  if (LIMIT) rows = rows.slice(0, LIMIT);

  // Group contacts by company
  const companies = new Map();
  for (const row of rows) {
    const mapped = mapRow(row);
    if (!mapped.companyName) continue;

    const key = mapped.companyName.toUpperCase();
    if (!companies.has(key)) {
      companies.set(key, { company: mapped, contacts: [] });
    }
    if (mapped.contactName && mapped.contactName !== 'Team' && mapped.contactName !== 'Sales Team') {
      companies.get(key).contacts.push(mapped);
    }
  }

  console.log(`🏢 Unique companies: ${companies.size}`);
  console.log(`👤 Contacts: ${rows.length}`);
  console.log('');

  if (DRY_RUN) {
    console.log('=== DRY RUN — No changes will be made ===\n');
    let i = 0;
    for (const [key, { company, contacts }] of companies) {
      if (i >= 5) { console.log(`... and ${companies.size - 5} more companies`); break; }
      console.log(`🏢 ${company.companyName} (${extractDomain(company.website) || 'no domain'})`);
      console.log(`   Industry: ${company.industry} | Employees: ${company.employees} | Revenue: $${company.revenue}M`);
      contacts.forEach(c => {
        console.log(`   👤 ${c.contactName} — ${c.title} | ${c.email || 'no email'} | ${c.contactPhone || 'no phone'}`);
      });
      console.log('');
      i++;
    }
    console.log(`\n✅ Dry run complete. Run without --dry-run to push to HubSpot.`);
    return;
  }

  // Live sync
  const stats = { companiesCreated: 0, companiesUpdated: 0, contactsCreated: 0, contactsUpdated: 0, errors: 0 };
  let i = 0;

  for (const [key, { company, contacts }] of companies) {
    i++;
    try {
      // Upsert company
      const companyResult = await upsertCompany(company);
      stats[companyResult.action === 'created' ? 'companiesCreated' : 'companiesUpdated']++;
      console.log(`[${i}/${companies.size}] 🏢 ${company.companyName} → ${companyResult.action} (${companyResult.id})`);

      // Upsert contacts
      for (const contact of contacts) {
        try {
          const contactResult = await upsertContact(contact, companyResult.id);
          if (contactResult.action.includes('created')) stats.contactsCreated++;
          else stats.contactsUpdated++;
          console.log(`  👤 ${contact.contactName} → ${contactResult.action} (${contactResult.id})`);
        } catch (e) {
          stats.errors++;
          console.error(`  ❌ ${contact.contactName}: ${e.message.substring(0, 150)}`);
        }
      }
    } catch (e) {
      stats.errors++;
      console.error(`❌ ${company.companyName}: ${e.message.substring(0, 150)}`);
    }

    // Progress update every 25 companies
    if (i % 25 === 0) {
      console.log(`\n📊 Progress: ${i}/${companies.size} companies | Created: ${stats.companiesCreated} co + ${stats.contactsCreated} contacts | Updated: ${stats.companiesUpdated} co + ${stats.contactsUpdated} contacts | Errors: ${stats.errors}\n`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ SYNC COMPLETE`);
  console.log(`   Companies created: ${stats.companiesCreated}`);
  console.log(`   Companies updated: ${stats.companiesUpdated}`);
  console.log(`   Contacts created:  ${stats.contactsCreated}`);
  console.log(`   Contacts updated:  ${stats.contactsUpdated}`);
  console.log(`   Errors:            ${stats.errors}`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
