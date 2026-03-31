/**
 * hubspot-sync-v2.mjs — Production HubSpot sync with full property mapping
 * 
 * Maps enriched DealScope data to existing HubSpot custom properties:
 *   - company_industry (enum), funding_stage (enum), business_model_type (enum)
 *   - lead_source, office_owner, total_funding_amount
 *   - contact: lead_source, contact_role, funding_amount, trigger_event, yc
 * 
 * Usage:
 *   node hubspot-sync-v2.mjs <xlsx-file> [options]
 * 
 * Options:
 *   --dry-run          Preview without pushing
 *   --sheet "Name"     Sheet name (default: "Enriched Leads")
 *   --limit N          Process only N rows
 *   --source "Label"   Lead source label (default: "DealScope Import")
 *   --owner "Name"     Office owner: Dane | Corgi Corp | Corgi Tech
 *   --format dealscope|gpu   Auto-detected, override if needed
 *   --skip-existing    Skip companies that already exist (don't update)
 *   --stats            Print stats only, don't sync
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
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
const SKIP_EXISTING = args.includes('--skip-existing');
const STATS_ONLY = args.includes('--stats');
const LIMIT = getArg('--limit', null, parseInt);
const SHEET = getArg('--sheet', 'Enriched Leads');
const LEAD_SOURCE = getArg('--source', 'DealScope Import');
const OFFICE_OWNER = getArg('--owner', null);
const FORMAT_OVERRIDE = getArg('--format', null);

function getArg(flag, defaultVal, transform) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return defaultVal;
  const val = args[idx + 1];
  return transform ? transform(val) : val;
}

if (!inputFile) {
  console.error('Usage: node hubspot-sync-v2.mjs <xlsx-file> [--dry-run] [--sheet "Enriched Leads"] [--limit 5] [--source "Label"] [--owner "Dane"] [--skip-existing] [--stats]');
  process.exit(1);
}

// ── Rate-limited HubSpot API ────────────────────────────────────────────────
const RATE_LIMIT_MS = 120;
let lastRequest = 0;
let apiCalls = 0;

async function hsApi(method, path, body = null) {
  const now = Date.now();
  const wait = RATE_LIMIT_MS - (now - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
  apiCalls++;

  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '10') * 1000;
    console.log(`  ⏳ Rate limited, waiting ${retryAfter / 1000}s...`);
    await new Promise(r => setTimeout(r, retryAfter));
    return hsApi(method, path, body);
  }

  if (!res.ok && res.status !== 409) {
    throw new Error(`HS ${method} ${path} → ${res.status}: ${text.substring(0, 200)}`);
  }

  return { status: res.status, data: text ? JSON.parse(text) : null };
}

// ── Batch API (up to 100 at a time) ─────────────────────────────────────────
async function batchCreateCompanies(inputs) {
  const { data } = await hsApi('POST', '/crm/v3/objects/companies/batch/create', { inputs });
  return data;
}

async function batchCreateContacts(inputs) {
  const { data } = await hsApi('POST', '/crm/v3/objects/contacts/batch/create', { inputs });
  return data;
}

async function batchUpdateCompanies(inputs) {
  const { data } = await hsApi('POST', '/crm/v3/objects/companies/batch/update', { inputs });
  return data;
}

// ── Search helpers ──────────────────────────────────────────────────────────
async function findCompanyByDomain(domain) {
  if (!domain) return null;
  const { data } = await hsApi('POST', '/crm/v3/objects/companies/search', {
    filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }],
    properties: ['name', 'domain', 'phone', 'hs_lead_status'],
    limit: 1,
  });
  return data.results?.[0] || null;
}

async function findContactByEmail(email) {
  if (!email) return null;
  const { data } = await hsApi('POST', '/crm/v3/objects/contacts/search', {
    filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
    properties: ['email', 'firstname', 'lastname', 'phone'],
    limit: 1,
  });
  return data.results?.[0] || null;
}

async function findContactByName(firstName, lastName, companyName) {
  if (!firstName || !lastName) return null;
  const { data } = await hsApi('POST', '/crm/v3/objects/contacts/search', {
    filterGroups: [{ filters: [
      { propertyName: 'firstname', operator: 'EQ', value: firstName },
      { propertyName: 'lastname', operator: 'EQ', value: lastName },
      { propertyName: 'company', operator: 'EQ', value: companyName },
    ] }],
    properties: ['email', 'firstname', 'lastname', 'phone'],
    limit: 1,
  });
  return data.results?.[0] || null;
}

// ── Industry mapper ─────────────────────────────────────────────────────────
// Maps our freetext industry to HubSpot's company_industry enum
const INDUSTRY_MAP = {
  // AI/ML/GPU
  'ai': 'Data, Analytics, AI & ML',
  'artificial intelligence': 'Data, Analytics, AI & ML',
  'machine learning': 'Data, Analytics, AI & ML',
  'gpu': 'Data, Analytics, AI & ML',
  'deep learning': 'Data, Analytics, AI & ML',
  'nlp': 'Data, Analytics, AI & ML',
  'computer vision': 'Data, Analytics, AI & ML',
  'data': 'Data, Analytics, AI & ML',
  'analytics': 'Data, Analytics, AI & ML',
  // Cloud / Infra
  'cloud': 'SaaS & Cloud Platforms',
  'saas': 'SaaS & Cloud Platforms',
  'infrastructure': 'SaaS & Cloud Platforms',
  'neocloud': 'SaaS & Cloud Platforms',
  'data center': 'SaaS & Cloud Platforms',
  'colocation': 'SaaS & Cloud Platforms',
  // Cybersecurity
  'cybersecurity': 'Cybersecurity',
  'security': 'Cybersecurity',
  'identity': 'Cybersecurity',
  // DevTools
  'devtools': 'Developer Tools & DevOps',
  'developer': 'Developer Tools & DevOps',
  'devops': 'Developer Tools & DevOps',
  // Fintech
  'fintech': 'Financial Services & Fintech',
  'financial': 'Financial Services & Fintech',
  'payments': 'Payments & Processors',
  'insurance': 'Insurance (P&C, Health, Life)',
  'insurtech': 'Insurance (P&C, Health, Life)',
  // Health
  'health': 'Healthcare & Life Sciences',
  'healthtech': 'Healthtech & Digital Health Platforms',
  'biotech': 'Biotechnology',
  'pharma': 'Pharmaceuticals',
  'medtech': 'Medical Devices & MedTech',
  // Other
  'telecom': 'Telecommunications',
  'edtech': 'Online Learning & EdTech Startups',
  'education': 'Education & EdTech',
  'retail': 'Retail & E-Commerce',
  'ecommerce': 'Retail & E-Commerce',
  'e-commerce': 'Retail & E-Commerce',
  'energy': 'Energy & Utilities',
  'renewable': 'Renewable Energy (Solar, Wind, Hydro, Geothermal)',
  'clean energy': 'Renewable Energy (Solar, Wind, Hydro, Geothermal)',
  'mining': 'Mining & Metals',
  'semiconductor': 'Electronics & Semiconductors',
  'hardware': 'Electronics & Semiconductors',
  'automotive': 'Automotive & Mobility',
  'logistics': 'Transportation & Logistics',
  'real estate': 'Commercial Real Estate (CRE)',
  'proptech': 'PropTech (Property Mgmt, Leasing, Marketplaces)',
  'construction': 'Construction & Project Management',
  'media': 'Media & Entertainment',
  'gaming': 'Gaming & eSports',
  'consulting': 'Consulting & Advisory',
  'legal': 'Legal Services & Law Firms',
  'government': 'Government & Public Sector',
  'defense': 'Defense & Military',
  'aerospace': 'Aerospace & Defense',
  'agriculture': 'Agriculture & Environment',
  'food': 'Food & Beverage',
  'hospitality': 'Hospitality & Travel',
  'manufacturing': 'Manufacturing & Industrial',
};

function mapIndustry(freetext) {
  if (!freetext) return null;
  const lower = freetext.toLowerCase();
  // Map to internal enum values (snake_case)
  const INTERNAL_MAP = {
    'ai': 'data_analytics_ai_ml', 'artificial intelligence': 'data_analytics_ai_ml', 'machine learning': 'data_analytics_ai_ml',
    'gpu': 'data_analytics_ai_ml', 'deep learning': 'data_analytics_ai_ml', 'nlp': 'data_analytics_ai_ml',
    'data': 'data_analytics_ai_ml', 'analytics': 'data_analytics_ai_ml', 'computer vision': 'data_analytics_ai_ml',
    'cloud': 'saas_cloud_platforms', 'saas': 'saas_cloud_platforms', 'infrastructure': 'saas_cloud_platforms',
    'neocloud': 'saas_cloud_platforms', 'data center': 'saas_cloud_platforms',
    'cybersecurity': 'cybersecurity', 'security': 'cybersecurity', 'identity': 'cybersecurity',
    'devtools': 'developer_tools_devops', 'developer': 'developer_tools_devops', 'devops': 'developer_tools_devops',
    'fintech': 'financial_services_fintech', 'financial': 'financial_services_fintech',
    'payment': 'payments_processors', 'insurance': 'insurance_pnc_health_life', 'insurtech': 'insurance_pnc_health_life',
    'health': 'healthcare_life_sciences', 'healthtech': 'healthtech_digital_health', 'biotech': 'biotechnology',
    'pharma': 'pharmaceuticals', 'medtech': 'medical_devices_medtech',
    'telecom': 'telecommunications', 'edtech': 'online_learning_edtech_startups', 'education': 'education_edtech',
    'retail': 'retail_ecommerce', 'ecommerce': 'ecommerce_marketplaces', 'e-commerce': 'ecommerce_marketplaces',
    'energy': 'energy_utilities', 'renewable': 'renewable_energy', 'clean energy': 'renewable_energy',
    'mining': 'mining_metals', 'semiconductor': 'electronics_semiconductors', 'hardware': 'electronics_semiconductors',
    'automotive': 'automotive_mobility', 'logistics': 'transportation_logistics',
    'real estate': 'commercial_real_estate_cre', 'proptech': 'proptech',
    'construction': 'construction_project_management', 'media': 'media_entertainment', 'gaming': 'gaming_esports',
    'consulting': 'consulting_advisory', 'legal': 'legal_services_law_firms',
    'government': 'federal_agencies', 'defense': 'defense_military', 'aerospace': 'aerospace_defense',
    'agriculture': 'agriculture_environment', 'food': 'food_beverage',
    'hospitality': 'hospitality_travel', 'manufacturing': 'manufacturing_industrial',
    'martech': 'adtech_martech', 'adtech': 'adtech_martech', 'marketing': 'adtech_martech',
  };
  for (const [keyword, hsValue] of Object.entries(INTERNAL_MAP)) {
    if (lower.includes(keyword)) return hsValue;
  }
  return 'technology_software';
}

// ── Funding stage mapper ────────────────────────────────────────────────────
function mapFundingStage(stage, totalRaised) {
  if (!stage && !totalRaised) return null;
  const s = (stage || '').toLowerCase();
  if (s.includes('public') || s.includes('ipo')) return null; // Not a funding stage
  if (s.includes('pre-seed') || s.includes('pre seed')) return 'pre_seed';
  if (s.includes('seed')) return 'seed';
  if (s.includes('series a')) return 'series_a';
  if (s.includes('series b')) return 'series_b';
  if (s.includes('series c') || s.includes('series d') || s.includes('series e') || s.includes('late') || s.includes('growth')) return 'series_c_plus';
  if (s.includes('bootstrap')) return 'bootstrapped';
  // Infer from total raised
  if (totalRaised) {
    const amount = parseFloat(String(totalRaised).replace(/[^0-9.]/g, ''));
    if (amount < 2) return 'seed';
    if (amount < 20) return 'series_a';
    if (amount < 60) return 'series_b';
    if (amount >= 60) return 'series_c_plus';
  }
  return null;
}

// ── Business model mapper ───────────────────────────────────────────────────
function mapBusinessModel(description, industry) {
  const text = ((description || '') + ' ' + (industry || '')).toLowerCase();
  if (text.includes('saas') || text.includes('software as a service') || text.includes('platform')) return 'saas';
  if (text.includes('paas') || text.includes('platform as a service')) return 'paas';
  if (text.includes('iaas') || text.includes('infrastructure as a service') || text.includes('cloud infrastructure') || text.includes('gpu cloud')) return 'iaas';
  if (text.includes('marketplace')) return 'marketplace';
  if (text.includes('api') || text.includes('developer platform')) return 'api_first';
  if (text.includes('open source') || text.includes('open-source')) return 'open_source';
  if (text.includes('usage-based') || text.includes('pay-as-you-go') || text.includes('metered')) return 'usage_based';
  if (text.includes('hardware')) return 'hardware_software';
  if (text.includes('consulting') || text.includes('services')) return 'professional_services';
  return null;
}

// ── Generic email detection ─────────────────────────────────────────────────
function isGenericEmail(email) {
  if (!email) return true;
  const prefix = email.split('@')[0].toLowerCase();
  return ['info', 'contact', 'hello', 'sales', 'support', 'team', 'admin', 'office', 'general', 'enquiries', 'inquiries', 'mail', 'help'].includes(prefix);
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
  const parts = fullName.trim().replace(/^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+/i, '').split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

function parseNumber(val) {
  if (!val) return null;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

// ── Column mapping ──────────────────────────────────────────────────────────
function detectFormat(columns) {
  if (FORMAT_OVERRIDE) return FORMAT_OVERRIDE;
  if (columns.includes('RVG Score')) return 'gpu';
  return 'dealscope';
}

function mapRow(row, format) {
  if (format === 'gpu') {
    return {
      companyName: row['Company'] || '',
      description: row['Description'] || '',
      industry: row['Industry'] || '',
      website: row['Website'] || '',
      hq: row['HQ'] || '',
      state: row['HQ'] || '',
      founded: row['Founded'] || '',
      employees: row['Employees'] || '',
      revenue: row['Est. GPU Value ($M)'] || '',
      totalRaised: row['Total Raised'] || '',
      lastRound: row['Last Round'] || '',
      linkedin: row['Company LinkedIn'] || '',
      contactName: row['Contact Name'] || '',
      title: row['Contact Title'] || '',
      email: row['Email'] || '',
      emailType: row['Email Type'] || '',
      phone: row['Direct Phone'] || '',
      score: row['RVG Score'] || '',
      grade: row['Grade'] || '',
      stage: row['Stage'] || '',
      scoreBreakdown: row['Score Breakdown'] || '',
      gpuFleet: row['GPU Fleet'] || '',
      hardware: row['Hardware'] || '',
      financingProfile: row['Financing Profile'] || '',
    };
  }
  
  // DealScope v3
  return {
    companyName: row['Company Name'] || '',
    description: row['Company Description'] || '',
    industry: row['Industry / Vertical'] || '',
    website: row['Website'] || '',
    state: row['State'] || '',
    hq: row['State'] || '',
    founded: row['Founded'] || '',
    employees: row['Employees'] || '',
    revenue: row['Revenue (USD M)'] || '',
    totalRaised: '',
    lastRound: '',
    linkedin: row['Company LinkedIn'] || '',
    contactName: row['Contact Name'] || '',
    title: row['Contact Title'] || '',
    email: row['Email Address'] || '',
    emailType: row['Email Type'] || '',
    phone: '',
    score: row['Blueprint Score'] || '',
    grade: '',
    stage: row['Startup Stage'] || '',
    scoreBreakdown: row['Score Breakdown'] || '',
    hiringSignals: row['Hiring Signals'] || '',
    recentNews: row['Recent News'] || '',
    verificationStatus: row['Verification Status'] || '',
    dataQualityScore: row['Data Quality Score'] || '',
  };
}

// ── Build HubSpot properties ────────────────────────────────────────────────
function buildCompanyProps(mapped) {
  const domain = extractDomain(mapped.website);
  const props = {};

  // Standard fields
  if (mapped.companyName) props.name = mapped.companyName;
  if (domain) props.domain = domain;
  if (mapped.website) props.website = mapped.website;
  if (mapped.phone) props.phone = mapped.phone;
  if (mapped.founded) props.founded_year = String(mapped.founded).replace(/[^0-9]/g, '').substring(0, 4);
  if (mapped.linkedin) props.linkedin_company_page = mapped.linkedin;
  if (mapped.state) props.state = mapped.state;

  // Description — include industry and key details
  const descParts = [mapped.description];
  if (mapped.gpuFleet) descParts.push(`GPU Fleet: ${mapped.gpuFleet}`);
  if (mapped.hardware) descParts.push(`Hardware: ${mapped.hardware}`);
  if (mapped.financingProfile) descParts.push(`Financing: ${mapped.financingProfile}`);
  if (mapped.hiringSignals) descParts.push(`Hiring: ${mapped.hiringSignals}`);
  if (mapped.recentNews) descParts.push(`News: ${mapped.recentNews}`);
  if (mapped.scoreBreakdown) descParts.push(`Score: ${mapped.scoreBreakdown}`);
  props.description = descParts.filter(Boolean).join('\n\n');

  // Numeric fields
  const employees = parseNumber(mapped.employees);
  if (employees) props.numberofemployees = Math.round(employees);
  
  const revenue = parseNumber(mapped.revenue);
  if (revenue) props.annualrevenue = Math.round(revenue * 1000000);

  if (mapped.totalRaised) props.total_money_raised = mapped.totalRaised;

  // Custom enum fields
  const industry = mapIndustry(mapped.industry);
  if (industry) props.company_industry = industry;

  const fundingStage = mapFundingStage(mapped.stage || mapped.lastRound, mapped.totalRaised);
  if (fundingStage) props.funding_stage = fundingStage;

  const bizModel = mapBusinessModel(mapped.description, mapped.industry);
  if (bizModel) props.business_model_type = bizModel;

  if (mapped.totalRaised) props.total_funding_amount = mapped.totalRaised;
  
  if (OFFICE_OWNER) props.office_owner = OFFICE_OWNER;

  props.hs_lead_status = 'NEW';

  return props;
}

function buildContactProps(mapped) {
  const nameParts = splitName(mapped.contactName);
  const genericEmail = isGenericEmail(mapped.email);

  const props = {
    firstname: nameParts.first,
    lastname: nameParts.last,
    jobtitle: mapped.title || '',
    company: mapped.companyName || '',
    lifecyclestage: 'lead',
  };

  // Only use personal emails
  if (mapped.email && !genericEmail) {
    props.email = mapped.email;
  }

  if (mapped.phone) props.phone = mapped.phone;

  // Map contact role from title (snake_case internal values)
  const titleLower = (mapped.title || '').toLowerCase();
  if (titleLower.includes('ceo') || titleLower.includes('founder') || titleLower.includes('president') || titleLower.includes('owner')) {
    props.contact_role = 'decision_maker';
  } else if (titleLower.includes('cto') || titleLower.includes('cfo') || titleLower.includes('coo') || titleLower.includes('chief')) {
    props.contact_role = 'executive_sponsor';
  } else if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('director')) {
    props.contact_role = 'influencer';
  } else if (titleLower.includes('head of') || titleLower.includes('lead') || titleLower.includes('manager')) {
    props.contact_role = 'champion';
  }

  // Trigger event from news
  if (mapped.recentNews) {
    props.trigger_event = mapped.recentNews.substring(0, 200);
  }

  return props;
}

// ── Upsert logic ────────────────────────────────────────────────────────────
async function upsertCompany(mapped) {
  const domain = extractDomain(mapped.website);
  const existing = await findCompanyByDomain(domain);
  const props = buildCompanyProps(mapped);

  if (existing) {
    if (SKIP_EXISTING) return { id: existing.id, action: 'skipped' };
    const { data } = await hsApi('PATCH', `/crm/v3/objects/companies/${existing.id}`, { properties: props });
    return { id: data.id, action: 'updated' };
  } else {
    const { data } = await hsApi('POST', '/crm/v3/objects/companies', { properties: props });
    return { id: data.id, action: 'created' };
  }
}

async function upsertContact(mapped, companyId) {
  const nameParts = splitName(mapped.contactName);
  const genericEmail = isGenericEmail(mapped.email);
  const props = buildContactProps(mapped);

  let existing = null;
  if (!genericEmail && mapped.email) {
    existing = await findContactByEmail(mapped.email);
  } else {
    existing = await findContactByName(nameParts.first, nameParts.last, mapped.companyName);
  }

  let contactId, action;

  if (existing) {
    const { data } = await hsApi('PATCH', `/crm/v3/objects/contacts/${existing.id}`, { properties: props });
    contactId = data.id;
    action = 'updated';
  } else {
    try {
      const { data } = await hsApi('POST', '/crm/v3/objects/contacts', { properties: props });
      contactId = data.id;
      action = 'created';
    } catch (e) {
      if (e.message.includes('409')) {
        const found = await findContactByEmail(mapped.email);
        if (found) {
          await hsApi('PATCH', `/crm/v3/objects/contacts/${found.id}`, { properties: props });
          contactId = found.id;
          action = 'updated (conflict)';
        } else throw e;
      } else throw e;
    }
  }

  // Associate contact → company
  if (contactId && companyId) {
    try {
      await hsApi('PUT', `/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/contact_to_company`, null);
    } catch (e) {
      // Non-fatal
    }
  }

  return { id: contactId, action };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  
  console.log(`\n🔄 HubSpot Sync v2 — ${DRY_RUN ? 'DRY RUN' : STATS_ONLY ? 'STATS ONLY' : 'LIVE'}`);
  console.log(`📂 Input: ${inputFile}`);
  console.log(`📋 Sheet: ${SHEET}`);
  if (LIMIT) console.log(`🔢 Limit: ${LIMIT}`);
  if (LEAD_SOURCE) console.log(`🏷️  Source: ${LEAD_SOURCE}`);
  if (OFFICE_OWNER) console.log(`🏢 Owner: ${OFFICE_OWNER}`);
  if (SKIP_EXISTING) console.log(`⏭️  Skip existing: ON`);
  console.log('');

  // Read XLSX
  const wb = XLSX.readFile(inputFile);
  if (!wb.SheetNames.includes(SHEET)) {
    console.error(`Sheet "${SHEET}" not found. Available: ${wb.SheetNames.join(', ')}`);
    process.exit(1);
  }

  let rows = XLSX.utils.sheet_to_json(wb.Sheets[SHEET]);
  const format = detectFormat(Object.keys(rows[0] || {}));
  console.log(`📊 Format: ${format} | Total rows: ${rows.length}`);

  if (LIMIT) rows = rows.slice(0, LIMIT);

  // Group contacts by company
  const companies = new Map();
  for (const row of rows) {
    const mapped = mapRow(row, format);
    if (!mapped.companyName) continue;
    const key = mapped.companyName.toUpperCase().replace(/\s*\(.*$/, '').trim();
    if (!companies.has(key)) {
      companies.set(key, { company: mapped, contacts: [] });
    }
    if (mapped.contactName && !['Team', 'Sales Team', 'Support Team', 'Sales', 'N/A'].includes(mapped.contactName)) {
      companies.get(key).contacts.push(mapped);
    }
  }

  console.log(`🏢 Unique companies: ${companies.size}`);
  const totalContacts = [...companies.values()].reduce((sum, c) => sum + c.contacts.length, 0);
  console.log(`👤 Contacts: ${totalContacts}`);
  
  // Stats
  const withEmail = [...companies.values()].flatMap(c => c.contacts).filter(c => c.email && !isGenericEmail(c.email)).length;
  const withPhone = [...companies.values()].flatMap(c => c.contacts).filter(c => c.phone).length;
  const withPersonalEmail = [...companies.values()].flatMap(c => c.contacts).filter(c => c.email && !isGenericEmail(c.email)).length;
  console.log(`📧 Personal emails: ${withPersonalEmail} (${(withPersonalEmail/totalContacts*100).toFixed(1)}%)`);
  console.log(`📱 Direct phones: ${withPhone} (${(withPhone/totalContacts*100).toFixed(1)}%)`);
  console.log('');

  if (STATS_ONLY) return;

  if (DRY_RUN) {
    console.log('=== DRY RUN — No changes ===\n');
    let i = 0;
    for (const [key, { company, contacts }] of companies) {
      if (i >= 10) { console.log(`... and ${companies.size - 10} more`); break; }
      const domain = extractDomain(company.website);
      const hsIndustry = mapIndustry(company.industry);
      const hsFunding = mapFundingStage(company.stage || company.lastRound, company.totalRaised);
      console.log(`🏢 ${company.companyName} (${domain || 'no domain'})`);
      console.log(`   HS Industry: ${hsIndustry || '?'} | Funding: ${hsFunding || '?'} | Revenue: $${company.revenue}M`);
      contacts.forEach(c => {
        const role = buildContactProps(c).contact_role || '?';
        console.log(`   👤 ${c.contactName} [${role}] — ${c.title} | ${c.email || 'no email'} | ${c.phone || 'no phone'}`);
      });
      console.log('');
      i++;
    }
    console.log(`✅ Dry run complete. Remove --dry-run to push.`);
    return;
  }

  // Live sync
  const stats = { created: 0, updated: 0, skipped: 0, contactsCreated: 0, contactsUpdated: 0, errors: 0 };
  const checkpoint = {};
  const CHECKPOINT_FILE = inputFile.replace('.xlsx', '_hubspot_checkpoint.json');
  
  // Load checkpoint if exists
  let alreadyDone = new Set();
  if (existsSync(CHECKPOINT_FILE)) {
    const cp = JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf8'));
    alreadyDone = new Set(Object.keys(cp));
    console.log(`📌 Resuming from checkpoint: ${alreadyDone.size} companies already synced`);
  }

  let i = 0;
  for (const [key, { company, contacts }] of companies) {
    i++;
    if (alreadyDone.has(key)) { stats.skipped++; continue; }

    try {
      const result = await upsertCompany(company);
      stats[result.action === 'created' ? 'created' : result.action === 'skipped' ? 'skipped' : 'updated']++;
      console.log(`[${i}/${companies.size}] 🏢 ${company.companyName} → ${result.action} (${result.id})`);

      for (const contact of contacts) {
        try {
          const cr = await upsertContact(contact, result.id);
          if (cr.action.includes('created')) stats.contactsCreated++;
          else stats.contactsUpdated++;
          console.log(`  👤 ${contact.contactName} → ${cr.action}`);
        } catch (e) {
          stats.errors++;
          console.error(`  ❌ ${contact.contactName}: ${e.message.substring(0, 120)}`);
        }
      }

      // Save checkpoint
      checkpoint[key] = { companyId: result.id, action: result.action, contacts: contacts.length };
      if (i % 10 === 0) {
        writeFileSync(CHECKPOINT_FILE, JSON.stringify({ ...Object.fromEntries([...alreadyDone].map(k => [k, true])), ...checkpoint }, null, 2));
      }
    } catch (e) {
      stats.errors++;
      console.error(`❌ [${i}/${companies.size}] ${company.companyName}: ${e.message.substring(0, 120)}`);
    }

    if (i % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      console.log(`\n📊 Progress: ${i}/${companies.size} | ${stats.created}↑ ${stats.updated}↻ ${stats.skipped}⏭ | Contacts: ${stats.contactsCreated}↑ ${stats.contactsUpdated}↻ | Errors: ${stats.errors} | ${elapsed}s | ${apiCalls} API calls\n`);
    }
  }

  // Final checkpoint save
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({ ...Object.fromEntries([...alreadyDone].map(k => [k, true])), ...checkpoint }, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ SYNC COMPLETE (${elapsed}s, ${apiCalls} API calls)`);
  console.log(`   Companies: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`);
  console.log(`   Contacts:  ${stats.contactsCreated} created, ${stats.contactsUpdated} updated`);
  console.log(`   Errors:    ${stats.errors}`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
