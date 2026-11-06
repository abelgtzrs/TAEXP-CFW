// src/components/books/AddBookForm.jsx
import { useState } from "react";

const EMPTY = { title: "", author: "", totalPages: "", year: "", coverImageUrl: "" };

// `onAddBook` resolves true on success; the form only clears then, so a failed save keeps the input.
const AddBookForm = ({ onAddBook, loading }) => {
  const [form, setForm] = useState(EMPTY);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const canSubmit = form.title.trim() && form.author.trim() && Number(form.totalPages) >= 1 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await onAddBook({
      title: form.title.trim(),
      author: form.author.trim(),
      totalPages: Number(form.totalPages),
      coverImageUrl: form.coverImageUrl.trim(),
      year: form.year ? Number(form.year) : undefined,
    });
    if (ok) setForm(EMPTY);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
      <label className="block text-xs font-medium text-text-secondary">
        Title
        <input type="text" value={form.title} onChange={set("title")} required className="bk-field mt-1.5" />
      </label>
      <label className="block text-xs font-medium text-text-secondary">
        Author
        <input type="text" value={form.author} onChange={set("author")} required className="bk-field mt-1.5" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-text-secondary">
          Pages
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={form.totalPages}
            onChange={set("totalPages")}
            required
            className="bk-field mt-1.5 tabular-nums"
          />
        </label>
        <label className="block text-xs font-medium text-text-secondary">
          Year <span className="font-normal opacity-60">(optional)</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={form.year}
            onChange={set("year")}
            className="bk-field mt-1.5 tabular-nums"
          />
        </label>
      </div>
      <label className="block text-xs font-medium text-text-secondary">
        Cover image URL <span className="font-normal opacity-60">(optional)</span>
        <input
          type="text"
          inputMode="url"
          value={form.coverImageUrl}
          onChange={set("coverImageUrl")}
          placeholder="https://"
          className="bk-field mt-1.5"
        />
      </label>
      <button type="submit" disabled={!canSubmit} className="bk-cta !mt-5">
        {loading ? "Adding…" : "Add to library"}
      </button>
    </form>
  );
};

export default AddBookForm;
