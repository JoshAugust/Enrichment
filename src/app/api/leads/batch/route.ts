import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { extractDomain, normalizeName } from "@/lib/dedup";
import { and, eq, or } from "drizzle-orm";

const LeadSchema = z.object({
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
  agent_notes: z.string().optional().nullable(),
  enrichment_data: z.record(z.unknown()).optional().nullable(),
});

const BatchSchema = z.object({
  leads: z.array(LeadSchema).max(50),
});

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = BatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let created = 0;
    let duplicates = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < parsed.data.leads.length; i++) {
      const data = parsed.data.leads[i];
      try {
        const domain = extractDomain(data.website ?? null);
        const name_normalized = normalizeName(data.company_name);

        const conditions = [];
        if (domain) conditions.push(eq(leads.domain, domain));
        if (name_normalized && data.state) {
          conditions.push(
            and(eq(leads.name_normalized, name_normalized), eq(leads.state, data.state))!
          );
        }

        if (conditions.length > 0) {
          const existing = await db
            .select({ id: leads.id })
            .from(leads)
            .where(or(...conditions))
            .limit(1);

          if (existing.length > 0) {
            duplicates++;
            continue;
          }
        }

        await db.insert(leads).values({
          ...data,
          domain,
          name_normalized,
          enrichment_data: data.enrichment_data ?? {},
        });

        created++;
      } catch (err) {
        errors.push({ index: i, error: String(err) });
      }
    }

    return NextResponse.json({ created, duplicates, errors });
  } catch (error) {
    console.error("POST /api/leads/batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
