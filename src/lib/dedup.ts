/**
 * Extract the domain from a URL, stripping protocol, www, and path.
 * e.g. "https://www.example.com/page" -> "example.com"
 */
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // Add protocol if missing
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(normalized);
    let hostname = parsed.hostname.toLowerCase();
    // Strip www.
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return hostname || null;
  } catch {
    // If URL parsing fails, try regex
    const match = url
      .toLowerCase()
      .match(/^(?:https?:\/\/)?(?:www\.)?([^/\s]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Normalize a company name for dedup purposes.
 * Lowercases and strips common suffixes like LLC, Inc, Corp, etc.
 */
export function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name
    .toLowerCase()
    .replace(
      /\s*,?\s*(llc|inc\.?|corp\.?|group|agency|insurance|services|co\.?|ltd\.?|limited|associates|association|& associates)\s*$/gi,
      ""
    )
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
