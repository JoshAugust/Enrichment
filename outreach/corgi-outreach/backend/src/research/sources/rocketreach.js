/**
 * sources/rocketreach.js — RocketReach API v2 enrichment source
 *
 * Enriches companies and contacts using the RocketReach API:
 *   - Company: employee count, industry, description, headquarters, website, linkedin_url
 *   - Contact:  verified email(s), phone, linkedin_url, current title
 *
 * API base: https://api.rocketreach.co/api/v2/
 * Auth:     Header: Api-Key: <key>
 * Credits:  Person lookup charges a credit when it returns a verified contact.
 *           Person search (POST /person/search) does NOT charge credits.
 *           Company lookup requires "Company Export" credits (separate purchase).
 *
 * Rate limits:
 *   - Max ~5 requests/second per API key
 *   - 429 Too Many Requests → honour Retry-After header, then exponential backoff
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 *
 * Env vars:
 *   ROCKETREACH_API_KEY   — required; skip gracefully if unset
 */

'use strict';

const https = require('https');
const { URL } = require('url');

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL     = 'https://api.rocketreach.co/api/v2';
const MAX_RETRIES  = 4;
const POLL_MAX     = 8;          // max status-poll attempts for async person lookup
const POLL_DELAY   = 3_000;      // ms between polls

// ── HTTP helpers ──────────────────────────────────────────────────────────────

/**
 * Generic HTTPS request with JSON body/response.
 * Returns { statusCode, headers, body }.
 */
function httpsRequest(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        ...headers,
      },
    };

    const serialised = body ? JSON.stringify(body) : null;
    if (serialised) {
      options.headers['Content-Length'] = Buffer.byteLength(serialised);
    }

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (serialised) req.write(serialised);
    req.end();
  });
}

/**
 * Fetch with exponential backoff on 429 / 5xx.
 */
async function fetchWithBackoff(method, url, apiKey, body = null, attempt = 0) {
  const res = await httpsRequest(
    method, url,
    { 'Api-Key': apiKey },
    body,
  );

  if (res.statusCode === 429) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`RocketReach rate limit exceeded after ${MAX_RETRIES} retries`);
    }
    const retryAfter = parseInt(res.headers['retry-after'] || '0', 10);
    const backoff    = retryAfter > 0
      ? retryAfter * 1000
      : Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 30_000);

    console.log(`[rocketreach] ⏳ Rate limited (429). Retrying in ${Math.round(backoff / 1000)}s (attempt ${attempt + 1}/${MAX_RETRIES})…`);
    await sleep(backoff);
    return fetchWithBackoff(method, url, apiKey, body, attempt + 1);
  }

  if (res.statusCode >= 500) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`RocketReach server error ${res.statusCode} after ${MAX_RETRIES} retries`);
    }
    const backoff = Math.min(1000 * Math.pow(2, attempt), 16_000);
    console.log(`[rocketreach] ⚠️  Server error ${res.statusCode}. Retrying in ${backoff}ms…`);
    await sleep(backoff);
    return fetchWithBackoff(method, url, apiKey, body, attempt + 1);
  }

  return res;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Company Lookup ────────────────────────────────────────────────────────────

/**
 * Look up a company by domain (most accurate) or name.
 *
 * GET /api/v2/company/lookup?name=<name>&domain=<domain>
 *
 * Returns raw RocketReach company object or null.
 */
async function lookupCompany(apiKey, { name, domain }) {
  const url = new URL(`${BASE_URL}/company/lookup`);
  if (domain) url.searchParams.set('domain', domain);
  if (name)   url.searchParams.set('name', name);

  console.log(`[rocketreach] 🔍 Company lookup: name="${name}" domain="${domain || ''}"`);

  const res = await fetchWithBackoff('GET', url.toString(), apiKey);

  if (res.statusCode === 200) {
    return Array.isArray(res.body) ? res.body[0] : res.body;
  }
  if (res.statusCode === 404 || res.statusCode === 204) {
    return null;
  }
  if (res.statusCode === 401 || res.statusCode === 403) {
    throw new Error(`RocketReach auth error ${res.statusCode}: check ROCKETREACH_API_KEY`);
  }
  if (res.statusCode === 402) {
    // Company lookups require Company Export credits — account may not have them
    console.warn('[rocketreach] ⚠️  Company Lookup returned 402 — your plan may not include Company Exports. Skipping company enrichment.');
    return null;
  }

  console.warn(`[rocketreach] Unexpected company lookup status ${res.statusCode}:`, JSON.stringify(res.body).slice(0, 200));
  return null;
}

// ── Person Lookup (async, credit-deducting) ───────────────────────────────────

/**
 * Initiate a person lookup (may be async — status "searching").
 * Polls until complete or timeout.
 *
 * GET /api/v2/person/lookup?name=<name>&current_employer=<company>
 *
 * Returns the person profile object (with emails/phones) or null.
 *
 * ⚠️  This endpoint charges 1 lookup credit per verified result.
 *     Only call it for contacts that genuinely need email discovery.
 */
async function lookupPerson(apiKey, { name, currentEmployer, linkedinUrl }) {
  const url = new URL(`${BASE_URL}/person/lookup`);
  if (name)           url.searchParams.set('name', name);
  if (currentEmployer) url.searchParams.set('current_employer', currentEmployer);
  if (linkedinUrl)    url.searchParams.set('linkedin_url', linkedinUrl);

  console.log(`[rocketreach] 🔍 Person lookup: "${name}" @ "${currentEmployer || ''}"`);

  const res = await fetchWithBackoff('GET', url.toString(), apiKey);

  if (res.statusCode === 401 || res.statusCode === 403) {
    throw new Error(`RocketReach auth error ${res.statusCode}: check ROCKETREACH_API_KEY`);
  }
  if (res.statusCode === 404 || res.statusCode === 204) return null;
  if (res.statusCode === 402) {
    console.warn('[rocketreach] ⚠️  Person lookup returned 402 — lookup credits exhausted. Skipping.');
    return null;
  }
  if (res.statusCode !== 200) {
    console.warn(`[rocketreach] Person lookup returned ${res.statusCode}:`, JSON.stringify(res.body).slice(0, 200));
    return null;
  }

  const profile = res.body;

  // Handle async "searching" status — poll until complete
  if (profile?.status === 'searching' && profile?.id) {
    return pollPersonLookup(apiKey, profile.id);
  }

  return profile?.status === 'complete' ? profile : null;
}

/**
 * Poll person lookup status until complete or max attempts reached.
 *
 * GET /api/v2/person/lookup?id=<id>
 */
async function pollPersonLookup(apiKey, profileId) {
  for (let i = 0; i < POLL_MAX; i++) {
    await sleep(POLL_DELAY);

    const url = new URL(`${BASE_URL}/person/lookup`);
    url.searchParams.set('id', String(profileId));

    console.log(`[rocketreach] ⏳ Polling person lookup #${profileId} (attempt ${i + 1}/${POLL_MAX})…`);

    const res = await fetchWithBackoff('GET', url.toString(), apiKey);

    if (res.statusCode !== 200) break;

    const profile = res.body;
    if (profile?.status === 'complete') return profile;
    if (profile?.status === 'failed')   return null;
    // status === 'searching' → keep polling
  }

  console.warn(`[rocketreach] Person lookup #${profileId} timed out after ${POLL_MAX} polls`);
  return null;
}

// ── Person Search (free, no credits) ─────────────────────────────────────────

/**
 * Search for people at a company by name/title (no credit charge).
 * Returns up to `limit` profile stubs (without emails — need lookup for those).
 *
 * POST /api/v2/person/search
 * Body: { query: { current_employer: ["..."], current_title: [...] }, start: 1, page_size: N }
 */
async function searchPeople(apiKey, { companyName, titles = [], limit = 5 }) {
  const url  = `${BASE_URL}/person/search`;
  const body = {
    query: {
      current_employer: [companyName],
      ...(titles.length ? { current_title: titles } : {}),
    },
    start:     1,
    page_size: limit,
  };

  console.log(`[rocketreach] 🔍 People search at "${companyName}" (titles: ${titles.join(', ') || 'any'})`);

  const res = await fetchWithBackoff('POST', url, apiKey, body);

  if (res.statusCode === 401 || res.statusCode === 403) {
    throw new Error(`RocketReach auth error ${res.statusCode}: check ROCKETREACH_API_KEY`);
  }
  if (res.statusCode !== 200) {
    console.warn(`[rocketreach] People search returned ${res.statusCode}:`, JSON.stringify(res.body).slice(0, 200));
    return [];
  }

  return (res.body?.profiles || res.body || []).slice(0, limit);
}

// ── Data mapping ──────────────────────────────────────────────────────────────

/**
 * Map RocketReach company response to pipeline-compatible fields.
 */
function mapCompanyData(rrCompany) {
  if (!rrCompany) return {};
  return {
    description:       rrCompany.description           || null,
    employee_count:    rrCompany.num_employees != null
                         ? String(rrCompany.num_employees)
                         : (rrCompany.size || null),
    industry_segment:  rrCompany.industry             || rrCompany.domain_vertical || null,
    headquarters:      rrCompany.city && rrCompany.country
                         ? `${rrCompany.city}, ${rrCompany.country}`
                         : (rrCompany.location || null),
    linkedin_url:      rrCompany.linkedin_url           || null,
    twitter_url:       rrCompany.twitter_url            || null,
    // RocketReach sometimes returns revenue as a band string
    total_raised:      rrCompany.revenue                || null,
    // Preserve website if provided (don't overwrite existing)
    website:           rrCompany.website                || rrCompany.domain
                         ? (rrCompany.website || `https://${rrCompany.domain}`)
                         : null,
    // Funding status inferred from revenue band
    financing_status:  rrCompany.funding_stage          || null,
    founded_year:      rrCompany.founded != null
                         ? parseInt(rrCompany.founded, 10) || null
                         : null,
  };
}

/**
 * Map a RocketReach person profile to pipeline-compatible contact fields.
 */
function mapPersonData(profile) {
  if (!profile) return {};

  // Prefer verified email; fall back to any email
  const emails = profile.emails || [];
  const bestEmail = emails.find(e => e.valid === 'true' || e.valid === true)
                 || emails[0];

  const phones = profile.phones || [];
  const bestPhone = phones[0]?.number || null;

  return {
    email:            bestEmail?.email    || null,
    email_confidence: bestEmail
                        ? (bestEmail.valid === 'true' || bestEmail.valid === true ? 0.95 : 0.6)
                        : null,
    phone:            bestPhone,
    linkedin_url:     profile.linkedin_url || null,
    title:            profile.current_title || null,
    bio:              profile.summary       || null,
  };
}

/**
 * Map a RocketReach person profile stub (from search, no emails) to a
 * contact object for the contacts[] return array.
 */
function mapPersonStub(profile) {
  return {
    name:       profile.name           || '',
    title:      profile.current_title  || '',
    email:      null,   // not available from search alone
    linkedin_url: profile.linkedin_url || null,
    rocketreach_id: profile.id         || null,
    source:     'rocketreach',
  };
}

// ── Extract domain from website ───────────────────────────────────────────────

function extractDomain(website) {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch { return null; }
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData  - Company: { name, website, contacts[] … }
 *                                 Contact: { name, email, title, company_name, company_website … }
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source:      'rocketreach',
    entityType,
    entityId,
    data:        {},
    contacts:    [],
    success:     false,
    enrichedAt:  new Date().toISOString(),
  };

  // ── Guard: API key ──────────────────────────────────────────────────────────
  const apiKey = process.env.ROCKETREACH_API_KEY;
  if (!apiKey) {
    result.skipped = true;
    result.success = true;
    result.data    = { reason: 'ROCKETREACH_API_KEY not set — skipping' };
    console.log('[rocketreach] ℹ️  ROCKETREACH_API_KEY not set. Skipping enrichment.');
    return result;
  }

  try {

    // ══════════════════════════════════════════════════════════════════════════
    //  COMPANY ENRICHMENT
    // ══════════════════════════════════════════════════════════════════════════
    if (entityType === 'company') {
      const { name, website, contacts = [] } = existingData;
      const domain = extractDomain(website);

      if (!name && !domain) {
        result.skipped = true;
        result.success = true;
        result.data    = { reason: 'No company name or domain available' };
        return result;
      }

      // 1. Look up company metadata (uses Company Export credits)
      const rrCompany = await lookupCompany(apiKey, { name, domain });

      if (rrCompany) {
        result.data = mapCompanyData(rrCompany);
        console.log(`[rocketreach] ✅ Company found: "${rrCompany.name}" (id: ${rrCompany.id})`);
      } else {
        console.log(`[rocketreach] ℹ️  Company "${name}" not found in RocketReach`);
        result.data = {};
      }

      // 2. Search for key contacts at the company (free — no credits used)
      //    Only search if there are fewer than 3 known contacts
      if (contacts.length < 3 && name) {
        const seniorTitles = [
          'CEO', 'CTO', 'VP', 'Director', 'Head of',
          'Chief', 'President', 'Founder', 'Partner',
        ];
        const stubs = await searchPeople(apiKey, {
          companyName: name,
          titles:      seniorTitles,
          limit:       5,
        });

        if (stubs.length > 0) {
          result.contacts = stubs.map(mapPersonStub);
          console.log(`[rocketreach] 👥 Found ${stubs.length} contacts at "${name}"`);
        }
      }

      result.success = true;

    // ══════════════════════════════════════════════════════════════════════════
    //  CONTACT ENRICHMENT
    // ══════════════════════════════════════════════════════════════════════════
    } else if (entityType === 'contact') {
      const { name, email, linkedin_url, company_name, company_website } = existingData;

      if (!name) {
        result.skipped = true;
        result.success = true;
        result.data    = { reason: 'Contact name required for RocketReach lookup' };
        return result;
      }

      // Skip if we already have a high-confidence email
      if (email) {
        result.skipped = true;
        result.success = true;
        result.data    = { reason: 'Contact already has email' };
        return result;
      }

      // Person lookup — this DEDUCTS 1 credit on verified result
      const profile = await lookupPerson(apiKey, {
        name,
        currentEmployer: company_name,
        linkedinUrl:     linkedin_url,
      });

      if (profile) {
        result.data = mapPersonData(profile);
        console.log(`[rocketreach] ✅ Contact found: "${profile.name}" — email: ${result.data.email || 'none'}`);
      } else {
        console.log(`[rocketreach] ℹ️  Contact "${name}" not found in RocketReach`);
        result.data = {};
      }

      result.success = true;

    } else {
      result.skipped = true;
      result.success = true;
      result.data    = { reason: `Unsupported entityType: ${entityType}` };
    }

  } catch (err) {
    console.error(`[rocketreach] ❌ Error enriching ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error   = err.message;
  }

  return result;
}

// ── Account status helper (useful for debugging) ──────────────────────────────

/**
 * Fetch RocketReach account info (credits remaining, plan, etc.).
 * Useful for health checks; not called by the pipeline automatically.
 */
async function getAccountInfo() {
  const apiKey = process.env.ROCKETREACH_API_KEY;
  if (!apiKey) throw new Error('ROCKETREACH_API_KEY not set');

  const res = await fetchWithBackoff('GET', `${BASE_URL}/account/`, apiKey);
  if (res.statusCode !== 200) throw new Error(`Account info returned ${res.statusCode}`);
  return res.body;
}

module.exports = {
  enrich,
  getAccountInfo,
  // Exported for testing / direct use
  lookupCompany,
  lookupPerson,
  searchPeople,
};
