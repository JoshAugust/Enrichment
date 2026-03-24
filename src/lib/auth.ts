import { NextRequest } from "next/server";

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const validKey = process.env.API_KEY;

  if (!validKey) {
    console.warn("API_KEY environment variable not set");
    return false;
  }

  return apiKey === validKey;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
