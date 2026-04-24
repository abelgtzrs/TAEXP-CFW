// server/controllers/badgeCollectionController.js
const BadgeCollection = require("../models/BadgeCollection");
const BadgeBase = require("../models/BadgeBase");
const UserBadge = require("../models/userSpecific/userBadge");

exports.listCollections = async (req, res) => {
  try {
    const collections = await BadgeCollection.find({}).sort({ order: 1, key: 1 });
    res.json({ success: true, data: collections });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getCollection = async (req, res) => {
  try {
    const col = await BadgeCollection.findOne({ key: req.params.key });
    if (!col) return res.status(404).json({ success: false, message: "Collection not found" });
    res.json({ success: true, data: col });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const col = await BadgeCollection.create(req.body);
    res.status(201).json({ success: true, data: col });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const col = await BadgeCollection.findOne({ key: req.params.key });
    if (!col) return res.status(404).json({ success: false, message: "Collection not found" });
    Object.assign(col, req.body);
    const saved = await col.save();
    res.json({ success: true, data: saved });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const col = await BadgeCollection.findOne({ key: req.params.key });
    if (!col) return res.status(404).json({ success: false, message: "Collection not found" });
    // Block if any badge bases exist in this collection
    const bases = await BadgeBase.find({ collectionKey: col.key }).select("_id");
    if (bases.length > 0) {
      // Block if any user has earned a badge from this collection
      const earnedCount = await UserBadge.countDocuments({ badgeBase: { $in: bases.map((b) => b._id) } });
      if (earnedCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete: ${earnedCount} user(s) have earned badges from this collection. Earned badges are permanent.`,
        });
      }
      return res.status(400).json({ success: false, message: "Cannot delete: badges exist in this collection" });
    }
    await col.deleteOne();
    res.json({ success: true, data: {} });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
