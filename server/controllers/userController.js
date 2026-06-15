const User = require("../models/User");
const BadgeBase = require("../models/BadgeBase");
const UserBadge = require("../models/userSpecific/userBadge");
const BadgeCollection = require("../models/BadgeCollection");
const { awardNextStreakBadge } = require("../utils/badgeAwardUtils");
const Habit = require("../models/userSpecific/Habit");
const Book = require("../models/userSpecific/Book");
const WorkoutLog = require("../models/userSpecific/WorkoutLog");
const Volume = require("../models/Volume");
const Task = require("../models/userSpecific/Task");
const Budget = require("../models/Budget");
const SpotifyLog = require("../models/SpotifyLogs");
const mongoose = require("mongoose");

// --- Daily Login Streak Utilities ---
const isSameDay = (a, b) => a && b && new Date(a).toDateString() === new Date(b).toDateString();

const getPublicUploadUrl = (req, uploadPath) => {
  const host = req.get("host") || "";
  if (!host || /^localhost(:|$)|^127\.0\.0\.1(:|$)/i.test(host)) return uploadPath;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0] || "https";
  return `${protocol}://${host}${uploadPath}`;
};

// Return whether today has been counted and current streaks
const getStreakStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("lastLoginDate currentLoginStreak longestLoginStreak");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const today = new Date();
    const countedToday = isSameDay(user.lastLoginDate, today);
    return res.status(200).json({
      success: true,
      data: {
        countedToday,
        currentLoginStreak: user.currentLoginStreak || 0,
        longestLoginStreak: user.longestLoginStreak || 0,
        lastLoginDate: user.lastLoginDate || null,
      },
    });
  } catch (error) {
    console.error("Get Streak Status Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Increment today's streak if not already counted; mirrors login logic safely
const tickLoginStreak = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "+password lastLoginDate currentLoginStreak longestLoginStreak email activeBadgeCollectionKey lastBadgeUnlockedStreak",
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const today = new Date();
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;

    // If already counted today, no-op
    if (isSameDay(lastLogin, today)) {
      return res.status(200).json({
        success: true,
        data: {
          changed: false,
          countedToday: true,
          currentLoginStreak: user.currentLoginStreak || 0,
          longestLoginStreak: user.longestLoginStreak || 0,
          lastLoginDate: user.lastLoginDate || null,
        },
      });
    }

    // Determine if yesterday to continue streak
    let wasYesterday = false;
    if (lastLogin) {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      wasYesterday = lastLogin.toDateString() === yesterday.toDateString();
    }

    if (wasYesterday) {
      user.currentLoginStreak = (user.currentLoginStreak || 0) + 1;
    } else {
      user.currentLoginStreak = 1;
    }

    if ((user.currentLoginStreak || 0) > (user.longestLoginStreak || 0)) {
      user.longestLoginStreak = user.currentLoginStreak;
    }

    // Award a badge every 5 days for the active collection (idempotent)
    let awardedBadge = null;
    const shouldAward = user.currentLoginStreak > 0 && user.currentLoginStreak % 5 === 0;
    const notAlreadyAwardedForThisStreak = (user.lastBadgeUnlockedStreak || 0) !== user.currentLoginStreak;
    if (shouldAward && notAlreadyAwardedForThisStreak) {
      try {
        awardedBadge = await awardNextStreakBadge(user);
      } catch (awardErr) {
        console.warn("Badge award on streak failed:", awardErr.message);
      }
    }

    user.lastLoginDate = today;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      data: {
        changed: true,
        countedToday: true,
        currentLoginStreak: user.currentLoginStreak || 0,
        longestLoginStreak: user.longestLoginStreak || 0,
        lastLoginDate: user.lastLoginDate || null,
        awardedBadge,
      },
    });
  } catch (error) {
    console.error("Tick Login Streak Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- ADD THIS NEW FUNCTION ---
const updateProfilePicture = async (req, res) => {
  try {
    console.log("updateProfilePicture called");
    console.log("req.file:", req.file);

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    // The path should be the URL path, not the file system path
    const profilePictureUrl = `/uploads/avatars/${req.file.filename}`;
    console.log("Generated profile picture URL:", profilePictureUrl);

    // Find user and update their profile picture URL
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true, runValidators: true }, // Return the updated document
    )
      .select("-password")
      .populate({
        path: "activeAbelPersona",
        model: "AbelPersonaBase",
      })
      .populate({
        path: "unlockedAbelPersonas",
        model: "AbelPersonaBase",
      })
      .populate({
        path: "displayedPokemon",
        populate: { path: "basePokemon", model: "PokemonBase" },
      })
      .populate({
        path: "displayedSnoopyArt",
        populate: { path: "snoopyArtBase", model: "SnoopyArtBase" },
      })
      .populate({
        path: "displayedHabboRares",
        populate: { path: "habboRareBase", model: "HabboRareBase" },
      })
      .populate({
        path: "displayedYugiohCards",
        populate: { path: "yugiohCardBase", model: "YugiohCardBase" },
      })
      .populate({
        path: "badges",
        populate: { path: "badgeBase", model: "BadgeBase" },
      })
      .populate({
        path: "equippedTitle",
        populate: { path: "titleBase", model: "TitleBase" },
      });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ success: false, message: "User not found." });
    }

    console.log("User updated successfully. New profilePicture:", user.profilePicture);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Update Profile Picture Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Upload profile banner image
const updateProfileBanner = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
    const bannerUrl = getPublicUploadUrl(req, `/uploads/banners/${req.file.filename}`);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bannerImage: bannerUrl },
      { new: true, runValidators: true },
    )
      .select("-password")
      .populate({ path: "activeAbelPersona", model: "AbelPersonaBase" })
      .populate({ path: "unlockedAbelPersonas", model: "AbelPersonaBase" })
      .populate({ path: "displayedPokemon", populate: { path: "basePokemon", model: "PokemonBase" } })
      .populate({ path: "displayedSnoopyArt", populate: { path: "snoopyArtBase", model: "SnoopyArtBase" } })
      .populate({ path: "displayedHabboRares", populate: { path: "habboRareBase", model: "HabboRareBase" } })
      .populate({ path: "displayedYugiohCards", populate: { path: "yugiohCardBase", model: "YugiohCardBase" } })
      .populate({ path: "badges", populate: { path: "badgeBase", model: "BadgeBase" } })
      .populate({ path: "equippedTitle", populate: { path: "titleBase", model: "TitleBase" } });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Update Profile Banner Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update banner display settings
const updateBannerSettings = async (req, res) => {
  try {
    const { bannerFitMode, bannerPositionX, bannerPositionY } = req.body;
    const updates = {};
    if (bannerFitMode) updates.bannerFitMode = bannerFitMode;
    if (typeof bannerPositionX === "number") updates.bannerPositionX = Math.max(0, Math.min(100, bannerPositionX));
    if (typeof bannerPositionY === "number") updates.bannerPositionY = Math.max(0, Math.min(100, bannerPositionY));

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true })
      .select("-password")
      .populate({ path: "activeAbelPersona", model: "AbelPersonaBase" })
      .populate({ path: "unlockedAbelPersonas", model: "AbelPersonaBase" })
      .populate({ path: "displayedPokemon", populate: { path: "basePokemon", model: "PokemonBase" } })
      .populate({ path: "displayedSnoopyArt", populate: { path: "snoopyArtBase", model: "SnoopyArtBase" } })
      .populate({ path: "displayedHabboRares", populate: { path: "habboRareBase", model: "HabboRareBase" } })
      .populate({ path: "displayedYugiohCards", populate: { path: "yugiohCardBase", model: "YugiohCardBase" } })
      .populate({ path: "badges", populate: { path: "badgeBase", model: "BadgeBase" } })
      .populate({ path: "equippedTitle", populate: { path: "titleBase", model: "TitleBase" } });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Update Banner Settings Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Set or clear the active badge collection for the user
const setActiveBadgeCollection = async (req, res) => {
  try {
    const { collectionKey } = req.body;

    // Allow clearing the active collection
    if (!collectionKey) {
      const cleared = await User.findByIdAndUpdate(
        req.user.id,
        { activeBadgeCollectionKey: null },
        { new: true, runValidators: true },
      )
        .select("-password")
        .populate({ path: "activeAbelPersona", model: "AbelPersonaBase" })
        .populate({ path: "unlockedAbelPersonas", model: "AbelPersonaBase" })
        .populate({ path: "displayedPokemon", populate: { path: "basePokemon", model: "PokemonBase" } })
        .populate({ path: "displayedSnoopyArt", populate: { path: "snoopyArtBase", model: "SnoopyArtBase" } })
        .populate({ path: "displayedHabboRares", populate: { path: "habboRareBase", model: "HabboRareBase" } })
        .populate({ path: "displayedYugiohCards", populate: { path: "yugiohCardBase", model: "YugiohCardBase" } })
        .populate({ path: "badges", populate: { path: "badgeBase", model: "BadgeBase" } })
        .populate({ path: "equippedTitle", populate: { path: "titleBase", model: "TitleBase" } });
      if (!cleared) return res.status(404).json({ success: false, message: "User not found." });
      return res.status(200).json({ success: true, data: cleared });
    }

    // Validate the collection exists (prefer BadgeCollection, fallback to BadgeBase existence)
    const col = await BadgeCollection.findOne({ key: collectionKey });
    if (!col) {
      const hasBadges = await BadgeBase.exists({ collectionKey });
      if (!hasBadges) {
        return res.status(400).json({ success: false, message: "Invalid collection key" });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { activeBadgeCollectionKey: collectionKey },
      { new: true, runValidators: true },
    )
      .select("-password")
      .populate({ path: "activeAbelPersona", model: "AbelPersonaBase" })
      .populate({ path: "unlockedAbelPersonas", model: "AbelPersonaBase" })
      .populate({ path: "displayedPokemon", populate: { path: "basePokemon", model: "PokemonBase" } })
      .populate({ path: "displayedSnoopyArt", populate: { path: "snoopyArtBase", model: "SnoopyArtBase" } })
      .populate({ path: "displayedHabboRares", populate: { path: "habboRareBase", model: "HabboRareBase" } })
      .populate({ path: "displayedYugiohCards", populate: { path: "yugiohCardBase", model: "YugiohCardBase" } })
      .populate({ path: "badges", populate: { path: "badgeBase", model: "BadgeBase" } })
      .populate({ path: "equippedTitle", populate: { path: "titleBase", model: "TitleBase" } });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Set Active Badge Collection Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Define all functions as constants before exporting ---

// Get persisted dashboard layout for current user
const getDashboardLayout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("dashboardLayout");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user.dashboardLayout || null });
  } catch (error) {
    console.error("Get Dashboard Layout Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Save dashboard layout for current user
const setDashboardLayout = async (req, res) => {
  try {
    const layout = req.body;
    if (!layout || typeof layout !== "object")
      return res.status(400).json({ success: false, message: "Invalid layout" });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { dashboardLayout: layout },
      { new: true, runValidators: false },
    ).select("dashboardLayout");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user.dashboardLayout || null });
  } catch (error) {
    console.error("Set Dashboard Layout Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Yearly Goals Management ---
const getYearlyGoals = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("yearlyGoals");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user.yearlyGoals || [] });
  } catch (error) {
    console.error("Get Yearly Goals Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateYearlyGoals = async (req, res) => {
  try {
    const { goals } = req.body;
    if (!Array.isArray(goals)) return res.status(400).json({ success: false, message: "Goals must be an array" });

    // Basic validation
    const validGoals = goals.map((g) => ({
      name: g.name || "New Goal",
      metric: g.metric || "count",
      target: Number(g.target) || 100,
      current: Number(g.current) || 0,
      icon: g.icon || "target",
      color: g.color || "#10b981",
    }));

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { yearlyGoals: validGoals },
      { new: true, runValidators: true },
    ).select("yearlyGoals");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user.yearlyGoals });
  } catch (error) {
    console.error("Update Yearly Goals Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const setActivePersona = async (req, res) => {
  try {
    const { personaId } = req.body;
    const user = await User.findById(req.user.id);

    // Security check: ensure the user has unlocked this persona before activating.
    // We also allow `null` to be passed to deactivate a persona.
    if (personaId && !user.unlockedAbelPersonas.includes(personaId)) {
      return res.status(403).json({ success: false, message: "Persona not unlocked." });
    }

    // Set the active persona field to the new ID or null.
    user.activeAbelPersona = personaId || null;
    await user.save({ validateBeforeSave: false });

    // --- CRUCIAL FIX ---
    // After saving, we re-fetch the user and explicitly populate the 'activeAbelPersona' field.
    // This ensures the full theme data is sent back to the frontend.
    const updatedUser = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: "activeAbelPersona",
        model: "AbelPersonaBase",
      })
      .populate({
        path: "unlockedAbelPersonas", // Also populate the list of unlocked personas
        model: "AbelPersonaBase",
      })
      .populate({
        path: "displayedPokemon",
        populate: { path: "basePokemon", model: "PokemonBase" },
      })
      .populate({
        path: "displayedSnoopyArt",
        populate: { path: "snoopyArtBase", model: "SnoopyArtBase" },
      })
      .populate({
        path: "displayedHabboRares",
        populate: { path: "habboRareBase", model: "HabboRareBase" },
      })
      .populate({
        path: "displayedYugiohCards",
        populate: { path: "yugiohCardBase", model: "YugiohCardBase" },
      })
      .populate({
        path: "badges",
        populate: { path: "badgeBase", model: "BadgeBase" },
      })
      .populate({
        path: "equippedTitle",
        populate: { path: "titleBase", model: "TitleBase" },
      });

    // We also need to repopulate other fields for consistency if the user object is used elsewhere.
    // For now, focusing on the persona.

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Set Active Persona Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getUserCollection = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id;

    const collectionConfig = {
      pokemon: { path: "pokemonCollection", populate: { path: "basePokemon" } },
      snoopy: { path: "snoopyArtCollection", populate: { path: "snoopyArtBase" } },
      habbo: { path: "habboRares", populate: { path: "habboRareBase" } },
      yugioh: { path: "yugiohCards", populate: { path: "yugiohCardBase" } },
    };

    const config = collectionConfig[type.toLowerCase()];
    if (!config) {
      return res.status(400).json({ success: false, message: "Invalid collection type" });
    }

    const user = await User.findById(userId).populate(config);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user[config.path] });
  } catch (error) {
    console.error("Get Collection Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateDisplayedItems = async (req, res) => {
  try {
    const { collectionType, items } = req.body;
    const userId = req.user.id;

    const displayConfig = {
      pokemon: { field: "displayedPokemon", limit: 6, collectionField: "pokemonCollection" },
      snoopy: { field: "displayedSnoopyArt", limit: 6, collectionField: "snoopyArtCollection" },
      habbo: { field: "displayedHabboRares", limit: 6, collectionField: "habboRares" },
      yugioh: { field: "displayedYugiohCards", limit: 6, collectionField: "yugiohCards" },
    };

    const config = displayConfig[collectionType.toLowerCase()];
    if (!config) {
      return res.status(400).json({ success: false, message: "Invalid collection type" });
    }

    if (!Array.isArray(items) || items.length > config.limit) {
      return res
        .status(400)
        .json({ success: false, message: `Invalid items array. Maximum of ${config.limit} items allowed.` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userCollectionIds = user[config.collectionField].map((id) => id.toString());
    const allItemsOwnedByUser = items.every((itemId) => userCollectionIds.includes(itemId));

    if (!allItemsOwnedByUser) {
      return res.status(403).json({ success: false, message: "Forbidden. You can only display items you own." });
    }

    user[config.field] = items;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Display updated successfully.", data: user[config.field] });
  } catch (error) {
    console.error("Update Display Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- UPDATED AND EXPANDED FUNCTION ---
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // --- Basic Stats ---
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const startOfYear = new Date(startOfToday.getFullYear(), 0, 1);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      habitsCompletedToday,
      booksFinished,
      totalWorkouts,
      tasksCompletedToday,
      tasksPending,
      workoutsThisWeek,
      budgetAgg,
      user,
      lifetimeTaskAgg,
      taskSubtaskAgg,
      spotifyTotalAgg,
      spotifyTodayAgg,
      spotifyWeekAgg,
      spotifyMonthAgg,
      spotifyYearAgg,
      spotifyTopArtistAgg,
      spotifyTopAlbumAgg,
      spotifyTopTrackAgg,
      workoutAgg,
      workoutFeelingAgg,
      bookAgg,
      volumeAgg,
    ] = await Promise.all([
      Habit.countDocuments({ user: userId, lastCompletedDate: { $gte: startOfToday } }),
      Book.countDocuments({ user: userId, isFinished: true }),
      WorkoutLog.countDocuments({ user: userId }),
      Task.countDocuments({ user: userId, status: "completed", completedDate: { $gte: startOfToday } }),
      Task.countDocuments({ user: userId, status: { $in: ["todo", "in-progress"] } }),
      WorkoutLog.countDocuments({ user: userId, date: { $gte: oneWeekAgo } }),
      Budget.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.findById(userId)
        .select(
          "currentLoginStreak longestLoginStreak pokemonCollection snoopyArtCollection habboRares yugiohCards yearlyGoals spotifyConnected",
        )
        .populate({
          path: "pokemonCollection",
          options: { sort: { createdAt: -1 } },
          populate: { path: "basePokemon" },
        })
        .populate({
          path: "snoopyArtCollection",
          options: { sort: { createdAt: -1 } },
          populate: { path: "snoopyArtBase" },
        })
        .populate({
          path: "habboRares",
          options: { sort: { createdAt: -1 } },
          populate: { path: "habboRareBase" },
        })
        .populate({
          path: "yugiohCards",
          options: { sort: { createdAt: -1 } },
          populate: { path: "yugiohCardBase" },
        }),
      Task.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
            urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
            highPriority: { $sum: { $cond: [{ $in: ["$priority", ["high", "urgent"]] }, 1, 0] } },
          },
        },
      ]),
      Task.aggregate([
        { $match: { user: userObjectId } },
        {
          $project: {
            totalSubtasks: { $size: { $ifNull: ["$subTasks", []] } },
            completedSubtasks: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$subTasks", []] },
                  as: "subTask",
                  cond: { $eq: ["$$subTask.isCompleted", true] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSubtasks: { $sum: "$totalSubtasks" },
            completedSubtasks: { $sum: "$completedSubtasks" },
          },
        },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: null,
            tracks: { $sum: 1 },
            minutes: { $sum: { $divide: ["$durationMs", 60000] } },
            firstPlayedAt: { $min: "$playedAt" },
            lastPlayedAt: { $max: "$playedAt" },
          },
        },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId, playedAt: { $gte: startOfToday } } },
        { $group: { _id: null, tracks: { $sum: 1 }, minutes: { $sum: { $divide: ["$durationMs", 60000] } } } },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId, playedAt: { $gte: oneWeekAgo } } },
        { $group: { _id: null, tracks: { $sum: 1 }, minutes: { $sum: { $divide: ["$durationMs", 60000] } } } },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId, playedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, tracks: { $sum: 1 }, minutes: { $sum: { $divide: ["$durationMs", 60000] } } } },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId, playedAt: { $gte: startOfYear } } },
        { $group: { _id: null, tracks: { $sum: 1 }, minutes: { $sum: { $divide: ["$durationMs", 60000] } } } },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: "$artistName", plays: { $sum: 1 }, minutes: { $sum: { $divide: ["$durationMs", 60000] } } } },
        { $sort: { plays: -1 } },
        { $limit: 5 },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: "$albumName", plays: { $sum: 1 }, minutes: { $sum: { $divide: ["$durationMs", 60000] } } } },
        { $sort: { plays: -1 } },
        { $limit: 5 },
      ]),
      SpotifyLog.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: { track: "$trackName", artist: "$artistName" },
            plays: { $sum: 1 },
            minutes: { $sum: { $divide: ["$durationMs", 60000] } },
          },
        },
        { $sort: { plays: -1 } },
        { $limit: 5 },
      ]),
      WorkoutLog.aggregate([
        { $match: { user: userObjectId } },
        {
          $project: {
            duration: { $ifNull: ["$durationSessionMinutes", 0] },
            exerciseCount: { $size: { $ifNull: ["$exercises", []] } },
            totalSets: {
              $reduce: {
                input: { $ifNull: ["$exercises", []] },
                initialValue: 0,
                in: { $add: ["$$value", { $size: { $ifNull: ["$$this.sets", []] } }] },
              },
            },
            totalReps: {
              $reduce: {
                input: { $ifNull: ["$exercises", []] },
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $reduce: {
                        input: { $ifNull: ["$$this.sets", []] },
                        initialValue: 0,
                        in: { $add: ["$$value", { $ifNull: ["$$this.reps", 0] }] },
                      },
                    },
                  ],
                },
              },
            },
            totalVolume: {
              $reduce: {
                input: { $ifNull: ["$exercises", []] },
                initialValue: 0,
                in: {
                  $add: [
                    "$$value",
                    {
                      $reduce: {
                        input: { $ifNull: ["$$this.sets", []] },
                        initialValue: 0,
                        in: {
                          $add: [
                            "$$value",
                            { $multiply: [{ $ifNull: ["$$this.reps", 0] }, { $ifNull: ["$$this.weight", 0] }] },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
            totalCalories: {
              $reduce: {
                input: { $ifNull: ["$exercises", []] },
                initialValue: 0,
                in: { $add: ["$$value", { $ifNull: ["$$this.caloriesBurned", 0] }] },
              },
            },
            totalDistance: {
              $reduce: {
                input: { $ifNull: ["$exercises", []] },
                initialValue: 0,
                in: { $add: ["$$value", { $ifNull: ["$$this.distance", 0] }] },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            sessions: { $sum: 1 },
            durationMinutes: { $sum: "$duration" },
            exercises: { $sum: "$exerciseCount" },
            sets: { $sum: "$totalSets" },
            reps: { $sum: "$totalReps" },
            volume: { $sum: "$totalVolume" },
            calories: { $sum: "$totalCalories" },
            distance: { $sum: "$totalDistance" },
          },
        },
      ]),
      WorkoutLog.aggregate([
        { $match: { user: userObjectId, overallFeeling: { $exists: true, $ne: null } } },
        { $group: { _id: "$overallFeeling", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Book.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            finished: { $sum: { $cond: ["$isFinished", 1, 0] } },
            active: { $sum: { $cond: ["$isFinished", 0, 1] } },
            owned: { $sum: { $cond: ["$isOwned", 1, 0] } },
            pagesRead: { $sum: { $ifNull: ["$pagesRead", 0] } },
            totalPages: { $sum: { $ifNull: ["$totalPages", 0] } },
            ratings: { $sum: { $cond: [{ $gt: ["$userRating", null] }, 1, 0] } },
            ratingSum: { $sum: { $ifNull: ["$userRating", 0] } },
            notes: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$notes", ""] } }, 0] }, 1, 0] } },
            pdfs: { $sum: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$pdfUrl", ""] } }, 0] }, 1, 0] } },
          },
        },
      ]),
      Volume.aggregate([
        { $match: { createdBy: userObjectId } },
        {
          $project: {
            status: 1,
            favoriteCount: { $ifNull: ["$favoriteCount", 0] },
            ratingCount: { $ifNull: ["$ratingCount", 0] },
            averageRating: { $ifNull: ["$averageRating", 0] },
            blessingCount: { $size: { $ifNull: ["$blessings", []] } },
            bodyLineCount: { $size: { $ifNull: ["$bodyLines", []] } },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
            drafts: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
            archived: { $sum: { $cond: [{ $eq: ["$status", "archived"] }, 1, 0] } },
            favorites: { $sum: "$favoriteCount" },
            ratings: { $sum: "$ratingCount" },
            ratingPoints: { $sum: { $multiply: ["$averageRating", "$ratingCount"] } },
            blessings: { $sum: "$blessingCount" },
            bodyLines: { $sum: "$bodyLineCount" },
            publishedBlessings: { $sum: { $cond: [{ $eq: ["$status", "published"] }, "$blessingCount", 0] } },
            publishedBodyLines: { $sum: { $cond: [{ $eq: ["$status", "published"] }, "$bodyLineCount", 0] } },
          },
        },
      ]),
    ]);

    // --- Recent Acquisitions Logic ---
    const allCollections = [
      ...user.pokemonCollection.map((p) => ({ ...p.toObject(), type: "Pokémon" })),
      ...user.snoopyArtCollection.map((s) => ({ ...s.toObject(), type: "Snoopy" })),
      ...user.habboRares.map((h) => ({ ...h.toObject(), type: "Habbo Rare" })),
      ...user.yugiohCards.map((y) => ({ ...y.toObject(), type: "Yu-Gi-Oh! Card" })),
    ];

    // Sort all collected items by date (newest first)
    const getCollectibleImage = (base) => {
      if (!base) return null;
      if (base.imageUrl) return base.imageUrl;
      if (base.spriteSmallUrl) return base.spriteSmallUrl;

      if (Array.isArray(base.forms) && base.forms.length > 0) {
        const withGen5 = base.forms.find((form) => form?.spriteGen5Animated);
        if (withGen5?.spriteGen5Animated) return withGen5.spriteGen5Animated;

        const withGen6 = base.forms.find((form) => form?.spriteGen6Animated);
        if (withGen6?.spriteGen6Animated) return withGen6.spriteGen6Animated;
      }

      return null;
    };

    const toAbsoluteAssetUrl = (assetPath) => {
      if (!assetPath) return null;
      if (/^https?:\/\//i.test(assetPath)) return assetPath;

      const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
      const forwardedProto = req.headers["x-forwarded-proto"];
      const protocol =
        (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0] || req.protocol;
      const host = req.get("host");

      if (!host) return normalizedPath;
      return `${protocol}://${host}${normalizedPath}`;
    };

    const recentAcquisitions = allCollections
      .sort((a, b) => {
        const aTime = new Date(a.obtainedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.obtainedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .map((item) => {
        const base = item.basePokemon || item.snoopyArtBase || item.habboRareBase || item.yugiohCardBase || {};
        const name = base.name || item.nickname || "Unknown Collectible";
        const rarity = base.rarity || base.systemRarity || base.rarityCategory || "common";
        const imageUrl = toAbsoluteAssetUrl(getCollectibleImage(base));
        return {
          name,
          rarity,
          type: item.type,
          imageUrl,
          obtainedAt: item.obtainedAt || item.createdAt || null,
        };
      })
      .filter((item) => item && item.name);

    const totalCollectibles =
      user.pokemonCollection.length +
      user.snoopyArtCollection.length +
      user.habboRares.length +
      user.yugiohCards.length;

    const taskStats = {
      total: lifetimeTaskAgg[0]?.total || 0,
      completed: lifetimeTaskAgg[0]?.completed || 0,
      todo: lifetimeTaskAgg[0]?.todo || 0,
      inProgress: lifetimeTaskAgg[0]?.inProgress || 0,
      pending: tasksPending,
      urgent: lifetimeTaskAgg[0]?.urgent || 0,
      highPriority: lifetimeTaskAgg[0]?.highPriority || 0,
      completedToday: tasksCompletedToday,
      totalSubtasks: taskSubtaskAgg[0]?.totalSubtasks || 0,
      completedSubtasks: taskSubtaskAgg[0]?.completedSubtasks || 0,
    };

    const musicStats = {
      connected: Boolean(user.spotifyConnected),
      totalTracks: spotifyTotalAgg[0]?.tracks || 0,
      totalMinutes: Math.round(spotifyTotalAgg[0]?.minutes || 0),
      totalHours: Math.round(((spotifyTotalAgg[0]?.minutes || 0) / 60) * 100) / 100,
      todayTracks: spotifyTodayAgg[0]?.tracks || 0,
      todayMinutes: Math.round(spotifyTodayAgg[0]?.minutes || 0),
      weekTracks: spotifyWeekAgg[0]?.tracks || 0,
      weekMinutes: Math.round(spotifyWeekAgg[0]?.minutes || 0),
      monthTracks: spotifyMonthAgg[0]?.tracks || 0,
      monthMinutes: Math.round(spotifyMonthAgg[0]?.minutes || 0),
      yearTracks: spotifyYearAgg[0]?.tracks || 0,
      yearMinutes: Math.round(spotifyYearAgg[0]?.minutes || 0),
      firstPlayedAt: spotifyTotalAgg[0]?.firstPlayedAt || null,
      lastPlayedAt: spotifyTotalAgg[0]?.lastPlayedAt || null,
      topArtist: spotifyTopArtistAgg[0]
        ? {
            name: spotifyTopArtistAgg[0]._id,
            plays: spotifyTopArtistAgg[0].plays,
            minutes: Math.round(spotifyTopArtistAgg[0].minutes || 0),
          }
        : null,
      topArtists: spotifyTopArtistAgg.map((artist) => ({
        name: artist._id || "Unknown Artist",
        plays: artist.plays,
        minutes: Math.round(artist.minutes || 0),
      })),
      topAlbums: spotifyTopAlbumAgg.map((album) => ({
        name: album._id || "Unknown Album",
        plays: album.plays,
        minutes: Math.round(album.minutes || 0),
      })),
      topTracks: spotifyTopTrackAgg.map((track) => ({
        name: track._id?.track || "Unknown Track",
        artist: track._id?.artist || "Unknown Artist",
        plays: track.plays,
        minutes: Math.round(track.minutes || 0),
      })),
    };

    const workoutTotals = workoutAgg[0] || {};
    const workoutStats = {
      sessions: workoutTotals.sessions || 0,
      thisWeek: workoutsThisWeek,
      durationMinutes: Math.round(workoutTotals.durationMinutes || 0),
      durationHours: Math.round(((workoutTotals.durationMinutes || 0) / 60) * 100) / 100,
      exercises: workoutTotals.exercises || 0,
      sets: workoutTotals.sets || 0,
      reps: workoutTotals.reps || 0,
      volume: Math.round(workoutTotals.volume || 0),
      calories: Math.round(workoutTotals.calories || 0),
      distance: Math.round((workoutTotals.distance || 0) * 100) / 100,
      averageDuration:
        workoutTotals.sessions > 0 ? Math.round((workoutTotals.durationMinutes / workoutTotals.sessions) * 10) / 10 : 0,
      feelings: workoutFeelingAgg.map((feeling) => ({ label: feeling._id, count: feeling.count })),
    };

    const bookTotals = bookAgg[0] || {};
    const bookStats = {
      total: bookTotals.total || 0,
      finished: bookTotals.finished || 0,
      active: bookTotals.active || 0,
      owned: bookTotals.owned || 0,
      pagesRead: bookTotals.pagesRead || 0,
      totalPages: bookTotals.totalPages || 0,
      pagesLeft: Math.max((bookTotals.totalPages || 0) - (bookTotals.pagesRead || 0), 0),
      completionRate: bookTotals.totalPages > 0 ? Math.round(((bookTotals.pagesRead || 0) / bookTotals.totalPages) * 100) : 0,
      ratings: bookTotals.ratings || 0,
      averageRating: bookTotals.ratings > 0 ? Math.round((bookTotals.ratingSum / bookTotals.ratings) * 100) / 100 : 0,
      notes: bookTotals.notes || 0,
      pdfs: bookTotals.pdfs || 0,
    };

    const volumeTotals = volumeAgg[0] || {};
    const volumeStats = {
      total: volumeTotals.total || 0,
      published: volumeTotals.published || 0,
      drafts: volumeTotals.drafts || 0,
      archived: volumeTotals.archived || 0,
      favorites: volumeTotals.favorites || 0,
      ratings: volumeTotals.ratings || 0,
      averageRating:
        volumeTotals.ratings > 0 ? Math.round((volumeTotals.ratingPoints / volumeTotals.ratings) * 100) / 100 : 0,
      blessings: volumeTotals.blessings || 0,
      bodyLines: volumeTotals.bodyLines || 0,
      publishedBlessings: volumeTotals.publishedBlessings || 0,
      publishedBodyLines: volumeTotals.publishedBodyLines || 0,
    };

    const stats = {
      // For StatBoxRow
      habitsCompleted: habitsCompletedToday,
      booksFinished: booksFinished,
      gachaPulls: totalCollectibles,
      activeStreaks: user.currentLoginStreak || 0,
      longestLoginStreak: user.longestLoginStreak || 0,
      totalWorkouts: totalWorkouts,
      volumesPublished: volumeStats.published,
      tasksCompletedToday: tasksCompletedToday,
      tasksPending: tasksPending,
      workoutsThisWeek: workoutsThisWeek,
      totalBudget: budgetAgg.length > 0 ? budgetAgg[0].total : 0,
      taskStats,
      musicStats,
      volumeStats,
      workoutStats,
      bookStats,

      // For Widgets
      recentAcquisitions: recentAcquisitions,

      // Mock data for now, to be replaced later
      topProducts: [
        { name: "Abel Persona: Stoic", units: 210 },
        { name: "Snoopy: Joe Cool", units: 198 },
        { name: "Pokémon: Eevee", units: 188 },
        { name: "Habbo Rare: Throne", units: 130 },
      ],
      goals: user.yearlyGoals?.reduce(
        (acc, g) => {
          // Calculate percentage for recognized keys or pass raw data if needed
          // For backward compatibility with GoalsWidget, we map to simple percentages if names match,
          // or we can send the whole array if the frontend is updated to handle it.
          // For now, let's map 'Reading' and 'Workouts' if they exist, else send them all in a new property.
          // But dashboard expects { reading: %, workouts: % }
          const key = g.name.toLowerCase();
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          if (key.includes("reading") || key.includes("book")) acc.reading = pct;
          if (key.includes("workout") || key.includes("exercise")) acc.workouts = pct;
          return acc;
        },
        { reading: 0, workouts: 0 },
      ),
      allGoals: user.yearlyGoals || [],
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Update profile fields (bio, location, website, pronouns) ---
const updateProfileBio = async (req, res) => {
  try {
    const allowed = ["bio", "location", "website", "motto"];
    const updates = {};
    for (const k of allowed) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields supplied" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .populate({ path: "activeAbelPersona", model: "AbelPersonaBase" })
      .populate({ path: "unlockedAbelPersonas", model: "AbelPersonaBase" })
      .populate({ path: "displayedPokemon", populate: { path: "basePokemon", model: "PokemonBase" } })
      .populate({ path: "displayedSnoopyArt", populate: { path: "snoopyArtBase", model: "SnoopyArtBase" } })
      .populate({ path: "displayedHabboRares", populate: { path: "habboRareBase", model: "HabboRareBase" } })
      .populate({ path: "displayedYugiohCards", populate: { path: "yugiohCardBase", model: "YugiohCardBase" } })
      .populate({ path: "badges", populate: { path: "badgeBase", model: "BadgeBase" } })
      .populate({ path: "equippedTitle", populate: { path: "titleBase", model: "TitleBase" } });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Update Profile Bio Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Admin: Get all users (lean list) ---
const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "email username role level experience temuTokens gatillaGold wendyHearts currentLoginStreak longestLoginStreak createdAt profilePicture lastLoginDate bio location website motto bannerImage",
      )
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Admin getAllUsers Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Admin: Update user fields (role, username, level, XP, and currency balances) ---
const updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      "username",
      "role",
      "level",
      "experience",
      "temuTokens",
      "gatillaGold",
      "wendyHearts",
      "profilePicture",
      "bio",
      "location",
      "website",
      "motto",
      "bannerImage",
    ]; // safe updatable fields
    const updates = {};

    for (const k of allowed) {
      if (k in req.body) {
        // Coerce numeric fields and validate non-negativity where applicable
        if (["level", "experience", "temuTokens", "gatillaGold", "wendyHearts"].includes(k)) {
          const num = Number(req.body[k]);
          if (!Number.isFinite(num)) {
            return res.status(400).json({ success: false, message: `${k} must be a number` });
          }
          if (["experience", "temuTokens", "gatillaGold", "wendyHearts"].includes(k) && num < 0) {
            return res.status(400).json({ success: false, message: `${k} cannot be negative` });
          }
          updates[k] = num;
        } else {
          updates[k] = req.body[k];
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields supplied" });
    }
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select(
      "email username role level experience temuTokens gatillaGold wendyHearts currentLoginStreak longestLoginStreak createdAt profilePicture lastLoginDate bio location website motto bannerImage",
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Admin updateUser Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Admin: Get all badges a user has earned ---
const adminGetUserBadges = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("_id");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const earned = await UserBadge.find({ user: id })
      .populate({ path: "badgeBase", model: "BadgeBase" })
      .sort({ earnedAt: 1 });
    res.status(200).json({ success: true, data: earned });
  } catch (error) {
    console.error("Admin getUserBadges Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Admin: Grant a badge to a user ---
const adminGrantBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { badgeBaseId } = req.body;
    if (!badgeBaseId) {
      return res.status(400).json({ success: false, message: "badgeBaseId is required" });
    }
    const [user, badge] = await Promise.all([
      User.findById(id).select("badges"),
      BadgeBase.findById(badgeBaseId).select("_id badgeId name"),
    ]);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!badge) return res.status(404).json({ success: false, message: "Badge not found" });

    const existing = await UserBadge.findOne({ user: id, badgeBase: badgeBaseId });
    if (existing) {
      return res.status(400).json({ success: false, message: "User already has this badge" });
    }

    const newUserBadge = await UserBadge.create({ user: id, badgeBase: badgeBaseId });
    if (!user.badges) user.badges = [];
    user.badges.push(newUserBadge._id);
    await user.save();

    const populated = await newUserBadge.populate({ path: "badgeBase", model: "BadgeBase" });
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error("Admin grantBadge Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Admin: Reset user password ---
const resetUserPasswordAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 chars" });
    }
    const user = await User.findById(id).select("password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.password = newPassword; // will hash via pre-save hook
    await user.save();
    res.status(200).json({ success: true, message: "Password reset" });
  } catch (error) {
    console.error("Admin resetUserPassword Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- Export all functions together in one object ---
module.exports = {
  getUserCollection,
  updateDisplayedItems,
  getDashboardStats,
  setActivePersona,
  updateProfilePicture, // <-- EXPORT NEW FUNCTION
  updateProfileBanner,
  updateBannerSettings,
  setActiveBadgeCollection,
  getAllUsersAdmin,
  updateUserAdmin,
  resetUserPasswordAdmin,
  adminGetUserBadges,
  adminGrantBadge,
  // Streak endpoints
  getStreakStatus,
  tickLoginStreak,
  updateProfileBio,
  // Dashboard layout persistence
  getDashboardLayout,
  setDashboardLayout,
  getYearlyGoals,
  updateYearlyGoals,
};
