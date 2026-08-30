const generationConfig = {
  5: {
    regularField: "spriteGen5Animated",
  },
  6: {
    regularField: "spriteGen6Animated",
  },
};

export const toVariantSlug = (name) =>
  String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getVariantSpritePath = (form, generation, variant) => {
  const config = generationConfig[generation];
  const slug = toVariantSlug(variant);
  if (!config || !slug || slug === "normal") return null;

  const regularPath = form?.[config.regularField];
  const customOverride = form?.variantSpriteFilenames?.find((entry) => entry?.variantSlug === slug);
  const override =
    slug === "shiny"
      ? form?.[`spriteGen${generation}ShinyFilename`]?.trim()
      : customOverride?.[`spriteGen${generation}Filename`]?.trim();
  const filename = override || regularPath?.split(/[\\/]/).pop();
  return filename ? `/pokemon/gen${generation}ani_${slug}/${filename}` : null;
};

export const getShinySpritePath = (form, generation) => getVariantSpritePath(form, generation, "Shiny");

export const getPokemonSpritePaths = (basePokemon, variant = "Normal", preferredGeneration = 5) => {
  const form = basePokemon?.forms?.[0];
  if (!form) return [];

  const generations = preferredGeneration === 6 ? [6, 5] : [5, 6];
  const paths = [];

  if (variant !== "Normal") {
    paths.push(...generations.map((generation) => getVariantSpritePath(form, generation, variant)));
  }
  paths.push(...generations.map((generation) => form[generationConfig[generation].regularField]));

  return [...new Set(paths.filter(Boolean))];
};

export const toAssetUrl = (path, serverBaseUrl) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.replace(/^public\//, "").replace(/^\/public\//, "");
  return normalizedPath.startsWith("/") ? `${serverBaseUrl}${normalizedPath}` : `${serverBaseUrl}/${normalizedPath}`;
};

export const getPokemonSpriteUrls = (basePokemon, variant, preferredGeneration, serverBaseUrl) =>
  getPokemonSpritePaths(basePokemon, variant, preferredGeneration).map((path) => toAssetUrl(path, serverBaseUrl));

export const advancePokemonSpriteFallback = (event, urls) => {
  const image = event.currentTarget;
  const currentIndex = urls.findIndex((url) => url === image.currentSrc || url === image.src);
  const nextIndex = (currentIndex >= 0 ? currentIndex : Number(image.dataset.spriteIndex || 0)) + 1;
  if (urls[nextIndex]) {
    image.dataset.spriteIndex = String(nextIndex);
    image.src = urls[nextIndex];
    return true;
  }
  return false;
};
