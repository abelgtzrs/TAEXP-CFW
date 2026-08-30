const PokemonBase = require("../models/PokemonBase");
const PokemonChangeLog = require("../models/PokemonChangeLog"); // Import the new model
const PokemonVariant = require("../models/PokemonVariant");
const { toVariantSlug } = require("../pokemonVariants");

exports.getPokemonVariants = async (_req, res) => {
  try {
    const variants = await PokemonVariant.find().sort({ createdAt: 1, name: 1 });
    res.status(200).json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createPokemonVariant = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const slug = toVariantSlug(name);
    if (!name || !slug || ["normal", "shiny"].includes(slug)) {
      return res.status(400).json({ success: false, message: "Enter a valid, non-reserved variant name" });
    }
    if ((await PokemonVariant.countDocuments()) >= 95) {
      return res.status(400).json({ success: false, message: "No pull probability remains for another variant" });
    }
    if (await PokemonVariant.exists({ $or: [{ name }, { slug }] })) {
      return res.status(409).json({ success: false, message: "Variant already exists" });
    }

    const variant = await PokemonVariant.create({ name, slug });
    return res.status(201).json({ success: true, data: variant });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Variant already exists" });
    }
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors || {})[0]?.message || "Invalid variant";
      return res.status(400).json({ success: false, message });
    }
    console.error("Create Pokemon Variant Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get a single base Pokémon by its DB ID (for editing)
exports.getPokemonBaseById = async (req, res) => {
  try {
    const pokemon = await PokemonBase.findById(req.params.id);
    if (!pokemon) {
      return res.status(404).json({ success: false, message: "Pokémon not found" });
    }
    res.status(200).json({ success: true, data: pokemon });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update a base Pokémon and create a log entry
exports.updatePokemonBase = async (req, res) => {
  try {
    const pokemon = await PokemonBase.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pokemon) {
      return res.status(404).json({ success: false, message: "Pokémon not found" });
    }

    // Create a log entry for this update
    await PokemonChangeLog.create({
      pokemonBase: pokemon._id,
      adminUser: req.user.id,
      changeDescription: `Updated ${pokemon.name} (ID: ${pokemon.speciesId})`,
    });

    res.status(200).json({ success: true, data: pokemon });
  } catch (error) {
    console.error("Update Pokemon Error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// NEW FUNCTION: Get change logs for a specific Pokémon
exports.getPokemonChangeLogs = async (req, res) => {
  try {
    const logs = await PokemonChangeLog.find({ pokemonBase: req.params.id })
      .populate("adminUser", "email") // Show which admin made the change
      .sort({ createdAt: -1 })
      .limit(20); // Limit to the last 20 changes for performance

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
