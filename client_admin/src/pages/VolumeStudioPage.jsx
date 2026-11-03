import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  Keyboard,
  Library,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Scissors,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import VolumeExportModal from "../components/volumes/VolumeExportModal";
import { listBlessingDefs } from "../services/blessingsService";
import { splitBlessingName } from "../utils/blessingSplit";
import { parseRawGreentext } from "../utils/greentextParser";
import { emitToast } from "../utils/toastBus";
import { highlightQuery, searchVolumes } from "../utils/volumeSearch";
import { formatRelativeDay } from "../utils/workoutStats";
import { toFormData, toPayload } from "./volumeFunctionality/formMappers";
import { createVolume, deleteVolume, fetchVolumes, updateVolume } from "./volumeFunctionality/volumeApi";

const EMPTY_FORM = {
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

const EMPTY_BLESSING = { item: "", description: "", context: "" };

const PREFS_KEY = "volumeStudioPrefsV1";
const readPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {};
  } catch {
    return {};
  }
};

const SHORTCUTS = [
  [["Ctrl", "S"], "Save or create"],
  [["Alt", "↑"], "Previous volume"],
  [["Alt", "↓"], "Next volume"],
  [["Alt", "N"], "New volume"],
  [["Ctrl", "."], "Focus mode"],
  [["/"], "Search volumes"],
  [["Enter"], "Open the first search result"],
  [["?"], "Show or hide shortcuts"],
];

const Field = ({ label, className = "", children }) => (
  <label className={`block min-w-0 ${className}`}>
    <span className="studio-label">{label}</span>
    {children}
  </label>
);

const iconBtn =
  "grid h-6 w-6 flex-none place-items-center rounded text-text-secondary transition hover:bg-white/5 hover:text-text-main disabled:opacity-25";

const countWords = (text) => (text || "").trim().split(/\s+/).filter(Boolean).length;

// Single-screen volume editor: list, editor and blessings side by side, each scrolling on its own.
const VolumeStudioPage = () => {
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [baseline, setBaseline] = useState(JSON.stringify(EMPTY_FORM));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [caret, setCaret] = useState(null); // { line, col } while the body has focus
  const [query, setQuery] = useState("");
  const [initialPrefs] = useState(readPrefs);
  const [statusFilter, setStatusFilter] = useState(initialPrefs.statusFilter || "all");
  const [sortKey, setSortKey] = useState(initialPrefs.sortKey || "volume");
  const [sortDir, setSortDir] = useState(initialPrefs.sortDir || "desc");
  const [focusMode, setFocusMode] = useState(Boolean(initialPrefs.focusMode));
  const [helpOpen, setHelpOpen] = useState(false);
  const [removed, setRemoved] = useState(null); // last removed blessing, for undo
  const [dragIndex, setDragIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const [storyTab, setStoryTab] = useState("raw");
  const [pane, setPane] = useState("list"); // which panel shows below lg
  const [exportOpen, setExportOpen] = useState(false);
  const [masterBlessings, setMasterBlessings] = useState([]);
  const [masterError, setMasterError] = useState("");
  const blessingListRef = useRef(null);
  const volumeListRef = useRef(null);
  const searchRef = useRef(null);
  const keyHandler = useRef(null);

  const dirty = JSON.stringify(form) !== baseline;

  useEffect(() => {
    fetchVolumes()
      .then((list) => {
        setVolumes(list);
        const last = list.find((volume) => volume._id === readPrefs().lastId);
        if (!last) return;
        const lastForm = toFormData(last);
        setEditingId(last._id);
        setForm(lastForm);
        setBaseline(JSON.stringify(lastForm));
        setStoryTab("story");
        setPane("editor");
      })
      .catch(() => setError("Volumes didn't load. Refresh the page to try again."))
      .finally(() => setLoading(false));
    listBlessingDefs()
      .then((definitions) => setMasterBlessings(Array.isArray(definitions) ? definitions : []))
      .catch(() => setMasterError("The master blessing library didn't load."));
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${dirty ? "• " : ""}Volume Studio`;
    return () => {
      document.title = previousTitle;
    };
  }, [dirty]);

  useEffect(() => {
    if (loading) return; // don't overwrite the saved last volume before it's been restored
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ lastId: editingId, statusFilter, sortKey, sortDir, focusMode }));
    } catch {
      // Storage can be unavailable (private mode); preferences are a convenience only.
    }
  }, [loading, editingId, statusFilter, sortKey, sortDir, focusMode]);

  useEffect(() => {
    volumeListRef.current?.querySelector("[aria-current]")?.scrollIntoView({ block: "nearest" });
  }, [editingId]);

  useEffect(() => {
    if (!removed) return undefined;
    const timer = setTimeout(() => setRemoved(null), 6000);
    return () => clearTimeout(timer);
  }, [removed]);

  // One window listener that always calls the latest handler, so shortcuts work outside inputs too.
  useEffect(() => {
    const onKey = (event) => keyHandler.current?.(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stats = useMemo(
    () => [
      ["Volumes", volumes.length],
      ["Published", volumes.filter((volume) => volume.status === "published").length],
      ["Lines", volumes.reduce((total, volume) => total + (volume.bodyLines?.length || 0), 0)],
      ["Blessings", volumes.reduce((total, volume) => total + (volume.blessings?.length || 0), 0)],
    ],
    [volumes],
  );

  const searchResults = useMemo(() => (query.trim() ? searchVolumes(volumes, query) : null), [volumes, query]);
  const excerptById = useMemo(
    () =>
      Object.fromEntries(
        (searchResults || []).map((result) => [
          result.volume._id,
          result.matches.find((match) => match.field !== "title")?.excerpt,
        ]),
      ),
    [searchResults],
  );

  const shownVolumes = useMemo(() => {
    let list = searchResults ? searchResults.map((result) => result.volume) : [...volumes];
    if (statusFilter !== "all") list = list.filter((volume) => volume.status === statusFilter);
    const value = (volume) =>
      sortKey === "blessings"
        ? volume.blessings?.length || 0
        : sortKey === "lines"
          ? volume.bodyLines?.length || 0
          : Number(volume.volumeNumber) || 0;
    return list.sort((a, b) => (sortDir === "asc" ? value(a) - value(b) : value(b) - value(a)));
  }, [volumes, searchResults, statusFilter, sortKey, sortDir]);

  const volumesAsc = useMemo(
    () => [...volumes].sort((a, b) => (Number(a.volumeNumber) || 0) - (Number(b.volumeNumber) || 0)),
    [volumes],
  );
  const currentIndex = editingId ? volumesAsc.findIndex((volume) => volume._id === editingId) : -1;
  const previousVolume = currentIndex > 0 ? volumesAsc[currentIndex - 1] : null;
  const nextVolume = currentIndex >= 0 ? volumesAsc[currentIndex + 1] || null : null;

  const currentVolume = editingId ? volumes.find((volume) => volume._id === editingId) : null;
  const numberConflict =
    String(form.volumeNumber ?? "") !== ""
      ? volumes.find(
          (volume) => volume._id !== editingId && String(volume.volumeNumber) === String(form.volumeNumber),
        )
      : null;

  const blessings = Array.isArray(form.blessings) ? form.blessings : [];
  const nameCounts = blessings.reduce((counts, blessing) => {
    const key = blessing?.item?.trim().toLowerCase();
    if (key) counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const isDuplicate = (blessing) => nameCounts[blessing?.item?.trim().toLowerCase()] > 1;
  const duplicateCount = Object.values(nameCounts).filter((count) => count > 1).length;
  const usedNames = new Set(blessings.map((blessing) => blessing?.item?.trim().toLowerCase()).filter(Boolean));
  const missingFromMaster = masterBlessings
    .filter((definition) => definition?.active !== false)
    .filter((definition) => !usedNames.has(String(definition?.name || "").trim().toLowerCase()));

  const parsed = useMemo(
    () => (storyTab === "raw" ? parseRawGreentext(form.rawPastedText || "") : null),
    [storyTab, form.rawPastedText],
  );
  const bodyLineCount = (form.bodyText || "").split("\n").filter(Boolean).length;
  const wordCount = countWords(form.bodyText);

  const highlight = (text) =>
    highlightQuery(text, query.trim()).map((part, i) =>
      part.hit ? (
        <mark key={i} className="rounded-sm bg-primary/25 text-text-main">
          {part.text}
        </mark>
      ) : (
        part.text
      ),
    );

  const loadForm = (id, nextForm) => {
    setEditingId(id);
    setForm(nextForm);
    setBaseline(JSON.stringify(nextForm));
    setSavedAt(null);
    setRemoved(null);
  };

  const confirmDiscard = () => !dirty || window.confirm("You have unsaved changes. Discard them?");

  const selectVolume = (volume) => {
    if (volume._id !== editingId) {
      if (!confirmDiscard()) return;
      loadForm(volume._id, toFormData(volume));
      setStoryTab("story");
    }
    setPane("editor");
  };

  const startNew = () => {
    if (!confirmDiscard()) return;
    loadForm(null, EMPTY_FORM);
    setStoryTab("raw");
    setPane("editor");
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form);
      if (editingId) await updateVolume(editingId, payload);
      else await createVolume(payload);
      const latest = await fetchVolumes();
      setVolumes(latest);
      // The create endpoint returns nothing we use, so find the new volume by its number and title.
      const saved = editingId
        ? latest.find((volume) => volume._id === editingId)
        : latest.find((volume) => volume.volumeNumber === payload.volumeNumber && volume.title === payload.title);
      if (saved) loadForm(saved._id, toFormData(saved));
      else loadForm(null, EMPTY_FORM);
      setSavedAt(new Date());
      emitToast({ title: editingId ? "Volume saved" : "Volume created", message: payload.title || "", type: "success" });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "The volume wasn't saved. Check your connection and save again.");
    } finally {
      setSaving(false);
    }
  };

  const removeCurrent = async () => {
    if (!editingId || !window.confirm("Permanently delete this volume? This cannot be undone.")) return;
    try {
      await deleteVolume(editingId);
      setVolumes((current) => current.filter((volume) => volume._id !== editingId));
      loadForm(null, EMPTY_FORM);
      setStoryTab("raw");
      emitToast({ title: "Volume deleted", type: "success" });
    } catch {
      setError("The volume wasn't deleted. Try again.");
    }
  };

  const setField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const setBlessings = (update) =>
    setForm((current) => ({ ...current, blessings: update(Array.isArray(current.blessings) ? current.blessings : []) }));

  const updateBlessing = (index, field, value) =>
    setBlessings((list) => list.map((b, i) => (i === index ? { ...EMPTY_BLESSING, ...b, [field]: value } : b)));
  const splitBlessing = (index) =>
    setBlessings((list) =>
      list.map((b, i) => (i === index ? { ...splitBlessingName(b?.item), context: b?.context || "" } : b)),
    );
  const splitAllBlessings = () =>
    setBlessings((list) =>
      list.map((b) => {
        const split = splitBlessingName(b?.item);
        return { item: split.item, description: b?.description || split.description, context: b?.context || "" };
      }),
    );
  const moveBlessing = (index, direction) =>
    setBlessings((list) => {
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  const removeBlessing = (index) => {
    setRemoved({ blessing: blessings[index], index });
    setBlessings((list) => list.filter((_, i) => i !== index));
  };
  const undoRemove = () => {
    setBlessings((list) => {
      const next = [...list];
      next.splice(Math.min(removed.index, next.length), 0, removed.blessing);
      return next;
    });
    setRemoved(null);
  };
  const moveBlessingTo = (from, to) =>
    setBlessings((list) => {
      if (from === to) return list;
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  const endDrag = () => {
    setDragIndex(null);
    setDropIndex(null);
  };
  const addBlessing = () => {
    setBlessings((list) => [...list, { ...EMPTY_BLESSING }]);
    // Focus the new row once it renders; focusing also scrolls it into view.
    requestAnimationFrame(() => blessingListRef.current?.lastElementChild?.querySelector("input")?.focus());
  };
  const masterToBlessing = (definition) => ({
    item: String(definition?.name || "").trim(),
    description: definition?.defaultDescription || "",
    context: definition?.context || "",
  });

  const applyParsed = () => {
    const result = parseRawGreentext(form.rawPastedText || "");
    setForm((current) => ({
      ...current,
      volumeNumber: result.volumeNumber ?? "",
      title: result.title ?? "",
      bodyText: (result.bodyLines || []).join("\n"),
      blessingIntro: result.blessingIntro ?? "",
      blessings: result.blessings || [],
      dream: result.dream ?? "",
      edition: result.edition ?? "",
    }));
    setStoryTab("story");
  };

  const trackCaret = (event) => {
    const lines = event.target.value.slice(0, event.target.selectionStart).split("\n");
    setCaret({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  const focusSearch = () => {
    setFocusMode(false);
    setPane("list");
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  useEffect(() => {
    keyHandler.current = (event) => {
      if (exportOpen) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = (event.key || "").toLowerCase(); // autofill fires keydown without a key
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (mod && key === "s") {
        event.preventDefault();
        if (dirty || !editingId) save();
      } else if (mod && key === ".") {
        event.preventDefault();
        setFocusMode((on) => !on);
      } else if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        const target = event.key === "ArrowUp" ? previousVolume : nextVolume;
        if (target) selectVolume(target);
      } else if (event.altKey && key === "n") {
        event.preventDefault();
        startNew();
      } else if (event.key === "Escape" && helpOpen) {
        setHelpOpen(false);
      } else if (!typing && !mod && event.key === "/") {
        event.preventDefault();
        focusSearch();
      } else if (!typing && event.key === "?") {
        setHelpOpen((open) => !open);
      }
    };
  });

  const panel = (id) =>
    `studio-panel ${pane === id ? "flex" : "hidden"} min-h-0 min-w-0 flex-col overflow-hidden ${
      focusMode && id !== "editor" ? "lg:hidden" : "lg:flex"
    }`;

  const saveState = saving
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : savedAt
        ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
        : editingId
          ? "No changes"
          : "Not created yet";

  return (
    <div
      className="studio flex h-[calc(100dvh-48px-var(--bottom-nav-height)-1.5rem)] min-h-0 flex-col gap-2.5 overflow-hidden sm:h-[calc(100dvh-48px-var(--bottom-nav-height)-2.5rem)] lg:h-[calc(100dvh-48px-var(--bottom-nav-height)-3.5rem)]"
    >
      <header className="flex flex-none items-center gap-4">
        <h1 className="studio-serif text-xl leading-none text-text-main">Volume Studio</h1>
        <dl className="mr-auto hidden items-center divide-x divide-white/10 md:flex">
          {stats.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-1.5 px-3 first:pl-0">
              <dd className="text-[13px] font-semibold tabular-nums text-text-main">{value.toLocaleString()}</dd>
              <dt className="text-[11px] text-text-secondary">{label}</dt>
            </div>
          ))}
        </dl>
        <span className="mr-auto md:hidden" />
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          className="dash-btn dash-btn-icon hidden sm:inline-flex"
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Keyboard size={13} />
        </button>
        <button type="button" onClick={() => setExportOpen(true)} disabled={!volumes.length} className="dash-btn">
          <Download size={13} aria-hidden="true" /> Export
        </button>
        <button type="button" onClick={startNew} className="dash-btn dash-btn-primary">
          <Plus size={13} aria-hidden="true" /> New volume
        </button>
      </header>

      <div className="dash-segment flex flex-none lg:hidden" role="group" aria-label="Panel">
        {[
          ["list", `Volumes (${volumes.length})`],
          ["editor", "Editor"],
          ["blessings", `Blessings (${blessings.length})`],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setPane(id)} className={pane === id ? "is-active" : ""}>
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-none items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200"
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            <X size={14} />
          </button>
        </div>
      )}

      <div
        className={`grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-2.5 ${
          focusMode
            ? "lg:grid-cols-[minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)_340px] xl:grid-cols-[290px_minmax(0,1fr)_380px]"
        }`}
      >
        {/* Volume list */}
        <section className={panel("list")} aria-label="Volumes">
          <div className="studio-head">
            <div className="relative flex-1">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && shownVolumes[0]) selectVolume(shownVolumes[0]);
                  if (event.key === "Escape") {
                    if (query) setQuery("");
                    else event.currentTarget.blur();
                  }
                }}
                placeholder="Search titles, story, blessings"
                aria-label="Search volumes"
                className="dash-input w-full !pl-8"
              />
            </div>
          </div>
          <div className="flex flex-none items-center gap-1.5 border-b border-white/[0.06] px-2 py-1.5">
            <div className="dash-segment flex-1" role="group" aria-label="Status filter">
              {[
                ["all", "All"],
                ["published", "Published"],
                ["draft", "Drafts"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  aria-pressed={statusFilter === value}
                  className={statusFilter === value ? "is-active" : ""}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value)}
              aria-label="Sort volumes by"
              className="dash-input !min-h-[28px] !py-0.5"
            >
              <option value="volume">Number</option>
              <option value="blessings">Blessings</option>
              <option value="lines">Lines</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((direction) => (direction === "asc" ? "desc" : "asc"))}
              className="dash-btn dash-btn-icon"
              title={sortDir === "asc" ? "Lowest first" : "Highest first"}
              aria-label={sortDir === "asc" ? "Sorted lowest first" : "Sorted highest first"}
            >
              {sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            </button>
          </div>

          <ul ref={volumeListRef} className="min-h-0 flex-1 overflow-y-auto py-1">
            {loading &&
              Array.from({ length: 8 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="skeleton-shimmer h-3 w-7 rounded" />
                  <span className="skeleton-shimmer h-3 flex-1 rounded" />
                </li>
              ))}
            {!loading && shownVolumes.length === 0 && (
              <li className="dash-empty m-2">
                {volumes.length ? "Nothing matches. Clear the search or filter." : "No volumes yet. Start one with New volume."}
              </li>
            )}
            {shownVolumes.map((volume) => {
              const selected = volume._id === editingId;
              return (
                <li key={volume._id}>
                  <button
                    type="button"
                    onClick={() => selectVolume(volume)}
                    aria-current={selected || undefined}
                    className={`flex w-full items-start gap-3 px-3 py-2 text-left transition ${
                      selected
                        ? "bg-primary/[0.08] shadow-[inset_2px_0_0_var(--color-primary)]"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`w-8 flex-none pt-px text-right text-xs tabular-nums ${
                        selected ? "text-primary" : "text-text-secondary"
                      }`}
                    >
                      {volume.volumeNumber ?? "–"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="studio-serif block truncate text-[14px] leading-5 text-text-main">
                        {searchResults ? highlight(volume.title || "Untitled") : volume.title || "Untitled"}
                      </span>
                      {excerptById[volume._id] ? (
                        <span className="block truncate text-[10.5px] text-text-secondary">
                          {highlight(excerptById[volume._id])}
                        </span>
                      ) : (
                        <span className="block truncate text-[10.5px] tabular-nums text-text-secondary">
                          {volume.bodyLines?.length || 0} lines, {volume.blessings?.length || 0} blessings
                          {volume.edition ? `, ${volume.edition}` : ""}
                        </span>
                      )}
                    </span>
                    {selected && dirty ? (
                      <span
                        title="Unsaved changes"
                        className="mt-1 h-2 w-2 flex-none rounded-full border-2 border-amber-300"
                      />
                    ) : (
                      <span
                        title={volume.status === "published" ? "Published" : "Draft"}
                        className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${
                          volume.status === "published" ? "bg-emerald-400" : "bg-amber-400"
                        }`}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="flex flex-none items-center gap-3 border-t border-white/[0.06] px-3 py-1.5 text-[10px] tabular-nums text-text-secondary">
            <span className="mr-auto">
              {shownVolumes.length} of {volumes.length}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Published
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Draft
            </span>
          </p>
        </section>

        {/* Editor */}
        <section className={panel("editor")} aria-label="Editor">
          <div className="studio-head">
            <div className="dash-segment mr-auto" role="group" aria-label="Editor view">
              <button
                type="button"
                onClick={() => setStoryTab("story")}
                className={storyTab === "story" ? "is-active" : ""}
              >
                Story
              </button>
              <button type="button" onClick={() => setStoryTab("raw")} className={storyTab === "raw" ? "is-active" : ""}>
                Raw import
              </button>
            </div>
            {editingId && (
              <>
                <button
                  type="button"
                  onClick={() => previousVolume && selectVolume(previousVolume)}
                  disabled={!previousVolume}
                  className="dash-btn dash-btn-icon"
                  title={previousVolume ? `Previous: volume ${previousVolume.volumeNumber}` : "This is the first volume"}
                  aria-label="Previous volume"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="hidden min-w-12 text-center text-[10px] tabular-nums text-text-secondary sm:inline">
                  {currentIndex + 1} of {volumesAsc.length}
                </span>
                <button
                  type="button"
                  onClick={() => nextVolume && selectVolume(nextVolume)}
                  disabled={!nextVolume}
                  className="dash-btn dash-btn-icon"
                  title={nextVolume ? `Next: volume ${nextVolume.volumeNumber}` : "This is the last volume"}
                  aria-label="Next volume"
                >
                  <ChevronRight size={13} />
                </button>
                <span className="mx-1 h-4 w-px bg-white/10" aria-hidden="true" />
                <button
                  type="button"
                  onClick={removeCurrent}
                  className="dash-btn dash-btn-icon dash-btn-danger"
                  title="Delete volume"
                  aria-label="Delete volume"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setFocusMode((on) => !on)}
              className="dash-btn dash-btn-icon hidden lg:inline-flex"
              title={focusMode ? "Show all columns (Ctrl+.)" : "Focus mode (Ctrl+.)"}
              aria-label={focusMode ? "Show all columns" : "Focus mode"}
              aria-pressed={focusMode}
            >
              {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            {dirty && (
              <button type="button" onClick={() => setForm(JSON.parse(baseline))} className="dash-btn" title="Discard unsaved changes">
                <RotateCcw size={13} aria-hidden="true" /> Revert
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || (Boolean(editingId) && !dirty)}
              className="dash-btn studio-save"
              title="Save (Ctrl+S)"
            >
              {saving ? "Saving…" : editingId ? "Save" : "Create volume"}
            </button>
          </div>

          <div className="flex-none space-y-3 border-b border-white/[0.06] px-5 pb-4 pt-4">
            <input
              name="title"
              value={form.title || ""}
              onChange={setField}
              placeholder="Untitled volume"
              aria-label="Title"
              className="studio-serif w-full bg-transparent text-[26px] leading-tight text-text-main outline-none placeholder:text-text-secondary/40"
            />
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Number" className="w-20 flex-none">
                <input
                  type="number"
                  name="volumeNumber"
                  value={form.volumeNumber ?? ""}
                  onChange={setField}
                  placeholder="42"
                  aria-invalid={Boolean(numberConflict)}
                  className={`dash-input w-full tabular-nums ${numberConflict ? "!border-amber-400/60" : ""}`}
                />
              </Field>
              <Field label="Edition" className="min-w-[8rem] flex-1">
                <input
                  name="edition"
                  value={form.edition || ""}
                  onChange={setField}
                  placeholder="Optional"
                  className="dash-input w-full"
                />
              </Field>
              <div>
                <span className="studio-label">Visibility</span>
                <div className="dash-segment" role="group" aria-label="Visibility">
                  {[
                    ["draft", "Draft"],
                    ["published", "Published"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, status: value }))}
                      aria-pressed={form.status === value}
                      className={form.status === value ? "is-active" : ""}
                      title={value === "published" ? "Shown in the public viewer" : "Only admins can see it"}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {numberConflict && (
              <p className="text-[11px] text-amber-300">
                Volume {numberConflict.volumeNumber} already exists as “{numberConflict.title || "Untitled"}”.{" "}
                <button
                  type="button"
                  onClick={() => selectVolume(numberConflict)}
                  className="underline underline-offset-2 hover:text-amber-200"
                >
                  Open it
                </button>
              </p>
            )}
          </div>

          {storyTab === "story" ? (
            <div className="flex min-h-0 flex-1 flex-col bg-black/[0.12]">
              <textarea
                name="bodyText"
                value={form.bodyText || ""}
                onChange={setField}
                onSelect={trackCaret}
                onBlur={() => setCaret(null)}
                placeholder="Begin the volume…"
                aria-label="Story"
                spellCheck={false}
                className="studio-serif mx-auto block min-h-[6rem] w-full max-w-[72ch] flex-1 resize-none bg-transparent px-5 py-4 text-[15px] leading-7 text-text-main outline-none placeholder:text-text-secondary/40"
              />
              <label className="mx-auto block w-full max-w-[72ch] flex-none border-t border-white/[0.06] px-5 py-3">
                <span className="studio-label">Dream</span>
                <textarea
                  name="dream"
                  value={form.dream || ""}
                  onChange={setField}
                  rows={2}
                  placeholder="Close with the dream…"
                  className="studio-serif w-full resize-none bg-transparent text-[14px] leading-6 text-text-main outline-none placeholder:text-text-secondary/40"
                />
              </label>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2 bg-black/[0.12] p-4">
              <textarea
                name="rawPastedText"
                value={form.rawPastedText || ""}
                onChange={setField}
                placeholder="Paste a complete volume here, then choose Parse and apply."
                aria-label="Raw greentext"
                spellCheck={false}
                className="dash-input min-h-[6rem] flex-1 resize-none font-mono leading-5"
              />
              <details className="flex-none text-[11px] text-text-secondary">
                <summary className="cursor-pointer hover:text-text-main">Parsed JSON</summary>
                <pre className="mt-1.5 max-h-40 overflow-auto rounded-md border border-white/10 bg-black/30 p-2 font-mono text-[11px] leading-5">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              </details>
              <div className="flex flex-none items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-[11px] text-text-secondary">
                  {form.rawPastedText?.trim()
                    ? `Fills volume ${parsed?.volumeNumber ?? "(no number)"}, "${parsed?.title || "Untitled"}", with ${
                        parsed?.bodyLines?.length || 0
                      } lines and ${parsed?.blessings?.length || 0} blessings.`
                    : "Parsing replaces every field with what's in the pasted text."}
                </p>
                <button
                  type="button"
                  onClick={applyParsed}
                  disabled={!form.rawPastedText?.trim()}
                  className="dash-btn dash-btn-primary"
                >
                  <Sparkles size={13} aria-hidden="true" /> Parse and apply
                </button>
              </div>
            </div>
          )}

          <div className="flex h-7 flex-none items-center gap-4 border-t border-white/[0.06] px-4 text-[10.5px] tabular-nums text-text-secondary">
            {caret && storyTab === "story" && (
              <span>
                Ln {caret.line}, Col {caret.col}
              </span>
            )}
            <span>{wordCount.toLocaleString()} words</span>
            <span className="hidden sm:inline">{Math.max(1, Math.round(wordCount / 200))} min read</span>
            <span>{bodyLineCount} lines</span>
            {currentVolume?.updatedAt && (
              <span className="hidden md:inline" title={new Date(currentVolume.updatedAt).toLocaleString()}>
                Edited {formatRelativeDay(new Date(currentVolume.updatedAt)).toLowerCase()}
              </span>
            )}
            <span
              key={saveState}
              aria-live="polite"
              className={`ml-auto flex items-center gap-1 ${dirty ? "text-amber-300" : savedAt ? "studio-saved text-emerald-300" : ""}`}
            >
              {!dirty && savedAt && <Check size={11} aria-hidden="true" />}
              {saveState}
            </span>
            <span className="hidden sm:inline">
              <kbd>Ctrl</kbd> <kbd>S</kbd>
            </span>
          </div>
        </section>

        {/* Blessings */}
        <section className={panel("blessings")} aria-label="Blessings">
          <div className="studio-head">
            <h2 className="mr-auto text-[13px] font-semibold text-text-main">
              Blessings <span className="ml-1 font-normal tabular-nums text-text-secondary">{blessings.length}</span>
              {duplicateCount > 0 && (
                <span className="ml-2 text-[11px] font-normal text-amber-300">
                  {duplicateCount} duplicate{duplicateCount === 1 ? "" : "s"}
                </span>
              )}
            </h2>
            <Link
              to="/admin/blessings"
              target="_blank"
              className="dash-btn dash-btn-icon"
              title="Open the master library"
              aria-label="Open the master library"
            >
              <Library size={13} />
            </Link>
            <button
              type="button"
              onClick={splitAllBlessings}
              disabled={!blessings.length}
              className="dash-btn dash-btn-icon"
              title="Split every name into name and description"
              aria-label="Split every name"
            >
              <Scissors size={13} />
            </button>
            <button type="button" onClick={addBlessing} className="dash-btn dash-btn-primary">
              <Plus size={13} aria-hidden="true" /> Add
            </button>
          </div>

          <label className="block flex-none border-b border-white/[0.06] px-3 py-2.5">
            <span className="studio-label">Intro</span>
            <input
              name="blessingIntro"
              value={form.blessingIntro || ""}
              onChange={setField}
              placeholder="Life is…"
              className="studio-serif w-full bg-transparent text-[14px] text-text-main outline-none placeholder:text-text-secondary/40"
            />
          </label>

          {(missingFromMaster.length > 0 || masterError) && (
            <div className="flex-none border-b border-white/[0.06] bg-amber-500/[0.05] px-3 py-2">
              {masterError ? (
                <p className="text-xs text-amber-200">{masterError}</p>
              ) : (
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs text-amber-200">
                    <span>{missingFromMaster.length} library blessings aren't in this volume</span>
                    <span className="text-[10px] text-amber-200/70 underline-offset-2 hover:underline">Review</span>
                  </summary>
                  <ul className="mt-2 max-h-32 divide-y divide-amber-500/10 overflow-y-auto pr-1">
                    {missingFromMaster.map((definition) => (
                      <li key={definition._id} className="flex items-center justify-between gap-2 py-1">
                        <span className="min-w-0 truncate text-xs text-amber-100">{definition.name}</span>
                        <button
                          type="button"
                          onClick={() => setBlessings((list) => [...list, masterToBlessing(definition)])}
                          className="rounded px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-amber-500/10"
                        >
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setBlessings((list) => [...list, ...missingFromMaster.map(masterToBlessing)])}
                    className="mt-2 w-full rounded border border-amber-500/20 bg-amber-500/10 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-500/15"
                  >
                    Add all {missingFromMaster.length}
                  </button>
                </details>
              )}
            </div>
          )}

          <ol ref={blessingListRef} className="min-h-0 flex-1 divide-y divide-white/[0.05] overflow-y-auto">
            {!blessings.length && (
              <li className="dash-empty m-3">No blessings yet. Add one, or pull them from the library above.</li>
            )}
            {blessings.map((blessing, index) => (
              <li
                key={index}
                onDragOver={(event) => {
                  if (dragIndex === null) return;
                  event.preventDefault();
                  setDropIndex(index);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null) moveBlessingTo(dragIndex, index);
                  endDrag();
                }}
                className={`group px-3 py-2.5 transition focus-within:bg-white/[0.025] ${
                  dragIndex === index ? "opacity-40" : ""
                } ${
                  dropIndex === index && dragIndex !== index
                    ? dragIndex > index
                      ? "shadow-[inset_0_2px_0_var(--color-primary)]"
                      : "shadow-[inset_0_-2px_0_var(--color-primary)]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  <span
                    draggable
                    onDragStart={(event) => {
                      setDragIndex(index);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setDragImage(event.currentTarget.closest("li"), 16, 16);
                    }}
                    onDragEnd={endDrag}
                    className="-ml-1 flex flex-none cursor-grab items-center text-text-secondary/50 hover:text-text-main active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <GripVertical size={12} aria-hidden="true" />
                    <span className="w-4 text-right text-[10px] tabular-nums text-text-secondary">{index + 1}</span>
                  </span>
                  <input
                    value={blessing?.item || ""}
                    onChange={(event) => updateBlessing(index, "item", event.target.value)}
                    placeholder="Blessing name"
                    aria-label={`Blessing ${index + 1} name`}
                    title={isDuplicate(blessing) ? "This name appears more than once" : undefined}
                    className={`studio-serif ml-1.5 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-text-secondary/40 ${
                      isDuplicate(blessing) ? "text-amber-300" : "text-text-main"
                    }`}
                  />
                  <span className="flex opacity-40 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <button type="button" onClick={() => splitBlessing(index)} className={iconBtn} title="Split name and description" aria-label="Split name and description">
                      <Scissors size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlessing(index, -1)}
                      disabled={index === 0}
                      className={iconBtn}
                      title="Move up"
                      aria-label="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlessing(index, 1)}
                      disabled={index === blessings.length - 1}
                      className={iconBtn}
                      title="Move down"
                      aria-label="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlessing(index)}
                      className={`${iconBtn} hover:!text-rose-400`}
                      title="Remove blessing"
                      aria-label="Remove blessing"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                </div>
                <textarea
                  value={blessing?.description || ""}
                  onChange={(event) => updateBlessing(index, "description", event.target.value)}
                  placeholder="What it means…"
                  aria-label={`Blessing ${index + 1} description`}
                  rows={2}
                  className="ml-7 mt-1 block w-[calc(100%-1.75rem)] resize-none bg-transparent text-xs leading-5 text-text-secondary outline-none transition placeholder:text-text-secondary/40 focus:text-text-main"
                />
              </li>
            ))}
          </ol>

          {removed && (
            <div className="studio-saved flex flex-none items-center gap-2 border-t border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-text-secondary">
              <span className="min-w-0 flex-1 truncate">Removed “{removed.blessing?.item || "Untitled blessing"}”</span>
              <button type="button" onClick={undoRemove} className="dash-btn !min-h-[26px] !py-0.5">
                Undo
              </button>
            </div>
          )}
        </section>
      </div>

      {helpOpen && (
        <div className="fixed inset-0 z-[110] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close shortcuts"
            onClick={() => setHelpOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />
          <div role="dialog" aria-label="Keyboard shortcuts" className="studio-panel studio-saved relative w-full max-w-sm overflow-hidden">
            <div className="studio-head">
              <h2 className="studio-serif mr-auto text-[17px] text-text-main">Keyboard shortcuts</h2>
              <button type="button" onClick={() => setHelpOpen(false)} className="dash-btn dash-btn-icon" aria-label="Close shortcuts">
                <X size={13} />
              </button>
            </div>
            <dl className="divide-y divide-white/[0.05] px-4 py-1">
              {SHORTCUTS.map(([keys, label]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2 text-[12.5px]">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="flex gap-1 text-text-main">
                    {keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      <AnimatePresence>
        {exportOpen && (
          <VolumeExportModal
            volumes={volumes}
            onClose={() => setExportOpen(false)}
            onNotice={(message) => emitToast({ title: message })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VolumeStudioPage;
