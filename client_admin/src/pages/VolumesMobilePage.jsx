import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../services/api";
import VolumeMobileForm from "../components/volumes/VolumeMobileForm";
import { buildExportText, copyToClipboard, downloadTxt } from "./volumeFunctionality/exportHelpers";
import { toFormData, toPayload } from "./volumeFunctionality/formMappers";
import {
  fetchVolumes as fetchAllVolumes,
  createVolume,
  updateVolume,
  deleteVolume as removeVolume,
} from "./volumeFunctionality/volumeApi";
import { searchVolumes } from "../utils/volumeSearch";
import { ArrowLeft, Plus, List, FileText } from "lucide-react";

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

const VolumesMobilePage = () => {
  // --- STATE MANAGEMENT ---
  const [volumes, setVolumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // View Mode: 'list' or 'editor'
  const [viewMode, setViewMode] = useState("list");

  // Export modal state
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState("");

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sortKey, setSortKey] = useState("volume");
  const [sortDir, setSortDir] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
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
    let arr = [...volumes];
    if (searchQuery.trim()) {
      const searchResults = searchVolumes(arr, searchQuery);
      arr = searchResults.map((r) => r.volume);
    }

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

  // --- ACTIONS ---

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

  const handleBackToList = () => {
    setViewMode("list");
  };

  const handleFormChange = (newFormData) => {
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    try {
      const finalPayload = toPayload(formData);
      if (editingId) {
        await updateVolume(editingId, finalPayload);
        const latest = await fetchAllVolumes();
        setVolumes(latest);
        const updated = latest.find((v) => v._id === editingId);
        if (updated) setFormData(toFormData(updated));
        setResultNotice(`Volume updated successfully`);
      } else {
        await createVolume(finalPayload);
        setFormData(INITIAL_FORM_STATE);
        setEditingId(null);
        await fetchVolumes();
        setResultNotice("Volume created successfully");
        setViewMode("list"); // Go back to list after create
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

  // --- RENDER ---

  return (
    <div className="pb-20">
      {/* Result Notice Toast */}
      <AnimatePresence>
        {resultNotice && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-50 bg-surface border border-primary text-text-main px-4 py-3 rounded shadow-lg text-center"
          >
            {resultNotice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header / Navigation */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-primary">JSON Parser (Mobile)</h1>
        {viewMode === "list" && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium shadow-md active:scale-95 transition-transform"
          >
            <Plus size={16} /> New
          </button>
        )}
        {viewMode === "editor" && (
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1 bg-surface border border-white/20 text-text-main px-3 py-2 rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            <ArrowLeft size={16} /> List
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="relative min-h-[80vh]">
        {viewMode === "list" ? (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Search & Sort */}
            <div className="bg-surface/50 p-3 rounded-lg border border-white/10 space-y-3">
              <input
                type="text"
                placeholder="Search volumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary outline-none"
              />
              <div className="flex items-center gap-2">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value)}
                  className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-2 text-sm text-white focus:border-primary outline-none"
                >
                  <option value="volume">Volume #</option>
                  <option value="blessings">Blessings</option>
                  <option value="lines">Lines</option>
                </select>
                <button
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="bg-black/20 border border-white/10 rounded px-3 py-2 text-sm text-white"
                >
                  {sortDir === "asc" ? "Asc" : "Desc"}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {loading && <div className="text-center py-4 text-text-secondary">Loading volumes...</div>}
              {!loading && sortedVolumes.length === 0 && (
                <div className="text-center py-8 text-text-secondary bg-surface/30 rounded-lg border border-dashed border-white/10">
                  No volumes found.
                </div>
              )}
              {sortedVolumes.map((vol) => (
                <div
                  key={vol._id}
                  onClick={() => handleEditClick(vol)}
                  className="bg-surface border border-white/10 rounded-lg p-3 active:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white text-base">
                        Vol {vol.volumeNumber}: {vol.title}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {new Date(vol.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        vol.status === "published"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {vol.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <List size={12} /> {vol.blessings?.length || 0} Blessings
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} /> {vol.bodyLines?.length || 0} Lines
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="bg-surface border border-white/10 rounded-lg p-1 shadow-sm mb-20">
              <VolumeMobileForm
                formData={formData}
                onFormChange={handleFormChange}
                onSubmit={handleSubmit}
                loading={formLoading}
                submitButtonText={editingId ? "Update Volume" : "Create Volume"}
              />
            </div>
            {editingId && (
              <div className="px-4 mb-24">
                <button
                  onClick={() => handleDeleteVolume(editingId)}
                  className="w-full py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  Delete Volume
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VolumesMobilePage;
