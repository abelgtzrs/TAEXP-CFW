const VolumeStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
      status === "published" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${status === "published" ? "bg-emerald-400" : "bg-amber-400"}`} />
    {status}
  </span>
);

export default VolumeStatusBadge;
