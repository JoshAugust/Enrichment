import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { contacts } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { eq } from "drizzle-orm";

const ContactPatchSchema = z.object({
  name: z.string().min(1).optional(),
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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const { id } = await context.params;
  const db = getDb();

  try {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    if (!contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    return NextResponse.json(contact);
  } catch (error) {
    console.error("GET /api/contacts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const { id } = await context.params;
  const db = getDb();

  try {
    const body = await request.json();
    const parsed = ContactPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(contacts)
      .set(parsed.data)
      .where(eq(contacts.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/contacts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const { id } = await context.params;
  const db = getDb();

  try {
    const [deleted] = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning({ id: contacts.id });

    if (!deleted) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("DELETE /api/contacts/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
