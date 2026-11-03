import assert from "node:assert/strict";
import test from "node:test";
import { planDashSplits, splitBlessingName, splitEntryAtDash } from "./blessingSplit.js";

test("moves text after the first en dash into the description", () => {
  assert.deepEqual(splitEntryAtDash({ item: "Fortune – gain 2 coins – twice", description: "", context: "x" }), {
    item: "Fortune",
    description: "gain 2 coins – twice",
    context: "x",
  });
});

test("keeps an existing description after the moved text", () => {
  assert.equal(splitEntryAtDash({ item: "Luck – big", description: "rare" }).description, "big rare");
});

test("leaves entries without a usable dash alone", () => {
  assert.equal(splitEntryAtDash({ item: "Plain name" }), null);
  assert.equal(splitEntryAtDash({ item: "Hyphen - only" }), null);
  assert.equal(splitEntryAtDash({ item: "Trailing –" }), null);
  assert.equal(splitEntryAtDash({ item: "– leading" }), null);
});

test("plans only volumes that change, preserving entry order", () => {
  const plans = planDashSplits([
    { _id: "a", blessings: [{ item: "A – one" }, { item: "B" }] },
    { _id: "b", blessings: [{ item: "C" }] },
  ]);
  assert.equal(plans.length, 1);
  assert.equal(plans[0].changed, 1);
  assert.deepEqual(plans[0].blessings.map((b) => b.item), ["A", "B"]);
});

test("editor name split handles both dashes and parentheses", () => {
  assert.deepEqual(splitBlessingName("Luck - big"), { item: "Luck", description: "big" });
  assert.deepEqual(splitBlessingName("Luck – big"), { item: "Luck", description: "big" });
  assert.deepEqual(splitBlessingName("Luck (big)"), { item: "Luck", description: "big" });
  assert.deepEqual(splitBlessingName("Well-being"), { item: "Well-being", description: "" });
});
