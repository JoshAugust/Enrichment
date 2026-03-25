import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { contacts, leads } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

const ContactCreateSchema = z.object({
  lead_id: z.string().uuid(),
  name: z.string().min(1),
  title: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  email_confidence: z.number().min(0).max(1).optional().nullable(),
  email_pattern: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedin_url: z.string().url().optional().nullable(),
  twitter_url: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  tenure: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  verified: z.boolean().optional().nullable(),
});

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const lead_id = searchParams.get("lead_id");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  try {
    const conditions = [];
    if (lead_id) conditions.push(eq(contacts.lead_id, lead_id));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(contacts)
      .where(where)
      .orderBy(desc(contacts.created_at))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ contacts: rows, total: rows.length });
  } catch (error) {
    console.error("GET /api/contacts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = ContactCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify lead exists
    const [lead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.id, parsed.data.lead_id))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const [newContact] = await db.insert(contacts).values(parsed.data).returning();
    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("POST /api/contacts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
