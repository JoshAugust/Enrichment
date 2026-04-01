'use strict';

/**
 * seed-templates.js
 *
 * Seeds email_templates and call_scripts tables, then generates
 * personalized email drafts for all Priority-A companies.
 *
 * Safe to re-run — uses INSERT OR IGNORE / INSERT OR REPLACE.
 *
 * Run: node backend/scripts/seed-templates.js
 */

const path = require('path');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.resolve(__dirname, '../data/corgi_outreach.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────────────────────────────────────
// 0. CREATE email_templates TABLE if it doesn't exist
// ─────────────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS email_templates (
    id                 TEXT PRIMARY KEY,
    name               TEXT NOT NULL UNIQUE,
    buyer_type         TEXT NOT NULL,          -- operator | lender | arranger | all
    subject            TEXT NOT NULL,
    body               TEXT NOT NULL,          -- Handlebars template with {{merge_fields}}
    sequence_position  INTEGER NOT NULL DEFAULT 1,   -- 1=cold intro, 2=followup1, 3=followup2, 4=breakup
    days_after_previous INTEGER NOT NULL DEFAULT 0,  -- days after previous sequence email
    created_at         TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
console.log('✅ email_templates table ensured');

// ─────────────────────────────────────────────────────────────────────────────
// 1. EMAIL TEMPLATES (7)
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  // ── 1. Cold Intro — GPU Operator ────────────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Cold Intro — GPU Operator',
    buyer_type: 'operator',
    subject: 'Reducing residual value risk on your GPU fleet',
    body: `Hi {{contact_name}},

I'll keep this short.

Corgi provides a residual value floor on data-center GPUs — the part of the underwriting that makes lenders nervous about hardware value at maturity (typically 3–5 years out).

{{#if gpu_fleet_scale}}For an operator with a fleet like {{company_name}}'s — {{gpu_fleet_scale}} — this directly improves your cost of capital and gives lenders the comfort to offer better leverage, longer tenor, or tighter pricing.{{else}}For a GPU operator like {{company_name}}, this translates directly into a better debt structure: lower spread, longer tenor, or higher leverage — because lenders have a clear floor on collateral value.{{/if}}

We work with GPU owners and their lenders to make financing cleaner. Not adding complexity — removing the one piece that typically slows deals down.

Worth a 20-minute call with our founders, Isaac and Josh, to see if this fits your current or upcoming financing plans?

Best,
Corgi Team`,
    sequence_position: 1,
    days_after_previous: 0,
  },

  // ── 2. Cold Intro — Lender ──────────────────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Cold Intro — Lender',
    buyer_type: 'lender',
    subject: 'GPU collateral protection for your lending portfolio',
    body: `Hi {{contact_name}},

Quick intro: Corgi builds residual value solutions for data-center GPUs.

{{#if contact_title}}As {{contact_title}} at {{company_name}}, you're likely evaluating AI infrastructure credit opportunities where GPU collateral at maturity is one of the harder underwriting questions.{{else}}At {{company_name}}, you're likely evaluating AI infrastructure credit where GPU collateral value at maturity is one of the harder underwriting questions.{{/if}}

We provide a residual value floor that removes that uncertainty — giving your IC a cleaner recovery assumption and more confidence to lend at better LTV.

The result: more GPU-backed loans deployed, with better downside protection built into the structure.

Open to a short call to see if this fits your current credit box?

Best,
Corgi Team`,
    sequence_position: 1,
    days_after_previous: 0,
  },

  // ── 3. Cold Intro — Reinsurer/Arranger ─────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Cold Intro — Reinsurer/Arranger',
    buyer_type: 'arranger',
    subject: 'GPU residual value — new specialty line opportunity',
    body: `Hi {{contact_name}},

I wanted to flag an emerging capacity opportunity we think is well-suited for {{company_name}}.

The GPU infrastructure market is crossing $100B in financed assets — and the core underwriting challenge is residual value at maturity. Lenders want to deploy into AI infra but need a clear floor on hardware value 3–5 years out. That's where Corgi comes in.

The structure is analogous to automotive residual value programs — an asset class with a proven reinsurance track record — applied to data-center GPUs. The market is early, deal flow is growing, and there's real capacity need from well-capitalised counterparties.

Our founders, Isaac and Josh, are building out the reinsurance relationships now. Would it make sense to have a brief introductory call?

Best,
Corgi Team`,
    sequence_position: 1,
    days_after_previous: 0,
  },

  // ── 4. Follow-Up 1 (Day 3, all types) ───────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Follow-Up 1',
    buyer_type: 'all',
    subject: 'Re: [original subject]',
    body: `Hi {{contact_name}},

Following up on my note from a few days ago — wanted to add one data point.

GPU infrastructure lending is accelerating fast, but most credit structures still carry unmitigated residual value risk at maturity. Lenders who can price that risk cleanly are winning deals. Those who can't are sitting on the sideline.

Corgi addresses that exact gap. Happy to send a one-pager or set up a quick call if timing works.

Best,
Corgi Team`,
    sequence_position: 2,
    days_after_previous: 3,
  },

  // ── 5. Follow-Up 2 (Day 7, all types) ───────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Follow-Up 2',
    buyer_type: 'all',
    subject: "Quick question about {{company_name}}'s GPU strategy",
    body: `Hi {{contact_name}},

One quick question: is residual value on GPU collateral something that's come up in your financing conversations recently — either as a concern from lenders, or something you're actively trying to manage?

Asking because the answer shapes whether Corgi is immediately relevant to you or more of a future conversation.

Either way, happy to connect.

Best,
Corgi Team`,
    sequence_position: 3,
    days_after_previous: 7,
  },

  // ── 6. Follow-Up 3 (Day 14, break-up) ───────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Follow-Up 3 (Break-Up)',
    buyer_type: 'all',
    subject: 'Closing the loop',
    body: `Hi {{contact_name}},

I'll leave you alone after this — just wanted to close the loop properly.

If GPU residual value risk ever becomes a live issue for {{company_name}}'s financing, Corgi is the company to know. We're early, the founders are accessible, and the structure is purpose-built for this problem.

No action needed. If timing ever shifts, my details are below.

Best,
Corgi Team`,
    sequence_position: 4,
    days_after_previous: 14,
  },

  // ── 7. Warm Intro ────────────────────────────────────────────────────────────
  {
    id: uuidv4(),
    name: 'Warm Intro',
    buyer_type: 'all',
    subject: 'Introduction — Corgi x {{company_name}}',
    body: `Hi {{contact_name}},

{{#if referrer_name}}{{referrer_name}} suggested I reach out — thought there was a natural overlap between what Corgi is building and what {{company_name}} is working on.{{else}}We were connected through a mutual introduction and I wanted to follow up.{{/if}}

Corgi provides residual value solutions for data-center GPUs — helping GPU owners and their lenders get a better debt structure by reducing future hardware value risk. The core benefit is capital efficiency: lower cost of debt, higher leverage, or longer tenor.

Given {{company_name}}'s position in the market, I think there's a clear conversation to be had. Would love to introduce you to our founders, Isaac and Josh, for a 20-minute call at your convenience.

Best,
Corgi Team`,
    sequence_position: 1,
    days_after_previous: 0,
  },
];

// Insert templates
const insertTemplate = db.prepare(`
  INSERT OR IGNORE INTO email_templates
    (id, name, buyer_type, subject, body, sequence_position, days_after_previous)
  VALUES
    (@id, @name, @buyer_type, @subject, @body, @sequence_position, @days_after_previous)
`);

const insertTemplates = db.transaction((templates) => {
  let count = 0;
  for (const t of templates) {
    const result = insertTemplate.run(t);
    if (result.changes > 0) count++;
  }
  return count;
});

const templatesInserted = insertTemplates(EMAIL_TEMPLATES);
console.log(`✅ Email templates: ${templatesInserted} inserted (${EMAIL_TEMPLATES.length - templatesInserted} already existed)`);

// ─────────────────────────────────────────────────────────────────────────────
// 2. CALL SCRIPTS — one per A-tier company, version based on buyer_type
// ─────────────────────────────────────────────────────────────────────────────

// Script content from PLAYBOOK.md + training guide
const SCRIPT_CONTENT = {
  A: {
    lines: [
      "We help GPU owners get cheaper debt by reducing future collateral risk on the GPUs.",
      "Is financing new GPU capacity a priority for you this year?",
      "We work with structures that give lenders more comfort on residual value at maturity.",
      "That can help improve leverage, tenor, or pricing.",
      "Would it be useful to show you how this could fit into an existing or upcoming financing package?"
    ],
    followups: [
      "Are you financing owned GPUs, leased GPUs, or both?",
      "Who usually leads those conversations: treasury, infra, CFO, or a financing partner?",
      "Do lenders push back more on leverage, tenor, or pricing?"
    ]
  },
  B: {
    lines: [
      "We help AI infrastructure operators get a better debt structure on GPU purchases.",
      "A lot of lenders still get stuck on one question: what are the GPUs worth at maturity?",
      "We solve for that part of the underwriting problem.",
      "If this is relevant, I would like to set up 20 minutes with Isaac and Josh.",
      "Would next week work?"
    ],
    followups: [
      "Do you already have a lender asking about collateral value at maturity?",
      "Would you look at this for the next cluster only, or as a standard financing tool?",
      "Do lenders push back more on leverage, tenor, or pricing?"
    ]
  },
  C: {
    lines: [
      "We help lenders make more GPU-backed loans with better downside protection on the hardware.",
      "Are you currently looking at AI infrastructure or GPU-backed credit opportunities?",
      "We are building a residual value solution that gives lenders a clearer floor on collateral value.",
      "It is meant to make the deal easier to underwrite, not add complexity.",
      "Open to a short call to see if it fits your credit box?"
    ],
    followups: [
      "Are you currently looking at AI infrastructure or GPU-backed credit opportunities?",
      "Do you already have a lender asking about collateral value at maturity?",
      "Can they plausibly hold or finance $50M-$150M+ of GPU hardware over time?"
    ]
  },
  D: {
    lines: [
      "We help data centers finance more GPUs without taking as much pricing pain from residual value uncertainty.",
      "Some lenders love the demand story but hesitate on end-of-term hardware value.",
      "We address that issue directly.",
      "If you are raising debt or expect to, this could be relevant.",
      "Can I book a short call with the founders?"
    ],
    followups: [
      "Who leads financing conversations: treasury, infra, CFO, or a financing partner?",
      "Do lenders push back more on leverage, tenor, or pricing?",
      "Is there a live or upcoming debt process in the next 6-12 months?"
    ]
  },
  E: {
    lines: [
      "We help reduce the cost of capital for GPU infrastructure.",
      "The reason is simple: lenders get more comfort on future hardware value.",
      "If you are financing clusters, this may help.",
      "I am not trying to sell you a policy on this call.",
      "I just want to see whether a 20-minute discussion is worth it."
    ],
    followups: [
      "Are you financing owned GPUs, leased GPUs, or both?",
      "Would better cost of capital, longer tenor, or higher leverage matter to you?",
      "Is there a clear lender, credit fund, or treasury contact behind the build?"
    ]
  }
};

// Script version selection by buyer_type
function selectScriptVersion(buyerType) {
  switch (buyerType) {
    case 'operator':  return 'A'; // Cheaper Capital — direct benefit-first
    case 'lender':    return 'C'; // Lender Angle
    case 'arranger':  return 'E'; // Simple CTA — lowest pressure for reinsurers
    default:          return 'E';
  }
}

// Get A-tier companies
const aTierCompanies = db.prepare(
  "SELECT id, name, type FROM companies WHERE priority='A'"
).all();

const insertScript = db.prepare(`
  INSERT OR IGNORE INTO call_scripts
    (id, company_id, script_version, customized_script, buyer_type)
  VALUES
    (@id, @company_id, @script_version, @customized_script, @buyer_type)
`);

const insertScripts = db.transaction((companies) => {
  let count = 0;
  for (const company of companies) {
    const version = selectScriptVersion(company.type);
    const content = SCRIPT_CONTENT[version];
    const result = insertScript.run({
      id: uuidv4(),
      company_id: company.id,
      script_version: version,
      customized_script: JSON.stringify({
        company: company.name,
        buyer_type: company.type,
        lines: content.lines,
        followups: content.followups,
        qualification_checklist: [
          'Do they own or finance GPUs directly?',
          'Is there a live or upcoming debt process in the next 6-12 months?',
          'Would better cost of capital, longer tenor, or higher leverage matter?',
          'Is there a clear lender, credit fund, or treasury contact?',
          'Can they plausibly hold or finance $50M-$150M+ of GPU hardware?'
        ]
      }),
      buyer_type: company.type,
    });
    if (result.changes > 0) count++;
  }
  return count;
});

const scriptsInserted = insertScripts(aTierCompanies);
console.log(`✅ Call scripts: ${scriptsInserted} inserted for A-tier companies (${aTierCompanies.length - scriptsInserted} already existed)`);

// ─────────────────────────────────────────────────────────────────────────────
// 3. EMAIL DRAFTS — for A-tier companies with contacts that have emails
// ─────────────────────────────────────────────────────────────────────────────

// Fetch templates by buyer_type for easy lookup
const getTemplate = (buyerType) => {
  // Try exact match first
  let tmpl = db.prepare(
    "SELECT * FROM email_templates WHERE buyer_type=? AND sequence_position=1 LIMIT 1"
  ).get(buyerType);
  // Fall back to 'all' warm intro won't be used here; fallback to operator
  if (!tmpl) {
    tmpl = db.prepare(
      "SELECT * FROM email_templates WHERE buyer_type='operator' AND sequence_position=1 LIMIT 1"
    ).get();
  }
  return tmpl;
};

// Fetch A-tier companies + contacts with emails
const contactsWithEmails = db.prepare(`
  SELECT
    cont.id        AS contact_id,
    cont.name      AS contact_name,
    cont.email     AS contact_email,
    cont.title     AS contact_title,
    c.id           AS company_id,
    c.name         AS company_name,
    c.type         AS company_type,
    c.description  AS company_description,
    c.estimated_gpu_scale AS gpu_fleet_scale
  FROM contacts cont
  JOIN companies c ON c.id = cont.company_id
  WHERE c.priority = 'A'
    AND cont.email IS NOT NULL
    AND cont.email != ''
  ORDER BY c.name, cont.name
`).all();

// Handlebars-lite: replace {{var}} and basic {{#if var}}...{{else}}...{{/if}}
function renderTemplate(template, vars) {
  let text = template;

  // Handle {{#if VAR}}...{{else}}...{{/if}}
  text = text.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, ifBlock, elseBlock) => {
      return (vars[key] && vars[key] !== '') ? ifBlock : elseBlock;
    });

  // Handle {{#if VAR}}...{{/if}} (no else)
  text = text.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key, block) => {
      return (vars[key] && vars[key] !== '') ? block : '';
    });

  // Replace simple {{vars}}
  text = text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');

  return text.trim();
}

const insertDraft = db.prepare(`
  INSERT OR IGNORE INTO email_drafts
    (id, contact_id, subject, body, template_name, status, to_email, sequence_day)
  VALUES
    (@id, @contact_id, @subject, @body, @template_name, 'draft', @to_email, @sequence_day)
`);

const insertDrafts = db.transaction((contacts) => {
  let count = 0;
  for (const contact of contacts) {
    const tmpl = getTemplate(contact.company_type);
    if (!tmpl) continue;

    const vars = {
      contact_name:    contact.contact_name ? contact.contact_name.split(' ')[0] : 'there',
      contact_title:   contact.contact_title || '',
      company_name:    contact.company_name || '',
      gpu_fleet_scale: contact.gpu_fleet_scale || '',
      referrer_name:   '',
    };

    const subject = renderTemplate(tmpl.subject, vars);
    const body    = renderTemplate(tmpl.body, vars);

    const result = insertDraft.run({
      id:            uuidv4(),
      contact_id:    contact.contact_id,
      subject,
      body,
      template_name: tmpl.name,
      to_email:      contact.contact_email,
      sequence_day:  0,
    });
    if (result.changes > 0) count++;
  }
  return count;
});

const draftsInserted = insertDrafts(contactsWithEmails);
console.log(`✅ Email drafts: ${draftsInserted} generated (${contactsWithEmails.length} A-tier contacts with emails)`);

// ─────────────────────────────────────────────────────────────────────────────
// 4. PRE-FILL PIPELINE — check companies schema for outreach status field
// ─────────────────────────────────────────────────────────────────────────────

// companies table has no outreach_status column per schema — it uses
// financing_status as the nearest proxy. We'll use outreach_log instead
// to record that these companies are queued, and we'll add a note.

// Check if outreach_status column exists
const colCheck = db.prepare(
  "SELECT COUNT(*) as cnt FROM pragma_table_info('companies') WHERE name='outreach_status'"
).get();

if (colCheck.cnt === 0) {
  // Add the column
  db.exec("ALTER TABLE companies ADD COLUMN outreach_status TEXT DEFAULT 'uncontacted'");
  console.log('✅ Added outreach_status column to companies');
}

const setQueued = db.prepare(
  "UPDATE companies SET outreach_status='queued' WHERE priority='A' AND (outreach_status IS NULL OR outreach_status='uncontacted')"
);
const updateResult = setQueued.run();
console.log(`✅ Pipeline: ${updateResult.changes} A-tier companies set to 'queued'`);

// ─────────────────────────────────────────────────────────────────────────────
// 5. VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

const counts = {
  email_templates: db.prepare('SELECT COUNT(*) as n FROM email_templates').get().n,
  call_scripts:    db.prepare('SELECT COUNT(*) as n FROM call_scripts').get().n,
  email_drafts:    db.prepare('SELECT COUNT(*) as n FROM email_drafts').get().n,
  companies_A:     db.prepare("SELECT COUNT(*) as n FROM companies WHERE priority='A'").get().n,
  queued:          db.prepare("SELECT COUNT(*) as n FROM companies WHERE priority='A' AND outreach_status='queued'").get().n,
};

console.log('\n─────────────────────────────────────────');
console.log('📊 Verification:');
console.log(`  email_templates  : ${counts.email_templates}`);
console.log(`  call_scripts     : ${counts.call_scripts}`);
console.log(`  email_drafts     : ${counts.email_drafts}`);
console.log(`  companies (A)    : ${counts.companies_A}`);
console.log(`  queued (A-tier)  : ${counts.queued}`);
console.log('─────────────────────────────────────────\n');

// Export counts for use in LAUNCH_CHECKLIST.md
module.exports = { counts, draftsInserted };
