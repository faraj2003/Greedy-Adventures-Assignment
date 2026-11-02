// Cases CHK-40..CHK-41 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {

  const { postChat, check } = h;

  let r;

  const phrasingCases = [
    ["How long am I in the air?", "src-sea-view-main"],
    ["What's the duration of my jump?", "src-sea-view-main"],
    ["How much time do I spend falling?", "src-sea-view-main"],
    ["How high up do we jump from?", "src-sea-view-main"],
    ["What does the cheapest option cover?", "src-sea-view-main"],
    ["Can I get pictures of my jump?", "src-sea-view-main"],
    ["Do the instructors speak English?", "src-pattaya-dropzone"],
    ["Walk me through the day", "src-sea-view-plan"],
  ];

  const phrasingResults = [];

  for (const [q, expected] of phrasingCases) {
    r = await postChat(q);

    const ids = (
      r.body.trace?.retrievedSources ?? []
    ).map((source) => source.sourceId);

    phrasingResults.push({
      q,
      expected,
      got: ids,
      retrievalOk: ids.includes(expected),
      httpStatus: r.response.status,
      responseOk: r.response.ok,
      traceAvailable: Boolean(r.body.trace),
      traceStatus:
        r.body.trace?.status ?? "NO_TRACE",
      error: r.body.error ?? null,
    });
  }

  const irrelevantCases = [
    "Do you sell pizza?",
    "Who won the football match?",
  ];

  const irrelevantResults = [];

  for (const q of irrelevantCases) {
    r = await postChat(q);

    const ids = (
      r.body.trace?.retrievedSources ?? []
    ).map((source) => source.sourceId);

    irrelevantResults.push({
      q,
      got: ids,
      retrievalOk: ids.length === 0,
      httpStatus: r.response.status,
      responseOk: r.response.ok,
      traceAvailable: Boolean(r.body.trace),
      traceStatus:
        r.body.trace?.status ?? "NO_TRACE",
      error: r.body.error ?? null,
    });
  }

  const allRetrievalResults = [
    ...phrasingResults,
    ...irrelevantResults,
  ];

  const retrievalPassed =
    allRetrievalResults.every(
      (result) => result.retrievalOk
    );

  console.log(
    "\nCHK-40 DIAGNOSTICS:",
    JSON.stringify(
      allRetrievalResults,
      null,
      2
    )
  );

  check(
    "CHK-40",
    "Natural phrasings retrieve the right source; off-topic questions retrieve no sources",
    retrievalPassed,
    allRetrievalResults
      .filter((result) => !result.retrievalOk)
      .map(
        (result) =>
          `${result.q} -> expected [${
            result.expected ?? "no sources"
          }], got [${result.got.join(", ")}], HTTP ${
            result.httpStatus
          }, trace ${result.traceStatus}`
      )
      .join(" | ")
  );

  const responseFailures =
    allRetrievalResults.filter(
      (result) => !result.responseOk
    );

  if (responseFailures.length > 0) {
    console.log(
      "\nCHK-40 NOTE: Retrieval checks are independent of provider availability.",
      JSON.stringify(
        responseFailures.map((result) => ({
          question: result.q,
          httpStatus: result.httpStatus,
          traceStatus: result.traceStatus,
          error: result.error,
        })),
        null,
        2
      )
    );
  }

  const unsupported = [
    "What are your opening hours?",
    "What is your rating?",
    "How many reviews do you have?",
  ];

  const unsupportedResults = [];

  for (const q of unsupported) {
    r = await postChat(q);

    unsupportedResults.push({
      q,
      ok:
        r.response.ok &&
        !/4\.9|835|8:00|6:00 ?pm/i.test(
          r.body.text
        ),
    });
  }

  check(
    "CHK-41",
    "Unsupported facts (opening hours, review score) are never stated",
    unsupportedResults.every(
      (result) => result.ok
    ),
    unsupportedResults
      .filter((result) => !result.ok)
      .map((result) => result.q)
      .join(" | ")
  );
}
