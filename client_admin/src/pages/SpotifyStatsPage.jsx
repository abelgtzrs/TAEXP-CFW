import { useEffect, useState } from "react";
import api from "../services/api";
import Widget from "../components/ui/Widget";
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
} from "lucide-react";

const SpotifyStatsPage = () => {
  const [stats, setStats] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTracks: 0, limit: 100 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [error, setError] = useState(null);

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
          <Widget title="Top Artists" className="h-96">
            <div className="space-y-2 overflow-y-auto">
              {stats.topArtists.map((artist, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-surface/30">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-white text-sm truncate">{artist.name}</div>
                      <div className="text-xs text-text-secondary">{artist.minutes} minutes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{artist.plays}</div>
                    <div className="text-xs text-text-secondary">plays</div>
                  </div>
                </div>
              ))}
            </div>
          </Widget>

          <Widget title="Top Albums" className="h-96">
            <div className="space-y-2 overflow-y-auto">
              {stats.topAlbums.map((album, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-surface/30">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-white text-sm truncate">{album.name}</div>
                      <div className="text-xs text-text-secondary">{album.minutes} minutes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{album.plays}</div>
                    <div className="text-xs text-text-secondary">plays</div>
                  </div>
                </div>
              ))}
            </div>
          </Widget>

          <Widget title="Top Tracks" className="h-96">
            <div className="space-y-2 overflow-y-auto">
              {stats.topTracks.map((track, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-surface/30">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                    <div>
                      <div className="font-semibold text-white text-sm truncate">{track.name}</div>
                      <div className="text-xs text-text-secondary">{track.artist}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">{track.plays}</div>
                    <div className="text-xs text-text-secondary">plays</div>
                  </div>
                </div>
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
