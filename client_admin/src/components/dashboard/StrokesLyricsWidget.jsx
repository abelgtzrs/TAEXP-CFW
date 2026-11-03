import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { RefreshCw, Music } from "lucide-react";

const StrokesLyricsWidget = () => {
  const [song, setSong] = useState(null);
  const [currentLyric, setCurrentLyric] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRandomSong = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/strokes/random");
      const newSong = response.data.data;
      setSong(newSong);

      // Select one random lyric from the new song
      if (newSong.lyrics && newSong.lyrics.length > 0) {
        const randomIndex = Math.floor(Math.random() * newSong.lyrics.length);
        setCurrentLyric(newSong.lyrics[randomIndex]);
      } else {
        setCurrentLyric("...");
      }
    } catch (err) {
      setError("Could not fetch lyrics. Is the database seeded?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a new song on mount and then set an interval to fetch a new one every 15 seconds
  useEffect(() => {
    fetchRandomSong(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchRandomSong();
    }, 15000); // Cycle every 15 seconds

    // Clear the interval when the component unmounts to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []);

  // Normalize any newline indicators to actual line breaks
  const formatLyric = (s) => {
    if (!s) return "";
    return s
      .replace(/\r\n/g, "\n") // windows newlines -> unix
      .replace(/\\n/g, "\n") // escaped backslash-n -> newline
      .replace(/\/n/g, "\n"); // literal /n -> newline
  };

  return (
    <Widget title="The Strokes - Lyrical Transmission" className="flex flex-col">
      {loading &&
        !song && ( // Only show initial loading state
          <div className="flex-grow flex items-center justify-center">
            <p className="text-text-secondary animate-pulse">Fetching transmission...</p>
          </div>
        )}
      {error && (
        <div className="flex-grow flex flex-col items-center justify-center">
          <p className="text-status-danger">{error}</p>
          <button onClick={fetchRandomSong} className="mt-4 text-primary hover:underline">
            Retry
          </button>
        </div>
      )}
      {song && (
        <div className="flex-grow flex flex-col justify-between">
          {/* Top section with song info */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              {song.album.coverImageUrl ? (
                <img
                  src={song.album.coverImageUrl}
                  alt={song.album.name}
                  className="w-12 h-12 rounded object-cover border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded border border-white/10 bg-white/[0.03] flex items-center justify-center">
                  <Music size={18} className="text-text-secondary" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text-main truncate">{song.title}</h3>
                <p className="text-xs text-text-secondary truncate">
                  {song.album.name} <span className="tabular-nums">· {song.album.year}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Lyric Section with Animation */}
          <div className="flex-grow flex items-center my-4 border-l-2 border-primary/50 pl-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentLyric + song.title} // Key change triggers animation
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-[15px] leading-7 text-text-main whitespace-pre-line break-words"
              >
                {formatLyric(currentLyric)}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Footer with Refresh Button */}
          <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-text-secondary">Rotates every 15s</span>
            <button onClick={fetchRandomSong} disabled={loading} className="dash-btn">
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Next
            </button>
          </div>
        </div>
      )}
    </Widget>
  );
};

export default StrokesLyricsWidget;
