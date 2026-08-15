// server/controllers/workoutLogController.js

const WorkoutLog = require("../models/userSpecific/WorkoutLog"); // Import the WorkoutLog model.
const User = require("../models/User"); // Import User model for rewards.
const ExerciseDefinition = require("../models/ExerciseDefinition");
const { awardExperience } = require("../accountProgression");
const { calculateWorkoutGold, getRewardDayRange } = require("../workoutRewards");

// @desc    Create a new workout log
// @route   POST /api/workouts
exports.createWorkoutLog = async (req, res) => {
  try {
    const { date, workoutName, durationSessionMinutes, exercises, overallFeeling, notesSession } = req.body;

    if (!exercises || exercises.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A workout log must contain at least one exercise.",
      });
    }

    const XP_PER_SET = 5; // Example: 5 XP per set logged
    const totalSets = exercises.reduce((acc, curr) => acc + (curr.sets ? curr.sets.length : 0), 0);
    const baseXpAwarded = totalSets * XP_PER_SET;

    // Find the user to give them their reward.
    const rewardDay = getRewardDayRange();
    const [user, dailyAwards] = await Promise.all([
      User.findById(req.user.id),
      WorkoutLog.aggregate([
        {
          $match: {
            user: req.user._id,
            createdAt: {
              $gte: rewardDay.start,
              $lt: rewardDay.end,
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$gatillaGoldAwarded" } } },
      ]),
    ]);
    const alreadyAwardedToday = dailyAwards[0]?.total || 0;
    const totalGatillaGoldAwarded = calculateWorkoutGold(exercises, alreadyAwardedToday);

    // Add the rewards.
    user.gatillaGold += totalGatillaGoldAwarded;
    const xpReward = awardExperience(user, baseXpAwarded);

    // --- Save to Database ---
    const newLog = await WorkoutLog.create({
      user: req.user.id,
      date,
      workoutName,
      durationSessionMinutes,
      exercises,
      overallFeeling,
      notesSession,
      gatillaGoldAwarded: totalGatillaGoldAwarded,
    });
    await user.save();

    // Send a successful response.
    res.status(201).json({
      success: true,
      message: `Workout logged! +${xpReward.xpAwarded} XP, +${totalGatillaGoldAwarded} Gatilla Gold!`,
      data: newLog,
    });
  } catch (error) {
    console.error("Create Workout Log Error:", error);
    res.status(400).json({
      success: false,
      message: "Error creating workout log",
      error: error.message,
    });
  }
};

// --- Other CRUD Functions (Get, Update, Delete) ---

// @desc    Get all workout logs for a user
// @route   GET /api/workouts
exports.getUserWorkoutLogs = async (req, res) => {
  try {
    // Find all logs for the user, sort by most recent date.
    // .populate() will replace the exerciseDefinition ObjectId with the actual document from the ExerciseDefinition collection.
    const logs = await WorkoutLog.find({ user: req.user.id })
      .populate("exercises.exerciseDefinition", "name exerciseType") // Populate name and type of exercise
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get a single workout log by ID
// @route   GET /api/workouts/:logId
exports.getWorkoutLogById = async (req, res) => {
  try {
    const log = await WorkoutLog.findById(req.params.logId).populate("exercises.exerciseDefinition"); // Populate with full exercise details

    if (!log || log.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Workout log not found" });
    }

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update a workout log
// @route   PUT /api/workouts/:logId
exports.updateWorkoutLog = async (req, res) => {
  // Note: Updating a log does not typically re-award currency/XP.
  try {
    let log = await WorkoutLog.findById(req.params.logId);

    if (!log || log.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Workout log not found" });
    }

    log = await WorkoutLog.findByIdAndUpdate(req.params.logId, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete a workout log
// @route   DELETE /api/workouts/:logId
exports.deleteWorkoutLog = async (req, res) => {
  // Note: Deleting a log should ideally also reverse any awards, but that is complex.
  // For MVP, we will just delete the log.
  try {
    const log = await WorkoutLog.findById(req.params.logId);

    if (!log || log.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Workout log not found" });
    }

    await log.remove();
    res.status(200).json({ success: true, message: "Workout log deleted", data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all workout logs for a user
// @route   GET /api/workouts
exports.getUserWorkoutLogs = async (req, res) => {
  try {
    // --- THIS IS THE UPDATE ---
    // We check for a 'limit' query parameter in the URL (e.g., /api/workouts?limit=1)
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;

    let query = WorkoutLog.find({ user: req.user.id })
      .populate("exercises.exerciseDefinition", "name exerciseType")
      .sort({ date: -1 });

    // If a limit is provided, apply it to the query.
    if (limit > 0) {
      query = query.limit(limit);
    }

    const logs = await query;

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Bulk import workout logs from structured JSON lines
// @route   POST /api/workouts/bulk-import
exports.bulkImportWorkoutLogs = async (req, res) => {
  try {
    const rawBody = req.body;

    // Accept either an array of sessions or newline-separated JSON objects
    let sessions = [];
    if (Array.isArray(rawBody)) {
      sessions = rawBody;
    } else if (typeof rawBody === "string") {
      sessions = rawBody
        .split(/\r?\n/) // split by lines
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } else if (rawBody && rawBody.sessions) {
      sessions = rawBody.sessions;
    } else {
      // Also support form field 'text'
      if (typeof req.body?.text === "string") {
        sessions = req.body.text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => JSON.parse(line));
      } else {
        return res.status(400).json({ success: false, message: "Provide array or JSON lines payload" });
      }
    }

    const createdLogs = [];
    const createdDefinitions = [];

    const mapUnit = (u) => {
      const v = String(u || "kg").toLowerCase();
      if (v === "lb" || v === "lbs") return "lbs";
      if (v === "kg" || v === "kgs") return "kg";
      if (v.includes("body")) return "bodyweight";
      if (v.includes("band")) return "band";
      return "kg";
    };

    for (const s of sessions) {
      const date = s.date ? new Date(s.date) : new Date();
      const exPerformances = [];
      const exercises = Array.isArray(s.exercises) ? s.exercises : [];

      for (const ex of exercises) {
        const name = (ex.nameRaw || ex.name || "").trim();
        if (!name) continue;

        // Ensure ExerciseDefinition exists; create if missing with no muscle groups
        let def = await ExerciseDefinition.findOne({ name });
        if (!def) {
          def = await ExerciseDefinition.create({
            name,
            exerciseType: "Strength",
            muscleGroups: [], // explicitly none as requested
            defaultMetrics: [
              { name: "weight", unit: mapUnit(ex.unit) },
              { name: "reps", unit: "count" },
            ],
          });
          createdDefinitions.push({
            _id: def._id,
            name: def.name,
            exerciseType: def.exerciseType,
            muscleGroups: def.muscleGroups,
            equipment: def.equipment || [],
            defaultMetrics: def.defaultMetrics || [],
          });
        }

        const sets = Array.isArray(ex.sets)
          ? ex.sets.map((st) => ({
              reps: Number(st.reps) || 0,
              weight: Number(st.weight) || 0,
              weightUnit: mapUnit(ex.unit),
              notes: st.notes || undefined,
            }))
          : [];

        exPerformances.push({ exerciseDefinition: def._id, sets });
      }

      if (exPerformances.length === 0) continue;

      const log = await WorkoutLog.create({
        user: req.user.id,
        date,
        workoutName: s.workoutName || "Imported Workout",
        durationSessionMinutes: s.durationSessionMinutes || undefined,
        exercises: exPerformances,
        overallFeeling: s.overallFeeling || undefined,
        notesSession: s.notes || s.notesSession || undefined,
      });

      createdLogs.push(log);
    }

    // Populate the created logs with exercise names for client display
    const createdIds = createdLogs.map((l) => l._id);
    const populatedLogs = await WorkoutLog.find({ _id: { $in: createdIds } })
      .populate("exercises.exerciseDefinition", "name exerciseType")
      .sort({ date: -1 });

    return res.status(201).json({ success: true, count: createdLogs.length, data: populatedLogs, createdDefinitions });
  } catch (error) {
    console.error("Bulk Import Error:", error);
    return res.status(400).json({ success: false, message: error.message || "Malformed input" });
  }
};
