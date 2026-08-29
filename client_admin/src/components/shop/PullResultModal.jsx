import { advancePokemonSpriteFallback, getPokemonSpriteUrls } from "../../utils/pokemonSprites";

const PullResultModal = ({ result, onClose }) => {
  // If there's no result data at all, render nothing.
  if (!result) return null;

  // --- UPDATED FOR PACKS AND SINGLE ITEMS ---
  // 1. Safely access the nested 'data' object from the API response.
  const nestedData = result.data || {};
  // 2. Check for both single item and multiple items (pack)
  const { item, items } = nestedData;
  // 3. Get the 'message' from the top-level result object.
  const { message } = result;

  // 4. CRITICAL CHECK: If neither single item nor items array exists, render nothing
  if (!item && (!items || items.length === 0)) return null;

  // 5. Determine if this is a pack pull or single pull
  const isPack = items && items.length > 0;
  const displayItems = isPack ? items : [item];

  // Helper function to get display properties for any item
  // Build absolute URLs for relative images based on API base URL
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const buildImageUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    let path = url.replace(/^public\//, "").replace(/^\/public\//, "");
    if (path.startsWith("/")) return `${serverBaseUrl}${path}`;
    return `${serverBaseUrl}/${path}`;
  };

  const getDisplayProps = (item) => {
    let displayImageUrl = item.imageUrl || item.iconUrlOrKey;
    let displayImageUrls = [];

    // For Pokémon, check for sprite URLs in the forms array
    if (item.forms && item.forms.length > 0) {
      displayImageUrls = getPokemonSpriteUrls(item, item.variant, 5, serverBaseUrl);
      displayImageUrl = displayImageUrls[0];
    }
    if (!displayImageUrls.length) displayImageUrls = [buildImageUrl(displayImageUrl)].filter(Boolean);

    const displayRarity =
      item.variant && item.variant !== "Normal"
        ? item.variant
        : item.rarity || item.rarityCategory || item.systemRarity;

    return { displayImageUrl: displayImageUrls[0], displayImageUrls, displayRarity };
  };

  const rarityColor = {
    common: "text-gray-300",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    super_rare: "text-purple-400",
    ultra_rare: "text-yellow-400",
    epic: "text-purple-400",
    legendary_snoopy: "text-yellow-400",
    common_card: "text-gray-300",
    super_card: "text-purple-400",
    ultra_card: "text-yellow-400",
    common_rare: "text-gray-300",
    Common: "text-gray-300",
    Rare: "text-blue-400",
    "Super Rare": "text-purple-400",
    "Ultra Rare": "text-yellow-400",
    "Secret Rare": "text-red-400",
    "Ultimate Rare": "text-orange-400",
    Shiny: "text-yellow-300",
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`p-8 rounded-lg shadow-2xl text-center w-full mx-4 border glass-surface ${
          isPack ? "max-w-4xl" : "max-w-sm"
        }`}
        style={{ borderColor: "var(--color-primary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-text-main mb-4">{message}</h2>

        {isPack ? (
          // Pack display - grid of cards
          <div className="my-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayItems.map((item, index) => {
                const { displayImageUrl, displayImageUrls, displayRarity } = getDisplayProps(item);
                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg border glass-surface"
                    style={{ borderColor: "var(--color-primary)" }}
                  >
                    {displayImageUrl ? (
                      <img
                        src={displayImageUrl}
                        alt={item.name}
                        className="h-32 mx-auto object-contain mb-2"
                        onError={(event) => advancePokemonSpriteFallback(event, displayImageUrls)}
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-text-secondary mb-2">[No Image]</div>
                    )}
                    <p className="text-sm font-semibold text-text-main mb-1">{item.name}</p>
                    {displayRarity && (
                      <p
                        className={`font-bold uppercase text-xs ${rarityColor[displayRarity] || "text-text-secondary"}`}
                      >
                        {displayRarity.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Single item display - original layout
          <div className="my-6 p-4 rounded-lg border glass-surface" style={{ borderColor: "var(--color-primary)" }}>
            {(() => {
              const { displayImageUrl, displayImageUrls, displayRarity } = getDisplayProps(displayItems[0]);
              return (
                <>
                  {displayImageUrl ? (
                    <img
                      src={displayImageUrl}
                      alt={displayItems[0].name}
                      className="h-40 mx-auto object-contain"
                      onError={(event) => advancePokemonSpriteFallback(event, displayImageUrls)}
                    />
                  ) : (
                    <div className="h-40 flex items-center justify-center text-text-secondary">[No Image]</div>
                  )}
                  <p className="mt-4 text-xl font-semibold text-text-main">{displayItems[0].name}</p>
                  {displayRarity && (
                    <p className={`font-bold uppercase text-sm ${rarityColor[displayRarity] || "text-text-secondary"}`}>
                      {displayRarity.replace(/_/g, " ")}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full bg-primary hover:opacity-90 text-white font-bold py-3 rounded-lg transition"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

export default PullResultModal;
