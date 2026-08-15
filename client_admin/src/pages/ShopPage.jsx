import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Gem, Heart, X, AlertCircle, Sparkles, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import PullResultModal from "../components/shop/PullResultModal";
import BalancesChips from "../components/shop/BalancesChips";
import CategoryPanel from "../components/shop/CategoryPanel";

const MotionDiv = motion.div;

const ShopPage = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("collectibles");
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [loadingUpgrade, setLoadingUpgrade] = useState(null);
  const [accountUpgrades, setAccountUpgrades] = useState([]);
  const [error, setError] = useState("");
  const [lastPulledItem, setLastPulledItem] = useState(null);
  // Per-category last 5 pulls, persisted locally (with migration from old flat list)
  const [recentByCategory, setRecentByCategory] = useState(() => {
    try {
      const raw = localStorage.getItem("tae.shop.recentByCategory.v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      }
      const legacyRaw = localStorage.getItem("tae.shop.recentPulls");
      const mapping = {};
      if (legacyRaw) {
        const flat = JSON.parse(legacyRaw);
        if (Array.isArray(flat)) {
          for (const e of flat) {
            const cat = e?.category || "misc";
            if (!mapping[cat]) mapping[cat] = [];
            mapping[cat].push(e);
          }
          for (const k of Object.keys(mapping)) mapping[k] = mapping[k].slice(0, 5);
        }
      }
      return mapping;
    } catch {
      return {};
    }
  });

  // Build absolute URLs for relative images based on API base URL
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const buildImageUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    let path = url.replace(/^public\//, "").replace(/^\/public\//, "");
    if (path.startsWith("/")) return `${serverBaseUrl}${path}`;
    return `${serverBaseUrl}/${path}`;
  };

  // Label helper for sections
  const categoryLabel = (cat) => {
    const map = {
      pokemon: "Pokémon",
      yugioh: "Yu-Gi-Oh!",
      snoopy: "Snoopy",
      habbo: "Habbo Rare",
      abelpersona: "Archetype",
    };
    return map[cat] || cat;
  };

  // Persist per-category recents (cap 10 per category)
  useEffect(() => {
    try {
      const capped = {};
      for (const [cat, arr] of Object.entries(recentByCategory || {})) {
        capped[cat] = (Array.isArray(arr) ? arr : []).slice(0, 10);
      }
      localStorage.setItem("tae.shop.recentByCategory.v1", JSON.stringify(capped));
    } catch {
      // localStorage history is nice-to-have only.
    }
  }, [recentByCategory]);

  useEffect(() => {
    const loadUpgrades = async () => {
      try {
        const response = await api.get("/shop/account-upgrades");
        setAccountUpgrades(response.data?.data || []);
      } catch {
        setAccountUpgrades([]);
      }
    };
    loadUpgrades();
  }, []);

  const SHOP_CONFIG = [
    {
      category: "pokemon",
      title: "Summon Pokémon",
      description: "Spend Temu Tokens on a randomized Pokémon pull.",
      cost: 10,
      currencyName: "temuTokens",
      currencySymbol: "TT",
    },
    {
      category: "yugioh",
      title: "Draw Yu-Gi-Oh! Cards",
      description: "Draw 1 random card for 2 tokens or 3 random cards for 5 tokens.",
      cost: 2,
      currencyName: "temuTokens",
      currencySymbol: "TT",
      purchaseOptions: [
        { quantity: 1, cost: 2, label: "1 Card" },
        { quantity: 3, cost: 5, label: "3 Cards" },
      ],
    },
    {
      category: "snoopy",
      title: "Find a Snoopy",
      description: "Spend Temu Tokens to uncover a randomized Snoopy collectible.",
      cost: 20,
      currencyName: "temuTokens",
      currencySymbol: "TT",
    },
    {
      category: "habbo",
      title: "Discover a Habbo Rare",
      description: "Spend Temu Tokens to roll for a randomized Habbo rare.",
      cost: 20,
      currencyName: "temuTokens",
      currencySymbol: "TT",
    },
    {
      category: "abelpersona",
      title: "Unlock an Archetype",
      description: "Spend Temu Tokens to unlock a randomized Archetype theme.",
      cost: 30,
      currencyName: "temuTokens",
      currencySymbol: "TT",
    },
  ];

  const balances = useMemo(
    () => [
      {
        label: "Temu Tokens",
        value: user?.temuTokens || 0,
        symbol: "TT",
        icon: Coins,
        title: "Collectible currency earned via habits",
      },
      {
        label: "Gatilla Gold",
        value: user?.gatillaGold || 0,
        symbol: "GG",
        icon: Gem,
        title: "Earned via workouts; spent on account upgrades",
      },
      {
        label: "Wendy Hearts",
        value: user?.wendyHearts || 0,
        symbol: "\u2764\uFE0F",
        icon: Heart,
        title: "Earned via reading; future use to be defined",
      },
    ],
    [user],
  );

  const handlePull = async (category, quantity = 1) => {
    const config = SHOP_CONFIG.find((c) => c.category === category);
    if (!config || !user) return;

    const cost = category === "yugioh" && quantity === 3 ? 5 : config.cost;

    if (user[config.currencyName] < cost) {
      setError("You don't have enough currency for this!");
      return;
    }

    setLoadingCategory(category);
    setError("");

    try {
      const response = await api.post(`/shop/pull/${category}`, { quantity });
      setLastPulledItem(response.data);

      const nested = response.data?.data || {};
      const pulledItems =
        nested.items && Array.isArray(nested.items) && nested.items.length > 0
          ? nested.items
          : nested.item
            ? [nested.item]
            : [];
      const ts = Date.now();
      const entries = pulledItems.map((it) => {
        let img = it.imageUrl;
        if (!img && it.forms) img = it.forms?.[0]?.spriteGen5Animated || it.forms?.[0]?.spriteGen6Animated;
        const imageUrl = buildImageUrl(img);
        const name = it.name || it.title || "Unknown";
        const rarity = it.rarity || it.rarityCategory || it.systemRarity || null;
        const id = it._id || it.id || `${name}-${ts}`;
        return { id, name, imageUrl, rarity, category, ts };
      });
      setRecentByCategory((prev) => {
        const next = { ...prev };
        const cat = category;
        const existing = Array.isArray(next[cat]) ? [...next[cat]] : [];
        for (const entry of entries) {
          const withoutDup = existing.filter((e) => e.id !== entry.id);
          existing.splice(0, existing.length, entry, ...withoutDup);
        }
        next[cat] = existing.slice(0, 10);
        return next;
      });

      setUser((prevUser) => {
        const newUserState = { ...prevUser };
        const { currency, balance } = response.data?.data || {};
        if (currency && Number.isFinite(balance)) {
          newUserState[currency] = balance;
        }
        return newUserState;
      });
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during the pull.");
    } finally {
      setLoadingCategory(null);
    }
  };

  const handleBuyUpgrade = async (upgradeKey) => {
    setLoadingUpgrade(upgradeKey);
    setError("");

    try {
      const response = await api.post(`/shop/account-upgrades/${upgradeKey}/buy`);
      setAccountUpgrades(response.data?.data || []);
      if (response.data?.userData) {
        setUser(response.data.userData);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while buying the upgrade.");
    } finally {
      setLoadingUpgrade(null);
    }
  };

  return (
    <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="pb-12">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main">Storefront</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Spend Temu Tokens on randomized collectibles. Duplicate rules vary by collection.
        </p>
      </div>

      {/* ── Wallet ── */}
      <BalancesChips balances={balances} />

      <div className="mb-5 inline-flex rounded-xl border border-border bg-surface/70 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("collectibles")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
            activeTab === "collectibles" ? "bg-primary text-white" : "text-text-secondary hover:text-text-main"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          Collectibles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upgrades")}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
            activeTab === "upgrades" ? "bg-primary text-white" : "text-text-secondary hover:text-text-main"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Account Upgrades
        </button>
      </div>

      {/* ── Error toast ── */}
      <AnimatePresence>
        {error && (
          <MotionDiv
            key="err"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="mb-5 rounded-xl border px-4 py-3 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.4)" }}
            role="alert"
          >
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
            <span className="flex-1 text-sm text-text-main">{error}</span>
            <button
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-500/10 transition"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-text-secondary" />
            </button>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* ── Banner grid ── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 ${activeTab === "collectibles" ? "" : "hidden"}`}>
        {SHOP_CONFIG.map((cfg, i) => (
          <MotionDiv
            key={cfg.category}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
          >
            <CategoryPanel
              config={cfg}
              recentItems={recentByCategory[cfg.category] || []}
              onPull={handlePull}
              isLoading={loadingCategory === cfg.category}
              categoryLabel={categoryLabel}
            />
          </MotionDiv>
        ))}
      </div>

      <p className={`mt-8 text-center text-xs text-text-secondary opacity-60 ${activeTab === "collectibles" ? "" : "hidden"}`}>
        Pull outcomes are randomized · All collectible purchases use Temu Tokens
      </p>

      {activeTab === "upgrades" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accountUpgrades.map((upgrade) => {
            const nextTier = upgrade.nextTier;
            const levelLocked = nextTier && (user?.level || 1) < nextTier.levelRequired;
            const goldLocked = nextTier && (user?.gatillaGold || 0) < nextTier.cost;
            const disabled = upgrade.isMaxed || levelLocked || goldLocked || loadingUpgrade === upgrade.key;
            const buttonText = upgrade.isMaxed
              ? "Maxed"
              : levelLocked
                ? `Level ${nextTier.levelRequired} Required`
                : goldLocked
                  ? `${nextTier.cost} GG Required`
                  : loadingUpgrade === upgrade.key
                    ? "Upgrading..."
                    : `Upgrade for ${nextTier.cost} GG`;

            return (
              <MotionDiv
                key={upgrade.key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-text-main">{upgrade.title}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{upgrade.description}</p>
                  </div>
                  <div className="rounded-lg bg-amber-400/10 px-3 py-2 text-right">
                    <p className="text-xs text-text-secondary">Tier</p>
                    <p className="font-mono text-lg font-bold text-amber-300">
                      {upgrade.currentTier}/{upgrade.maxTier}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border/70 p-3">
                    <p className="text-xs text-text-secondary">Current</p>
                    <p className="mt-1 font-semibold text-text-main">{upgrade.currentEffect}</p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3">
                    <p className="text-xs text-text-secondary">Next</p>
                    <p className="mt-1 font-semibold text-text-main">{nextTier ? nextTier.effect : "Complete"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleBuyUpgrade(upgrade.key)}
                  className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {buttonText}
                </button>
              </MotionDiv>
            );
          })}
        </div>
      )}

      <PullResultModal result={lastPulledItem} onClose={() => setLastPulledItem(null)} />
    </MotionDiv>
  );
};

export default ShopPage;
