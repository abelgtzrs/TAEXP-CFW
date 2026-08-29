const mongoose = require("mongoose");

// Sub-schema for different evolution methods
const EvolutionPathSchema = new mongoose.Schema(
  {
    toSpeciesId: { type: Number, required: true },
    method: {
      type: String,
      required: true,
      // e.g., 'level-up', 'use-item', 'trade', 'level-up-with-high-friendship'
    },
    detail: {
      type: mongoose.Schema.Types.Mixed, // Can be a number (level) or string (item name)
      required: true,
    },
  },
  { _id: false }
);

// This sub-schema defines each individual form of a Pokémon.
const PokemonFormSchema = new mongoose.Schema(
  {
    formName: { type: String, required: true, trim: true },
    types: [{ type: String, required: true }],
    spriteGen5Animated: { type: String },
    spriteGen6Animated: { type: String },
    spriteGen5ShinyFilename: { type: String, trim: true },
    spriteGen6ShinyFilename: { type: String, trim: true },
  },
  { _id: false }
);

const PokemonBaseSchema = new mongoose.Schema(
  {
    speciesId: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, unique: true },
    generation: { type: Number, required: true },
    baseTypes: [{ type: String, required: true }],
    isLegendary: { type: Boolean, default: false },
    isMythical: { type: Boolean, default: false },
    isStarter: { type: Boolean, default: false },
    description: { type: String, default: "" },

    // The 'forms' array holds all variations, including the default one.
    forms: {
      type: [PokemonFormSchema],
      required: true,
    },

    // --- REPLACED EVOLUTION FIELDS ---
    // This array can now hold multiple evolution paths.
    evolutionPaths: {
      type: [EvolutionPathSchema],
      default: [],
    },
  },
  { timestamps: true }
);

PokemonBaseSchema.index({ name: "text" });

module.exports = mongoose.models.PokemonBase || mongoose.model("PokemonBase", PokemonBaseSchema);
