// Cases CHK-37..CHK-37 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { det } = ctx;
  const { postChat, check, carry } = h;

  let r;

  const kindOf = (body) =>
    /Carryover package: \w+ \((\w+)\)/.exec(
      body.trace?.memoryContext ?? ""
    )?.[1] ?? "none";

  const kindCases = [
    ["I'm considering VIP.", "VIP", "reference"],
    ["Tell me about Eco.", "ECO", "reference"],
    ["I prefer ECO.", "ECO", "preference"],
    ["I'll go with DELUXE.", "DELUXE", "selection"],
  ];

  const kindResults = [];

  for (const [msg, pkg, kind] of kindCases) {
    r = await postChat(
      "Does it include video?",
      {
        history: [
          {
            role: "user",
            content: msg,
          },
        ],
      }
    );

    kindResults.push({
      msg,
      ok:
        carry(r.body) === pkg &&
        kindOf(r.body) === kind,
      got: `${carry(r.body)}/${kindOf(r.body)}`,
    });
  }

  r = await postChat("Is VIP better?");

  const evaluative =
    r.response.ok &&
    carry(r.body) === "none" &&
    (
      !det ||
      (
        /ECO/.test(r.body.text) &&
        /DELUXE/.test(r.body.text) &&
        /VIP/.test(r.body.text)
      )
    );

  check(
    "CHK-37",
    "Package mentions are classified and comparisons are not treated as choices",
    kindResults.every((result) => result.ok) &&
      evaluative,
    kindResults
      .filter((result) => !result.ok)
      .map(
        (result) =>
          `${result.msg} -> ${result.got}`
      )
      .join(" | ")
  );
}
