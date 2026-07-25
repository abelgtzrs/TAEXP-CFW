import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  ListFilter,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import VolumeMobileForm from "../components/volumes/VolumeMobileForm";
import { searchVolumes } from "../utils/volumeSearch";
import { buildExportText, copyToClipboard, downloadTxt } from "./volumeFunctionality/exportHelpers";
import { toFormData, toPayload } from "./volumeFunctionality/formMappers";
import {
  createVolume,
  deleteVolume as removeVolume,
  fetchVolumes as fetchAllVolumes,
  updateVolume,
} from "./volumeFunctionality/volumeApi";

const INITIAL_FORM_STATE = {
  rawPastedText: "",
  status: "draft",
  volumeNumber: "",
  title: "",
  bodyText: "",
  blessingIntro: "",
  blessings: [],
  dream: "",
  edition: "",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
      status === "published" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${status === "published" ? "bg-emerald-400" : "bg-amber-400"}`} />
    {status}
  </span>
);

const VolumesMobilePage = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sortKey, setSortKey] = useState("volume");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [resultNotice, setResultNotice] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState([]);

  const fetchVolumes = async () => {
    try {
      setLoading(true);
      const data = await fetchAllVolumes();
      setVolumes(data);
      setError("");
    } catch {
      setError("We couldn't load your volumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  useEffect(() => {
    if (!resultNotice) return undefined;
    const timer = setTimeout(() => setResultNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [resultNotice]);

  const volumeStats = useMemo(
    () => ({
      total: volumes.length,
      published: volumes.filter((volume) => volume.status === "published").length,
      drafts: volumes.filter((volume) => volume.status !== "published").length,
    }),
    [volumes],
  );

  const sortedVolumes = useMemo(() => {
    let nextVolumes = [...volumes];

    if (searchQuery.trim()) {
      nextVolumes = searchVolumes(nextVolumes, searchQuery).map((result) => result.volume);
    }

    if (statusFilter !== "all") {
      nextVolumes = nextVolumes.filter((volume) => volume.status === statusFilter);
    }

    nextVolumes.sort((a, b) => {
      const values = {
        volume: [Number(a.volumeNumber) || 0, Number(b.volumeNumber) || 0],
        blessings: [a.blessings?.length || 0, b.blessings?.length || 0],
        lines: [a.bodyLines?.length || 0, b.bodyLines?.length || 0],
      };
      const [aValue, bValue] = values[sortKey];
      return sortDir === "asc" ? aValue - bValue : bValue - aValue;
    });

    return nextVolumes;
  }, [volumes, searchQuery, statusFilter, sortKey, sortDir]);

  const exportableVolumes = useMemo(
    () => [...volumes].sort((a, b) => (Number(a.volumeNumber) || 0) - (Number(b.volumeNumber) || 0)),
    [volumes],
  );
  const selectedExportVolumes = useMemo(
    () => exportableVolumes.filter((volume) => exportSelectedIds.includes(volume._id)),
    [exportableVolumes, exportSelectedIds],
  );
  const exportText = useMemo(() => buildExportText(selectedExportVolumes), [selectedExportVolumes]);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_STATE);
    setViewMode("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (volume) => {
    setEditingId(volume._id);
    setFormData(toFormData(volume));
    setViewMode("editor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const payload = toPayload(formData);

      if (editingId) {
        await updateVolume(editingId, payload);
        const latestVolumes = await fetchAllVolumes();
        setVolumes(latestVolumes);
        const updatedVolume = latestVolumes.find((volume) => volume._id === editingId);
        if (updatedVolume) setFormData(toFormData(updatedVolume));
        setResultNotice("Volume updated");
      } else {
        await createVolume(payload);
        setFormData(INITIAL_FORM_STATE);
        await fetchVolumes();
        setViewMode("list");
        setResultNotice("Volume created");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't save this volume.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVolume = async () => {
    if (!editingId || !window.confirm("Permanently delete this volume? This cannot be undone.")) return;

    try {
      await removeVolume(editingId);
      setEditingId(null);
      setFormData(INITIAL_FORM_STATE);
      await fetchVolumes();
      setViewMode("list");
      setResultNotice("Volume deleted");
    } catch {
      setError("We couldn't delete that volume.");
    }
  };

  const openExportModal = () => {
    setExportSelectedIds(exportableVolumes.filter((volume) => volume.status === "published").map((volume) => volume._id));
    setExportOpen(true);
  };

  const toggleExportVolume = (id) => {
    setExportSelectedIds((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id],
    );
  };

  const copyExportToClipboard = async () => {
    const copied = await copyToClipboard(exportText);
    setResultNotice(copied ? "Export copied" : "Copy failed—try selecting the preview manually");
  };

  return (
    <div className="min-h-full pb-24">
      <AnimatePresence>
        {resultNotice && (
          <Motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed left-4 right-4 top-4 z-[120] flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-surface/95 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-md"
          >
            <Check size={16} className="text-emerald-400" /> {resultNotice}
          </Motion.div>
        )}
      </AnimatePresence>

      {viewMode === "list" ? (
        <Motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <header className="mb-4 rounded-2xl border border-white/10 bg-surface/60 p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <BookOpen size={13} /> Content studio
                </div>
                <h1 className="text-2xl font-bold text-white">Volumes</h1>
                <p className="mt-1 text-xs leading-5 text-text-secondary">Browse your archive or start a new entry.</p>
              </div>
              <button
                type="button"
                onClick={handleCreateNew}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 active:scale-95"
              >
                <Plus size={17} /> New
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-black/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-text-secondary">Total</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">{volumeStats.total}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/[0.07] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-emerald-300/70">Live</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-200">{volumeStats.published}</p>
              </div>
              <div className="rounded-xl bg-amber-500/[0.07] px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-amber-300/70">Drafts</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-amber-200">{volumeStats.drafts}</p>
              </div>
            </div>
          </header>

          <section className="mb-3 rounded-2xl border border-white/10 bg-surface/45 p-3">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search volumes"
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-primary/60"
              />
            </div>

            <div className="mt-3 flex gap-1 rounded-xl bg-black/20 p-1">
              {[
                ["all", "All"],
                ["published", "Published"],
                ["draft", "Drafts"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-medium transition ${
                    statusFilter === value ? "bg-primary text-white shadow" : "text-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <ListFilter size={15} className="ml-1 text-text-secondary" />
              <select
                value={sortKey}
                onChange={(event) => setSortKey(event.target.value)}
                className="min-h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-white outline-none"
                aria-label="Sort volumes by"
              >
                <option value="volume">Volume number</option>
                <option value="blessings">Blessing count</option>
                <option value="lines">Line count</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir((direction) => (direction === "asc" ? "desc" : "asc"))}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-text-secondary"
              >
                {sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {sortDir === "asc" ? "Asc" : "Desc"}
              </button>
            </div>
          </section>

          {error && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs text-red-200">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
                <X size={15} />
              </button>
            </div>
          )}

          <div className="space-y-2">
            {loading && (
              <div className="grid place-items-center rounded-2xl border border-white/10 bg-surface/35 py-14 text-sm text-text-secondary">
                <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                Loading archive…
              </div>
            )}

            {!loading && !sortedVolumes.length && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-surface/25 px-5 py-12 text-center">
                <BookOpen size={26} className="mx-auto mb-2 text-white/20" />
                <p className="text-sm font-semibold text-white">No volumes found</p>
                <p className="mt-1 text-xs text-text-secondary">Try another filter or create a new volume.</p>
              </div>
            )}

            {sortedVolumes.map((volume) => (
              <button
                key={volume._id}
                type="button"
                onClick={() => handleEditClick(volume)}
                className="w-full rounded-2xl border border-white/10 bg-surface/55 p-3.5 text-left shadow-sm transition active:scale-[0.99] active:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-primary/10 font-mono text-sm font-bold text-primary">
                    {volume.volumeNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-primary">Volume</p>
                        <h2 className="truncate text-sm font-semibold text-white">{volume.title || "Untitled volume"}</h2>
                      </div>
                      <StatusBadge status={volume.status} />
                    </div>

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles size={12} /> {volume.blessings?.length || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText size={12} /> {volume.bodyLines?.length || 0} lines
                      </span>
                      <ChevronRight size={16} className="ml-auto text-white/25" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={openExportModal}
            disabled={!volumes.length}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white disabled:opacity-40"
          >
            <Download size={16} /> Export volumes
          </button>
        </Motion.div>
      ) : (
        <Motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="pb-20">
          <header className="sticky top-0 z-30 -mx-1 mb-3 flex items-center gap-3 border-b border-white/10 bg-background/95 px-1 py-2 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-white/10 bg-surface text-white active:scale-95"
              aria-label="Back to volume list"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {editingId ? "Editing volume" : "New volume"}
              </p>
              <h1 className="truncate text-base font-semibold text-white">
                {editingId
                  ? `${formData.volumeNumber ? `Vol ${formData.volumeNumber}: ` : ""}${formData.title || "Untitled"}`
                  : "Create a new entry"}
              </h1>
            </div>
            {editingId && <StatusBadge status={formData.status} />}
          </header>

          {error && (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface/50 shadow-lg">
            <VolumeMobileForm
              formData={formData}
              onFormChange={setFormData}
              onSubmit={handleSubmit}
              loading={formLoading}
              submitButtonText={editingId ? "Update volume" : "Create volume"}
            />
          </div>

          {editingId && (
            <button
              type="button"
              onClick={handleDeleteVolume}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.06] text-sm font-medium text-red-300 active:scale-[0.99]"
            >
              <Trash2 size={16} /> Delete this volume
            </button>
          )}
        </Motion.div>
      )}

      <AnimatePresence>
        {exportOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end bg-black/80 backdrop-blur-sm"
            onClick={() => setExportOpen(false)}
          >
            <Motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              className="flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-white/10 bg-surface shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />
              <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 pb-4 pt-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Export volumes</h2>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {selectedExportVolumes.length} of {exportableVolumes.length} selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-text-secondary"
                  aria-label="Close export dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setExportSelectedIds(exportableVolumes.map((volume) => volume._id))}
                  className="min-h-9 flex-none rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setExportSelectedIds(
                      exportableVolumes.filter((volume) => volume.status === "published").map((volume) => volume._id),
                    )
                  }
                  className="min-h-9 flex-none rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white"
                >
                  Published only
                </button>
                <button
                  type="button"
                  onClick={() => setExportSelectedIds([])}
                  className="min-h-9 flex-none rounded-lg px-3 text-xs text-text-secondary"
                >
                  Clear
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {exportableVolumes.map((volume) => {
                  const checked = exportSelectedIds.includes(volume._id);
                  return (
                    <label
                      key={volume._id}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 transition ${
                        checked ? "border-primary/40 bg-primary/10" : "border-white/10 bg-black/10"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExportVolume(volume._id)}
                        className="h-5 w-5 accent-[var(--color-primary)]"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-white">
                        Vol {volume.volumeNumber}: {volume.title || "Untitled"}
                      </span>
                      <StatusBadge status={volume.status} />
                    </label>
                  );
                })}

                {!!selectedExportVolumes.length && (
                  <details className="rounded-xl border border-white/10 bg-black/15 p-3">
                    <summary className="cursor-pointer text-xs font-medium text-text-secondary">Preview raw text</summary>
                    <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-4 text-gray-300">
                      {exportText}
                    </pre>
                  </details>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 bg-surface/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={copyExportToClipboard}
                  disabled={!selectedExportVolumes.length}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white disabled:opacity-40"
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => downloadTxt(exportText, "volumes-export-mobile")}
                  disabled={!selectedExportVolumes.length}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-40"
                >
                  <Download size={16} /> Download
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VolumesMobilePage;
