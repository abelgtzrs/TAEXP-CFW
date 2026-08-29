const SHINY_RATE = 0.05;

const rollPokemonVariant = (randomValue = Math.random()) => (randomValue < SHINY_RATE ? "Shiny" : "Normal");

const getShinySpritePath = (form, generation) => {
  const regularPath = form?.[`spriteGen${generation}Animated`];
  const override = form?.[`spriteGen${generation}ShinyFilename`]?.trim();
  const filename = override || regularPath?.split(/[\\/]/).pop();
  return filename ? `/pokemon/gen${generation}ani_shiny/${filename}` : null;
};

const getPokemonSpritePaths = (basePokemon, variant = "Normal", preferredGeneration = 5) => {
  const form = basePokemon?.forms?.[0];
  if (!form) return [];

  const generations = preferredGeneration === 6 ? [6, 5] : [5, 6];
  const paths = [];
  if (variant === "Shiny") {
    paths.push(...generations.map((generation) => getShinySpritePath(form, generation)));
  }
  paths.push(...generations.map((generation) => form[`spriteGen${generation}Animated`]));

  return [...new Set(paths.filter(Boolean))];
};

module.exports = { rollPokemonVariant, getPokemonSpritePaths, getShinySpritePath };
