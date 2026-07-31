const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  searchMovies,
  searchGames,
  getMediaItems,
  addMediaItem,
  updateMediaItem,
  deleteMediaItem,
} = require("../controllers/mediaController");

router.use(protect);

router.get("/search/movies", searchMovies);
router.get("/search/games", searchGames);
router.route("/").get(getMediaItems).post(addMediaItem);
router.route("/:id").put(updateMediaItem).delete(deleteMediaItem);

module.exports = router;
