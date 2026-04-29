// src/components/books/BookItem.jsx
import { useState } from "react";
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

  const accentColor = book.isFinished ? "var(--color-status-success, #34d399)" : "var(--color-primary)";

  return (
    <div
      style={{
        fontFamily: "var(--font-main)",
        display: "flex",
        gap: 0,
        background: book.isFinished ? "rgba(52,211,153,0.05)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* ── Cover thumbnail ── */}
      <div
        style={{
          width: 72,
          height: 108,
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.07)",
          position: "relative",
          overflow: "hidden",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 22, opacity: 0.15 }}>📖</span>
          </div>
        )}

        {/* Progress fill — bottom-up thermometer */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${progressPercent}%`,
            background: `${accentColor}22`,
            borderTop: `1px solid ${accentColor}44`,
            transition: "height 0.6s ease-out",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        {/* Row 1: title + badges */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: book.isFinished ? "var(--color-status-success, #34d399)" : "var(--color-text-main, #e5e7eb)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.01em",
              }}
            >
              {book.isFinished && <span style={{ marginRight: 5, fontSize: 11 }}>✓</span>}
              {book.title}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {book.author}
              {book.year ? <span style={{ color: "rgba(255,255,255,0.2)", marginLeft: 8 }}>{book.year}</span> : null}
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
            {book.isOwned && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 4,
                  letterSpacing: "0.06em",
                  color: "var(--color-primary)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                OWNED
              </span>
            )}
            {book.userRating ? (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 4,
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {book.userRating}/10
              </span>
            ) : null}
            <span
              style={{
                fontSize: 9,
                padding: "2px 7px",
                borderRadius: 4,
                letterSpacing: "0.04em",
                fontWeight: 700,
                color: accentColor,
                border: `1px solid ${accentColor}44`,
                background: `${accentColor}12`,
              }}
            >
              {book.isFinished ? "DONE" : "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Row 2: slim progress bar */}
        <div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: "rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                borderRadius: 3,
                background: accentColor,
                transition: "width 0.6s ease-out",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 4,
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <span>
              {book.pagesRead.toLocaleString()} / {book.totalPages.toLocaleString()} pages
            </span>
            <span style={{ color: accentColor, fontWeight: 600 }}>{pct}%</span>
          </div>
        </div>

        {/* Synopsis */}
        {book.synopsis && (
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.28)",
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
            }}
          >
            {book.synopsis}
          </p>
        )}

        {/* Row 3: Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            flexWrap: "wrap",
            marginTop: 2,
          }}
        >
          {!book.isFinished && (
            <>
              {/* Page input group */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  min="0"
                  max={book.totalPages}
                  aria-label="Pages read"
                  className="bk-page-input"
                  style={{
                    width: 60,
                    fontSize: 12,
                    padding: "5px 7px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.3)",
                    color: "var(--color-text-main, #e5e7eb)",
                    outline: "none",
                    textAlign: "right",
                    fontFamily: "var(--font-main)",
                  }}
                />
                <button
                  onClick={handleProgressUpdate}
                  disabled={updating || Number(currentPage) === book.pagesRead}
                  className="bk-btn"
                  style={{
                    padding: "5px 9px",
                    fontSize: 11,
                    gap: 4,
                    opacity: updating || Number(currentPage) === book.pagesRead ? 0.4 : 1,
                  }}
                >
                  <RefreshCw size={11} style={{ animation: updating ? "bk-spin 1s linear infinite" : "none" }} />
                  Update
                </button>
              </div>

              <button
                onClick={() => onFinish(book._id)}
                className="bk-btn bk-btn-primary bk-ctrl-complete"
                style={{ padding: "5px 10px", fontSize: 11, gap: 4 }}
              >
                <Check size={11} strokeWidth={2.5} />
                Complete
              </button>
            </>
          )}

          <Link
            to={`/books/${book._id}/notes`}
            className="bk-btn"
            style={{ textDecoration: "none", padding: "5px 9px", fontSize: 11, gap: 4 }}
          >
            <FileText size={11} />
            Notes
          </Link>

          <button
            onClick={() => onDelete(book._id)}
            title="Remove book"
            className="bk-btn bk-btn-danger"
            style={{ marginLeft: "auto", padding: "5px 9px", fontSize: 11, gap: 4 }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookItem;
