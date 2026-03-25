/**
 * Shared utility functions for the enrichment pipeline.
 */

/**
 * Extract the root domain from a URL or email.
 */
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    if (url.includes("@")) {
      return url.split("@")[1].toLowerCase().trim();
    }
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

const COMPANY_SUFFIXES = /\b(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?|plc\.?|lp\.?|llp\.?|group|holdings?|capital|finance|technology|technologies|solutions|services|international|global)\b/gi;

/**
 * Normalize a company name for deduplication.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(COMPANY_SUFFIXES, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a phone number to E.164 format.
 * Returns null if the number looks invalid.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+")) {
    if (digits.length === 10) digits = "+1" + digits;
    else if (digits.length === 11 && digits.startsWith("1")) digits = "+" + digits;
    else digits = "+" + digits;
  }
  const justDigits = digits.replace(/\D/g, "");
  if (justDigits.length < 10 || justDigits.length > 15) return null;
  return digits;
}

/**
 * Extract email addresses from HTML/text.
 */
export function extractEmails(text: string): string[] {
  const emails = new Set<string>();
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  let m;
  while ((m = emailRe.exec(text)) !== null) {
    const e = m[0].toLowerCase();
    if (
      !e.includes("example") &&
      !e.includes("your@") &&
      !e.endsWith(".png") &&
      !e.endsWith(".jpg")
    ) {
      emails.add(e);
    }
  }
  return [...emails].slice(0, 10);
}

/**
 * Extract US phone numbers from text.
 */
export function extractPhones(text: string): string[] {
  const phoneRe = /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;
  const phones = new Set<string>();
  let m;
  while ((m = phoneRe.exec(text)) !== null) {
    phones.add(m[0].trim());
  }
  return [...phones].slice(0, 5);
}
