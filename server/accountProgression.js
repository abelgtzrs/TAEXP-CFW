const MAX_LEVEL = 100;

const getXpBoostTier = (user) => {
  const tier = Number(user?.accountUpgrades?.xpBoostTier || 0);
  return Number.isFinite(tier) ? Math.max(0, Math.min(5, tier)) : 0;
};

const getXpMultiplier = (user) => 1 + getXpBoostTier(user) * 0.05;

const awardExperience = (user, baseXp) => {
  const base = Math.max(0, Number(baseXp) || 0);
  const xpAwarded = Math.round(base * getXpMultiplier(user));

  user.level = Number(user.level) || 1;
  user.experience = Number(user.experience) || 0;
  user.xpToNextLevel = Number(user.xpToNextLevel) || 100;

  if (user.level >= MAX_LEVEL) {
    user.level = MAX_LEVEL;
    user.experience = 0;
    return { baseXp: base, xpAwarded: 0, bonusXp: 0, levelsGained: 0 };
  }

  user.experience += xpAwarded;
  let levelsGained = 0;

  while (user.level < MAX_LEVEL && user.experience >= user.xpToNextLevel) {
    user.experience -= user.xpToNextLevel;
    user.level += 1;
    levelsGained += 1;
    user.xpToNextLevel = Math.floor(user.xpToNextLevel * 1.25);
  }

  if (user.level >= MAX_LEVEL) {
    user.level = MAX_LEVEL;
    user.experience = 0;
  }

  return { baseXp: base, xpAwarded, bonusXp: xpAwarded - base, levelsGained };
};

module.exports = { awardExperience, getXpBoostTier, getXpMultiplier, MAX_LEVEL };
