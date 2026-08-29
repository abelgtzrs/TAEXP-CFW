const generationConfig = {
  5: {
    regularField: "spriteGen5Animated",
    shinyFilenameField: "spriteGen5ShinyFilename",
    shinyFolder: "/pokemon/gen5ani_shiny/",
  },
  6: {
    regularField: "spriteGen6Animated",
    shinyFilenameField: "spriteGen6ShinyFilename",
    shinyFolder: "/pokemon/gen6ani_shiny/",
  },
};

export const getShinySpritePath = (form, generation) => {
  const config = generationConfig[generation];
  if (!config) return null;

  const regularPath = form?.[config.regularField];
  const override = form?.[config.shinyFilenameField]?.trim();
  const filename = override || regularPath?.split(/[\\/]/).pop();
  return filename ? `${config.shinyFolder}${filename}` : null;
};

export const getPokemonSpritePaths = (basePokemon, variant = "Normal", preferredGeneration = 5) => {
  const form = basePokemon?.forms?.[0];
  if (!form) return [];

  const generations = preferredGeneration === 6 ? [6, 5] : [5, 6];
  const paths = [];

  if (variant === "Shiny") {
    paths.push(...generations.map((generation) => getShinySpritePath(form, generation)));
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
