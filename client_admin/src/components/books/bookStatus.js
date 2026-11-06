// "reading" = started but not finished, "next" = not started yet.
export const getBookStatus = (book) => {
  if (book.isFinished) return "finished";
  return Number(book.pagesRead) > 0 ? "reading" : "next";
};

export const getProgress = (book) => {
  const total = Number(book.totalPages) || 0;
  const read = Number(book.pagesRead) || 0;
  return { total, read, pct: total > 0 ? Math.min(100, Math.round((read / total) * 100)) : 0 };
};

export const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
