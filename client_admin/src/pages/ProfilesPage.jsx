import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import api, { getAssetUrl } from "../services/api";

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .get("/users/profiles")
      .then(({ data }) => {
        if (!cancelled) setProfiles(data.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load profiles.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter((profile) =>
      [profile.username, profile.motto, profile.bio, profile.location, profile.role]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [profiles, search]);

  return (
    <div className="space-y-5 pb-12">
      <PageHeader title="Profiles" subtitle="Browse every member and open their complete read-only profile." />

      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users size={17} className="text-primary" />
          <span>{profiles.length} created {profiles.length === 1 ? "profile" : "profiles"}</span>
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <span className="sr-only">Search profiles</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search profiles"
            className="w-full rounded-xl border border-white/10 bg-background py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-text-tertiary focus:border-primary/60"
          />
        </label>
      </div>

      {error && <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</div>}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-white/[0.05]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProfiles.map((profile) => {
            const avatarUrl = profile.profilePicture
              ? getAssetUrl(profile.profilePicture)
              : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${encodeURIComponent(profile.username)}`;
            const joined = profile.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : null;

            return (
              <Link
                key={profile._id}
                to={`/profiles/${profile._id}`}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.05]"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={avatarUrl}
                    alt={`${profile.username} avatar`}
                    className="h-16 w-16 shrink-0 rounded-full border border-white/10 bg-background object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="truncate text-lg font-bold text-white transition-colors group-hover:text-primary">
                        {profile.username}
                      </h2>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        Lv. {profile.level}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-text-tertiary">
                      {profile.role.replaceAll("_", " ")}
                    </p>
                    {profile.motto && <p className="mt-2 truncate text-xs italic text-text-secondary">“{profile.motto}”</p>}
                  </div>
                </div>

                {profile.bio && <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-text-secondary">{profile.bio}</p>}

                {(profile.location || joined) && (
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
                    {profile.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} /> {profile.location}
                      </span>
                    )}
                    {joined && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={11} /> Joined {joined}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredProfiles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-text-secondary">
          No profiles match your search.
        </div>
      )}
    </div>
  );
};

export default ProfilesPage;
