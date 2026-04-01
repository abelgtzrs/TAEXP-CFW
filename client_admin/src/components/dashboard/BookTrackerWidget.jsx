import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";

const formatLastUpdated = (dateValue) => {
  if (!dateValue) return "recently";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "recently";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const daysAgo = Math.floor(diffMs / oneDay);

  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "yesterday";
  if (daysAgo < 7) return `${daysAgo} days ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const BookTrackerWidget = () => {
  const [recentBooks, setRecentBooks] = useState([]);
  const [pageUpdates, setPageUpdates] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(0);

  const fetchBooks = async () => {
    try {
      const response = await api.get("/books");
      const books = response.data.data || [];

      // Keep all in state; we will filter/paginate in render
      setRecentBooks(books.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)));

      // Initialize page updates to current pages
      const initialPages = {};
      books.forEach((book) => {
        initialPages[book._id] = book.pagesRead || 0;
      });
      setPageUpdates(initialPages);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleUpdateProgress = async (bookId) => {
    const book = recentBooks.find((b) => b._id === bookId);
    const newPages = pageUpdates[bookId];

    if (Number(newPages) !== book.pagesRead) {
      try {
        await api.put(`/books/${bookId}`, { pagesRead: Number(newPages) });
        fetchBooks(); // Refresh data after update
      } catch (error) {
        alert("Failed to update progress.");
      }
    }
  };

  const handlePageChange = (bookId, value) => {
    setPageUpdates((prev) => ({
      ...prev,
      [bookId]: value,
    }));
  };

  // Derived collections and pagination
  const filtered = useMemo(() => {
    const list = showAll ? recentBooks : recentBooks.filter((b) => !b.isFinished);
    return list;
  }, [recentBooks, showAll]);

  const stats = useMemo(() => {
    const totalBooks = recentBooks.length;
    const finishedBooks = recentBooks.filter((book) => book.isFinished).length;
    const totalPagesRead = recentBooks.reduce((sum, book) => sum + (Number(book.pagesRead) || 0), 0);
    const completionRate = totalBooks > 0 ? Math.round((finishedBooks / totalBooks) * 100) : 0;

    return {
      totalBooks,
      finishedBooks,
      activeBooks: totalBooks - finishedBooks,
      totalPagesRead,
      completionRate,
    };
  }, [recentBooks]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  useEffect(() => {
    // Reset to first page whenever filter changes
    setPage(0);
  }, [showAll]);

  if (recentBooks.length === 0) {
    return (
      <Widget title="Book Tracker">
        <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-5 text-center">
          <p className="text-sm text-text-secondary">No active books in your tracker yet.</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Start one from the Book Tracker page to build your reading momentum.
          </p>
        </div>
      </Widget>
    );
  }

  return (
    <Widget title="Book Tracker" className="overflow-hidden">
      <div className="space-y-4 sm:space-y-5">
        <div className="relative overflow-hidden rounded-xl border border-gray-700/60 bg-background/60 p-3.5 sm:p-4">
          <div className="relative flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Reading Command Center</p>
                <p className="mt-1 text-base font-semibold text-white sm:text-lg">
                  {stats.totalPagesRead.toLocaleString()} pages logged
                </p>
              </div>
              <div className="self-start rounded-full border border-gray-700/70 bg-black/35 px-3 py-1 font-mono text-[11px] text-text-secondary sm:self-auto">
                {filtered.length} visible
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-gray-700/60 bg-black/25 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-text-tertiary">Active</p>
                <p className="text-lg font-semibold text-white">{stats.activeBooks}</p>
              </div>
              <div className="rounded-lg border border-gray-700/60 bg-black/25 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-text-tertiary">Finished</p>
                <p className="text-lg font-semibold text-white">{stats.finishedBooks}</p>
              </div>
              <div className="rounded-lg border border-gray-700/60 bg-black/25 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-text-tertiary">Total</p>
                <p className="text-lg font-semibold text-white">{stats.totalBooks}</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-widest text-primary-light/80">Completion</p>
                <p className="text-lg font-semibold text-primary-light">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="inline-flex w-full rounded-lg border border-gray-700/60 bg-black/25 p-1">
            <button
              onClick={() => setShowAll(false)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:py-2 ${
                !showAll ? "bg-primary text-white" : "text-text-secondary hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:py-2 ${
                showAll ? "bg-primary text-white" : "text-text-secondary hover:text-white"
              }`}
            >
              All Books
            </button>
          </div>

          <div className="inline-flex w-full items-center justify-between rounded-lg border border-gray-700/60 bg-black/25 p-1 sm:w-auto sm:min-w-[150px]">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-lg px-3 py-2 text-xs text-text-secondary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
            >
              Prev
            </button>
            <span className="px-2 font-mono text-xs text-text-secondary">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-lg px-3 py-2 text-xs text-text-secondary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5"
            >
              Next
            </button>
          </div>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {pageItems.map((book) => {
            const total = Number(book.totalPages) || 0;
            const read = Number(book.pagesRead) || 0;
            const progressPercent = total > 0 ? (read / total) * 100 : 0;
            const currentPages = pageUpdates[book._id] ?? read;

            return (
              <article key={book._id} className="rounded-xl border border-gray-700/60 bg-black/25 p-3">
                <div className="flex flex-col gap-3 sm:gap-3.5 min-[460px]:flex-row">
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="h-24 w-16 rounded-md object-cover shadow-lg shadow-black/40 min-[460px]:flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="grid h-24 w-16 place-items-center rounded-md border border-white/10 bg-slate-900/70 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary min-[460px]:flex-shrink-0">
                      Book
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white sm:text-[15px]">
                          {book.title} {book.year ? `(${book.year})` : ""}
                        </p>
                        <p className="truncate text-xs text-text-secondary">{book.author || "Unknown Author"}</p>
                      </div>
                      <span
                        className={`self-start rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          book.isFinished
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                            : "border-blue-500/40 bg-blue-500/10 text-blue-200"
                        }`}
                      >
                        {book.isFinished ? "Complete" : "In Progress"}
                      </span>
                    </div>

                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-700/70">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                      />
                    </div>

                    <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs text-text-secondary">
                          {read} / {total} pages ({Math.round(progressPercent)}%)
                        </p>
                        <p className="text-[11px] text-text-tertiary">
                          Updated {formatLastUpdated(book.updatedAt || book.createdAt)}
                        </p>
                      </div>

                      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-2 sm:w-auto">
                        <input
                          type="number"
                          value={currentPages}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            const clamped = Math.max(0, Math.min(total, Number.isFinite(val) ? val : 0));
                            handlePageChange(book._id, clamped);
                          }}
                          className="w-full rounded-md border border-gray-600/70 bg-background px-2.5 py-2.5 text-xs text-white outline-none transition focus:border-primary sm:w-24 sm:py-2"
                          min="0"
                          max={book.totalPages}
                        />
                        <button
                          onClick={() => handleUpdateProgress(book._id)}
                          disabled={Number(currentPages) === read}
                          className="rounded-md border border-primary/35 bg-primary/20 px-3.5 py-2.5 text-xs font-semibold text-primary-light transition hover:bg-primary/35 disabled:cursor-not-allowed disabled:opacity-45 sm:py-2"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Widget>
  );
};

export default BookTrackerWidget;
