/**
 * LinkedIn enrichment — DuckDuckGo search for company/contact profiles.
 */

import { ddgSearch, EnrichmentResult } from "./web-search";

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "linkedin",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === "lead") {
      const companyName = existingData.company_name as string;
      if (!companyName) throw new Error("Company name required");

      console.log(`[linkedin] Searching for company: ${companyName}`);

      const results = await ddgSearch(`site:linkedin.com/company/ "${companyName}"`);
      const companyUrls = results
        .map((r) => r.url)
        .filter((u) => u.includes("linkedin.com/company/"));

      result.data = { companyUrls };
      if (companyUrls.length > 0 && !existingData.linkedin_url) {
        result.data.linkedin_url = companyUrls[0];
      }

      result.success = true;
    } else if (entityType === "contact") {
      const { name, company_name } = existingData as {
        name: string;
        company_name?: string;
      };
      if (!name) throw new Error("Contact name required");

      console.log(`[linkedin] Searching for contact: ${name}`);

      const query = company_name
        ? `site:linkedin.com/in/ "${name}" "${company_name}"`
        : `site:linkedin.com/in/ "${name}"`;

      const results = await ddgSearch(query);
      const profileUrls = results
        .map((r) => r.url)
        .filter((u) => u.includes("linkedin.com/in/"));

      result.data = { profileUrls };
      if (profileUrls.length > 0 && !existingData.linkedin_url) {
        result.data.linkedin_url = profileUrls[0];
      }

      result.success = true;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[linkedin] Failed for ${entityType} ${entityId}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
