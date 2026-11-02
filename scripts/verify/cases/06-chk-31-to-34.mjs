// Cases CHK-31..CHK-34 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { live } = ctx;
  const { postChat, check, skip, types } = h;

  let r;

  r = await postChat(
    "Do you offer any discounts?"
  );

  const refusal = r.body.trace;

  r = await postChat(
    "What is included in the package?"
  );

  const normal = r.body.trace;

  const refusalOk =
    refusal.status === "UNAVAILABLE_INFO_REFUSAL" &&
    refusal.modelCallStarted === false &&
    refusal.providerRequest === "not_sent" &&
    refusal.providerResponseStatus === undefined &&
    /guardrail/i.test(
      refusal.modelSkipReason ?? ""
    );

  const normalOk = live
    ? normal.modelCallStarted === true &&
      normal.providerRequest === "confirmed" &&
      Number.isInteger(
        normal.providerResponseStatus
      ) &&
      normal.providerResponseStatus === 200 &&
      normal.modelSkipReason === undefined
    : normal.modelCallStarted === false &&
      normal.providerRequest === "not_sent" &&
      /OPENROUTER_API_KEY/.test(
        normal.modelSkipReason ?? ""
      );

  check(
    "CHK-31",
    "Trace precision: guardrail refusals make no model call; normal questions record the correct provider status",
    refusalOk && normalOk,
    `refusal=${refusal.modelCallStarted}/${refusal.providerRequest}, normal=${normal.modelCallStarted}/${normal.providerRequest}/${normal.providerResponseStatus}`
  );

  const failureKinds = [
    ["auth", "provider authentication"],
    ["rate_limit", "provider rate limit"],
    ["timeout", "timeout"],
    ["server", "provider server error"],
  ];

  const failureResults = [];

  let injectionAvailable = true;

  for (const [kind, category] of failureKinds) {
    r = await postChat(
      "What is included in the package?",
      {
        simulateProviderFailure: kind,
      }
    );

    if (r.response.ok) {
      injectionAvailable = false;
      break;
    }

    const raw = JSON.stringify(r.body);

    failureResults.push({
      kind,
      ok:
        r.response.status === 503 &&
        r.body.isError === true &&
        r.body.trace.status === "MODEL_ERROR" &&
        r.body.trace.modelRequestAttempted === true &&
        r.body.trace.modelCallStarted === false &&
        r.body.trace.providerRequest === "not_sent" &&
        r.body.trace.failureInjected === true &&
        /simulated/i.test(
          r.body.trace.modelSkipReason ?? ""
        ) &&
        /simulated/i.test(
          r.body.trace.routerReason
        ) &&
        r.body.trace.routerReason.includes(category) &&
        r.body.text ===
          "The AI concierge is temporarily unavailable. Please try again shortly." &&
        !/sk-TESTLEAK|Incorrect API key|api\.openai\.com/.test(
          raw
        ),
    });
  }

  if (!injectionAvailable) {
    skip(
      "CHK-32",
      "Injected provider failures return a safe public error",
      "Failure injection is disabled on this target"
    );
  } else {
    check(
      "CHK-32",
      "Injected provider failures return safe 503 responses without leaking secrets",
      failureResults.length === 4 &&
        failureResults.every((result) => result.ok),
      failureResults
        .filter((result) => !result.ok)
        .map((result) => result.kind)
        .join(", ")
    );
  }

  r = await postChat(
    "Send me the brochure and a video.",
    {
      simulateMissingMedia: ["pdf"],
    }
  );

  if (types(r.body) === "pdf,video") {
    skip(
      "CHK-33",
      "Missing PDF with available video delivers the video",
      "Failure injection is disabled on this target"
    );
  } else {
    check(
      "CHK-33",
      "Missing PDF + available video delivers video and reports missing PDF",
      r.response.ok &&
        types(r.body) === "video" &&
        r.body.trace.missingMedia.some(
          (url) => url.endsWith(".pdf")
        ) &&
        /couldn't attach the brochure/.test(
          r.body.text
        ) &&
        /preview video/.test(r.body.text),
      `${types(r.body)} | ${r.body.text}`
    );
  }

  r = await postChat(
    "Send me the brochure and a video.",
    {
      simulateMissingMedia: ["video"],
    }
  );

  if (types(r.body) === "pdf,video") {
    skip(
      "CHK-34",
      "Missing video with available PDF delivers the PDF",
      "Failure injection is disabled on this target"
    );
  } else {
    check(
      "CHK-34",
      "Missing video + available PDF delivers PDF and reports missing video",
      r.response.ok &&
        types(r.body) === "pdf" &&
        r.body.trace.missingMedia.some(
          (url) => url.endsWith(".mp4")
        ) &&
        /couldn't attach the video/.test(
          r.body.text
        ) &&
        /brochure \(PDF\)/.test(r.body.text),
      `${types(r.body)} | ${r.body.text}`
    );
  }
}
