/**
 * Enrichment pipeline orchestrator.
 *
 * enrichLead(leadId, opts?)    — runs all sources in parallel, merges & persists
 * enrichContact(contactId, opts?) — runs contact-relevant sources
 * enrichBatch(leadIds)         — batch with 2s delay between leads
 */

import { getDb } from "@/db";
import {
  leads,
  contacts,
  enrichment_log,
  Lead,
  Contact,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { EnrichmentResult } from "./sources/web-search";

// ── Source imports ────────────────────────────────────────────────────────────

import * as companyWebsite from "./sources/company-website";
import * as webSearch from "./sources/web-search";
import * as googleBusiness from "./sources/google-business";
import * as emailDiscovery from "./sources/email-discovery";
import * as linkedinSource from "./sources/linkedin";
import * as funding from "./sources/funding";
import * as newsMonitor from "./sources/news-monitor";
import * as jobPostings from "./sources/job-postings";
import * as socialSignals from "./sources/social-signals";
import * as secEdgar from "./sources/sec-edgar";
import * as wappalyzer from "./sources/wappalyzer";
import * as phoneValidation from "./sources/phone-validation";
import * as apollo from "./sources/apollo";
import type { ApolloContact } from "./sources/apollo";

const LEAD_SOURCES = [
  { name: "company-website", mod: companyWebsite },
  // wappalyzer runs alongside company-website (both analyse the website)
  { name: "wappalyzer", mod: wappalyzer },
  { name: "web-search", mod: webSearch },
  { name: "google-business", mod: googleBusiness },
  { name: "email-discovery", mod: emailDiscovery },
  { name: "linkedin", mod: linkedinSource },
  { name: "funding", mod: funding },
  { name: "news-monitor", mod: newsMonitor },
  { name: "job-postings", mod: jobPostings },
  { name: "social-signals", mod: socialSignals },
  { name: "sec-edgar", mod: secEdgar },
  // Apollo enrichment: company data + decision-maker contacts
  { name: "apollo", mod: apollo },
  // phone-validation runs after contact enrichment populates phone fields
  { name: "phone-validation", mod: phoneValidation },
];

const CONTACT_SOURCES = [
  { name: "web-search", mod: webSearch },
  { name: "linkedin", mod: linkedinSource },
  { name: "email-discovery", mod: emailDiscovery },
  { name: "social-signals", mod: socialSignals },
  { name: "news-monitor", mod: newsMonitor },
  // phone-validation runs after other sources may surface phone numbers
  { name: "phone-validation", mod: phoneValidation },
];

// ── Key fields for completeness calculation ───────────────────────────────────

const LEAD_KEY_FIELDS: (keyof Lead)[] = [
  "email",
  "phone_hq",
  "mobile_phone",
  "contact_name",
  "website",
  "headquarters",
  "employee_count",
  "founded_year",
  "linkedin_url",
  "twitter_url",
  "hiring_signals",
  "industry",
];

const CONTACT_KEY_FIELDS: (keyof Contact)[] = [
  "email",
  "phone",
  "title",
  "linkedin_url",
  "twitter_url",
  "bio",
];

function computeLeadCompleteness(lead: Lead): number {
  const filled = LEAD_KEY_FIELDS.filter(
    (f) => lead[f] !== null && lead[f] !== undefined && lead[f] !== ""
  ).length;
  return Math.round((filled / LEAD_KEY_FIELDS.length) * 100);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function computeContactCompleteness(contact: Contact): number {
  const filled = CONTACT_KEY_FIELDS.filter(
    (f) => contact[f] !== null && contact[f] !== undefined && contact[f] !== ""
  ).length;
  return Math.round((filled / CONTACT_KEY_FIELDS.length) * 100);
}

// ── DB field maps ─────────────────────────────────────────────────────────────

const LEAD_DB_FIELDS = [
  "email",
  "phone_hq",
  "email_confidence",
  "email_pattern",
  "headquarters",
  "company_type",
  "employee_count",
  "founded_year",
  "total_raised",
  "last_funding_round",
  "investors",
  "financing_status",
  "linkedin_url",
  "twitter_url",
  "github_url",
  "recent_news",
  "hiring_signals",
  "open_roles_count",
  "key_hires",
];

const CONTACT_DB_FIELDS = [
  "email",
  "phone",
  "linkedin_url",
  "twitter_url",
  "bio",
  "tenure",
  "email_pattern",
  "email_confidence",
  "title",
];

// ── Log helper ────────────────────────────────────────────────────────────────

async function logEnrichment(
  db: ReturnType<typeof getDb>,
  entityType: string,
  entityId: string,
  source: string,
  result: EnrichmentResult,
  fieldsUpdated: string[],
  durationMs: number
) {
  try {
    await db.insert(enrichment_log).values({
      entity_type: entityType,
      entity_id: entityId,
      source,
      success: result.success,
      skipped: result.skipped ?? false,
      data_found: result.data || {},
      fields_updated: fieldsUpdated.join(","),
      error: result.error ?? null,
      duration_ms: durationMs,
    });
  } catch (err) {
    console.warn("[pipeline] Failed to log enrichment:", err);
  }
}

// ── Lead enrichment ───────────────────────────────────────────────────────────

export interface EnrichLeadOpts {
  force?: boolean;
  sourcesToRun?: string[];
}

export async function enrichLead(
  leadId: string,
  opts: EnrichLeadOpts = {}
): Promise<{
  leadId: string;
  results: { source: string; success: boolean; skipped: boolean; fieldsFound: number; error?: string }[];
  updatedFields: string[];
  completeness: number;
}> {
  const db = getDb();

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) throw new Error(`Lead not found: ${leadId}`);

  // Rate-limit check: skip if enriched within 24h unless forced
  if (!opts.force && lead.last_enriched_at) {
    const ageMs = Date.now() - new Date(lead.last_enriched_at).getTime();
    if (ageMs < 24 * 60 * 60 * 1000) {
      return {
        leadId,
        results: [{ source: "pipeline", success: true, skipped: true, fieldsFound: 0 }],
        updatedFields: [],
        completeness: lead.enrichment_completeness ?? 0,
      };
    }
  }

  // Fetch contacts for email-discovery
  const leadContacts = await db
    .select()
    .from(contacts)
    .where(eq(contacts.lead_id, leadId));

  const existingData: Record<string, unknown> = {
    ...lead,
    contacts: leadContacts.map((c) => ({ name: c.name, email: c.email })),
  };

  const sourcesToRun = opts.sourcesToRun
    ? LEAD_SOURCES.filter((s) => opts.sourcesToRun!.includes(s.name))
    : LEAD_SOURCES;

  console.log(`\n[pipeline] 🚀 Enriching lead: ${lead.company_name} (${leadId})`);

  // Run all sources in parallel
  const sourcePromises = sourcesToRun.map(async ({ name: sourceName, mod }) => {
    const start = Date.now();
    try {
      const result = await mod.enrich("lead", leadId, existingData);
      return { sourceName, result, durationMs: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] Source ${sourceName} threw:`, msg);
      return {
        sourceName,
        result: { source: sourceName, entityType: "lead", entityId: leadId, success: false, error: msg, data: {}, enrichedAt: new Date().toISOString() } as EnrichmentResult,
        durationMs: Date.now() - start,
      };
    }
  });

  const settled = await Promise.all(sourcePromises);

  // Merge results — first source to return a value wins; existing non-null preserved
  const allUpdates: Record<string, unknown> = {};
  const resultSummary = [];

  for (const { sourceName, result, durationMs } of settled) {
    const fieldsUpdated: string[] = [];

    if (result.data && !result.skipped) {
      for (const field of LEAD_DB_FIELDS) {
        const val = result.data[field];
        if (val === undefined || val === null) continue;
        // Preserve existing non-null, first-source wins
        if (allUpdates[field] !== undefined) continue;
        if (lead[field as keyof Lead] !== null && lead[field as keyof Lead] !== undefined && lead[field as keyof Lead] !== "") continue;
        allUpdates[field] = val;
        fieldsUpdated.push(field);
      }

      // Handle recent_news specially (jsonb)
      if (result.data.recent_news && !allUpdates.recent_news && !lead.recent_news) {
        allUpdates.recent_news = result.data.recent_news;
        fieldsUpdated.push("recent_news");
      }
    }

    await logEnrichment(db, "lead", leadId, sourceName, result, fieldsUpdated, durationMs);

    resultSummary.push({
      source: sourceName,
      success: result.success,
      skipped: result.skipped ?? false,
      fieldsFound: Object.keys(result.data || {}).filter((k) => result.data[k] !== null).length,
      error: result.error,
    });
  }

  // ── Insert Apollo contacts ────────────────────────────────────────────────
  const apolloResult = settled.find((s) => s.sourceName === "apollo");
  if (apolloResult?.result.success && apolloResult.result.data?.contacts) {
    const apolloContacts = apolloResult.result.data.contacts as ApolloContact[];
    if (apolloContacts.length > 0) {
      console.log(`[pipeline] Inserting ${apolloContacts.length} Apollo contacts for lead ${leadId}`);
      for (const c of apolloContacts) {
        if (!c.name) continue;
        try {
          // Upsert by name + lead_id to avoid duplicates on re-runs
          const existing = leadContacts.find(
            (lc) => lc.name.toLowerCase() === c.name.toLowerCase()
          );
          if (existing) {
            // Update with Apollo data if fields are missing
            const updates: Record<string, unknown> = {};
            if (c.email && !existing.email) updates.email = c.email;
            if (c.phone && !existing.phone) updates.phone = c.phone;
            if (c.title && !existing.title) updates.title = c.title;
            if (c.linkedin_url && !existing.linkedin_url) updates.linkedin_url = c.linkedin_url;
            if (Object.keys(updates).length > 0) {
              await db
                .update(contacts)
                .set({ ...updates, last_enriched_at: new Date() })
                .where(eq(contacts.id, existing.id));
            }
          } else {
            await db.insert(contacts).values({
              lead_id: leadId,
              name: c.name,
              title: c.title ?? null,
              email: c.email ?? null,
              phone: c.phone ?? null,
              linkedin_url: c.linkedin_url ?? null,
              source: "apollo",
              verified: false,
              last_enriched_at: new Date(),
            });
          }
        } catch (err) {
          console.warn(`[pipeline] Failed to upsert Apollo contact ${c.name}:`, err);
        }
      }
    }
  }

  // Compute completeness
  const mergedLead = { ...lead, ...allUpdates } as Lead;
  const completeness = computeLeadCompleteness(mergedLead);
  const dataSources = settled
    .filter((s) => s.result.success && !s.result.skipped)
    .map((s) => s.sourceName)
    .join(",");

  // Persist merged updates
  if (Object.keys(allUpdates).length > 0 || true) {
    await db
      .update(leads)
      .set({
        ...allUpdates,
        last_enriched_at: new Date(),
        enrichment_completeness: completeness,
        data_sources_hit: dataSources,
        updated_at: new Date(),
      })
      .where(eq(leads.id, leadId));
  }

  const updatedFields = Object.keys(allUpdates);
  console.log(`[pipeline] ✅ Lead ${lead.company_name} enriched. Fields: ${updatedFields.join(", ") || "none"}, completeness=${completeness}%`);

  return { leadId, results: resultSummary, updatedFields, completeness };
}

// ── Contact enrichment ────────────────────────────────────────────────────────

export async function enrichContact(
  contactId: string,
  opts: { sourcesToRun?: string[] } = {}
): Promise<{
  contactId: string;
  results: { source: string; success: boolean; skipped: boolean; fieldsFound: number; error?: string }[];
  updatedFields: string[];
}> {
  const db = getDb();

  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);
  if (!contact) throw new Error(`Contact not found: ${contactId}`);

  // Get lead for context
  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, contact.lead_id))
    .limit(1);

  const existingData: Record<string, unknown> = {
    ...contact,
    company_name: lead?.company_name,
    website: lead?.website,
  };

  const sourcesToRun = opts.sourcesToRun
    ? CONTACT_SOURCES.filter((s) => opts.sourcesToRun!.includes(s.name))
    : CONTACT_SOURCES;

  console.log(`\n[pipeline] 🚀 Enriching contact: ${contact.name} (${contactId})`);

  const sourcePromises = sourcesToRun.map(async ({ name: sourceName, mod }) => {
    const start = Date.now();
    try {
      const result = await mod.enrich("contact", contactId, existingData);
      return { sourceName, result, durationMs: Date.now() - start };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        sourceName,
        result: { source: sourceName, entityType: "contact", entityId: contactId, success: false, error: msg, data: {}, enrichedAt: new Date().toISOString() } as EnrichmentResult,
        durationMs: Date.now() - start,
      };
    }
  });

  const settled = await Promise.all(sourcePromises);

  const allUpdates: Record<string, unknown> = {};
  const resultSummary = [];

  for (const { sourceName, result, durationMs } of settled) {
    const fieldsUpdated: string[] = [];
    if (result.data && !result.skipped) {
      for (const field of CONTACT_DB_FIELDS) {
        const val = result.data[field];
        if (val === undefined || val === null) continue;
        if (allUpdates[field] !== undefined) continue;
        if (contact[field as keyof Contact] !== null && contact[field as keyof Contact] !== undefined && contact[field as keyof Contact] !== "") continue;
        allUpdates[field] = val;
        fieldsUpdated.push(field);
      }
    }
    await logEnrichment(db, "contact", contactId, sourceName, result, fieldsUpdated, durationMs);
    resultSummary.push({
      source: sourceName,
      success: result.success,
      skipped: result.skipped ?? false,
      fieldsFound: Object.keys(result.data || {}).filter((k) => result.data[k] !== null).length,
      error: result.error,
    });
  }

  if (Object.keys(allUpdates).length > 0) {
    await db
      .update(contacts)
      .set({ ...allUpdates, last_enriched_at: new Date() })
      .where(eq(contacts.id, contactId));
  } else {
    await db
      .update(contacts)
      .set({ last_enriched_at: new Date() })
      .where(eq(contacts.id, contactId));
  }

  console.log(`[pipeline] ✅ Contact ${contact.name} enriched. Fields: ${Object.keys(allUpdates).join(", ") || "none"}`);
  return { contactId, results: resultSummary, updatedFields: Object.keys(allUpdates) };
}

// ── Batch enrichment ──────────────────────────────────────────────────────────

export async function enrichBatch(
  leadIds: string[],
  opts: EnrichLeadOpts = {}
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: { leadId: string; status: string; error?: string }[];
}> {
  const results: { leadId: string; status: string; error?: string }[] = [];

  for (const leadId of leadIds) {
    try {
      await enrichLead(leadId, opts);
      results.push({ leadId, status: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] Batch: failed for lead ${leadId}:`, msg);
      results.push({ leadId, status: "error", error: msg });
    }
    // 2s delay between leads
    if (leadIds.indexOf(leadId) < leadIds.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return {
    processed: results.length,
    succeeded: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "error").length,
    results,
  };
}

// ── Pipeline status ───────────────────────────────────────────────────────────

export async function getPipelineStatus() {
  const db = getDb();

  const [totalRuns] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrichment_log);

  const bySource = await db
    .select({
      source: enrichment_log.source,
      count: sql<number>`count(*)`,
      successCount: sql<number>`sum(case when success then 1 else 0 end)`,
      avgDuration: sql<number>`avg(duration_ms)`,
    })
    .from(enrichment_log)
    .groupBy(enrichment_log.source);

  const [enrichedLeads] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(sql`last_enriched_at is not null`);

  const sourceStats: Record<string, { count: number; successRate: number; avgDurationMs: number }> = {};
  for (const row of bySource) {
    sourceStats[row.source] = {
      count: Number(row.count),
      successRate: row.count > 0 ? Math.round((Number(row.successCount) / Number(row.count)) * 100) : 0,
      avgDurationMs: row.avgDuration ? Math.round(Number(row.avgDuration)) : 0,
    };
  }

  return {
    status: "operational",
    availableSources: LEAD_SOURCES.map((s) => s.name),
    sourceStats,
    totalEnrichmentRuns: Number(totalRuns?.count ?? 0),
    leadsEnriched: Number(enrichedLeads?.count ?? 0),
    timestamp: new Date().toISOString(),
  };
}
