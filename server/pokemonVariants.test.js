const assert = require("node:assert/strict");
const { rollPokemonVariant, getPokemonSpritePaths, getShinySpritePath } = require("./pokemonVariants");

assert.equal(rollPokemonVariant(0), "Shiny");
assert.equal(rollPokemonVariant(0.049999), "Shiny");
assert.equal(rollPokemonVariant(0.05), "Normal");
assert.equal(rollPokemonVariant(0.999999), "Normal");

const basePokemon = {
  forms: [
    {
      spriteGen5Animated: "/pokemon/gen5ani/mr-mime.gif",
      spriteGen6Animated: "/pokemon/gen6ani/mr-mime.gif",
      spriteGen5ShinyFilename: "mrmime.gif",
    },
  ],
};

assert.equal(getShinySpritePath(basePokemon.forms[0], 5), "/pokemon/gen5ani_shiny/mrmime.gif");
assert.equal(getShinySpritePath(basePokemon.forms[0], 6), "/pokemon/gen6ani_shiny/mr-mime.gif");
assert.deepEqual(getPokemonSpritePaths(basePokemon, "Shiny", 5), [
  "/pokemon/gen5ani_shiny/mrmime.gif",
  "/pokemon/gen6ani_shiny/mr-mime.gif",
  "/pokemon/gen5ani/mr-mime.gif",
  "/pokemon/gen6ani/mr-mime.gif",
]);

console.log("Pokemon variant checks passed.");
