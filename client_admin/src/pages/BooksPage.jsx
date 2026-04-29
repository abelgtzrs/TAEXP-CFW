// src/pages/BooksPage.jsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AddBookForm from "../components/books/AddBookForm";
import BookItem from "../components/books/BookItem";
import { BookOpen, Plus, X } from "lucide-react";

const BooksPage = () => {
  const { user, setUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("recent");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await api.get("/books");
        // Sort books: unfinished first, then by most recently updated
        const sortedBooks = response.data.data.sort(
          (a, b) => a.isFinished - b.isFinished || new Date(b.updatedAt) - new Date(a.updatedAt),
        );
        setBooks(sortedBooks);
      } catch (err) {
        setError("Failed to fetch your book collection.");
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // --- Handler Functions ---

  // Generic helper to process API response and update state
  const processApiResponse = (response) => {
    const updatedBook = response.data.data;
    // Update the book in our local list
    setBooks((prevBooks) => prevBooks.map((b) => (b._id === updatedBook._id ? updatedBook : b)));

    // --- THIS IS THE FIX ---
    // Check if the API response included our updated user data.
    if (response.data.userData) {
      // If it did, it means a reward was given.
      // We use setUser to update the ENTIRE global user object with the fresh,
      // correct data directly from the server. This state will persist.
      setUser(response.data.userData);
    }
  };

  const handleAddBook = async (bookData) => {
    setFormLoading(true);
    try {
      const response = await api.post("/books", bookData);
      // Add new book to the top of the list
      setBooks((prevBooks) => [response.data.data, ...prevBooks]);
    } catch (err) {
      setError(err.response?.data?.message || "Could not add book.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm("Are you sure you want to remove this book?")) {
      try {
        await api.delete(`/books/${bookId}`);
        setBooks(books.filter((b) => b._id !== bookId));
      } catch (err) {
        setError("Could not delete book.");
      }
    }
  };

  // Generic update function for pagesRead
  const handleUpdateBook = async (bookId, updateData) => {
    try {
      const response = await api.put(`/books/${bookId}`, updateData);
      processApiResponse(response); // Use the helper
    } catch (err) {
      setError("Could not update book progress.");
    }
  };

  // Specific function for the "Mark as Finished" button
  const handleFinishBook = async (bookId) => {
    try {
      console.log("Attempting to finish book with ID:", bookId);
      const response = await api.put(`/books/${bookId}`, {
        isFinished: true,
        finishedAt: new Date().toISOString(), // Explicitly mark when the book was finished
      });

      // Add detailed debugging to see what the server returns
      console.log("Full finish book response:", response);
      console.log("Response data:", response.data);
      console.log("Response success:", response.data.success);
      console.log("Response message:", response.data.message);

      if (response.data.userData) {
        console.log("Updated user data received:", response.data.userData);
        console.log("New Wendy Hearts:", response.data.userData.wendyHearts);
      } else {
        console.log("No user data returned from server - book may have already been finished");
      }

      processApiResponse(response); // Use the helper
    } catch (err) {
      console.error("Error finishing book:", err);
      setError("Could not mark book as finished.");
    }
  };

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const finishedBooks = books.filter((book) => book.isFinished).length;
    const readingBooks = books.filter((book) => !book.isFinished && Number(book.pagesRead) > 0).length;
    const libraryBooks = books.filter((book) => !book.isFinished && !(Number(book.pagesRead) > 0)).length;
    const totalPages = books.reduce((sum, book) => sum + (Number(book.totalPages) || 0), 0);
    const pagesRead = books.reduce((sum, book) => sum + (Number(book.pagesRead) || 0), 0);
    const completionRate = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;
    const pagesLeft = totalPages - pagesRead;
    const avgPages =
      finishedBooks > 0
        ? Math.round(
            books.filter((b) => b.isFinished).reduce((s, b) => s + (Number(b.totalPages) || 0), 0) / finishedBooks,
          )
        : 0;
    const longestBook = books.reduce((max, b) => Math.max(max, Number(b.totalPages) || 0), 0);
    const uniqueAuthors = new Set(books.map((b) => (b.author || "").trim().toLowerCase()).filter(Boolean)).size;

    return {
      totalBooks,
      finishedBooks,
      readingBooks,
      libraryBooks,
      totalPages,
      pagesRead,
      completionRate,
      pagesLeft,
      avgPages,
      longestBook,
      uniqueAuthors,
    };
  }, [books]);

  const visibleBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filteredBooks = books.filter((book) => {
      const matchesQuery =
        !query ||
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        String(book.year || "").includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "library" && !book.isFinished && !(Number(book.pagesRead) > 0)) ||
        (statusFilter === "reading" && !book.isFinished && Number(book.pagesRead) > 0) ||
        (statusFilter === "finished" && book.isFinished);

      return matchesQuery && matchesStatus;
    });

    const sortedBooks = [...filteredBooks].sort((a, b) => {
      if (sortMode === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }

      if (sortMode === "progress") {
        const aPct = (Number(a.pagesRead) || 0) / Math.max(Number(a.totalPages) || 1, 1);
        const bPct = (Number(b.pagesRead) || 0) / Math.max(Number(b.totalPages) || 1, 1);
        return bPct - aPct;
      }

      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

    return sortedBooks;
  }, [books, searchQuery, statusFilter, sortMode]);

  return (
    <div
      style={{
        fontFamily: "var(--font-main)",
        color: "var(--color-text-main, #e5e7eb)",
      }}
    >
      <style>{`
        /* ── Buttons ── */
        .bk-btn {
          cursor: pointer;
          font-family: var(--font-main);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          color: var(--color-text-main, #e5e7eb);
          user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          letter-spacing: 0.03em;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          touch-action: manipulation;
          backdrop-filter: blur(4px);
        }
        .bk-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
        }
        .bk-btn:active { transform: scale(0.97); }
        .bk-btn-primary {
          background: var(--color-primary);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 2px 12px color-mix(in srgb, var(--color-primary) 40%, transparent);
        }
        .bk-btn-primary:hover {
          background: color-mix(in srgb, var(--color-primary) 85%, white);
          border-color: transparent;
        }
        .bk-btn-danger {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.2);
          color: rgba(239,68,68,0.7);
        }
        .bk-btn-danger:hover {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.35);
          color: rgba(239,68,68,1);
        }
        /* ── Inputs ── */
        .bk-input {
          font-family: var(--font-main);
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.25);
          color: var(--color-text-main, #e5e7eb);
          padding: 7px 10px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .bk-input::placeholder { color: rgba(255,255,255,0.2); }
        .bk-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
        }
        .bk-select {
          font-family: var(--font-main);
          font-size: 13px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.3);
          color: var(--color-text-main, #e5e7eb);
          padding: 7px 10px;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }
        .bk-select:focus { border-color: var(--color-primary); }
        /* ── Filter pills ── */
        .bk-pill {
          font-family: var(--font-main);
          font-size: 12px;
          font-weight: 600;
          padding: 5px 14px;
          cursor: pointer;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          color: rgba(255,255,255,0.38);
          user-select: none;
          letter-spacing: 0.03em;
          transition: all 0.15s;
          touch-action: manipulation;
        }
        .bk-pill.active {
          background: var(--color-primary);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 2px 10px color-mix(in srgb, var(--color-primary) 35%, transparent);
        }
        .bk-pill:not(.active):hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2); }
        /* ── Stats grid ── */
        .bk-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
        }
        .bk-stat-cell {
          padding: 10px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 3px;
          min-width: 0;
        }
        /* ── Section headers ── */
        .bk-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 0 10px;
          margin-bottom: 2px;
        }
        .bk-section-header::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.08), transparent);
        }
        /* ── Book list rows ── */
        .bk-list-row {
          padding: 3px 0;
          transition: transform 0.15s;
        }
        .bk-list-row:hover { transform: translateX(2px); }
        /* ── Toolbar layout ── */
        .bk-toolbar-search { order: 1; }
        .bk-toolbar-filters {
          order: 2;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .bk-toolbar-add { order: 3; }
        .bk-toolbar-sep {
          width: 1px;
          height: 16px;
          background: rgba(255,255,255,0.1);
          margin: 0 2px;
          flex-shrink: 0;
        }
        /* ── Status bar ── */
        .bk-status-bar {
          display: flex;
          flex-wrap: wrap;
          padding: 6px 16px;
          font-size: 11px;
          background: var(--color-surface);
          border-top: 1px solid rgba(255,255,255,0.06);
          font-family: var(--font-main);
          gap: 16px;
        }
        /* ── Form ── */
        .bk-form-footer { flex-direction: row; }
        /* ── Spin animation ── */
        @keyframes bk-spin { to { transform: rotate(360deg); } }
        .bk-spin { animation: bk-spin 1s linear infinite; }
        @media (max-width: 560px) {
          .bk-stat-cell { padding: 8px 3px; }
          .bk-stat-value { font-size: 16px !important; }
          .bk-status-bar { display: none; }
          .bk-toolbar-filters { order: 3; flex: 1 1 100%; }
          .bk-toolbar-add { order: 2; flex-shrink: 0; }
          .bk-toolbar-sep { display: none; }
          .bk-pill { flex: 1; text-align: center; }
          .bk-btn { min-height: 40px; }
          .bk-input { font-size: 16px; }
          .bk-select { font-size: 16px; }
          .bk-page-input { font-size: 16px !important; }
          .bk-ctrl-complete { flex: 1; justify-content: center; }
          .bk-form-footer { flex-direction: column !important; align-items: stretch !important; }
          .bk-form-footer button { justify-content: center; min-height: 44px; }
          .bk-list-row:hover { transform: none; }
        }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "20px 20px",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background:
              "linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, black))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 16px color-mix(in srgb, var(--color-primary) 35%, transparent)",
          }}
        >
          <BookOpen size={18} color="white" />
        </div>
        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--color-text-main, #f1f5f9)",
              letterSpacing: "-0.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Book Tracker
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em", marginTop: 1 }}>
            Personal Library
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span style={{ fontSize: 13 }}>❤️</span>
            <span style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>
              {user?.wendyHearts ?? 0}
            </span>
            <span style={{ color: "var(--color-primary)", fontSize: 14, letterSpacing: "0.06em", fontWeight: 600 }}>
              W
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        {[
          [
            { label: "Total", value: stats.totalBooks, color: "var(--color-primary)" },
            { label: "Library", value: stats.libraryBooks, color: "rgba(255,255,255,0.5)" },
            { label: "Reading", value: stats.readingBooks, color: "var(--color-status-info, #60a5fa)" },
            { label: "Finished", value: stats.finishedBooks, color: "var(--color-status-success, #34d399)" },
            { label: "Complete", value: `${stats.completionRate}%`, color: "var(--color-tertiary, #f59e0b)" },
          ],
          [
            { label: "Pg Read", value: stats.pagesRead.toLocaleString(), color: "var(--color-primary)" },
            { label: "Pg Left", value: stats.pagesLeft.toLocaleString(), color: "rgba(255,255,255,0.5)" },
            { label: "Total Pg", value: stats.totalPages.toLocaleString(), color: "var(--color-status-info, #60a5fa)" },
            {
              label: "Avg Pg",
              value: stats.avgPages > 0 ? stats.avgPages.toLocaleString() : "—",
              color: "var(--color-status-success, #34d399)",
            },
            { label: "Authors", value: stats.uniqueAuthors, color: "var(--color-tertiary, #f59e0b)" },
          ],
        ].map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="bk-stats-grid"
            style={rowIdx === 0 ? { borderBottom: "1px solid rgba(255,255,255,0.05)" } : undefined}
          >
            {row.map(({ label, value, color }) => (
              <div key={label} className="bk-stat-cell">
                <span className="bk-stat-value" style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
                  {value}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.06em",
                    fontWeight: 500,
                    marginTop: 2,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          rowGap: 8,
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Search */}
        <div
          className="bk-toolbar-search"
          style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, position: "relative" }}
        >
          <svg
            style={{ position: "absolute", left: 10, opacity: 0.3, pointerEvents: "none" }}
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title or author..."
            className="bk-input"
            style={{ flex: 1, minWidth: 80, paddingLeft: 30 }}
          />
        </div>

        <div className="bk-toolbar-sep" />

        {/* Filter pills + Sort */}
        <div className="bk-toolbar-filters">
          {[
            { key: "all", label: "All" },
            { key: "library", label: "Library" },
            { key: "reading", label: "Reading" },
            { key: "finished", label: "Finished" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`bk-pill ${statusFilter === item.key ? "active" : ""}`}
            >
              {item.label}
            </button>
          ))}
          <div className="bk-toolbar-sep" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="bk-select"
            style={{ padding: "6px 10px" }}
          >
            <option value="recent">Recent</option>
            <option value="progress">Progress</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className={`bk-btn bk-toolbar-add ${showAddForm ? "" : "bk-btn-primary"}`}
        >
          {showAddForm ? (
            <>
              <X size={13} /> Cancel
            </>
          ) : (
            <>
              <Plus size={13} /> Add Book
            </>
          )}
        </button>
      </div>

      {/* ── Add Book Panel ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.02)" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                New Entry
              </div>
              <AddBookForm
                onAddBook={async (data) => {
                  await handleAddBook(data);
                  setShowAddForm(false);
                }}
                loading={formLoading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              margin: "12px 16px",
              padding: "10px 14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--color-status-danger, #f87171)",
              fontFamily: "var(--font-main)",
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <span>⚠</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div style={{ padding: "16px 16px 24px", minHeight: "60vh" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "72px 0", gap: 14 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "2.5px solid rgba(255,255,255,0.08)",
                borderTopColor: "var(--color-primary)",
              }}
            />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", fontWeight: 600 }}>
              Loading…
            </span>
          </div>
        ) : (
          <>
            {[
              {
                key: "library",
                label: "In Library",
                color: "rgba(255,255,255,0.45)",
                filter: (b) => !b.isFinished && !(Number(b.pagesRead) > 0),
                hidden: statusFilter === "reading" || statusFilter === "finished",
              },
              {
                key: "reading",
                label: "Currently Reading",
                color: "var(--color-status-info, #60a5fa)",
                filter: (b) => !b.isFinished && Number(b.pagesRead) > 0,
                hidden: statusFilter === "library" || statusFilter === "finished",
              },
              {
                key: "finished",
                label: "Finished",
                color: "var(--color-status-success, #34d399)",
                filter: (b) => b.isFinished,
                hidden: statusFilter === "library" || statusFilter === "reading",
              },
            ].map(({ key, label, color, filter, hidden }) => {
              const sectionBooks = visibleBooks.filter(filter);
              if (hidden || sectionBooks.length === 0) return null;
              return (
                <div key={key} style={{ marginBottom: 24 }}>
                  <div className="bk-section-header">
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 500 }}>
                      {sectionBooks.length}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sectionBooks.map((book, i) => (
                      <motion.div
                        key={book._id}
                        className="bk-list-row"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: Math.min(0.2, i * 0.04) }}
                      >
                        <BookItem
                          book={book}
                          onUpdate={handleUpdateBook}
                          onDelete={handleDeleteBook}
                          onFinish={handleFinishBook}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {visibleBooks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 14 }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen size={28} style={{ color: "rgba(255,255,255,0.15)" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>No books found</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", marginTop: 5 }}>
                    {books.length === 0 ? "Add your first book to get started." : "Try adjusting your filters."}
                  </p>
                </div>
                {books.length === 0 && (
                  <button onClick={() => setShowAddForm(true)} className="bk-btn bk-btn-primary">
                    <Plus size={13} /> Add Book
                  </button>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ── Status bar ── */}
      <div className="bk-status-bar">
        {[
          { label: "Records", value: books.length },
          { label: "Shown", value: visibleBooks.length },
          { label: "Pages", value: `${stats.pagesRead.toLocaleString()} / ${stats.totalPages.toLocaleString()}` },
          { label: "Complete", value: `${stats.completionRate}%` },
        ].map(({ label, value }) => (
          <span key={label} style={{ color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{label}:</span> {value}
          </span>
        ))}
        <span
          style={{
            marginLeft: "auto",
            color: "var(--color-primary)",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: "0.06em",
            opacity: 0.7,
          }}
        >
          BOOK TRACKER
        </span>
      </div>
    </div>
  );
};

export default BooksPage;
