const base = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

const failures = [];

const fail = (msg) => {
  failures.push(msg);
  console.log(`FAIL  ${msg}`);
};

const pass = (msg) => console.log(`PASS  ${msg}`);

async function getJson(url, options = {}) {
  const response = await fetch(url, options);

  let body;

  try {
    body = await response.json();
  } catch {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  return {
    status: response.status,
    body,
    headers: response.headers,
  };
}

async function ask(query, history = []) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await getJson(`${base}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        history,
      }),
    });

    if (result.status === 429 && attempt === 0) {
      const retryAfter = Number(result.headers.get("retry-after")) || 5;

      console.log(`Rate limited. Retrying in ${retryAfter}s...`);

      await new Promise((resolve) =>
        setTimeout(resolve, retryAfter * 1000 + 500),
      );

      continue;
    }

    return {
      status: result.status,
      body: result.body,
    };
  }

  throw new Error("Request failed after retry.");
}

async function main() {
  console.log("======================================");
  console.log(" GREEDY ADVENTURES - LIVE MODEL CHECK");
  console.log(" Provider: OpenRouter");
  console.log("======================================\n");

  console.log(`Target: ${base}\n`);

  let health;

  try {
    const result = await getJson(`${base}/api/health`);

    if (result.status !== 200) {
      throw new Error(`Health endpoint returned HTTP ${result.status}`);
    }

    health = result.body;
  } catch (error) {
    fail(`Could not reach health endpoint: ${error.message}`);
    process.exit(1);
  }

  console.log(`Configured mode: ${health.modeLabel ?? health.mode}`);

  console.log(`Configured model: ${health.model ?? "none"}\n`);

  if (health.mode !== "live") {
    fail("Live model is inactive. Check OPENROUTER_API_KEY on the server.");

    process.exit(1);
  }

  pass("Backend reports LIVE mode.");

  const cases = [
    {
      q: "What is the difference between Deluxe and VIP?",
      expect: "answer",
    },
    {
      q: "How long am I in the air once I jump?",
      expect: "answer",
    },
    {
      q: "Where is the dropzone and how do I get there from Bangkok?",
      expect: "answer",
      mustInclude: [/95 M\.4/, /pickup/i],
    },
    {
      q: "How much for 3 people on Deluxe?",
      expect: "answer",
      mustInclude: [/37,500/],
    },
    {
      q: "Does the dropzone have a swimming pool?",
      expect: "decline",
    },
  ];

  for (const { q, expect, mustInclude = [] } of cases) {
    console.log("\n--------------------------------------");
    console.log(`QUESTION: ${q}`);

    try {
      const { status, body } = await ask(q);

      const trace = body.trace ?? {};

      console.log(`ANSWER: ${body.text ?? "No answer returned"}`);

      console.log("\nTRACE:");
      console.log(`  Status: ${trace.status ?? "unknown"}`);
      console.log(`  Mode: ${trace.modeLabel ?? "unknown"}`);
      console.log(`  Model: ${trace.modelName ?? "unknown"}`);
      console.log(`  Model call started: ${trace.modelCallStarted}`);
      console.log(`  Provider request: ${trace.providerRequest}`);
      console.log(`  Provider HTTP status: ${trace.providerResponseStatus}`);

      if (status !== 200) {
        fail(`"${q}" returned HTTP ${status}`);
        continue;
      }

      if (trace.modeLabel !== "LIVE_LLM") {
        fail(`"${q}": expected LIVE_LLM mode.`);
      }

      if (trace.modelCallStarted !== true) {
        fail(`"${q}": model call was not started.`);
      }

      if (trace.providerRequest !== "confirmed") {
        fail(`"${q}": provider request was not confirmed.`);
      }

      if (trace.providerResponseStatus !== 200) {
        fail(
          `"${q}": expected provider HTTP 200, received ${trace.providerResponseStatus}.`,
        );
      }

      for (const pattern of mustInclude) {
        if (!pattern.test(body.text ?? "")) fail(`"${q}": answer is missing ${pattern}.`);
      }

      if (expect === "answer") {
        if (trace.status !== "GROUNDED_OK") {
          fail(`"${q}": expected GROUNDED_OK, received ${trace.status}.`);
        } else {
          pass(`"${q}" received a grounded answer.`);
        }
      }

      if (expect === "decline") {
        if (trace.status !== "UNAVAILABLE_INFO_REFUSAL") {
          fail(
            `"${q}": expected UNAVAILABLE_INFO_REFUSAL, received ${trace.status}.`,
          );
        } else {
          pass(`"${q}" correctly declined unsupported information.`);
        }
      }
    } catch (error) {
      fail(`"${q}" failed: ${error.message}`);
    }
  }

  console.log("\n======================================");

  if (failures.length > 0) {
    console.log(`${failures.length} LIVE CHECK(S) FAILED.`);

    for (const failure of failures) {
      console.log(` - ${failure}`);
    }

    console.log("======================================\n");
    process.exit(1);
  }

  console.log("ALL LIVE MODEL CHECKS PASSED!");
  console.log("OpenRouter integration verified.");
  console.log("Grounded answering verified.");
  console.log("Unsupported-question refusal verified.");
  console.log("======================================\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("\nUnexpected verification error:", error);
  process.exit(1);
});
