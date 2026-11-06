import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Widget from "../ui/Widget";
import BookCover from "../books/BookCover";
import BookItem from "../books/BookItem";
import BookDetail from "../books/BookDetail";
import Sheet from "../books/Sheet";
import { getBookStatus, getProgress } from "../books/bookStatus";
import useBookLibrary from "../../hooks/useBookLibrary";

const QUICK_PAGES = 10;
const MAX_LIST = 3;
const byRecent = (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);

// Dashboard reading card: the current book up front with one-tap logging, the rest of the queue below.
const BookTrackerWidget = () => {
  const { books, loading, saveProgress, finishBook, deleteBook } = useBookLibrary();
  const [selectedId, setSelectedId] = useState(null);
  const [bumping, setBumping] = useState(false);

  const reading = books.filter((b) => getBookStatus(b) === "reading").sort(byRecent);
  const upNext = books.filter((b) => getBookStatus(b) === "next").sort(byRecent);
  const active = [...reading, ...upNext];
  const hero = active[0];
  const rest = active.slice(1, 1 + MAX_LIST);
  const finishedCount = books.filter((b) => b.isFinished).length;
  const pagesRead = books.reduce((sum, b) => sum + (Number(b.pagesRead) || 0), 0);

  const selectedBook = books.find((b) => b._id === selectedId) || null;
  // Keeps the last book rendered while the sheet animates closed.
  const lastBookRef = useRef(null);
  if (selectedBook) lastBookRef.current = selectedBook;
  const sheetBook = selectedBook || lastBookRef.current;
  const open = (book) => setSelectedId(book._id);

  // Near the end the quick button only adds what's left, so it lands exactly on the last page.
  const heroProgress = hero ? getProgress(hero) : null;
  const quickStep = heroProgress ? Math.min(QUICK_PAGES, heroProgress.total - heroProgress.read) : 0;

  const logQuickPages = async () => {
    setBumping(true);
    await saveProgress(hero._id, heroProgress.read + quickStep);
    setBumping(false);
  };

  const openLog = (
    <Link to="/books" className="dash-btn !min-h-[28px] !px-2.5 !text-[11px]">
      Open log
    </Link>
  );

  return (
    <Widget title="Reading" titleChildren={openLog} padding="p-4">
      {loading ? (
        <div className="flex animate-pulse gap-4 motion-reduce:animate-none" aria-hidden="true">
          <div className="h-[120px] w-20 rounded-md bg-white/[0.06]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-3/4 rounded bg-white/[0.06]" />
            <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
          </div>
        </div>
      ) : !hero ? (
        <div className="dash-empty">
          <p>{books.length ? "You've finished everything on your list." : "No books yet."}</p>
          <Link to="/books" className="dash-btn dash-btn-primary mt-3 !min-h-[40px]">
            Add a book
          </Link>
        </div>
      ) : (
        <>
          <HeroBook book={hero} onOpen={open} />

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <button type="button" onClick={() => open(hero)} className="bk-cta">
              Log pages
            </button>
            <button
              type="button"
              onClick={logQuickPages}
              disabled={bumping || quickStep <= 0}
              aria-label={`Add ${quickStep} pages to ${hero.title}`}
              className="bk-chip px-4 disabled:opacity-40"
            >
              +{quickStep}
            </button>
          </div>

          {rest.length > 0 && (
            <div className="mt-4">
              <p className="mb-0.5 text-xs text-text-secondary">Also on your list</p>
              <div className="-mx-2">
                {rest.map((book) => (
                  <BookItem key={book._id} book={book} onOpen={open} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-xs text-text-secondary tabular-nums">
            <span>
              {finishedCount} finished, {pagesRead.toLocaleString()} pages read
            </span>
            {active.length > 1 + MAX_LIST && (
              <Link to="/books" className="text-text-main hover:underline">
                See all {active.length}
              </Link>
            )}
          </div>
        </>
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
    </Widget>
  );
};

function HeroBook({ book, onOpen }) {
  const { total, read, pct } = getProgress(book);
  const started = read > 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      className="flex w-full gap-4 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <BookCover book={book} large className="h-[120px] w-20" />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-[11px] text-text-secondary">{started ? "Continue reading" : "Start reading"}</p>
        <p className="mt-0.5 line-clamp-2 text-base font-semibold leading-snug text-text-main">{book.title}</p>
        <p className="truncate text-[13px] text-text-secondary">{book.author}</p>
        <div className="mt-auto pt-3">
          <div className="flex items-baseline justify-between text-xs tabular-nums text-text-secondary">
            <span>
              Page {read.toLocaleString()} of {total.toLocaleString()}
            </span>
            <span className="font-medium text-text-main">{pct}%</span>
          </div>
          <div className="dash-meter mt-1.5">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
}

export default BookTrackerWidget;
