import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { advancePokemonSpriteFallback, getPokemonSpriteUrls } from "../utils/pokemonSprites";

// Central definition of collections with simple, non-emoji badges
const collections = [
  { type: "pokemon", name: "My Pokédex", abbr: "PK", description: "All captured Pokémon and progress." },
  { type: "snoopy", name: "Snoopy Gallery", abbr: "SN", description: "Snoopy artwork, media, and finds." },
  { type: "habbo", name: "Habbo Rare Furni", abbr: "HB", description: "Rare furniture index and tracking." },
  { type: "yugioh", name: "Yu-Gi-Oh! Binder", abbr: "YG", description: "TCG collection, decks, and trades." },
];

const Badge = ({ text }) => (
  <div
    className="flex h-12 w-12 items-center justify-center rounded-full border font-bold"
    style={{
      background: "var(--color-background)",
      borderColor: "var(--color-primary)",
      color: "var(--color-primary)",
    }}
  >
    {text}
  </div>
);

const CollectionsPage = () => {
  const [query, setQuery] = useState("");
  const { user } = useAuth();

  const displayedByType = useMemo(() => {
    // Map each collection type to the corresponding displayed array on the user object
    return {
      pokemon: Array.isArray(user?.displayedPokemon) ? user.displayedPokemon : [],
      snoopy: Array.isArray(user?.displayedSnoopyArt) ? user.displayedSnoopyArt : [],
      habbo: Array.isArray(user?.displayedHabboRares) ? user.displayedHabboRares : [],
      yugioh: Array.isArray(user?.displayedYugiohCards) ? user.displayedYugiohCards : [],
    };
  }, [user]);

  // Build server base to resolve relative asset URLs (e.g., /pokemon/..., /uploads/...)
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];

  const getDisplayedItems = (type) => displayedByType[type] || [];

  const getBaseAndName = (type, item) => {
    switch (type) {
      case "pokemon": {
        const base = item?.basePokemon;
        return { base, name: base?.name || "" };
      }
      case "snoopy": {
        const base = item?.snoopyArtBase;
        return { base, name: base?.name || "" };
      }
      case "habbo": {
        const base = item?.habboRareBase;
        return { base, name: base?.name || "" };
      }
      case "yugioh": {
        const base = item?.yugiohCardBase;
        return { base, name: base?.name || "" };
      }
      default:
        return { base: null, name: "" };
    }
  };

  const resolveUrl = (url) => {
    if (!url) return null;
    return url.startsWith("/") ? `${serverBaseUrl}${url}` : url;
  };

  const getThumbUrl = (type, item) => {
    if (!item) return null;
    if (type === "pokemon") {
      return getPokemonSpriteUrls(item.basePokemon, item.variant, 5, serverBaseUrl);
    }
    const { base } = getBaseAndName(type, item);
    return [resolveUrl(base?.imageUrl || null)].filter(Boolean);
  };

  const getDisplayedNames = (type) => {
    const items = displayedByType[type] || [];
    // Safely derive human-readable names depending on base field names per type
    return items
      .map((it) => {
        switch (type) {
          case "pokemon":
            return it?.basePokemon?.name || "";
          case "snoopy":
            return it?.snoopyArtBase?.name || "";
          case "habbo":
            return it?.habboRareBase?.name || "";
          case "yugioh":
            return it?.yugiohCardBase?.name || "";
          default:
            return "";
        }
      })
      .filter(Boolean);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => [c.name, c.type, c.description].some((v) => v.toLowerCase().includes(q)));
  }, [query]);

  return (
    <div>
      <div
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-md"
        style={{ background: "var(--color-surface)", color: "var(--color-text-main)" }}
      >
        <h1 className="text-3xl font-bold text-primary">Collections</h1>
        <div className="relative w-full md:w-96">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections by name or type"
            className="w-full rounded-md border px-4 py-2 focus:outline-none"
            style={{
              background: "var(--color-background)",
              borderColor: "var(--color-primary)",
              color: "var(--color-text-main)",
            }}
          />
        </div>
      </div>

      {/* Table layout for md+ screens */}
      <div
        className="hidden md:block overflow-x-auto rounded-lg border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-primary)",
          color: "var(--color-text-main)",
        }}
      >
        <table
          className="min-w-full divide-y"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-primary)",
            color: "var(--color-text-main)",
          }}
        >
          <thead style={{ background: "var(--color-surface)" }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Collection
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Displayed
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody
            className="divide-y"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
          >
            {filtered.map((c) => (
              <tr key={c.type} className="" style={{ background: "var(--color-surface)" }}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Badge text={c.abbr} />
                    <div>
                      <div className="text-sm font-medium text-text-main">{c.name}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-text-secondary">{c.type}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">
                  {(() => {
                    const items = getDisplayedItems(c.type);
                    if (!items.length) return <span className="italic text-text-secondary/70">No items displayed</span>;
                    return (
                      <div className="flex flex-wrap items-center gap-1">
                        {items.slice(0, 6).map((it) => {
                          const { name } = getBaseAndName(c.type, it);
                          const urls = getThumbUrl(c.type, it) || [];
                          return urls[0] ? (
                            <img
                              key={it._id}
                              src={urls[0]}
                              title={name}
                              alt={name || c.type}
                              className="h-8 w-8 object-contain"
                              style={{ background: "var(--color-surface)" }}
                              onError={(event) => advancePokemonSpriteFallback(event, urls)}
                            />
                          ) : (
                            <span
                              key={it._id}
                              className="inline-block h-8 w-8 text-[10px] flex items-center justify-center"
                              style={{ background: "var(--color-background)", color: "var(--color-text-secondary)" }}
                            >
                              N/A
                            </span>
                          );
                        })}
                        {items.length > 6 && (
                          <span className="text-xs text-text-secondary">+{items.length - 6} more</span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Link
                    to={`/collections/${c.type}`}
                    className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card layout for small screens */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filtered.map((c) => (
          <div
            key={c.type}
            className="rounded-lg border p-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
          >
            <div className="flex items-center gap-4">
              <Badge text={c.abbr} />
              <div className="flex-1">
                <div className="text-base font-semibold text-text-main">{c.name}</div>
                <div className="mt-2">
                  {(() => {
                    const items = getDisplayedItems(c.type);
                    if (!items.length)
                      return <span className="italic text-text-secondary/70 text-sm">No items displayed</span>;
                    return (
                      <div className="flex flex-wrap items-center gap-1">
                        {items.slice(0, 6).map((it) => {
                          const { name } = getBaseAndName(c.type, it);
                          const urls = getThumbUrl(c.type, it) || [];
                          return urls[0] ? (
                            <img
                              key={it._id}
                              src={urls[0]}
                              title={name}
                              alt={name || c.type}
                              className="h-8 w-8 object-contain"
                              style={{ background: "var(--color-surface)" }}
                              onError={(event) => advancePokemonSpriteFallback(event, urls)}
                            />
                          ) : (
                            <span
                              key={it._id}
                              className="inline-block h-8 w-8 text-[10px] flex items-center justify-center"
                              style={{ background: "var(--color-background)", color: "var(--color-text-secondary)" }}
                            >
                              N/A
                            </span>
                          );
                        })}
                        {items.length > 6 && (
                          <span className="text-xs text-text-secondary">+{items.length - 6} more</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <Link
                to={`/collections/${c.type}`}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 focus:outline-none"
              >
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionsPage;
