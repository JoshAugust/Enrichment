import { readFileSync, writeFileSync } from 'fs';
import XLSX from 'xlsx';

const TOKEN = process.env.HUBSPOT_TOKEN;
const OWNER_ID = '163487374';
const H = { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };

// Load data sources
const ds = XLSX.utils.sheet_to_json(XLSX.readFile('data/dealscope/DealScope_Enriched_v3.xlsx').Sheets['Company Summary']);
const dsLeads = XLSX.utils.sheet_to_json(XLSX.readFile('data/dealscope/DealScope_Enriched_v3.xlsx').Sheets['Enriched Leads']);
const gpu = XLSX.utils.sheet_to_json(XLSX.readFile('pipeline/gpu-operators/DealScope_GPU_Operators_v3.xlsx').Sheets['Enriched Leads']);

// Build contact lookup from leads sheet (multiple contacts per company)
const contactsByCompany = {};
for (const l of dsLeads) {
  const key = (l['Company Name'] || '').trim().toLowerCase();
  if (!contactsByCompany[key]) contactsByCompany[key] = [];
  contactsByCompany[key].push(l);
}

// GPU contacts
const gpuContactsByCompany = {};
for (const g of gpu) {
  const key = (g['Company'] || '').trim().toLowerCase();
  if (!gpuContactsByCompany[key]) gpuContactsByCompany[key] = [];
  gpuContactsByCompany[key].push(g);
}

// Fetch ALL existing company names + domains
async function fetchExisting() {
  let after, names = new Set();
  while (true) {
    const body = { filterGroups: [], properties: ['name', 'domain'], limit: 100 };
    if (after) body.after = after;
    const r = await fetch('https://api.hubapi.com/crm/v3/objects/companies/search', {
      method: 'POST', headers: H, body: JSON.stringify(body)
    });
    const j = await r.json();
    for (const c of (j.results || [])) {
      names.add((c.properties.name || '').trim().toLowerCase());
      if (c.properties.domain) names.add(c.properties.domain.toLowerCase().replace(/^www\./, ''));
    }
    if (j.paging?.next?.after) after = j.paging.next.after; else break;
  }
  return names;
}

function cleanDomain(w) {
  return (w || '').toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').trim();
}

function safeNum(v) {
  if (!v && v !== 0) return null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : String(n);
}

function mapStage(s) {
  if (!s) return '';
  s = s.toLowerCase();
  if (s.includes('seed')) return 'seed';
  if (s.includes('series a')) return 'series_a';
  if (s.includes('series b')) return 'series_b';
  if (s.includes('series c')) return 'series_c';
  if (s.includes('series d') || s.includes('pre-ipo')) return 'series_d_plus';
  if (s.includes('growth')) return 'growth';
  if (s.includes('public') || s.includes('ipo') || s.includes('listed')) return 'public';
  if (s.includes('private')) return 'private';
  return '';
}

function mapConf(c) {
  if (!c) return '';
  c = c.toLowerCase();
  if (c.includes('high')) return 'high';
  if (c.includes('medium')) return 'medium';
  if (c.includes('low')) return 'low';
  return '';
}

async function run() {
  const existing = await fetchExisting();
  console.log('Existing records:', existing.size);

  // Build candidate list
  const seen = new Set();
  const candidates = [];

  for (const c of ds) {
    const name = (c['Company Name'] || '').trim();
    const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = cleanDomain(c['Website']);
    if (existing.has(name.toLowerCase()) || (domain && existing.has(domain))) continue;
    if (seen.has(nameKey)) continue;
    seen.add(nameKey);
    candidates.push({ source: 'ds', name, domain, score: c['Blueprint Score'] || 0, data: c });
  }

  for (const c of gpu) {
    const name = (c['Company'] || '').trim();
    const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = cleanDomain(c['Website']);
    if (existing.has(name.toLowerCase()) || (domain && existing.has(domain))) continue;
    if (seen.has(nameKey)) continue;
    seen.add(nameKey);
    candidates.push({ source: 'gpu', name, domain, score: c['RVG Score'] || 0, data: c });
  }

  candidates.sort((a, b) => b.score - a.score);
  const top100 = candidates.slice(0, 100);
  console.log('Pushing', top100.length, 'companies. Score range:', top100[0]?.score, '-', top100[top100.length-1]?.score);

  let companiesCreated = 0, contactsCreated = 0;

  for (let i = 0; i < top100.length; i++) {
    const c = top100[i];
    const d = c.data;
    const isGpu = c.source === 'gpu';

    // Build company properties
    const props = {
      name: c.name,
      hubspot_owner_id: OWNER_ID,
      hs_lead_status: 'NEW',
      lifecyclestage: 'lead',
    };
    if (c.domain) props.domain = c.domain;

    // Custom fields
    props.blueprint_score = String(c.score);
    if (isGpu) {
      const emp = safeNum(d['Employees']); if (emp) props.employee_estimate = emp;
      props.startup_stage = mapStage(d['Stage']) || '';
      if (d['Description']) props.company_description_long = String(d['Description']).slice(0, 65535);
      if (d['Score Breakdown']) props.score_breakdown = String(d['Score Breakdown']).slice(0, 65535);
      if (d['Industry']) props.sector_vertical = String(d['Industry']);
      const yr = safeNum(d['Founded']); if (yr) props.founded_year = yr;
      if (d['HQ']) props.hq_state = String(d['HQ']);
      if (d['Company LinkedIn']) props.company_linkedin_url = String(d['Company LinkedIn']);
      if (d['Description Source']) props.description_source = String(d['Description Source']);
      // Build news from GPU fields
      let news = [];
      if (d['Financing Profile']) news.push('Financing: ' + d['Financing Profile']);
      if (d['Last Round']) news.push('Last round: ' + d['Last Round']);
      if (d['GPU Fleet']) news.push('GPU fleet: ' + d['GPU Fleet'] + ' GPUs');
      if (d['Hardware']) news.push('Hardware: ' + d['Hardware']);
      if (d['Total Raised']) news.push('Total raised: ' + d['Total Raised']);
      if (news.length) props.recent_news = news.join('\n');
      if (d['Direct Phone']) props.phone = String(d['Direct Phone']);
    } else {
      const emp = safeNum(d['Employees']); if (emp) props.employee_estimate = emp;
      const rev = safeNum(d['Revenue (USD M)']); if (rev) props.annual_revenue_usd_m = rev;
      props.revenue_confidence = mapConf(d['Revenue Confidence']);
      props.startup_stage = mapStage(d['Startup Stage']) || '';
      if (d['Company Description']) props.company_description_long = String(d['Company Description']).slice(0, 65535);
      if (d['Score Breakdown']) props.score_breakdown = String(d['Score Breakdown']).slice(0, 65535);
      if (d['Industry / Vertical']) props.sector_vertical = String(d['Industry / Vertical']);
      const yr = safeNum(d['Founded']); if (yr) props.founded_year = yr;
      if (d['State']) props.hq_state = String(d['State']);
      if (d['Company LinkedIn']) props.company_linkedin_url = String(d['Company LinkedIn']);
      if (d['Recent News']) props.recent_news = String(d['Recent News']).slice(0, 65535);
      if (d['Hiring Signals']) props.hiring_signals = String(d['Hiring Signals']).slice(0, 65535);
      if (d['Description Source']) props.description_source = String(d['Description Source']);
      if (d['Revenue Source']) props.revenue_source = String(d['Revenue Source']);
      if (d['Employee Source']) props.employee_source = String(d['Employee Source']);
      if (d['News Source']) props.news_source = String(d['News Source']);
      // Phone from All Phones column
      if (d['All Phones']) { props.phone = String(d['All Phones']).split(',')[0].trim(); props.phone_source = 'DealScope enrichment'; }
      if (d['All Emails']) { props.email_source = 'DealScope enrichment'; }
    }

    // Create company
    const cr = await fetch('https://api.hubapi.com/crm/v3/objects/companies', {
      method: 'POST', headers: H, body: JSON.stringify({ properties: props })
    });
    const cj = await cr.json();
    if (!cj.id) {
      console.log('❌ Company failed:', c.name, cj.message || JSON.stringify(cj).slice(0, 200));
      continue;
    }
    companiesCreated++;
    const companyId = cj.id;

    // Create contacts
    const contacts = isGpu
      ? (gpuContactsByCompany[c.name.toLowerCase()] || [])
      : (contactsByCompany[c.name.toLowerCase()] || []);

    for (const ct of contacts) {
      const cName = isGpu ? (ct['Contact Name'] || '') : (ct['Contact Name'] || '');
      const parts = cName.split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      if (!firstName && !lastName) continue;

      const cProps = {
        firstname: firstName,
        lastname: lastName,
        hubspot_owner_id: OWNER_ID,
        lifecyclestage: 'lead',
      };
      const title = isGpu ? ct['Contact Title'] : ct['Contact Title'];
      if (title) cProps.jobtitle = String(title);
      const email = isGpu ? ct['Email'] : ct['Email Address'];
      if (email && !email.includes('(')) cProps.email = String(email);
      const phone = isGpu ? ct['Direct Phone'] : ct['Direct Phone'];
      if (phone) cProps.phone = String(phone);
      const li = isGpu ? ct['LinkedIn URL'] : ct['LinkedIn URL'];
      if (li) cProps.hs_linkedin_url = String(li);

      const ccr = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST', headers: H, body: JSON.stringify({ properties: cProps })
      });
      const ccj = await ccr.json();
      if (ccj.id) {
        contactsCreated++;
        // Associate contact with company
        await fetch(`https://api.hubapi.com/crm/v4/objects/contact/${ccj.id}/associations/company/${companyId}`, {
          method: 'PUT', headers: H,
          body: JSON.stringify([{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }])
        });
      }
    }

    if ((i + 1) % 25 === 0) console.log(`  Progress: ${i + 1}/100 companies...`);
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n✅ Done!');
  console.log('Companies created:', companiesCreated);
  console.log('Contacts created:', contactsCreated);
}

run().catch(e => console.error(e));
