import { CheckCircle, PlusCircle, Swords, Shield, Star, Zap } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { advancePokemonSpriteFallback, getPokemonSpriteUrls } from "../../utils/pokemonSprites";

// Function to get rarity text color
const getRarityTextColor = (rarity) => {
  switch (rarity?.toLowerCase()) {
    case "common":
      return "text-gray-300 bg-gray-600/30";
    case "rare":
      return "text-blue-300 bg-blue-600/30";
    case "super rare":
      return "text-yellow-300 bg-yellow-600/30";
    case "ultra rare":
      return "text-purple-300 bg-purple-600/30";
    case "secret rare":
      return "text-red-300 bg-red-600/30";
    default:
      return "text-gray-300 bg-gray-600/30";
  }
};

// Function to get glow colors based on Yu-Gi-Oh card rarity
const getRarityGlow = (rarity) => {
  switch (rarity?.toLowerCase()) {
    case "common":
      return "shadow-lg shadow-gray-500/30 border-gray-400 hover:shadow-gray-500/50";
    case "rare":
      return "shadow-lg shadow-blue-500/50 border-blue-400 hover:shadow-blue-500/70";
    case "super rare":
      return "shadow-lg shadow-yellow-500/60 border-yellow-400 hover:shadow-yellow-500/80";
    case "ultra rare":
      return "shadow-lg shadow-purple-500/70 border-purple-400 hover:shadow-purple-500/90";
    case "secret rare":
      return "shadow-xl shadow-red-500/80 border-red-400 hover:shadow-red-500/100 hover:shadow-2xl";
    default:
      return "shadow-lg shadow-gray-500/30 border-gray-400 hover:shadow-gray-500/50";
  }
};

const CollectionItemCard = ({ item, config, onSelect, isDisplayed, isDisplayFull, isCompact }) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseItem = item ? item[config.baseField] : null;

  if (!baseItem) return null;

  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const pokemonImageUrls =
    config.baseField === "basePokemon"
      ? getPokemonSpriteUrls(baseItem, item.variant, 5, serverBaseUrl)
      : [];
  const imageUrl = config.baseField === "basePokemon" ? pokemonImageUrls[0] : baseItem.imageUrl;

  let buttonDisabled = false;
  let buttonText = "Add to Profile";
  let buttonIcon = <PlusCircle size={14} />;
  let buttonClass = "bg-teal-600 hover:bg-teal-500";

  if (isDisplayed) {
    buttonText = "Displayed";
    buttonIcon = <CheckCircle size={14} />;
    buttonClass = "bg-green-700 hover:bg-red-800";
  } else if (isDisplayFull) {
    buttonText = "Profile Full";
    buttonDisabled = true;
    buttonClass = "bg-gray-600 cursor-not-allowed";
  }

  // Yu-Gi-Oh! Card hover overlay using React Portal
  const YugiohCardHover = () => {
    if (config.baseField !== "yugiohCardBase" || !isHovered) return null;
    return createPortal(
      <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center">
        <div className="bg-gray-900/95 border-2 border-yellow-400 rounded-lg p-10 max-w-4xl w-[700px] mx-4 backdrop-blur-sm shadow-2xl">
          {/* Card Image */}
          <div className="w-full h-80 mb-6 flex items-center justify-center bg-black/30 rounded-lg">
            {imageUrl ? (
              <img src={imageUrl} alt={baseItem.name} className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center text-gray-500">
                [No Image]
              </div>
            )}
          </div>
          {/* Card Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-yellow-400 border-b border-yellow-400/30 pb-2">{baseItem.name}</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-600/30 text-blue-300 text-sm rounded">{baseItem.type}</span>
              {baseItem.systemRarity && (
                <span className={`px-2 py-1 text-sm rounded ${getRarityTextColor(baseItem.systemRarity)}`}>
                  {baseItem.systemRarity}
                </span>
              )}
            </div>
            {baseItem.type.includes("Monster") && (
              <div className="grid grid-cols-2 gap-2 text-base">
                {baseItem.level && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={18} />
                    <span>Level {baseItem.level}</span>
                  </div>
                )}
                {baseItem.attribute && (
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Zap size={18} />
                    <span>{baseItem.attribute}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-red-400">
                  <Swords size={18} />
                  <span>ATK: {baseItem.atk || "?"}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400">
                  <Shield size={18} />
                  <span>DEF: {baseItem.def || "?"}</span>
                </div>
              </div>
            )}
            {baseItem.race && (
              <div className="text-base text-gray-300">
                <span className="text-gray-400">Race:</span> {baseItem.race}
              </div>
            )}
            {baseItem.description && (
              <div className="text-sm text-gray-300 bg-gray-800/50 p-4 rounded border-l-2 border-yellow-400/50">
                {baseItem.description}
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // Get rarity glow for Yu-Gi-Oh cards
  const rarityGlow =
    config.baseField === "yugiohCardBase" && baseItem?.systemRarity ? getRarityGlow(baseItem.systemRarity) : "";

  // Special animation for Secret Rare cards
  const isSecretRare = config.baseField === "yugiohCardBase" && baseItem?.systemRarity?.toLowerCase() === "secret rare";

  return (
    <div className="relative">
      <div
        className={`widget-container transition-all duration-300 group border ${
          isCompact ? "p-3" : "p-4"
        } flex flex-col text-center ${rarityGlow} ${isSecretRare ? "animate-pulse" : ""}`}
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-primary)",
          color: "var(--color-text-main)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* External Name Container - for compact mode */}
        {isCompact && (
          <div className="mb-2">
            <p className="text-xs font-medium text-white leading-tight">{baseItem.name}</p>
            {item.variant && item.variant !== "Normal" && <p className="text-xs text-yellow-400">{item.variant}</p>}
          </div>
        )}

        {/* Image Section */}
        <div className={`w-full ${isCompact ? "h-24" : "h-32"} mb-2 flex items-center justify-center rounded-md`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={baseItem.name}
              className="max-w-full max-h-full object-contain"
              onError={(event) => advancePokemonSpriteFallback(event, pokemonImageUrls)}
            />
          ) : (
            <div className="w-full h-full rounded flex items-center justify-center text-xs text-gray-500">[IMG]</div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-grow flex flex-col justify-between w-full">
          {!isCompact && (
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{baseItem.name}</p>
              {/* --- YU-GI-OH! SPECIFIC DISPLAY --- */}
              {config.baseField === "yugiohCardBase" && baseItem.type.includes("Monster") && (
                <div className="flex justify-center items-center gap-3 text-xs text-text-secondary mt-1">
                  <div className="flex items-center gap-1">
                    <Swords size={12} className="text-red-400" />
                    <span>{baseItem.atk}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield size={12} className="text-blue-400" />
                    <span>{baseItem.def}</span>
                  </div>
                </div>
              )}
              {item.variant && item.variant !== "Normal" && <p className="text-xs text-yellow-400">{item.variant}</p>}
            </div>
          )}

          {/* Button Section */}
          <button
            onClick={() => onSelect(item._id, isDisplayed)}
            disabled={buttonDisabled}
            className={`w-full mt-2 text-xs font-bold py-2 rounded-md transition duration-300 flex items-center justify-center gap-1 ${buttonClass}`}
          >
            {isDisplayed ? (
              <>
                <span className="group-hover:hidden flex items-center gap-1">
                  {buttonIcon} {buttonText}
                </span>
                <span className="hidden group-hover:inline">Remove</span>
              </>
            ) : (
              <>
                {buttonIcon} {buttonText}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Yu-Gi-Oh Card Hover Overlay */}
      <YugiohCardHover />
    </div>
  );
};

export default CollectionItemCard;
