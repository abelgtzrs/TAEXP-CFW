import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronDown,
  Film,
  Loader2,
  Plus,
  Search,
  Star,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { addMediaItem, deleteMediaItem, fetchMediaItems, updateMediaItem } from "../../services/mediaService";
import { buildMovieLibrary, movieKey } from "./movieLibrary";

const SEARCH_DEBOUNCE_MS = 350;
const MOVIE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "TV Movie",
  "Thriller",
  "War",
  "Western",
];

const MovieTab = ({ searchFn, statusOptions }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [addingKey, setAddingKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMediaItems("movie")
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setAddPanelOpen(data.length === 0);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your movie library.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setHasMore(false);
      setPage(1);
      return undefined;
    }

    let cancelled = false;
    setSearching(true);
    setError("");
    const timer = setTimeout(() => {
      searchFn(trimmed, 1)
        .then(({ results: newResults, hasMore: more }) => {
          if (cancelled) return;
          setResults(newResults);
          setPage(1);
          setHasMore(Boolean(more));
        })
        .catch(() => {
          if (!cancelled) setError("Movie search failed. Check the server's TMDB configuration.");
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchFn]);

  const addedKeys = useMemo(() => new Set(items.map(movieKey)), [items]);
  const library = useMemo(() => buildMovieLibrary(items, genreFilter), [genreFilter, items]);
  const watchedCount = useMemo(
    () => buildMovieLibrary(items).watched.length,
    [items]
  );

  const loadMoreResults = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || !hasMore || loadingMore || searching) return;

    setLoadingMore(true);
    setError("");
    try {
      const nextPage = page + 1;
      const { results: more, hasMore: moreLeft } = await searchFn(trimmed, nextPage);
      setResults((current) => [...current, ...more]);
      setPage(nextPage);
      setHasMore(Boolean(moreLeft));
    } catch {
      setError("Could not load more movie results.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAdd = async (result, status) => {
    const key = movieKey(result);
    setAddingKey(key);
    setError("");
    try {
      const created = await addMediaItem({
        mediaType: "movie",
        title: result.title,
        coverImageUrl: result.coverImageUrl,
        releaseYear: result.releaseYear,
        genre: result.genre,
        status,
      });
      setItems((current) => [created, ...current]);
    } catch {
      setError(`Could not add “${result.title}”.`);
    } finally {
      setAddingKey("");
    }
  };

  const saveMovie = async (item, changes, message) => {
    setError("");
    try {
      const updated = await updateMediaItem(item._id, changes);
      setItems((current) => current.map((movie) => (movie._id === item._id ? updated : movie)));
    } catch {
      setError(message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove “${item.title}” from your movies?`)) return;
    setError("");
    try {
      await deleteMediaItem(item._id);
      setItems((current) => current.filter((movie) => movie._id !== item._id));
    } catch {
      setError("Could not remove that movie.");
    }
  };

  const handleAddGenre = (item, genre) => {
    if (!genre || item.genre?.includes(genre)) return;
    saveMovie(item, { genre: [...(item.genre || []), genre] }, "Could not add that category.");
  };

  const handleRemoveGenre = (item, genre) => {
    saveMovie(item, { genre: (item.genre || []).filter((value) => value !== genre) }, "Could not remove that category.");
  };

  const visibleSections = [
    {
      id: "watchlist",
      title: "Watchlist",
      subtitle: "Saved for later",
      icon: <Bookmark size={16} />,
      items: library.watchlist,
    },
    {
      id: "watched",
      title: "Watched",
      subtitle: "Your movie history",
      icon: <Check size={16} />,
      items: library.watched,
    },
  ].filter((section) => {
    if (statusFilter !== "all") return section.id === statusFilter;
    return section.items.length > 0;
  });
  const visibleCount = visibleSections.reduce((total, section) => total + section.items.length, 0);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-surface shadow-lg shadow-black/10">
        <button
          type="button"
          onClick={() => setAddPanelOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-white/[0.025] sm:p-5"
          aria-expanded={addPanelOpen}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Plus size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-text-main">Add a movie</span>
              <span className="mt-0.5 block text-xs text-text-tertiary">Search TMDB, then choose Watchlist or Watched.</span>
            </span>
          </span>
          <ChevronDown size={18} className={`shrink-0 text-text-tertiary transition-transform ${addPanelOpen ? "rotate-180" : ""}`} />
        </button>

        {addPanelOpen && (
          <div className="border-t border-gray-700/50 p-4 sm:p-5">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by movie title…"
                className="w-full rounded-xl border border-gray-700/60 bg-background/60 py-3 pl-11 pr-11 text-sm text-text-main placeholder:text-text-tertiary focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-tertiary hover:bg-white/5 hover:text-text-main"
                  aria-label="Clear movie search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {query.trim().length === 1 && (
              <p className="mt-2 text-xs text-text-tertiary">Type one more character to search.</p>
            )}

            {query.trim().length >= 2 && (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    {searching ? "Searching…" : `${results.length} results`}
                  </p>
                  {searching && <Loader2 size={16} className="animate-spin text-primary" />}
                </div>

                {!searching && results.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-700/60 py-8 text-center text-sm text-text-tertiary">
                    No matching movies found.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {results.map((result) => (
                      <SearchResult
                        key={result.externalId}
                        result={result}
                        alreadyAdded={addedKeys.has(movieKey(result))}
                        adding={addingKey === movieKey(result)}
                        onAdd={handleAdd}
                      />
                    ))}
                  </div>
                )}

                {hasMore && !searching && (
                  <button
                    type="button"
                    onClick={loadMoreResults}
                    disabled={loadingMore}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700/60 py-2.5 text-xs font-semibold text-text-secondary hover:border-primary/40 hover:text-text-main disabled:cursor-wait disabled:opacity-60"
                  >
                    {loadingMore && <Loader2 size={14} className="animate-spin" />}
                    {loadingMore ? "Loading…" : "Load more results"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-status-danger/25 bg-status-danger/10 px-3 py-2 text-xs text-status-danger" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="rounded p-1 hover:bg-status-danger/10" aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-tertiary">
          <Loader2 size={18} className="animate-spin" /> Loading your movies…
        </div>
      ) : items.length === 0 ? (
        <EmptyLibrary onAdd={() => setAddPanelOpen(true)} />
      ) : (
        <section className="space-y-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-700/50 bg-surface p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-base font-semibold text-text-main">Your movies</p>
                <p className="mt-0.5 text-xs text-text-tertiary">Browse by viewing status or narrow the library by genre.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:flex">
                <StatusFilter label="All" count={items.length} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
                <StatusFilter label="Watchlist" count={items.length - watchedCount} active={statusFilter === "watchlist"} onClick={() => setStatusFilter("watchlist")} />
                <StatusFilter label="Watched" count={watchedCount} active={statusFilter === "watched"} onClick={() => setStatusFilter("watched")} />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-t border-gray-700/40 pt-4 scrollbar-hide" aria-label="Filter movies by genre">
              <GenreFilter label="All genres" active={genreFilter === "all"} onClick={() => setGenreFilter("all")} />
              {library.genres.map((genre) => (
                <GenreFilter key={genre} label={genre} active={genreFilter === genre} onClick={() => setGenreFilter(genre)} />
              ))}
            </div>
          </div>

          {visibleCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700/60 py-12 text-center">
              <Tags size={24} className="mx-auto mb-3 text-text-tertiary" />
              <p className="text-sm font-medium text-text-secondary">No movies match these filters.</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setGenreFilter("all");
                }}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            visibleSections.map((section) => (
              <MovieSection
                key={section.id}
                {...section}
                statusOptions={statusOptions}
                onSave={saveMovie}
                onDelete={handleDelete}
                onAddGenre={handleAddGenre}
                onRemoveGenre={handleRemoveGenre}
              />
            ))
          )}
        </section>
      )}
    </div>
  );
};

const SearchResult = ({ result, alreadyAdded, adding, onAdd }) => (
  <article className="flex gap-3 rounded-xl border border-gray-700/50 bg-background/45 p-3">
    <Poster movie={result} className="h-28 w-[4.7rem]" />
    <div className="flex min-w-0 flex-1 flex-col">
      <div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text-main">{result.title}</h3>
        <p className="mt-1 text-xs text-text-tertiary">{result.releaseYear || "Year unknown"}</p>
        {result.genre?.length > 0 && (
          <p className="mt-1 truncate text-[11px] text-text-tertiary">{result.genre.slice(0, 3).join(" · ")}</p>
        )}
      </div>
      <div className="mt-auto flex gap-2 pt-3">
        {alreadyAdded ? (
          <span className="flex items-center gap-1.5 rounded-lg bg-status-success/10 px-2.5 py-1.5 text-[11px] font-semibold text-status-success">
            <Check size={13} /> In your library
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onAdd(result, "backlog")}
              disabled={adding}
              className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/25 disabled:opacity-50"
            >
              {adding ? <Loader2 size={13} className="animate-spin" /> : <Bookmark size={13} />} Watchlist
            </button>
            <button
              type="button"
              onClick={() => onAdd(result, "watched")}
              disabled={adding}
              className="flex items-center gap-1.5 rounded-lg bg-status-success/15 px-2.5 py-1.5 text-[11px] font-semibold text-status-success hover:bg-status-success/25 disabled:opacity-50"
            >
              <Check size={13} /> Watched
            </button>
          </>
        )}
      </div>
    </div>
  </article>
);

const MovieSection = ({
  title,
  subtitle,
  icon,
  items,
  statusOptions,
  onSave,
  onDelete,
  onAddGenre,
  onRemoveGenre,
}) => (
  <section>
    <div className="mb-3 flex items-center gap-3 px-1">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-text-main">{title} <span className="text-text-tertiary">({items.length})</span></h2>
        <p className="text-[11px] text-text-tertiary">{subtitle}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <MovieCard
          key={item._id}
          item={item}
          statusOptions={statusOptions}
          onSave={onSave}
          onDelete={onDelete}
          onAddGenre={onAddGenre}
          onRemoveGenre={onRemoveGenre}
        />
      ))}
    </div>
  </section>
);

const MovieCard = ({ item, statusOptions, onSave, onDelete, onAddGenre, onRemoveGenre }) => {
  const watched = item.status === "watched" || item.status === "completed";
  const availableGenres = MOVIE_GENRES.filter((genre) => !item.genre?.includes(genre));

  return (
    <article className="group overflow-hidden rounded-xl border border-gray-700/50 bg-surface transition-colors hover:border-primary/35">
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
        <Poster movie={item} className="h-full w-full" />
        <span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold backdrop-blur ${watched ? "bg-status-success/85 text-white" : "bg-black/75 text-gray-100"}`}>
          {watched ? "Watched" : "Watchlist"}
        </span>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="absolute right-2 top-2 rounded-md bg-black/70 p-1.5 text-gray-300 opacity-100 backdrop-blur hover:bg-status-danger hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          aria-label={`Remove ${item.title}`}
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-text-main" title={item.title}>{item.title}</h3>
          <p className="mt-0.5 text-[11px] text-text-tertiary">{item.releaseYear || "Year unknown"}</p>
        </div>

        <div className="flex min-h-6 flex-wrap gap-1">
          {(item.genre || []).map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => onRemoveGenre(item, genre)}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary hover:bg-status-danger/10 hover:text-status-danger"
              title={`Remove ${genre} category`}
            >
              {genre} <X size={9} />
            </button>
          ))}
          {availableGenres.length > 0 && (
            <label className="relative">
              <select
                value=""
                onChange={(event) => onAddGenre(item, event.target.value)}
                className="appearance-none rounded-full border border-dashed border-gray-600 bg-transparent py-1 pl-2 pr-5 text-[10px] text-text-tertiary focus:border-primary focus:outline-none"
                aria-label={`Add a category to ${item.title}`}
              >
                <option value="">+ Genre</option>
                {availableGenres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
              </select>
              <ChevronDown size={9} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            </label>
          )}
        </div>

        <div className="grid gap-2">
          <label className="sr-only" htmlFor={`status-${item._id}`}>Status for {item.title}</label>
          <select
            id={`status-${item._id}`}
            value={watched ? "watched" : item.status}
            onChange={(event) => onSave(item, { status: event.target.value }, "Could not update movie status.")}
            className="w-full rounded-lg border border-gray-700/60 bg-background/70 px-2 py-1.5 text-[11px] text-text-secondary focus:border-primary focus:outline-none"
          >
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>

          {watched && (
            <label className="relative">
              <Star size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-yellow-400" />
              <select
                value={item.userRating || ""}
                onChange={(event) => onSave(item, { userRating: event.target.value ? Number(event.target.value) : null }, "Could not update movie rating.")}
                className="w-full appearance-none rounded-lg border border-gray-700/60 bg-background/70 py-1.5 pl-7 pr-6 text-[11px] text-text-secondary focus:border-primary focus:outline-none"
                aria-label={`Rating for ${item.title}`}
              >
                <option value="">Not rated</option>
                {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
                  <option key={rating} value={rating}>{rating}/10</option>
                ))}
              </select>
              <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary" />
            </label>
          )}
        </div>
      </div>
    </article>
  );
};

const Poster = ({ movie, className }) => (
  <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-800 ${className}`}>
    {movie.coverImageUrl ? (
      <img src={movie.coverImageUrl} alt={`Poster for ${movie.title}`} className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <Film size={24} className="text-gray-600" aria-hidden="true" />
    )}
  </div>
);

const StatusFilter = ({ label, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors sm:min-w-24 ${
      active
        ? "border-primary/50 bg-primary/15 text-primary"
        : "border-gray-700/50 bg-background/40 text-text-tertiary hover:text-text-main"
    }`}
  >
    <span className="truncate">{label}</span>
    <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px]">{count}</span>
  </button>
);

const GenreFilter = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
      active ? "bg-primary text-black" : "bg-background/60 text-text-tertiary hover:text-text-main"
    }`}
  >
    {label}
  </button>
);

const EmptyLibrary = ({ onAdd }) => (
  <div className="rounded-2xl border border-dashed border-gray-700/60 bg-surface/50 px-6 py-16 text-center">
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Film size={24} />
    </span>
    <h2 className="mt-4 text-base font-semibold text-text-main">Start your movie library</h2>
    <p className="mx-auto mt-1 max-w-sm text-sm text-text-tertiary">Search for a movie, add it to your watchlist, or log something you have already watched.</p>
    <button type="button" onClick={onAdd} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-black hover:brightness-110">
      <Plus size={16} /> Add your first movie
    </button>
  </div>
);

export default MovieTab;
