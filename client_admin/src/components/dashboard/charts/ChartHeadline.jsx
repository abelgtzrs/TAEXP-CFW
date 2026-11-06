// Big current value above each chart, with an optional change pill and caption.
export default function ChartHeadline({ value, delta, caption }) {
  const hasDelta = delta !== undefined && delta !== null && delta !== "";
  const up = hasDelta && !String(delta).startsWith("-");
  return (
    <div className="mb-2 flex items-baseline gap-2">
      <span className="dash-value text-2xl leading-none">{value}</span>
      {hasDelta && (
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
            up ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
          }`}
        >
          {up && !String(delta).startsWith("+") ? `+${delta}` : delta}
        </span>
      )}
      {caption && <span className="truncate text-[11px] text-text-secondary">{caption}</span>}
    </div>
  );
}
