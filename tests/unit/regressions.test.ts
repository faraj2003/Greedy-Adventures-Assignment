// One regression test per fixed bug. Add a case here whenever a bug is fixed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isBudgetQuestion } from "../../src/lib/intents";

test("REG: 'under 10000' (no baht sign, multi-digit) is a budget question", () => {
  // Bug: the \b after a single \d meant "under 10000" never matched, only "under ฿10000" or "under 5".
  assert.equal(isBudgetQuestion("Is there anything under 10000?"), true);
  assert.equal(isBudgetQuestion("anything under 10,000"), true);
  assert.equal(isBudgetQuestion("below 12000 baht please"), true);
});
