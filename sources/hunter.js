/**
 * sources/hunter.js — Hunter.io domain-search email enrichment
 *
 * Uses the Hunter.io Domain Search API to find email addresses at a company's
 * domain. Returns discovered contacts with names, titles, and email addresses.
 *
 * Hunter.io free tier: 25 searches/month (domain-search counts as one search).
 * Paid plans start at ~$49/month for 500 searches.
 * See: https://hunter.io/pricing
 *
 * API docs: https://hunter.io/api-documentation#domain-search
 *
 * Required env var:
 *   HUNTER_API_KEY — your Hunter.io API key (get from https://hunter.io/api-keys)
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const https = require('https');

// ── Config ─────────────────────────────────────────────────────────────────────

const HUNTER_API_BASE = 'https://api.hunter.io/v2';

// Max emails to process per domain search (Hunter free tier returns up to 10 by default)
const MAX_EMAILS_PER_SEARCH = 10;

// Minimum confidence score (0–100) to include an email result
const MIN_CONFIDENCE = 50;

// ── HTTP helper ───────────────────────────────────────────────────────────────

/**
 * Minimal HTTPS GET that returns parsed JSON.
 * Avoids external HTTP dependencies (axios / node-fetch not guaranteed present).
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode === 429) {
          return reject(new Error('Hunter.io rate limit hit (429). Try again later.'));
        }
        if (res.statusCode === 401) {
          return reject(new Error('Hunter.io API key is invalid or missing (401).'));
        }
        if (res.statusCode === 403) {
          return reject(new Error('Hunter.io: plan limit reached or access denied (403).'));
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`Hunter.io: failed to parse response — ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Hunter.io: request timed out after 15s'));
    });
  });
}

// ── Domain extraction ─────────────────────────────────────────────────────────

/**
 * Extract a bare domain (e.g. "stripe.com") from a URL or email.
 */
function extractDomain(websiteOrEmail) {
  if (!websiteOrEmail) return null;
  try {
    if (websiteOrEmail.includes('@')) {
      return websiteOrEmail.split('@')[1].toLowerCase().trim();
    }
    const url = new URL(
      websiteOrEmail.startsWith('http') ? websiteOrEmail : `https://${websiteOrEmail}`
    );
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

// ── Hunter API calls ──────────────────────────────────────────────────────────

/**
 * Call the Hunter.io Domain Search endpoint.
 * Returns the raw Hunter API data object.
 *
 * @param {string} domain   - e.g. "stripe.com"
 * @param {string} apiKey
 * @param {number} [limit]  - Max emails to return (default 10)
 */
async function domainSearch(domain, apiKey, limit = MAX_EMAILS_PER_SEARCH) {
  const url = `${HUNTER_API_BASE}/domain-search?domain=${encodeURIComponent(domain)}&limit=${limit}&api_key=${encodeURIComponent(apiKey)}`;
  const response = await httpsGet(url);

  if (response.errors && response.errors.length > 0) {
    const errMsg = response.errors.map(e => e.details || e.id).join('; ');
    throw new Error(`Hunter.io API error: ${errMsg}`);
  }

  return response.data || {};
}

/**
 * Call the Hunter.io Email Finder endpoint to find one person's email.
 * Useful for contact-level enrichment when we have a name + domain.
 *
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} domain
 * @param {string} apiKey
 */
async function emailFinder(firstName, lastName, domain, apiKey) {
  const url = `${HUNTER_API_BASE}/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${encodeURIComponent(apiKey)}`;
  const response = await httpsGet(url);

  if (response.errors && response.errors.length > 0) {
    const errMsg = response.errors.map(e => e.details || e.id).join('; ');
    throw new Error(`Hunter.io Email Finder error: ${errMsg}`);
  }

  return response.data || null;
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * Enrich a company or contact using Hunter.io.
 *
 * For companies:
 *   - Runs Domain Search against the company's website domain
 *   - Returns all discovered email addresses as contacts[]
 *   - Also returns the detected email pattern (e.g. "{first}.{last}")
 *
 * For contacts:
 *   - Uses Email Finder with first+last name and company domain
 *   - Returns the discovered email and confidence score
 *
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData
 *   - company: { name, website, domain, contacts[] }
 *   - contact: { name, company_website, company_name }
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData = {}) {
  const result = {
    source: 'hunter',
    entityType,
    entityId,
    data: {},
    contacts: [],
    enrichedAt: new Date().toISOString(),
  };

  // ── API key check ──────────────────────────────────────────────────────────

  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    result.success = false;
    result.skipped = true;
    result.error = 'HUNTER_API_KEY not set — skipping Hunter.io enrichment';
    console.warn('[hunter] HUNTER_API_KEY not set, skipping');
    return result;
  }

  try {

    // ── Company enrichment ─────────────────────────────────────────────────

    if (entityType === 'company') {
      const { name, website } = existingData;
      const domain = extractDomain(website) || extractDomain(existingData.domain);

      if (!domain) {
        result.success = true;
        result.skipped = true;
        result.data = { reason: 'No domain available for Hunter domain-search' };
        console.log(`[hunter] Skipping ${name || entityId} — no domain`);
        return result;
      }

      console.log(`[hunter] Domain searching for: ${name || domain} (${domain})`);

      const hunterData = await domainSearch(domain, apiKey);

      // Extract email pattern
      const emailPattern = hunterData.pattern || null;

      // Map Hunter emails → our contact format
      const discoveredContacts = [];
      const emails = hunterData.emails || [];

      for (const emailObj of emails) {
        if (!emailObj.value) continue;

        // Skip low-confidence results
        if (emailObj.confidence !== undefined && emailObj.confidence < MIN_CONFIDENCE) {
          console.log(`[hunter]   Skipping ${emailObj.value} (confidence ${emailObj.confidence} < ${MIN_CONFIDENCE})`);
          continue;
        }

        // Skip role-based generic emails (info@, contact@, etc.) for contact list
        if (emailObj.type === 'generic') {
          console.log(`[hunter]   Skipping generic email: ${emailObj.value}`);
          continue;
        }

        const contact = {
          email:      emailObj.value,
          first_name: emailObj.first_name || null,
          last_name:  emailObj.last_name  || null,
          name:       [emailObj.first_name, emailObj.last_name].filter(Boolean).join(' ') || null,
          title:      emailObj.position   || null,
          seniority:  emailObj.seniority  || null,
          department: emailObj.department || null,
          confidence: emailObj.confidence || null,
          twitter_url: emailObj.twitter   ? `https://twitter.com/${emailObj.twitter}` : null,
          linkedin_url: emailObj.linkedin || null,
          phone:       emailObj.phone_number || null,
          source:      'hunter',
          verified:    emailObj.verification?.status === 'valid',
        };

        discoveredContacts.push(contact);
      }

      result.data = {
        domain,
        organization:          hunterData.organization || name,
        email_pattern:         emailPattern,
        total_emails_found:    emails.length,
        contacts_returned:     discoveredContacts.length,
        accept_all:            hunterData.accept_all || false,
        hunter_emails_raw:     emails.slice(0, MAX_EMAILS_PER_SEARCH),
      };

      result.contacts = discoveredContacts;
      result.success = true;

      console.log(
        `[hunter] ${name || domain}: found ${emails.length} emails, ` +
        `returning ${discoveredContacts.length} personal contacts, ` +
        `pattern="${emailPattern || 'unknown'}"`
      );

    // ── Contact enrichment ─────────────────────────────────────────────────

    } else if (entityType === 'contact') {
      const { name, email, company_website, company_name } = existingData;

      if (email) {
        result.success = true;
        result.skipped = true;
        result.data = { note: 'Contact already has email — skipping Hunter lookup' };
        return result;
      }

      if (!name) {
        result.success = false;
        result.error = 'Contact name required for Hunter Email Finder';
        return result;
      }

      const domain = extractDomain(company_website);
      if (!domain) {
        result.success = true;
        result.skipped = true;
        result.data = { reason: `No company domain for contact ${name}` };
        return result;
      }

      // Split name into first / last
      const parts = name.trim().split(/\s+/);
      if (parts.length < 2) {
        result.success = true;
        result.skipped = true;
        result.data = { reason: `Cannot parse first/last name from "${name}"` };
        return result;
      }
      const firstName = parts[0];
      const lastName  = parts[parts.length - 1];

      console.log(`[hunter] Email Finder: ${firstName} ${lastName} @ ${domain}`);

      const finderResult = await emailFinder(firstName, lastName, domain, apiKey);

      if (finderResult && finderResult.email) {
        result.data = {
          email:            finderResult.email,
          email_confidence: (finderResult.score || 0) / 100, // Hunter returns 0–100; normalize 0–1
          email_source:     'hunter',
          domain,
        };
        result.success = true;
        console.log(
          `[hunter] Found: ${finderResult.email} ` +
          `(score=${finderResult.score}, status=${finderResult.verification?.status || 'unverified'})`
        );
      } else {
        result.data = { reason: 'Hunter Email Finder returned no result' };
        result.success = true; // Not an error — just not found
        console.log(`[hunter] No email found for ${name} @ ${domain}`);
      }

    } else {
      result.success = false;
      result.error = `Unknown entityType: ${entityType}`;
    }

  } catch (err) {
    console.error(`[hunter] Error enriching ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = {
  enrich,
  // Exported for testing / standalone use:
  domainSearch,
  emailFinder,
  extractDomain,
};
