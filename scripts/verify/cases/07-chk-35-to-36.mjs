// Cases CHK-35..CHK-36 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { det } = ctx;
  const { postChat, check, skip, baseUrl } = h;

  let r;

  const travelQs = [
    "How long does it take to get there?",
    "How long does it take to reach Pattaya?",
    "How long is the drive to the dropzone?",
  ];

  const travelResults = [];

  for (const q of travelQs) {
    r = await postChat(q);

    travelResults.push({
      q,
      ok:
        r.response.ok &&
        (
          !det ||
          (
            r.body.trace.status ===
              "UNAVAILABLE_INFO_REFUSAL" &&
            !/13,000|60 seconds|freefall|3 hours/i.test(
              r.body.text
            )
          )
        ),
    });
  }

  const timingQs = [
    "How long does the experience take?",
    "How many hours should I plan for?",
    "How long is the freefall?",
    "What's the height of the jump?",
    "What is the height of the exit?",
    "From what height do we jump?",
  ];

  const timingResults = [];

  for (const q of timingQs) {
    r = await postChat(q);

    timingResults.push({
      q,
      ok:
        r.response.ok &&
        r.body.trace?.retrievedSources?.[0]?.sourceId ===
          "src-sea-view-main" &&
        (
          !det ||
          (
            r.body.trace.status === "GROUNDED_OK" &&
            /13,000|60 seconds|3 hours/.test(
              r.body.text
            )
          )
        ),
    });
  }

  check(
    "CHK-35",
    "Travel-time questions are not answered with jump timings; jump-duration and height phrasings still work",
    [...travelResults, ...timingResults].every(
      (result) => result.ok
    ),
    [...travelResults, ...timingResults]
      .filter((result) => !result.ok)
      .map((result) => result.q)
      .join(" | ")
  );

  const rlClient =
    `rate-limit-test-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

  const rlPost = (client) =>
    fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": client,
        "x-test-rate-limit": "3",
      },
      body: JSON.stringify({
        query: "What are the weight limits?",
        history: [],
      }),
    });

  const rlResponses = [];

  for (let i = 0; i < 4; i++) {
    rlResponses.push(await rlPost(rlClient));
  }

  const rlBlocked = rlResponses[3];

  if (
    rlBlocked.status !== 429 &&
    rlResponses.every((response) => response.ok)
  ) {
    skip(
      "CHK-36",
      "Rate limit returns 429 with Retry-After",
      "The low test limit hook is disabled on this target"
    );
  } else {
    const retryAfter = Number(
      rlBlocked.headers.get("retry-after")
    );

    const rlBody = await rlBlocked
      .json()
      .catch(() => ({}));

    const otherClient = await rlPost(
      `${rlClient}-other`
    );

    check(
      "CHK-36",
      "Rate limit: requests within limit succeed, next gets 429, other clients unaffected",
      rlResponses
        .slice(0, 3)
        .every((response) => response.status === 200) &&
        rlBlocked.status === 429 &&
        Number.isInteger(retryAfter) &&
        retryAfter >= 1 &&
        retryAfter <= 60 &&
        typeof rlBody.error === "string" &&
        otherClient.status === 200,
      `statuses=${rlResponses
        .map((response) => response.status)
        .join(",")}, retry-after=${rlBlocked.headers.get(
        "retry-after"
      )}, other client=${otherClient.status}`
    );
  }
}
