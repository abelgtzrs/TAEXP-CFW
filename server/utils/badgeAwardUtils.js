// server/utils/badgeAwardUtils.js
//
// Shared helper for streak-based badge progression.
//
// Rules:
//   - If user has no activeBadgeCollectionKey, auto-assign the first incomplete collection
//     (ordered by BadgeCollection.order ASC).
//   - On every 5-day streak milestone, award the next unearned badge from the active collection.
//   - After awarding, if the collection is now complete (all badges earned), advance
//     activeBadgeCollectionKey to the next incomplete collection ordered by BadgeCollection.order.
//   - If all collections are complete, leave activeBadgeCollectionKey on the last completed one
//     and stop awarding.

const BadgeBase = require("../models/BadgeBase");
const BadgeCollection = require("../models/BadgeCollection");
const UserBadge = require("../models/userSpecific/userBadge");

/**
 * Find the first incomplete collection for a user, ordered by BadgeCollection.order ASC.
 * Returns the collection doc or null if all are complete / none exist.
 */
async function findNextIncompleteCollection(userId, afterOrder = -Infinity) {
  const allCollections = await BadgeCollection.find({}).sort({ order: 1, key: 1 });
  if (!allCollections.length) return null;

  // Get all badge base IDs grouped by collectionKey
  const allBases = await BadgeBase.find({}).select("_id collectionKey");
  const basesByCollection = {};
  for (const b of allBases) {
    const k = b.collectionKey;
    if (!k) continue;
    if (!basesByCollection[k]) basesByCollection[k] = [];
    basesByCollection[k].push(String(b._id));
  }

  // Get all badges this user has earned
  const earned = await UserBadge.find({ user: userId }).select("badgeBase");
  const earnedSet = new Set(earned.map((e) => String(e.badgeBase)));

  // Find the first collection (after the given order threshold) that still has unearned badges
  for (const col of allCollections) {
    if (col.order <= afterOrder) continue; // skip collections at or before current
    const bases = basesByCollection[col.key] || [];
    if (bases.length === 0) continue; // skip empty collections
    const hasUnearned = bases.some((id) => !earnedSet.has(id));
    if (hasUnearned) return col;
  }

  return null;
}

/**
 * Award the next badge for the current active collection and handle progression.
 *
 * Mutates the `user` document in memory (does NOT call user.save() — caller is responsible).
 *
 * Returns an awardedBadge info object (or null if nothing was awarded).
 */
async function awardNextStreakBadge(user) {
  // --- Auto-assign active collection if none is set ---
  if (!user.activeBadgeCollectionKey) {
    const first = await findNextIncompleteCollection(user._id);
    if (!first) return null; // No collections exist or all complete
    user.activeBadgeCollectionKey = first.key;
  }

  // --- Find all badge bases for the active collection ---
  const bases = await BadgeBase.find({ collectionKey: user.activeBadgeCollectionKey })
    .sort({ unlockDay: 1, orderInCategory: 1, name: 1 })
    .select("_id badgeId name imageUrl spriteSmallUrl spriteLargeUrl collectionKey");

  if (!bases || bases.length === 0) return null;

  // --- Determine what the user has already earned ---
  const earned = await UserBadge.find({ user: user._id }).select("badgeBase");
  const earnedSet = new Set(earned.map((e) => String(e.badgeBase)));

  // --- Find the next unearned badge ---
  const nextBase = bases.find((b) => !earnedSet.has(String(b._id)));

  if (!nextBase) {
    // Collection is already complete — advance and return null (award next time)
    const currentCol = await BadgeCollection.findOne({ key: user.activeBadgeCollectionKey }).select("order");
    const currentOrder = currentCol ? currentCol.order : -Infinity;
    const nextCol = await findNextIncompleteCollection(user._id, currentOrder);
    if (nextCol) {
      user.activeBadgeCollectionKey = nextCol.key;
    }
    return null;
  }

  // --- Award the badge ---
  const newUserBadge = await UserBadge.create({ user: user._id, badgeBase: nextBase._id });
  if (!user.badges) user.badges = [];
  user.badges.push(newUserBadge._id);
  user.lastBadgeUnlockedStreak = user.currentLoginStreak;

  const awardedBadge = {
    badgeId: nextBase.badgeId,
    name: nextBase.name,
    imageUrl: nextBase.imageUrl,
    spriteSmallUrl: nextBase.spriteSmallUrl,
    spriteLargeUrl: nextBase.spriteLargeUrl,
    collectionKey: nextBase.collectionKey,
  };

  // --- Check if this award completes the collection ---
  // +1 for the badge we just awarded (earnedSet was fetched before the create)
  const nowEarnedCount = earnedSet.size + 1;
  if (nowEarnedCount >= bases.length) {
    // Collection complete — advance to the next one
    const currentCol = await BadgeCollection.findOne({ key: user.activeBadgeCollectionKey }).select("order");
    const currentOrder = currentCol ? currentCol.order : -Infinity;
    const nextCol = await findNextIncompleteCollection(user._id, currentOrder);
    if (nextCol) {
      user.activeBadgeCollectionKey = nextCol.key;
      awardedBadge.collectionComplete = true;
      awardedBadge.nextCollectionKey = nextCol.key;
    } else {
      // All collections done — stay on the last one
      awardedBadge.collectionComplete = true;
      awardedBadge.nextCollectionKey = null;
    }
  }

  return awardedBadge;
}

module.exports = { awardNextStreakBadge };
