// Cases CHK-29..CHK-30 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { det } = ctx;
  const { postChat, check, carry } = h;

  let r;

  const prefCases = [
    [
      [
        "I'm considering VIP.",
        "I'm not interested in VIP; I'd rather choose ECO.",
      ],
      "ECO",
    ],
    [
      [
        "I'm considering VIP.",
        "Not VIP, I prefer ECO.",
      ],
      "ECO",
    ],
    [
      [
        "I'm considering VIP.",
        "I'll go with ECO.",
      ],
      "ECO",
    ],
    [
      [
        "I like Deluxe.",
        "Switch me from Deluxe to ECO.",
      ],
      "ECO",
    ],
    [
      [
        "I'm considering VIP.",
        "I've changed my mind; DELUXE instead.",
      ],
      "DELUXE",
    ],
    [
      [
        "I'm considering ECO.",
        "I prefer VIP over ECO.",
      ],
      "VIP",
    ],
  ];

  const prefResults = [];

  for (const [msgs, expected] of prefCases) {
    r = await postChat(
      "Does it include video?",
      {
        history: msgs.map((content) => ({
          role: "user",
          content,
        })),
      }
    );

    prefResults.push({
      msg: msgs[msgs.length - 1],
      ok: carry(r.body) === expected,
      got: carry(r.body),
    });
  }

  check(
    "CHK-29",
    "Explicit preference phrases update the selected package",
    prefResults.every((result) => result.ok),
    prefResults
      .filter((result) => !result.ok)
      .map(
        (result) =>
          `${result.msg} -> ${result.got}`
      )
      .join(" | ")
  );

  const keepCases = [
    [
      [
        "I like Deluxe.",
        "What's the difference between ECO and VIP?",
      ],
      "DELUXE",
    ],
    [
      [
        "I'm considering VIP.",
        "Is ECO or DELUXE better?",
      ],
      "VIP",
    ],
    [
      [
        "I like Deluxe.",
        "Compare ECO and VIP please.",
      ],
      "DELUXE",
    ],
    [
      [
        "I like Deluxe.",
        "Is VIP better?",
      ],
      "DELUXE",
    ],
    [
      [
        "I'm considering ECO.",
        "I don't want VIP.",
      ],
      "ECO",
    ],
  ];

  const keepResults = [];

  for (const [msgs, expected] of keepCases) {
    r = await postChat(
      "Does it include video?",
      {
        history: msgs.map((content) => ({
          role: "user",
          content,
        })),
      }
    );

    keepResults.push({
      msg: msgs[msgs.length - 1],
      ok: carry(r.body) === expected,
      got: carry(r.body),
    });
  }

  r = await postChat(
    "What's the difference between ECO and VIP?"
  );

  const compareOk =
    !det ||
    (
      /ECO/.test(r.body.text) &&
      /VIP/.test(r.body.text) &&
      !/DELUXE/.test(r.body.text)
    );

  check(
    "CHK-30",
    "Package comparisons and rejections do not change the selected package",
    keepResults.every((result) => result.ok) &&
      compareOk,
    keepResults
      .filter((result) => !result.ok)
      .map(
        (result) =>
          `${result.msg} -> ${result.got}`
      )
      .join(" | ")
  );
}
