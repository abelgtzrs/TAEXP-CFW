const FINISHED_STATUSES = new Set(["completed", "watched"]);

export const movieKey = ({ title = "", releaseYear }) =>
  `${title.trim().toLowerCase()}::${releaseYear || ""}`;

export const buildMovieLibrary = (items, genre = "all") => {
  const genres = [...new Set(items.flatMap((item) => item.genre || []))].sort((a, b) => a.localeCompare(b));
  const visible = genre === "all" ? items : items.filter((item) => item.genre?.includes(genre));

  return {
    genres,
    watchlist: visible.filter((item) => !FINISHED_STATUSES.has(item.status)),
    watched: visible.filter((item) => FINISHED_STATUSES.has(item.status)),
  };
};
