const mongoose = require("mongoose");

const AbelPersonaBaseSchema = new mongoose.Schema(
  {
    personaId: {
      // Unique identifier, e.g., "stoic_abel", "sage_abel"
      type: String,
      required: [true, "Please provide a unique Archetype ID"],
      unique: true,
      trim: true,
    },
    name: {
      // Display name, e.g., "Stoic Abel", "Sage Abel"
      type: String,
      required: [true, "Please provide the Archetype name"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    rarity: {
      // Rarity level, e.g., "common", "rare", "epic", "mythic", "transcendent"
      type: String,
      enum: ["common", "rare", "epic", "mythic", "transcendent"],
      default: "common",
    },
    colors: {
      // Object storing hex codes for the theme colors
      bg: { type: String, required: true }, // e.g., #14B8A6 (Teal)
      surface: { type: String, required: true }, // e.g., #0D9488
      primary: { type: String, required: true }, // e.g., #2DD4BF
      secondary: { type: String, required: true }, // e.g., #111827
      tertiary: { type: String, required: true }, // e.g., #E5E7EB
    },
    text: {
      // Text color definitions
      main: { type: String, default: "#FFFFFF" },
      secondary: { type: String, default: "#9CA3AF" },
      tertiary: { type: String, default: "#1F2937" },
    },
    font: {
      // Font family
      type: String,
      default: "Inter, sans-serif",
    },
    iconUrlOrKey: {
      // Optional icon representing the persona
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.AbelPersonaBase || mongoose.model("AbelPersonaBase", AbelPersonaBaseSchema);
