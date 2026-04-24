import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import UserOverviewCard from "../components/profile/UserOverviewCard";
import BadgeDisplay from "../components/profile/BadgeDisplay";
import UserStatsWidget from "../components/profile/UserStatsWidget";
import DisplayedCollection from "../components/profile/DisplayedCollection";
import CompactDisplayedCollections from "../components/profile/CompactDisplayedCollections";
import { Flame, Images, Star, User as UserIcon, Image as ImageIcon } from "lucide-react";
import ProfileEditPanel from "../components/profile/ProfileEditPanel";

const ProfilePage = () => {
  const { user } = useAuth(); // We get the populated user object from our context

  // State for data fetched specifically for this page
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  // Collections tab data
  const [collectionsState, setCollectionsState] = useState({
    pokemon: [],
    snoopy: [],
    habbo: [],
    yugioh: [],
    loading: false,
    loaded: false,
    error: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data needed for the profile page in parallel
        const [badgesRes, statsRes, earnedRes] = await Promise.all([
          api.get("/badges/base"),
          api.get("/users/me/dashboard-stats"),
          api.get("/badges/earned"),
        ]);
        setAllBadges(badgesRes.data.data);
        setDashboardStats(statsRes.data.data);
        setEarnedBadges(earnedRes.data.data || []);
      } catch (error) {
        console.error("Failed to load profile page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lazy-load full collections when user navigates to the Collections tab
  useEffect(() => {
    const loadCollections = async () => {
      if (activeTab !== "collections") return;
      if (collectionsState.loaded || collectionsState.loading) return;
      try {
        setCollectionsState((s) => ({ ...s, loading: true, error: "" }));
        const [p, s, h, y] = await Promise.all([
          api.get("/users/me/collection/pokemon"),
          api.get("/users/me/collection/snoopy"),
          api.get("/users/me/collection/habbo"),
          api.get("/users/me/collection/yugioh"),
        ]);
        setCollectionsState({
          pokemon: p.data?.data || [],
          snoopy: s.data?.data || [],
          habbo: h.data?.data || [],
          yugioh: y.data?.data || [],
          loading: false,
          loaded: true,
          error: "",
        });
      } catch (e) {
        console.error("Failed to load collections:", e);
        setCollectionsState((prev) => ({ ...prev, loading: false, error: "Failed to load collections." }));
      }
    };
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // IMPORTANT: Avoid returning early before all hooks run; render loading state inline instead
  const isLoadingOrNoUser = loading || !user;

  // Theme accent from active persona if available
  const accent = user?.activeAbelPersona?.colors?.primary || "#22d3ee"; // teal-400 fallback
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const avatarUrl = user?.profilePicture
    ? `${serverBaseUrl}${user.profilePicture}`
    : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user?.username || "user"}`;
  const bannerUrl = user?.bannerImage ? `${serverBaseUrl}${user.bannerImage}` : null;

  // Persistent banner height (user adjustable)
  const [bannerHeightPx, setBannerHeightPx] = useState(() => {
    if (typeof window === "undefined") return 320;
    const raw = localStorage.getItem("tae.profile.bannerHeightPx");
    const v = Number(raw);
    if (!isFinite(v)) return 320;
    return Math.min(640, Math.max(240, v));
  });
  const [avatarOffsetPx, setAvatarOffsetPx] = useState(() => {
    if (typeof window === "undefined") return 0;
    const raw = localStorage.getItem("tae.profile.avatarOffsetPx");
    const v = Number(raw);
    if (!isFinite(v)) return 0;
    return Math.min(160, Math.max(-48, v));
  });
  // Info box customization
  const [infoBoxBgMode, setInfoBoxBgMode] = useState(() => {
    if (typeof window === "undefined") return "glass";
    return localStorage.getItem("tae.profile.infoBoxBgMode") || "glass";
  });
  const [infoBoxBorderMode, setInfoBoxBorderMode] = useState(() => {
    if (typeof window === "undefined") return "subtle";
    return localStorage.getItem("tae.profile.infoBoxBorderMode") || "subtle";
  });
  const [infoBoxFullWidth, setInfoBoxFullWidth] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tae.profile.infoBoxFullWidth") === "true";
  });

  const totalCollectibles =
    (user?.pokemonCollection?.length || 0) +
    (user?.snoopyArtCollection?.length || 0) +
    (user?.habboRares?.length || 0) +
    (user?.yugiohCards?.length || 0);

  // Avatar overlap constant (doesn't scale with banner height)
  const avatarLiftPx = 64;

  useEffect(() => {
    try {
      localStorage.setItem("tae.profile.bannerHeightPx", String(bannerHeightPx));
    } catch {}
  }, [bannerHeightPx]);
  useEffect(() => {
    try {
      localStorage.setItem("tae.profile.avatarOffsetPx", String(avatarOffsetPx));
    } catch {}
  }, [avatarOffsetPx]);
  useEffect(() => {
    try {
      localStorage.setItem("tae.profile.infoBoxBgMode", infoBoxBgMode);
    } catch {}
  }, [infoBoxBgMode]);
  useEffect(() => {
    try {
      localStorage.setItem("tae.profile.infoBoxBorderMode", infoBoxBorderMode);
    } catch {}
  }, [infoBoxBorderMode]);
  useEffect(() => {
    try {
      localStorage.setItem("tae.profile.infoBoxFullWidth", String(infoBoxFullWidth));
    } catch {}
  }, [infoBoxFullWidth]);

  // Compute dynamic classes for user info box
  const infoBgClass = (() => {
    switch (infoBoxBgMode) {
      case "solid":
        return "bg-surface";
      case "accent":
        return "bg-gradient-to-r from-primary/70 via-secondary/60 to-tertiary/50";
      case "clear":
        return "bg-transparent";
      case "glass":
      default:
        return "bg-surface/70 backdrop-blur-md";
    }
  })();
  const infoBorderClass = (() => {
    switch (infoBoxBorderMode) {
      case "none":
        return "border-0";
      case "accent":
        return "border border-primary/50 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]";
      case "strong":
        return "border border-white/25";
      case "subtle":
      default:
        return "border border-white/15";
    }
  })();
  const infoWidthClass = infoBoxFullWidth ? "w-full" : "inline-block";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      {isLoadingOrNoUser && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white text-center">
          Loading Profile...
        </motion.p>
      )}
      {!isLoadingOrNoUser && (
        <>
          {/* Hero header */}
          <div className="relative px-1 sm:px-2 mb-4">
            <div
              className="relative w-full md:w-[125%] md:mx-[-12.5%] rounded-xl sm:rounded-2xl overflow-hidden transition-[height] duration-500"
              style={{ height: bannerHeightPx }}
            >
              {/* Banner image layer */}
              {bannerUrl ? (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${bannerUrl})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: user.bannerFitMode || "cover",
                    backgroundPosition: `${user.bannerPositionX ?? 50}% ${user.bannerPositionY ?? 50}%`,
                    filter: "saturate(1.05) contrast(1.02)",
                    transform: "translateZ(0)",
                  }}
                />
              ) : null}
              {/* Accent overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}33, transparent), radial-gradient(1200px 400px at 0% 0%, ${accent}22, transparent 60%)`,
                  boxShadow: "inset 0 0 80px rgba(255,255,255,0.03)",
                }}
              />
              {/* Controls moved to Edit tab */}
            </div>
            {/* Avatar and primary info (margin lift compensates expansion) */}
            <div
              className="px-1 sm:px-2 flex items-end gap-4 relative z-10 transition-[margin-top] duration-500"
              style={{ marginTop: -(avatarLiftPx + avatarOffsetPx) }}
            >
              <div className="w-28 h-28 md:w-[200px] md:h-[200px] rounded-full border-2 border-white/20 shadow-xl overflow-hidden bg-black/30 relative z-20">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className={`pb-1 ${infoBoxFullWidth ? "flex-1" : ""}`}>
                {" "}
                {/* allow fill when full width */}
                <div
                  className={`${infoBgClass} ${infoBorderClass} ${infoWidthClass} rounded-lg px-3 py-2 shadow-lg transition-colors duration-300`}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-lg md:text-2xl font-bold text-white">{user.username}</h1>
                    {user?.motto && <span className="text-xs md:text-sm text-slate-300/90 italic">“{user.motto}”</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] md:text-xs text-slate-300 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <UserIcon size={14} /> Level {user.level}
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <Flame size={14} />
                      {(dashboardStats?.activeStreaks ?? user.currentLoginStreak) || 0} day streak
                    </span>
                    <span className="inline-flex items-center gap-1 text-sky-300">
                      <Images size={14} />
                      {totalCollectibles} collectibles
                    </span>
                    {user?.equippedTitle?.titleBase?.name && (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <Star size={14} />
                        {user.equippedTitle.titleBase.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-1 sm:px-2 mb-3">
            <div className="inline-flex bg-white/5 border border-white/10 rounded-lg p-0.5 overflow-hidden">
              {[
                { id: "overview", label: "Overview" },
                { id: "collections", label: "Collections" },
                { id: "badges", label: "Badges" },
                { id: "stats", label: "Stats" },
                { id: "edit", label: "Edit" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs md:text-sm rounded-md transition-colors ${
                    activeTab === tab.id
                      ? "bg-white/15 text-white"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start px-1 sm:px-2"
            >
              {/* Left: Profile summary + badges */}
              <div className="lg:col-span-1 space-y-3">
                <UserOverviewCard onEdit={() => setActiveTab("edit")} />
                <BadgeDisplay
                  allBadges={allBadges}
                  earnedBadges={earnedBadges}
                  activeCollectionKey={user.activeBadgeCollectionKey || ""}
                />
              </div>
              {/* Right: Compact all displayed collections */}
              <div className="lg:col-span-2 space-y-3">
                <CompactDisplayedCollections
                  displayedPokemon={user.displayedPokemon || []}
                  displayedSnoopyArt={user.displayedSnoopyArt || []}
                  displayedHabboRares={user.displayedHabboRares || []}
                  displayedYugiohCards={user.displayedYugiohCards || []}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "collections" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 px-1 sm:px-2">
              {collectionsState.loading && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white text-center">
                  Loading Collections...
                </motion.p>
              )}
              {collectionsState.error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-center">
                  {collectionsState.error}
                </motion.p>
              )}
              {!collectionsState.loading && !collectionsState.error && (
                <>
                  <DisplayedCollection title="All Pokémon" items={collectionsState.pokemon} baseField="basePokemon" />
                  <DisplayedCollection title="All Snoopys" items={collectionsState.snoopy} baseField="snoopyArtBase" />
                  <DisplayedCollection
                    title="All Habbo Rares"
                    items={collectionsState.habbo}
                    baseField="habboRareBase"
                  />
                  <DisplayedCollection
                    title="All Yu-Gi-Oh! Cards"
                    items={collectionsState.yugioh}
                    baseField="yugiohCardBase"
                  />
                </>
              )}
            </motion.div>
          )}

          {activeTab === "badges" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BadgeDisplay
                allBadges={allBadges}
                earnedBadges={earnedBadges}
                activeCollectionKey={user.activeBadgeCollectionKey || ""}
              />
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <UserStatsWidget stats={dashboardStats} />
            </motion.div>
          )}

          {activeTab === "edit" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 px-1 sm:px-2">
              {/* Layout & Banner Controls */}
              <div className="bg-surface/70 backdrop-blur-md border border-white/15 rounded-lg p-4 shadow-lg space-y-4">
                <h2 className="text-sm font-semibold text-text-secondary tracking-wider">Visual Layout Controls</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label
                      htmlFor="bannerHeight"
                      className="text-[11px] md:text-xs font-semibold uppercase tracking-wide text-text-tertiary"
                    >
                      Banner Height
                    </label>
                    <input
                      id="bannerHeight"
                      type="range"
                      min={240}
                      max={640}
                      step={8}
                      value={bannerHeightPx}
                      onChange={(e) => setBannerHeightPx(Number(e.target.value))}
                      className="w-48 accent-primary cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-text-secondary">{bannerHeightPx}px</span>
                    <button
                      type="button"
                      className="text-[10px] px-2 py-1 rounded bg-black/30 border border-white/10 hover:bg-black/40"
                      onClick={() => setBannerHeightPx(320)}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <label
                      htmlFor="avatarYOffset"
                      className="text-[11px] md:text-xs font-semibold uppercase tracking-wide text-text-tertiary"
                    >
                      Avatar Y Offset
                    </label>
                    <input
                      id="avatarYOffset"
                      type="range"
                      min={-48}
                      max={160}
                      step={4}
                      value={avatarOffsetPx}
                      onChange={(e) => setAvatarOffsetPx(Number(e.target.value))}
                      className="w-48 accent-secondary cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-text-secondary">{avatarOffsetPx}px</span>
                    <button
                      type="button"
                      className="text-[10px] px-2 py-1 rounded bg-black/30 border border-white/10 hover:bg-black/40"
                      onClick={() => setAvatarOffsetPx(0)}
                    >
                      Reset
                    </button>
                  </div>
                  {/* Info Box Styling */}
                  <div className="mt-2 flex flex-col gap-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                      Info Box Styling
                    </h3>
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-text-secondary">Background Mode</span>
                        <div className="flex gap-1">
                          {[
                            { id: "glass", label: "Glass" },
                            { id: "solid", label: "Solid" },
                            { id: "accent", label: "Accent" },
                            { id: "clear", label: "Clear" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setInfoBoxBgMode(opt.id)}
                              className={`px-2 py-1 rounded text-[10px] border transition ${
                                infoBoxBgMode === opt.id
                                  ? "bg-primary/40 border-primary/60 text-white"
                                  : "bg-black/30 border-white/10 text-text-secondary hover:bg-black/40"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-text-secondary">Border Style</span>
                        <div className="flex gap-1">
                          {[
                            { id: "none", label: "None" },
                            { id: "subtle", label: "Subtle" },
                            { id: "strong", label: "Strong" },
                            { id: "accent", label: "Accent" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setInfoBoxBorderMode(opt.id)}
                              className={`px-2 py-1 rounded text-[10px] border transition ${
                                infoBoxBorderMode === opt.id
                                  ? "bg-secondary/40 border-secondary/60 text-white"
                                  : "bg-black/30 border-white/10 text-text-secondary hover:bg-black/40"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-text-secondary">Full Width</label>
                        <button
                          onClick={() => setInfoBoxFullWidth((v) => !v)}
                          className={`px-3 py-1 rounded text-[10px] border transition ${
                            infoBoxFullWidth
                              ? "bg-tertiary/40 border-tertiary/60 text-white"
                              : "bg-black/30 border-white/10 text-text-secondary hover:bg-black/40"
                          }`}
                        >
                          {infoBoxFullWidth ? "On" : "Off"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInfoBoxBgMode("glass");
                          setInfoBoxBorderMode("subtle");
                          setInfoBoxFullWidth(false);
                        }}
                        className="ml-auto text-[10px] px-2 py-1 rounded bg-black/30 border border-white/10 hover:bg-black/40"
                      >
                        Reset Info Box
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-tertiary leading-relaxed">
                    Adjust banner height to create more vertical space. Avatar offset raises (positive) or lowers
                    (negative) the avatar + info block without changing banner aspect ratio.
                  </p>
                </div>
              </div>
              <ProfileEditPanel />
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default ProfilePage;
