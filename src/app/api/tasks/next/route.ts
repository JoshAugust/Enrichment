import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { task_queue } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { and, eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const taskType = searchParams.get("type");
  const agentName = request.headers.get("x-agent-name") ?? "unknown";

  if (!taskType) {
    return NextResponse.json({ error: "Missing type query parameter" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const candidates = await tx
        .select()
        .from(task_queue)
        .where(and(eq(task_queue.status, "pending"), eq(task_queue.task_type, taskType)))
        .orderBy(asc(task_queue.priority), asc(task_queue.created_at))
        .limit(1)
        .for("update", { skipLocked: true });

      if (candidates.length === 0) return null;

      const task = candidates[0];
      const updated = await tx
        .update(task_queue)
        .set({ status: "claimed", claimed_by: agentName, claimed_at: new Date() })
        .where(eq(task_queue.id, task.id))
        .returning();

      return updated[0];
    });

    if (!result) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/tasks/next error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
