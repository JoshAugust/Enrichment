import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { industry_config } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { eq } from "drizzle-orm";

const IndustryCreateSchema = z.object({
  industry_key: z.string().min(1),
  display_name: z.string().min(1),
  scoring_weights: z.record(z.number()),
  lead_criteria: z.object({
    good_signals: z.array(z.string()),
    bad_signals: z.array(z.string()),
  }),
  search_strategies: z.record(z.unknown()).optional().nullable(),
  custom_fields: z.record(z.unknown()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  void request; // satisfy linter
  // Allow unauthenticated read access for frontend UI
  const db = getDb();
  try {
    const configs = await db.select().from(industry_config);
    return NextResponse.json({ industries: configs, total: configs.length });
  } catch (error) {
    console.error("GET /api/industries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = IndustryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check for duplicate key
    const [existing] = await db
      .select({ id: industry_config.id })
      .from(industry_config)
      .where(eq(industry_config.industry_key, parsed.data.industry_key))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Industry key already exists", id: existing.id },
        { status: 409 }
      );
    }

    const [created] = await db.insert(industry_config).values(parsed.data).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/industries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
