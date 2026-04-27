// src/pages/BooksPage.jsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AddBookForm from "../components/books/AddBookForm";
import BookItem from "../components/books/BookItem";
import {
  BookOpen,
  Plus,
  X,
  Search,
  CheckCircle2,
  BookMarked,
  Layers,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";

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
    const activeBooks = totalBooks - finishedBooks;
    const totalPages = books.reduce((sum, book) => sum + (Number(book.totalPages) || 0), 0);
    const pagesRead = books.reduce((sum, book) => sum + (Number(book.pagesRead) || 0), 0);
    const completionRate = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;

    return {
      totalBooks,
      finishedBooks,
      activeBooks,
      totalPages,
      pagesRead,
      completionRate,
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
        (statusFilter === "active" && !book.isFinished) ||
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
    <div className="min-h-screen text-white" style={{ fontFamily: "var(--font-main)" }}>
      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 h-[300px] w-[300px] rounded-full bg-secondary/5 blur-[100px]" />
      </div>

      {/* ─────────────── HEADER ─────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative border-b border-white/8 pb-6 mb-8 overflow-hidden"
      >
        {/* Decorative oversized background word */}
        <span
          className="pointer-events-none select-none absolute -top-4 -left-2 text-[6rem] md:text-[9rem] font-black uppercase leading-none tracking-tighter text-white/[0.03]"
          aria-hidden
        >
          LIBRARY
        </span>

        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            {/* Chapter label */}
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-primary/70 mb-2">
              ✦ Personal Collection
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-none">Book Tracker</h1>
            <p className="mt-3 text-sm text-white/40 max-w-md">
              Track every page. Celebrate every finish. Build the library you always wanted.
            </p>
          </div>

          {/* Wendy Hearts */}
          <div className="flex items-center gap-3 rounded-xl border border-secondary/20 bg-secondary/5 px-5 py-3 self-start md:self-auto">
            <span className="text-2xl leading-none">❤️</span>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-secondary/60">Wendy Hearts</p>
              <p className="text-2xl font-bold text-secondary leading-none">{user?.wendyHearts ?? 0}</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ─────────────── STATS STRIP ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mb-8 grid grid-cols-2 md:grid-cols-5 gap-px bg-white/8 rounded-xl overflow-hidden border border-white/8"
      >
        {[
          { icon: Layers, label: "Total Books", value: stats.totalBooks, color: "text-primary" },
          { icon: BookOpen, label: "Active Reads", value: stats.activeBooks, color: "text-status-info" },
          { icon: CheckCircle2, label: "Finished", value: stats.finishedBooks, color: "text-status-success" },
          { icon: BookMarked, label: "Pages Read", value: stats.pagesRead.toLocaleString(), color: "text-secondary" },
          { icon: TrendingUp, label: "Completion", value: `${stats.completionRate}%`, color: "text-tertiary" },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 + i * 0.06 }}
            className="flex items-center gap-3 bg-surface/60 backdrop-blur px-4 py-4"
          >
            <Icon size={16} className={`${color} flex-shrink-0 opacity-70`} />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className={`text-xl font-bold leading-tight ${color}`}>{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─────────────── CONTROLS + ADD ─────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        {/* Left: Search + Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author…"
              className="w-52 rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder:text-white/25 outline-none transition focus:border-primary/50 focus:bg-white/8"
            />
          </label>

          <div className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 p-1">
            <SlidersHorizontal size={11} className="ml-1 mr-0.5 text-white/30" />
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "finished", label: "Done" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key)}
                className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-all ${
                  statusFilter === item.key
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/50 outline-none transition focus:border-primary/40 focus:text-white/80"
          >
            <option value="recent">Recent</option>
            <option value="progress">Progress</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>

        {/* Right: Add Book toggle */}
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
            showAddForm
              ? "border-white/20 bg-white/8 text-white/60"
              : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {showAddForm ? <X size={13} /> : <Plus size={13} />}
          {showAddForm ? "Cancel" : "Add Book"}
        </button>
      </motion.div>

      {/* ─────────────── ADD BOOK PANEL ─────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-1">
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

      {/* ─────────────── ERROR ─────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────── BOOK LIST ─────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
            className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary"
          />
          <p className="text-xs text-white/30 tracking-widest uppercase">Loading your library…</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          {/* ── Now Reading ── */}
          {visibleBooks.filter((b) => !b.isFinished).length > 0 && statusFilter !== "finished" && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/70 flex items-center gap-1.5">
                  <BookOpen size={11} />
                  Now Reading
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </div>
              <div className="space-y-4">
                {visibleBooks
                  .filter((b) => !b.isFinished)
                  .map((book, i) => (
                    <motion.div
                      key={book._id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(0.3, i * 0.06) }}
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
            </section>
          )}

          {/* ── Finished ── */}
          {visibleBooks.filter((b) => b.isFinished).length > 0 && statusFilter !== "active" && (
            <section className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-status-success/30 to-transparent" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-status-success/70 flex items-center gap-1.5">
                  <CheckCircle2 size={11} />
                  Finished
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-status-success/30 to-transparent" />
              </div>
              <div className="space-y-4">
                {visibleBooks
                  .filter((b) => b.isFinished)
                  .map((book, i) => (
                    <motion.div
                      key={book._id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(0.3, i * 0.06) }}
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
            </section>
          )}

          {/* ── Empty state ── */}
          {visibleBooks.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="rounded-full border border-white/10 bg-white/5 p-5">
                <BookOpen size={28} className="text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-sm text-white/40">No books match your current filters.</p>
                <p className="mt-1 text-xs text-white/20">
                  {books.length === 0
                    ? "Add your first book using the button above."
                    : "Try resetting your search or filter."}
                </p>
              </div>
              {books.length === 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
                >
                  <Plus size={13} />
                  Add Your First Book
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BooksPage;
