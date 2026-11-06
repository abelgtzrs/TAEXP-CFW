// src/pages/BooksPage.jsx
import { useState, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import useBookLibrary from "../hooks/useBookLibrary";
import AddBookForm from "../components/books/AddBookForm";
import BookItem from "../components/books/BookItem";
import BookDetail from "../components/books/BookDetail";
import Sheet from "../components/books/Sheet";
import { getBookStatus } from "../components/books/bookStatus";
import { BookOpen, Heart, Plus, Search, X } from "lucide-react";

const SECTIONS = [
  { key: "reading", label: "Currently reading" },
  { key: "next", label: "Up next" },
  { key: "finished", label: "Finished" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "reading", label: "Reading" },
  { key: "next", label: "Up next" },
  { key: "finished", label: "Finished" },
];

const BooksPage = () => {
  const { user } = useAuth();
  const { books, loading, loadError, adding, addBook, saveProgress, finishBook, deleteBook } = useBookLibrary();
  const [hideError, setHideError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("recent");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const error = hideError ? "" : loadError;

  const selectedBook = books.find((b) => b._id === selectedId) || null;
  // Keeps the last book rendered while the sheet animates closed.
  const lastBookRef = useRef(null);
  if (selectedBook) lastBookRef.current = selectedBook;
  const sheetBook = selectedBook || lastBookRef.current;

  const handleAddBook = async (bookData) => {
    const ok = await addBook(bookData);
    if (ok) setAddOpen(false);
    return ok;
  };

  const stats = useMemo(() => {
    const counts = { all: books.length, reading: 0, next: 0, finished: 0 };
    books.forEach((b) => (counts[getBookStatus(b)] += 1));
    const pagesRead = books.reduce((sum, b) => sum + (Number(b.pagesRead) || 0), 0);
    return { counts, pagesRead };
  }, [books]);

  const visibleBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = books.filter((book) => {
      const matchesQuery =
        !query ||
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        String(book.year || "").includes(query);
      return matchesQuery && (statusFilter === "all" || getBookStatus(book) === statusFilter);
    });

    return filtered.sort((a, b) => {
      if (sortMode === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortMode === "progress") {
        const pct = (x) => (Number(x.pagesRead) || 0) / Math.max(Number(x.totalPages) || 1, 1);
        return pct(b) - pct(a);
      }
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });
  }, [books, searchQuery, statusFilter, sortMode]);

  const kpis = [
    { label: "Reading", value: stats.counts.reading },
    { label: "Up next", value: stats.counts.next },
    { label: "Finished", value: stats.counts.finished },
    { label: "Pages read", value: stats.pagesRead.toLocaleString() },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-text-main sm:text-3xl">Reading Log</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {loading
              ? "Loading your library…"
              : `${books.length} ${books.length === 1 ? "book" : "books"}, ${stats.pagesRead.toLocaleString()} pages read`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            title="Wendy Hearts"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-sm font-medium tabular-nums text-text-main"
          >
            <Heart size={14} className="fill-rose-400 text-rose-400" aria-hidden="true" />
            {user?.wendyHearts ?? 0}
            <span className="sr-only">Wendy Hearts</span>
          </span>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Add book"
            className="bk-cta !min-h-[40px] !w-auto gap-1.5 px-3 sm:px-4"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">Add book</span>
          </button>
        </div>
      </header>

      <div className="dashboard-kpi-panel mt-6 grid grid-cols-2 sm:grid-cols-4">
        {kpis.map(({ label, value }) => (
          <div key={label} className="bg-surface px-4 py-3">
            <p className="text-xs text-text-secondary">{label}</p>
            <p className="dash-value mt-1 text-xl">{loading ? "–" : value}</p>
          </div>
        ))}
      </div>

      <div className="bk-toolbar mt-6 flex flex-wrap gap-2.5">
        <div className="relative min-w-0 flex-1 basis-48">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, author or year"
            aria-label="Search books"
            className="bk-field !pl-9"
          />
        </div>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
          aria-label="Sort books"
          className="bk-field !w-auto shrink-0"
        >
          <option value="recent">Recently updated</option>
          <option value="progress">Most progress</option>
          <option value="title">Title A–Z</option>
        </select>
        <div className="dash-segment order-last w-full sm:order-none sm:w-auto" role="group" aria-label="Filter by status">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              aria-pressed={statusFilter === key}
              className={`whitespace-nowrap ${statusFilter === key ? "is-active" : ""}`}
            >
              {label}
              <span className="ml-1 tabular-nums opacity-50">{stats.counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-200"
        >
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setHideError(true)} aria-label="Dismiss" className="text-rose-200/70 hover:text-rose-100">
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid gap-x-6 sm:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3.5 px-2 py-2.5 motion-reduce:animate-none">
              <div className="h-[72px] w-12 rounded-md bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded bg-white/[0.06]" />
                <div className="h-3 w-1/3 rounded bg-white/[0.05]" />
                <div className="h-1 w-full rounded bg-white/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <BookOpen size={24} className="text-text-secondary" />
          </div>
          <p className="mt-4 text-base font-medium text-text-main">Your library is empty</p>
          <p className="mt-1 text-sm text-text-secondary">Add a book to start tracking your reading.</p>
          <button type="button" onClick={() => setAddOpen(true)} className="bk-cta mt-5 !w-auto gap-1.5 px-5">
            <Plus size={16} /> Add your first book
          </button>
        </div>
      ) : visibleBooks.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-sm text-text-secondary">No books match your search.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="dash-btn mt-3 !min-h-[40px]"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        SECTIONS.map(({ key, label }) => {
          const sectionBooks = visibleBooks.filter((b) => getBookStatus(b) === key);
          if (sectionBooks.length === 0) return null;
          return (
            <section key={key} aria-labelledby={`books-${key}`} className="mt-8">
              <h2 id={`books-${key}`} className="mb-1 flex items-baseline gap-2 px-2 text-sm font-semibold text-text-main">
                {label}
                <span className="text-xs font-normal tabular-nums text-text-secondary">{sectionBooks.length}</span>
              </h2>
              <div className="grid gap-x-6 sm:grid-cols-2">
                {sectionBooks.map((book) => (
                  <BookItem key={book._id} book={book} onOpen={(b) => setSelectedId(b._id)} />
                ))}
              </div>
            </section>
          );
        })
      )}

      <Sheet open={!!selectedBook} onClose={() => setSelectedId(null)} title="Book details">
        {sheetBook && (
          <BookDetail
            key={sheetBook._id}
            book={sheetBook}
            onSaveProgress={saveProgress}
            onFinish={finishBook}
            onDelete={deleteBook}
          />
        )}
      </Sheet>

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add a book">
        <AddBookForm onAddBook={handleAddBook} loading={adding} />
      </Sheet>
    </div>
  );
};

export default BooksPage;
