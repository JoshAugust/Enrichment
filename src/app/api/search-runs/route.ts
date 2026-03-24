import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { search_runs } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

const SearchRunSchema = z.object({
  agent_name: z.string().min(1),
  strategy: z.string().min(1),
  query: z.string().optional().nullable(),
  source_type: z.string().optional().nullable(),
  state_target: z.string().optional().nullable(),
  leads_found: z.number().int().optional().nullable(),
  leads_added: z.number().int().optional().nullable(),
  leads_duplicate: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = SearchRunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const run = await db.insert(search_runs).values(parsed.data).returning();
    return NextResponse.json(run[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/search-runs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const agent_name = searchParams.get("agent_name");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  try {
    let query = db.select().from(search_runs).$dynamic();

    if (agent_name) {
      query = query.where(eq(search_runs.agent_name, agent_name));
    }

    const runs = await query.orderBy(desc(search_runs.created_at)).limit(limit);
    return NextResponse.json(runs);
  } catch (error) {
    console.error("GET /api/search-runs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
