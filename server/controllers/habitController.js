// server/controllers/habitController.js

const Habit = require("../models/userSpecific/Habit"); // Import Habit model
const User = require("../models/User"); // Import User model for rewards

// --- HELPER FUNCTIONS ---
const isToday = (someDate) => {
  if (!someDate) return false;
  const today = new Date();
  return (
    someDate.getDate() === today.getDate() &&
    someDate.getMonth() === today.getMonth() &&
    someDate.getFullYear() === today.getFullYear()
  );
};

const wasYesterday = (someDate) => {
  if (!someDate) return false;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  return (
    someDate.getDate() === yesterday.getDate() &&
    someDate.getMonth() === yesterday.getMonth() &&
    someDate.getFullYear() === yesterday.getFullYear()
  );
};

// --- CONTROLLER FUNCTIONS ---

// @desc    Create a new habit
// @route   POST /api/habits
exports.createHabit = async (req, res) => {
  try {
    const habit = await Habit.create({
      user: req.user.id,
      name: req.body.name,
      description: req.body.description,
    });
    res.status(201).json({ success: true, data: habit });
  } catch (error) {
    console.error("Create Habit Error:", error);
    res.status(400).json({
      success: false,
      message: "Error creating habit",
      error: error.message,
    });
  }
};

// @desc    Get all habits for logged-in user
// @route   GET /api/habits
exports.getUserHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: habits.length, data: habits });
  } catch (error) {
    console.error("Get User Habits Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// @desc    Get a single habit by its ID
// @route   GET /api/habits/:habitId
exports.getHabitById = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.habitId);

    // Make sure habit exists and belongs to the user
    if (!habit || habit.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Habit not found" });
    }

    res.status(200).json({ success: true, data: habit });
  } catch (error) {
    console.error("Get Habit By ID Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// @desc    Update a specific habit
// @route   PUT /api/habits/:habitId
exports.updateHabit = async (req, res) => {
  try {
    let habit = await Habit.findById(req.params.habitId);

    if (!habit || habit.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Habit not found or not authorized" });
    }

    habit = await Habit.findByIdAndUpdate(req.params.habitId, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: habit });
  } catch (error) {
    console.error("Update Habit Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete a specific habit
// @route   DELETE /api/habits/:habitId
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.habitId);

    if (!habit || habit.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Habit not found or not authorized" });
    }

    await habit.deleteOne();
    res.status(200).json({ success: true, message: "Habit deleted successfully", data: {} });
  } catch (error) {
    console.error("Delete Habit Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Mark a habit as complete and give rewards
// @route   POST /api/habits/:habitId/complete
exports.completeHabit = async (req, res) => {
  try {
    // Find both the habit to update and the user to reward in parallel.
    const [habit, user] = await Promise.all([Habit.findById(req.params.habitId), User.findById(req.user.id)]);

    if (!habit) {
      return res.status(404).json({ success: false, message: "Habit not found" });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (typeof user.xpToNextLevel !== "number" || isNaN(user.xpToNextLevel)) {
      user.xpToNextLevel = 100;
    }

    // Security check: User must own the habit.
    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    // Prevent completing the same habit multiple times in one day.
    if (isToday(habit.lastCompletedDate)) {
      return res.status(400).json({ success: false, message: "Habit already completed today" });
    }

    // --- Update Streak Logic ---
    if (wasYesterday(habit.lastCompletedDate)) {
      habit.streak += 1;
    } else {
      habit.streak = 1;
    }
    if (habit.streak > habit.longestStreak) {
      habit.longestStreak = habit.streak;
    }
    habit.lastCompletedDate = new Date();

    // --- Reward Logic ---
    const XP_AWARD = 10;
    const TEMU_TOKENS_AWARD = 1;
    // The daily cap logic would go here. For now, we award on every valid completion.

    user.temuTokens = (user.temuTokens || 0) + TEMU_TOKENS_AWARD;
    user.experience = (user.experience || 0) + XP_AWARD;

    // Check for user level up.
    if (user.experience >= user.xpToNextLevel) {
      user.level += 1;
      user.experience -= user.xpToNextLevel;
      user.xpToNextLevel = Math.floor(user.xpToNextLevel * 1.25);
    }

    // Save both documents. Using Promise.all is efficient.
    const [updatedHabit, updatedUser] = await Promise.all([habit.save(), user.save()]);

    // Populate activeAbelPersona so the client doesn't overwrite the theme with a raw ObjectId.
    await updatedUser.populate({ path: "activeAbelPersona", model: "AbelPersonaBase" });

    // Create a user object to send back, excluding the password
    const userResponse = { ...updatedUser.toObject() };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: `Habit completed! +${XP_AWARD} XP, +${TEMU_TOKENS_AWARD} Temu Tokens.`,
      habitData: updatedHabit,
      userData: userResponse, // Sending back the full updated user state
    });
  } catch (error) {
    console.error("Complete Habit Error:", error);
    res.status(500).json({ success: false, message: "Server Error while completing habit" });
  }
};
