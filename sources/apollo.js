/**
 * sources/apollo.js — Apollo.io API enrichment source
 *
 * Enriches companies and discovers decision-maker contacts via Apollo.io's REST API.
 *
 * What this does:
 *   - Company enrichment: GET /api/v1/organizations/enrich?domain=<domain>
 *     Returns firmographic data (employee count, industry, revenue, HQ, LinkedIn, etc.)
 *
 *   - Contact discovery: POST /api/v1/mixed_people/api_search
 *     Finds decision-makers at the company by title (CEO, CTO, CFO, VP Finance, etc.)
 *     NOTE: People Search does NOT consume credits — it returns profiles without emails.
 *     Emails require a separate People Enrichment call (1 credit each).
 *
 * Auth: Set APOLLO_API_KEY environment variable.
 * Free tier: 100 credits/month (10k/month with verified corporate domain).
 * Rate limits: ~50 req/min on free, 100 req/min on paid; 600 calls/day free tier.
 *
 * API docs: https://docs.apollo.io/reference/organization-enrichment
 *           https://docs.apollo.io/reference/people-api-search
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const fetch = require('node-fetch');

const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';
const TIMEOUT_MS = 15000;

// Decision-maker titles to search for at target companies
const DECISION_MAKER_TITLES = [
  'CEO',
  'Chief Executive Officer',
  'CTO',
  'Chief Technology Officer',
  'CFO',
  'Chief Financial Officer',
  'VP Finance',
  'Vice President Finance',
  'VP of Finance',
  'Head of Finance',
  'Head of Infrastructure',
  'VP Infrastructure',
  'VP Engineering',
  'Chief Information Officer',
  'CIO',
  'COO',
  'Chief Operating Officer',
  'VP Operations',
  'Head of Operations',
  'President',
  'Co-Founder',
  'Founder',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Get the configured Apollo API key.
 * Returns null (not an error) if not set.
 */
function getApiKey() {
  return process.env.APOLLO_API_KEY || null;
}

/**
 * Make an authenticated request to the Apollo API.
 *
 * @param {string} method       - HTTP method
 * @param {string} path         - Path after /api/v1
 * @param {object} [queryParams] - Query string params (for GET)
 * @param {object} [body]       - JSON body (for POST)
 * @returns {Promise<object>}   - Parsed JSON response
 */
async function apolloRequest(method, path, queryParams = {}, body = null) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('APOLLO_API_KEY not set');

  // Build URL with query params
  const url = new URL(`${APOLLO_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': apiKey,
      },
      signal: controller.signal,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url.toString(), options);
    clearTimeout(timer);

    if (res.status === 429) {
      throw new Error('Apollo rate limit exceeded (429). Try again later.');
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(`Apollo auth failed (${res.status}). Check APOLLO_API_KEY.`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Apollo HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error(`Apollo request timed out after ${TIMEOUT_MS}ms`);
    throw err;
  }
}

// ── Company enrichment ────────────────────────────────────────────────────────

/**
 * Enrich a company using Apollo's Organization Enrichment endpoint.
 * GET /api/v1/organizations/enrich?domain=<domain>
 *
 * This consumes 1 credit per call.
 *
 * @param {string} domain  - Company website domain (e.g. "corgi.finance")
 * @returns {Promise<object>}  - Normalized company fields
 */
async function enrichOrganization(domain) {
  // Strip protocol and trailing slashes
  const cleanDomain = domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();

  const data = await apolloRequest('GET', '/organizations/enrich', { domain: cleanDomain });

  const org = data.organization;
  if (!org) {
    console.log(`[apollo] No organization data returned for domain: ${cleanDomain}`);
    return null;
  }

  // Map Apollo fields → our DB schema
  return {
    // Company identity
    description: org.short_description || org.description || null,
    industry_segment: org.industry || null,
    type: org.org_chart_root_people_ids ? 'enterprise' : null, // rough signal

    // Size & metrics
    employee_count: org.estimated_num_employees
      ? String(org.estimated_num_employees)
      : (org.employee_count || null),

    // Location
    headquarters: org.raw_address
      || [org.city, org.state, org.country].filter(Boolean).join(', ')
      || null,

    // Funding
    total_raised: org.total_funding_printed || null,
    last_funding_round: org.latest_funding_stage || null,

    // Social
    linkedin_url: org.linkedin_url || null,
    twitter_url: org.twitter_url || null,
    github_url: null, // Apollo doesn't typically return GitHub

    // Contact
    phone: org.sanitized_phone || org.phone || null,

    // Metadata
    founded_year: org.founded_year || null,

    // Raw Apollo ID for future calls
    apollo_org_id: org.id || null,
  };
}

// ── Contact discovery ─────────────────────────────────────────────────────────

/**
 * Find decision-makers at a company using Apollo's People API Search.
 * POST /api/v1/mixed_people/api_search
 *
 * IMPORTANT: This endpoint does NOT consume credits.
 * It returns names, titles, LinkedIn URLs — but NOT emails.
 * Email addresses require a separate enrichment call (1 credit each).
 *
 * @param {string} domain   - Company domain
 * @param {string} [orgName] - Company name for logging
 * @returns {Promise<Array<object>>}  - Array of contact objects
 */
async function findDecisionMakers(domain, orgName = '') {
  const cleanDomain = domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();

  // Apollo uses array params in the body
  const body = {
    organization_domains: [cleanDomain],
    person_titles: DECISION_MAKER_TITLES,
    per_page: 25,
    page: 1,
  };

  const data = await apolloRequest('POST', '/mixed_people/api_search', {}, body);

  const people = data.people || data.contacts || [];

  if (people.length === 0) {
    console.log(`[apollo] No decision-makers found at ${cleanDomain} (${orgName})`);
    return [];
  }

  console.log(`[apollo] Found ${people.length} decision-maker(s) at ${cleanDomain} (${orgName})`);

  // Normalize to our contact schema
  return people.map(person => ({
    name: [person.first_name, person.last_name].filter(Boolean).join(' ') || person.name || null,
    title: person.title || null,
    email: person.email || null, // Usually null from search (no credits consumed)
    phone: person.sanitized_phone || person.phone || null,
    linkedin_url: person.linkedin_url || null,
    source: 'apollo',
    // Apollo internal ID — useful for future enrichment calls
    apollo_person_id: person.id || null,
    // Seniority signal
    seniority: person.seniority || null,
  })).filter(c => c.name); // Only keep contacts with a name
}

// ── People enrichment (credit-consuming) ─────────────────────────────────────

/**
 * Enrich a specific person to get their email address.
 * POST /api/v1/people/match
 *
 * This consumes 1 credit per call. Use sparingly.
 * Only call this for high-priority contacts where you need the email.
 *
 * @param {object} params   - { first_name, last_name, organization_name, domain, linkedin_url }
 * @returns {Promise<object|null>}
 */
async function enrichPerson(params) {
  const data = await apolloRequest('POST', '/people/match', {}, {
    first_name: params.first_name,
    last_name: params.last_name,
    organization_name: params.organization_name,
    domain: params.domain,
    linkedin_url: params.linkedin_url,
    reveal_personal_emails: false,
    reveal_phone_number: false,
  });

  if (!data.person) return null;

  const p = data.person;
  return {
    name: [p.first_name, p.last_name].filter(Boolean).join(' '),
    title: p.title || null,
    email: p.email || null,
    phone: p.sanitized_phone || null,
    linkedin_url: p.linkedin_url || null,
    source: 'apollo',
    apollo_person_id: p.id || null,
  };
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * Enrich a company or contact via Apollo.io.
 *
 * For companies:
 *   1. Enriches firmographic data (employee count, HQ, funding, industry, etc.)
 *   2. Discovers decision-makers (CEO, CTO, CFO, VP Finance, Head of Infra)
 *      NOTE: Contact discovery uses People Search (no credits consumed).
 *
 * For contacts:
 *   Uses People Enrichment (match by name + company) — consumes 1 credit.
 *   Only runs if the contact is missing an email and has a company domain.
 *
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData  - Current DB record
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'apollo',
    entityType,
    entityId,
    data: {},
    contacts: [],
    enrichedAt: new Date().toISOString(),
    success: false,
  };

  // Bail out gracefully if no API key
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('[apollo] APOLLO_API_KEY not set — skipping Apollo enrichment');
    result.skipped = true;
    result.skipReason = 'APOLLO_API_KEY not configured';
    result.success = true; // Not an error — just unconfigured
    return result;
  }

  try {
    if (entityType === 'company') {
      const domain = existingData.website || existingData.domain;
      const name = existingData.name || '';

      if (!domain) {
        console.log(`[apollo] Skipping company ${name} — no domain`);
        result.skipped = true;
        result.skipReason = 'No domain available';
        result.success = true;
        return result;
      }

      console.log(`[apollo] Enriching company: ${name} (${domain})`);

      // 1. Organization enrichment (uses 1 credit)
      let orgData = null;
      try {
        orgData = await enrichOrganization(domain);
        if (orgData) {
          result.data = { ...orgData };
          console.log(`[apollo] ✅ Org enrichment complete for ${name}`);
        }
      } catch (err) {
        console.warn(`[apollo] Org enrichment failed for ${name}: ${err.message}`);
        // Continue to contacts even if org enrichment fails
      }

      // Small polite delay between API calls
      await new Promise(r => setTimeout(r, 500));

      // 2. Decision-maker discovery (free — no credits consumed)
      try {
        const contacts = await findDecisionMakers(domain, name);
        result.contacts = contacts;
        console.log(`[apollo] Found ${contacts.length} contact(s) at ${name}`);
      } catch (err) {
        console.warn(`[apollo] Contact discovery failed for ${name}: ${err.message}`);
      }

      result.success = true;

    } else if (entityType === 'contact') {
      const contactName = existingData.name || '';
      const domain = existingData.company_website || existingData.domain;
      const companyName = existingData.company_name || '';

      // Only enrich contacts that are missing emails and have company context
      if (existingData.email) {
        console.log(`[apollo] Contact ${contactName} already has email — skipping`);
        result.skipped = true;
        result.skipReason = 'Contact already has email';
        result.success = true;
        return result;
      }

      if (!domain && !companyName) {
        console.log(`[apollo] Contact ${contactName} has no company context — skipping`);
        result.skipped = true;
        result.skipReason = 'No company domain or name available';
        result.success = true;
        return result;
      }

      console.log(`[apollo] Enriching contact: ${contactName} @ ${companyName}`);

      // Split name into first/last
      const nameParts = contactName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const enriched = await enrichPerson({
        first_name: firstName,
        last_name: lastName,
        organization_name: companyName,
        domain: domain || null,
        linkedin_url: existingData.linkedin_url || null,
      });

      if (enriched) {
        result.data = {
          email: enriched.email,
          phone: enriched.phone,
          linkedin_url: enriched.linkedin_url,
          title: enriched.title,
        };
        console.log(`[apollo] ✅ Contact enriched: ${contactName} — email: ${enriched.email || 'not found'}`);
      } else {
        console.log(`[apollo] No match found for contact: ${contactName}`);
      }

      result.success = true;
    }

  } catch (err) {
    console.error(`[apollo] Enrichment failed for ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = {
  enrich,
  // Export helpers for direct use / testing
  enrichOrganization,
  findDecisionMakers,
  enrichPerson,
  DECISION_MAKER_TITLES,
};
