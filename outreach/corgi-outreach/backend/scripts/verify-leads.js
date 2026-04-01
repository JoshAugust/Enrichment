#!/usr/bin/env node
/**
 * verify-leads.js — Lead verification & quality scoring system
 *
 * Usage:
 *   node verify-leads.js                    # verify ALL companies
 *   node verify-leads.js --id <company_id>  # verify a single company
 *   node verify-leads.js --dry-run          # score without writing to DB
 *   node verify-leads.js --verbose          # show per-check details
 *
 * Scoring model (each 0–100):
 *   data_completeness_score  25% of overall
 *   data_freshness_score     25% of overall
 *   data_accuracy_score      25% of overall
 *   contact_quality_score    25% of overall
 */

const path = require('path');
const { randomUUID } = require('crypto');
const https = require('https');
const http = require('http');

const DB_PATH = path.resolve(__dirname, '../data/corgi_outreach.db');
const Database = require('better-sqlite3');

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const SINGLE_ID  = args.includes('--id')       ? args[args.indexOf('--id') + 1]  : null;
const DRY_RUN    = args.includes('--dry-run');
const VERBOSE    = args.includes('--verbose');
const NO_HTTP    = args.includes('--no-http');   // skip live URL checks (faster)

// ─── DB setup ────────────────────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Prepared statements ─────────────────────────────────────────────────────
const updateCompany = db.prepare(`
  UPDATE companies SET
    verification_score      = ?,
    verification_status     = ?,
    verification_notes      = ?,
    verified_at             = datetime('now'),
    data_freshness_score    = ?,
    data_completeness_score = ?,
    data_accuracy_score     = ?,
    contact_quality_score   = ?,
    updated_at              = datetime('now')
  WHERE id = ?
`);

const insertLog = db.prepare(`
  INSERT INTO verification_log
    (id, entity_type, entity_id, check_type, result, details, score_impact)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg) { if (VERBOSE) console.log(msg); }

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

/**
 * Try a HEAD (then GET) request; return { ok, statusCode, resolvedUrl }
 */
function checkUrl(url, timeoutMs = 6000) {
  return new Promise(resolve => {
    if (!url) return resolve({ ok: false, statusCode: 0, reason: 'no_url' });
    let u;
    try { u = new URL(url.startsWith('http') ? url : 'https://' + url); }
    catch { return resolve({ ok: false, statusCode: 0, reason: 'invalid_url' }); }

    const lib = u.protocol === 'https:' ? https : http;
    const options = { method: 'HEAD', hostname: u.hostname, path: u.pathname + u.search,
                      timeout: timeoutMs, headers: { 'User-Agent': 'Mozilla/5.0' } };

    const req = lib.request(options, res => {
      const sc = res.statusCode;
      res.destroy();
      if (sc >= 200 && sc < 400) resolve({ ok: true, statusCode: sc });
      else resolve({ ok: false, statusCode: sc, reason: `http_${sc}` });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, statusCode: 0, reason: 'timeout' }); });
    req.on('error',   () => resolve({ ok: false, statusCode: 0, reason: 'error' }));
    req.end();
  });
}

function writeLog(entityType, entityId, checkType, result, details, scoreImpact) {
  if (DRY_RUN) { log(`  [DRY] ${checkType}: ${result} (${scoreImpact >= 0 ? '+' : ''}${scoreImpact})`); return; }
  try {
    insertLog.run(randomUUID(), entityType, entityId, checkType, result, details, scoreImpact);
  } catch (e) {
    // ignore duplicate-key errors in reruns
    if (!e.message.includes('UNIQUE')) console.warn('Log insert error:', e.message);
  }
}

// ─── 1. DATA COMPLETENESS SCORE (0–100) ──────────────────────────────────────
function scoreCompleteness(company) {
  const checks = [
    { field: 'website',             label: 'Website URL',         weight: 12 },
    { field: 'description',         label: 'Description',         weight: 12 },
    { field: 'headquarters',        label: 'Headquarters',        weight:  8 },
    { field: 'phone',               label: 'Phone',               weight:  8 },
    { field: 'total_raised',        label: 'Total Raised',        weight: 10 },
    { field: 'linkedin_url',        label: 'LinkedIn URL',        weight:  8 },
    { field: 'last_funding_round',  label: 'Last Funding Round',  weight:  8 },
    { field: 'investors',           label: 'Investors',           weight:  8 },
    { field: 'industry_segment',    label: 'Industry Segment',    weight:  8 },
    { field: 'estimated_gpu_scale', label: 'GPU Scale Estimate',  weight:  8 },
    { field: 'founded_year',        label: 'Founded Year',        weight:  5 },
    { field: 'employee_count',      label: 'Employee Count',      weight:  5 },
  ];

  let earned = 0, maxWeight = 0;
  const missing = [];
  const present = [];

  for (const c of checks) {
    maxWeight += c.weight;
    const val = company[c.field];
    const filled = val !== null && val !== undefined && String(val).trim() !== '';
    if (filled) {
      earned += c.weight;
      present.push(c.label);
    } else {
      missing.push(c.label);
    }
  }

  const score = clamp((earned / maxWeight) * 100);
  return { score, present, missing };
}

// ─── 2. DATA FRESHNESS SCORE (0–100) ─────────────────────────────────────────
function scoreFreshness(company) {
  const now = Date.now();
  let score = 0;
  let reason = '';

  const enrichedAt = company.last_enriched_at
    ? new Date(company.last_enriched_at).getTime()
    : null;

  if (!enrichedAt || isNaN(enrichedAt)) {
    score = 0;
    reason = 'Never enriched';
  } else {
    const daysSince = (now - enrichedAt) / (1000 * 60 * 60 * 24);
    // Fresh scoring curve:
    //  0-7 days   → 100
    //  7-30 days  → 90
    //  30-60 days → 70
    //  60-90 days → 50
    //  90-180 days→ 30
    //  180+ days  → 10
    if      (daysSince <= 7)   { score = 100; reason = `Enriched ${daysSince.toFixed(1)}d ago (very fresh)`; }
    else if (daysSince <= 30)  { score = 90;  reason = `Enriched ${daysSince.toFixed(1)}d ago (fresh)`; }
    else if (daysSince <= 60)  { score = 70;  reason = `Enriched ${daysSince.toFixed(1)}d ago (recent)`; }
    else if (daysSince <= 90)  { score = 50;  reason = `Enriched ${daysSince.toFixed(1)}d ago (aging)`; }
    else if (daysSince <= 180) { score = 30;  reason = `Enriched ${daysSince.toFixed(1)}d ago (stale)`; }
    else                       { score = 10;  reason = `Enriched ${daysSince.toFixed(1)}d ago (very stale)`; }
  }

  return { score: clamp(score), reason };
}

// ─── 3. DATA ACCURACY SCORE (0–100) ──────────────────────────────────────────
async function scoreAccuracy(company) {
  let totalPoints = 0;
  let earnedPoints = 0;
  const checks = [];

  // Check 1: Website URL format validity (10 pts)
  totalPoints += 10;
  if (company.website) {
    try {
      new URL(company.website.startsWith('http') ? company.website : 'https://' + company.website);
      earnedPoints += 10;
      checks.push({ check: 'website_format', result: 'pass', details: 'Valid URL format', impact: 10 });
    } catch {
      checks.push({ check: 'website_format', result: 'fail', details: 'Invalid URL format', impact: 0 });
    }
  } else {
    checks.push({ check: 'website_format', result: 'skip', details: 'No website', impact: 0 });
  }

  // Check 2: Live website check (30 pts)
  totalPoints += 30;
  if (company.website && !NO_HTTP) {
    const r = await checkUrl(company.website);
    if (r.ok) {
      earnedPoints += 30;
      checks.push({ check: 'website_alive', result: 'pass', details: `HTTP ${r.statusCode}`, impact: 30 });
    } else {
      checks.push({ check: 'website_alive', result: 'fail', details: `${r.reason || r.statusCode}`, impact: 0 });
    }
  } else if (company.website && NO_HTTP) {
    // Give half credit when we skip live check
    earnedPoints += 15;
    checks.push({ check: 'website_alive', result: 'skip', details: 'HTTP checks disabled', impact: 15 });
  } else {
    checks.push({ check: 'website_alive', result: 'skip', details: 'No website', impact: 0 });
  }

  // Check 3: LinkedIn URL format (10 pts)
  totalPoints += 10;
  if (company.linkedin_url) {
    const isLinkedIn = company.linkedin_url.includes('linkedin.com/company');
    if (isLinkedIn) {
      earnedPoints += 10;
      checks.push({ check: 'linkedin_format', result: 'pass', details: 'Valid LinkedIn company URL', impact: 10 });
    } else {
      earnedPoints += 5;
      checks.push({ check: 'linkedin_format', result: 'warning', details: 'LinkedIn URL present but unusual format', impact: 5 });
    }
  } else {
    checks.push({ check: 'linkedin_format', result: 'skip', details: 'No LinkedIn URL', impact: 0 });
  }

  // Check 4: Phone format sanity (10 pts)
  totalPoints += 10;
  if (company.phone) {
    const digits = company.phone.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      earnedPoints += 10;
      checks.push({ check: 'phone_format', result: 'pass', details: `${digits.length} digits`, impact: 10 });
    } else {
      checks.push({ check: 'phone_format', result: 'fail', details: `Unusual length: ${digits.length} digits`, impact: 0 });
    }
  } else {
    checks.push({ check: 'phone_format', result: 'skip', details: 'No phone', impact: 0 });
  }

  // Check 5: Description quality (10 pts)
  totalPoints += 10;
  if (company.description) {
    const len = company.description.trim().length;
    if (len >= 80) {
      earnedPoints += 10;
      checks.push({ check: 'description_quality', result: 'pass', details: `${len} chars`, impact: 10 });
    } else if (len >= 30) {
      earnedPoints += 5;
      checks.push({ check: 'description_quality', result: 'warning', details: `Short description: ${len} chars`, impact: 5 });
    } else {
      checks.push({ check: 'description_quality', result: 'fail', details: `Too short: ${len} chars`, impact: 0 });
    }
  } else {
    checks.push({ check: 'description_quality', result: 'skip', details: 'No description', impact: 0 });
  }

  // Check 6: Funding data cross-check (15 pts)
  totalPoints += 15;
  if (company.total_raised && company.last_funding_round) {
    earnedPoints += 15;
    checks.push({ check: 'funding_cross_ref', result: 'pass', details: `${company.total_raised} / ${company.last_funding_round}`, impact: 15 });
  } else if (company.total_raised || company.last_funding_round) {
    earnedPoints += 7;
    checks.push({ check: 'funding_cross_ref', result: 'warning', details: 'Partial funding data', impact: 7 });
  } else {
    checks.push({ check: 'funding_cross_ref', result: 'skip', details: 'No funding data', impact: 0 });
  }

  // Check 7: Founded year sanity (5 pts)
  totalPoints += 5;
  if (company.founded_year) {
    const yr = parseInt(company.founded_year);
    if (yr >= 1990 && yr <= new Date().getFullYear()) {
      earnedPoints += 5;
      checks.push({ check: 'founded_year_valid', result: 'pass', details: `Founded ${yr}`, impact: 5 });
    } else {
      checks.push({ check: 'founded_year_valid', result: 'fail', details: `Suspect year: ${yr}`, impact: 0 });
    }
  } else {
    checks.push({ check: 'founded_year_valid', result: 'skip', details: 'No founded year', impact: 0 });
  }

  // Check 8: Headquaters mentions a real location (10 pts)
  totalPoints += 10;
  if (company.headquarters) {
    const hq = company.headquarters.trim();
    if (hq.length >= 3) {
      earnedPoints += 10;
      checks.push({ check: 'headquarters_valid', result: 'pass', details: hq, impact: 10 });
    } else {
      checks.push({ check: 'headquarters_valid', result: 'warning', details: `Short HQ: "${hq}"`, impact: 5 });
    }
  } else {
    checks.push({ check: 'headquarters_valid', result: 'skip', details: 'No HQ data', impact: 0 });
  }

  const score = clamp((earnedPoints / totalPoints) * 100);
  return { score, checks };
}

// ─── 4. CONTACT QUALITY SCORE (0–100) ────────────────────────────────────────
function scoreContactQuality(companyId, contacts) {
  const compContacts = contacts.filter(c => c.company_id === companyId);
  const total = compContacts.length;
  const details = [];

  if (total === 0) {
    return { score: 0, details: ['No contacts found'], count: 0, withEmail: 0, withPhone: 0, withTitle: 0 };
  }

  let score = 0;

  // Count metric (0–25 pts)
  const countScore = Math.min(25, total * 8);
  score += countScore;
  details.push(`${total} contact(s) → +${countScore}pts`);

  // Email coverage (0–35 pts)
  const withEmail = compContacts.filter(c => c.email && c.email.trim()).length;
  const emailPct = withEmail / total;
  const emailScore = Math.round(emailPct * 35);
  score += emailScore;
  details.push(`${withEmail}/${total} have email → +${emailScore}pts`);

  // Phone coverage (0–20 pts)
  const withPhone = compContacts.filter(c => c.phone && c.phone.trim()).length;
  const phonePct = withPhone / total;
  const phoneScore = Math.round(phonePct * 20);
  score += phoneScore;
  details.push(`${withPhone}/${total} have phone → +${phoneScore}pts`);

  // Title / seniority (0–20 pts)
  const withTitle = compContacts.filter(c => c.title && c.title.trim()).length;
  const titlePct = withTitle / total;
  const titleScore = Math.round(titlePct * 20);
  score += titleScore;
  details.push(`${withTitle}/${total} have title → +${titleScore}pts`);

  return {
    score: clamp(score),
    details,
    count: total,
    withEmail,
    withPhone,
    withTitle,
  };
}

// ─── 5. OVERALL VERIFICATION SCORE ───────────────────────────────────────────
function overallScore(completeness, freshness, accuracy, contact) {
  return clamp(
    completeness * 0.25 +
    freshness    * 0.25 +
    accuracy     * 0.25 +
    contact      * 0.25
  );
}

function statusFromScore(score) {
  if (score >= 80) return 'verified';
  if (score >= 50) return 'pending';
  return 'flagged';
}

// ─── MAIN VERIFICATION FUNCTION ──────────────────────────────────────────────
async function verifyCompany(company, allContacts) {
  log(`\n📋 Verifying: ${company.name} (${company.id})`);

  // 1. Completeness
  const completenessResult = scoreCompleteness(company);
  log(`  Completeness: ${completenessResult.score} | Missing: ${completenessResult.missing.join(', ') || 'none'}`);

  writeLog('company', company.id, 'data_completeness',
    completenessResult.score >= 70 ? 'pass' : completenessResult.score >= 40 ? 'warning' : 'fail',
    `Score: ${completenessResult.score}. Missing: ${completenessResult.missing.join(', ') || 'none'}`,
    completenessResult.score
  );

  // 2. Freshness
  const freshnessResult = scoreFreshness(company);
  log(`  Freshness: ${freshnessResult.score} | ${freshnessResult.reason}`);

  writeLog('company', company.id, 'news_freshness',
    freshnessResult.score >= 70 ? 'pass' : freshnessResult.score >= 40 ? 'warning' : 'fail',
    freshnessResult.reason,
    freshnessResult.score
  );

  // 3. Accuracy (async — may include live checks)
  const accuracyResult = await scoreAccuracy(company);
  log(`  Accuracy: ${accuracyResult.score}`);
  for (const c of accuracyResult.checks) {
    log(`    ${c.check}: ${c.result} — ${c.details}`);
    writeLog('company', company.id, c.check, c.result, c.details, c.impact);
  }

  // 4. Contact quality
  const contactResult = scoreContactQuality(company.id, allContacts);
  log(`  Contact Quality: ${contactResult.score} | ${contactResult.details.join(' | ')}`);

  writeLog('company', company.id, 'contact_reachable',
    contactResult.score >= 70 ? 'pass' : contactResult.score >= 40 ? 'warning' : 'fail',
    contactResult.details.join('; '),
    contactResult.score
  );

  // 5. Overall
  const overall = overallScore(
    completenessResult.score,
    freshnessResult.score,
    accuracyResult.score,
    contactResult.score
  );
  const status = statusFromScore(overall);
  const notes = [
    `Completeness: ${completenessResult.score}/100`,
    `Freshness: ${freshnessResult.score}/100`,
    `Accuracy: ${accuracyResult.score}/100`,
    `Contact Quality: ${contactResult.score}/100`,
    completenessResult.missing.length ? `Missing fields: ${completenessResult.missing.slice(0, 4).join(', ')}` : null,
  ].filter(Boolean).join(' | ');

  log(`  ✅ OVERALL: ${overall} → ${status}`);

  if (!DRY_RUN) {
    updateCompany.run(
      overall,
      status,
      notes,
      freshnessResult.score,
      completenessResult.score,
      accuracyResult.score,
      contactResult.score,
      company.id
    );
  }

  return {
    id: company.id,
    name: company.name,
    type: company.type,
    priority: company.priority,
    overall,
    status,
    completeness: completenessResult.score,
    freshness: freshnessResult.score,
    accuracy: accuracyResult.score,
    contactQuality: contactResult.score,
    contactCount: contactResult.count,
    contactsWithEmail: contactResult.withEmail,
  };
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Corgi Outreach — Lead Verification System');
  console.log(`📂 DB: ${DB_PATH}`);
  console.log(`⚙️  Options: dry=${DRY_RUN} verbose=${VERBOSE} no-http=${NO_HTTP}`);
  console.log('');

  // Load contacts once (used for all companies)
  const allContacts = db.prepare(`
    SELECT id, company_id, name, title, email, phone, linkedin_url
    FROM contacts
  `).all();

  console.log(`📇 Loaded ${allContacts.length} contacts`);

  // Load companies
  const query = SINGLE_ID
    ? db.prepare('SELECT * FROM companies WHERE id = ?').all(SINGLE_ID)
    : db.prepare('SELECT * FROM companies ORDER BY priority ASC, name ASC').all();

  console.log(`🏢 Companies to verify: ${query.length}`);
  console.log('');

  const startTime = Date.now();
  const results = [];
  let done = 0;

  for (const company of query) {
    const result = await verifyCompany(company, allContacts);
    results.push(result);
    done++;

    if (!VERBOSE && done % 25 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`  ⏳ ${done}/${query.length} (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done — ${results.length} companies verified in ${elapsed}s`);

  // Print summary stats
  const byStatus = { verified: 0, pending: 0, flagged: 0 };
  let sumScore = 0;
  for (const r of results) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    sumScore += r.overall;
  }
  const avg = (sumScore / results.length).toFixed(1);

  console.log('\n📊 Summary:');
  console.log(`  Average score : ${avg}/100`);
  console.log(`  Verified (80+): ${byStatus.verified}`);
  console.log(`  Pending (50-79): ${byStatus.pending}`);
  console.log(`  Flagged (<50) : ${byStatus.flagged}`);

  // Output JSON if needed
  if (args.includes('--json')) {
    console.log('\n--- JSON ---');
    console.log(JSON.stringify(results, null, 2));
  }

  return results;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
