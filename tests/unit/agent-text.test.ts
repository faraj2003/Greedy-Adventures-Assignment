import { test } from "node:test";
import assert from "node:assert/strict";
import { dropsVerifiedContent, stripGenericEnding, stripGenericOpening, unverifiedBaht } from "../../src/lib/agent";
import type { Composition } from "../../src/lib/compose";

const composition = (figures: number[] = []): Composition => ({ sections: [], calcs: [], figures, parts: [], answered: true });

test("stripGenericOpening", async (t) => {
  const cases: [string, string, string, string][] = [
    ["strips 'great question'", "Great question! The jump takes about 5 minutes.", "How long is the jump?", "The jump takes about 5 minutes."],
    ["strips thanks-for-your-message + filler", "Thank you for your question. Absolutely! ECO costs ฿9,500.", "price?", "ECO costs ฿9,500."],
    ["strips greeting + thanks", "Hello there! Thanks for your interest in Sea View. ECO costs ฿9,500.", "price?", "ECO costs ฿9,500."],
    ["strips 'of course!'", "Of course! VIP includes a cameraman.", "Does VIP include a camera?", "VIP includes a cameraman."],
    ["capitalises the remainder", "Certainly! the dropzone is in Rayong.", "where?", "The dropzone is in Rayong."],
    ["leaves text with no filler unchanged", "ECO costs ฿9,500.", "price?", "ECO costs ฿9,500."],
    ["keeps the greeting when the visitor only said hi", "Hello! Welcome to Sea View.", "hi", "Hello! Welcome to Sea View."],
    ["keeps the reply when the visitor only said thanks", "You're welcome!", "Thank you", "You're welcome!"],
  ];
  for (const [name, text, query, expected] of cases) {
    await t.test(name, () => assert.equal(stripGenericOpening(text, query), expected));
  }
});

test("stripGenericEnding", async (t) => {
  const cases: [string, string, string][] = [
    ["strips 'let me know' sentence", "ECO costs ฿9,500. Let me know if you have any questions!", "ECO costs ฿9,500."],
    ["strips 'feel free' on its own line", "ECO costs ฿9,500.\n\nFeel free to ask more.", "ECO costs ฿9,500."],
    ["strips 'hope this helps'", "VIP includes a cameraman. I hope this helps!", "VIP includes a cameraman."],
    ["strips two stacked closers", "ECO costs ฿9,500. Hope this helps! Let me know if you need anything else.", "ECO costs ฿9,500."],
    ["leaves a clean answer alone", "ECO costs ฿9,500.", "ECO costs ฿9,500."],
    ["never returns an empty string", "Feel free to ask anything.", "Feel free to ask anything."],
    ["trims trailing whitespace", "ECO costs ฿9,500.   \n", "ECO costs ฿9,500."],
  ];
  for (const [name, text, expected] of cases) {
    await t.test(name, () => assert.equal(stripGenericEnding(text), expected));
  }
});

test("dropsVerifiedContent", async (t) => {
  const draft = "ECO is ฿9,500 and VIP is ฿14,000. Call +66 81 234 5678 or visit 95 M.4, Rayong for details about the dropzone.";
  await t.test("false when every key figure survives", () => {
    assert.equal(dropsVerifiedContent("ECO is ฿9,500; VIP is ฿14,000. Call +66 81 234 5678 or come to 95 M.4, Rayong to see the dropzone.", draft), false);
  });
  await t.test("true when a baht figure is lost", () => {
    assert.equal(dropsVerifiedContent("ECO is ฿9,500 and VIP costs a bit more. Call +66 81 234 5678 or visit 95 M.4, Rayong for details.", draft), true);
  });
  await t.test("ignores whitespace differences inside figures", () => {
    assert.equal(dropsVerifiedContent("ECO is ฿ 9,500 and VIP is ฿ 14,000. Call +66 81 234 5678 or visit 95 M.4, Rayong for details about it.", draft), false);
  });
  await t.test("true when the phone number is lost", () => {
    assert.equal(dropsVerifiedContent("ECO is ฿9,500 and VIP is ฿14,000. Visit 95 M.4, Rayong for details about the dropzone, see you there.", draft), true);
  });
  await t.test("true when the answer collapses a 3+ item list", () => {
    const listDraft = "Includes:\n- Gear\n- Briefing\n- Insurance\n- Certificate";
    assert.equal(dropsVerifiedContent("Includes gear, briefing, insurance and a certificate for you.", listDraft), true);
  });
  await t.test("false when the list is kept", () => {
    const listDraft = "Includes:\n- Gear\n- Briefing\n- Insurance";
    assert.equal(dropsVerifiedContent("Includes:\n- Gear\n- Briefing\n- Insurance", listDraft), false);
  });
  await t.test("true when the answer is under 55% of the draft length", () => {
    assert.equal(dropsVerifiedContent("Short.", "A much longer verified draft answer with no special figures at all in it."), true);
  });
  await t.test("false for a draft with no key figures and a comparable answer", () => {
    assert.equal(dropsVerifiedContent("Jumps take about five minutes in total.", "The jump takes about five minutes in total."), false);
  });
});

test("unverifiedBaht", async (t) => {
  await t.test("empty when no baht amounts appear", () => {
    assert.deepEqual(unverifiedBaht("The jump is great.", "hi", composition()), []);
  });
  await t.test("known price list amounts are allowed", () => {
    assert.deepEqual(unverifiedBaht("ECO is ฿9,500 and VIP is ฿14,000.", "prices?", composition()), []);
  });
  await t.test("flags an invented amount", () => {
    assert.deepEqual(unverifiedBaht("The pickup add-on is ฿777.", "pickup?", composition()), [777]);
  });
  await t.test("amounts the visitor typed are allowed", () => {
    assert.deepEqual(unverifiedBaht("Within your ฿7,777 budget, ECO fits.", "I have ฿7,777", composition()), []);
  });
  await t.test("composition figures (computed totals) are allowed", () => {
    assert.deepEqual(unverifiedBaht("Total ฿123,456.", "total?", composition([123456])), []);
  });
  await t.test("handles a space after the symbol and comma grouping", () => {
    assert.deepEqual(unverifiedBaht("Costs ฿ 1,234,567.", "x", composition()), [1234567]);
  });
  await t.test("returns every bad amount, in order", () => {
    assert.deepEqual(unverifiedBaht("฿111 then ฿222", "x", composition()), [111, 222]);
  });
});
