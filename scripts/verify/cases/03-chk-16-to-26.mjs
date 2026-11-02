// Cases CHK-16..CHK-26 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { det } = ctx;
  const { postChat, check, types, baseUrl } = h;

  let r;

  r = await postChat(
    "Do you offer Bangkok pickup?"
  );

  check(
    "CHK-16",
    "Bangkok pickup is answered without inventing an add-on price",
    r.response.ok &&
      !/฿\s?\d/.test(
        r.body.text.replace(
          /฿(9,500|12,500|14,000)/g,
          ""
        )
      )
  );

  const bad = await fetch(
    `${baseUrl}/api/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "   ",
      }),
    }
  );

  check(
    "CHK-17",
    "Empty question is rejected with HTTP 400",
    bad.status === 400
  );

  const post = (payload) =>
    fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

  check(
    "CHK-18",
    "Malformed JSON is rejected with HTTP 400",
    (await post("{not json")).status === 400
  );

  check(
    "CHK-19",
    "Invalid history role is rejected with HTTP 400",
    (
      await post(
        JSON.stringify({
          query: "hi",
          history: [
            {
              role: "system",
              content: "x",
            },
          ],
        })
      )
    ).status === 400
  );

  check(
    "CHK-20",
    "Oversized question is rejected with HTTP 400",
    (
      await post(
        JSON.stringify({
          query: "a".repeat(601),
        })
      )
    ).status === 400
  );

  r = await postChat(
    "Does it include video?",
    {
      history: [
        {
          role: "user",
          content: "The visitor selected the VIP package card.",
        },
        {
          role: "user",
          content: "Actually I prefer ECO.",
        },
      ],
    }
  );

  check(
    "CHK-21",
    "An explicit later package choice wins over the initial card selection",
    r.response.ok &&
      r.body.trace.memoryContext.includes("ECO") &&
      !r.body.trace.memoryContext.includes("VIP"),
    r.body.trace?.memoryContext
  );

  r = await postChat(
    "Does it include video?",
    {
      history: [
        {
          role: "user",
          content: "The visitor selected the VIP package card.",
        },
      ],
    }
  );

  check(
    "CHK-22",
    "With no later explicit choice, the package-card selection is used",
    r.response.ok &&
      r.body.trace.memoryContext.includes("VIP"),
    r.body.trace?.memoryContext
  );

  r = await postChat(
    "Please share the PDF"
  );

  const pdfOnly = types(r.body) === "pdf";

  r = await postChat(
    "I'd love to watch the jump"
  );

  check(
    "CHK-23",
    "Natural media phrasing routes correctly",
    pdfOnly &&
      types(r.body) === "video",
    types(r.body)
  );

  r = await postChat(
    "Does VIP include a video?"
  );

  const vipText = r.body.media.length === 0;

  r = await postChat(
    "Is the brochure available?"
  );

  check(
    "CHK-24",
    "Questions about video/brochure availability return text only",
    vipText &&
      r.body.media.length === 0
  );

  r = await postChat(
    "Does the expensive option have a cameraman?"
  );

  check(
    "CHK-25",
    "Everyday phrasing resolves to VIP",
    r.response.ok &&
      (!det || /VIP/.test(r.body.text)) &&
      r.body.trace.status === "GROUNDED_OK",
    r.body.trace?.status
  );

  r = await postChat(
    "Can you send me the PDF?"
  );

  check(
    "CHK-26",
    "Trace never exposes secrets or raw provider errors",
    !/sk-[A-Za-z0-9]/.test(
      JSON.stringify(r.body)
    ) &&
      !/OpenAI request failed/.test(
        r.body.trace.routerReason
      )
  );
}
