'use strict';

/**
 * verification-engine.js — Corgi Outreach verification scoring system
 *
 * Computes a 0-100 verification score for each company by running a
 * series of deterministic checks against local DB data and live HTTP probes.
 *
 * Exports:
 *   verifyCompany(companyId) — score one company, persist results
 *   verifyAll(limit)         — score all companies ordered by qualification_score DESC
 *   getVerificationSummary() — aggregate counts by status
 */

const http  = require('http');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// ── Constants ─────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

const STATUS_MAP = (score) => {
  if (score >= 80) return 'verified';
  if (score >= 60) return 'partial';
  if (score >= 31) return 'unverified';
  return 'flagged';
};

// ── HTTP probe ────────────────────────────────────────────────────────────────

/**
 * HEAD-probe a URL with timeout + redirect following.
 * Returns { live: boolean, statusCode: number|null, finalUrl: string }
 */
function probeUrl(rawUrl, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve) => {
    if (!rawUrl) return resolve({ live: false, statusCode: null, finalUrl: rawUrl });

    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    let parsed;
    try { parsed = new URL(url); } catch (_) {
      return resolve({ live: false, statusCode: null, finalUrl: url });
    }

    const mod = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'HEAD',
      timeout:  TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CorgiBot/1.0; +https://corgi.insure)',
      },
    };

    const req = mod.request(opts, (res) => {
      const code = res.statusCode;

      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(code) && redirectsLeft > 0) {
        const loc = res.headers['location'];
        if (loc) {
          // Consume response so socket can be freed
          res.resume();
          // Build absolute redirect URL
          let nextUrl;
          try {
            nextUrl = new URL(loc, url).href;
          } catch (_) {
            nextUrl = loc;
          }
          return resolve(probeUrl(nextUrl, redirectsLeft - 1));
        }
      }

      res.resume(); // drain body
      resolve({ live: code >= 200 && code < 400, statusCode: code, finalUrl: url });
    });

    req.on('timeout', () => { req.destroy(); resolve({ live: false, statusCode: null, finalUrl: url }); });
    req.on('error',   () =>               resolve({ live: false, statusCode: null, finalUrl: url }));

    req.end();
  });
}

// ── Core: verify a single company ────────────────────────────────────────────

/**
 * verifyCompany — runs all checks, writes verification_checks rows,
 *                 updates companies table.
 * @param {string} companyId
 * @returns {object} { companyId, score, status, checks }
 */
async function verifyCompany(companyId) {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
  if (!company) throw new Error(`Company not found: ${companyId}`);

  const contacts = db.prepare('SELECT * FROM contacts WHERE company_id = ?').all(companyId);

  let score = 50; // base
  const checks = [];

  // ── Helper to record a check ────────────────────────────────────────────
  function record(checkType, result, impact, notes, source = 'agent_qa') {
    score += impact;
    checks.push({ checkType, result, impact, notes, source });
  }

  // ── 1. Website live check (async) ───────────────────────────────────────
  const domain = (company.website || '').trim();
  if (!domain) {
    record('website_live', 'fail', -20, 'No domain on file', 'agent_qa');
  } else {
    const probe = await probeUrl(domain);
    if (probe.live) {
      record('website_live', 'pass', 15,
        `HTTP ${probe.statusCode} at ${probe.finalUrl}`, 'agent_qa');
    } else {
      const detail = probe.statusCode ? `HTTP ${probe.statusCode}` : 'unreachable/timeout';
      record('website_live', 'fail', -20,
        `Website dead or unreachable: ${detail}`, 'agent_qa');
    }
  }

  // ── 2. Company exists (web search) — heuristic from enrichment data ─────
  // We use a proxy: if description is substantial OR funding data exists,
  // treat as confirmed. Pure data check — no live search API needed.
  const descLen = (company.description || '').trim().length;
  const hasEnrichment = !!(company.total_raised || company.founded_year || company.headquarters || company.linkedin_url);
  if (hasEnrichment || descLen > 100) {
    record('company_exists', 'pass', 10, 'Company data confirmed via enrichment/description', 'agent_qa');
  } else if (descLen > 20) {
    record('company_exists', 'warn', 5, 'Partial company data — description present but sparse', 'agent_qa');
  } else {
    record('company_exists', 'fail', 0, 'Insufficient data to confirm company existence', 'agent_qa');
  }

  // ── 3. LinkedIn company page ────────────────────────────────────────────
  if (company.linkedin_url && company.linkedin_url.includes('linkedin.com')) {
    record('linkedin_exists', 'pass', 10, `LinkedIn: ${company.linkedin_url}`, 'agent_qa');
  } else {
    record('linkedin_exists', 'fail', 0, 'No LinkedIn URL on file', 'agent_qa');
  }

  // ── 4. At least 1 contact with email ───────────────────────────────────
  const contactsWithEmail = contacts.filter(c => c.email && c.email.trim());
  if (contactsWithEmail.length > 0) {
    record('contact_verified', 'pass', 10,
      `${contactsWithEmail.length} contact(s) with email in DB`, 'agent_qa');
  } else if (contacts.length > 0) {
    record('contact_verified', 'warn', 0,
      `${contacts.length} contact(s) found but no email addresses`, 'agent_qa');
  } else {
    record('contact_verified', 'fail', -15, 'No contacts at all in DB', 'agent_qa');
  }

  // ── 5. Funding data ─────────────────────────────────────────────────────
  if (company.total_raised != null && company.total_raised !== '') {
    record('funding_verified', 'pass', 5, `Total raised: ${company.total_raised}`, 'agent_qa');
  } else {
    record('funding_verified', 'skip', 0, 'No funding data on file', 'agent_qa');
  }

  // ── 6. HQ location ──────────────────────────────────────────────────────
  if (company.headquarters && company.headquarters.trim()) {
    record('hq_verified', 'pass', 5, `HQ: ${company.headquarters}`, 'agent_qa');
  } else {
    record('hq_verified', 'fail', -10, 'Headquarters missing', 'agent_qa');
  }

  // ── 7. Description quality ──────────────────────────────────────────────
  if (descLen > 50) {
    record('data_cross_check', 'pass', 5, `Description: ${descLen} chars`, 'agent_qa');
  } else if (descLen >= 20) {
    record('data_cross_check', 'warn', 0, `Description present but short (${descLen} chars)`, 'agent_qa');
  } else {
    record('data_cross_check', 'fail', -10,
      descLen === 0 ? 'Description missing' : `Description too short (${descLen} chars)`, 'agent_qa');
  }

  // ── 8. Founded year ─────────────────────────────────────────────────────
  if (company.founded_year) {
    record('data_cross_check', 'pass', 5, `Founded: ${company.founded_year}`, 'agent_qa');
  }

  // ── 9. Never enriched ───────────────────────────────────────────────────
  if (!company.last_enriched_at) {
    record('data_cross_check', 'warn', -5, 'Company has never been enriched', 'agent_qa');
  }

  // ── 10. Contacts: no contacts at all (already covered above, but also) ──
  if (contacts.length === 0 && contactsWithEmail.length === 0) {
    // already deducted in check 4 — no double-dip
  }

  // ── BONUS CHECKS ──────────────────────────────────────────────────────────

  // Verified email
  const verifiedEmail = contacts.find(c =>
    c.email_verified === 1 || c.email_verified === true ||
    (c.email_confidence != null && parseFloat(c.email_confidence) > 0.7)
  );
  if (verifiedEmail) {
    record('email_valid', 'pass', 10,
      `Verified email: ${verifiedEmail.email} (confidence: ${verifiedEmail.email_confidence ?? 'verified'})`,
      'agent_qa');
  }

  // Contact with LinkedIn
  const linkedinContact = contacts.find(c => c.linkedin_url && c.linkedin_url.trim());
  if (linkedinContact) {
    record('contact_verified', 'pass', 5,
      `Contact LinkedIn: ${linkedinContact.linkedin_url}`, 'agent_qa');
  }

  // Recent news / activity
  if (company.recent_news && company.recent_news.trim()) {
    record('data_cross_check', 'pass', 5, 'Recent news/activity present', 'agent_qa');
  }

  // ── Clamp score ──────────────────────────────────────────────────────────
  score = Math.max(0, Math.min(100, score));
  const status = STATUS_MAP(score);

  // ── Persist verification_checks ─────────────────────────────────────────
  // Delete old checks for this company first (fresh run)
  db.prepare('DELETE FROM verification_checks WHERE company_id = ?').run(companyId);

  const insertCheck = db.prepare(`
    INSERT INTO verification_checks (id, company_id, check_type, result, score_impact, notes, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertCheck.run(uuidv4(), companyId, row.checkType, row.result, row.impact, row.notes, row.source);
    }
  });
  insertMany(checks);

  // ── Update companies table ───────────────────────────────────────────────
  const notes = checks
    .filter(c => c.result === 'fail' || c.result === 'warn')
    .map(c => `[${c.result.toUpperCase()}] ${c.checkType}: ${c.notes}`)
    .join('; ');

  db.prepare(`
    UPDATE companies
    SET verification_score = ?,
        verification_status = ?,
        verification_notes = ?,
        verified_at = datetime('now'),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(score, status, notes || null, companyId);

  return { companyId, name: company.name, score, status, checks };
}

// ── Verify all companies ──────────────────────────────────────────────────────

/**
 * verifyAll — run verifyCompany on all companies ordered by qualification_score DESC
 * @param {number} limit  Max companies to process (default 50)
 * @returns {object} Summary stats
 */
async function verifyAll(limit = 50) {
  const companies = db.prepare(
    'SELECT id, name FROM companies ORDER BY qualification_score DESC LIMIT ?'
  ).all(limit);

  console.log(`[verification-engine] Starting batch: ${companies.length} companies`);

  const results = { total: 0, verified: 0, partial: 0, unverified: 0, flagged: 0, errors: 0 };

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    try {
      const r = await verifyCompany(company.id);
      results.total++;
      results[r.status] = (results[r.status] || 0) + 1;

      if ((i + 1) % 25 === 0 || i === companies.length - 1) {
        console.log(`[verification-engine] Progress: ${i + 1}/${companies.length} — latest: ${company.name} → ${r.status} (${r.score})`);
      }
    } catch (err) {
      results.errors++;
      console.error(`[verification-engine] Error on ${company.name}: ${err.message}`);
    }
  }

  console.log(`[verification-engine] Batch complete:`, results);
  return results;
}

// ── Summary ───────────────────────────────────────────────────────────────────

/**
 * getVerificationSummary — aggregate counts by verification_status
 * @returns {object} { total, verified, partial, unverified, flagged, avgScore }
 */
function getVerificationSummary() {
  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN verification_status = 'verified'   THEN 1 ELSE 0 END) as verified,
      SUM(CASE WHEN verification_status = 'partial'    THEN 1 ELSE 0 END) as partial,
      SUM(CASE WHEN verification_status = 'unverified' THEN 1 ELSE 0 END) as unverified,
      SUM(CASE WHEN verification_status = 'flagged'    THEN 1 ELSE 0 END) as flagged,
      ROUND(AVG(verification_score), 1) as avgScore
    FROM companies
  `).get();

  return {
    total:      row.total      || 0,
    verified:   row.verified   || 0,
    partial:    row.partial    || 0,
    unverified: row.unverified || 0,
    flagged:    row.flagged    || 0,
    avgScore:   row.avgScore   || 0,
  };
}

module.exports = { verifyCompany, verifyAll, getVerificationSummary };
