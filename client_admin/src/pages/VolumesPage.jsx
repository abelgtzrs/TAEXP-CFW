import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../services/api";
import VolumeForm from "../components/volumes/VolumeForm"; // Import the refactored form
import { buildExportText, copyToClipboard, downloadTxt } from "./volumeFunctionality/exportHelpers";
import { toFormData, toPayload } from "./volumeFunctionality/formMappers";
import {
  fetchVolumes as fetchAllVolumes,
  createVolume,
  updateVolume,
  deleteVolume as removeVolume,
} from "./volumeFunctionality/volumeApi";
import { searchVolumes } from "../utils/volumeSearch";

// This is the starting state for a new, blank form.
const INITIAL_FORM_STATE = {
  rawPastedText: "",
  status: "draft",
  // Structured fields for explicit editing
  volumeNumber: "",
  title: "",
  bodyText: "", // UI representation; convert to bodyLines[] on submit
  blessingIntro: "",
  blessings: [], // [{ item, description }]
  dream: "",
  edition: "",
};

const VolumesPage = () => {
  // --- STATE MANAGEMENT ---
  const [volumes, setVolumes] = useState([]); // For the list of all volumes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sidebar mode: expanded (40% viewport width) or condensed (10%)
  const [volumesSidebarMode, setVolumesSidebarMode] = useState(() => {
    try {
      const v = localStorage.getItem("tae.volumes.sidebar.mode");
      if (v === "condensed" || v === "expanded") return v;
    } catch {}
    return "expanded";
  });
  const volumesSidebarWidth = volumesSidebarMode === "condensed" ? "10vw" : "30vw";
  const toggleVolumesSidebar = () => {
    setVolumesSidebarMode((m) => {
      const next = m === "expanded" ? "condensed" : "expanded";
      try {
        localStorage.setItem("tae.volumes.sidebar.mode", next);
      } catch {}
      return next;
    });
  };
  const isCondensed = volumesSidebarMode === "condensed";

  // Export modal state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState("");

  // NEW: The form's data now lives here in the parent component.
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  // NEW: We still track the form's submission loading state separately.
  const [formLoading, setFormLoading] = useState(false);
  // NEW: Track if we are editing or creating.
  const [editingId, setEditingId] = useState(null);
  const [sortKey, setSortKey] = useState("volume"); // volume | blessings | lines
  const [sortDir, setSortDir] = useState("desc"); // asc | desc
  const [searchQuery, setSearchQuery] = useState(""); // NEW: Search query state
  const [resultNotice, setResultNotice] = useState("");

  // --- DATA FETCHING ---
  const fetchVolumes = async () => {
    try {
      setLoading(true);
      const data = await fetchAllVolumes();
      setVolumes(data);
    } catch (err) {
      setError("Failed to fetch volumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  useEffect(() => {
    if (!resultNotice) return;
    const t = setTimeout(() => setResultNotice(""), 2500);
    return () => clearTimeout(t);
  }, [resultNotice]);

  const sortedVolumes = useMemo(() => {
    // 1. Filter by search query if present
    let arr = [...volumes];
    if (searchQuery.trim()) {
      const searchResults = searchVolumes(arr, searchQuery);
      // searchVolumes returns { volume, matches } objects. We just want the volume objects for the list.
      // Note: searchVolumes already sorts by relevance.
      // If we want to respect the user's sort choice *within* search results, we might need to re-sort.
      // For now, let's trust the search relevance or just map back to volumes and let the sort below handle it?
      // Actually, usually search results should be sorted by relevance.
      // But if the user explicitly asks to sort by Volume #, we should probably honor that.
      // Let's map back to the volume objects first.
      arr = searchResults.map((r) => r.volume);
    }

    // 2. Sort
    const key = sortKey;
    const dir = sortDir;
    arr.sort((a, b) => {
      const aBless = Array.isArray(a.blessings) ? a.blessings.length : 0;
      const bBless = Array.isArray(b.blessings) ? b.blessings.length : 0;
      const aLines = Array.isArray(a.bodyLines) ? a.bodyLines.length : 0;
      const bLines = Array.isArray(b.bodyLines) ? b.bodyLines.length : 0;
      let av = 0;
      let bv = 0;
      if (key === "volume") {
        av = Number(a.volumeNumber) || 0;
        bv = Number(b.volumeNumber) || 0;
      } else if (key === "blessings") {
        av = aBless;
        bv = bBless;
      } else if (key === "lines") {
        av = aLines;
        bv = bLines;
      }
      return dir === "asc" ? av - bv : bv - av;
    });
    return arr;
  }, [volumes, sortKey, sortDir, searchQuery]);

  // Asc list by volume number for prev/next navigation
  const volumesByNumberAsc = useMemo(() => {
    const arr = [...volumes];
    arr.sort((a, b) => (Number(a.volumeNumber) || 0) - (Number(b.volumeNumber) || 0));
    return arr;
  }, [volumes]);

  const currentIndex = useMemo(() => {
    if (!editingId) return -1;
    return volumesByNumberAsc.findIndex((v) => v._id === editingId);
  }, [editingId, volumesByNumberAsc]);

  const prevVolume = currentIndex > 0 ? volumesByNumberAsc[currentIndex - 1] : null;
  const nextVolume =
    currentIndex >= 0 && currentIndex < volumesByNumberAsc.length - 1 ? volumesByNumberAsc[currentIndex + 1] : null;

  const gotoPrevVolume = () => {
    if (prevVolume) handleEditClick(prevVolume);
  };
  const gotoNextVolume = () => {
    if (nextVolume) handleEditClick(nextVolume);
  };

  // --- EXPORT HELPERS ---
  // buildExportText moved to exportHelpers

  const openExportModal = () => {
    const published = (volumes || []).filter((v) => v.status === "published");
    const txt = buildExportText(published);
    setExportText(txt);
    setExportOpen(true);
  };

  const copyExportToClipboard = async () => {
    const ok = await copyToClipboard(exportText);
    alert(ok ? "Export copied to clipboard." : "Failed to copy. Please select the text and copy manually.");
  };

  const downloadExportTxt = () => downloadTxt(exportText, "volumes-export");

  // --- FORM & ACTION HANDLERS ---

  // This function is passed down to the form to update this page's state.
  const handleFormChange = (newFormData) => {
    setFormData(newFormData);
  };

  // Populates the form when an "Edit" button is clicked.
  const handleEditClick = (volume) => {
    setEditingId(volume._id);
    setFormData(toFormData(volume));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clears the form and resets it to "Create" mode.
  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
  };

  // Handles form submission for both creating and updating.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      // Build payload from structured fields; convert bodyText -> bodyLines
      const finalPayload = toPayload(formData);

      if (editingId) {
        // If we are editing, send a PUT request.
        await updateVolume(editingId, finalPayload);
        // Refresh volumes and keep the current edited volume loaded
        const latest = await fetchAllVolumes();
        setVolumes(latest);
        const updated = latest.find((v) => v._id === editingId);
        if (updated) {
          setFormData(toFormData(updated));
        }
        setResultNotice(`Volume ${formData.volumeNumber || ""} updated successfully`);
      } else {
        // Otherwise, send a POST request to create.
        await createVolume(finalPayload);
        // For creates, reset the form and refresh the list
        resetForm();
        await fetchVolumes();
        setResultNotice("Volume created successfully");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while saving.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVolume = async (volumeId) => {
    if (window.confirm("Are you sure you want to permanently delete this volume?")) {
      try {
        await removeVolume(volumeId);
        await fetchVolumes();
      } catch (err) {
        setError("Failed to delete volume.");
      }
    }
  };

  return (
    <div>
      {resultNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50" style={{ marginLeft: -30 }}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="px-4 py-2 rounded border shadow"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "var(--color-primary)",
              color: "var(--color-text)",
            }}
          >
            {resultNotice}
          </motion.div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Layout: main manager (left), fixed navigation (right) */}
        <div className="grid grid-cols-12 gap-3 relative">
          {/* Left: Form editor (reserve space equal to dynamic volumes nav width) */}
          <div className="col-span-12 lg:col-span-12" style={{ paddingRight: volumesSidebarWidth }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-lg border shadow-sm"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-primary)",
                minHeight: "calc(100vh - 64px)",
              }}
            >
              <div className="flex justify-between items-center px-4 pt-4">
                <h2 className="text-xl text-main font-semibold mb-2">
                  {editingId ? "Greentext Volume Manager: Edit Volume" : "Greentext Volume Manager: Create New Volume"}
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  {editingId && (
                    <>
                      <button
                        onClick={gotoPrevVolume}
                        disabled={!prevVolume}
                        title={prevVolume ? `Go to Vol ${prevVolume.volumeNumber}` : "No previous volume"}
                        className="px-2 py-1 rounded border border-primary/40 text-xs bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={gotoNextVolume}
                        disabled={!nextVolume}
                        title={nextVolume ? `Go to Vol ${nextVolume.volumeNumber}` : "No next volume"}
                        className="px-2 py-1 rounded border border-primary/40 text-xs bg-primary/10 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </>
                  )}
                  {editingId && (
                    <button onClick={resetForm} className="text-sm text-main hover:text-primary">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
              <VolumeForm
                formData={formData}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                loading={formLoading}
                submitButtonText={editingId ? "Update Volume" : "Create Volume"}
              />
            </motion.div>
          </div>

          {/* Right: Existing Volumes navigation (fixed, aligned before global right sidebar, toggleable width) */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="fixed top-16 bottom-0 rounded-lg border shadow-sm flex flex-col transition-[width] duration-300 ease-out"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-primary)",
                right: "var(--right-sidebar-width)", // align with left edge of persistent right sidebar
                width: volumesSidebarWidth,
              }}
            >
              <div
                className={`border-b ${isCondensed ? "px-2 py-1" : "px-3 py-2"}`}
                style={{ borderColor: "var(--color-primary)" }}
              >
                <div className={`flex items-center justify-between ${isCondensed ? "gap-1" : "gap-2"}`}>
                  <div className={`${isCondensed ? "text-[11px]" : "text-sm"} font-semibold text-main truncate`}>
                    Existing Volumes
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={toggleVolumesSidebar}
                      className={`rounded border transition ${
                        isCondensed ? "px-1 py-[2px] text-[9px]" : "px-2 py-1 text-[10px] hover:bg-primary/20"
                      }`}
                      style={{ borderColor: "var(--color-primary)" }}
                      title={isCondensed ? "Expand volumes sidebar" : "Condense volumes sidebar"}
                    >
                      {isCondensed ? "Expand" : "Condense"}
                    </button>
                    {!isCondensed && (
                      <button
                        onClick={openExportModal}
                        title="Export all published volumes to raw text"
                        className="px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-[11px] text-main"
                      >
                        Export TXT
                      </button>
                    )}
                  </div>
                </div>
                {!isCondensed && (
                  <div className="mt-2 space-y-2">
                    {/* Search Input */}
                    <input
                      type="text"
                      placeholder="Search volumes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-2 py-1 rounded border bg-transparent text-xs text-main placeholder-white/30 focus:outline-none focus:border-primary"
                      style={{ borderColor: "var(--color-primary)" }}
                    />
                    {/* Sort Controls */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <label className="opacity-80">Sort by</label>
                      <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value)}
                        className="rounded border px-2 py-1 bg-transparent"
                        style={{ borderColor: "var(--color-primary)" }}
                      >
                        <option value="volume">Volume #</option>
                        <option value="blessings">Blessings</option>
                        <option value="lines">Lines</option>
                      </select>
                      <button
                        className="ml-auto px-2 py-1 rounded border"
                        style={{ borderColor: "var(--color-primary)" }}
                        onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                        title="Toggle ascending/descending"
                      >
                        {sortDir === "asc" ? "Asc" : "Desc"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {loading && <div className="px-3 py-2 text-xs text-text-secondary">Loading…</div>}
              {error && <div className="px-3 py-2 text-xs text-red-500">{error}</div>}
              <div className={`${isCondensed ? "p-1" : "p-2"} overflow-y-auto flex-1 space-y-2`}>
                {sortedVolumes.map((vol) => (
                  <div
                    key={vol._id}
                    className={`rounded border transition cursor-pointer ${
                      isCondensed ? "px-2 py-1 text-[10px] hover:bg-white/5" : "p-2 hover:bg-white/5"
                    }`}
                    style={{ borderColor: "var(--color-primary)" }}
                    onClick={() => handleEditClick(vol)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleEditClick(vol);
                    }}
                  >
                    {isCondensed ? (
                      <>
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-semibold truncate">
                            V{vol.volumeNumber} {vol.title}
                          </div>
                          <span
                            className={`flex-none w-2 h-2 rounded-full ${
                              vol.status === "published" ? "bg-green-400" : "bg-yellow-400"
                            }`}
                            title={vol.status}
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span
                            className="px-1 py-[1px] rounded border text-[9px]"
                            style={{ borderColor: "var(--color-primary)" }}
                            title="Blessings count"
                          >
                            {vol.blessings?.length ?? 0}b
                          </span>
                          <span
                            className="px-1 py-[1px] rounded border text-[9px]"
                            style={{ borderColor: "var(--color-primary)" }}
                            title="Lines count"
                          >
                            {vol.bodyLines?.length ?? 0}l
                          </span>
                          <span className="text-[9px] opacity-60 truncate" title="Created date">
                            {new Date(vol.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVolume(vol._id);
                            }}
                            className="text-red-400 hover:text-red-300 text-[9px]"
                            title="Delete volume"
                          >
                            Del
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-text-main truncate">
                            Vol {vol.volumeNumber}: {vol.title}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-text-secondary flex-wrap">
                          <span className="px-2 py-0.5 rounded border" style={{ borderColor: "var(--color-primary)" }}>
                            {vol.blessings?.length ?? 0} blessings
                          </span>
                          <span className="px-2 py-0.5 rounded border" style={{ borderColor: "var(--color-primary)" }}>
                            {vol.bodyLines?.length ?? 0} lines
                          </span>
                          <span className="opacity-70">{new Date(vol.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVolume(vol._id);
                            }}
                            className="text-red-500 hover:text-red-400 text-xs"
                          >
                            Delete
                          </button>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full ${
                              vol.status === "published"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {vol.status}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {!sortedVolumes.length && !loading && (
                  <div className="text-xs text-text-secondary">No volumes yet.</div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Close top-level page wrapper motion.div */}
      </motion.div>

      {/* Export Modal */}
      {exportOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setExportOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-lg max-w-5xl w-full max-h-[80vh] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Published Volumes — Raw Text Export</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyExportToClipboard}
                  className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 border border-gray-600 text-sm"
                >
                  Copy
                </button>
                <button
                  onClick={downloadExportTxt}
                  className="px-3 py-1.5 rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-sm"
                >
                  Download .txt
                </button>
                <button
                  onClick={() => setExportOpen(false)}
                  className="px-3 py-1.5 rounded bg-red-900/40 hover:bg-red-900/60 border border-red-800 text-red-200 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-3">
              <textarea
                readOnly
                value={exportText}
                className="w-full h-[60vh] bg-black/60 text-gray-100 font-mono text-xs p-3 rounded resize-none"
                spellCheck={false}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default VolumesPage;
