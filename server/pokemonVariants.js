const SHINY_RATE = 0.05;
const CUSTOM_VARIANT_RATE = 0.01;

const toVariantSlug = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const rollPokemonVariant = (customVariants = [], randomValue = Math.random()) => {
  const basisPoints = Math.floor(randomValue * 10000);
  if (basisPoints < SHINY_RATE * 10000) return "Shiny";
  const customIndex = Math.floor((basisPoints - SHINY_RATE * 10000) / (CUSTOM_VARIANT_RATE * 10000));
  return customVariants[customIndex]?.name || "Normal";
};

const getVariantSpritePath = (form, generation, variant) => {
  const slug = toVariantSlug(variant);
  if (!slug || slug === "normal") return null;

  const regularPath = form?.[`spriteGen${generation}Animated`];
  const customOverride = form?.variantSpriteFilenames?.find((entry) => entry?.variantSlug === slug);
  const override =
    slug === "shiny"
      ? form?.[`spriteGen${generation}ShinyFilename`]?.trim()
      : customOverride?.[`spriteGen${generation}Filename`]?.trim();
  const filename = override || regularPath?.split(/[\\/]/).pop();
  return filename ? `/pokemon/gen${generation}ani_${slug}/${filename}` : null;
};

const getShinySpritePath = (form, generation) => getVariantSpritePath(form, generation, "Shiny");

const getPokemonSpritePaths = (basePokemon, variant = "Normal", preferredGeneration = 5) => {
  const form = basePokemon?.forms?.[0];
  if (!form) return [];

  const generations = preferredGeneration === 6 ? [6, 5] : [5, 6];
  const paths = [];
  if (variant !== "Normal") {
    paths.push(...generations.map((generation) => getVariantSpritePath(form, generation, variant)));
  }
  paths.push(...generations.map((generation) => form[`spriteGen${generation}Animated`]));

  return [...new Set(paths.filter(Boolean))];
};

module.exports = {
  CUSTOM_VARIANT_RATE,
  rollPokemonVariant,
  getPokemonSpritePaths,
  getShinySpritePath,
  getVariantSpritePath,
  toVariantSlug,
};
