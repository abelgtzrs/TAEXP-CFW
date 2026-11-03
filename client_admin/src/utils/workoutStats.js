// Pure helpers for the dashboard workout widget.

export const countSets = (log) =>
  (Array.isArray(log?.exercises) ? log.exercises : []).reduce(
    (acc, ex) => acc + (Array.isArray(ex?.sets) ? ex.sets.length : 0),
    0,
  );

export const logMinutes = (log) =>
  Number(log?.durationSessionMinutes ?? log?.durationMinutes ?? log?.duration ?? 0) || 0;

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;

const makeBucket = (key, label, title) => ({ key, label, title, workouts: 0, sets: 0, minutes: 0 });

// Groups logs into chart buckets for a range ending at `now` (local time).
// range: "7d" | "30d" (one bucket per day), "12m" (per month), "all" (per year).
export function buildWorkoutBuckets(logs, range, now = new Date()) {
  const buckets = [];
  let keyOf;

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    keyOf = dayKey;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      // 30d: label every 7th day counting back from today so labels never crowd
      const label = range === "7d" ? DAY_LETTERS[d.getDay()] : i % 7 === 0 ? String(d.getDate()) : "";
      const title = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      buckets.push(makeBucket(dayKey(d), label, title));
    }
  } else if (range === "12m") {
    keyOf = monthKey;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const title = d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
      buckets.push(makeBucket(monthKey(d), MONTH_LETTERS[d.getMonth()], title));
    }
  } else {
    keyOf = (d) => String(d.getFullYear());
    const years = logs.map((l) => new Date(l?.date).getFullYear()).filter(Number.isFinite);
    const first = years.length ? Math.min(...years) : now.getFullYear();
    for (let y = first; y <= now.getFullYear(); y++) {
      buckets.push(makeBucket(String(y), `'${String(y).slice(-2)}`, String(y)));
    }
  }

  const byKey = new Map(buckets.map((b) => [b.key, b]));
  const summary = { workouts: 0, sets: 0, minutes: 0 };
  for (const log of logs) {
    if (!log?.date) continue;
    const bucket = byKey.get(keyOf(new Date(log.date)));
    if (!bucket) continue;
    const sets = countSets(log);
    const minutes = logMinutes(log);
    bucket.workouts += 1;
    bucket.sets += sets;
    bucket.minutes += minutes;
    summary.workouts += 1;
    summary.sets += sets;
    summary.minutes += minutes;
  }

  return { buckets, summary };
}

export function formatRelativeDay(date, now = new Date()) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
