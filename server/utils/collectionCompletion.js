const { toVariantSlug } = require("../pokemonVariants");

const toId = (value) => String(value?._id || value || "");
const toPercentage = (owned, total) => (total > 0 ? Math.round((owned / total) * 1000) / 10 : 0);

const buildCollectionCompletion = (baseIds = [], ownedIds = []) => {
  const validIds = new Set(baseIds.map(toId).filter(Boolean));
  const owned = new Set(ownedIds.map(toId).filter((id) => validIds.has(id))).size;
  const total = validIds.size;

  return { owned, total, percentage: toPercentage(owned, total) };
};

const buildPokemonCompletion = (baseIds = [], ownedPokemon = [], configuredVariants = []) => {
  const validIds = new Set(baseIds.map(toId).filter(Boolean));
  const variants = new Map();

  const addVariant = (name, slug = toVariantSlug(name)) => {
    if (slug && !variants.has(slug)) variants.set(slug, { name, slug, ownedIds: new Set() });
  };

  addVariant("Normal", "normal");
  addVariant("Shiny", "shiny");
  configuredVariants.forEach((variant) => addVariant(variant.name, variant.slug));

  ownedPokemon.forEach((item) => {
    const name = item.variant || "Normal";
    const slug = toVariantSlug(name) || "normal";
    addVariant(name, slug);

    const baseId = toId(item.basePokemon);
    if (validIds.has(baseId)) variants.get(slug).ownedIds.add(baseId);
  });

  return {
    total: validIds.size,
    variants: [...variants.values()].map(({ name, slug, ownedIds }) => ({
      name,
      slug,
      owned: ownedIds.size,
      total: validIds.size,
      percentage: toPercentage(ownedIds.size, validIds.size),
    })),
  };
};

module.exports = { buildCollectionCompletion, buildPokemonCompletion };
