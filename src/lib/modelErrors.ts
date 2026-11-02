export const EMPTY_RESPONSE_MESSAGE = "The model returned an empty response.";

export const PUBLIC_MODEL_ERROR_TEXT = "The AI concierge is temporarily unavailable. Please try again shortly.";

interface ErrorLike {
  name?: string;
  statusCode?: number;
  message?: string;

  lastError?: unknown;
}

export function classifyModelError(error: unknown, depth = 0): string {
  const e = (error ?? null) as ErrorLike | null;
  if (e?.name === "TimeoutError" || e?.name === "AbortError") return "timeout";

  if (e?.lastError && depth < 3) return classifyModelError(e.lastError, depth + 1);
  if (e?.statusCode === 429) return "provider rate limit";
  if (e?.statusCode === 401 || e?.statusCode === 403) return "provider authentication";
  if (typeof e?.statusCode === "number" && e.statusCode >= 500) return "provider server error";
  if (e?.message === EMPTY_RESPONSE_MESSAGE) return "empty response";
  return "provider error";
}
