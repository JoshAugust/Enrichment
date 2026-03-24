import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { task_queue } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { and, eq, desc } from "drizzle-orm";

const TaskCreateSchema = z.object({
  task_type: z.string().min(1),
  payload: z.record(z.unknown()).optional().default({}),
  priority: z.number().int().min(1).max(10).optional().default(5),
});

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = TaskCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const task = await db.insert(task_queue).values(parsed.data).returning();
    return NextResponse.json(task[0], { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const task_type = searchParams.get("task_type");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  try {
    const conditions = [];
    if (status) conditions.push(eq(task_queue.status, status));
    if (task_type) conditions.push(eq(task_queue.task_type, task_type));

    const tasks = await db
      .select()
      .from(task_queue)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(task_queue.created_at))
      .limit(limit);

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
