import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

export const externalBase = process.env.BASE_URL?.replace(/\/$/, "");

export const prodMode =
  !externalBase &&
  (process.env.VERIFY_PROD === "1" || process.argv.includes("--prod"));

const port = Number(process.env.VERIFY_PORT || 3147);
export const baseUrl = externalBase || `http://127.0.0.1:${port}`;

export const expectDevControls = externalBase
  ? process.env.EXPECT_DEV_CONTROLS === "true"
  : !prodMode;

export const localRateLimit = 30;

export let server = null;

if (!externalBase) {
  const nextBin = fileURLToPath(
    new URL("../../node_modules/next/dist/bin/next", import.meta.url)
  );

  const projectDir = fileURLToPath(
    new URL("../..", import.meta.url)
  );

  const env = {
    ...process.env,
    PORT: String(port),
    NEXT_TELEMETRY_DISABLED: "1",
    RATE_LIMIT_PER_MINUTE: prodMode
      ? String(localRateLimit)
      : "1000",
    ENABLE_FAILURE_INJECTION: "true",
    NEXT_PUBLIC_ENABLE_DEV_CONTROLS: "true",
    TRUST_PROXY_HEADERS: "true",
  };

  env.OPENROUTER_API_KEY = "";

  if (prodMode) {
    console.log("Building the production bundle (next build)...");

    const build = spawnSync(
      process.execPath,
      [nextBin, "build"],
      {
        cwd: projectDir,
        env: {
          ...env,
          NODE_ENV: "production",
        },
        stdio: "inherit",
      }
    );

    if (build.status !== 0) {
      console.error("next build failed");
      process.exit(1);
    }
  }

  server = spawn(
    process.execPath,
    [
      nextBin,
      prodMode ? "start" : "dev",
      "-p",
      String(port),
    ],
    {
      cwd: projectDir,
      env: {
        ...env,
        ...(prodMode ? { NODE_ENV: "production" } : {}),
      },
      stdio: "ignore",
    }
  );
}

export async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server && server.exitCode !== null) {
      throw new Error(
        `Next.js exited early (${server.exitCode}).`
      );
    }

    try {
      const response = await fetch(
        `${baseUrl}/api/knowledge`
      );

      if (response.ok) return;
    } catch {}

    await delay(1000);
  }

  throw new Error("Timed out waiting for the server.");
}

let clientCounter = 0;
export const runId = Date.now().toString(36);

export const clientHeaders = () =>
  externalBase
    ? {}
    : {
        "x-forwarded-for": `verify-${runId}-${clientCounter++}`,
      };

export async function fetchWithBackoff(url, init) {
  let response = await fetch(url, init);

  if (response.status === 429 && externalBase) {
    const wait = Math.min(
      Math.max(
        Number(response.headers.get("retry-after")) || 1,
        1
      ),
      60
    );

    await response.body?.cancel();

    await delay((wait + 1) * 1000);

    response = await fetch(url, init);
  }

  return response;
}

export async function postChat(query, extra = {}) {
  const response = await fetchWithBackoff(
    `${baseUrl}/api/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...clientHeaders(),
      },
      body: JSON.stringify({
        query,
        history: [],
        ...extra,
      }),
    }
  );

  return {
    response,
    body: await response.json(),
  };
}

export const results = [];

let failures = 0;
let skipped = 0;

export const counts = () => ({ failures, skipped });

export function check(id, label, condition, detail = "") {
  if (condition) {
    results.push(`${id} PASS — ${label}`);
  } else {
    failures += 1;

    results.push(
      `${id} FAIL — ${label}${
        detail ? ` (${detail})` : ""
      }`
    );
  }
}

export function skip(id, label, reason) {
  skipped += 1;

  results.push(
    `${id} SKIP — ${label} (${reason})`
  );
}

export const carry = (body) =>
  /Carryover package: (\w+)/.exec(
    body.trace?.memoryContext ?? ""
  )?.[1] ?? "none";

export const types = (body) =>
  (body.media ?? [])
    .map((media) => media.type)
    .sort()
    .join(",");
