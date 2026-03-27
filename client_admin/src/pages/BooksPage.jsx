// src/pages/BooksPage.jsx
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AddBookForm from "../components/books/AddBookForm";
import BookItem from "../components/books/BookItem";
import PageHeader from "../components/ui/PageHeader";
import { BookOpen, Filter, Search, Sparkles } from "lucide-react";

const BooksPage = () => {
  const { user, setUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("recent");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await api.get("/books");
        // Sort books: unfinished first, then by most recently updated
        const sortedBooks = response.data.data.sort(
          (a, b) => a.isFinished - b.isFinished || new Date(b.updatedAt) - new Date(a.updatedAt)
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} className="space-y-7">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader title="Book Tracker" subtitle="Manage your personal library and track your reading progress." />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-black/70 p-6"
      >
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-text-tertiary">
              <Sparkles size={14} className="text-amber-300" />
              Reading Season
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-white">Your Library At a Glance</h2>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Build momentum with active reads, monitor completion, and keep your bookshelf moving with focused progress updates.
            </p>
          </div>

          <div className="rounded-xl border border-pink-300/30 bg-pink-300/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-pink-100/70">Wendy Hearts</p>
            <p className="text-2xl font-bold text-pink-200">{user?.wendyHearts || 0} ❤️</p>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Active Reads</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.activeBooks}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Completed</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.finishedBooks}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Pages Read</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.pagesRead.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-text-tertiary">Completion</p>
            <p className="mt-1 text-2xl font-semibold text-white">{stats.completionRate}%</p>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
      >
        <AddBookForm onAddBook={handleAddBook} loading={formLoading} />
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
              <BookOpen size={22} className="text-primary" />
              Your Library
            </h2>
            <p className="mt-1 text-xs text-text-tertiary">
              Hover or focus a cover for deep details. Use Notes/⚙️ to open the interaction workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, year"
                className="w-60 rounded-lg border border-white/15 bg-black/25 py-2 pl-9 pr-3 text-sm text-white placeholder:text-text-tertiary outline-none transition focus:border-primary"
              />
            </label>

            <div className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-black/25 p-1">
              <Filter size={14} className="ml-1 text-text-tertiary" />
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "finished", label: "Finished" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setStatusFilter(item.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === item.key
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              className="rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-xs text-text-secondary outline-none transition focus:border-primary"
            >
              <option value="recent">Sort: Recently Updated</option>
              <option value="progress">Sort: Highest Progress</option>
              <option value="title">Sort: Title A-Z</option>
            </select>
          </div>
        </div>

        {loading && <motion.p className="py-8 text-center text-text-secondary">Loading your library...</motion.p>}

        {error && (
          <motion.p
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-status-danger/40 bg-status-danger/10 py-4 text-center text-status-danger"
          >
            {error}
          </motion.p>
        )}

        {!loading && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} className="space-y-5">
            {visibleBooks.length > 0 ? (
              visibleBooks.map((book, index) => (
                <motion.div
                  key={book._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.34, delay: Math.min(0.35, index * 0.05) }}
                  whileHover={{ y: -2, transition: { duration: 0.18 } }}
                >
                  <BookItem
                    book={book}
                    onUpdate={handleUpdateBook}
                    onDelete={handleDeleteBook}
                    onFinish={handleFinishBook}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-dashed border-white/20 bg-black/20 py-10 text-center"
              >
                <p className="text-sm text-text-secondary">No books match your current filters.</p>
                <p className="mt-1 text-xs text-text-tertiary">Try resetting search/filter controls or add a new book above.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
};

export default BooksPage;
