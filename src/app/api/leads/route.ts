import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { extractDomain, normalizeName } from "@/lib/dedup";
import { and, eq, gte, ilike, lte, or, sql, desc } from "drizzle-orm";
import { task_queue } from "@/db/schema";

const LeadCreateSchema = z.object({
  company_name: z.string().min(1),
  website: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  contact_title: z.string().optional().nullable(),
  mobile_phone: z.string().optional().nullable(),
  phone_hq: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  states_served: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  is_independent: z.boolean().optional().nullable(),
  carrier_partners: z.string().optional().nullable(),
  estimated_size: z.string().optional().nullable(),
  quality_score: z.number().int().min(0).max(100).optional().nullable(),
  source: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  discovered_by: z.string().optional().nullable(),
  verified: z.boolean().optional().nullable(),
  verified_at: z.string().optional().nullable(),
  verified_by: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  human_notes: z.string().optional().nullable(),
  last_touch_date: z.string().optional().nullable(),
  agent_notes: z.string().optional().nullable(),
  enrichment_data: z.record(z.unknown()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  // Allow unauthenticated read access for the frontend UI
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const state = searchParams.get("state");
  const verified = searchParams.get("verified");
  const minScore = searchParams.get("minScore");
  const maxScore = searchParams.get("maxScore");
  const source = searchParams.get("source");
  const search = searchParams.get("search");
  const industry = searchParams.get("industry");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  try {
    const conditions = [];

    if (status) conditions.push(eq(leads.status, status));
    if (state) conditions.push(eq(leads.state, state));
    if (industry) conditions.push(eq(leads.industry, industry));
    if (verified !== null) conditions.push(eq(leads.verified, verified === "true"));
    if (minScore) conditions.push(gte(leads.quality_score, parseInt(minScore, 10)));
    if (maxScore) conditions.push(lte(leads.quality_score, parseInt(maxScore, 10)));
    if (source) conditions.push(eq(leads.source, source));
    if (search) {
      conditions.push(
        or(
          ilike(leads.company_name, `%${search}%`),
          ilike(leads.agent_notes, `%${search}%`),
          ilike(leads.contact_name, `%${search}%`),
          ilike(leads.human_notes, `%${search}%`)
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [leadsResult, countResult] = await Promise.all([
      db.select().from(leads).where(where).limit(limit).offset(offset).orderBy(desc(leads.created_at)),
      db.select({ count: sql<number>`count(*)` }).from(leads).where(where),
    ]);

    return NextResponse.json({
      leads: leadsResult,
      total: Number(countResult[0]?.count ?? 0),
    });
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = LeadCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const domain = extractDomain(data.website ?? null);
    const name_normalized = normalizeName(data.company_name);

    if (domain) {
      const existing = await db
        .select({ id: leads.id, company_name: leads.company_name })
        .from(leads)
        .where(eq(leads.domain, domain))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Duplicate domain", existing_id: existing[0].id, existing_company: existing[0].company_name },
          { status: 409 }
        );
      }
    }

    if (name_normalized && data.state) {
      const existing = await db
        .select({ id: leads.id, company_name: leads.company_name })
        .from(leads)
        .where(and(eq(leads.name_normalized, name_normalized), eq(leads.state, data.state)))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Duplicate name+state", existing_id: existing[0].id, existing_company: existing[0].company_name },
          { status: 409 }
        );
      }
    }

    const newLead = await db
      .insert(leads)
      .values({
        ...data,
        domain,
        name_normalized,
        verified_at: data.verified_at ? new Date(data.verified_at) : undefined,
        enrichment_data: data.enrichment_data ?? {},
      })
      .returning();

    // Auto-create a verify task
    try {
      await db.insert(task_queue).values({
        task_type: "verify",
        payload: { lead_id: newLead[0].id },
        priority: 5,
      });
    } catch (taskErr) {
      console.warn("Failed to create verify task:", taskErr);
    }

    return NextResponse.json(newLead[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/leads error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
