import api from "./api";

const TEAM_CACHE_TTL = 1000 * 60 * 5;
const PLAYER_CACHE_TTL = 1000 * 60 * 2;
const WATCHLIST_CACHE_TTL = 1000 * 20;
const OVERVIEW_CACHE_TTL = 1000 * 60 * 2;

const teamStatsCache = new Map();
const playerSearchCache = new Map();
const playerDetailCache = new Map();
let overviewCache = null;
let overviewFetchedAt = 0;
let watchlistCache = null;
let watchlistFetchedAt = 0;

const cacheLookup = (bucket, key, ttl) => {
  const entry = bucket.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > ttl) {
    bucket.delete(key);
    return null;
  }
  return entry.value;
};

const cacheStore = (bucket, key, value) => {
  bucket.set(key, { value, fetchedAt: Date.now() });
  return value;
};

export const MLB_TEAMS = [
  { teamId: "110", name: "Baltimore Orioles", abbreviation: "BAL", league: "American League", division: "AL East" },
  { teamId: "111", name: "Boston Red Sox", abbreviation: "BOS", league: "American League", division: "AL East" },
  { teamId: "147", name: "New York Yankees", abbreviation: "NYY", league: "American League", division: "AL East" },
  { teamId: "139", name: "Tampa Bay Rays", abbreviation: "TB", league: "American League", division: "AL East" },
  { teamId: "141", name: "Toronto Blue Jays", abbreviation: "TOR", league: "American League", division: "AL East" },
  { teamId: "145", name: "Chicago White Sox", abbreviation: "CWS", league: "American League", division: "AL Central" },
  {
    teamId: "114",
    name: "Cleveland Guardians",
    abbreviation: "CLE",
    league: "American League",
    division: "AL Central",
  },
  { teamId: "116", name: "Detroit Tigers", abbreviation: "DET", league: "American League", division: "AL Central" },
  { teamId: "118", name: "Kansas City Royals", abbreviation: "KC", league: "American League", division: "AL Central" },
  { teamId: "142", name: "Minnesota Twins", abbreviation: "MIN", league: "American League", division: "AL Central" },
  { teamId: "117", name: "Houston Astros", abbreviation: "HOU", league: "American League", division: "AL West" },
  { teamId: "108", name: "Los Angeles Angels", abbreviation: "LAA", league: "American League", division: "AL West" },
  { teamId: "133", name: "Oakland Athletics", abbreviation: "OAK", league: "American League", division: "AL West" },
  { teamId: "136", name: "Seattle Mariners", abbreviation: "SEA", league: "American League", division: "AL West" },
  { teamId: "140", name: "Texas Rangers", abbreviation: "TEX", league: "American League", division: "AL West" },
  { teamId: "144", name: "Atlanta Braves", abbreviation: "ATL", league: "National League", division: "NL East" },
  { teamId: "146", name: "Miami Marlins", abbreviation: "MIA", league: "National League", division: "NL East" },
  { teamId: "121", name: "New York Mets", abbreviation: "NYM", league: "National League", division: "NL East" },
  { teamId: "143", name: "Philadelphia Phillies", abbreviation: "PHI", league: "National League", division: "NL East" },
  { teamId: "120", name: "Washington Nationals", abbreviation: "WSH", league: "National League", division: "NL East" },
  { teamId: "112", name: "Chicago Cubs", abbreviation: "CHC", league: "National League", division: "NL Central" },
  { teamId: "113", name: "Cincinnati Reds", abbreviation: "CIN", league: "National League", division: "NL Central" },
  { teamId: "158", name: "Milwaukee Brewers", abbreviation: "MIL", league: "National League", division: "NL Central" },
  { teamId: "134", name: "Pittsburgh Pirates", abbreviation: "PIT", league: "National League", division: "NL Central" },
  {
    teamId: "138",
    name: "St. Louis Cardinals",
    abbreviation: "STL",
    league: "National League",
    division: "NL Central",
  },
  { teamId: "109", name: "Arizona Diamondbacks", abbreviation: "AZ", league: "National League", division: "NL West" },
  { teamId: "115", name: "Colorado Rockies", abbreviation: "COL", league: "National League", division: "NL West" },
  { teamId: "119", name: "Los Angeles Dodgers", abbreviation: "LAD", league: "National League", division: "NL West" },
  { teamId: "135", name: "San Diego Padres", abbreviation: "SD", league: "National League", division: "NL West" },
  { teamId: "137", name: "San Francisco Giants", abbreviation: "SF", league: "National League", division: "NL West" },
];

const buildTeamKey = (teamIds) => [...new Set(teamIds.map(String))].sort().join(",");

export const fetchBaseballTeamStats = async (teamIds) => {
  const normalizedIds = Array.isArray(teamIds) ? teamIds.map(String).filter(Boolean) : [];
  if (!normalizedIds.length) return { season: new Date().getFullYear(), teams: [] };

  const cacheKey = buildTeamKey(normalizedIds);
  const cached = cacheLookup(teamStatsCache, cacheKey, TEAM_CACHE_TTL);
  if (cached) return cached;

  const { data } = await api.get("/sports/baseball/teams/stats", {
    params: { teamIds: normalizedIds.join(",") },
  });

  return cacheStore(teamStatsCache, cacheKey, data.data || { season: new Date().getFullYear(), teams: [] });
};

export const fetchBaseballLeagueOverview = async (force = false) => {
  if (!force && overviewCache && Date.now() - overviewFetchedAt < OVERVIEW_CACHE_TTL) {
    return overviewCache;
  }

  const { data } = await api.get("/sports/baseball/overview");
  overviewCache = data.data || { season: new Date().getFullYear(), leagues: [] };
  overviewFetchedAt = Date.now();
  return overviewCache;
};

export const searchBaseballPlayers = async (query) => {
  const normalizedQuery = String(query || "").trim();
  if (normalizedQuery.length < 2) return { season: new Date().getFullYear(), query: normalizedQuery, players: [] };

  const cacheKey = normalizedQuery.toLowerCase();
  const cached = cacheLookup(playerSearchCache, cacheKey, PLAYER_CACHE_TTL);
  if (cached) return cached;

  const { data } = await api.get("/sports/baseball/players/search", {
    params: { q: normalizedQuery },
  });

  return cacheStore(
    playerSearchCache,
    cacheKey,
    data.data || { season: new Date().getFullYear(), query: normalizedQuery, players: [] },
  );
};

export const fetchBaseballPlayer = async (playerId) => {
  const normalizedId = String(playerId || "").trim();
  if (!normalizedId) return null;

  const cached = cacheLookup(playerDetailCache, normalizedId, PLAYER_CACHE_TTL);
  if (cached) return cached;

  const { data } = await api.get(`/sports/baseball/players/${normalizedId}`);
  return cacheStore(playerDetailCache, normalizedId, data.data?.player || null);
};

export const fetchBaseballWatchlist = async (force = false) => {
  if (!force && watchlistCache && Date.now() - watchlistFetchedAt < WATCHLIST_CACHE_TTL) {
    return watchlistCache;
  }

  const { data } = await api.get("/sports/baseball/watchlist");
  watchlistCache = data.data || { watchedTeams: [], watchedPlayers: [] };
  watchlistFetchedAt = Date.now();
  return watchlistCache;
};

const invalidateWatchlist = () => {
  watchlistCache = null;
  watchlistFetchedAt = 0;
  overviewCache = null;
  overviewFetchedAt = 0;
};

export const watchBaseballTeam = async (team) => {
  const { data } = await api.post("/sports/baseball/watch/team", team);
  invalidateWatchlist();
  return data.data;
};

export const unwatchBaseballTeam = async (teamId) => {
  const { data } = await api.delete(`/sports/baseball/watch/team/${teamId}`);
  invalidateWatchlist();
  return data.data;
};

export const watchBaseballPlayer = async (player) => {
  const { data } = await api.post("/sports/baseball/watch/player", player);
  invalidateWatchlist();
  return data.data;
};

export const unwatchBaseballPlayer = async (playerId) => {
  const { data } = await api.delete(`/sports/baseball/watch/player/${playerId}`);
  invalidateWatchlist();
  return data.data;
};
