import { NextResponse } from "next/server";
import { z } from "zod";
import { KNOWLEDGE_SOURCES } from "@/lib/knowledge";
import { ALL_MEDIA } from "@/lib/media";
import { runGroundedAgent } from "@/lib/agent";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";

export async function GET() {
  return NextResponse.json({
    readOnly: true,
    sources: KNOWLEDGE_SOURCES,
    mediaAssets: ALL_MEDIA,
  });
}

const TestSchema = z.object({ testQuestion: z.string().trim().min(1).max(600) });
export async function POST(req: Request) {
  const limit = checkRateLimit(`knowledge:${clientKey(req)}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: `Too many requests. Please wait ${limit.retryAfterSeconds} seconds.` }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload: malformed JSON." }, { status: 400 });
    }
    const parsed = TestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid test question." }, { status: 400 });
    const result = await runGroundedAgent({ query: parsed.data.testQuestion, history: [] });
    return NextResponse.json({ trace: result.trace, answer: result.text, media: result.media, isError: result.isError }, { status: result.isError ? 503 : 200 });
  } catch {
    return NextResponse.json({ error: "Unable to run the knowledge test." }, { status: 500 });
  }
}
