// server/controllers/strokesController.js
const StrokesSong = require("../models/StrokesSong");
const StrokesAlbum = require("../models/StrokesAlbum");

const normalizeLyrics = (lyrics) => {
  if (!Array.isArray(lyrics)) return [];
  return lyrics.map((line) => String(line || "").trim()).filter(Boolean);
};

// @desc    Get a random Strokes song with its album info
// @route   GET /api/strokes/random
// @access  Public
exports.getRandomSong = async (req, res) => {
  try {
    // Use an aggregation pipeline to efficiently get a random document
    const randomSong = await StrokesSong.aggregate([{ $sample: { size: 1 } }]);

    if (!randomSong || randomSong.length === 0) {
      return res.status(404).json({ success: false, message: "No songs found in the database." });
    }

    // The result from aggregate is plain JSON, so we need to manually populate the album info
    await StrokesSong.populate(randomSong, { path: "album", model: StrokesAlbum });

    res.status(200).json({ success: true, data: randomSong[0] });
  } catch (error) {
    console.error("Error fetching random song:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    List all songs with album info
// @route   GET /api/admin/strokes/songs
// @access  Admin
exports.listSongs = async (req, res) => {
  try {
    const songs = await StrokesSong.find({}).populate("album", "name year").sort({ title: 1 }).lean();

    res.json({ success: true, items: songs });
  } catch (error) {
    console.error("Error listing strokes songs:", error);
    res.status(500).json({ success: false, message: "Failed to list songs." });
  }
};

// @desc    List all albums for song editor
// @route   GET /api/admin/strokes/albums
// @access  Admin
exports.listAlbums = async (req, res) => {
  try {
    const albums = await StrokesAlbum.find({}).sort({ year: 1, name: 1 }).lean();
    res.json({ success: true, items: albums });
  } catch (error) {
    console.error("Error listing strokes albums:", error);
    res.status(500).json({ success: false, message: "Failed to list albums." });
  }
};

// @desc    Create a strokes album
// @route   POST /api/admin/strokes/albums
// @access  Admin
exports.createAlbum = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const year = Number(req.body?.year);
    const coverImageUrl = String(req.body?.coverImageUrl || "").trim();

    if (!name) return res.status(400).json({ success: false, message: "Album name is required." });
    if (!Number.isFinite(year)) return res.status(400).json({ success: false, message: "Album year is required." });
    if (!coverImageUrl) return res.status(400).json({ success: false, message: "Album cover URL is required." });

    const created = await StrokesAlbum.create({ name, year, coverImageUrl });
    res.status(201).json({ success: true, item: created });
  } catch (error) {
    console.error("Error creating strokes album:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to create album." });
  }
};

// @desc    Update a strokes album
// @route   PUT /api/admin/strokes/albums/:id
// @access  Admin
exports.updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      const name = String(req.body.name || "").trim();
      if (!name) return res.status(400).json({ success: false, message: "Album name is required." });
      payload.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "year")) {
      const year = Number(req.body.year);
      if (!Number.isFinite(year)) return res.status(400).json({ success: false, message: "Album year is required." });
      payload.year = year;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "coverImageUrl")) {
      const coverImageUrl = String(req.body.coverImageUrl || "").trim();
      if (!coverImageUrl) {
        return res.status(400).json({ success: false, message: "Album cover URL is required." });
      }
      payload.coverImageUrl = coverImageUrl;
    }

    const updated = await StrokesAlbum.findByIdAndUpdate(id, payload, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: "Album not found." });

    res.json({ success: true, item: updated });
  } catch (error) {
    console.error("Error updating strokes album:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update album." });
  }
};

// @desc    Delete a strokes album
// @route   DELETE /api/admin/strokes/albums/:id
// @access  Admin
exports.deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;
    const songsUsingAlbum = await StrokesSong.countDocuments({ album: id });
    if (songsUsingAlbum > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete album while ${songsUsingAlbum} song(s) still use it.`,
      });
    }

    const deleted = await StrokesAlbum.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Album not found." });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting strokes album:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to delete album." });
  }
};

// @desc    Create a strokes song
// @route   POST /api/admin/strokes/songs
// @access  Admin
exports.createSong = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const album = req.body?.album;
    const lyrics = normalizeLyrics(req.body?.lyrics);

    if (!title) return res.status(400).json({ success: false, message: "Title is required." });
    if (!album) return res.status(400).json({ success: false, message: "Album is required." });

    const albumExists = await StrokesAlbum.exists({ _id: album });
    if (!albumExists) {
      return res.status(400).json({ success: false, message: "Invalid album selection." });
    }

    const created = await StrokesSong.create({ title, album, lyrics });
    const item = await StrokesSong.findById(created._id).populate("album", "name year").lean();

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error("Error creating strokes song:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to create song." });
  }
};

// @desc    Update a strokes song
// @route   PUT /api/admin/strokes/songs/:id
// @access  Admin
exports.updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      const title = String(req.body.title || "").trim();
      if (!title) return res.status(400).json({ success: false, message: "Title is required." });
      payload.title = title;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "album")) {
      const album = req.body.album;
      if (!album) return res.status(400).json({ success: false, message: "Album is required." });

      const albumExists = await StrokesAlbum.exists({ _id: album });
      if (!albumExists) {
        return res.status(400).json({ success: false, message: "Invalid album selection." });
      }
      payload.album = album;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "lyrics")) {
      payload.lyrics = normalizeLyrics(req.body.lyrics);
    }

    const updated = await StrokesSong.findByIdAndUpdate(id, payload, { new: true })
      .populate("album", "name year")
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }

    res.json({ success: true, item: updated });
  } catch (error) {
    console.error("Error updating strokes song:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to update song." });
  }
};

// @desc    Delete a strokes song
// @route   DELETE /api/admin/strokes/songs/:id
// @access  Admin
exports.deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StrokesSong.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Song not found." });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting strokes song:", error);
    res.status(400).json({ success: false, message: error.message || "Failed to delete song." });
  }
};
