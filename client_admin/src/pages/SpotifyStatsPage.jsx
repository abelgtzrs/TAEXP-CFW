import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import Widget from "../components/ui/Widget";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  RefreshCw,
  Music,
  Clock,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
  ZapOff,
  X,
  Mic2,
  Disc3,
  ListMusic,
  ExternalLink,
} from "lucide-react";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const StatPill = ({ label, value, accent = "text-emerald-400" }) => (
  <div className="flex flex-col gap-0.5 rounded-lg border border-white/8 bg-white/5 px-3 py-2 min-w-[80px]">
    <span className={`text-lg font-bold leading-none ${accent}`}>{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
  </div>
);

const HorizBar = ({ label, sub, value, max, accent = "bg-emerald-500" }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-white truncate max-w-[200px]">{label}</div>
          {sub && <div className="text-[10px] text-white/40 truncate max-w-[200px]">{sub}</div>}
        </div>
        <span className="text-xs font-bold text-white/70 ml-2 shrink-0">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10">
        <div className={`h-full rounded-full ${accent} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const DowChart = ({ data }) => {
  const map = {};
  data.forEach((d) => {
    map[d.day] = d.plays;
  });
  const rows = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ name: DOW_LABELS[n - 1], plays: map[n] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={rows} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
        <XAxis dataKey="name" tick={{ fill: "#ffffff55", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff15", borderRadius: 6, fontSize: 11 }}
          labelStyle={{ color: "#fff" }}
          itemStyle={{ color: "#34d399" }}
        />
        <Bar dataKey="plays" fill="#10b981" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const TrendChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={90}>
    <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
      <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: "#ffffff30", fontSize: 9 }} axisLine={false} tickLine={false} />
      <Tooltip
        contentStyle={{ background: "#1a1a2e", border: "1px solid #ffffff15", borderRadius: 6, fontSize: 11 }}
        labelStyle={{ color: "#fff" }}
        itemStyle={{ color: "#34d399" }}
        formatter={(v) => [v, "plays"]}
      />
      <Bar dataKey="plays" fill="#6ee7b7" radius={[2, 2, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

const DetailPanel = ({ panel, onClose, formatDate, formatDuration }) => {
  const { visible, type, data, loading } = panel;

  const typeIcon =
    type === "artist" ? <Mic2 size={15} /> : type === "album" ? <Disc3 size={15} /> : <ListMusic size={15} />;
  const typeLabel = type === "artist" ? "Artist" : type === "album" ? "Album" : "Track";
  const accentClass = type === "artist" ? "text-emerald-400" : type === "album" ? "text-sky-400" : "text-violet-400";
  const barAccent = type === "artist" ? "bg-emerald-500" : type === "album" ? "bg-sky-500" : "bg-violet-500";
  const maxPlays = data?.topTracks ? Math.max(...data.topTracks.map((t) => t.plays), 1) : 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 w-full max-w-[480px] flex flex-col bg-[#0d0d16] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
        style={{ bottom: "var(--bottom-nav-height)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8 shrink-0">
          <span className={accentClass}>{typeIcon}</span>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${accentClass}`}>
            {typeLabel} Detail
          </span>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="animate-spin text-white/30" size={24} />
          </div>
        )}

        {!loading && !data && (
          <div className="flex-1 flex items-center justify-center text-sm text-white/30">Failed to load details.</div>
        )}

        {!loading && data && (
          <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{data.name}</h2>
              {data.artist && <div className="text-sm text-white/50 mt-0.5">{data.artist}</div>}
            </div>

            {/* Summary pills */}
            <div className="flex flex-wrap gap-2">
              <StatPill label="Plays" value={data.totalPlays.toLocaleString()} accent={accentClass} />
              <StatPill label="Minutes" value={data.totalMinutes.toLocaleString()} accent={accentClass} />
              {data.uniqueTrackCount != null && (
                <StatPill label="Tracks" value={data.uniqueTrackCount} accent="text-white/60" />
              )}
              {data.uniqueAlbumCount != null && (
                <StatPill label="Albums" value={data.uniqueAlbumCount} accent="text-white/60" />
              )}
              {data.avgDurationMs > 0 && (
                <StatPill label="Avg Len" value={formatDuration(data.avgDurationMs)} accent="text-white/60" />
              )}
            </div>

            {/* First / Last played */}
            {(data.firstPlayed || data.lastPlayed) && (
              <div className="flex gap-4 text-xs text-white/40">
                {data.firstPlayed && (
                  <span>
                    First: <span className="text-white/70">{formatDate(data.firstPlayed)}</span>
                  </span>
                )}
                {data.lastPlayed && (
                  <span>
                    Last: <span className="text-white/70">{formatDate(data.lastPlayed)}</span>
                  </span>
                )}
              </div>
            )}

            {/* 30-day trend */}
            {data.dailyTrend?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">30-Day Trend</div>
                <TrendChart data={data.dailyTrend} />
              </div>
            )}

            {/* Day of week */}
            {data.dayOfWeek?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Day of Week</div>
                <DowChart data={data.dayOfWeek} />
              </div>
            )}

            {/* Top tracks */}
            {data.topTracks?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-3">
                  {type === "artist" ? "Top Tracks" : "Tracks"}
                </div>
                <div className="space-y-3">
                  {data.topTracks.map((t, i) => (
                    <HorizBar key={i} label={t.name} sub={t.artist} value={t.plays} max={maxPlays} accent={barAccent} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent plays (track detail only) */}
            {data.recentPlays?.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Recent Plays</div>
                <div className="space-y-1">
                  {data.recentPlays.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                      <span className="text-white/50">{formatDate(p.playedAt)}</span>
                      <span className="text-white/30">{formatDuration(p.durationMs)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const FullListPanel = ({ panel, onClose, onOpenDetail }) => {
  const { visible, type, data, loading } = panel;

  const typeLabel = type === "artist" ? "All Artists" : type === "album" ? "All Albums" : "All Tracks";
  const accentClass = type === "artist" ? "text-emerald-400" : type === "album" ? "text-sky-400" : "text-violet-400";
  const typeIcon =
    type === "artist" ? <Mic2 size={15} /> : type === "album" ? <Disc3 size={15} /> : <ListMusic size={15} />;
  const hoverColor =
    type === "artist"
      ? "group-hover:text-emerald-300"
      : type === "album"
        ? "group-hover:text-sky-300"
        : "group-hover:text-violet-300";
  const maxPlays = data?.length ? Math.max(...data.map((d) => d.plays), 1) : 1;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 z-50 w-full max-w-[480px] flex flex-col bg-[#0d0d16] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}
        style={{ bottom: "var(--bottom-nav-height)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8 shrink-0">
          <span className={accentClass}>{typeIcon}</span>
          <span className={`text-[10px] uppercase tracking-widest font-semibold ${accentClass}`}>{typeLabel}</span>
          {data && <span className="ml-1 text-[10px] text-white/30 font-normal">({data.length.toLocaleString()})</span>}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="animate-spin text-white/30" size={24} />
          </div>
        )}

        {!loading && !data && (
          <div className="flex-1 flex items-center justify-center text-sm text-white/30">Failed to load list.</div>
        )}

        {!loading && data && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {data.map((item, idx) => {
              const pct = Math.round((item.plays / maxPlays) * 100);
              return (
                <button
                  key={idx}
                  onClick={() => onOpenDetail(type, item.name, item.artist)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-white/5 transition-colors text-left group border-b border-white/5"
                >
                  <span className="text-[11px] font-mono text-white/25 w-7 shrink-0 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold text-white truncate ${hoverColor} transition-colors`}>
                      {item.name}
                    </div>
                    {item.artist && <div className="text-[10px] text-white/40 truncate">{item.artist}</div>}
                    <div className="mt-1 h-1 w-full rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${type === "artist" ? "bg-emerald-500" : type === "album" ? "bg-sky-500" : "bg-violet-500"} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-xs font-bold ${accentClass}`}>{item.plays.toLocaleString()}</div>
                    <div className="text-[10px] text-white/30">{item.minutes}m</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

const SpotifyStatsPage = () => {
  const [stats, setStats] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTracks: 0, limit: 100 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState({
    visible: false,
    type: null,
    name: null,
    artist: null,
    data: null,
    loading: false,
  });
  const [listPanel, setListPanel] = useState({ visible: false, type: null, data: null, loading: false });

  const openDetail = useCallback(async (type, name, artist = null) => {
    setPanel({ visible: true, type, name, artist, data: null, loading: true });
    try {
      let res;
      if (type === "artist") res = await api.get(`/spotify/artist-detail?name=${encodeURIComponent(name)}`);
      else if (type === "album") res = await api.get(`/spotify/album-detail?name=${encodeURIComponent(name)}`);
      else
        res = await api.get(
          `/spotify/track-detail?name=${encodeURIComponent(name)}${artist ? `&artist=${encodeURIComponent(artist)}` : ""}`,
        );
      setPanel((p) => ({ ...p, data: res.data.detail, loading: false }));
    } catch (err) {
      setPanel((p) => ({ ...p, loading: false, data: null }));
    }
  }, []);

  const closePanel = useCallback(() => setPanel((p) => ({ ...p, visible: false })), []);

  const openFullList = useCallback(async (type) => {
    setListPanel({ visible: true, type, data: null, loading: true });
    try {
      const res = await api.get(`/spotify/full-list?type=${type}`);
      setListPanel((p) => ({ ...p, data: res.data.items, loading: false }));
    } catch {
      setListPanel((p) => ({ ...p, loading: false, data: null }));
    }
  }, []);

  const closeFullList = useCallback(() => setListPanel((p) => ({ ...p, visible: false })), []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/spotify/stats");
      setStats(res.data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      const msg = err?.response?.data?.message || "Failed to fetch Spotify statistics.";
      setError(msg);
    }
  };

  const fetchTracks = async (page = 1) => {
    try {
      const res = await api.get(`/spotify/recently-played?page=${page}&limit=100`);
      setTracks(res.data.items || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalTracks: 0, limit: 100 });
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      const msg = err?.response?.data?.message || "Failed to fetch recent tracks.";
      setError(msg);
    }
  };

  const handleSync = async (isAutoSync = false) => {
    if (!isAutoSync) setSyncing(true);
    try {
      const res = await api.post("/spotify/sync");
      console.log("Sync result:", res.data);
      setLastSyncTime(new Date());

      // Only refresh data if we got new tracks or if this is a manual sync
      if (res.data.newTracks > 0 || !isAutoSync) {
        await Promise.all([fetchStats(), fetchTracks(pagination.currentPage)]);
      }
    } catch (err) {
      console.error("Sync failed:", err);
      if (!isAutoSync) {
        const msg = err?.response?.data?.message || "Failed to sync Spotify data.";
        setError(msg);
      }
    } finally {
      if (!isAutoSync) setSyncing(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTracks(newPage);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchTracks()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Auto-sync effect - runs every 5 minutes when enabled
  useEffect(() => {
    if (!autoSync) return;

    const autoSyncInterval = setInterval(
      () => {
        handleSync(true); // true indicates this is an auto-sync
      },
      5 * 60 * 1000,
    ); // 5 minutes

    return () => clearInterval(autoSyncInterval);
  }, [autoSync, pagination.currentPage]);

  // Initial auto-sync after 30 seconds
  useEffect(() => {
    if (!autoSync) return;

    const initialSyncTimeout = setTimeout(() => {
      handleSync(true);
    }, 30 * 1000); // 30 seconds after page load

    return () => clearTimeout(initialSyncTimeout);
  }, [autoSync]);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin mr-2" />
          <span>Loading Spotify data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <DetailPanel panel={panel} onClose={closePanel} formatDate={formatDate} formatDuration={formatDuration} />
      <FullListPanel panel={listPanel} onClose={closeFullList} onOpenDetail={openDetail} />
      {/* Header with Sync Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Spotify Statistics</h1>
        <div className="flex items-center gap-3">
          {/* Auto-sync toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                autoSync
                  ? "bg-green-600/20 text-green-400 border border-green-600/50"
                  : "bg-gray-600/20 text-gray-400 border border-gray-600/50"
              }`}
            >
              {autoSync ? <Zap size={14} /> : <ZapOff size={14} />}
              Auto-sync {autoSync ? "ON" : "OFF"}
            </button>
            {lastSyncTime && (
              <span className="text-xs text-text-secondary">Last: {lastSyncTime.toLocaleTimeString()}</span>
            )}
          </div>

          {/* Manual sync button */}
          <button
            onClick={() => handleSync(false)}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={syncing ? "animate-spin" : ""} size={16} />
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg">{error}</div>}

      {/* Overview Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Widget title="Total Listening" className="text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">{stats.total.tracks.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Total Tracks</div>
              <div className="text-lg font-semibold text-white">{stats.total.hours.toLocaleString()} hrs</div>
              <div className="text-xs text-text-secondary">{stats.total.minutes.toLocaleString()} minutes</div>
            </div>
          </Widget>

          <Widget title="Today" className="text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-400">{stats.today.tracks}</div>
              <div className="text-sm text-text-secondary">Tracks Today</div>
              <div className="text-lg font-semibold text-white">{stats.today.minutes} min</div>
              <div className="text-xs text-text-secondary">Listening time</div>
            </div>
          </Widget>

          <Widget title="This Week" className="text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-400">{stats.thisWeek.tracks}</div>
              <div className="text-sm text-text-secondary">Tracks This Week</div>
              <div className="text-lg font-semibold text-white">
                {Math.round((stats.thisWeek.minutes / 60) * 100) / 100} hrs
              </div>
              <div className="text-xs text-text-secondary">{stats.thisWeek.minutes} minutes</div>
            </div>
          </Widget>

          <Widget title="This Month" className="text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-400">{stats.thisMonth.tracks}</div>
              <div className="text-sm text-text-secondary">Tracks This Month</div>
              <div className="text-lg font-semibold text-white">
                {Math.round((stats.thisMonth.minutes / 60) * 100) / 100} hrs
              </div>
              <div className="text-xs text-text-secondary">{stats.thisMonth.minutes} minutes</div>
            </div>
          </Widget>
        </div>
      )}

      {/* Top Statistics */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Widget
            title="Top Artists"
            className="h-96"
            titleChildren={
              <button
                onClick={() => openFullList("artist")}
                className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400/70 hover:text-emerald-300 transition-colors"
              >
                <ListMusic size={11} /> View All
              </button>
            }
          >
            <div className="space-y-2 overflow-y-auto">
              {stats.topArtists.map((artist, idx) => (
                <button
                  key={idx}
                  onClick={() => openDetail("artist", artist.name)}
                  className="w-full flex justify-between items-center p-2 rounded bg-surface/30 hover:bg-surface/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-white text-sm truncate group-hover:text-emerald-300 transition-colors">
                        {artist.name}
                      </div>
                      <div className="text-xs text-text-secondary">{artist.minutes} minutes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{artist.plays}</div>
                    <div className="text-xs text-text-secondary">plays</div>
                  </div>
                </button>
              ))}
            </div>
          </Widget>

          <Widget
            title="Top Albums"
            className="h-96"
            titleChildren={
              <button
                onClick={() => openFullList("album")}
                className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-sky-400/70 hover:text-sky-300 transition-colors"
              >
                <ListMusic size={11} /> View All
              </button>
            }
          >
            <div className="space-y-2 overflow-y-auto">
              {stats.topAlbums.map((album, idx) => (
                <button
                  key={idx}
                  onClick={() => openDetail("album", album.name)}
                  className="w-full flex justify-between items-center p-2 rounded bg-surface/30 hover:bg-surface/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-white text-sm truncate group-hover:text-sky-300 transition-colors">
                        {album.name}
                      </div>
                      <div className="text-xs text-text-secondary">{album.minutes} minutes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{album.plays}</div>
                    <div className="text-xs text-text-secondary">plays</div>
                  </div>
                </button>
              ))}
            </div>
          </Widget>

          <Widget
            title="Top Tracks"
            className="h-96"
            titleChildren={
              <button
                onClick={() => openFullList("track")}
                className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-violet-400/70 hover:text-violet-300 transition-colors"
              >
                <ListMusic size={11} /> View All
              </button>
            }
          >
            <div className="space-y-2 overflow-y-auto">
              {stats.topTracks.map((track, idx) => (
                <button
                  key={idx}
                  onClick={() => openDetail("track", track.name, track.artist)}
                  className="w-full flex justify-between items-center p-2 rounded bg-surface/30 hover:bg-surface/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-white text-sm truncate group-hover:text-violet-300 transition-colors">
                        {track.name}
                      </div>
                      <div className="text-xs text-text-secondary">{track.artist}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{track.plays}</div>
                    <div className="text-xs text-text-secondary">plays</div>
                  </div>
                </button>
              ))}
            </div>
          </Widget>
        </div>
      )}

      {/* Recent Tracks with Pagination */}
      <Widget title={`Recent Tracks (Page ${pagination.currentPage} of ${pagination.totalPages})`}>
        <div className="space-y-4">
          {/* Pagination Controls */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-text-secondary">
              Showing {tracks.length} of {pagination.totalTracks.toLocaleString()} total tracks
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="p-2 rounded bg-surface/50 hover:bg-surface/70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-primary/20 text-primary rounded">{pagination.currentPage}</span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="p-2 rounded bg-surface/50 hover:bg-surface/70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Tracks Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-surface/60">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Track</th>
                  <th className="p-2 text-left">Artist</th>
                  <th className="p-2 text-left">Album</th>
                  <th className="p-2 text-left">Played At</th>
                  <th className="p-2 text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, idx) => (
                  <tr key={track._id || idx} className="border-b border-gray-700/30 hover:bg-surface/20">
                    <td className="p-2 text-text-secondary">
                      {(pagination.currentPage - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="p-2 font-semibold text-white">
                      <div className="truncate max-w-[200px]">{track.trackName}</div>
                    </td>
                    <td className="p-2 text-text-secondary">
                      <div className="truncate max-w-[150px]">{track.artistName}</div>
                    </td>
                    <td className="p-2 text-text-secondary">
                      <div className="truncate max-w-[150px]">{track.albumName}</div>
                    </td>
                    <td className="p-2 text-text-secondary">{formatDate(track.playedAt)}</td>
                    <td className="p-2 text-text-secondary">{formatDuration(track.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {tracks.length === 0 && !loading && (
            <div className="text-center py-8 text-text-secondary">
              No tracks found. Try syncing your recent activity.
            </div>
          )}
        </div>
      </Widget>
    </div>
  );
};

export default SpotifyStatsPage;
