// server/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Make sure the User model is imported
const { awardNextStreakBadge } = require("../utils/badgeAwardUtils");

// --- Helper function to generate JWT ---
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { email, username, password, role } = req.body; // role optional

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Determine role safely
    const allowedRoles = ["user", "admin", "wife_of_the_year"]; // Mirror schema enum
    let assignedRole = "user"; // Default

    if (role && allowedRoles.includes(role)) {
      assignedRole = role;
    }

    // Prevent arbitrary creation of additional admins: allow 'admin' only if no admin exists yet
    if (assignedRole === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        assignedRole = "user"; // downgrade silently or you could return 403
      }
    }

    user = await User.create({
      email,
      username,
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id, user.role);
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(201).json({ success: true, token, data: userResponse });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Server Error during registration" });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // --- Logic to update login streak ---
    const today = new Date();
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    let wasYesterday = false;
    if (lastLogin) {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (lastLogin.toDateString() === yesterday.toDateString()) {
        wasYesterday = true;
      }
    }

    // If it's a new day since the last login
    if (!lastLogin || lastLogin.toDateString() !== today.toDateString()) {
      if (wasYesterday) {
        user.currentLoginStreak += 1; // Continue streak
      } else {
        user.currentLoginStreak = 1; // Reset or start streak
      }

      // Update longest streak if needed
      if (user.currentLoginStreak > user.longestLoginStreak) {
        user.longestLoginStreak = user.currentLoginStreak;
      }

      // Award next badge from active collection every 5 streak days (idempotent)
      try {
        const shouldAward = user.currentLoginStreak > 0 && user.currentLoginStreak % 5 === 0;
        const notAlreadyAwardedForThisStreak = (user.lastBadgeUnlockedStreak || 0) !== user.currentLoginStreak;
        if (shouldAward && notAlreadyAwardedForThisStreak) {
          user.__awardedBadge = await awardNextStreakBadge(user);
        }
      } catch (awardErr) {
        console.warn("Badge award on login failed:", awardErr.message);
      }
    }
    user.lastLoginDate = today;
    await user.save({ validateBeforeSave: false }); // Save streak and date without re-validating password etc.

    const token = generateToken(user._id, user.role);
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(200).json({ success: true, token, data: userResponse, awardedBadge: user.__awardedBadge || null });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server Error during login" });
  }
};

// @desc    Get current logged-in user's data for profile page
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // The populated query to get all necessary data for the profile page
    const user = await User.findById(userId)
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ success: false, message: "Server Error fetching user data" });
  }
};

// Export all controller functions together in one object.
module.exports = {
  registerUser,
  loginUser,
  getMe,
};
