import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { RequestState } from "./agentTrace";

const MODEL_TIMEOUT_MS = 45_000;
export const MODEL_NAME = process.env.MODEL_NAME || "google/gemma-4-26b-a4b-it:free";

export const isLiveMode = (): boolean => Boolean(process.env.OPENROUTER_API_KEY?.trim());

/**
 * Public URL sent to OpenRouter as the HTTP-Referer attribution header.
 * Set SITE_URL explicitly; on Vercel the production domain is used automatically.
 */
function siteUrl(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Sends one request to the model provider and records delivery progress on `state`. */
export async function requestModelText(input: { system: string; prompt: string }, state: RequestState): Promise<string> {
  const tracedFetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    if (state.providerRequest === "not_sent") state.providerRequest = "dispatched_no_response";
    const response = await fetch(url, init);
    state.providerRequest = "confirmed";
    state.providerResponseStatus = response.status;
    return response;
  }) as typeof fetch;

  // OpenRouter exposes an OpenAI-compatible API, so the OpenAI provider is pointed at it.
  const provider = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    headers: { "HTTP-Referer": siteUrl(), "X-Title": "Greedy Adventures" },
    fetch: tracedFetch,
  });

  state.modelCallStarted = true;
  const result = await generateText({
    model: provider.chat(MODEL_NAME),
    system: input.system,
    prompt: input.prompt,
    temperature: 0.2,
    maxTokens: 800,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
  });
  return typeof result.text === "string" ? result.text.trim() : "";
}
