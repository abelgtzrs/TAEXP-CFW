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
        <div className="dash-empty">
          <p>No active books in your tracker yet.</p>
          <p className="mt-1 text-[11px] opacity-70">Start one from the Book Tracker page to build your reading momentum.</p>
        </div>
      </Widget>
    );
  }

  const summary = [
    { label: "Pages", value: stats.totalPagesRead.toLocaleString() },
    { label: "Active", value: stats.activeBooks },
    { label: "Finished", value: stats.finishedBooks },
    { label: "Completion", value: `${stats.completionRate}%` },
  ];

  return (
    <Widget title="Book Tracker" className="overflow-hidden">
      <div className="space-y-4">
        <div className="dashboard-kpi-panel grid grid-cols-2 sm:grid-cols-4">
          {summary.map((item) => (
            <div key={item.label} className="bg-surface px-3 py-2.5">
              <p className="dashboard-label">{item.label}</p>
              <p className="dash-value mt-1 text-lg leading-none">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="dash-segment">
            <button onClick={() => setShowAll(false)} className={!showAll ? "is-active" : ""}>
              Active
            </button>
            <button onClick={() => setShowAll(true)} className={showAll ? "is-active" : ""}>
              All ({stats.totalBooks})
            </button>
          </div>

          <div className="dash-segment items-center">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} aria-label="Previous page">
              &lsaquo;
            </button>
            <span className="px-2 text-[11px] text-text-secondary tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
            >
              &rsaquo;
            </button>
          </div>
        </div>

        <div className="dash-rows">
          {pageItems.map((book) => {
            const total = Number(book.totalPages) || 0;
            const read = Number(book.pagesRead) || 0;
            const progressPercent = total > 0 ? (read / total) * 100 : 0;
            const currentPages = pageUpdates[book._id] ?? read;

            return (
              <article key={book._id} className="flex gap-3 py-3 first:pt-0">
                {book.coverImageUrl ? (
                  <img
                    src={book.coverImageUrl}
                    alt={book.title}
                    className="h-[72px] w-12 flex-shrink-0 rounded object-cover border border-white/10"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="grid h-[72px] w-12 flex-shrink-0 place-items-center rounded border border-white/10 bg-white/[0.03] text-[9px] font-semibold uppercase tracking-wide text-text-secondary">
                    Book
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-text-main">
                        {book.title} {book.year ? <span className="font-normal text-text-secondary">({book.year})</span> : ""}
                      </p>
                      <p className="truncate text-[11px] text-text-secondary">{book.author || "Unknown Author"}</p>
                    </div>
                    <span className={`dash-tag ${book.isFinished ? "!text-emerald-300 !border-emerald-400/30" : ""}`}>
                      {book.isFinished ? "Complete" : "Reading"}
                    </span>
                  </div>

                  <div className="dash-meter mt-2">
                    <span style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }} />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-text-secondary tabular-nums">
                      <span className="dash-value">{read}</span> / {total} pp · {Math.round(progressPercent)}% · {formatLastUpdated(book.updatedAt || book.createdAt)}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={currentPages}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const clamped = Math.max(0, Math.min(total, Number.isFinite(val) ? val : 0));
                          handlePageChange(book._id, clamped);
                        }}
                        className="dash-input w-20 tabular-nums"
                        min="0"
                        max={book.totalPages}
                        aria-label={`Pages read for ${book.title}`}
                      />
                      <button
                        onClick={() => handleUpdateProgress(book._id)}
                        disabled={Number(currentPages) === read}
                        className="dash-btn dash-btn-primary"
                      >
                        Update
                      </button>
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
