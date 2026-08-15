const GATILLA_UPGRADES = Object.freeze({
  trainingMomentum: Object.freeze({
    key: "trainingMomentum",
    userField: "accountUpgrades.xpBoostTier",
    title: "Training Momentum",
    description: "Boosts XP earned across the account.",
    currency: "gatillaGold",
    maxTier: 5,
    tiers: Object.freeze([
      Object.freeze({ tier: 1, cost: 50, levelRequired: 2, effect: "+5% XP" }),
      Object.freeze({ tier: 2, cost: 100, levelRequired: 5, effect: "+10% XP" }),
      Object.freeze({ tier: 3, cost: 175, levelRequired: 10, effect: "+15% XP" }),
      Object.freeze({ tier: 4, cost: 300, levelRequired: 20, effect: "+20% XP" }),
      Object.freeze({ tier: 5, cost: 500, levelRequired: 30, effect: "+25% XP" }),
    ]),
  }),
});

const getUpgradeState = (upgrade, user) => {
  const currentTier = Number(user?.accountUpgrades?.xpBoostTier || 0);
  const nextTier = upgrade.tiers[currentTier] || null;
  return {
    key: upgrade.key,
    title: upgrade.title,
    description: upgrade.description,
    currency: upgrade.currency,
    currentTier,
    maxTier: upgrade.maxTier,
    currentEffect: currentTier > 0 ? upgrade.tiers[currentTier - 1].effect : "No bonus yet",
    nextTier,
    isMaxed: currentTier >= upgrade.maxTier,
  };
};

const getAccountUpgradesForUser = (user) => Object.values(GATILLA_UPGRADES).map((upgrade) => getUpgradeState(upgrade, user));

module.exports = { GATILLA_UPGRADES, getAccountUpgradesForUser };
