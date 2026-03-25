/**
 * Email pattern detection & address discovery.
 */

import { ddgSearch, EnrichmentResult } from "./web-search";
import { extractDomain } from "../utils";

// ── Pattern definitions ───────────────────────────────────────────────────────

type PatternFn = (f: string, l: string, d: string) => string;

const PATTERNS: Record<string, { id: string; generate: PatternFn }> = {
  FIRST_DOT_LAST: { id: "first.last", generate: (f, l, d) => `${f}.${l}@${d}` },
  FIRST_LAST: { id: "firstlast", generate: (f, l, d) => `${f}${l}@${d}` },
  F_DOT_LAST: { id: "f.last", generate: (f, l, d) => `${f[0]}.${l}@${d}` },
  FLAST: { id: "flast", generate: (f, l, d) => `${f[0]}${l}@${d}` },
  FIRST: { id: "first", generate: (f, l, d) => `${f}@${d}` },
  LAST_DOT_FIRST: { id: "last.first", generate: (f, l, d) => `${l}.${f}@${d}` },
  LAST: { id: "last", generate: (_f, l, d) => `${l}@${d}` },
  FIRST_L: { id: "firstl", generate: (f, l, d) => `${f}${l[0]}@${d}` },
};

const PATTERN_PRIORITY = [
  "FIRST_DOT_LAST","F_DOT_LAST","FIRST_LAST","FLAST",
  "FIRST","LAST_DOT_FIRST","FIRST_L","LAST",
];

// ── Pattern detection ─────────────────────────────────────────────────────────

interface PatternResult {
  patternKey: string;
  patternId: string;
  confidence: number;
  matchCount: number;
  sampleSize: number;
}

export function detectPattern(
  contacts: { name: string; email?: string | null }[],
  domain: string
): PatternResult | null {
  const knownEmails = contacts.filter((c) => {
    if (!c.email || !c.name) return false;
    const emailDomain = c.email.split("@")[1];
    return emailDomain?.toLowerCase() === domain.toLowerCase();
  });

  if (knownEmails.length === 0) return null;

  const scores: Record<string, number> = {};
  for (const { name, email } of knownEmails) {
    const parts = name.toLowerCase().trim().split(/\s+/);
    if (parts.length < 2) continue;
    const [first, ...rest] = parts;
    const last = rest[rest.length - 1];
    const localPart = email!.split("@")[0].toLowerCase();

    for (const [key, pattern] of Object.entries(PATTERNS)) {
      try {
        const expected = pattern.generate(first, last, domain).split("@")[0];
        if (expected === localPart) scores[key] = (scores[key] || 0) + 1;
      } catch {
        // skip
      }
    }
  }

  if (Object.keys(scores).length === 0) return null;

  const [key, count] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return {
    patternKey: key,
    patternId: PATTERNS[key].id,
    confidence: Math.round((count / knownEmails.length) * 100) / 100,
    matchCount: count,
    sampleSize: knownEmails.length,
  };
}

export function generateEmail(name: string, patternKey: string, domain: string): string | null {
  const parts = name.toLowerCase().trim().split(/\s+/);
  if (parts.length < 2) return null;
  const [first, ...rest] = parts;
  const last = rest[rest.length - 1];
  const pattern = PATTERNS[patternKey];
  if (!pattern) return null;
  try {
    return pattern.generate(
      first.replace(/[^a-z]/g, ""),
      last.replace(/[^a-z]/g, ""),
      domain
    );
  } catch {
    return null;
  }
}

export function generateCandidateEmails(name: string, domain: string) {
  const candidates: { patternKey: string; patternId: string; email: string }[] = [];
  const parts = name.toLowerCase().trim().split(/\s+/);
  if (parts.length < 2) return candidates;
  const [first, ...rest] = parts;
  const last = rest[rest.length - 1];
  const f = first.replace(/[^a-z]/g, "");
  const l = last.replace(/[^a-z]/g, "");
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

async function searchForEmail(
  name: string,
  companyName: string | undefined,
  domain: string | null
): Promise<string[]> {
  const query = domain
    ? `"${name}" email "${domain}"`
    : `"${name}" "${companyName}" email contact`;

  const results = await ddgSearch(query);
  const found = new Set<string>();

  for (const { snippet, title } of results) {
    const text = `${title} ${snippet}`;
    let m;
    const re = new RegExp(EMAIL_RE.source, EMAIL_RE.flags);
    while ((m = re.exec(text)) !== null) {
      const email = m[0].toLowerCase();
      if (!email.includes("example") && !email.includes("your@") && !email.endsWith(".png")) {
        if (!domain || email.endsWith(`@${domain}`)) found.add(email);
      }
    }
  }

  return [...found].slice(0, 5);
}

// ── Main enrich function ──────────────────────────────────────────────────────

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "email-discovery",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === "lead") {
      const { company_name, website, contacts = [] } = existingData as {
        company_name: string;
        website?: string;
        contacts?: { name: string; email?: string | null }[];
      };

      const domain = extractDomain(website);
      if (!domain) {
        result.success = true;
        result.skipped = true;
        result.data = { reason: "No website/domain available" };
        return result;
      }

      console.log(`[email-discovery] Detecting email pattern for ${company_name} (domain: ${domain})`);

      const pattern = detectPattern(contacts, domain);
      const contactsWithoutEmails = contacts.filter((c) => !c.email);
      const generated: unknown[] = [];

      for (const contact of contactsWithoutEmails.slice(0, 10)) {
        if (pattern && pattern.confidence >= 0.5) {
          const email = generateEmail(contact.name, pattern.patternKey, domain);
          if (email) {
            generated.push({
              contactName: contact.name,
              email,
              patternId: pattern.patternId,
              confidence: pattern.confidence,
              verified: false,
            });
          }
        } else {
          const candidates = generateCandidateEmails(contact.name, domain);
          generated.push({
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
        contactsWithEmails: contacts.filter((c) => c.email).length,
      };
      if (pattern) {
        result.data.email_pattern = pattern.patternId;
        result.data.email_confidence =
          pattern.sampleSize >= 2 ? 0.8 : pattern.sampleSize === 1 ? 0.5 : 0.3;
      }

      result.success = true;
    } else if (entityType === "contact") {
      const { name, email, company_name, website } = existingData as {
        name: string;
        email?: string;
        company_name?: string;
        website?: string;
      };
      if (!name) throw new Error("Contact name required");

      if (email) {
        result.success = true;
        result.data = { existingEmail: email, note: "Contact already has email" };
        return result;
      }

      console.log(`[email-discovery] Finding email for contact: ${name}`);

      const domain = extractDomain(website);
      const foundEmails = await searchForEmail(name, company_name, domain);
      const candidates = domain ? generateCandidateEmails(name, domain) : [];

      result.data = { foundEmails, candidates: candidates.slice(0, 5), domain };

      if (foundEmails.length > 0) {
        result.data.email = foundEmails[0];
        result.data.email_confidence = 0.7;
      } else if (candidates.length > 0 && domain) {
        result.data.email = candidates[0].email;
        result.data.email_pattern = candidates[0].patternId;
        result.data.email_confidence = 0.3;
      }

      result.success = true;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email-discovery] Failed for ${entityType} ${entityId}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
