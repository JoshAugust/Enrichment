/**
 * seed.js — Pre-load the 20 target companies from the Corgi Outreach Playbook
 *
 * Run: npm run seed
 *
 * Safe to re-run: uses INSERT OR IGNORE to avoid duplicates.
 * Seed data is sourced from PLAYBOOK.md.
 */

'use strict';

require('dotenv').config();
const path = require('path');
const { db } = require('../src/db');
const { v4: uuidv4 } = require('uuid');
const { generateScript } = require('../src/crm/script-generator');
const { scoreCompany } = require('../src/research/scorer');

console.log('\n🌱 Seeding Corgi Outreach database...\n');

// ── Company Seed Data ─────────────────────────────────────────────────────────
// Sourced directly from PLAYBOOK.md target companies section

const COMPANIES = [
  // ── Priority A (Operators) ──────────────────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Voltage Park',
    type: 'operator',
    website: 'https://voltagepark.com',
    description: 'Cloud AI infrastructure company with $1bn backing and 100+ customers. One of the largest independent GPU cloud operators in the US.',
    priority: 'A',
    industry_segment: 'AI Cloud',
    estimated_gpu_scale: '$1B+ infrastructure',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Vultr',
    type: 'operator',
    website: 'https://vultr.com',
    description: 'Independent cloud provider valued at $3.5bn, actively expanding GPU capacity for AI workloads.',
    priority: 'A',
    industry_segment: 'AI Cloud',
    estimated_gpu_scale: '$3.5B valuation, major GPU expansion',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Verda',
    type: 'operator',
    website: 'https://verda.io',
    description: 'European AI cloud operator (formerly DataCrunch). Raised $64M Series A including debt component. Focused on EU AI compute.',
    priority: 'A',
    industry_segment: 'AI Cloud',
    estimated_gpu_scale: '$64M Series A with debt',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Genesis Cloud',
    type: 'operator',
    website: 'https://genesiscloud.com',
    description: 'European GPU cloud with sovereign AI focus. Provides dedicated GPU infrastructure for AI and HPC workloads across European data centers.',
    priority: 'A',
    industry_segment: 'Sovereign AI / HPC',
    estimated_gpu_scale: 'unknown',
    financing_status: 'upcoming',
  },
  {
    id: uuidv4(),
    name: 'Cirrascale Cloud Services',
    type: 'operator',
    website: 'https://cirrascale.com',
    description: 'Managed AI infrastructure and GPU cloud provider. Specializes in purpose-built AI compute environments.',
    priority: 'A',
    industry_segment: 'AI Cloud',
    estimated_gpu_scale: 'unknown',
    financing_status: 'unknown',
  },
  {
    id: uuidv4(),
    name: 'HIVE / BUZZ HPC',
    type: 'operator',
    website: 'https://hivelocity.net',
    description: 'Sovereign AI cloud provider in Canada, targeting 11,000 GPUs by end-2026. Building national AI compute capacity.',
    priority: 'A',
    industry_segment: 'Sovereign AI / HPC',
    estimated_gpu_scale: '11,000 GPUs by 2026',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'TensorWave',
    type: 'operator',
    website: 'https://tensorwave.com',
    description: 'AMD-focused AI infrastructure provider with fresh capital. Building large-scale GPU clusters using AMD Instinct accelerators.',
    priority: 'A',
    industry_segment: 'AI Cloud',
    estimated_gpu_scale: 'unknown',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Hyperbolic',
    type: 'operator',
    website: 'https://hyperbolic.xyz',
    description: 'Open-access AI cloud and GPU marketplace. Democratizing access to GPU compute for AI development.',
    priority: 'A',
    industry_segment: 'AI Cloud',
    estimated_gpu_scale: 'unknown',
    financing_status: 'upcoming',
  },
  // ── Priority B (Operators + Lenders) ────────────────────────────────────────
  {
    id: uuidv4(),
    name: 'CUDO Compute',
    type: 'operator',
    website: 'https://cudocompute.com',
    description: 'GPU cloud provider focused on managed clusters and distributed compute. Serves AI and ML workloads globally.',
    priority: 'B',
    industry_segment: 'AI Cloud',
    estimated_gpu_scale: 'unknown',
    financing_status: 'unknown',
  },
  {
    id: uuidv4(),
    name: 'Ori',
    type: 'operator',
    website: 'https://ori.co',
    description: 'AI infrastructure orchestration platform working with telecom partners. Enables distributed GPU deployment via telco networks.',
    priority: 'B',
    industry_segment: 'AI Infrastructure',
    estimated_gpu_scale: 'unknown',
    financing_status: 'unknown',
  },
  {
    id: uuidv4(),
    name: 'phoenixNAP',
    type: 'operator',
    website: 'https://phoenixnap.com',
    description: 'Bare-metal and GPU server provider with global data center footprint. Offers dedicated GPU infrastructure for enterprise AI.',
    priority: 'B',
    industry_segment: 'Colocation / Data Center',
    estimated_gpu_scale: 'unknown',
    financing_status: 'unknown',
  },
  {
    id: uuidv4(),
    name: 'Colovore',
    type: 'operator',
    website: 'https://colovore.com',
    description: 'Ultra-dense liquid-cooled AI data centers. Specializes in high-density GPU deployments with advanced cooling infrastructure.',
    priority: 'B',
    industry_segment: 'Colocation / Data Center',
    estimated_gpu_scale: 'unknown',
    financing_status: 'upcoming',
  },
  {
    id: uuidv4(),
    name: 'Upper90',
    type: 'lender',
    website: 'https://upper90.com',
    description: 'Asset-backed private credit fund. Led the Crusoe Energy credit facility — a landmark GPU infrastructure financing deal.',
    priority: 'B',
    industry_segment: 'Private Credit',
    estimated_gpu_scale: '$50M-$200M deal size',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Victory Park Capital',
    type: 'lender',
    website: 'https://victoryparkcapital.com',
    description: 'Asset-backed credit specialist with expertise in technology and infrastructure lending. Active in alternative asset finance.',
    priority: 'B',
    industry_segment: 'Private Credit',
    estimated_gpu_scale: '$100M-$500M deal size',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'ORIX USA Growth Capital',
    type: 'lender',
    website: 'https://orix.com',
    description: 'Growth lending division of ORIX USA. Invested in Crusoe Energy as part of AI infrastructure credit exposure.',
    priority: 'B',
    industry_segment: 'Equipment Finance',
    estimated_gpu_scale: '$50M-$200M deal size',
    financing_status: 'active',
  },
  // ── Priority C (Lenders / Participants) ─────────────────────────────────────
  {
    id: uuidv4(),
    name: 'King Street Capital Management',
    type: 'lender',
    website: 'https://kingstreet.com',
    description: 'Alternative investment manager with active AI data center credit strategy. Focused on credit and special situations.',
    priority: 'C',
    industry_segment: 'Asset Management',
    estimated_gpu_scale: '$50M-$300M deal size',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'FS Investments',
    type: 'lender',
    website: 'https://fsinvestments.com',
    description: 'Alternative asset manager that participated in the Crusoe Energy credit facility. Active in direct lending and alternative credit.',
    priority: 'C',
    industry_segment: 'Private Credit',
    estimated_gpu_scale: '$50M-$300M deal size',
    financing_status: 'active',
  },
  {
    id: uuidv4(),
    name: 'Liberty Mutual Investments',
    type: 'lender',
    website: 'https://libertymutual.com/investments',
    description: 'Insurance investment arm that participated in Crusoe credit facility. Invests in infrastructure credit and alternative assets.',
    priority: 'C',
    industry_segment: 'Insurance / Asset Management',
    estimated_gpu_scale: '$50M-$200M deal size',
    financing_status: 'unknown',
  },
  {
    id: uuidv4(),
    name: 'BCI',
    type: 'lender',
    website: 'https://bci.ca',
    description: 'British Columbia Investment Management Corporation. Participated in the Crusoe Energy credit facility. Major institutional LP.',
    priority: 'C',
    industry_segment: 'Institutional / Pension',
    estimated_gpu_scale: '$100M+ deal size',
    financing_status: 'unknown',
  },
  {
    id: uuidv4(),
    name: 'Armada Credit Partners',
    type: 'lender',
    website: 'https://armadacredit.com',
    description: 'Credit fund that financed the Verda (DataCrunch) expansion. Specialist in technology and infrastructure debt.',
    priority: 'C',
    industry_segment: 'Private Credit',
    estimated_gpu_scale: '$50M-$150M deal size',
    financing_status: 'active',
  },
];

// ── Sample Contacts ───────────────────────────────────────────────────────────
// Known or inferred contacts from playbook context

function buildSampleContacts(companyMap) {
  return [
    // Voltage Park
    {
      id: uuidv4(), company_id: companyMap['Voltage Park'],
      name: 'Marcus Shen', title: 'CEO', email: null,
      linkedin_url: 'https://linkedin.com/in/marcusshen', source: 'linkedin', verified: 0,
    },
    // Vultr
    {
      id: uuidv4(), company_id: companyMap['Vultr'],
      name: 'J.J. Kardwell', title: 'President', email: null,
      linkedin_url: 'https://linkedin.com/in/jjkardwell', source: 'linkedin', verified: 0,
    },
    // Verda (DataCrunch)
    {
      id: uuidv4(), company_id: companyMap['Verda'],
      name: 'Joakim Arvidsson', title: 'CEO', email: null,
      linkedin_url: 'https://linkedin.com/in/joakim-arvidsson', source: 'linkedin', verified: 0,
    },
    // Upper90
    {
      id: uuidv4(), company_id: companyMap['Upper90'],
      name: 'David Acharya', title: 'Managing Partner', email: null,
      linkedin_url: 'https://linkedin.com/in/davidacharya', source: 'linkedin', verified: 0,
    },
    // Victory Park Capital
    {
      id: uuidv4(), company_id: companyMap['Victory Park Capital'],
      name: 'Richard Levy', title: 'Managing Partner', email: null,
      linkedin_url: 'https://linkedin.com/in/richard-levy', source: 'linkedin', verified: 0,
    },
    // Armada Credit Partners
    {
      id: uuidv4(), company_id: companyMap['Armada Credit Partners'],
      name: 'Research Needed', title: 'Managing Director', email: null,
      linkedin_url: null, source: 'manual', verified: 0,
    },
  ];
}

// ── Run Seed ──────────────────────────────────────────────────────────────────

const insertCompany = db.prepare(`
  INSERT OR IGNORE INTO companies
    (id, name, type, website, description, priority, industry_segment,
     estimated_gpu_scale, financing_status, qualification_score)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertContact = db.prepare(`
  INSERT OR IGNORE INTO contacts
    (id, company_id, name, title, email, phone, linkedin_url, source, verified)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertScript = db.prepare(`
  INSERT OR IGNORE INTO call_scripts
    (id, company_id, script_version, customized_script, buyer_type)
  VALUES (?, ?, ?, ?, ?)
`);

// Use a transaction for atomicity and speed
const seedAll = db.transaction(() => {
  let companyCount = 0;
  let contactCount = 0;
  let scriptCount  = 0;
  const companyMap = {}; // name → id

  // 1. Insert companies
  for (const c of COMPANIES) {
    const { score } = scoreCompany(c, [], {});

    insertCompany.run(
      c.id, c.name, c.type, c.website, c.description,
      c.priority, c.industry_segment, c.estimated_gpu_scale,
      c.financing_status, score
    );
    companyMap[c.name] = c.id;
    companyCount++;

    // Generate and store initial call script
    const script = generateScript(c);
    const scriptId = uuidv4();
    insertScript.run(scriptId, c.id, script.version, JSON.stringify(script), script.buyer_type);
    scriptCount++;
  }

  // 2. Insert sample contacts
  const contacts = buildSampleContacts(companyMap);
  for (const contact of contacts) {
    insertContact.run(
      contact.id, contact.company_id, contact.name, contact.title,
      contact.email || null, null, contact.linkedin_url || null,
      contact.source, contact.verified
    );
    contactCount++;
  }

  return { companyCount, contactCount, scriptCount };
});

try {
  const { companyCount, contactCount, scriptCount } = seedAll();

  console.log('✅ Seed complete:');
  console.log(`   Companies:    ${companyCount}`);
  console.log(`   Contacts:     ${contactCount}`);
  console.log(`   Call scripts: ${scriptCount}`);

  // Print priority breakdown
  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) as count, ROUND(AVG(qualification_score), 1) as avg_score
    FROM companies GROUP BY priority ORDER BY priority
  `).all();

  console.log('\n📊 Priority breakdown:');
  for (const row of byPriority) {
    console.log(`   Priority ${row.priority}: ${row.count} companies, avg score: ${row.avg_score}`);
  }

  console.log('\n🐕 Database ready.\n');
} catch (err) {
  console.error('❌ Seed failed:', err);
  process.exit(1);
}
