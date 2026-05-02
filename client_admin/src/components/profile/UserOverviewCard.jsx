import { useAuth } from "../../context/AuthContext";
import { Flame, Images, MapPin, Link as LinkIcon, Pencil, CalendarDays } from "lucide-react";

export default function UserOverviewCard({ onEdit }) {
  const { user } = useAuth();
  if (!user) return null;

  const accent = user?.activeAbelPersona?.colors?.primary || "#22d3ee";

  const totalCollectibles =
    (user?.pokemonCollection?.length || 0) +
    (user?.snoopyArtCollection?.length || 0) +
    (user?.habboRares?.length || 0) +
    (user?.yugiohCards?.length || 0);

  const streak = user?.currentLoginStreak || 0;
  const xp = user?.experience || 0;
  const xpNext = user?.xpToNextLevel || 0;
  const xpPct = xpNext > 0 ? Math.max(0, Math.min(100, (xp / xpNext) * 100)) : 0;
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.05)` }}>
      {/* Accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, ${accent}80 0%, ${accent}10 60%, transparent 100%)` }} />

      <div className="p-5 space-y-5">

        {/* Bio */}
        {user?.bio && (
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 pl-3 border-l-[2px]"
            style={{ borderColor: `${accent}60` }}>
            {user.bio}
          </p>
        )}

        {/* XP section */}
        {xpNext > 0 && (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black leading-none"
                  style={{ background: `${accent}18`, color: accent, outline: `1px solid ${accent}28` }}
                >
                  {user.level}
                </span>
                <span className="text-[11px] font-semibold text-text-secondary tracking-wide uppercase">Level {user.level}</span>
              </div>
              <span className="text-[10px] font-mono text-text-tertiary tabular-nums">
                {xp.toLocaleString()} <span className="opacity-50">/</span> {xpNext.toLocaleString()}
              </span>
            </div>
            <div className="h-1 rounded-full bg-background overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${xpPct}%`,
                  background: `linear-gradient(90deg, ${accent}99, ${accent})`,
                  boxShadow: `0 0 6px ${accent}55`,
                }}
              />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Flame size={12} />, value: streak, label: "day streak", tint: "#f59e0b" },
            { icon: <Images size={12} />, value: totalCollectibles, label: "collectibles", tint: "#38bdf8" },
          ].map(({ icon, value, label, tint }) => (
            <div key={label} className="bg-background rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${tint}14`, color: tint }}
              >
                {icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-main tabular-nums leading-none">{value}</p>
                <p className="text-[10px] text-text-tertiary leading-none mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Meta */}
        {(user?.location || user?.website || joined) && (
          <div className="space-y-1.5">
            {user?.location && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <MapPin size={11} className="shrink-0 opacity-50" />
                <span className="truncate">{user.location}</span>
              </div>
            )}
            {user?.website && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <LinkIcon size={11} className="shrink-0 text-text-tertiary opacity-50" />
                <a
                  href={user.website}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-medium transition-opacity hover:opacity-80"
                  style={{ color: accent }}
                >
                  {user.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            {joined && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <CalendarDays size={11} className="shrink-0 opacity-50" />
                <span>Since {joined}</span>
              </div>
            )}
          </div>
        )}

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold tracking-wide uppercase transition-all duration-150 active:scale-[0.98]"
          style={{
            background: `${accent}10`,
            color: accent,
            outline: `1px solid ${accent}25`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}1e`; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = `${accent}10`; }}
        >
          <Pencil size={11} />
          Edit Profile
        </button>

      </div>
    </div>
  );
}
