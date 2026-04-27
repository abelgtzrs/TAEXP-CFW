// src/components/books/BookItem.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Trash2, FileText, RefreshCw } from "lucide-react";

const BookItem = ({ book, onUpdate, onDelete, onFinish }) => {
  const [currentPage, setCurrentPage] = useState(book.pagesRead);
  const [updating, setUpdating] = useState(false);

  const progressPercent = book.totalPages > 0 ? (book.pagesRead / book.totalPages) * 100 : 0;
  const pct = Math.round(progressPercent);

  const handleProgressUpdate = async () => {
    if (Number(currentPage) === book.pagesRead) return;
    setUpdating(true);
    await onUpdate(book._id, { pagesRead: Number(currentPage) });
    setUpdating(false);
  };

  // Spine gradient: primary→secondary for active, status-success for finished
  const spineColor = book.isFinished ? "from-status-success to-status-success/60" : "from-primary to-secondary";

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={`relative flex rounded-xl overflow-hidden border transition-colors duration-300 ${
        book.isFinished ? "border-status-success/20 bg-status-success/5" : "border-white/8 bg-surface/50"
      }`}
      style={{ backdropFilter: "blur(8px)" }}
    >
      {/* ── Left progress spine ── */}
      <div className="relative w-1 flex-shrink-0 bg-white/5">
        <motion.div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${spineColor} rounded-tl-xl`}
          initial={{ height: 0 }}
          animate={{ height: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* ── Cover image ── */}
      <div className="relative flex-shrink-0 w-24 sm:w-32 self-stretch">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
            style={{ minHeight: "140px" }}
          />
        ) : (
          <div className="w-full h-full flex items-end justify-center pb-3 bg-white/5" style={{ minHeight: "140px" }}>
            <span className="text-[10px] uppercase tracking-widest text-white/20">No Cover</span>
          </div>
        )}
        {/* Finished badge overlaid on cover */}
        {book.isFinished && (
          <div className="absolute top-2 right-2 rounded-full bg-status-success/90 p-1 shadow-lg">
            <Check size={10} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-grow px-4 py-4 gap-3 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className={`text-lg font-bold leading-tight truncate ${
                book.isFinished ? "text-status-success/80" : "text-white"
              }`}
            >
              {book.title}
            </h3>
            <p className="text-xs text-white/40 mt-0.5 truncate">
              {book.author}
              {book.year ? <span className="ml-2 text-white/25">· {book.year}</span> : null}
            </p>
          </div>

          {/* Meta pills */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {book.isOwned && (
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary/30 text-primary/70">
                Owned
              </span>
            )}
            {book.userRating ? (
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/15 text-white/40">
                {book.userRating}/10
              </span>
            ) : null}
          </div>
        </div>

        {/* Progress track */}
        <div>
          <div className="relative h-1.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div
              className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${spineColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/30">
              {book.pagesRead.toLocaleString()} / {book.totalPages.toLocaleString()} pages
            </span>
            <span
              className={`text-[10px] font-semibold tabular-nums ${
                book.isFinished ? "text-status-success" : "text-primary"
              }`}
            >
              {pct}%
            </span>
          </div>
        </div>

        {/* Synopsis snippet */}
        {book.synopsis && <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2">{book.synopsis}</p>}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
          {!book.isFinished && (
            <>
              {/* Page input */}
              <div className="flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  min="0"
                  max={book.totalPages}
                  aria-label="Pages read"
                  className="w-16 bg-transparent px-2 py-1.5 text-xs text-white tabular-nums outline-none"
                />
                <button
                  onClick={handleProgressUpdate}
                  disabled={updating || Number(currentPage) === book.pagesRead}
                  className="flex items-center gap-1 px-2 py-1.5 border-l border-white/10 text-[10px] text-primary/80 hover:text-primary hover:bg-primary/10 disabled:opacity-30 transition-colors"
                >
                  <RefreshCw size={10} className={updating ? "animate-spin" : ""} />
                  Save
                </button>
              </div>

              {/* Finish */}
              <button
                onClick={() => onFinish(book._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-status-success/30 bg-status-success/10 text-[11px] text-status-success hover:bg-status-success/20 transition-colors"
              >
                <Check size={11} strokeWidth={2.5} />
                Mark Finished
              </button>
            </>
          )}

          {/* Notes link */}
          <Link
            to={`/books/${book._id}/notes`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-[11px] text-white/35 hover:text-white/70 hover:border-white/20 transition-colors"
          >
            <FileText size={11} />
            Notes
          </Link>

          {/* Delete — far right */}
          <button
            onClick={() => onDelete(book._id)}
            title="Remove book"
            aria-label="Delete book"
            className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-white/20 hover:text-status-danger hover:bg-status-danger/10 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default BookItem;
