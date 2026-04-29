// src/components/books/AddBookForm.jsx
import { useState } from "react";

const MONO = "var(--font-main)";

const LABEL_STYLE = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  letterSpacing: "0.05em",
  textAlign: "right",
  paddingRight: 10,
  paddingTop: 5,
  whiteSpace: "nowrap",
  fontFamily: MONO,
};

const INPUT_STYLE = {
  fontFamily: MONO,
  fontSize: 12,
  background: "rgba(0,0,0,0.35)",
  borderTop: "2px solid rgba(0,0,0,0.55)",
  borderLeft: "2px solid rgba(0,0,0,0.55)",
  borderBottom: "2px solid rgba(255,255,255,0.12)",
  borderRight: "2px solid rgba(255,255,255,0.12)",
  color: "var(--color-text-main, #e5e7eb)",
  padding: "5px 8px",
  outline: "none",
  width: "100%",
};

const AddBookForm = ({ onAddBook, loading }) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !author || !totalPages) return;
    onAddBook({ title, author, totalPages: Number(totalPages), coverImageUrl, year: year ? Number(year) : undefined });
    setTitle("");
    setAuthor("");
    setTotalPages("");
    setCoverImageUrl("");
    setYear("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ fontFamily: MONO }}>
      {/* Form rows — label + input pairs */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <tbody>
          <tr>
            <td style={{ ...LABEL_STYLE, width: 110 }}>TITLE *</td>
            <td style={{ padding: "2px 4px" }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Book title..."
                style={INPUT_STYLE}
              />
            </td>
          </tr>
          <tr>
            <td style={LABEL_STYLE}>AUTHOR *</td>
            <td style={{ padding: "2px 4px" }}>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                placeholder="Author name..."
                style={INPUT_STYLE}
              />
            </td>
          </tr>
          <tr>
            <td style={LABEL_STYLE}>PAGES *</td>
            <td style={{ padding: "2px 4px" }}>
              <input
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                required
                min="1"
                placeholder="Total page count..."
                style={{ ...INPUT_STYLE, maxWidth: 160 }}
              />
            </td>
          </tr>
          <tr>
            <td style={LABEL_STYLE}>YEAR</td>
            <td style={{ padding: "2px 4px" }}>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min="0"
                placeholder="Year published (optional)..."
                style={{ ...INPUT_STYLE, maxWidth: 160 }}
              />
            </td>
          </tr>
          <tr>
            <td style={LABEL_STYLE}>COVER URL</td>
            <td style={{ padding: "2px 4px" }}>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://... (optional)"
                style={INPUT_STYLE}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Separator */}
      <div
        style={{
          margin: "8px 4px",
          borderTop: "1px solid rgba(0,0,0,0.45)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      {/* Footer */}
      <div
        className="retro-form-footer"
        style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, padding: "0 4px 4px" }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>* REQUIRED</span>
        <button
          type="submit"
          disabled={loading || !title || !author || !totalPages}
          className="bk-btn bk-btn-primary"
          style={{
            opacity: loading || !title || !author || !totalPages ? 0.5 : 1,
            padding: "5px 20px",
            fontSize: 12,
            letterSpacing: "0.04em",
          }}
        >
          {loading ? "SAVING..." : "[ OK ]  ADD RECORD"}
        </button>
      </div>
    </form>
  );
};

export default AddBookForm;
