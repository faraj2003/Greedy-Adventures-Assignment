import { NextResponse } from "next/server";
import { z } from "zod";
import { runGroundedAgent } from "@/lib/agent";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";
import { devControlsEnabled } from "@/lib/devControls";
import { failureInjectionEnabled, testRateLimitOverride } from "@/lib/testHooks";

const ChatRequestSchema = z.object({
  query: z.string().trim().min(1, "Please enter a question.").max(600),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(4000),
  })).max(20).default([]),
  simulateError: z.boolean().optional().default(false),

  simulateProviderFailure: z.enum(["auth", "rate_limit", "timeout", "server"]).optional(),
  simulateMissingMedia: z.array(z.enum(["pdf", "video"])).max(2).optional(),
});

export async function POST(req: Request) {
  const limit = checkRateLimit(`chat:${clientKey(req)}`, Date.now(), testRateLimitOverride(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${limit.retryAfterSeconds} seconds and try again.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload: malformed JSON." }, { status: 400 });
    }
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { simulateProviderFailure, simulateMissingMedia, ...chat } = parsed.data;
    const injection = failureInjectionEnabled() ? { providerFailure: simulateProviderFailure, missingMedia: simulateMissingMedia } : {};

    const result = await runGroundedAgent({ ...chat, simulateError: devControlsEnabled() && chat.simulateError, injection });
    return NextResponse.json(result, { status: result.isError ? 503 : 200 });
  } catch {
    return NextResponse.json({ error: "Unable to process this request right now. Please try again." }, { status: 500 });
  }
}
