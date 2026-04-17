const axios = require("axios");
const User = require("../models/User");

const MLB_API_BASE_URL = process.env.MLB_API_BASE_URL || "https://statsapi.mlb.com/api/v1";
const MLB_API_KEY = process.env.MLB_API_KEY || process.env.RAPIDAPI_KEY || "";
const MLB_API_HOST = process.env.MLB_API_HOST || process.env.RAPIDAPI_HOST || "";
const MLB_SEASON = Number(process.env.MLB_SEASON || new Date().getFullYear());

const cache = new Map();

const apiClient = axios.create({
  baseURL: MLB_API_BASE_URL,
  timeout: 12000,
  headers: MLB_API_KEY
    ? {
        "X-RapidAPI-Key": MLB_API_KEY,
        ...(MLB_API_HOST ? { "X-RapidAPI-Host": MLB_API_HOST } : {}),
      }
    : {},
});

const setCache = (key, data, ttlMs) => {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
};

const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const cachedFetch = async (key, ttlMs, loader) => {
  const cached = getCache(key);
  if (cached) return cached;

  const data = await loader();
  setCache(key, data, ttlMs);
  return data;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const safeNumber = (value) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const apiGet = async (path, params, cacheKey, ttlMs) => {
  return cachedFetch(cacheKey, ttlMs, async () => {
    const { data } = await apiClient.get(path, { params });
    return data;
  });
};

const getTeamRecords = (standingsData) =>
  toArray(standingsData?.records).flatMap((record) => toArray(record?.teamRecords));

const findTeamRecord = (standingsData, teamId) =>
  getTeamRecords(standingsData).find((record) => String(record?.team?.id) === String(teamId)) || null;

const extractGroupStats = (statsData, groupName) => {
  const groups = toArray(statsData?.stats);
  const node = groups.find(
    (entry) => String(entry?.group?.displayName || "").toLowerCase() === groupName.toLowerCase(),
  );
  const split = toArray(node?.splits)[0] || null;
  return split?.stat || split || node?.stat || {};
};

const formatTeamStats = (teamMeta, standingsData, hittingStats, pitchingStats) => {
  const standing = findTeamRecord(standingsData, teamMeta.id);
  const leagueRecord = standing?.leagueRecord || {};
  const recordWins = safeNumber(standing?.wins ?? leagueRecord?.wins ?? standing?.leagueWins);
  const recordLosses = safeNumber(standing?.losses ?? leagueRecord?.losses ?? standing?.leagueLosses);

  return {
    teamId: String(teamMeta.id),
    name: teamMeta.name,
    abbreviation: teamMeta.abbreviation || teamMeta.teamCode || teamMeta.fileCode,
    teamName: teamMeta.name,
    league: teamMeta.league?.name || standing?.league?.name || standing?.leagueRecord?.league?.name || "MLB",
    division: teamMeta.division?.name || standing?.division?.name || "",
    record: `${recordWins ?? 0}-${recordLosses ?? 0}`,
    wins: recordWins ?? 0,
    losses: recordLosses ?? 0,
    standing: standing?.divisionRank || standing?.leagueRank || standing?.sportRank || standing?.rank || null,
    gamesBack: standing?.gamesBack || null,
    pct: standing?.winningPercentage || standing?.pct || null,
    era: pitchingStats?.era ?? pitchingStats?.earnedRunAverage ?? null,
    whip: pitchingStats?.whip ?? null,
    ba: hittingStats?.avg ?? hittingStats?.battingAverage ?? null,
    slugging: hittingStats?.slg ?? hittingStats?.sluggingPercentage ?? null,
  };
};

const extractPlayerStats = (person) => {
  const statsGroups = toArray(person?.stats);
  const hittingGroup = statsGroups.find((entry) => String(entry?.group?.displayName || "").toLowerCase() === "hitting");
  const pitchingGroup = statsGroups.find(
    (entry) => String(entry?.group?.displayName || "").toLowerCase() === "pitching",
  );

  const hittingStats =
    (toArray(hittingGroup?.splits)[0] || {})?.stat || toArray(hittingGroup?.splits)[0] || hittingGroup?.stat || {};
  const pitchingStats =
    (toArray(pitchingGroup?.splits)[0] || {})?.stat || toArray(pitchingGroup?.splits)[0] || pitchingGroup?.stat || {};

  const primaryPosition = person?.primaryPosition?.abbreviation || person?.primaryPosition?.name || "";
  const isPitcher = primaryPosition === "P" || String(primaryPosition).toLowerCase().includes("pitch");

  return {
    playerId: String(person?.id),
    name: person?.fullName || person?.name || "Unknown Player",
    teamId: person?.currentTeam?.id ? String(person.currentTeam.id) : null,
    teamName: person?.currentTeam?.name || person?.currentTeam?.teamName || null,
    position: primaryPosition,
    jerseyNumber: person?.primaryNumber || null,
    bats: person?.batSide?.description || person?.batSide?.code || null,
    throws: person?.pitchHand?.description || person?.pitchHand?.code || null,
    isPitcher,
    slashLine: {
      avg: hittingStats?.avg ?? null,
      obp: hittingStats?.obp ?? null,
      slg: hittingStats?.slg ?? null,
    },
    hitting: {
      homeRuns: safeNumber(hittingStats?.homeRuns ?? hittingStats?.hr) ?? 0,
      rbis: safeNumber(hittingStats?.rbi) ?? 0,
      hits: safeNumber(hittingStats?.hits) ?? 0,
      atBats: safeNumber(hittingStats?.atBats) ?? 0,
    },
    pitching: {
      whip: pitchingStats?.whip ?? null,
      strikeouts: safeNumber(pitchingStats?.strikeOuts ?? pitchingStats?.strikeouts) ?? 0,
      era: pitchingStats?.era ?? null,
      wins: safeNumber(pitchingStats?.wins) ?? 0,
      losses: safeNumber(pitchingStats?.losses) ?? 0,
      saves: safeNumber(pitchingStats?.saves) ?? 0,
    },
    updatedAt: new Date().toISOString(),
  };
};

const getWatchlistSnapshot = async (userId) => {
  const user = await User.findById(userId).select("watchedBaseballTeams watchedBaseballPlayers");
  if (!user) return { watchedTeams: [], watchedPlayers: [] };

  return {
    watchedTeams: user.watchedBaseballTeams || [],
    watchedPlayers: user.watchedBaseballPlayers || [],
  };
};

const formatIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getAllTeamsMetadata = async () => {
  const cacheKey = `baseball:teams:meta:${MLB_SEASON}`;
  const teamsResp = await apiGet("/teams", { sportId: 1, season: MLB_SEASON }, cacheKey, 1000 * 60 * 60 * 12);

  const teams = toArray(teamsResp?.teams).map((team) => ({
    id: String(team.id),
    name: team.name,
    abbreviation: team.abbreviation || team.teamCode || team.fileCode || "",
    league: team.league?.name || "MLB",
    division: team.division?.name || "",
  }));

  return {
    teams,
    byId: new Map(teams.map((team) => [team.id, team])),
  };
};

const normalizeLeagueName = (rawLeague) => {
  const value = String(rawLeague || "").toLowerCase();
  if (value.includes("american")) return "American League";
  if (value.includes("national")) return "National League";
  return "MLB";
};

const extractLatestPerformances = (hittingLogResp, pitchingLogResp) => {
  const hittingSplits = extractGroupStats(hittingLogResp, "hitting");
  const pitchingSplits = extractGroupStats(pitchingLogResp, "pitching");

  const normalized = new Map();

  toArray(hittingLogResp?.stats)
    .flatMap((entry) => toArray(entry?.splits))
    .forEach((split) => {
      const key = split?.date || split?.game?.gamePk;
      if (!key) return;
      normalized.set(key, {
        date: split?.date || null,
        opponent: split?.opponent?.name || split?.opponent?.teamName || "",
        gameId: split?.game?.gamePk || null,
        hitting: {
          hits: safeNumber(split?.stat?.hits) ?? 0,
          atBats: safeNumber(split?.stat?.atBats) ?? 0,
          homeRuns: safeNumber(split?.stat?.homeRuns) ?? 0,
          rbis: safeNumber(split?.stat?.rbi) ?? 0,
          avg: split?.stat?.avg ?? null,
          ops: split?.stat?.ops ?? null,
        },
      });
    });

  toArray(pitchingLogResp?.stats)
    .flatMap((entry) => toArray(entry?.splits))
    .forEach((split) => {
      const key = split?.date || split?.game?.gamePk;
      if (!key) return;
      const existing = normalized.get(key) || {
        date: split?.date || null,
        opponent: split?.opponent?.name || split?.opponent?.teamName || "",
        gameId: split?.game?.gamePk || null,
      };

      existing.pitching = {
        inningsPitched: split?.stat?.inningsPitched ?? null,
        strikeouts: safeNumber(split?.stat?.strikeOuts ?? split?.stat?.strikeouts) ?? 0,
        earnedRuns: safeNumber(split?.stat?.earnedRuns) ?? 0,
        era: split?.stat?.era ?? null,
        whip: split?.stat?.whip ?? null,
      };

      normalized.set(key, existing);
    });

  return [...normalized.values()].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 6);
};

exports.getLeagueOverview = async (req, res) => {
  try {
    const standingsKey = `baseball:standings:${MLB_SEASON}`;
    const scheduleKey = `baseball:schedule:overview:${formatIsoDate(new Date())}`;

    const [{ teams, byId }, standingsData] = await Promise.all([
      getAllTeamsMetadata(),
      apiGet("/standings", { season: MLB_SEASON }, standingsKey, 1000 * 60 * 5),
    ]);

    const records = getTeamRecords(standingsData);
    const teamsByLeague = {
      "American League": [],
      "National League": [],
    };

    records.forEach((record) => {
      const teamId = String(record?.team?.id || "");
      if (!teamId) return;
      const meta = byId.get(teamId);
      if (!meta) return;

      const leagueName = normalizeLeagueName(meta.league);
      if (!teamsByLeague[leagueName]) return;

      teamsByLeague[leagueName].push({
        teamId,
        name: meta.name,
        abbreviation: meta.abbreviation,
        division: meta.division,
        record: `${record?.wins ?? 0}-${record?.losses ?? 0}`,
        wins: safeNumber(record?.wins) ?? 0,
        losses: safeNumber(record?.losses) ?? 0,
        pct: record?.winningPercentage || record?.pct || "",
        standing: record?.divisionRank || record?.leagueRank || record?.sportRank || null,
        gamesBack: record?.gamesBack || null,
      });
    });

    Object.keys(teamsByLeague).forEach((league) => {
      teamsByLeague[league].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        const pctA = Number(a.pct || 0);
        const pctB = Number(b.pct || 0);
        return pctB - pctA;
      });
    });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const scheduleData = await apiGet(
      "/schedule",
      {
        sportId: 1,
        startDate: formatIsoDate(yesterday),
        endDate: formatIsoDate(tomorrow),
      },
      scheduleKey,
      1000 * 60 * 3,
    );

    const gamesByLeague = {
      "American League": [],
      "National League": [],
    };

    toArray(scheduleData?.dates)
      .flatMap((dateNode) => toArray(dateNode?.games))
      .forEach((game) => {
        const homeTeamId = String(game?.teams?.home?.team?.id || "");
        const awayTeamId = String(game?.teams?.away?.team?.id || "");
        const homeMeta = byId.get(homeTeamId);
        const awayMeta = byId.get(awayTeamId);
        const leagueName = normalizeLeagueName(homeMeta?.league || awayMeta?.league);

        if (!gamesByLeague[leagueName]) return;

        const gameState = game?.status?.abstractGameState || game?.status?.codedGameState || "";
        const isFinal = gameState === "Final";
        const isLive = gameState === "Live" || gameState === "In Progress";

        const awayScore = safeNumber(game?.teams?.away?.score);
        const homeScore = safeNumber(game?.teams?.home?.score);
        let scoreDisplay = "TBD";
        if (isFinal || isLive) {
          scoreDisplay = `${awayScore ?? 0}-${homeScore ?? 0}`;
        }

        gamesByLeague[leagueName].push({
          gameId: game?.gamePk,
          date: String(game?.gameDate || "").slice(0, 10),
          matchup: `${game?.teams?.away?.team?.name || "Away"} @ ${game?.teams?.home?.team?.name || "Home"}`,
          score: scoreDisplay,
          status: game?.status?.detailedState || gameState || "Scheduled",
          isFinal,
          isLive,
        });
      });

    Object.keys(gamesByLeague).forEach((league) => {
      gamesByLeague[league].sort((a, b) => {
        const aDate = Date.parse(a.date || "") || 0;
        const bDate = Date.parse(b.date || "") || 0;
        return bDate - aDate;
      });
      gamesByLeague[league] = gamesByLeague[league].slice(0, 8);
    });

    return res.status(200).json({
      success: true,
      data: {
        season: MLB_SEASON,
        leagues: [
          {
            league: "American League",
            standings: teamsByLeague["American League"],
            latestGames: gamesByLeague["American League"],
            teamsInLeague: teams.filter((team) => normalizeLeagueName(team.league) === "American League").length,
          },
          {
            league: "National League",
            standings: teamsByLeague["National League"],
            latestGames: gamesByLeague["National League"],
            teamsInLeague: teams.filter((team) => normalizeLeagueName(team.league) === "National League").length,
          },
        ],
      },
    });
  } catch (error) {
    console.error("[baseballController] getLeagueOverview failed:", error.response?.data || error.message);
    return res.status(503).json({
      success: false,
      message: error.response?.data?.message || error.message || "Unable to load league overview",
    });
  }
};

exports.getTeamSeasonStats = async (req, res) => {
  try {
    const rawTeamIds = String(req.query.teamIds || "")
      .split(",")
      .map((teamId) => teamId.trim())
      .filter(Boolean);

    if (!rawTeamIds.length) {
      return res.status(200).json({ success: true, data: { season: MLB_SEASON, teams: [] } });
    }

    const seasonKey = `baseball:standings:${MLB_SEASON}`;
    const standingsData = await apiGet("/standings", { season: MLB_SEASON }, seasonKey, 1000 * 60 * 5);

    const teams = await Promise.all(
      rawTeamIds.map(async (teamId) => {
        const teamKey = `baseball:team:${MLB_SEASON}:${teamId}`;
        const teamMetaResp = await apiGet(
          `/teams/${teamId}`,
          { sportId: 1, season: MLB_SEASON },
          teamKey,
          1000 * 60 * 30,
        );
        const teamMeta = toArray(teamMetaResp?.teams)[0] || { id: teamId, name: `Team ${teamId}` };

        const hittingKey = `baseball:hitting:${MLB_SEASON}:${teamId}`;
        const pitchingKey = `baseball:pitching:${MLB_SEASON}:${teamId}`;
        const [hittingResp, pitchingResp] = await Promise.all([
          apiGet(
            `/teams/${teamId}/stats`,
            { stats: "season", group: "hitting", season: MLB_SEASON },
            hittingKey,
            1000 * 60 * 5,
          ),
          apiGet(
            `/teams/${teamId}/stats`,
            { stats: "season", group: "pitching", season: MLB_SEASON },
            pitchingKey,
            1000 * 60 * 5,
          ),
        ]);

        const hittingStats = extractGroupStats(hittingResp, "hitting");
        const pitchingStats = extractGroupStats(pitchingResp, "pitching");

        return formatTeamStats(teamMeta, standingsData, hittingStats, pitchingStats);
      }),
    );

    return res.status(200).json({
      success: true,
      data: {
        season: MLB_SEASON,
        teams,
      },
    });
  } catch (error) {
    console.error("[baseballController] getTeamSeasonStats failed:", error.response?.data || error.message);
    return res.status(503).json({
      success: false,
      message: error.response?.data?.message || error.message || "Unable to load MLB team stats",
    });
  }
};

exports.searchPlayers = async (req, res) => {
  try {
    const query = String(req.query.q || req.query.query || "").trim();
    if (query.length < 2) {
      return res.status(200).json({ success: true, data: { season: MLB_SEASON, query, players: [] } });
    }

    const cacheKey = `baseball:player-search:${MLB_SEASON}:${query.toLowerCase()}`;
    const searchResp = await apiGet("/people/search", { names: query, sportId: 1 }, cacheKey, 1000 * 60 * 2);

    const players = toArray(searchResp?.people).map((person) => ({
      playerId: String(person.id),
      name: person.fullName || person.name,
      teamId: person.currentTeam?.id ? String(person.currentTeam.id) : null,
      teamName: person.currentTeam?.name || null,
      position: person.primaryPosition?.abbreviation || person.primaryPosition?.name || "",
      active: Boolean(person.active),
    }));

    return res.status(200).json({
      success: true,
      data: {
        season: MLB_SEASON,
        query,
        players,
      },
    });
  } catch (error) {
    console.error("[baseballController] searchPlayers failed:", error.response?.data || error.message);
    return res.status(503).json({
      success: false,
      message: error.response?.data?.message || error.message || "Unable to search MLB players",
    });
  }
};

exports.getPlayerProfile = async (req, res) => {
  try {
    const playerId = String(req.params.playerId || "").trim();
    if (!playerId) {
      return res.status(400).json({ success: false, message: "playerId is required" });
    }

    const cacheKey = `baseball:player-detail:${MLB_SEASON}:${playerId}`;
    const gameLogHittingKey = `baseball:player-gamelog:hitting:${MLB_SEASON}:${playerId}`;
    const gameLogPitchingKey = `baseball:player-gamelog:pitching:${MLB_SEASON}:${playerId}`;
    const [playerResp, hittingLogResp, pitchingLogResp] = await Promise.all([
      apiGet(
        `/people/${playerId}`,
        { hydrate: "stats(group=[hitting,pitching],type=[season])" },
        cacheKey,
        1000 * 60 * 3,
      ),
      apiGet(
        `/people/${playerId}/stats`,
        { stats: "gameLog", group: "hitting", season: MLB_SEASON },
        gameLogHittingKey,
        1000 * 60 * 3,
      ),
      apiGet(
        `/people/${playerId}/stats`,
        { stats: "gameLog", group: "pitching", season: MLB_SEASON },
        gameLogPitchingKey,
        1000 * 60 * 3,
      ),
    ]);

    const person = toArray(playerResp?.people)[0];
    if (!person) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        season: MLB_SEASON,
        player: {
          ...extractPlayerStats(person),
          latestPerformances: extractLatestPerformances(hittingLogResp, pitchingLogResp),
        },
      },
    });
  } catch (error) {
    console.error("[baseballController] getPlayerProfile failed:", error.response?.data || error.message);
    return res.status(503).json({
      success: false,
      message: error.response?.data?.message || error.message || "Unable to load MLB player profile",
    });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const data = await getWatchlistSnapshot(req.user.id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("[baseballController] getWatchlist failed:", error.message || error);
    return res.status(500).json({ success: false, message: "Unable to load watchlist" });
  }
};

exports.watchTeam = async (req, res) => {
  try {
    const { teamId, teamName, abbreviation, league, division } = req.body || {};
    if (!teamId || !teamName) {
      return res.status(400).json({ success: false, message: "teamId and teamName are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existing = (user.watchedBaseballTeams || []).some((entry) => String(entry.teamId) === String(teamId));
    if (!existing) {
      user.watchedBaseballTeams = [
        {
          teamId: String(teamId),
          teamName,
          abbreviation: abbreviation || "",
          league: league || "MLB",
          division: division || "",
          watchedAt: new Date(),
        },
        ...(user.watchedBaseballTeams || []),
      ];
      await user.save({ validateBeforeSave: false });
    }

    const snapshot = await getWatchlistSnapshot(req.user.id);
    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    console.error("[baseballController] watchTeam failed:", error.message || error);
    return res.status(500).json({ success: false, message: "Unable to save watched team" });
  }
};

exports.unwatchTeam = async (req, res) => {
  try {
    const teamId = String(req.params.teamId || "").trim();
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.watchedBaseballTeams = (user.watchedBaseballTeams || []).filter((entry) => String(entry.teamId) !== teamId);
    await user.save({ validateBeforeSave: false });

    const snapshot = await getWatchlistSnapshot(req.user.id);
    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    console.error("[baseballController] unwatchTeam failed:", error.message || error);
    return res.status(500).json({ success: false, message: "Unable to remove watched team" });
  }
};

exports.watchPlayer = async (req, res) => {
  try {
    const { playerId, name, teamId, teamName, position, bats, throws } = req.body || {};
    if (!playerId || !name) {
      return res.status(400).json({ success: false, message: "playerId and name are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existing = (user.watchedBaseballPlayers || []).some((entry) => String(entry.playerId) === String(playerId));
    if (!existing) {
      user.watchedBaseballPlayers = [
        {
          playerId: String(playerId),
          name,
          teamId: teamId ? String(teamId) : null,
          teamName: teamName || "",
          position: position || "",
          bats: bats || "",
          throws: throws || "",
          watchedAt: new Date(),
        },
        ...(user.watchedBaseballPlayers || []),
      ];
      await user.save({ validateBeforeSave: false });
    }

    const snapshot = await getWatchlistSnapshot(req.user.id);
    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    console.error("[baseballController] watchPlayer failed:", error.message || error);
    return res.status(500).json({ success: false, message: "Unable to save watched player" });
  }
};

exports.unwatchPlayer = async (req, res) => {
  try {
    const playerId = String(req.params.playerId || "").trim();
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.watchedBaseballPlayers = (user.watchedBaseballPlayers || []).filter(
      (entry) => String(entry.playerId) !== playerId,
    );
    await user.save({ validateBeforeSave: false });

    const snapshot = await getWatchlistSnapshot(req.user.id);
    return res.status(200).json({ success: true, data: snapshot });
  } catch (error) {
    console.error("[baseballController] unwatchPlayer failed:", error.message || error);
    return res.status(500).json({ success: false, message: "Unable to remove watched player" });
  }
};
