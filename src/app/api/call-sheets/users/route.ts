import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

const API_KEY = process.env.API_KEY ?? "corgi-enrichment-2026";

type UserRow = { id: string; name: string; role: string; active: boolean; created_at: string };

export async function GET() {
  try {
    const db = getDb();
    const result = await db.execute(
      sql`SELECT id, name, role, active, created_at FROM call_sheet_users ORDER BY role DESC, name ASC`
    );
    const users = Array.from(result) as unknown as UserRow[];
    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/call-sheets/users error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, role = "caller" } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!["admin", "caller"].includes(role)) {
      return NextResponse.json({ error: "role must be admin or caller" }, { status: 400 });
    }

    const db = getDb();
    const result = await db.execute(
      sql`INSERT INTO call_sheet_users (name, role) VALUES (${name}, ${role}) RETURNING id, name, role, active, created_at`
    );
    const rows = Array.from(result) as unknown as UserRow[];

    return NextResponse.json({ user: rows[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/call-sheets/users error:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
