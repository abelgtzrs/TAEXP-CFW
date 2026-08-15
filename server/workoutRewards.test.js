const assert = require("node:assert/strict");
const { calculateWorkoutGold, getRewardDayRange } = require("./workoutRewards");

assert.equal(calculateWorkoutGold([{ sets: [{}] }]), 1);
assert.equal(calculateWorkoutGold([{ sets: [{}, {}] }]), 3);
assert.equal(calculateWorkoutGold([{ sets: [{}, {}, {}, {}, {}, {}] }]), 7);
assert.equal(calculateWorkoutGold([{ durationExerciseMinutes: 49 }]), 9);
assert.equal(calculateWorkoutGold([{ durationExerciseMinutes: 90 }]), 10);
assert.equal(calculateWorkoutGold(Array.from({ length: 8 }, () => ({ sets: [{}, {}, {}, {}, {}] }))), 30);
assert.equal(calculateWorkoutGold([{ sets: [{}, {}, {}, {}, {}] }], 38), 2);

const { start, end } = getRewardDayRange(new Date("2026-08-15T18:00:00"));
assert.equal(start.getHours(), 0);
assert.equal(end.getDate(), start.getDate() + 1);

console.log("Workout reward checks passed.");
