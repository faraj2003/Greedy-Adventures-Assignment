import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const live = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  return NextResponse.json({
    status: "ok",
    mode: live ? "live" : "deterministic",
    modeLabel: live ? "LIVE_LLM" : "GROUNDED_DETERMINISTIC_MOCK",
    model: live ? process.env.MODEL_NAME || "google/gemma-4-26b-a4b-it:free" : null,
  }, { headers: { "Cache-Control": "no-store" } });
}
