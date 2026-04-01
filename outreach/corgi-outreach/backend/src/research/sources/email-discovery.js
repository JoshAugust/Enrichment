/**
 * sources/email-discovery.js — Email pattern detection & discovery
 *
 * Discovers email addresses and infers email patterns for companies:
 *   - Detect patterns from known contacts (first.last@, f.last@, first@, etc.)
 *   - Generate probable emails for contacts based on detected pattern
 *   - Use web search to find publicly listed email addresses
 *   - Store pattern confidence scores
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const { ddgSearch } = require('./web-search');

// ── Email pattern definitions ─────────────────────────────────────────────────

const PATTERNS = {
  FIRST_DOT_LAST:   { id: 'first.last',   generate: (f, l, d) => `${f}.${l}@${d}` },
  FIRST_LAST:       { id: 'firstlast',     generate: (f, l, d) => `${f}${l}@${d}` },
  F_DOT_LAST:       { id: 'f.last',        generate: (f, l, d) => `${f[0]}.${l}@${d}` },
  FLAST:            { id: 'flast',         generate: (f, l, d) => `${f[0]}${l}@${d}` },
  FIRST:            { id: 'first',         generate: (f, l, d) => `${f}@${d}` },
  LAST_DOT_FIRST:   { id: 'last.first',    generate: (f, l, d) => `${l}.${f}@${d}` },
  LAST:             { id: 'last',          generate: (f, l, d) => `${l}@${d}` },
  FIRST_L:          { id: 'firstl',        generate: (f, l, d) => `${f}${l[0]}@${d}` },
};

// Ordered by statistical frequency in B2B
const PATTERN_PRIORITY = [
  'FIRST_DOT_LAST',
  'F_DOT_LAST',
  'FIRST_LAST',
  'FLAST',
  'FIRST',
  'LAST_DOT_FIRST',
  'FIRST_L',
  'LAST',
];

// ── Domain extraction ─────────────────────────────────────────────────────────

/**
 * Extract domain from website URL or email.
 */
function extractDomain(websiteOrEmail) {
  if (!websiteOrEmail) return null;
  try {
    if (websiteOrEmail.includes('@')) {
      return websiteOrEmail.split('@')[1].toLowerCase().trim();
    }
    const url = new URL(websiteOrEmail.startsWith('http') ? websiteOrEmail : `https://${websiteOrEmail}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

// ── Pattern detection from known contacts ─────────────────────────────────────

/**
 * Given a list of known contacts with emails, detect the email pattern used.
 *
 * @param {Array<{name: string, email: string}>} contacts
 * @param {string} domain  - The company's email domain
 * @returns {{ patternId: string, confidence: number, patternKey: string } | null}
 */
function detectPattern(contacts, domain) {
  const knownEmails = contacts.filter(c => {
    if (!c.email || !c.name) return false;
    const emailDomain = c.email.split('@')[1];
    return emailDomain && emailDomain.toLowerCase() === domain.toLowerCase();
  });

  if (knownEmails.length === 0) return null;

  // Tally matches for each pattern
  const scores = {};
  for (const { name, email } of knownEmails) {
    const parts = name.toLowerCase().trim().split(/\s+/);
    if (parts.length < 2) continue;
    const [first, ...rest] = parts;
    const last = rest[rest.length - 1];
    const localPart = email.split('@')[0].toLowerCase();

    for (const [key, pattern] of Object.entries(PATTERNS)) {
      try {
        const expected = pattern.generate(first, last, domain).split('@')[0];
        if (expected === localPart) {
          scores[key] = (scores[key] || 0) + 1;
        }
      } catch {
        // skip
      }
    }
  }

  if (Object.keys(scores).length === 0) return null;

  // Pick the highest-scoring pattern
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const [key, count] = best;
  const confidence = count / knownEmails.length;

  return {
    patternKey: key,
    patternId: PATTERNS[key].id,
    confidence: Math.round(confidence * 100) / 100,
    matchCount: count,
    sampleSize: knownEmails.length,
  };
}

/**
 * Generate probable email for a contact given a pattern and domain.
 *
 * @param {string} name        - Full name e.g. "John Smith"
 * @param {string} patternKey  - One of the PATTERN keys
 * @param {string} domain      - Email domain
 * @returns {string|null}
 */
function generateEmail(name, patternKey, domain) {
  const parts = name.toLowerCase().trim().split(/\s+/);
  if (parts.length < 2) return null;
  const [first, ...rest] = parts;
  const last = rest[rest.length - 1];
  const pattern = PATTERNS[patternKey];
  if (!pattern) return null;
  try {
    return pattern.generate(
      first.replace(/[^a-z]/g, ''),
      last.replace(/[^a-z]/g, ''),
      domain,
    );
  } catch {
    return null;
  }
}

/**
 * Generate all candidate emails for a contact (for verification purposes).
 */
function generateCandidateEmails(name, domain) {
  const candidates = [];
  const parts = name.toLowerCase().trim().split(/\s+/);
  if (parts.length < 2) return candidates;
  const [first, ...rest] = parts;
  const last = rest[rest.length - 1];
  const f = first.replace(/[^a-z]/g, '');
  const l = last.replace(/[^a-z]/g, '');

  for (const key of PATTERN_PRIORITY) {
    try {
      const email = PATTERNS[key].generate(f, l, domain);
      candidates.push({ patternKey: key, patternId: PATTERNS[key].id, email });
    } catch {
      // skip
    }
  }
  return candidates;
}

// ── Web search for public emails ──────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/**
 * Search the web for a person's email address.
 */
async function searchForEmail(name, companyName, domain) {
  const query = domain
    ? `"${name}" email "${domain}"`
    : `"${name}" "${companyName}" email contact`;

  const results = await ddgSearch(query);
  const found = new Set();

  for (const { snippet, title } of results) {
    const text = `${title} ${snippet}`;
    let m;
    const re = new RegExp(EMAIL_RE.source, EMAIL_RE.flags);
    while ((m = re.exec(text)) !== null) {
      const email = m[0].toLowerCase();
      // Filter out obvious non-personal emails
      if (!email.includes('example') && !email.includes('your@') && !email.endsWith('.png')) {
        if (!domain || email.endsWith(`@${domain}`)) {
          found.add(email);
        }
      }
    }
  }

  return [...found].slice(0, 5);
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData - For company: includes contacts[]. For contact: includes company
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'email-discovery',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === 'company') {
      const { name, website, contacts = [] } = existingData;
      const domain = extractDomain(website);

      if (!domain) {
        result.success = true;
        result.skipped = true;
        result.data = { reason: 'No website/domain available' };
        return result;
      }

      console.log(`[email-discovery] Detecting email pattern for ${name} (domain: ${domain})`);

      const pattern = detectPattern(contacts, domain);

      // Generate candidates for contacts without emails
      const contactsWithoutEmails = contacts.filter(c => !c.email);
      const generated = [];

      for (const contact of contactsWithoutEmails.slice(0, 10)) {
        if (pattern && pattern.confidence >= 0.5) {
          const email = generateEmail(contact.name, pattern.patternKey, domain);
          if (email) {
            generated.push({
              contactId: contact.id,
              contactName: contact.name,
              email,
              patternId: pattern.patternId,
              confidence: pattern.confidence,
              verified: false,
            });
          }
        } else {
          // No known pattern, generate all candidates for manual review
          const candidates = generateCandidateEmails(contact.name, domain);
          generated.push({
            contactId: contact.id,
            contactName: contact.name,
            candidates: candidates.slice(0, 3),
            confidence: 0,
            verified: false,
          });
        }
      }

      result.data = {
        domain,
        detectedPattern: pattern,
        generatedEmails: generated,
        contactsAnalyzed: contacts.length,
        contactsWithEmails: contacts.filter(c => c.email).length,
      };

      if (pattern) {
        result.data.email_pattern = pattern.patternId;
      }

      result.success = true;
      console.log(`[email-discovery] ${name}: pattern=${pattern?.patternId || 'unknown'} (confidence=${pattern?.confidence || 0}), ${generated.length} emails generated`);

    } else if (entityType === 'contact') {
      const { name, email, company_name, company_website } = existingData;
      if (!name) throw new Error('Contact name required');

      if (email) {
        // Already have email — verify domain and detect pattern contribution
        result.success = true;
        result.data = { existingEmail: email, note: 'Contact already has email' };
        return result;
      }

      console.log(`[email-discovery] Finding email for contact: ${name}`);

      const domain = extractDomain(company_website);

      // Search web for their email
      const foundEmails = await searchForEmail(name, company_name, domain);

      // Generate candidates based on common patterns
      const candidates = domain ? generateCandidateEmails(name, domain) : [];

      result.data = {
        foundEmails,
        candidates: candidates.slice(0, 5),
        domain,
      };

      // If we found a real email, surface it
      if (foundEmails.length > 0) {
        result.data.email = foundEmails[0];
        result.data.email_confidence = 0.7; // Found publicly, reasonably confident
      } else if (candidates.length > 0 && domain) {
        // Use highest-priority pattern candidate
        result.data.email = candidates[0].email;
        result.data.email_pattern = candidates[0].patternId;
        result.data.email_confidence = 0.3; // Generated, low confidence until verified
      }

      result.success = true;
      console.log(`[email-discovery] Contact ${name}: ${foundEmails.length} found, ${candidates.length} candidates`);
    }

  } catch (err) {
    console.error(`[email-discovery] Failed for ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = {
  enrich,
  detectPattern,
  generateEmail,
  generateCandidateEmails,
  extractDomain,
  PATTERNS,
};
