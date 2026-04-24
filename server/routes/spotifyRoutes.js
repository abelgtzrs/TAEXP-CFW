const express = require("express");
const router = express.Router();
const {
  getSpotifyAuthUrl,
  handleSpotifyCallback,
  getCurrentlyPlaying,
  syncRecentTracks,
  getRecentlyPlayed,
  getSpotifyStats,
  getArtistDetail,
  getAlbumDetail,
  getTrackDetail,
  getFullList,
} = require("../controllers/spotifyController");
const { protect } = require("../middleware/authMiddleware");

// This route doesn't need 'protect' as it handles the callback with a state param
router.get("/callback", handleSpotifyCallback);

// These routes require the user to be logged into our app first
router.get("/login", protect, getSpotifyAuthUrl);
router.get("/currently-playing", protect, getCurrentlyPlaying);
router.get("/recently-played", protect, getRecentlyPlayed);
router.get("/stats", protect, getSpotifyStats);
router.post("/sync", protect, syncRecentTracks);
router.get("/artist-detail", protect, getArtistDetail);
router.get("/album-detail", protect, getAlbumDetail);
router.get("/track-detail", protect, getTrackDetail);
router.get("/full-list", protect, getFullList);

module.exports = router;
