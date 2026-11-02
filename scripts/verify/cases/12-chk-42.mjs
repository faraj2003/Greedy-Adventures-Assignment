// Cases CHK-42..CHK-42 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { live } = ctx;
  const { check, fetchWithBackoff, baseUrl } = h;

  const healthRes = await fetchWithBackoff(
    `${baseUrl}/api/health`
  );

  const health = await healthRes.json();

  check(
    "CHK-42",
    "/api/health reports answering mode and never exposes a key",
    healthRes.ok &&
      ["live", "deterministic"].includes(
        health.mode
      ) &&
      !/sk-/.test(JSON.stringify(health)) &&
      (
        live
          ? health.mode === "live"
          : health.mode === "deterministic"
      ),
    JSON.stringify(health)
  );
}
