import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { enrichBatch } from "@/enrichment/pipeline";

const BatchSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  maxCount: z.number().int().min(1).max(20).optional(),
  force: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  try {
    const body = await request.json();
    const parsed = BatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { leadIds, maxCount = 20, force = false } = parsed.data;
    const capped = leadIds.slice(0, maxCount);

    const result = await enrichBatch(capped, { force });
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/enrichment/batch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
