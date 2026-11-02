/**
 * NOTE: counters live in this process's memory. On serverless platforms every instance has its own map and a cold
 * start resets it, so the effective limit is approximate (up to limit x instances). For a strict global limit
 * replace `hits` with a shared store such as Upstash Redis or Vercel KV.
 */
const WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;
const MAX_TRACKED_CLIENTS = 5000;

export function parseLimit(raw: string | undefined, fallback = DEFAULT_MAX_REQUESTS): number {
  const value = Number(raw);
  return Number.isFinite(value) && Number.isInteger(value) && value > 0 ? value : fallback;
}

const MAX_REQUESTS = parseLimit(process.env.RATE_LIMIT_PER_MINUTE);

interface Entry { count: number; resetAt: number }
const globalStore = globalThis as typeof globalThis & { __greedyRateLimitHits?: Map<string, Entry> };
const hits: Map<string, Entry> = (globalStore.__greedyRateLimitHits ??= new Map());

export function clientKey(req: Request): string {
  const platformIp = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim();
  if (platformIp) return platformIp;
  const forwarded = req.headers.get("x-forwarded-for");
  const trustForwarded = process.env.TRUST_PROXY_HEADERS === "true" ||
    (process.env.ENABLE_FAILURE_INJECTION === "true" && process.env.NODE_ENV !== "production");
  if (forwarded && trustForwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return "local";
}

export function checkRateLimit(key: string, now = Date.now(), maxRequests = MAX_REQUESTS): { allowed: boolean; retryAfterSeconds: number } {
  if (hits.size >= MAX_TRACKED_CLIENTS) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);

    while (hits.size >= MAX_TRACKED_CLIENTS) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  }
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  entry.count += 1;
  if (entry.count > maxRequests) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimitsForTests(): void {
  hits.clear();
}
