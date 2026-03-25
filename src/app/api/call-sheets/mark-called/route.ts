import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

const API_KEY = process.env.API_KEY ?? "corgi-enrichment-2026";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { assignmentId, called } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }

    const db = getDb();

    if (called) {
      await db.execute(sql.raw(
        `UPDATE call_sheet_assignments SET called = true, called_at = NOW() WHERE id = '${assignmentId.replace(/'/g, "''")}'`
      ));
    } else {
      await db.execute(sql.raw(
        `UPDATE call_sheet_assignments SET called = false, called_at = NULL WHERE id = '${assignmentId.replace(/'/g, "''")}'`
      ));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/call-sheets/mark-called error:", err);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}
