const AbelPersonaBase = require("../models/AbelPersonaBase");

// GET /api/admin/personas
exports.listPersonas = async (req, res) => {
  try {
    const personas = await AbelPersonaBase.find({}).sort({ name: 1 });
    res.json({ success: true, data: personas });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch Archetypes" });
  }
};

// PUT /api/admin/personas/:id
exports.updatePersona = async (req, res) => {
  try {
    const { id } = req.params;
    // Allow updating limited fields only
    const allowed = {};
    if (req.body.name) allowed.name = req.body.name;
    if (req.body.description !== undefined) allowed.description = req.body.description;
    if (req.body.font) allowed.font = req.body.font;
    if (req.body.colors) {
      allowed.colors = {};
      const c = req.body.colors;
      if (c.bg) allowed.colors.bg = c.bg;
      if (c.surface) allowed.colors.surface = c.surface;
      if (c.primary) allowed.colors.primary = c.primary;
      if (c.secondary) allowed.colors.secondary = c.secondary;
      if (c.tertiary) allowed.colors.tertiary = c.tertiary;
    }
    if (req.body.text) {
      allowed.text = {};
      const t = req.body.text;
      if (t.main) allowed.text.main = t.main;
      if (t.secondary) allowed.text.secondary = t.secondary;
      if (t.tertiary) allowed.text.tertiary = t.tertiary;
    }

    const updated = await AbelPersonaBase.findByIdAndUpdate(id, allowed, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Archetype not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Failed to update Archetype" });
  }
};
