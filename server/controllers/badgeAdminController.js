// server/controllers/badgeAdminController.js
const path = require("path");
const BadgeBase = require("../models/BadgeBase");
const UserBadge = require("../models/userSpecific/userBadge");

// Collections are represented by collectionKey + optional generation in BadgeBase

exports.listCollections = async (req, res) => {
  try {
    const rows = await BadgeBase.aggregate([
      {
        $group: {
          _id: "$collectionKey",
          name: { $first: "$category" },
          series: { $addToSet: "$series" },
          generation: { $max: "$unlocksGeneration" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listBadgesByCollection = async (req, res) => {
  try {
    const badges = await BadgeBase.find({ collectionKey: req.params.collectionKey }).sort({ orderInCategory: 1 });
    res.json({ success: true, data: badges });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createBadge = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.files?.small?.[0]) body.spriteSmallUrl = `/uploads/badges/${req.files.small[0].filename}`;
    if (req.files?.large?.[0]) body.spriteLargeUrl = `/uploads/badges/${req.files.large[0].filename}`;
    if (!body.imageUrl && body.spriteLargeUrl) body.imageUrl = body.spriteLargeUrl;
    const badge = await BadgeBase.create(body);
    res.status(201).json({ success: true, data: badge });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateBadge = async (req, res) => {
  try {
    const badge = await BadgeBase.findById(req.params.badgeId);
    if (!badge) return res.status(404).json({ success: false, message: "Badge not found" });
    const body = { ...req.body };
    if (req.files?.small?.[0]) body.spriteSmallUrl = `/uploads/badges/${req.files.small[0].filename}`;
    if (req.files?.large?.[0]) body.spriteLargeUrl = `/uploads/badges/${req.files.large[0].filename}`;
    Object.assign(badge, body);
    const saved = await badge.save();
    res.json({ success: true, data: saved });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteBadge = async (req, res) => {
  try {
    const badge = await BadgeBase.findById(req.params.badgeId);
    if (!badge) return res.status(404).json({ success: false, message: "Badge not found" });
    const earnedCount = await UserBadge.countDocuments({ badgeBase: badge._id });
    if (earnedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${earnedCount} user(s) have earned this badge. Earned badges are permanent.`,
      });
    }
    await badge.deleteOne();
    res.json({ success: true, data: {} });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
