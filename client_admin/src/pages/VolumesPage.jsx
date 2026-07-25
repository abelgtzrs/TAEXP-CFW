import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Heart,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import VolumeForm from "../components/volumes/VolumeForm";
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
  status: "published",
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
    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
      status === "published" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${status === "published" ? "bg-emerald-400" : "bg-amber-400"}`} />
    {status}
  </span>
);

const VolumesPage = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sortKey, setSortKey] = useState("volume");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [resultNotice, setResultNotice] = useState("");
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState([]);

  const fetchVolumes = async () => {
    try {
      setLoading(true);
      const data = await fetchAllVolumes();
      setVolumes(data);
      setError("");
    } catch {
      setError("We couldn't load your volumes. Try refreshing the page.");
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

  useEffect(() => {
    if (!catalogueOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setCatalogueOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [catalogueOpen]);

  const volumeStats = useMemo(
    () => ({
      total: volumes.length,
      published: volumes.filter((volume) => volume.status === "published").length,
      lines: volumes.reduce((total, volume) => total + (volume.bodyLines?.length || 0), 0),
      blessings: volumes.reduce((total, volume) => total + (volume.blessings?.length || 0), 0),
      editions: [...new Set(volumes.map((v) => v.edition).filter(Boolean))].length,
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

  const volumesByNumberAsc = useMemo(
    () => [...volumes].sort((a, b) => (Number(a.volumeNumber) || 0) - (Number(b.volumeNumber) || 0)),
    [volumes],
  );

  const currentIndex = useMemo(
    () => (editingId ? volumesByNumberAsc.findIndex((volume) => volume._id === editingId) : -1),
    [editingId, volumesByNumberAsc],
  );

  const previousVolume = currentIndex > 0 ? volumesByNumberAsc[currentIndex - 1] : null;
  const nextVolume =
    currentIndex >= 0 && currentIndex < volumesByNumberAsc.length - 1 ? volumesByNumberAsc[currentIndex + 1] : null;

  const exportableVolumes = useMemo(
    () => [...volumes].sort((a, b) => (Number(a.volumeNumber) || 0) - (Number(b.volumeNumber) || 0)),
    [volumes],
  );

  const selectedExportVolumes = useMemo(
    () => exportableVolumes.filter((volume) => exportSelectedIds.includes(volume._id)),
    [exportableVolumes, exportSelectedIds],
  );

  const exportText = useMemo(() => buildExportText(selectedExportVolumes), [selectedExportVolumes]);

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    setCatalogueOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditClick = (volume) => {
    setEditingId(volume._id);
    setFormData(toFormData(volume));
    setCatalogueOpen(false);
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
        setResultNotice(`Volume ${formData.volumeNumber || ""} updated`);
      } else {
        await createVolume(payload);
        resetForm();
        await fetchVolumes();
        setResultNotice("Volume created");
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We couldn't save this volume.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVolume = async (volumeId) => {
    if (!window.confirm("Permanently delete this volume? This cannot be undone.")) return;

    try {
      await removeVolume(volumeId);
      if (editingId === volumeId) {
        setEditingId(null);
        setFormData(INITIAL_FORM_STATE);
      }
      await fetchVolumes();
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
    setResultNotice(copied ? "Export copied to clipboard" : "Copy failed—select the preview and copy it manually");
  };

  return (
    <div className="flex h-[calc(100dvh-48px-var(--bottom-nav-height)-1.5rem)] min-h-0 flex-col overflow-hidden">
      <AnimatePresence>
        {resultNotice && (
          <Motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed left-1/2 top-16 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/40 bg-surface/95 px-4 py-2 text-sm text-white shadow-2xl backdrop-blur-md"
          >
            <Check size={15} className="text-emerald-400" />
            {resultNotice}
          </Motion.div>
        )}
      </AnimatePresence>

      <Motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex flex-none items-center justify-between gap-2 rounded-xl border border-white/10 bg-surface/55 px-3 py-2 shadow-xl backdrop-blur-md"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={13} className="flex-none text-primary" />
          <h1 className="text-sm font-bold tracking-tight text-white">Volume Manager</h1>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={openExportModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:border-primary/40 hover:bg-primary/10"
          >
            <Download size={13} /> Export
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
          >
            <Plus size={14} /> New volume
          </button>
        </div>
      </Motion.header>

      <div className="relative z-[60] mb-2 flex flex-none items-center justify-between gap-2">

        <div className="flex flex-none items-center gap-1 rounded-xl border border-white/10 bg-surface/45 px-2 py-1">
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-2">
            <Archive size={11} className="text-primary" />
            <span className="text-[10px] text-text-secondary">Total</span>
            <span className="text-xs font-semibold tabular-nums text-white">{volumeStats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 border-r border-white/10 px-2">
            <Check size={11} className="text-primary" />
            <span className="text-[10px] text-text-secondary">Published</span>
            <span className="text-xs font-semibold tabular-nums text-white">{volumeStats.published}</span>
          </div>
          <div className="flex items-center gap-1.5 border-r border-white/10 px-2">
            <Sparkles size={11} className="text-primary" />
            <span className="text-[10px] text-text-secondary">Lines</span>
            <span className="text-xs font-semibold tabular-nums text-white">{volumeStats.lines.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 border-r border-white/10 px-2">
            <Heart size={11} className="text-primary" />
            <span className="text-[10px] text-text-secondary">Blessings</span>
            <span className="text-xs font-semibold tabular-nums text-white">{volumeStats.blessings.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2">
            <BookOpen size={11} className="text-primary" />
            <span className="text-[10px] text-text-secondary">Editions</span>
            <span className="text-xs font-semibold tabular-nums text-white">{volumeStats.editions}</span>
          </div>
        </div>

        {error && (
          <div className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
              <X size={14} />
            </button>
          </div>
        )}

        <div className="relative flex flex-none">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface/70 px-1.5 py-1 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setCatalogueOpen((open) => !open)}
            aria-expanded={catalogueOpen}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/5"
          >
            <div className="flex h-8 w-10 flex-none flex-col items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              {editingId ? (
                <>
                  <span className="text-[7px] font-bold uppercase tracking-[0.14em]">Vol</span>
                  <span className="text-xs font-bold leading-3 tabular-nums">{formData.volumeNumber || "—"}</span>
                </>
              ) : (
                <Plus size={14} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-primary">Catalogue</span>
                {editingId && <StatusBadge status={formData.status} />}
              </div>
              <p className="truncate text-xs font-semibold text-white">
                {editingId
                  ? `${formData.volumeNumber ? `Vol ${formData.volumeNumber}: ` : ""}${formData.title || "Untitled"}`
                  : "New volume"}
              </p>
            </div>
            <ChevronDown size={14} className={`flex-none text-text-secondary transition ${catalogueOpen ? "rotate-180" : ""}`} />
          </button>

          <div className="hidden items-center gap-1 border-l border-white/10 pl-1.5 sm:flex">
            <span className="mr-0.5 min-w-10 text-center text-[10px] tabular-nums text-text-secondary">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${volumesByNumberAsc.length}` : `${volumesByNumberAsc.length} total`}
            </span>
            <button
              type="button"
              onClick={() => previousVolume && handleEditClick(previousVolume)}
              disabled={!previousVolume}
              className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/5 text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              title={previousVolume ? `Previous: volume ${previousVolume.volumeNumber}` : "No previous volume"}
            >
              <ChevronLeft size={13} />
            </button>
            <button
              type="button"
              onClick={() => nextVolume && handleEditClick(nextVolume)}
              disabled={!nextVolume}
              className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/5 text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              title={nextVolume ? `Next: volume ${nextVolume.volumeNumber}` : "No next volume"}
            >
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="ml-0.5 inline-flex h-7 items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 text-[11px] font-medium text-primary transition hover:bg-primary/20"
            >
              <Plus size={11} /> New
            </button>
          </div>
        </div>

        <AnimatePresence>
          {catalogueOpen && (
            <>
              <Motion.button
                type="button"
                aria-label="Close catalogue"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCatalogueOpen(false)}
                className="fixed inset-0 z-[61] cursor-default bg-black/35"
              />
              <Motion.section
                initial={{ opacity: 0, y: -8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] flex w-[36rem] max-w-[90vw] max-h-[calc(100dvh-15rem-var(--bottom-nav-height))] flex-col overflow-hidden rounded-2xl border border-primary/30 bg-surface/95 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex flex-col gap-3 border-b border-white/10 p-3 lg:flex-row lg:items-center">
                  <div className="flex items-center justify-between gap-3 lg:min-w-48">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Volume catalogue</h2>
                      <p className="text-[11px] text-text-secondary">{sortedVolumes.length} shown</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white lg:hidden"
                    >
                      <Plus size={14} /> New
                    </button>
                  </div>

                  <div className="relative min-w-0 flex-1">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="search"
                      autoFocus
                      placeholder="Search titles, story text, or blessings"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-primary/60"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1 rounded-xl bg-black/20 p-1 lg:flex-none">
                      {[
                        ["all", "All"],
                        ["published", "Published"],
                        ["draft", "Drafts"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setStatusFilter(value)}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                            statusFilter === value ? "bg-primary text-white shadow" : "text-text-secondary hover:text-white"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <select
                      value={sortKey}
                      onChange={(event) => setSortKey(event.target.value)}
                      className="h-10 min-w-0 rounded-xl border border-white/10 bg-black/20 px-2.5 text-xs text-white outline-none focus:border-primary/60"
                      aria-label="Sort volumes by"
                    >
                      <option value="volume">Volume #</option>
                      <option value="blessings">Blessings</option>
                      <option value="lines">Lines</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortDir((direction) => (direction === "asc" ? "desc" : "asc"))}
                      className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-white/10 bg-black/20 text-text-secondary transition hover:text-white"
                      title={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
                    >
                      {sortDir === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {loading && (
                    <div className="grid place-items-center py-14 text-sm text-text-secondary">
                      <div className="mb-2 h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                      Loading catalogue...
                    </div>
                  )}

                  {!loading && sortedVolumes.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">
                      <Archive size={24} className="mx-auto mb-2 text-white/25" />
                      <p className="text-sm font-medium text-white">No volumes found</p>
                      <p className="mt-1 text-xs text-text-secondary">Try a different search or filter.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-1.5">
                    {sortedVolumes.map((volume) => {
                      const selected = volume._id === editingId;
                      const excerpt = volume.bodyLines?.slice(0, 2).join(" ") || "No story lines yet.";
                      return (
                        <div
                          key={volume._id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleEditClick(volume)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") handleEditClick(volume);
                          }}
                          className={`group min-w-0 rounded-xl border px-3 py-2 text-left transition ${
                            selected
                              ? "border-primary/60 bg-primary/10 shadow-[inset_3px_0_0_var(--color-primary)]"
                              : "border-white/10 bg-black/10 hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex min-h-12 items-center gap-3">
                            <div className="flex h-11 w-14 flex-none flex-col items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                              <span className="text-[8px] font-bold uppercase tracking-[0.16em]">Vol</span>
                              <span className="text-base font-bold leading-4 tabular-nums">{volume.volumeNumber}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="break-words text-sm font-semibold leading-5 text-white">
                                {volume.title || "Untitled volume"}
                              </h3>
                              <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[10px] text-text-secondary">
                                {volume.edition && <span className="flex-none">{volume.edition}</span>}
                                {volume.edition && <span className="text-white/15">•</span>}
                                <span className="line-clamp-1 min-w-0">{excerpt}</span>
                              </div>
                            </div>
                            <div className="hidden flex-none items-center gap-1.5 text-[10px] text-text-secondary md:flex">
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1">
                                <Sparkles size={11} /> {volume.blessings?.length || 0}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1">
                                <FileText size={11} /> {volume.bodyLines?.length || 0}
                              </span>
                            </div>
                            <div className="hidden w-24 flex-none text-right lg:block">
                              <StatusBadge status={volume.status} />
                              <p className={`mt-1 text-[10px] ${selected ? "text-primary" : "text-text-secondary"}`}>
                                {selected ? "Editing now" : new Date(volume.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteVolume(volume._id);
                              }}
                              className="rounded-md p-1.5 text-white/25 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 focus:opacity-100"
                              aria-label={`Delete volume ${volume.volumeNumber}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Motion.section>
            </>
          )}
        </AnimatePresence>
        </div>
      </div>

      <div className="min-h-0 flex-1">

        <Motion.main
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/65 shadow-xl"
        >
          <div className="flex flex-none flex-col gap-3 border-b border-white/10 bg-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                {editingId ? "Editing volume" : "New volume"}
              </p>
              <h2 className="whitespace-normal break-words text-lg font-semibold leading-6 text-white">
                {editingId
                  ? `${formData.volumeNumber ? `Vol ${formData.volumeNumber}: ` : ""}${formData.title || "Untitled"}`
                  : "Build your next entry"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-text-secondary transition hover:text-white"
                >
                  Cancel edit
                </button>
              )}
              <button
                type="submit"
                form="volume-form"
                disabled={formLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-50"
              >
                <Check size={13} />
                {editingId ? "Save changes" : "Create volume"}
              </button>
            </div>
          </div>

          <VolumeForm
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleSubmit}
            loading={formLoading}
            submitButtonText={editingId ? "Update volume" : "Create volume"}
          />
        </Motion.main>
      </div>

      <AnimatePresence>
        {exportOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm md:items-center md:p-4"
            onClick={() => setExportOpen(false)}
          >
            <Motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-surface shadow-2xl md:h-auto md:max-h-[88dvh] md:rounded-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Download size={18} className="text-primary" />
                    <h3 className="text-lg font-semibold text-white">Export volumes</h3>
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">
                    Choose entries, review the raw text, then copy or download it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExportOpen(false)}
                  className="rounded-lg border border-white/10 p-2 text-text-secondary transition hover:bg-white/5 hover:text-white"
                  aria-label="Close export dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setExportSelectedIds(exportableVolumes.map((volume) => volume._id))}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
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
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                >
                  Published only
                </button>
                <button
                  type="button"
                  onClick={() => setExportSelectedIds([])}
                  className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-white"
                >
                  Clear
                </button>
                <span className="ml-auto text-xs tabular-nums text-text-secondary">
                  {selectedExportVolumes.length} of {exportableVolumes.length} selected
                </span>
              </div>

              <div className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 md:grid-cols-[0.85fr_1.15fr] sm:p-4">
                <div className="min-h-0 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-2">
                  {exportableVolumes.map((volume) => {
                    const checked = exportSelectedIds.includes(volume._id);
                    return (
                      <label
                        key={volume._id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                          checked ? "border-primary/40 bg-primary/10" : "border-transparent hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExportVolume(volume._id)}
                          className="h-4 w-4 accent-[var(--color-primary)]"
                        />
                        <span className="min-w-0 flex-1 truncate text-sm text-white">
                          Vol {volume.volumeNumber}: {volume.title || "Untitled"}
                        </span>
                        <StatusBadge status={volume.status} />
                      </label>
                    );
                  })}
                </div>

                <div className="hidden min-h-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/25 md:flex">
                  <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
                    Raw text preview
                  </div>
                  <textarea
                    readOnly
                    value={exportText}
                    className="min-h-[360px] flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-5 text-gray-200 outline-none"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 bg-black/10 p-3 sm:justify-end sm:px-5">
                <button
                  type="button"
                  onClick={copyExportToClipboard}
                  disabled={!selectedExportVolumes.length}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  <Copy size={15} /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => downloadTxt(exportText, "volumes-export")}
                  disabled={!selectedExportVolumes.length}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  <Download size={15} /> Download .txt
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VolumesPage;
