import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import Widget from "../ui/Widget";

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

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const stats = useMemo(() => {
    const totalBooks = recentBooks.length;
    const finishedBooks = recentBooks.filter((book) => book.isFinished).length;
    const activeBooks = totalBooks - finishedBooks;
    const totalPagesRead = recentBooks.reduce((sum, book) => sum + (Number(book.pagesRead) || 0), 0);

    return {
      totalBooks,
      finishedBooks,
      activeBooks,
      totalPagesRead,
    };
  }, [recentBooks]);

  const getProgressTone = (percent) => {
    if (percent >= 90) return "from-status-success to-emerald-300";
    if (percent >= 55) return "from-status-info to-cyan-300";
    if (percent >= 25) return "from-status-warning to-amber-300";
    return "from-rose-500 to-orange-300";
  };

  const formatLastUpdated = (dateValue) => {
    if (!dateValue) return "Unknown";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    // Reset to first page whenever filter changes
    setPage(0);
  }, [showAll]);

  if (recentBooks.length === 0) {
    return (
      <Widget title="Book Tracker">
        <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-5 text-center">
          <p className="text-sm text-text-secondary">No active books in your tracker yet.</p>
          <p className="mt-1 text-xs text-text-tertiary">Start one from the Book Tracker page to build your reading momentum.</p>
        </div>
      </Widget>
    );
  }

  return (
    <Widget title="Book Tracker" className="overflow-hidden">
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-black/40 p-4">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
          <div className="pointer-events-none absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Reading Command Center</p>
              <p className="mt-1 text-sm font-semibold text-white">{stats.totalPagesRead.toLocaleString()} pages logged</p>
            </div>
            <div className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[11px] text-text-secondary">
              {filtered.length} visible
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Active</p>
              <p className="text-lg font-semibold text-white">{stats.activeBooks}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Finished</p>
              <p className="text-lg font-semibold text-white">{stats.finishedBooks}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary">Total</p>
              <p className="text-lg font-semibold text-white">{stats.totalBooks}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg border border-white/10 bg-black/20 p-1">
            <button
              onClick={() => setShowAll(false)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !showAll ? "bg-primary text-white" : "text-text-secondary hover:text-white"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                showAll ? "bg-primary text-white" : "text-text-secondary hover:text-white"
              }`}
            >
              All Books
            </button>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 text-xs text-text-secondary">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {pageItems.map((book) => {
          const total = Number(book.totalPages) || 0;
          const read = Number(book.pagesRead) || 0;
          const progressPercent = total > 0 ? (read / total) * 100 : 0;
          const currentPages = pageUpdates[book._id] ?? read;
          const progressTone = getProgressTone(progressPercent);

          return (
            <article key={book._id} className="rounded-xl border border-white/10 bg-gradient-to-b from-black/30 to-black/10 p-3">
              <div className="flex gap-3">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="h-20 w-14 flex-shrink-0 rounded-md object-cover shadow-lg shadow-black/40"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="grid h-20 w-14 flex-shrink-0 place-items-center rounded-md border border-white/10 bg-slate-900/70 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                    Book
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {book.title} {book.year ? `(${book.year})` : ""}
                      </p>
                      <p className="truncate text-xs text-text-secondary">{book.author || "Unknown Author"}</p>
                    </div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        book.isFinished
                          ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                          : "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                      }`}
                    >
                      {book.isFinished ? "Complete" : "In Progress"}
                    </span>
                  </div>

                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${progressTone}`}
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-text-tertiary">
                        {book.pagesRead} / {book.totalPages} pages ({Math.round(progressPercent)}%)
                      </p>
                      <p className="text-[11px] text-text-tertiary/80">Updated {formatLastUpdated(book.updatedAt || book.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={currentPages}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const clamped = Math.max(0, Math.min(total, Number.isFinite(val) ? val : 0));
                          handlePageChange(book._id, clamped);
                        }}
                        className="w-16 rounded-md border border-white/15 bg-black/40 px-2 py-1 text-xs text-white outline-none transition focus:border-primary"
                        min="0"
                        max={book.totalPages}
                      />
                      <button
                        onClick={() => handleUpdateProgress(book._id)}
                        disabled={Number(currentPages) === read}
                        className="rounded-md border border-cyan-300/30 bg-cyan-400/20 px-2.5 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/35 disabled:cursor-not-allowed disabled:opacity-45"
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
