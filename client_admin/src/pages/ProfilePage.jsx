import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Flame, Images, Star, Award, BarChart2, LayoutGrid, Settings } from "lucide-react";
import { useAppearance, AVATAR_SHAPE_RADIUS, AVATAR_RING_PAD } from "../hooks/useAppearance";
import OverviewTab from "./profile/OverviewTab";
import CollectionsTab from "./profile/CollectionsTab";
import BadgesTab from "./profile/BadgesTab";
import StatsTab from "./profile/StatsTab";
import EditTab from "./profile/EditTab";

/**
 * ProfilePage - Redesigned user profile dashboard.
 * See DEVNOTES/PROFILEPAGE_NOTES.md for architecture documentation.
 */

const TABS = [
  { id: "overview", label: "Overview", Icon: LayoutGrid },
  { id: "collections", label: "Collections", Icon: Images },
  { id: "badges", label: "Badges", Icon: Award },
  { id: "stats", label: "Stats", Icon: BarChart2 },
  { id: "edit", label: "Edit", Icon: Settings },
];

function StatChip({ icon, value, label, color = "text-white/60" }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      {icon}
      <span className="font-semibold">{value}</span>
      <span className="text-white/30 font-normal text-[11px]">{label}</span>
    </span>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      <div className="w-full rounded-2xl bg-white/[0.06]" style={{ height: 240 }} />
      <div className="px-4 -mt-12 flex flex-col items-center gap-3 sm:flex-row sm:items-end sm:px-5">
        <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-background shrink-0" />
        <div className="space-y-2 pb-1">
          <div className="h-6 w-36 bg-white/10 rounded-lg mx-auto sm:mx-0" />
          <div className="h-3 w-24 bg-white/[0.06] rounded mx-auto sm:mx-0" />
          <div className="flex gap-2 justify-center sm:justify-start">
            <div className="h-4 w-12 bg-white/[0.06] rounded-full" />
            <div className="h-4 w-12 bg-white/[0.06] rounded-full" />
            <div className="h-4 w-12 bg-white/[0.06] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [collectionsState, setCollectionsState] = useState({
    pokemon: [],
    snoopy: [],
    habbo: [],
    yugioh: [],
    loading: false,
    loaded: false,
    error: "",
  });

  const [bannerHeightPx, setBannerHeightPx] = useState(() => {
    if (typeof window === "undefined") return 260;
    const v = Number(localStorage.getItem("tae.profile.bannerHeightPx"));
    return isFinite(v) && v > 0 ? Math.min(520, Math.max(160, v)) : 260;
  });

  useEffect(() => {
    (async () => {
      try {
        const [badgesRes, statsRes, earnedRes] = await Promise.all([
          api.get("/badges/base"),
          api.get("/users/me/dashboard-stats"),
          api.get("/badges/earned"),
        ]);
        setAllBadges(badgesRes.data.data);
        setDashboardStats(statsRes.data.data);
        setEarnedBadges(earnedRes.data.data || []);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (activeTab !== "collections") return;
    if (collectionsState.loaded || collectionsState.loading) return;
    (async () => {
      setCollectionsState((s) => ({ ...s, loading: true, error: "" }));
      try {
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem("tae.profile.bannerHeightPx", String(bannerHeightPx));
    } catch {}
  }, [bannerHeightPx]);

  const appearance = useAppearance();

  if (loading || !user) return <ProfileSkeleton />;

  const personaAccent = user?.activeAbelPersona?.colors?.primary || "#22d3ee";
  const accent = appearance.accentOverride || personaAccent;
  const avatarRadius = AVATAR_SHAPE_RADIUS[appearance.avatarShape] || "50%";
  const ringPad = AVATAR_RING_PAD[appearance.avatarRing] || 3;
  const glowAlpha = Math.round((appearance.avatarGlow / 100) * 80).toString(16).padStart(2, "0");
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const avatarUrl = user?.profilePicture
    ? `${serverBaseUrl}${user.profilePicture}`
    : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user?.username || "user"}`;
  const bannerUrl = user?.bannerImage ? `${serverBaseUrl}${user.bannerImage}` : null;
  const totalCollectibles =
    (user?.pokemonCollection?.length || 0) +
    (user?.snoopyArtCollection?.length || 0) +
    (user?.habboRares?.length || 0) +
    (user?.yugiohCards?.length || 0);
  const streak = dashboardStats?.activeStreaks ?? user.currentLoginStreak ?? 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* HERO */}
      <div className="relative">
        {/* Banner */}
        <div
          className="relative w-full overflow-hidden rounded-2xl transition-[height] duration-500"
          style={{ height: bannerHeightPx }}
        >
          {bannerUrl ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: user.bannerFitMode || "cover",
                backgroundPosition: `${user.bannerPositionX ?? 50}% ${user.bannerPositionY ?? 50}%`,
                transform: "translateZ(0)",
              }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 90% 90% at 15% 10%, ${accent}45 0%, transparent 55%), radial-gradient(ellipse 70% 70% at 85% 85%, ${accent}25 0%, transparent 55%), linear-gradient(160deg, #0c0c14 0%, #14141f 100%)`,
              }}
            />
          )}
          {/* Persona color wash */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(145deg, ${accent}18 0%, transparent 55%)`,
              mixBlendMode: "overlay",
            }}
          />
          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-28"
            style={{ background: "linear-gradient(to top, var(--color-bg) 0%, transparent 100%)" }}
          />
        </div>

        {/* Identity block */}
        <div className="-mt-12 sm:-mt-14 px-3 sm:px-4 relative z-10">
          <div className="flex flex-col items-center sm:flex-row sm:items-end gap-3 sm:gap-4">
            {/* Avatar with persona accent ring */}
            <div
              className="shrink-0 relative"
              style={{
                borderRadius: avatarRadius,
                padding: ringPad,
                background: `linear-gradient(135deg, ${accent}, ${accent}50)`,
                boxShadow: appearance.avatarGlow > 0 ? `0 0 20px ${accent}${glowAlpha}, 0 4px 20px rgba(0,0,0,0.55)` : "0 4px 20px rgba(0,0,0,0.55)",
              }}
            >
              <div className="overflow-hidden" style={{ borderRadius: avatarRadius, padding: 2, background: "var(--color-bg)" }}>
                <img
                  src={avatarUrl}
                  alt={`${user.username} avatar`}
                  style={{ borderRadius: avatarRadius }}
                  className="w-20 h-20 sm:w-[110px] sm:h-[110px] object-cover block"
                />
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 min-w-[1.5rem] h-6 rounded-full px-1.5 flex items-center justify-center text-[11px] font-black border-[2px] border-background shadow-lg leading-none"
                style={{ background: accent, color: "#000" }}
              >
                {user.level}
              </div>
            </div>

            {/* Name, title, stats */}
            <div className="flex-1 text-center sm:text-left pb-0.5 min-w-0">
              <div className="flex items-baseline justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-[1.75rem] font-black text-white tracking-tight leading-none">
                  {user.username}
                </h1>
                {user?.equippedTitle?.titleBase?.name && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full border leading-tight"
                    style={{
                      color: accent,
                      borderColor: `${accent}45`,
                      background: `${accent}12`,
                    }}
                  >
                    <Star size={9} className="inline mr-0.5 -mt-px" />
                    {user.equippedTitle.titleBase.name}
                  </span>
                )}
              </div>

              {user?.motto && (
                <p className="mt-1 text-sm text-white/38 italic leading-snug max-w-xs mx-auto sm:mx-0 truncate">
                  &ldquo;{user.motto}&rdquo;
                </p>
              )}

              <div className="mt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                {appearance.showStreakChip && <StatChip icon={<Flame size={12} />} value={`${streak}d`} label="streak" color="text-amber-400" />}
                {appearance.showItemsChip && <StatChip icon={<Images size={12} />} value={totalCollectibles} label="items" color="text-sky-400" />}
                {appearance.showBadgesChip && earnedBadges.length > 0 && (
                  <StatChip
                    icon={<Award size={12} />}
                    value={earnedBadges.length}
                    label="badges"
                    color="text-violet-400"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="mt-4 border-b border-white/[0.07]">
        <nav className="overflow-x-auto scrollbar-hide">
          <div className="flex px-3 sm:px-4 min-w-max">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap select-none ${
                    isActive ? "text-white" : "text-white/35 hover:text-white/65"
                  }`}
                >
                  <Icon size={13} className="shrink-0" />
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full"
                      style={{ background: accent }}
                      transition={{ type: "spring", stiffness: 420, damping: 38 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* TAB CONTENT */}
      <div className="pt-5 pb-12">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "overview" && (
            <OverviewTab
              key="overview"
              allBadges={allBadges}
              earnedBadges={earnedBadges}
              user={user}
              onEditClick={() => setActiveTab("edit")}
            />
          )}
          {activeTab === "collections" && (
            <CollectionsTab key="collections" collectionsState={collectionsState} accent={accent} />
          )}
          {activeTab === "badges" && (
            <BadgesTab key="badges" allBadges={allBadges} earnedBadges={earnedBadges} user={user} />
          )}
          {activeTab === "stats" && <StatsTab key="stats" stats={dashboardStats} />}
          {activeTab === "edit" && (
            <EditTab key="edit" bannerHeightPx={bannerHeightPx} setBannerHeightPx={setBannerHeightPx} accent={accent} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
