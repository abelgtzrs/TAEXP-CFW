// src/components/books/BookItem.jsx
import { Check, ChevronRight } from "lucide-react";
import BookCover from "./BookCover";
import { getBookStatus, getProgress, formatDate } from "./bookStatus";

// One library row. The whole row opens the book's detail sheet.
const BookItem = ({ book, onOpen }) => {
  const status = getBookStatus(book);
  const { total, pct } = getProgress(book);

  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      className="group/row flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary active:bg-white/[0.05]"
    >
      <BookCover book={book} className="h-[72px] w-12" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-text-main">{book.title}</p>
        <p className="truncate text-[13px] text-text-secondary">
          {book.author}
          {book.year ? `, ${book.year}` : ""}
        </p>

        {status === "finished" && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-300/90">
            <Check size={12} strokeWidth={2.5} />
            Finished {formatDate(book.finishedDate)}
            {book.userRating ? <span className="ml-1 text-text-secondary">{book.userRating}/10</span> : null}
          </p>
        )}
        {status === "reading" && (
          <div className="mt-2 flex items-center gap-2.5">
            <div className="dash-meter flex-1">
              <span style={{ width: `${pct}%` }} />
            </div>
            <span className="w-9 text-right text-xs tabular-nums text-text-secondary">{pct}%</span>
          </div>
        )}
        {status === "next" && (
          <p className="mt-1.5 text-xs tabular-nums text-text-secondary">{total.toLocaleString()} pages</p>
        )}
      </div>

      <ChevronRight size={16} className="shrink-0 text-text-secondary/40 transition-colors group-hover/row:text-text-secondary" />
    </button>
  );
};

export default BookItem;
