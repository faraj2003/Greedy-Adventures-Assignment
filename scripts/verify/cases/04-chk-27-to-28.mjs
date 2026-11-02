// Cases CHK-27..CHK-28 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { det } = ctx;
  const { postChat, check, types } = h;

  let r;

  const durationQs = [
    "How long is the freefall?",
    "What's the freefall duration?",
    "How many hours should I plan for?",
    "What is the jump altitude?",
    "How long is the experience?",
  ];

  const durationResults = [];

  for (const q of durationQs) {
    r = await postChat(q);

    const top =
      r.body.trace?.retrievedSources?.[0]?.sourceId;

    durationResults.push({
      q,
      ok:
        top === "src-sea-view-main" &&
        (
          !det ||
          (
            r.body.trace.status === "GROUNDED_OK" &&
            /13,000|60 seconds|3 hours/.test(
              r.body.text
            )
          )
        ),
      top,
    });
  }

  const hoursResults = [];

  for (const q of [
    "What are your opening hours?",
    "How long are you open?",
    "Are you open on Sunday?",
  ]) {
    r = await postChat(q);

    hoursResults.push({
      q,
      ok:
        r.body.trace?.retrievedSources?.[0]?.sourceId ===
          "src-pattaya-dropzone" &&
        (
          !det ||
          (
            r.body.trace.status ===
              "UNAVAILABLE_INFO_REFUSAL" &&
            !/\d{1,2}:\d{2}|\d\s?(am|pm)/i.test(
              r.body.text
            ) &&
            !/freefall/i.test(r.body.text)
          )
        ),
    });
  }

  check(
    "CHK-27",
    "Duration/altitude questions retrieve timing sources; opening-hours questions never get invented times",
    [...durationResults, ...hoursResults].every(
      (result) => result.ok
    ),
    [...durationResults, ...hoursResults]
      .filter((result) => !result.ok)
      .map((result) => result.q)
      .join(" | ")
  );

  const mediaCases = [
    ["I want to know whether VIP has a video.", ""],
    ["Does VIP have a video?", ""],
    ["Does Deluxe offer photos?", ""],
    ["I want to see the video.", "video"],
    ["Please send me the video.", "video"],
    ["Do you have a video I could see?", "video"],
  ];

  const mediaResults = [];

  for (const [q, expected] of mediaCases) {
    r = await postChat(q);

    mediaResults.push({
      q,
      ok:
        r.response.ok &&
        types(r.body) === expected,
      got: types(r.body),
    });
  }

  r = await postChat(
    "I want to know whether VIP has a video."
  );

  check(
    "CHK-28",
    "Package-content questions return text only; real media requests return media",
    mediaResults.every((result) => result.ok) &&
      (!det || /cameraman/i.test(r.body.text)),
    mediaResults
      .filter((result) => !result.ok)
      .map(
        (result) =>
          `${result.q} -> "${result.got}"`
      )
      .join(" | ")
  );
}
