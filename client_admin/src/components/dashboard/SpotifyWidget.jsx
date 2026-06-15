// --- FILE: client-admin/src/components/dashboard/SpotifyWidget.jsx (New File) ---
import { useState, useEffect } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { useAuth } from "../../context/AuthContext";
import { Music, RefreshCw } from "lucide-react";

const SpotifyWidget = () => {
  const { user } = useAuth();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastAutoSync, setLastAutoSync] = useState(null);

  const connectSpotify = async () => {
    try {
      const response = await api.get("/spotify/login");
      // Redirect the user to the Spotify authorization page
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Could not initiate Spotify connection:", error);
      alert("Failed to connect to Spotify. Please try again.");
    }
  };

  const handleSync = async (isAutoSync = false) => {
    if (!isAutoSync) setIsSyncing(true);
    try {
      const response = await api.post("/spotify/sync");
      if (isAutoSync) {
        setLastAutoSync(new Date());
        console.log("Auto-sync completed:", response.data);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      if (!isAutoSync) {
        alert("Failed to sync recent tracks.");
      }
      console.error("Sync error:", error);
    } finally {
      if (!isAutoSync) setIsSyncing(false);
    }
  };

  // This effect polls for the currently playing track every 15 seconds
  useEffect(() => {
    if (user?.spotifyConnected) {
      const fetchCurrentTrack = async () => {
        try {
          const response = await api.get("/spotify/currently-playing");
          const d = response?.data?.data;
          if (d && d.is_playing && (d.item || d.track)) {
            // Normalize to a consistent shape: keep the original for progress, but ensure we have a track object
            setCurrentTrack(d);
          } else {
            // If nothing is playing, fetch the last played track from our database
            const recent = await api.get("/spotify/recently-played?limit=1");
            if (recent.data.items && recent.data.items.length > 0) {
              // Convert our database format to resemble Spotify API track shape
              const lastTrack = recent.data.items[0];
              setCurrentTrack({
                track: {
                  id: lastTrack.trackId,
                  name: lastTrack.trackName,
                  artists: [{ name: lastTrack.artistName }],
                  album: { name: lastTrack.albumName, images: [] },
                  duration_ms: lastTrack.durationMs,
                },
                played_at: lastTrack.playedAt,
                is_playing: false,
              });
            } else {
              setCurrentTrack(null);
            }
          }
        } catch (error) {
          const message = error?.response?.data?.message || "Spotify is temporarily unavailable.";
          console.warn("Spotify status fetch failed:", message);
        }
      };

      fetchCurrentTrack(); // Fetch immediately on load
      const intervalId = setInterval(fetchCurrentTrack, 15000); // Then every 15 seconds
      return () => clearInterval(intervalId); // Cleanup on unmount
    }
  }, [user?.spotifyConnected]);

  // Auto-sync effect - runs every 5 minutes in the widget
  useEffect(() => {
    if (!user?.spotifyConnected) return;

    // Auto-sync every 5 minutes
    const autoSyncInterval = setInterval(() => {
      handleSync(true);
    }, 5 * 60 * 1000); // 5 minutes

    // Initial auto-sync after 1 minute
    const initialSyncTimeout = setTimeout(() => {
      handleSync(true);
    }, 60 * 1000); // 1 minute after widget loads

    return () => {
      clearInterval(autoSyncInterval);
      clearTimeout(initialSyncTimeout);
    };
  }, [user?.spotifyConnected]);

  // If user hasn't connected their Spotify account yet
  if (!user?.spotifyConnected) {
    return (
      <Widget title="Spotify Activity" variant="plain">
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm text-text-secondary mb-4">Connect your Spotify account to see your listening stats.</p>
          <button
            onClick={connectSpotify}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Connect to Spotify
          </button>
        </div>
      </Widget>
    );
  }

  // If connected but no track data is loaded yet
  if (!currentTrack) {
    return (
      <Widget title="Spotify Activity" variant="plain">
        <p className="text-sm text-text-secondary">Loading listening data...</p>
      </Widget>
    );
  }

  // Prefer Spotify's currently-playing 'item' if present; otherwise use our fallback 'track'
  const track = currentTrack.item || currentTrack.track || currentTrack;
  const albumArtUrl = track?.album?.images?.[0]?.url;
  const artists = Array.isArray(track?.artists) ? track.artists.map((a) => a.name).join(", ") : "Unknown Artist";

  return (
    <Widget title="Spotify Activity" className="flex flex-col" variant="plain">
      <div className="flex items-center gap-4">
        {albumArtUrl ? (
          <img src={albumArtUrl} alt={track.album.name} className="w-24 h-24 rounded-md object-cover" />
        ) : (
          <div className="w-24 h-24 bg-gray-700 rounded-md flex items-center justify-center">
            <Music />
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <p className="font-bold text-white truncate">{track.name || "Unknown Track"}</p>
          <p className="text-sm text-text-secondary truncate">{artists}</p>
          {track?.album?.name && <p className="text-xs text-text-tertiary truncate">Album: {track.album.name}</p>}
          {currentTrack.is_playing && (
            <div className="w-full bg-gray-600 rounded-full h-1 mt-2">
              <div
                className="bg-green-500 h-1 rounded-full"
                style={{ width: `${((currentTrack.progress_ms || 0) / (track.duration_ms || 1)) * 100}%` }}
              ></div>
            </div>
          )}
          <p className="text-xs text-text-tertiary mt-1">
            {currentTrack.is_playing ? "Currently Playing" : "Last Played"}
          </p>
        </div>
      </div>
      <div className="mt-4 border-t border-gray-700/50 pt-3">
        <button
          onClick={() => handleSync(false)}
          disabled={isSyncing}
          className="w-full text-xs text-text-secondary hover:text-white flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing ? "Syncing..." : "Sync Recent Activity"}
        </button>
        {lastAutoSync && (
          <div className="text-center mt-1">
            <span className="text-xs text-text-tertiary">Auto-synced: {lastAutoSync.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </Widget>
  );
};

export default SpotifyWidget;
