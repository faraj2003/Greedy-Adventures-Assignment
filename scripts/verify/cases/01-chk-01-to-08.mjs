// Cases CHK-01..CHK-08 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { det } = ctx;
  const { postChat, check, types, expectDevControls } = h;

  let r = await postChat(
    "What is included in the package?"
  );

  check(
    "CHK-01",
    "Package comparison mentions ECO, DELUXE and VIP with prices",
    r.response.ok &&
      /ECO/.test(r.body.text) &&
      /DELUXE/.test(r.body.text) &&
      /VIP/.test(r.body.text) &&
      /9,500/.test(r.body.text) &&
      /14,000/.test(r.body.text)
  );

  r = await postChat("Can you send me a brochure?");

  check(
    "CHK-02",
    "PDF request returns exactly one PDF asset",
    r.response.ok &&
      types(r.body) === "pdf" &&
      r.body.media[0].url.endsWith(".pdf"),
    types(r.body)
  );

  r = await postChat(
    "Can I see a video of the experience?"
  );

  check(
    "CHK-03",
    "Video request returns a real playable MP4 asset",
    r.response.ok &&
      types(r.body) === "video" &&
      r.body.media[0].url.endsWith(".mp4") &&
      Boolean(r.body.media[0].poster),
    types(r.body)
  );

  r = await postChat(
    "Send me the brochure and a video."
  );

  check(
    "CHK-04",
    "Combined request returns BOTH the PDF and the MP4",
    r.response.ok &&
      types(r.body) === "pdf,video",
    types(r.body)
  );

  r = await postChat(
    "Does it include a cameraman?",
    {
      history: [
        {
          role: "user",
          content: "I'm considering the VIP package.",
        },
      ],
    }
  );

  check(
    "CHK-05",
    "Follow-up without a package name resolves to VIP from history",
    r.response.ok &&
      r.body.trace.memoryContext.includes("VIP") &&
      (
        !det ||
        (
          /cameraman/i.test(r.body.text) &&
          /VIP/.test(r.body.text)
        )
      )
  );

  r = await postChat(
    "Can you send me the scuba diving price PDF?"
  );

  check(
    "CHK-06",
    "Unavailable activity is refused with no media and no invented price",
    r.response.ok &&
      r.body.trace.status === "UNAVAILABLE_INFO_REFUSAL" &&
      r.body.media.length === 0 &&
      !/฿\s?\d/.test(r.body.text)
  );

  r = await postChat(
    "Simulated model failure check",
    {
      simulateError: true,
    }
  );

  const simulatedStopped =
    r.response.status === 503 &&
    r.body.isError === true &&
    /simulated service error/i.test(r.body.text) &&
    r.body.trace?.status === "MODEL_ERROR" &&
    r.body.trace.modelCallStarted === false &&
    r.body.trace.providerRequest === "not_sent";

  if (expectDevControls) {
    check(
      "CHK-07",
      "Developer controls ON: simulated failure returns 503 and a trace without a model call",
      simulatedStopped
    );
  } else {
    check(
      "CHK-07",
      "Developer controls fail closed outside explicit non-production opt-in",
      r.response.status === 200 &&
        r.body.isError === false &&
        r.body.trace?.status !== "MODEL_ERROR" &&
        !/simulated service error/i.test(
          r.body.text ?? ""
        ),
      `status=${r.response.status}`
    );
  }

  r = await postChat(
    "Does Deluxe include video?"
  );

  check(
    "CHK-08",
    "Package question mentioning video does not trigger media delivery",
    r.response.ok &&
      r.body.media.length === 0 &&
      (!det || /handycam/i.test(r.body.text))
  );
}
