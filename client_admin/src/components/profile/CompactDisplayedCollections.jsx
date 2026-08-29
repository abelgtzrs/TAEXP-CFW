import React from "react";
import { advancePokemonSpriteFallback, getPokemonSpriteUrls } from "../../utils/pokemonSprites";

const CompactDisplayedCollections = ({
  displayedPokemon = [],
  displayedSnoopyArt = [],
  displayedHabboRares = [],
  displayedYugiohCards = [],
}) => {
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];

  const getPokemonSprites = (basePokemon, item) =>
    getPokemonSpriteUrls(basePokemon, item?.variant, 6, serverBaseUrl);

  const getImageUrl = (baseItem) => {
    if (!baseItem) return null;
    let imageUrl = baseItem.imageUrl;
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http")) return imageUrl;
    // Normalize Windows backslashes and remove public prefixes
    imageUrl = imageUrl.replace(/\\/g, "/");
    imageUrl = imageUrl.replace(/^public\//, "").replace(/^\/public\//, "");
    imageUrl = imageUrl.replace(/^\//, "");
    const fullUrl = `${serverBaseUrl}/${imageUrl}`;
    if (typeof baseItem.imageUrl === "string" && /snoopy/i.test(baseItem.imageUrl)) {
      console.log("Snoopy (Compact) Debug:", {
        baseItem: baseItem.name,
        originalImageUrl: baseItem.imageUrl,
        cleanedImageUrl: imageUrl,
        serverBaseUrl,
        fullUrl,
        finalImageSrc: fullUrl,
      });
    }
    return fullUrl;
  };

  const Section = ({ title, items, baseField, getThumb }) => (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2">
      <div className="text-xs text-slate-300 font-semibold mb-1">{title}</div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {items.map((item) => {
          const base = item?.[baseField];
          const thumbs = getThumb ? getThumb(base, item) : [getImageUrl(base)].filter(Boolean);
          const thumb = thumbs[0];
          return (
            <div key={item?._id || base?._id} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 flex items-center justify-center">
                {thumb ? (
                  <img
                    src={thumb}
                    alt={base?.name || "thumb"}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      if (getThumb && advancePokemonSpriteFallback(e, thumbs)) return;
                      console.warn("Compact collection image failed to load", {
                        section: title,
                        baseField,
                        itemName: base?.name,
                        src: e.currentTarget?.src,
                        original: base?.imageUrl,
                      });
                    }}
                  />
                ) : (
                  <span className="text-slate-500 text-[10px]">[IMG]</span>
                )}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-200 truncate w-full" title={base?.name}>
                {base?.name || "Unknown"}
              </div>
              {item?.variant && item.variant !== "Normal" && (
                <div className="text-[10px] text-yellow-400">{item.variant}</div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-full text-center text-slate-400 text-xs py-3">No items displayed.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <Section title="Pokémon" items={displayedPokemon} baseField="basePokemon" getThumb={getPokemonSprites} />
      <Section title="Snoopys" items={displayedSnoopyArt} baseField="snoopyArtBase" />
      <Section title="Habbo Rares" items={displayedHabboRares} baseField="habboRareBase" />
      <Section title="Yu-Gi-Oh!" items={displayedYugiohCards} baseField="yugiohCardBase" />
    </div>
  );
};

export default CompactDisplayedCollections;
