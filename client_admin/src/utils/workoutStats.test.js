import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkoutBuckets, formatRelativeDay } from "./workoutStats.js";

const now = new Date(2026, 10, 4, 15, 0); // Wed Nov 4 2026, local
const log = (y, m, d, sets = 2, minutes = 30) => ({
  date: new Date(y, m, d, 9).toISOString(),
  durationSessionMinutes: minutes,
  exercises: [{ sets: Array.from({ length: sets }) }],
});

test("7d buckets end today with real weekday labels and skip older logs", () => {
  const { buckets, summary } = buildWorkoutBuckets([log(2026, 10, 4), log(2026, 10, 1, 3), log(2026, 9, 28)], "7d", now);
  assert.equal(buckets.length, 7);
  assert.deepEqual(buckets.map((b) => b.label), ["T", "F", "S", "S", "M", "T", "W"]);
  assert.equal(buckets[6].sets, 2);
  assert.equal(buckets[3].sets, 3);
  assert.deepEqual(summary, { workouts: 2, sets: 5, minutes: 60 });
});

test("30d is a rolling window, not the calendar month", () => {
  const { buckets, summary } = buildWorkoutBuckets([log(2026, 9, 10), log(2026, 9, 1)], "30d", now);
  assert.equal(buckets.length, 30);
  assert.equal(summary.workouts, 1);
});

test("12m rolls across the year boundary and all-time fills empty years", () => {
  const logs = [log(2025, 11, 20), log(2023, 0, 5)];
  const m = buildWorkoutBuckets(logs, "12m", now);
  assert.equal(m.buckets.length, 12);
  assert.equal(m.summary.workouts, 1);
  const all = buildWorkoutBuckets(logs, "all", now);
  assert.deepEqual(all.buckets.map((b) => b.label), ["'23", "'24", "'25", "'26"]);
  assert.equal(all.summary.workouts, 2);
});

test("relative day labels", () => {
  assert.equal(formatRelativeDay(new Date(2026, 10, 4, 1), now), "Today");
  assert.equal(formatRelativeDay(new Date(2026, 10, 3, 23), now), "Yesterday");
  assert.equal(formatRelativeDay(new Date(2026, 10, 1), now), "3d ago");
});
