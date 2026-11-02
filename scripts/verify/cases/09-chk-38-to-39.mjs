// Cases CHK-38..CHK-39 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {

  const { postChat, check, carry, baseUrl, externalBase, runId, localRateLimit } = h;

  let r;

  const histOf = (...msgs) =>
    msgs.map((content) => ({
      role: "user",
      content,
    }));

  const ctxOf = (body) =>
    body.trace?.memoryContext ?? "";

  const questionCases = [
    "Can I book VIP in advance?",
    "Can I upgrade to VIP later?",
    "What if I choose Deluxe?",
    "If I go with VIP, does it include a cameraman?",
  ];

  const questionResults = [];

  for (const q of questionCases) {
    r = await postChat(
      "Does it include video?",
      {
        history: histOf(q),
      }
    );

    questionResults.push({
      q,
      ok:
        /\(reference\)/.test(ctxOf(r.body)) &&
        !/\((selection|preference)\)/.test(
          ctxOf(r.body)
        ),
      got: ctxOf(r.body),
    });
  }

  r = await postChat(
    "Does it include video?",
    {
      history: histOf(
        "I'll go with ECO.",
        "Tell me about VIP."
      ),
    }
  );

  const keepsChoice =
    /Carryover package: VIP \(reference\)/.test(
      ctxOf(r.body)
    ) &&
    /Stated choice still held: ECO \(selection\)/.test(
      ctxOf(r.body)
    );

  r = await postChat(
    "Does it include video?",
    {
      history: histOf(
        "I'll go with VIP.",
        "I don't want VIP."
      ),
    }
  );

  const rejectedDropped =
    carry(r.body) === "none";

  r = await postChat(
    "Does it include video?",
    {
      history: histOf(
        "I'd like to book VIP."
      ),
    }
  );

  const statementStillDecides =
    /Carryover package: VIP \(selection\)/.test(
      ctxOf(r.body)
    );

  check(
    "CHK-38",
    "Package memory handles questions, references, choices and rejections correctly",
    questionResults.every((result) => result.ok) &&
      keepsChoice &&
      rejectedDropped &&
      statementStillDecides,
    [
      ...questionResults
        .filter((result) => !result.ok)
        .map(
          (result) =>
            `${result.q} -> ${result.got}`
        ),
      keepsChoice
        ? ""
        : "mention erased the earlier choice",
      rejectedDropped
        ? ""
        : "rejected package kept",
      statementStillDecides
        ? ""
        : "statement not a selection",
    ]
      .filter(Boolean)
      .join(" | ")
  );

  const concurrentPost = (headers) =>
    fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        query: "What are the weight limits?",
        history: [],
      }),
    });

  const burstClient = `burst-${runId}`;

  const hookLimit = 5;

  let burst = await Promise.all(
    Array.from(
      { length: 12 },
      () =>
        concurrentPost({
          "x-forwarded-for": burstClient,
          "x-test-rate-limit": String(hookLimit),
        })
    )
  );

  let burstLimit = hookLimit;
  let burstTotal = 12;

  if (burst.every((response) => response.status === 200)) {
    burstLimit = externalBase
      ? Number(process.env.EXPECTED_RATE_LIMIT || 20)
      : localRateLimit;

    burstTotal = burstLimit * 3;

    burst = await Promise.all(
      Array.from(
        { length: burstTotal },
        () =>
          concurrentPost({
            "x-forwarded-for": `${burstClient}-prod`,
          })
      )
    );
  }

  const allowedCount = burst.filter(
    (response) => response.status === 200
  ).length;

  const blocked = burst.filter(
    (response) => response.status === 429
  );

  const retryHeaders = blocked.map(
    (response) =>
      Number(response.headers.get("retry-after"))
  );

  const headersOk =
    retryHeaders.length > 0 &&
    retryHeaders.every(
      (value) =>
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 60
    );

  const exact = externalBase
    ? allowedCount >= 1 && blocked.length >= 1
    : allowedCount === burstLimit &&
      blocked.length === burstTotal - burstLimit;

  check(
    "CHK-39",
    `Rate limit under concurrency: ${burstTotal} simultaneous requests`,
    exact &&
      headersOk &&
      allowedCount + blocked.length === burstTotal,
    `allowed=${allowedCount}, 429s=${blocked.length}, other=${
      burstTotal - allowedCount - blocked.length
    }, retry-after=${[
      ...new Set(retryHeaders),
    ].join("/")}`
  );
}
