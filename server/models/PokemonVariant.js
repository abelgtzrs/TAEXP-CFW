const mongoose = require("mongoose");

const PokemonVariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 30 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Variant slug is invalid"],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.models.PokemonVariant || mongoose.model("PokemonVariant", PokemonVariantSchema);
