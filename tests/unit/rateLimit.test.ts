import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, clientKey, parseLimit, resetRateLimitsForTests } from "../../src/lib/rateLimit";

test("parseLimit", async (t) => {
  const cases: [string, string | undefined, number | undefined, number][] = [
    ["undefined -> default 20", undefined, undefined, 20],
    ["empty string -> default", "", undefined, 20],
    ["valid integer", "50", undefined, 50],
    ["1 is the smallest valid limit", "1", undefined, 1],
    ["zero -> default", "0", undefined, 20],
    ["negative -> default", "-5", undefined, 20],
    ["decimal -> default", "2.5", undefined, 20],
    ["non-numeric -> default", "abc", undefined, 20],
    ["Infinity -> default", "Infinity", undefined, 20],
    ["NaN -> default", "NaN", undefined, 20],
    ["custom fallback is used", "oops", 7, 7],
    ["whitespace-padded number", " 12 ", undefined, 12],
  ];
  for (const [name, raw, fallback, expected] of cases) {
    await t.test(name, () => assert.equal(fallback === undefined ? parseLimit(raw) : parseLimit(raw, fallback), expected));
  }
});

test("checkRateLimit window and isolation", () => {
  resetRateLimitsForTests();
  const t0 = 1_000_000;
  assert.equal(checkRateLimit("a", t0, 2).allowed, true);
  assert.equal(checkRateLimit("a", t0, 2).allowed, true);
  const blocked = checkRateLimit("a", t0 + 1000, 2);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 59);
  assert.equal(checkRateLimit("b", t0, 2).allowed, true, "other clients are unaffected");
  assert.equal(checkRateLimit("a", t0 + 60_000, 2).allowed, true, "window resets");
  resetRateLimitsForTests();
});

test("clientKey falls back to 'local' without trusted headers", () => {
  const req = new Request("http://x/", { headers: { "x-forwarded-for": "1.2.3.4" } });
  const prev = process.env.TRUST_PROXY_HEADERS;
  delete process.env.TRUST_PROXY_HEADERS;
  assert.equal(clientKey(req), "local");
  process.env.TRUST_PROXY_HEADERS = "true";
  assert.equal(clientKey(req), "1.2.3.4");
  if (prev === undefined) delete process.env.TRUST_PROXY_HEADERS; else process.env.TRUST_PROXY_HEADERS = prev;
});
