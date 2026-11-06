import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, FileText, Minus, Plus, Trash2 } from "lucide-react";
import BookCover from "./BookCover";
import { getProgress, formatDate } from "./bookStatus";

const QUICK_STEPS = [5, 10, 25];

// Sheet body for one book: log pages, finish, open notes, remove.
export default function BookDetail({ book, onSaveProgress, onFinish, onDelete }) {
  const { total, read } = getProgress(book);
  const [pages, setPages] = useState(read);
  const [busy, setBusy] = useState(false);
  const clamp = (n) => Math.max(0, Math.min(total, Math.round(Number(n) || 0)));
  const pct = total > 0 ? Math.round((pages / total) * 100) : 0;
  const changed = pages !== read;
  const willFinish = changed && total > 0 && pages >= total;

  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 pt-1">
      <div className="flex gap-4">
        <BookCover book={book} large className="h-36 w-24" />
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-lg font-semibold leading-snug text-text-main">{book.title}</h3>
          <p className="mt-0.5 text-sm text-text-secondary">
            {book.author}
            {book.year ? `, ${book.year}` : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="dash-tag tabular-nums">{total.toLocaleString()} pages</span>
            {book.isOwned && <span className="dash-tag">Owned</span>}
            {book.userRating ? <span className="dash-tag">{book.userRating}/10</span> : null}
          </div>
        </div>
      </div>

      {book.synopsis && <p className="line-clamp-4 text-[13px] leading-relaxed text-text-secondary">{book.synopsis}</p>}

      {book.isFinished ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400 text-black">
            <Check size={16} strokeWidth={3} />
          </span>
          <div>
            <p className="text-sm font-medium text-text-main">Finished</p>
            {book.finishedDate && <p className="text-xs text-text-secondary">{formatDate(book.finishedDate)}</p>}
          </div>
        </div>
      ) : (
        <section aria-label="Reading progress" className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-text-secondary">
              Page <span className="dash-value text-2xl">{pages.toLocaleString()}</span> of {total.toLocaleString()}
            </p>
            <span className="text-sm font-medium tabular-nums text-text-main">{pct}%</span>
          </div>

          <input
            type="range"
            min="0"
            max={total}
            value={pages}
            onChange={(e) => setPages(clamp(e.target.value))}
            aria-label="Pages read"
            className="bk-range mt-3"
          />

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPages((p) => clamp(p - 1))}
              className="bk-step"
              aria-label="One page back"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max={total}
              value={pages}
              onChange={(e) => setPages(clamp(e.target.value))}
              onFocus={(e) => e.target.select()}
              aria-label="Current page"
              className="bk-field flex-1 text-center tabular-nums"
            />
            <button
              type="button"
              onClick={() => setPages((p) => clamp(p + 1))}
              className="bk-step"
              aria-label="One page forward"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            {QUICK_STEPS.map((n) => (
              <button key={n} type="button" onClick={() => setPages((p) => clamp(p + n))} className="bk-chip">
                +{n}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={!changed || busy}
            onClick={() => run(() => onSaveProgress(book._id, pages))}
            className="bk-cta mt-4"
          >
            {busy ? "Saving…" : willFinish ? "Save and finish book" : changed ? "Save progress" : "Progress saved"}
          </button>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!book.isFinished && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => onFinish(book._id))}
            className="dash-btn !min-h-[40px] flex-1"
          >
            <Check size={14} /> Mark as finished
          </button>
        )}
        <Link to={`/books/${book._id}/notes`} className="dash-btn !min-h-[40px] flex-1">
          <FileText size={14} /> Notes
        </Link>
      </div>

      <button
        type="button"
        onClick={() => onDelete(book._id)}
        className="dash-btn dash-btn-danger !min-h-[40px] w-full !border-transparent"
      >
        <Trash2 size={14} /> Remove from library
      </button>
    </div>
  );
}
