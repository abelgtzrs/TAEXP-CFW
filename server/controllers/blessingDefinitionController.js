const BlessingDefinition = require("../models/BlessingDefinition");

exports.listBlessings = async (req, res) => {
  try {
    const items = await BlessingDefinition.find({}).sort({ index: 1, name: 1 }).lean();
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to list blessings." });
  }
};

exports.createBlessing = async (req, res) => {
  try {
    const created = await BlessingDefinition.create(req.body);
    res.status(201).json({ success: true, item: created });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateBlessing = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await BlessingDefinition.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, item: updated });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteBlessing = async (req, res) => {
  try {
    const { id } = req.params;
    await BlessingDefinition.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
