const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

// --- Load ALL your models here ---
require("./models/User");
const PokemonBase = require("./models/PokemonBase");
// ... require all other models you have created ...

// --- NEW: Database Connection Function ---
// This async function handles connecting to the database and waits for it to finish.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeder...");
  } catch (err) {
    console.error("Seeder DB Connection Error:", err);
    process.exit(1); // Exit if we can't connect
  }
};

/**
 * Capitalizes the first letter of a string.
 * @param {string} s - The input string.
 * @returns {string}
 */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Transforms the raw Pokémon data from your JSON file into our schema format.
 * @param {Array<object>} rawData - The array of Pokémon from your local JSON file.
 * @returns {Array<object>} - The transformed data ready for MongoDB.
 */
const transformPokemonData = (rawData) => {
  return rawData.map((p) => {
    // Clean up the description text
    const cleanDescription = p.description ? p.description.replace(/[\n\f]/g, " ") : "No description available.";

    // Capitalize base types
    const baseTypes = p.baseTypes.map((t) => capitalize(t));

    // Transform the forms array
    const forms = p.forms.map((f) => ({
      formName: capitalize(f.formName),
      // The form's types will be the same as the base Pokémon's types
      types: baseTypes,
      spriteGen5Animated: f.spriteGen5Animated,
      spriteGen6Animated: f.spriteGen6Animated,
      spriteGen5ShinyFilename: f.spriteGen5ShinyFilename,
      spriteGen6ShinyFilename: f.spriteGen6ShinyFilename,
      variantSpriteFilenames: f.variantSpriteFilenames || [],
    }));

    // --- Evolution Stage & Paths (with limitations) ---
    // Since the source data is incomplete, we will have to make some assumptions.
    // This is a very simplified calculation and will NOT be accurate for most Pokémon.
    // It's a placeholder until better evolution data is provided.
    let evolutionStage = 1; // Assume stage 1 by default
    let evolutionPaths = []; // Will be empty as the source data is just a URL

    return {
      speciesId: p.speciesId,
      name: capitalize(p.name),
      generation: p.generation,
      baseTypes: baseTypes,
      isLegendary: p.isLegendary,
      isMythical: p.isMythical,
      isStarter: p.isStarter,
      description: cleanDescription,
      forms: forms,
      evolutionStage: evolutionStage, // Placeholder value
      evolutionPaths: evolutionPaths, // Will be empty
    };
  });
};

// --- Main Seeder Functions ---

const importData = async () => {
  try {
    // Read your local JSON file
    const rawPokemonData = JSON.parse(fs.readFileSync(`${__dirname}/data/pokemon_db_local.json`, "utf-8"));

    // Transform the data to fit our schema
    const transformedData = transformPokemonData(rawPokemonData);

    // Clear existing Pokémon data and insert the new, transformed data
    console.log("Deleting existing Pokémon data...");
    await PokemonBase.deleteMany();

    console.log("Importing new transformed Pokémon data...");
    await PokemonBase.create(transformedData);

    console.log("Pokémon Data Imported Successfully!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await PokemonBase.deleteMany();
    console.log("Pokémon Data Destroyed!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// --- NEW: Main Execution Flow ---
// This main async function ensures we connect to the DB *before* doing anything else.
const run = async () => {
  await connectDB();

  if (process.argv[2] === "-i") {
    await importData();
  } else if (process.argv[2] === "-d") {
    await deleteData();
  } else {
    console.log("Please use -i to import data or -d to delete data.");
  }

  // Disconnect from the database when done.
  await mongoose.disconnect();
  console.log("MongoDB Disconnected.");
};

run();
