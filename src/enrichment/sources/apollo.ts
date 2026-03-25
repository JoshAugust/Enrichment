/**
 * Apollo.io enrichment source.
 *
 * 1. Organization enrichment  — company size, industry, revenue, technologies
 * 2. People search             — decision-maker contacts at the company
 * 3. People enrichment         — verified email, phone, LinkedIn per person
 *
 * Auth: x-api-key header (env: APOLLO_API_KEY)
 * Rate limit: 5 req/min → use shared rateLimiter + 1.5 s inter-call delay
 */

import { rateLimiter } from "./rate-limiter";
import { EnrichmentResult } from "./web-search";

const APOLLO_BASE = "https://api.apollo.io/api/v1";
const INTER_CALL_DELAY_MS = 1500;
const RETRY_DELAY_MS = 10_000; // back off on 429
const TIMEOUT_MS = 20_000;

// ── Apollo response shapes (partial) ─────────────────────────────────────────

interface ApolloOrganization {
  id?: string;
  name?: string;
  website_url?: string;
  linkedin_url?: string;
  industry?: string;
  estimated_num_employees?: number;
  annual_revenue?: number;
  annual_revenue_printed?: string;
  founded_year?: number;
  short_description?: string;
  technologies?: { uid: string; name: string; category: string }[];
  keywords?: string[];
  primary_domain?: string;
  logo_url?: string;
  sic_codes?: string[];
  city?: string;
  state?: string;
  country?: string;
}

interface ApolloPerson {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone_numbers?: { raw_number: string; type: string; position: number }[];
  linkedin_url?: string;
  twitter_url?: string;
  seniority?: string;
  departments?: string[];
  organization?: ApolloOrganization;
}

interface ApolloOrgEnrichResponse {
  organization?: ApolloOrganization;
  status?: string;
}

interface ApolloPeopleSearchResponse {
  people?: ApolloPerson[];
  pagination?: { total_entries: number; per_page: number; page: number };
}

interface ApolloPeopleMatchResponse {
  person?: ApolloPerson;
  status?: string;
}

// ── Contact shape we emit ─────────────────────────────────────────────────────

export interface ApolloContact {
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  source: string;
  seniority?: string;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function apolloPost<T>(
  path: string,
  body: Record<string, unknown>,
  apiKey: string
): Promise<{ data: T; creditsUsed: number | null }> {
  return rateLimiter.run(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${APOLLO_BASE}${path}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({ ...body, api_key: apiKey }),
      });

      clearTimeout(timer);

      // Log credit usage if provided
      const creditsUsed = res.headers.get("x-credits-consumed")
        ? Number(res.headers.get("x-credits-consumed"))
        : null;

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter ? Number(retryAfter) * 1000 : RETRY_DELAY_MS;
        console.warn(`[apollo] Rate limited. Retrying after ${waitMs}ms…`);
        await new Promise((r) => setTimeout(r, waitMs));

        // One retry
        const retry = await fetch(`${APOLLO_BASE}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({ ...body, api_key: apiKey }),
        });
        if (!retry.ok) throw new Error(`Apollo HTTP ${retry.status} after retry`);
        const retryCredits = retry.headers.get("x-credits-consumed")
          ? Number(retry.headers.get("x-credits-consumed"))
          : null;
        return { data: (await retry.json()) as T, creditsUsed: retryCredits };
      }

      if (res.status === 404) {
        // Not found in Apollo — return empty object, not an error
        return { data: {} as T, creditsUsed };
      }

      if (!res.ok) throw new Error(`Apollo HTTP ${res.status}`);

      return { data: (await res.json()) as T, creditsUsed };
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  });
}

// ── 1. Organization enrichment ────────────────────────────────────────────────

async function enrichOrganization(
  domain: string,
  apiKey: string
): Promise<ApolloOrganization | null> {
  console.log(`[apollo] Enriching organization: ${domain}`);
  const { data, creditsUsed } = await apolloPost<ApolloOrgEnrichResponse>(
    "/organizations/enrich",
    { domain },
    apiKey
  );
  if (creditsUsed !== null) console.log(`[apollo] Credits used (org enrich): ${creditsUsed}`);
  return data?.organization ?? null;
}

// ── 2. People search ──────────────────────────────────────────────────────────

async function searchPeople(
  domain: string,
  apiKey: string
): Promise<ApolloPerson[]> {
  await new Promise((r) => setTimeout(r, INTER_CALL_DELAY_MS));
  console.log(`[apollo] Searching people at: ${domain}`);

  const { data, creditsUsed } = await apolloPost<ApolloPeopleSearchResponse>(
    "/mixed_people/search",
    {
      q_organization_domains: domain,
      page: 1,
      per_page: 5,
      person_seniorities: ["owner", "founder", "c_suite", "vp", "director"],
    },
    apiKey
  );

  if (creditsUsed !== null) console.log(`[apollo] Credits used (people search): ${creditsUsed}`);
  return data?.people ?? [];
}

// ── 3. People enrichment (optional, per person) ───────────────────────────────

async function enrichPerson(
  person: ApolloPerson,
  domain: string,
  apiKey: string
): Promise<ApolloPerson | null> {
  await new Promise((r) => setTimeout(r, INTER_CALL_DELAY_MS));

  const payload: Record<string, unknown> = { domain };
  if (person.email) {
    payload.email = person.email;
  } else if (person.first_name && person.last_name) {
    payload.first_name = person.first_name;
    payload.last_name = person.last_name;
  } else {
    return person; // Nothing useful to match on
  }

  try {
    const { data, creditsUsed } = await apolloPost<ApolloPeopleMatchResponse>(
      "/people/match",
      payload,
      apiKey
    );
    if (creditsUsed !== null) console.log(`[apollo] Credits used (people match): ${creditsUsed}`);
    return data?.person ?? person;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[apollo] People match failed for ${person.name}: ${msg}`);
    return person;
  }
}

// ── Contact mapper ────────────────────────────────────────────────────────────

function mapPersonToContact(person: ApolloPerson): ApolloContact {
  const directPhone = person.phone_numbers?.find((p) => p.type === "direct_phone");
  const mobilePhone = person.phone_numbers?.find((p) => p.type === "mobile_phone");
  const anyPhone = directPhone ?? mobilePhone ?? person.phone_numbers?.[0];

  return {
    name: person.name ?? [person.first_name, person.last_name].filter(Boolean).join(" "),
    title: person.title ?? null,
    email: person.email ?? null,
    phone: anyPhone?.raw_number ?? null,
    linkedin_url: person.linkedin_url ?? null,
    source: "apollo",
    seniority: person.seniority,
  };
}

// ── Main enrich function ──────────────────────────────────────────────────────

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "apollo",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  // Only enrich leads for now
  if (entityType !== "lead") {
    result.success = true;
    result.skipped = true;
    return result;
  }

  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    result.success = false;
    result.error = "APOLLO_API_KEY not set";
    console.warn("[apollo] APOLLO_API_KEY is not configured — skipping");
    return result;
  }

  const website = existingData.website as string | undefined;
  if (!website) {
    result.success = true;
    result.skipped = true;
    return result;
  }

  // Extract bare domain from URL
  let domain: string;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    result.success = false;
    result.error = `Invalid website URL: ${website}`;
    return result;
  }

  try {
    // ── Step 1: Organization enrichment ─────────────────────────────────────
    let org: ApolloOrganization | null = null;
    try {
      org = await enrichOrganization(domain, apiKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[apollo] Org enrichment failed for ${domain}: ${msg}`);
    }

    // ── Step 2: People search ────────────────────────────────────────────────
    let rawPeople: ApolloPerson[] = [];
    try {
      rawPeople = await searchPeople(domain, apiKey);
      console.log(`[apollo] Found ${rawPeople.length} people at ${domain}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[apollo] People search failed for ${domain}: ${msg}`);
    }

    // ── Step 3: Enrich top 3 people for verified contact data ────────────────
    const enrichedPeople: ApolloPerson[] = [];
    for (const person of rawPeople.slice(0, 3)) {
      try {
        const enriched = await enrichPerson(person, domain, apiKey);
        enrichedPeople.push(enriched ?? person);
      } catch {
        enrichedPeople.push(person);
      }
    }
    // Remaining people (4-5) added as-is
    for (const person of rawPeople.slice(3)) {
      enrichedPeople.push(person);
    }

    // ── Map contacts ─────────────────────────────────────────────────────────
    const apolloContacts: ApolloContact[] = enrichedPeople
      .filter((p) => p.name || (p.first_name && p.last_name))
      .map(mapPersonToContact);

    // ── Map company fields ────────────────────────────────────────────────────
    const fields: Record<string, unknown> = {};

    if (org) {
      if (org.estimated_num_employees) {
        fields.employee_count = String(org.estimated_num_employees);
      }
      if (org.annual_revenue_printed ?? org.annual_revenue) {
        fields.annual_revenue = org.annual_revenue_printed ?? String(org.annual_revenue);
      }
      if (org.founded_year) {
        fields.founded_year = org.founded_year;
      }
      if (org.linkedin_url && !existingData.linkedin_url) {
        fields.linkedin_url = org.linkedin_url;
      }
      if (org.industry && !existingData.industry) {
        fields.industry = org.industry;
      }

      // Append tech stack / keywords to specialization
      const techNames = (org.technologies ?? []).map((t) => t.name).slice(0, 10);
      const keywords = (org.keywords ?? []).slice(0, 10);
      const specialization = [...techNames, ...keywords].join(", ");
      if (specialization) {
        const existing = existingData.specialization as string | undefined;
        fields.specialization = existing
          ? `${existing}; ${specialization}`
          : specialization;
      }
    }

    // ── Raw data for logging ─────────────────────────────────────────────────
    const rawData = { organization: org, people: rawPeople };

    result.data = {
      ...fields,
      contacts: apolloContacts,
      rawData,
      enrichment_data: {
        apollo: {
          organization: org,
          peopleCount: enrichedPeople.length,
          domain,
        },
      },
    };

    result.success = true;

    const contactSummary = apolloContacts
      .map((c) => `${c.name} (${c.title ?? "unknown"})`)
      .join(", ");
    console.log(
      `[apollo] ✅ ${domain}: org=${org ? "found" : "not found"}, contacts=[${contactSummary}]`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[apollo] Failed for lead ${entityId}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
