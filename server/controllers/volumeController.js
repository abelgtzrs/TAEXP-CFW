// server/controllers/volumeController.js

const Volume = require("../models/Volume"); // Import the Volume model
const BlessingDefinition = require("../models/BlessingDefinition");
/*
 * --- The Parser Function ---
 * This helper function takes a block of raw text and parses it into a structured object.
 * @param {string} rawText - The full greentext pasted by the admin.
 * @returns {object} - A structured object ready to be saved as a Volume.
 */
const parseRawGreentext = (rawText) => {
  // Split text into lines. We trim later to preserve indentation info if needed, though current model doesn't use it.
  const lines = rawText.split("\n");
  const parsedData = {
    volumeNumber: null,
    title: "",
    bodyLines: [],
    blessingIntro: "",
    blessings: [],
    dream: "",
    edition: "",
  };

  // --- Define keywords to identify sections ---
  const BLESSING_INTRO_KEYWORD = "life is";
  const DREAM_KEYWORD = "the dream of";

  // --- Parse Volume and Title from the first line ---
  const titleRegex = /Volume\s+(\d+)\s*–\s*(.*)/i;
  const firstLineMatch = lines[0]?.trim().match(titleRegex);
  if (firstLineMatch) {
    parsedData.volumeNumber = parseInt(firstLineMatch[1], 10);
    parsedData.title = firstLineMatch[2].trim();
    // FIX for Edition: Set it reliably based on the title.
    parsedData.edition = `${parsedData.title} Edition`;
  }

  // --- Find the line indexes for our key sections ---
  const blessingIntroIndex = lines.findIndex((line) => line.trim().toLowerCase().startsWith(BLESSING_INTRO_KEYWORD));
  const dreamIndex = lines.findIndex((line) => line.trim().toLowerCase().startsWith(DREAM_KEYWORD));

  // --- NEW LOGIC for determining section boundaries ---
  // Find the first occurrence of any "special" section to mark the end of the body.
  const specialSectionIndexes = [blessingIntroIndex, dreamIndex].filter((index) => index !== -1);
  const bodyEndIndex = specialSectionIndexes.length > 0 ? Math.min(...specialSectionIndexes) : lines.length;

  // Body: Lines between title (line 0) and the start of the first special section.
  // We do NOT filter empty lines, as requested in the previous fix.
  parsedData.bodyLines = lines.slice(1, bodyEndIndex).map((line) => line.trimEnd()); // Trim only trailing whitespace

  // --- Blessing Parsing ---
  if (blessingIntroIndex !== -1) {
    parsedData.blessingIntro = lines[blessingIntroIndex].trim();
    const endOfBlessings = dreamIndex > blessingIntroIndex ? dreamIndex : lines.length;
    const blessingLines = lines.slice(blessingIntroIndex + 1, endOfBlessings).filter((line) => line.trim() !== "");

    const blessingRegex = /^(.*?)(?:\s*\((.*)\))?$/;
    for (const line of blessingLines) {
      const match = line.trim().match(blessingRegex);
      if (match) {
        parsedData.blessings.push({
          item: match[1].trim(),
          description: match[2] ? match[2].trim() : "",
        });
      }
    }
  }

  if (dreamIndex !== -1) {
    parsedData.dream = lines[dreamIndex].trim();
  }

  return parsedData;
};

const normalizeBlessingItem = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const mergeWithMasterBlessings = async (parsedBlessings = []) => {
  const normalizedExisting = new Set(
    (Array.isArray(parsedBlessings) ? parsedBlessings : []).map((b) => normalizeBlessingItem(b?.item)).filter(Boolean),
  );

  const merged = (Array.isArray(parsedBlessings) ? parsedBlessings : []).map((b) => ({
    item: String(b?.item || "").trim(),
    description: String(b?.description || "").trim(),
    context: String(b?.context || "").trim(),
  }));

  const defs = await BlessingDefinition.find({ active: true }).sort({ index: 1, name: 1 }).lean();
  for (const def of defs) {
    const item = String(def?.name || "").trim();
    if (!item) continue;

    const normalized = normalizeBlessingItem(item);
    if (normalizedExisting.has(normalized)) continue;

    merged.push({
      item,
      description: String(def?.defaultDescription || "").trim(),
      context: String(def?.context || "").trim(),
    });
    normalizedExisting.add(normalized);
  }

  return merged;
};

// --- Controller Functions ---

// @desc    Create a Volume from raw text
// @route   POST /api/admin/volumes
exports.createVolumeFromRaw = async (req, res) => {
  try {
    const { rawPastedText, status } = req.body;
    if (!rawPastedText) {
      return res.status(400).json({ success: false, message: "Raw text content is required." });
    }

    // Parse the raw text into our structured format.
    const parsedData = parseRawGreentext(rawPastedText);
    parsedData.blessings = await mergeWithMasterBlessings(parsedData.blessings);

    if (!parsedData.volumeNumber || !parsedData.title) {
      return res.status(400).json({
        success: false,
        message: "Failed to parse Volume number and Title from text.",
      });
    }

    // Create the new volume in the database.
    const volume = await Volume.create({
      ...parsedData, // Spread all the parsed fields
      rawPastedText, // Also save the original text
      status: status || "draft", // Allow setting status on creation, default to draft
      createdBy: req.user.id, // Link to the admin user who created it
    });

    res.status(201).json({ success: true, data: volume });
  } catch (error) {
    console.error("Create Volume Error:", error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.volumeNumber) {
      return res.status(409).json({
        success: false,
        message: `Volume number ${error.keyValue.volumeNumber} already exists. Choose a different number or edit that volume.`,
      });
    }
    res.status(500).json({ success: false, message: "Server Error creating volume", error: error.message });
  }
};

// --- Other standard CRUD functions ---

// @desc    Get all volumes for the admin dashboard
// @route   GET /api/admin/volumes
exports.getAllVolumesForAdmin = async (req, res) => {
  try {
    const volumes = await Volume.find().populate("createdBy", "email").sort({ volumeNumber: -1 });
    res.status(200).json({ success: true, count: volumes.length, data: volumes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get a single volume by ID for admin
// @route   GET /api/admin/volumes/:id
exports.getVolumeByIdForAdmin = async (req, res) => {
  try {
    const volume = await Volume.findById(req.params.id);
    if (!volume) {
      return res.status(404).json({ success: false, message: "Volume not found" });
    }
    res.status(200).json({ success: true, data: volume });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update a volume (can re-parse raw text or update specific fields)
// @route   PUT /api/admin/volumes/:id
exports.updateVolumeFromRaw = async (req, res) => {
  try {
    const existing = await Volume.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Volume not found" });
    }

    let updateData = { ...req.body };
    const wantsReparse =
      Boolean(req.body.reparse) || (req.body.rawPastedText && req.body.rawPastedText !== existing.rawPastedText);

    if (wantsReparse && req.body.rawPastedText) {
      const parsedData = parseRawGreentext(req.body.rawPastedText);
      // Preserve explicitly edited fields overriding parsed output
      updateData = { ...parsedData, ...updateData };
    } else {
      // If not reparsing, don't accidentally overwrite rawPastedText to empty
      if (!req.body.rawPastedText) delete updateData.rawPastedText;
    }

    // Never allow client to modify immutable properties directly
    delete updateData._id;
    delete updateData.createdBy;

    // If user changed volumeNumber to a brand new one, create a new record instead of overwriting
    const requestedNumber = updateData.volumeNumber ?? existing.volumeNumber;
    const volumeNumberChanged = requestedNumber !== existing.volumeNumber;
    if (volumeNumberChanged) {
      const conflict = await Volume.findOne({ volumeNumber: requestedNumber });
      if (!conflict) {
        // Duplicate path: build new volume using merged data
        const newDocData = {
          ...existing.toObject(), // start from existing data
          ...updateData, // apply updates
          volumeNumber: requestedNumber,
          rawPastedText: updateData.rawPastedText || existing.rawPastedText,
          createdBy: existing.createdBy,
          _id: undefined, // ensure new
        };
        // Remove Mongo/system fields
        delete newDocData._id;
        delete newDocData.createdAt;
        delete newDocData.updatedAt;
        const created = await Volume.create(newDocData);
        return res.status(201).json({ success: true, duplicatedFrom: existing._id, data: created });
      }
      // If conflict exists, fall through to normal update (will hit duplicate key error if invalid)
    }

    const updated = await Volume.findByIdAndUpdate(existing._id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    // Handle duplicate volumeNumber gracefully
    if (error.code === 11000 && error.keyPattern && error.keyPattern.volumeNumber) {
      return res.status(409).json({
        success: false,
        message: `Volume number ${error.keyValue.volumeNumber} already exists.`,
      });
    }
    // Validation errors (e.g., missing required fields on blessings)
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Validation Error", error: error.message });
    }
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Delete a volume
// @route   DELETE /api/admin/volumes/:id
exports.deleteVolume = async (req, res) => {
  try {
    const volume = await Volume.findById(req.params.id);
    if (!volume) {
      return res.status(404).json({ success: false, message: "Volume not found" });
    }
    // Mongoose 8 removed remove(); use deleteOne() on the document or findByIdAndDelete
    await volume.deleteOne();
    res.status(200).json({ success: true, message: "Volume deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
