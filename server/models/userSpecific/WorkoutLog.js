// server/models/userSpecific/WorkoutLog.js

const mongoose = require("mongoose");

// First, we define a schema for an individual exercise performance within a log.
// This is not a model itself, but a blueprint for subdocuments in the WorkoutLog.
const ExercisePerformanceSchema = new mongoose.Schema(
  {
    // A reference to the base definition of the exercise.
    exerciseDefinition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExerciseDefinition", // Links to our static ExerciseDefinition model.
      required: true,
    },

    // --- Metrics for Strength Training ---
    // An array to hold details for each set performed.
    sets: [
      {
        reps: { type: Number, min: 0 },
        weight: { type: Number, min: 0 },
        // The unit used for the weight.
        weightUnit: {
          type: String,
          enum: ["kg", "lbs", "bodyweight", "band"],
          default: "kg",
        },
        notes: String, // Optional notes for a specific set, e.g., "Warm-up set".
      },
    ],

    // --- Metrics for Cardio Training ---
    distance: { type: Number, min: 0 },
    distanceUnit: { type: String, enum: ["km", "miles", "meters", "laps"] },
    durationExerciseMinutes: { type: Number, min: 0 }, // Duration for this specific cardio exercise.

    // --- General Metrics ---
    caloriesBurned: { type: Number, min: 0 }, // Optional, estimated value.
    notes: String, // General notes for this specific exercise performance.
  },
  {
    // We set _id to false because we don't need a separate ObjectId for each exercise performance
    // within a single workout log unless we plan to query them individually.
    _id: false,
  }
);

// Now, we define the main schema for the entire workout session.
const WorkoutLogSchema = new mongoose.Schema(
  {
    // Link to the User who owns this workout log.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // The date the workout was performed. Defaults to when the log is created.
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // An optional name for the session, e.g., "Morning Chest Day", "Weekend Long Run".
    workoutName: {
      type: String,
      trim: true,
      default: "Workout Session",
    },

    // The total duration of the workout session in minutes.
    durationSessionMinutes: {
      type: Number,
      min: 0,
    },

    // This is an array that will contain documents matching the ExercisePerformanceSchema.
    exercises: [ExercisePerformanceSchema],

    // An optional field for the user to rate how they felt during the session.
    overallFeeling: {
      type: String,
      enum: ["great", "good", "okay", "meh", "tough", "exhausted", "nauseous"],
    },

    // General notes for the entire workout session.
    notesSession: {
      type: String,
      trim: true,
    },

    gatillaGoldAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    // This Mongoose option automatically adds `createdAt` and `updatedAt` fields.
    timestamps: true,
  }
);

// Compile the schema into a model named 'WorkoutLog' and export it.
module.exports = mongoose.model("WorkoutLog", WorkoutLogSchema);
