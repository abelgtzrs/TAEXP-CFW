const express = require("express");
const router = express.Router();
const {
  getPokemonBaseById,
  updatePokemonBase,
  getPokemonChangeLogs, // <-- Import new function
  getPokemonVariants,
  createPokemonVariant,
} = require("../controllers/pokemonAdminController");

// All routes in this file are already protected by the middleware in server.js

router.route("/variants").get(getPokemonVariants).post(createPokemonVariant);
router.route("/:id").get(getPokemonBaseById).put(updatePokemonBase);

// NEW ROUTE for getting change logs
router.get("/:id/logs", getPokemonChangeLogs);

module.exports = router;
