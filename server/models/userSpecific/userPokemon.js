// server/models/userSpecific/UserPokemon.js
const mongoose = require("mongoose");

const UserPokemonSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References the User model
      required: true,
      index: true, // Good for querying user's collection
    },
    basePokemon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PokemonBase", // References the PokemonBase model
      required: true,
    },
    nickname: {
      type: String,
      trim: true,
      default: null, // User can set this
    },
    variant: {
      type: String,
      trim: true,
      default: "Normal",
    },
    currentLevel: {
      type: Number,
      default: 1, // Or based on how they are acquired (e.g., starter at lv 5)
    },
    currentXP: {
      type: Number,
      default: 0,
    },
    xpToNextLevelForPokemon: {
      type: Number,
      default: 50, // Initial XP needed for this Pokémon to level up
    },
    // We'll use User.displayedPokemon to mark if it's in the party of 6
    // isDisplayed: {
    //     type: Boolean,
    //     default: false
    // },
    obtainedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
); // Adds createdAt and updatedAt

// Ensure a user cannot own the exact same instance of a base Pokémon multiple times
// (This might be too restrictive if you allow multiple of the same species, e.g. two Pikachus.
// If multiple of same species are allowed, this unique index is not needed.
// If only one instance of a given basePokemon ID PER USER, then this works IF UserPokemon refers to a truly unique Pokemon instance.
// However, users typically CAN have multiple Pikachu. So, this compound index is probably not what we want.
// What makes a UserPokemon unique is its own _id.
// UserPokemonSchema.index({ user: 1, basePokemon: 1 }, { unique: true }); // Reconsider this

module.exports = mongoose.models.UserPokemon || mongoose.model("UserPokemon", UserPokemonSchema);
