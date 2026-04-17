const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getLeagueOverview,
  getTeamSeasonStats,
  searchPlayers,
  getPlayerProfile,
  getWatchlist,
  watchTeam,
  unwatchTeam,
  watchPlayer,
  unwatchPlayer,
} = require("../controllers/baseballController");

router.use(protect);

router.get("/overview", getLeagueOverview);
router.get("/teams/stats", getTeamSeasonStats);
router.get("/players/search", searchPlayers);
router.get("/players/:playerId", getPlayerProfile);
router.get("/watchlist", getWatchlist);
router.post("/watch/team", watchTeam);
router.delete("/watch/team/:teamId", unwatchTeam);
router.post("/watch/player", watchPlayer);
router.delete("/watch/player/:playerId", unwatchPlayer);

module.exports = router;
