import { useState, useRef } from "react";
import Widget from "../ui/Widget";

const DisplayedCollection = ({ title, items, baseField }) => {
  // --- THIS IS THE FIX ---
  // We ensure that 'items' is treated as an array, even if it's undefined or null.
  // We also create a new array to avoid modifying the original.
  // Normalize: remove null/undefined entries that could create leading blanks
  const displayItems = Array.isArray(items) ? items.filter((it) => it && it[baseField]) : [];

  // Fill the rest of the grid with nulls for consistent spacing.
  while (displayItems.length < 6) {
    displayItems.push(null);
  }

  // Construct the base URL for the server to correctly resolve image paths
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];

  // Helper function to get the image URL based on collection type
  const getImageUrl = (baseItem, baseField) => {
    if (!baseItem) return null;

    // Pokemon has a complex structure with forms and sprite fields
    if (baseField === "basePokemon") {
      // Try to get sprite from the first form (default form)
      const firstForm = baseItem.forms?.[0];
      const pokemonSprite = firstForm?.spriteGen6Animated || firstForm?.spriteGen5Animated || null;
      return pokemonSprite ? `${serverBaseUrl}${pokemonSprite}` : null;
    }

    // Other collections - check if it's an external URL or local path
    let imageUrl = baseItem.imageUrl;
    if (!imageUrl) return null;

    // If it's already a full URL (starts with http), return as-is
    if (imageUrl.startsWith("http")) {
      return imageUrl;
    }

    // Otherwise, it's a local path - normalize and prefix with server URL
    // Normalize Windows backslashes first
    imageUrl = imageUrl.replace(/\\/g, "/");
    // Remove leading 'public/' or '/public/' if present
    imageUrl = imageUrl.replace(/^public\//, "").replace(/^\/public\//, "");
    // Remove leading slash if present
    imageUrl = imageUrl.replace(/^\//, "");
    const fullUrl = `${serverBaseUrl}/${imageUrl}`;

    // Enhanced debug logging for local files only
    if (baseField === "habboRareBase") {
      console.log("Habbo Rare Debug:", {
        baseItem: baseItem.name,
        originalImageUrl: baseItem.imageUrl,
        cleanedImageUrl: imageUrl,
        serverBaseUrl,
        fullUrl,
        finalImageSrc: fullUrl,
      });
    }
    if (baseField === "snoopyArtBase") {
      console.log("Snoopy Debug:", {
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

  // NEW: helper to determine glow classes by item rarity/type
  const getGlowClasses = (item, baseItem) => {
    if (!item || !baseItem) return "";

    if (baseField === "basePokemon") {
      const variant = item.variant || "Normal";
      if (variant === "Shiny") return "ring-2 ring-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.65)]";
      if (baseItem.isMythical) return "ring-2 ring-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.6)]";
      if (baseItem.isLegendary) return "ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.65)]";
      return "";
    }

    if (baseField === "yugiohCardBase") {
      const rarity = (baseItem.systemRarity || "").toLowerCase();
      if (rarity.includes("ultimate")) return "ring-2 ring-violet-500 shadow-[0_0_18px_rgba(139,92,246,0.6)]";
      if (rarity.includes("secret")) return "ring-2 ring-fuchsia-500 shadow-[0_0_18px_rgba(217,70,239,0.6)]";
      if (rarity.includes("ultra")) return "ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)]";
      if (rarity.includes("super")) return "ring-2 ring-teal-400 shadow-[0_0_18px_rgba(45,212,191,0.55)]";
      if (rarity.includes("rare")) return "ring-2 ring-indigo-400 shadow-[0_0_16px_rgba(129,140,248,0.5)]";
      return "";
    }

    // Other collections can be extended here (e.g., snoopyArtBase rarity)
    return "";
  };

  // Helper to render a small tooltip content based on collection type
  const renderTooltip = (item, baseItem) => {
    if (!item || !baseItem) return null;

    if (baseField === "basePokemon") {
      const types = baseItem.baseTypes?.join(", ") || baseItem.forms?.[0]?.types?.join(", ") || "";
      const variant = item.variant || "Normal";
      const firstForm = baseItem.forms?.[0];
      const spriteGen5 = firstForm?.spriteGen5Animated;
      const spriteGen6 = firstForm?.spriteGen6Animated;
      const spriteUrl = spriteGen5
        ? `${serverBaseUrl}${spriteGen5}`
        : spriteGen6
          ? `${serverBaseUrl}${spriteGen6}`
          : null;
      return (
        <div>
          <div className="font-semibold text-slate-100">{baseItem.name}</div>
          {spriteUrl && (
            <div className="mt-2 w-full flex justify-center">
              <img src={spriteUrl} alt={`${baseItem.name} sprite`} className="h-16 w-auto object-contain" />
            </div>
          )}
          <div className="text-slate-300">Variant: {variant}</div>
          {types && <div className="text-slate-300">Type: {types}</div>}
          {baseItem.generation && <div className="text-slate-400">Gen {baseItem.generation}</div>}
          {(baseItem.isLegendary || baseItem.isMythical) && (
            <div className="mt-1 text-amber-300">{baseItem.isMythical ? "Mythical" : "Legendary"}</div>
          )}
        </div>
      );
    }

    if (baseField === "yugiohCardBase") {
      const largeImg = getImageUrl(baseItem, "yugiohCardBase");
      return (
        <div>
          <div className="font-semibold text-slate-100">{baseItem.name}</div>
          {largeImg && (
            <div className="mt-2 w-full flex justify-center">
              <img
                src={largeImg}
                alt={`${baseItem.name} large`}
                className="max-h-48 w-auto object-contain rounded-md"
              />
            </div>
          )}
          {baseItem.type && <div className="mt-2 text-slate-300">Type: {baseItem.type}</div>}
          {baseItem.systemRarity && <div className="text-slate-300">Rarity: {baseItem.systemRarity}</div>}
          {baseItem.description && (
            <div
              className="mt-2 text-slate-300 whitespace-pre-wrap break-words"
              style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              title={baseItem.description}
            >
              {baseItem.description}
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="font-semibold text-slate-100">{baseItem.name}</div>
      </div>
    );
  };

  // Tooltip hover state to control visibility without CSS-only hacks
  const [hoveredKey, setHoveredKey] = useState(null);
  const hideTimer = useRef(null);
  const handleEnter = (key) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHoveredKey(key);
  };
  const handleLeave = () => {
    hideTimer.current = setTimeout(() => setHoveredKey(null), 80);
  };

  // NEW: chunk items into rows of 6 so we can render names under matching columns
  const rows = [];
  for (let i = 0; i < displayItems.length; i += 6) {
    rows.push(displayItems.slice(i, i + 6));
  }

  return (
    <Widget title={title}>
      {rows.map((rowItems, rowIdx) => (
        <div key={`row-${rowIdx}`} className={rowIdx < rows.length - 1 ? "mb-6" : ""}>
          {/* Image grid for this row */}
          <div className="grid grid-cols-6 gap-4">
            {rowItems.map((item, index) => {
              const baseItem = item ? item[baseField] : null;
              const imageUrl = getImageUrl(baseItem, baseField);
              const glowClasses = getGlowClasses(item, baseItem);
              const cellKey = item?._id || `cell-${rowIdx}-${index}`;
              const isOpen = hoveredKey === cellKey;
              return (
                <div
                  key={cellKey}
                  className="relative text-center overflow-visible"
                  onMouseEnter={() => handleEnter(cellKey)}
                  onMouseLeave={handleLeave}
                >
                  {baseItem ? (
                    <div className="w-full aspect-square flex items-center justify-center rounded-md bg-transparent">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={baseItem.name}
                          className="max-w-full max-h-full object-contain rounded-md"
                          onError={(e) => {
                            // Helpful diagnostics in console when an image fails
                            console.warn("Collection image failed to load", {
                              title,
                              baseField,
                              itemName: baseItem?.name,
                              src: e.currentTarget?.src,
                            });
                          }}
                        />
                      ) : (
                        <div className="w-full h-full rounded-md flex items-center justify-center text-xs text-gray-500">
                          [IMG]
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center text-gray-600 text-3xl">
                      +
                    </div>
                  )}

                  {/* Tooltip above card; only visible when card hovered or tooltip hovered */}
                  {baseItem && (
                    <div
                      className={`absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 ${
                        baseField === "yugiohCardBase" ? "w-80" : "w-56"
                      } rounded-md bg-slate-900/95 p-2 text-xs transition duration-200 shadow-xl ${glowClasses} ${
                        isOpen
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-1 pointer-events-none"
                      }`}
                      onMouseEnter={() => handleEnter(cellKey)}
                      onMouseLeave={handleLeave}
                    >
                      {renderTooltip(item, baseItem)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Names grid aligned to the same 6 columns */}
          <div className="mt-2 grid grid-cols-6 gap-4 text-xs text-gray-300">
            {rowItems.map((item, index) => {
              const baseItem = item ? item[baseField] : null;
              return (
                <div key={item?._id || `name-${rowIdx}-${index}`} className="min-h-8 flex items-center justify-center">
                  {baseItem ? (
                    <span
                      className="block w-full text-center whitespace-normal break-words leading-snug"
                      title={baseItem.name}
                    >
                      {baseItem.name}
                    </span>
                  ) : (
                    <span className="block w-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Widget>
  );
};

export default DisplayedCollection;
