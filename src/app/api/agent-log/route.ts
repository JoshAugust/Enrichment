import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { agent_log } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { desc } from "drizzle-orm";

const AgentLogSchema = z.object({
  agent_name: z.string().min(1),
  action: z.string().min(1),
  details: z.record(z.unknown()).optional().nullable(),
});

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = AgentLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const log = await db
      .insert(agent_log)
      .values({
        agent_name: parsed.data.agent_name,
        action: parsed.data.action,
        details: parsed.data.details ?? {},
      })
      .returning();

    return NextResponse.json(log[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/agent-log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  try {
    const logs = await db
      .select()
      .from(agent_log)
      .orderBy(desc(agent_log.created_at))
      .limit(limit);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("GET /api/agent-log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
