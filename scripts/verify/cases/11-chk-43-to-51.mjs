// Cases CHK-43..CHK-51 (split out of the former 1,800-line verify-agent.mjs)
import * as h from "../harness.mjs";

export default async function run(ctx) {
  const { live } = ctx;
  const { postChat, check, skip, types } = h;

  // ---- CHK-43 to CHK-51: working-behaviour fixes (deterministic wording; skipped against a live model) ----
  const wording = (id, label, fn) =>
    live ? skip(id, label, "wording-dependent; deterministic mode only") : fn();
  const turn = async (query, history = []) => (await postChat(query, { history })).body;
  const asHistory = (...pairs) => pairs.flatMap(([u, a]) => [{ role: "user", content: u }, { role: "assistant", content: a }]);

  await wording("CHK-43", "Weight above the limit is answered from the knowledge base, not refused", async () => {
    const over = await turn("I weigh 120kg, can I jump?");
    const under = await turn("I weigh 80kg, can I jump?");
    check(
      "CHK-43",
      "Weight above the limit is answered from the knowledge base, not refused",
      over.trace?.status === "GROUNDED_OK" && /100\s?kg/.test(over.text) && /over/i.test(over.text) &&
        under.trace?.status === "GROUNDED_OK" && /within/i.test(under.text),
      `${over.text} || ${under.text}`
    );
  });

  await wording("CHK-44", "Thanks / goodbye do not repeat the greeting", async () => {
    const outs = [];
    for (const q of ["thanks!", "thank you so much", "ok great, thanks", "bye"]) outs.push(await turn(q));
    const hi = await turn("hi");
    check(
      "CHK-44",
      "Thanks / goodbye do not repeat the greeting",
      outs.every((o) => !/^Hello!/i.test(o.text) && o.text.length < 140) && /^Hello!/.test(hi.text),
      outs.map((o) => o.text).join(" | ")
    );
  });

  await wording("CHK-45", "Follow-up 'and for my wife too?' keeps the package and doubles the total", async () => {
    const first = await turn("How much is Eco for me?");
    const next = await turn("and for my wife too?", asHistory(["How much is Eco for me?", first.text]));
    check(
      "CHK-45",
      "Follow-up 'and for my wife too?' keeps the package and doubles the total",
      next.trace?.status === "GROUNDED_OK" && /19,000/.test(next.text) && /ECO/.test(next.text),
      next.text
    );
    const third = await turn("what about for 3 people?", asHistory(["How much is VIP?", "VIP is ฿14,000 per person."]));
    check("CHK-45b", "'what about for 3 people?' after a package question gives a total", /42,000/.test(third.text), third.text);
  });

  await wording("CHK-46", "'Can you book it for me?' says plainly that the concierge cannot take bookings", async () => {
    const outs = [await turn("Can you book it for me?"), await turn("I want to book VIP"), await turn("how do I book?")];
    check(
      "CHK-46",
      "'Can you book it for me?' says plainly that the concierge cannot take bookings",
      /can't book/i.test(outs[0].text) && /can't book/i.test(outs[1].text) && !/can't book/i.test(outs[2].text),
      outs.map((o) => o.text.slice(0, 80)).join(" | ")
    );
  });

  await wording("CHK-47", "Unanswered-question reply does not quote the visitor's words", async () => {
    const q = "Tell me about the zorb ride?";
    const out = await turn(q);
    check(
      "CHK-47",
      "Unanswered-question reply does not quote the visitor's words",
      out.trace?.status === "UNAVAILABLE_INFO_REFUSAL" && !/zorb/i.test(out.text) && !/[“”]/.test(out.text) && /guess/i.test(out.text),
      out.text
    );
  });

  await wording("CHK-48", "'send brochure and video of VIP' sends both files without a price answer", async () => {
    const out = await turn("send brochure and video of VIP");
    check(
      "CHK-48",
      "'send brochure and video of VIP' sends both files without a price answer",
      types(out) === "pdf,video" && !/^Yes/i.test(out.text) && !/฿/.test(out.text),
      out.text
    );
    const mixed = await turn("send the video and how much is VIP?");
    check("CHK-48b", "A real question next to a file request is still answered, without a stray 'Yes.'", types(mixed) === "video" && /14,000/.test(mixed.text) && !/^Yes/i.test(mixed.text), mixed.text);
  });

  await wording("CHK-49", "Typos are tolerated and Thai gets a clear English-only message", async () => {
    const typo = await turn("what is the pric");
    const typo2 = await turn("whats the pirce of deluxe");
    const thai = await turn("ราคาเท่าไหร่");
    check(
      "CHK-49",
      "Typos are tolerated and Thai gets a clear English-only message",
      typo.trace?.status === "GROUNDED_OK" && /9,500/.test(typo.text) &&
        /12,500/.test(typo2.text) &&
        /English/.test(thai.text) && thai.trace?.modelRequestAttempted === false,
      `${typo.text.slice(0, 60)} | ${typo2.text.slice(0, 60)} | ${thai.text.slice(0, 60)}`
    );
  });

  await wording("CHK-50", "'Do I need to be fit?' is answered from the medical and requirements content", async () => {
    const out = await turn("Do I need to be fit?");
    check(
      "CHK-50",
      "'Do I need to be fit?' is answered from the medical and requirements content",
      out.trace?.status === "GROUNDED_OK" && /fitness/i.test(out.text) && /medical/i.test(out.text),
      out.text
    );
  });

  await wording("CHK-51", "Weight, age and health questions are answered (not refused)", async () => {
    const outs = [await turn("What are the weight limits?"), await turn("Is there a minimum age?"), await turn("Can I jump if I have asthma?")];
    check(
      "CHK-51",
      "Weight, age and health questions are answered (not refused)",
      outs.every((o) => o.trace?.status === "GROUNDED_OK"),
      outs.map((o) => o.trace?.status).join(",")
    );
  });
}
