import { useState } from "react";
import { Film, Gamepad2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import MediaTab from "../components/media/MediaTab";
import { searchMovies, searchGames } from "../services/mediaService";

const MOVIE_STATUS_OPTIONS = [
  { value: "backlog", label: "Watchlist" },
  { value: "watched", label: "Watched" },
];

const GAME_STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog" },
  { value: "playing", label: "Playing" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "dropped", label: "Dropped" },
];

const TABS = [
  { id: "movie", label: "Movies", icon: Film },
  { id: "game", label: "Games", icon: Gamepad2 },
];

const MediaPage = () => {
  const [activeTab, setActiveTab] = useState("movie");

  return (
    <div className="max-w-5xl mx-auto w-full px-4 pb-24 md:pb-6">
      <PageHeader title="Media Tracker" subtitle="Log what you've watched and played, and queue up what's next." />

      <div className="mb-6 flex gap-6 border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "movie" && (
        <MediaTab
          mediaType="movie"
          searchFn={searchMovies}
          statusOptions={MOVIE_STATUS_OPTIONS}
          searchPlaceholder="Search movies to add..."
        />
      )}
      {activeTab === "game" && (
        <MediaTab
          mediaType="game"
          searchFn={searchGames}
          statusOptions={GAME_STATUS_OPTIONS}
          searchPlaceholder="Search games to add..."
        />
      )}
    </div>
  );
};

export default MediaPage;
