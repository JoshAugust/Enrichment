import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { getDb } from "@/db";
import { enrichment_log } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

type RouteContext = { params: Promise<{ entityId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const { entityId } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const db = getDb();

  try {
    const logs = await db
      .select()
      .from(enrichment_log)
      .where(eq(enrichment_log.entity_id, entityId))
      .orderBy(desc(enrichment_log.created_at))
      .limit(limit);

    return NextResponse.json({ logs, total: logs.length });
  } catch (error) {
    console.error("GET /api/enrichment/log/[entityId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
