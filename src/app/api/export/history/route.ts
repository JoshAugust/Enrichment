import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { exports } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const history = await db
      .select()
      .from(exports)
      .orderBy(desc(exports.created_at))
      .limit(50);

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET /api/export/history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
