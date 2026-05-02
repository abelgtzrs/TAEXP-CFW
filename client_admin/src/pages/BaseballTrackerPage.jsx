import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import {
  MLB_TEAMS,
  fetchBaseballLeagueOverview,
  fetchBaseballPlayer,
  fetchBaseballTeamStats,
  fetchBaseballWatchlist,
  searchBaseballPlayers,
  unwatchBaseballPlayer,
  unwatchBaseballTeam,
  watchBaseballPlayer,
  watchBaseballTeam,
} from "../services/baseballService";

const DEFAULT_TEAM_IDS = ["147", "119", "144", "121", "117", "112"];
const TABS = [
  { id: "overview", label: "League Hub" },
  { id: "teams", label: "Highlighted Teams" },
  { id: "players", label: "Player Tracker" },
];

const teamGroups = MLB_TEAMS.reduce(
  (accumulator, team) => {
    const key = team.league === "American League" ? "American League" : "National League";
    accumulator[key].push(team);
    return accumulator;
  },
  { "American League": [], "National League": [] },
);

const formatMetric = (value, digits = 3) => {
  if (value == null || value === "") return "--";
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return String(value);
  return parsed.toFixed(digits).replace(/^0\./, ".");
};

const formatDate = (dateString) => {
  if (!dateString) return "TBD";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const leagueAccent = {
  "American League": "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  "National League": "border-red-300/25 bg-red-300/10 text-red-100",
};

const MetricTile = ({ label, value, accent = false }) => (
  <div
    className={`rounded-xl border px-3 py-2 ${accent ? "border-amber-400/30 bg-amber-400/10" : "border-white/10 bg-white/5"}`}
  >
    <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">{label}</div>
    <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
  </div>
);

const TeamCard = ({ team, watched, onToggleWatch }) => (
  <article className="rounded-[24px] border border-white/10 bg-slate-950/75 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] transition-all duration-200 hover:border-amber-400/20">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-50">{team.name}</h3>
          {watched && <Star size={14} className="text-amber-300" fill="currentColor" />}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.3em] text-slate-500">
          {team.abbreviation} / {team.division}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onToggleWatch(team)}
        className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-slate-200 transition hover:border-amber-400/40 hover:text-amber-100"
      >
        {watched ? "Watched" : "Watch"}
      </button>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <MetricTile label="Record" value={`${team.wins ?? 0}-${team.losses ?? 0}`} accent />
      <MetricTile label="Standing" value={team.standing ? `#${team.standing}` : "--"} />
      <MetricTile label="BA" value={formatMetric(team.ba, 3)} />
      <MetricTile label="SLG" value={formatMetric(team.slugging, 3)} />
      <MetricTile label="ERA" value={formatMetric(team.era, 2)} />
      <MetricTile label="WHIP" value={formatMetric(team.whip, 2)} />
    </div>
  </article>
);

const PlayerResult = ({ player, active, watched, onSelect, onToggleWatch }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
      active
        ? "border-amber-400/40 bg-amber-400/10"
        : "border-white/8 bg-white/5 hover:border-amber-400/25 hover:bg-white/8"
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-100">{player.name}</span>
          {watched && <Star size={13} className="text-amber-300" fill="currentColor" />}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.26em] text-slate-500">
          {player.position || "--"} {player.teamName ? `• ${player.teamName}` : ""}
        </div>
      </div>
      <span
        onClick={(event) => {
          event.stopPropagation();
          onToggleWatch(player);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onToggleWatch(player);
          }
        }}
        role="button"
        tabIndex={0}
        className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-slate-300 transition hover:border-amber-400/40 hover:text-amber-100"
      >
        {watched ? "Watched" : "Watch"}
      </span>
    </div>
  </button>
);

const DIVISION_ORDER = {
  "American League": ["AL East", "AL Central", "AL West"],
  "National League": ["NL East", "NL Central", "NL West"],
};

const formatPct = (pct) => {
  if (pct == null || pct === "") return "--";
  const n = Number(pct);
  if (Number.isNaN(n)) return "--";
  return n.toFixed(3).replace(/^0\./, ".");
};

const formatGB = (gb) => {
  if (!gb || gb === "-") return "—";
  return gb;
};

const gameStatusStyle = (game) => {
  if (game.isLive) return "text-emerald-300";
  if (game.isFinal) return "text-slate-500";
  return "text-sky-400";
};

const LeaguePanel = ({ league }) => {
  const topStanding = league.standings?.[0];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = (league.latestGames || []).filter((g) => g.date === todayStr).length;

  const divisionOrder = DIVISION_ORDER[league.league] || [];
  const divisionGroups = (league.standings || []).reduce((acc, team) => {
    const div = team.division || "Other";
    if (!acc[div]) acc[div] = [];
    acc[div].push(team);
    return acc;
  }, {});

  const orderedDivisions = [
    ...divisionOrder.filter((d) => divisionGroups[d]),
    ...Object.keys(divisionGroups).filter((d) => !divisionOrder.includes(d)),
  ];

  return (
    <section className="rounded-[26px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">League overview</div>
          <h2 className="mt-2 text-xl font-semibold text-white">{league.league}</h2>
        </div>
        <div
          className={`rounded-full border px-3 py-1.5 text-xs ${leagueAccent[league.league] || "border-white/10 bg-white/5 text-slate-200"}`}
        >
          {league.teamsInLeague || 0} clubs
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MetricTile label="Top Record" value={topStanding ? topStanding.record : "--"} accent />
        <MetricTile
          label="Leader"
          value={topStanding ? `${topStanding.abbreviation} ${formatPct(topStanding.pct)}` : "--"}
        />
        <MetricTile label="Today's Games" value={todayCount || (league.latestGames || []).length} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-500">
            <ShieldCheck size={12} className="text-amber-300" />
            Standings
          </div>

          <div className="mb-1 grid grid-cols-[1.5rem_1fr_auto_auto_auto] gap-x-2 px-1 text-[10px] uppercase tracking-[0.24em] text-slate-600">
            <span />
            <span>Team</span>
            <span className="text-right">W-L</span>
            <span className="w-10 text-right">PCT</span>
            <span className="w-8 text-right">GB</span>
          </div>

          <div className="space-y-3">
            {orderedDivisions.map((division) => (
              <div key={division}>
                <div className="mb-1 px-1 text-[10px] uppercase tracking-[0.3em] text-slate-600">{division}</div>
                <div className="space-y-1">
                  {(divisionGroups[division] || []).map((team, i) => (
                    <div
                      key={team.teamId}
                      className="grid grid-cols-[1.5rem_1fr_auto_auto_auto] items-center gap-x-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-sm"
                    >
                      <span className="text-xs text-slate-600">{i + 1}</span>
                      <span className="truncate font-medium text-slate-100">{team.name}</span>
                      <span className="text-right text-slate-300">{team.record}</span>
                      <span className="w-10 text-right text-xs text-slate-400">{formatPct(team.pct)}</span>
                      <span className="w-8 text-right text-xs text-slate-500">{formatGB(team.gamesBack)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-500">
            <CalendarDays size={12} className="text-amber-300" />
            Latest scores
          </div>
          <div className="space-y-2">
            {(league.latestGames || []).map((game) => (
              <div key={game.gameId} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">{formatDate(game.date)}</span>
                  <span className={`font-medium ${gameStatusStyle(game)}`}>{game.status}</span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-200">{game.matchup}</span>
                  <span className={`text-sm font-semibold ${game.score === "TBD" ? "text-slate-500" : "text-white"}`}>
                    {game.score}
                  </span>
                </div>
              </div>
            ))}
            {!league.latestGames?.length && <div className="text-sm text-slate-500">No recent games available.</div>}
          </div>
        </div>
      </div>
    </section>
  );
};

const BaseballTrackerPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [leagueOverview, setLeagueOverview] = useState({ season: new Date().getFullYear(), leagues: [] });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [selectedTeamIds, setSelectedTeamIds] = useState(DEFAULT_TEAM_IDS);
  const [teamCards, setTeamCards] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");

  const [watchlist, setWatchlist] = useState({ watchedTeams: [], watchedPlayers: [] });
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState("");

  const watchedTeamIds = useMemo(
    () => new Set((watchlist.watchedTeams || []).map((team) => String(team.teamId))),
    [watchlist],
  );
  const watchedPlayerIds = useMemo(
    () => new Set((watchlist.watchedPlayers || []).map((player) => String(player.playerId))),
    [watchlist],
  );
  const selectedTeamSet = useMemo(() => new Set(selectedTeamIds), [selectedTeamIds]);

  useEffect(() => {
    let active = true;

    const loadWatchlist = async () => {
      try {
        setWatchlistLoading(true);
        const data = await fetchBaseballWatchlist();
        if (!active) return;
        setWatchlist(data || { watchedTeams: [], watchedPlayers: [] });
      } catch {
        if (active) setWatchlist({ watchedTeams: [], watchedPlayers: [] });
      } finally {
        if (active) setWatchlistLoading(false);
      }
    };

    loadWatchlist();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError("");
        const data = await fetchBaseballLeagueOverview();
        if (!active) return;
        setLeagueOverview(data || { season: new Date().getFullYear(), leagues: [] });
      } catch (error) {
        if (active) {
          setLeagueOverview({ season: new Date().getFullYear(), leagues: [] });
          setOverviewError(error.response?.data?.message || error.message || "Unable to load league overview");
        }
      } finally {
        if (active) setOverviewLoading(false);
      }
    };

    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadTeamStats = async () => {
      if (!selectedTeamIds.length) {
        setTeamCards([]);
        return;
      }

      try {
        setTeamLoading(true);
        setTeamError("");
        const data = await fetchBaseballTeamStats(selectedTeamIds);
        if (!active) return;
        setTeamCards(data.teams || []);
      } catch (error) {
        if (active) {
          setTeamCards([]);
          setTeamError(error.response?.data?.message || error.message || "Unable to load team stats");
        }
      } finally {
        if (active) setTeamLoading(false);
      }
    };

    loadTeamStats();
    return () => {
      active = false;
    };
  }, [selectedTeamIds]);

  useEffect(() => {
    let active = true;

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchError("");
      setSelectedPlayerId("");
      setSelectedPlayer(null);
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        const data = await searchBaseballPlayers(searchQuery);
        if (!active) return;
        const players = data.players || [];
        setSearchResults(players);
        setSelectedPlayerId((current) => {
          if (current && players.some((player) => String(player.playerId) === String(current))) return current;
          return players[0]?.playerId || "";
        });
      } catch (error) {
        if (active) {
          setSearchResults([]);
          setSearchError(error.response?.data?.message || error.message || "Unable to search players");
        }
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    let active = true;

    const loadPlayer = async () => {
      if (!selectedPlayerId) {
        setSelectedPlayer(null);
        return;
      }

      try {
        setPlayerLoading(true);
        setPlayerError("");
        const data = await fetchBaseballPlayer(selectedPlayerId);
        if (!active) return;
        setSelectedPlayer(data);
      } catch (error) {
        if (active) {
          setSelectedPlayer(null);
          setPlayerError(error.response?.data?.message || error.message || "Unable to load player profile");
        }
      } finally {
        if (active) setPlayerLoading(false);
      }
    };

    loadPlayer();
    return () => {
      active = false;
    };
  }, [selectedPlayerId]);

  const refreshOverview = async () => {
    try {
      setOverviewLoading(true);
      setOverviewError("");
      const data = await fetchBaseballLeagueOverview(true);
      setLeagueOverview(data || { season: new Date().getFullYear(), leagues: [] });
    } catch (error) {
      setOverviewError(error.response?.data?.message || error.message || "Unable to refresh league overview");
    } finally {
      setOverviewLoading(false);
    }
  };

  const toggleTeamSelection = (teamId) => {
    setSelectedTeamIds((current) =>
      current.includes(teamId) ? current.filter((selectedId) => selectedId !== teamId) : [...current, teamId],
    );
  };

  const syncWatchlist = async (mutation) => {
    const data = await mutation();
    setWatchlist(data || { watchedTeams: [], watchedPlayers: [] });
    return data;
  };

  const handleTeamWatch = async (team) => {
    try {
      if (watchedTeamIds.has(String(team.teamId))) {
        await syncWatchlist(() => unwatchBaseballTeam(team.teamId));
      } else {
        await syncWatchlist(() => watchBaseballTeam(team));
      }
    } catch (error) {
      setTeamError(error.response?.data?.message || error.message || "Unable to update watchlist");
    }
  };

  const handlePlayerWatch = async (player) => {
    try {
      const payload = {
        playerId: player.playerId,
        name: player.name,
        teamId: player.teamId,
        teamName: player.teamName,
        position: player.position,
      };

      if (watchedPlayerIds.has(String(player.playerId))) {
        await syncWatchlist(() => unwatchBaseballPlayer(player.playerId));
      } else {
        await syncWatchlist(() => watchBaseballPlayer(payload));
      }
    } catch (error) {
      setPlayerError(error.response?.data?.message || error.message || "Unable to update player watchlist");
    }
  };

  const selectedTeamCards = useMemo(
    () => teamCards.filter((team) => selectedTeamSet.has(String(team.teamId))),
    [teamCards, selectedTeamSet],
  );

  const selectedPlayerResult = useMemo(
    () => searchResults.find((player) => String(player.playerId) === String(selectedPlayerId)) || null,
    [searchResults, selectedPlayerId],
  );

  const playerTeamLabel = selectedPlayer?.teamName || selectedPlayerResult?.teamName || "Free Agent / Unknown";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b10] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(180,133,57,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(18,30,42,0.9),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(0,0,0,0.7),transparent)]" />

      <div className="relative space-y-6 p-4 md:p-6">
        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/85 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.36em] text-amber-100/80">
                <Trophy size={13} />
                MLB tracker / multi-view command center
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Baseball Tracker</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                  Track every league pulse from one place. Open standings and latest scores first, drill into
                  highlighted teams next, then lock onto individual players and recent performances.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[420px]">
              <MetricTile label="Season" value={leagueOverview.season || new Date().getFullYear()} accent />
              <MetricTile label="Leagues" value={(leagueOverview.leagues || []).length || 2} />
              <MetricTile label="Teams watched" value={(watchlist.watchedTeams || []).length} />
              <MetricTile label="Players watched" value={(watchlist.watchedPlayers || []).length} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${
                  activeTab === tab.id
                    ? "border-amber-400/45 bg-amber-400/15 text-amber-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/30 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(overviewError || teamError || searchError || playerError) && (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {overviewError || teamError || searchError || playerError}
            </div>
          )}
        </section>

        {activeTab === "overview" && (
          <section className="space-y-6">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={refreshOverview}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 transition hover:border-amber-400/30 hover:text-amber-100"
              >
                <RefreshCw size={14} className={overviewLoading ? "animate-spin" : ""} />
                Refresh overview
              </button>
            </div>

            {overviewLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin text-amber-300" />
                Loading league standings and latest scores...
              </div>
            ) : (
              <div className="grid gap-6 2xl:grid-cols-2">
                {(leagueOverview.leagues || []).map((league) => (
                  <LeaguePanel key={league.league} league={league} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "teams" && (
          <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Team selection</div>
                    <h2 className="mt-2 text-lg font-semibold text-white">Build your highlighted board</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTeamIds(DEFAULT_TEAM_IDS)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-amber-400/30 hover:text-amber-100"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {Object.entries(teamGroups).map(([league, teams]) => (
                    <div key={league} className="space-y-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
                        <ShieldCheck size={12} className="text-amber-300" />
                        {league}
                      </div>
                      <div className="grid gap-2">
                        {teams.map((team) => {
                          const checked = selectedTeamSet.has(team.teamId);
                          return (
                            <label
                              key={team.teamId}
                              className={`flex cursor-pointer items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
                                checked
                                  ? "border-amber-400/40 bg-amber-400/10 text-white"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/20 hover:text-white"
                              }`}
                            >
                              <span>
                                <span className="block font-medium">{team.name}</span>
                                <span className="mt-0.5 block text-[11px] uppercase tracking-[0.22em] text-slate-500">
                                  {team.division}
                                </span>
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleTeamSelection(team.teamId)}
                                className="h-4 w-4 rounded border-slate-500 bg-transparent text-amber-400 focus:ring-amber-400"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Watchlist</div>
                    <h2 className="mt-2 text-lg font-semibold text-white">Pinned teams</h2>
                  </div>
                  {watchlistLoading ? (
                    <Loader2 size={16} className="animate-spin text-slate-500" />
                  ) : (
                    <Users size={16} className="text-amber-300" />
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(watchlist.watchedTeams || []).length ? (
                    watchlist.watchedTeams.map((team) => (
                      <button
                        key={team.teamId}
                        type="button"
                        onClick={() => toggleTeamSelection(String(team.teamId))}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100 transition hover:border-amber-400/40"
                      >
                        <Star size={12} fill="currentColor" />
                        {team.teamName}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No watched teams yet.</p>
                  )}
                </div>
              </div>
            </aside>

            <main className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Highlighted teams</div>
                  <h2 className="mt-2 text-lg font-semibold text-white">Deep seasonal team snapshots</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTeamIds([...selectedTeamIds])}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-slate-300 transition hover:border-amber-400/30 hover:text-amber-100"
                >
                  <RefreshCw size={14} />
                  Refresh cards
                </button>
              </div>

              <div className="mt-5">
                {teamLoading ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin text-amber-300" />
                    Loading highlighted teams...
                  </div>
                ) : selectedTeamCards.length ? (
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    {selectedTeamCards.map((team) => (
                      <TeamCard
                        key={team.teamId}
                        team={team}
                        watched={watchedTeamIds.has(String(team.teamId))}
                        onToggleWatch={handleTeamWatch}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-500">
                    Select at least one team to load deep stats.
                  </div>
                )}
              </div>
            </main>
          </section>
        )}

        {activeTab === "players" && (
          <section className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Player tracker</div>
                <h2 className="mt-2 text-lg font-semibold text-white">Search players and follow latest performances</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Search as you type
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-4">
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Search size={16} className="text-amber-300" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search hitters, pitchers, or two-way players"
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </label>

                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-slate-500">
                  <span>{searchLoading ? "Searching..." : `${searchResults.length} results`}</span>
                  <span>{searchQuery.trim().length < 2 ? "Type 2+ letters" : "Live MLB search"}</span>
                </div>

                <div className="space-y-2">
                  {searchLoading ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400">
                      <Loader2 size={16} className="animate-spin text-amber-300" />
                      Searching players...
                    </div>
                  ) : searchResults.length ? (
                    searchResults.map((player) => (
                      <PlayerResult
                        key={player.playerId}
                        player={player}
                        active={String(player.playerId) === String(selectedPlayerId)}
                        watched={watchedPlayerIds.has(String(player.playerId))}
                        onSelect={() => setSelectedPlayerId(String(player.playerId))}
                        onToggleWatch={handlePlayerWatch}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-500">
                      Search for a player to inspect season production and recent games.
                    </div>
                  )}
                </div>

                {(watchlist.watchedPlayers || []).length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 text-[11px] uppercase tracking-[0.28em] text-slate-500">Watched players</div>
                    <div className="flex flex-wrap gap-2">
                      {watchlist.watchedPlayers.map((player) => (
                        <button
                          key={player.playerId}
                          type="button"
                          onClick={() => setSelectedPlayerId(String(player.playerId))}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-200 transition hover:border-amber-400/30 hover:text-white"
                        >
                          <Eye size={12} />
                          {player.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-black p-5">
                {playerLoading ? (
                  <div className="flex h-full min-h-[360px] items-center justify-center gap-3 text-sm text-slate-400">
                    <Loader2 size={18} className="animate-spin text-amber-300" />
                    Loading player profile...
                  </div>
                ) : selectedPlayer ? (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Selected player</div>
                        <h3 className="mt-2 text-2xl font-semibold text-white">{selectedPlayer.name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            {playerTeamLabel}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            {selectedPlayer.position || "--"}
                          </span>
                          {selectedPlayer.isPitcher && (
                            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-100">
                              Pitcher
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlayerWatch(selectedPlayer)}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-100 transition hover:border-amber-400/50"
                      >
                        {watchedPlayerIds.has(String(selectedPlayer.playerId)) ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                        {watchedPlayerIds.has(String(selectedPlayer.playerId)) ? "Unwatch player" : "Watch player"}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <MetricTile label="AVG" value={formatMetric(selectedPlayer.slashLine?.avg)} accent />
                      <MetricTile label="OBP" value={formatMetric(selectedPlayer.slashLine?.obp)} />
                      <MetricTile label="SLG" value={formatMetric(selectedPlayer.slashLine?.slg)} />
                      <MetricTile label="HR" value={selectedPlayer.hitting?.homeRuns ?? 0} />
                      <MetricTile label="RBI" value={selectedPlayer.hitting?.rbis ?? 0} />
                      <MetricTile label="K" value={selectedPlayer.pitching?.strikeouts ?? 0} />
                      <MetricTile label="ERA" value={formatMetric(selectedPlayer.pitching?.era, 2)} />
                      <MetricTile label="WHIP" value={formatMetric(selectedPlayer.pitching?.whip, 2)} />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-500">
                        <Activity size={12} className="text-amber-300" />
                        Latest performances
                      </div>
                      <div className="space-y-2">
                        {(selectedPlayer.latestPerformances || []).map((entry) => (
                          <div
                            key={`${entry.date || "na"}-${entry.gameId || "na"}`}
                            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                              <span>{formatDate(entry.date)}</span>
                              <span>{entry.opponent || "Opponent TBD"}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-200">
                              {entry.hitting && (
                                <span>
                                  H: {entry.hitting.hits ?? 0} / AB: {entry.hitting.atBats ?? 0} / HR:{" "}
                                  {entry.hitting.homeRuns ?? 0}
                                </span>
                              )}
                              {entry.pitching && (
                                <span>
                                  IP: {entry.pitching.inningsPitched || "0.0"} / K: {entry.pitching.strikeouts ?? 0} /
                                  ER: {entry.pitching.earnedRuns ?? 0}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {!selectedPlayer.latestPerformances?.length && (
                          <div className="text-sm text-slate-500">No recent game logs available for this player.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-slate-500">
                    <Trophy size={30} className="text-amber-300/80" />
                    <p className="max-w-md text-sm leading-6">
                      Search for a player, then open the profile to inspect season totals and recent performance logs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BaseballTrackerPage;
