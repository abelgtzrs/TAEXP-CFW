import assert from "node:assert/strict";
import { getPokemonSpritePaths, getShinySpritePath } from "./pokemonSprites.js";

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
assert.deepEqual(getPokemonSpritePaths(basePokemon, "Shiny", 5), [
  "/pokemon/gen5ani_shiny/mrmime.gif",
  "/pokemon/gen6ani_shiny/mr-mime.gif",
  "/pokemon/gen5ani/mr-mime.gif",
  "/pokemon/gen6ani/mr-mime.gif",
]);
assert.deepEqual(getPokemonSpritePaths(basePokemon, "Normal", 6), [
  "/pokemon/gen6ani/mr-mime.gif",
  "/pokemon/gen5ani/mr-mime.gif",
]);

console.log("Pokemon sprite checks passed.");
