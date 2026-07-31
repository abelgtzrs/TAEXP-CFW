const axios = require("axios");
const MediaItem = require("../models/userSpecific/MediaItems");

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w342";

const RAWG_API_KEY = process.env.RAWG_API_KEY || "";
const RAWG_BASE_URL = "https://api.rawg.io/api";

const hasTmdbCredentials = () => Boolean(TMDB_API_KEY);
const hasRawgCredentials = () => Boolean(RAWG_API_KEY);

// @desc    Search TMDB for movies matching a query
// @route   GET /api/media/search/movies?query=...
exports.searchMovies = async (req, res) => {
  const query = (req.query.query || "").trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  if (!query) {
    return res.status(400).json({ success: false, message: "A search query is required." });
  }
  if (!hasTmdbCredentials()) {
    return res.status(503).json({ success: false, message: "Movie search is not configured on the server." });
  }

  try {
    const { data } = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query, include_adult: false, page },
      timeout: 8000,
    });

    const results = (data.results || []).map((movie) => ({
      externalId: String(movie.id),
      title: movie.title,
      releaseYear: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
      coverImageUrl: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : "",
      overview: movie.overview || "",
    }));

    res.json({ success: true, data: results, page, hasMore: page < (data.total_pages || 1) });
  } catch (error) {
    console.error("TMDB search error:", error.response?.data || error.message);
    res.status(502).json({ success: false, message: "Failed to search movies." });
  }
};

// @desc    Search RAWG for games matching a query
// @route   GET /api/media/search/games?query=...
exports.searchGames = async (req, res) => {
  const query = (req.query.query || "").trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  if (!query) {
    return res.status(400).json({ success: false, message: "A search query is required." });
  }
  if (!hasRawgCredentials()) {
    return res.status(503).json({ success: false, message: "Game search is not configured on the server." });
  }

  try {
    const { data } = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: { key: RAWG_API_KEY, search: query, page_size: 20, page },
      timeout: 8000,
    });

    const results = (data.results || []).map((game) => ({
      externalId: String(game.id),
      title: game.name,
      releaseYear: game.released ? Number(game.released.slice(0, 4)) : null,
      coverImageUrl: game.background_image || "",
      platformOrNetwork: (game.platforms || [])
        .map((p) => p.platform?.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(", "),
      genre: (game.genres || []).map((g) => g.name),
    }));

    res.json({ success: true, data: results, page, hasMore: Boolean(data.next) });
  } catch (error) {
    console.error("RAWG search error:", error.response?.data || error.message);
    res.status(502).json({ success: false, message: "Failed to search games." });
  }
};

// @desc    Get the user's media items, optionally filtered by mediaType
// @route   GET /api/media?mediaType=movie
exports.getMediaItems = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.mediaType) filter.mediaType = req.query.mediaType;

    const items = await MediaItem.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not fetch media items." });
  }
};

// @desc    Add a movie or game to the user's log/watchlist
// @route   POST /api/media
exports.addMediaItem = async (req, res) => {
  try {
    const { mediaType, title } = req.body;
    if (!mediaType || !title) {
      return res.status(400).json({ success: false, message: "mediaType and title are required." });
    }

    const item = await MediaItem.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a media item's status, rating, notes, or progress
// @route   PUT /api/media/:id
exports.updateMediaItem = async (req, res) => {
  try {
    const item = await MediaItem.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Media item not found." });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Remove a media item from the user's log/watchlist
// @route   DELETE /api/media/:id
exports.deleteMediaItem = async (req, res) => {
  try {
    const item = await MediaItem.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!item) {
      return res.status(404).json({ success: false, message: "Media item not found." });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not delete media item." });
  }
};
