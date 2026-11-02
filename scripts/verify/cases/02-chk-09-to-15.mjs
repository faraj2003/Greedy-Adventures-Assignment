// Cases CHK-09..CHK-15 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { det, knowledge } = ctx;
  const { postChat, check, baseUrl } = h;

  let r;

  const ro = await fetch(
    `${baseUrl}/api/knowledge`
  );

  const roBody = await ro.json();

  check(
    "CHK-09",
    "Knowledge endpoint is read-only and does not expose visitor traces",
    ro.ok &&
      roBody.readOnly === true &&
      !("recentTraces" in roBody) &&
      roBody.sources?.length >= 1
  );

  r = await postChat(
    "What is the best time of year to visit?"
  );

  check(
    "CHK-10",
    "Unsupported question about best season is explicitly declined",
    r.response.ok &&
      r.body.trace.status === "UNAVAILABLE_INFO_REFUSAL" &&
      r.body.sources.length === 0 &&
      r.body.media.length === 0,
    r.body.trace?.status
  );

  r = await postChat(
    "Can I bring my dog on the plane?"
  );

  check(
    "CHK-11",
    "Out-of-corpus question is declined",
    r.response.ok &&
      r.body.trace.status === "UNAVAILABLE_INFO_REFUSAL",
    r.body.trace?.status
  );

  r = await postChat(
    "What are the weight limits?"
  );

  check(
    "CHK-12",
    "Weight limit is answered from the knowledge base (100 kg) without inventing other numbers",
    r.response.ok &&
      r.body.trace.status === "GROUNDED_OK" &&
      /100\s?kg/i.test(r.body.text) &&
      !/\b(?!100\b)\d+\s?(kg|lb)/i.test(r.body.text)
  );

  r = await postChat(
    "What is included in the package?"
  );

  const chunk = r.body.trace?.retrievedSources?.[0];

  const original = knowledge.sources.find(
    (source) => source.id === chunk?.sourceId
  );

  check(
    "CHK-13",
    "Trace carries the exact source text passed to the model",
    Boolean(chunk?.passedText) &&
      chunk.passedText === original?.text &&
      r.body.trace.passedContext.includes(
        chunk.passedText
      )
  );

  r = await postChat(
    "Does it include video?",
    {
      history: [
        {
          role: "user",
          content: "Tell me about Eco.",
        },
      ],
    }
  );

  const eco = r.body;

  r = await postChat(
    "Does it include video?",
    {
      history: [
        {
          role: "user",
          content: "I like Deluxe.",
        },
      ],
    }
  );

  check(
    "CHK-14",
    "Follow-up context follows the visitor's latest package choice",
    eco.trace.memoryContext.includes("ECO") &&
      r.body.trace.memoryContext.includes("DELUXE") &&
      (
        !det ||
        (
          /without/i.test(eco.text) &&
          /handycam/i.test(r.body.text)
        )
      )
  );

  const assetChecks = await Promise.all(
    knowledge.mediaAssets
      .filter((media) => media.url.startsWith("/"))
      .map(async (media) => {
        const res = await fetch(
          `${baseUrl}${media.url}`,
          {
            method: "GET",
          }
        );

        const ok =
          res.ok &&
          Number(
            res.headers.get("content-length") ?? 1
          ) > 0;

        await res.body?.cancel();

        return {
          url: media.url,
          ok,
        };
      })
  );

  check(
    "CHK-15",
    "Every bundled media file is actually served",
    assetChecks.length >= 2 &&
      assetChecks.every((asset) => asset.ok),
    assetChecks
      .filter((asset) => !asset.ok)
      .map((asset) => asset.url)
      .join(", ")
  );
}
