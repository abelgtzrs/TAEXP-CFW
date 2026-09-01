// server/controllers/badgeController.js
const BadgeBase = require("../models/BadgeBase");
const UserBadge = require("../models/userSpecific/userBadge");
const mongoose = require("mongoose");

// @desc    Get all base badge data for the profile display
// @route   GET /api/badges/base
// @access  Private
exports.getAllBaseBadges = async (req, res) => {
  try {
    // Find all badge definitions and sort them.
    const badges = await BadgeBase.find({}).sort({ category: 1, series: 1 });
    res.status(200).json({ success: true, count: badges.length, data: badges });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all badges the current user has earned
// @route   GET /api/badges/earned
// @access  Private
exports.getMyEarnedBadges = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const earned = await UserBadge.find({ user: userId })
      .populate({ path: "badgeBase", model: "BadgeBase" })
      .sort({ earnedAt: 1 });
    res.status(200).json({ success: true, data: earned });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
