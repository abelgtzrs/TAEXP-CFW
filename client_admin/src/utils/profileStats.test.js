import assert from "node:assert/strict";
import test from "node:test";
import { calculateOverallActivityScore } from "./profileStats.js";

test("empty activity does not receive credit from reversed or relative metrics", () => {
  const score = calculateOverallActivityScore([
    { score: 0, reverseStatus: true, overallContribution: 0 },
    { score: 100, overallContribution: 0 },
  ]);

  assert.equal(score, 0);
});

test("ordinary and reversed scores retain their existing contributions", () => {
  assert.equal(calculateOverallActivityScore([{ score: 50 }, { score: 20, reverseStatus: true }]), 65);
});
