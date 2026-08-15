const assert = require("node:assert/strict");
const { awardExperience, getXpMultiplier } = require("./accountProgression");

const user = {
  level: 1,
  experience: 95,
  xpToNextLevel: 100,
  accountUpgrades: { xpBoostTier: 1 },
};

assert.equal(getXpMultiplier(user), 1.05);
assert.deepEqual(awardExperience(user, 10), { baseXp: 10, xpAwarded: 11, bonusXp: 1, levelsGained: 1 });
assert.equal(user.level, 2);
assert.equal(user.experience, 6);
assert.equal(user.xpToNextLevel, 125);

const capped = { level: 99, experience: 500, xpToNextLevel: 100, accountUpgrades: { xpBoostTier: 5 } };
assert.equal(awardExperience(capped, 100).levelsGained, 1);
assert.equal(capped.level, 100);
assert.equal(capped.experience, 0);

console.log("Account progression checks passed.");
