const mongoose = require("mongoose");

const BlessingDefinitionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true }, // slug/identifier
    name: { type: String, required: true, trim: true },
    context: { type: String, trim: true, default: "" }, // canonical guidance for AI
    defaultDescription: { type: String, trim: true, default: "" }, // optional default per-blessing description
    tags: [{ type: String, trim: true }],
    active: { type: Boolean, default: true },
    index: { type: Number, default: 0 }, // for custom ordering
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlessingDefinition", BlessingDefinitionSchema);
