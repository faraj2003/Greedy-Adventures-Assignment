// End-to-end verification entry point. The check cases live in scripts/verify/cases/*.mjs
// (run in filename order); shared server/HTTP/assert helpers live in scripts/verify/harness.mjs.
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as h from "./verify/harness.mjs";

const casesDir = fileURLToPath(new URL("./verify/cases/", import.meta.url));

try {
  await h.waitForServer();

  const knowledge = await (await fetch(`${h.baseUrl}/api/knowledge`)).json();
  const live = (await h.postChat("What is included in the package?")).body.trace?.modeLabel === "LIVE_LLM";
  const ctx = { live, det: !live, knowledge };

  console.log(`Mode under test: ${live ? "LIVE_LLM" : "GROUNDED_DETERMINISTIC_MOCK"} @ ${h.baseUrl}\n`);

  const files = readdirSync(casesDir).filter((f) => f.endsWith(".mjs")).sort();
  for (const file of files) {
    const mod = await import(pathToFileURL(casesDir + file).href);
    await mod.default(ctx);
  }

  console.log("\nGREEDY ADVENTURES — END-TO-END VERIFICATION");
  console.log("============================================");
  console.log(h.results.sort().join("\n"));

  const { failures, skipped } = h.counts();
  const total = h.results.length;
  console.log(`\n${total - failures - skipped}/${total - skipped} checks passed${skipped ? `, ${skipped} skipped` : ""}.`);
  if (failures) process.exitCode = 1;
} catch (error) {
  console.error("VERIFICATION FAILED:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  h.server?.kill("SIGTERM");
}
