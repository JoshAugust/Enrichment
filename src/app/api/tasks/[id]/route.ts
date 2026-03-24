import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { task_queue } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { eq } from "drizzle-orm";

const TaskPatchSchema = z.object({
  status: z.string().optional(),
  result: z.record(z.unknown()).optional().nullable(),
  completed_at: z.string().optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = TaskPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.result !== undefined) updateData.result = parsed.data.result;
    if (parsed.data.completed_at !== undefined) {
      updateData.completed_at = parsed.data.completed_at ? new Date(parsed.data.completed_at) : new Date();
    }

    const updated = await db
      .update(task_queue)
      .set(updateData)
      .where(eq(task_queue.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
