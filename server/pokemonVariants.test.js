const assert = require("node:assert/strict");
const {
  rollPokemonVariant,
  getPokemonSpritePaths,
  getShinySpritePath,
  getVariantSpritePath,
  toVariantSlug,
} = require("./pokemonVariants");

const customVariants = [{ name: "Dark" }, { name: "Crystal Form" }];
assert.equal(rollPokemonVariant(customVariants, 0), "Shiny");
assert.equal(rollPokemonVariant(customVariants, 0.049999), "Shiny");
assert.equal(rollPokemonVariant(customVariants, 0.05), "Dark");
assert.equal(rollPokemonVariant(customVariants, 0.059999), "Dark");
assert.equal(rollPokemonVariant(customVariants, 0.06), "Crystal Form");
assert.equal(rollPokemonVariant(customVariants, 0.07), "Normal");

const basePokemon = {
  forms: [
    {
      spriteGen5Animated: "/pokemon/gen5ani/mr-mime.gif",
      spriteGen6Animated: "/pokemon/gen6ani/mr-mime.gif",
      spriteGen5ShinyFilename: "mrmime.gif",
      variantSpriteFilenames: [
        { variantSlug: "dark", spriteGen5Filename: "mrmime-dark.gif" },
      ],
    },
  ],
};

assert.equal(getShinySpritePath(basePokemon.forms[0], 5), "/pokemon/gen5ani_shiny/mrmime.gif");
assert.equal(getShinySpritePath(basePokemon.forms[0], 6), "/pokemon/gen6ani_shiny/mr-mime.gif");
assert.equal(getVariantSpritePath(basePokemon.forms[0], 5, "Dark"), "/pokemon/gen5ani_dark/mrmime-dark.gif");
assert.equal(getVariantSpritePath(basePokemon.forms[0], 6, "Dark"), "/pokemon/gen6ani_dark/mr-mime.gif");
assert.equal(toVariantSlug(" Crystal Form "), "crystal-form");
assert.deepEqual(getPokemonSpritePaths(basePokemon, "Shiny", 5), [
  "/pokemon/gen5ani_shiny/mrmime.gif",
  "/pokemon/gen6ani_shiny/mr-mime.gif",
  "/pokemon/gen5ani/mr-mime.gif",
  "/pokemon/gen6ani/mr-mime.gif",
]);

console.log("Pokemon variant checks passed.");
