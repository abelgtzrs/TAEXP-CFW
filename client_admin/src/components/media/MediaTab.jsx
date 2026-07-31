import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, Check, Film, Loader2 } from "lucide-react";
import { fetchMediaItems, addMediaItem, updateMediaItem, deleteMediaItem } from "../../services/mediaService";

const SEARCH_DEBOUNCE_MS = 350;
const SCROLL_END_THRESHOLD_PX = 120;

const MediaTab = ({ mediaType, searchFn, statusOptions, searchPlaceholder }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMediaItems(mediaType)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your list.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setHasMore(false);
      setPage(1);
      return undefined;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      searchFn(trimmed, 1)
        .then(({ results: newResults, hasMore: more }) => {
          setResults(newResults);
          setPage(1);
          setHasMore(Boolean(more));
        })
        .catch(() => setError("Search failed. Check your server API key configuration."))
        .finally(() => setSearching(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, searchFn]);

  const loadMoreResults = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || !hasMore || loadingMore || searching) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    searchFn(trimmed, nextPage)
      .then(({ results: more, hasMore: moreLeft }) => {
        setResults((prev) => [...prev, ...more]);
        setPage(nextPage);
        setHasMore(Boolean(moreLeft));
      })
      .catch(() => setError("Could not load more results."))
      .finally(() => setLoadingMore(false));
  };

  const handleResultsScroll = (e) => {
    const el = e.currentTarget;
    const distanceToEnd = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToEnd < SCROLL_END_THRESHOLD_PX) {
      loadMoreResults();
    }
  };

  const addedTitles = useMemo(() => new Set(items.map((it) => it.title.toLowerCase())), [items]);

  const completedStatuses = useMemo(() => new Set(["completed", "watched"]), []);
  const watchlistStatus = statusOptions.find((o) => o.value === "backlog")?.value || statusOptions[0].value;
  const completedOption = statusOptions.find((o) => completedStatuses.has(o.value));

  const handleAdd = async (result, status) => {
    try {
      const created = await addMediaItem({
        mediaType,
        title: result.title,
        coverImageUrl: result.coverImageUrl,
        releaseYear: result.releaseYear,
        genre: result.genre,
        platformOrNetwork: result.platformOrNetwork,
        status,
      });
      setItems((prev) => [created, ...prev]);
    } catch {
      setError("Could not add that title.");
    }
  };

  const handleStatusChange = async (item, status) => {
    try {
      const updated = await updateMediaItem(item._id, { status });
      setItems((prev) => prev.map((it) => (it._id === item._id ? updated : it)));
    } catch {
      setError("Could not update status.");
    }
  };

  const handleRatingChange = async (item, userRating) => {
    try {
      const updated = await updateMediaItem(item._id, { userRating });
      setItems((prev) => prev.map((it) => (it._id === item._id ? updated : it)));
    } catch {
      setError("Could not update rating.");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from your list?`)) return;
    try {
      await deleteMediaItem(item._id);
      setItems((prev) => prev.filter((it) => it._id !== item._id));
    } catch {
      setError("Could not remove that item.");
    }
  };

  const watchlist = items.filter((it) => !completedStatuses.has(it.status));
  const log = items.filter((it) => completedStatuses.has(it.status));

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-gray-700/50 bg-surface py-2 pl-9 pr-3 text-sm text-text-main placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {error && <p className="text-xs text-status-danger">{error}</p>}

      {query.trim().length >= 2 && (
        <div className="rounded-lg border border-gray-700/50 bg-surface p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            {searching ? "Searching..." : `Results (${results.length})`}
          </p>
          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1" onScroll={handleResultsScroll}>
            {results.map((result) => {
              const alreadyAdded = addedTitles.has(result.title.toLowerCase());
              return (
                <div
                  key={result.externalId}
                  className="flex items-center gap-3 rounded-md border border-gray-700/40 bg-background/40 p-2"
                >
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-gray-800 flex items-center justify-center">
                    {result.coverImageUrl ? (
                      <img src={result.coverImageUrl} alt={result.title} className="h-full w-full object-cover" />
                    ) : (
                      <Film size={18} className="text-gray-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-text-main" title={result.title}>
                      {result.title}
                    </p>
                    <p className="text-[10px] text-text-tertiary">{result.releaseYear || ""}</p>
                  </div>
                  {alreadyAdded ? (
                    <div className="flex shrink-0 items-center gap-1 rounded bg-gray-700/40 px-2 py-1 text-[10px] font-semibold text-text-tertiary">
                      <Check size={12} /> Added
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdd(result, watchlistStatus)}
                        className="flex items-center justify-center gap-1 rounded bg-primary/20 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/30"
                      >
                        <Plus size={12} /> Watchlist
                      </button>
                      {completedOption && (
                        <button
                          type="button"
                          onClick={() => handleAdd(result, completedOption.value)}
                          className="flex items-center justify-center gap-1 rounded bg-status-success/20 px-2 py-1 text-[10px] font-semibold text-status-success hover:bg-status-success/30"
                        >
                          <Check size={12} /> {completedOption.label}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {loadingMore && (
              <div className="flex items-center justify-center py-2 text-text-tertiary">
                <Loader2 size={18} className="animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-tertiary">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MediaList
            title="Watchlist"
            items={watchlist}
            statusOptions={statusOptions}
            onStatusChange={handleStatusChange}
            onRatingChange={handleRatingChange}
            onDelete={handleDelete}
          />
          <MediaList
            title="Log"
            items={log}
            statusOptions={statusOptions}
            onStatusChange={handleStatusChange}
            onRatingChange={handleRatingChange}
            onDelete={handleDelete}
            showRating
          />
        </div>
      )}
    </div>
  );
};

const MediaList = ({ title, items, statusOptions, onStatusChange, onRatingChange, onDelete, showRating = false }) => (
  <div className="rounded-lg border border-gray-700/50 bg-surface p-4">
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
      {title} ({items.length})
    </p>
    {items.length === 0 ? (
      <p className="text-xs text-text-tertiary">Nothing here yet.</p>
    ) : (
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item._id}
            className="flex items-center gap-3 rounded-md border border-gray-700/40 bg-background/40 p-2"
          >
            <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-gray-800 flex items-center justify-center">
              {item.coverImageUrl ? (
                <img src={item.coverImageUrl} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <Film size={14} className="text-gray-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-text-main" title={item.title}>
                {item.title}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <select
                  value={item.status}
                  onChange={(e) => onStatusChange(item, e.target.value)}
                  className="rounded border border-gray-700/50 bg-gray-800 px-1.5 py-0.5 text-[11px] text-text-secondary focus:outline-none"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {showRating && (
                  <select
                    value={item.userRating || ""}
                    onChange={(e) => onRatingChange(item, e.target.value ? Number(e.target.value) : undefined)}
                    className="rounded border border-gray-700/50 bg-gray-800 px-1.5 py-0.5 text-[11px] text-text-secondary focus:outline-none"
                  >
                    <option value="">Rate</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}/10
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="shrink-0 rounded p-1.5 text-text-tertiary hover:bg-status-danger/10 hover:text-status-danger"
              aria-label={`Remove ${item.title}`}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default MediaTab;
