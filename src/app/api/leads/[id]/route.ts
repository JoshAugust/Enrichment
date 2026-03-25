import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { extractDomain, normalizeName } from "@/lib/dedup";
import { eq } from "drizzle-orm";
import { task_queue } from "@/db/schema";

const LeadPatchSchema = z.object({
  company_name: z.string().min(1).optional(),
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
  agent_notes: z.string().optional().nullable(),
  enrichment_data: z.record(z.unknown()).optional().nullable(),
  status: z.string().optional().nullable(),
  human_notes: z.string().optional().nullable(),
  last_touch_date: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const { id } = await context.params;

  try {
    const lead = await db.select().from(leads).where(eq(leads.id, id)).limit(1);

    if (lead.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead[0]);
  } catch (error) {
    console.error("GET /api/leads/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const { id } = await context.params;
  const isHumanEdit = request.headers.get("x-human-edit") === "true";

  try {
    const body = await request.json();
    const parsed = LeadPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (!isHumanEdit) {
      if (data.status !== undefined || data.human_notes !== undefined || data.last_touch_date !== undefined) {
        return NextResponse.json(
          { error: "Agents cannot write to status, human_notes, or last_touch_date. Use X-Human-Edit: true header." },
          { status: 403 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _s, human_notes: _h, last_touch_date: _l, ...agentData } = data;
    const updateData: Record<string, unknown> = isHumanEdit ? { ...data } : { ...agentData };

    if (updateData.website !== undefined) {
      updateData.domain = extractDomain(updateData.website as string | null);
    }
    if (updateData.company_name !== undefined) {
      updateData.name_normalized = normalizeName(updateData.company_name as string);
    }
    if (updateData.verified_at && typeof updateData.verified_at === "string") {
      updateData.verified_at = new Date(updateData.verified_at);
    }

    updateData.updated_at = new Date();

    const updated = await db
      .update(leads)
      .set(updateData)
      .where(eq(leads.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Auto-create enrich task when lead is verified
    if (data.verified === true) {
      try {
        await db.insert(task_queue).values({
          task_type: "enrich",
          payload: { lead_id: id },
          priority: 5,
        });
      } catch (taskErr) {
        console.warn("Failed to create enrich task:", taskErr);
      }
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PATCH /api/leads/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
