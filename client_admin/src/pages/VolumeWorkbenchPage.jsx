import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import api from "../services/api";
import { parseRawGreentext } from "../utils/greentextParser";
import PageHeader from "../components/ui/PageHeader";
import StyledButton from "../components/ui/StyledButton";
import Widget from "../components/ui/Widget";
import { Eye, GripVertical, Save, Trash2, Edit, AlertCircle, X, ChevronsRight, Download, Search } from "lucide-react";
import { searchVolumes, highlightQuery } from "../utils/volumeSearch";
import { upsertVolume } from "./volumeFunctionality/volumeList";

// --- Preview Modal Component ---
const PreviewModal = ({ volume, isOpen, onClose }) => {
  if (!isOpen || !volume) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-3xl h-[80vh] rounded-lg border border-gray-700/50 p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary">
            Volume {volume.volumeNumber}: {volume.title}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto h-full text-sm flex-grow pr-4">
          <div className="my-4 space-y-1">
            {volume.bodyLines.map((line, i) => (
              <p key={i} className="text-green-400 font-mono whitespace-pre-wrap">
                {line.trim() ? `> ${line}` : "\u00A0"}
              </p>
            ))}
          </div>
          {volume.blessings && volume.blessings.length > 0 && (
            <div className="my-4">
              <p className="text-text-secondary italic">{volume.blessingIntro}</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {volume.blessings.map((b, i) => (
                  <li key={i} className="text-text-main">
                    {b.item} <span className="text-text-secondary">({b.description})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {volume.dream && <p className="my-4 text-text-secondary italic">{volume.dream}</p>}
          {volume.edition && (
            <p className="mt-4 text-xs text-text-tertiary">{`The Abel Experience™: ${volume.edition}`}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const VolumeWorkbenchPage = () => {
  const [rawText, setRawText] = useState("");
  const [editableVolume, setEditableVolume] = useState(null);
  const [bodyText, setBodyText] = useState("");
  const [status, setStatus] = useState("draft");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewVolume, setPreviewVolume] = useState(null); // holds volume shown in modal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [volumes, setVolumes] = useState([]);
  const [volumesLoading, setVolumesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("raw"); // 'raw' | 'edit'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Fetch all existing volumes (admin) sorted ascending client-side
  const fetchVolumes = async () => {
    setVolumesLoading(true);
    try {
      const res = await api.get("/admin/volumes");
      const list = res.data?.data || [];
      list.sort((a, b) => (a.volumeNumber || 0) - (b.volumeNumber || 0));
      setVolumes(list);
    } catch (e) {
      console.error("Failed to load volumes", e);
    } finally {
      setVolumesLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  // Run search when query changes while modal open
  useEffect(() => {
    if (!isSearchOpen) return;
    const res = searchVolumes(volumes, searchQuery);
    setSearchResults(res);
  }, [isSearchOpen, searchQuery, volumes]);

  const handleParse = () => {
    if (!rawText) return;
    const parsed = parseRawGreentext(rawText);
    setEditableVolume((prev) => {
      if (prev && prev._id) {
        // Preserve DB identity & immutable fields while updating parsed content
        return {
          ...prev,
          ...parsed,
          _id: prev._id,
          createdBy: prev.createdBy,
          edition: parsed.edition || prev.edition || (parsed.title ? `${parsed.title} Edition` : prev.edition),
        };
      }
      return parsed;
    });
    // Convert bodyLines array into a single string for the textarea
    const bodyString = parsed.bodyLines.map((line) => (line.trim() ? `> ${line}` : "~")).join("\n");
    setBodyText(bodyString);
  };

  const handleFieldChange = (field, value) => {
    setEditableVolume((prev) => ({ ...prev, [field]: value }));
  };

  const handleBodyChange = (e) => {
    setBodyText(e.target.value);
    // Convert textarea string back into bodyLines array
    const lines = e.target.value.split("\n").map((line) => {
      if (line.startsWith("> ")) return line.substring(2);
      if (line.trim() === "~") return "";
      return line;
    });
    setEditableVolume((prev) => ({ ...prev, bodyLines: lines }));
  };

  const handleBlessingUpdate = (index, field, value) => {
    const newBlessings = [...editableVolume.blessings];
    newBlessings[index][field] = value;
    setEditableVolume({ ...editableVolume, blessings: newBlessings });
  };

  const handleBlessingRemove = (index) => {
    const newBlessings = editableVolume.blessings.filter((_, i) => i !== index);
    setEditableVolume({ ...editableVolume, blessings: newBlessings });
  };

  const handleBlessingDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(editableVolume.blessings);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setEditableVolume({ ...editableVolume, blessings: items });
  };

  const clearSuccessMessage = () => {
    if (success) {
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!editableVolume) throw new Error("No volume data to submit");

      // Ensure we always send required rawPastedText (fallback to existing stored raw text if user hasn't repasted)
      const rawPastedText = rawText || editableVolume.rawPastedText || "";
      if (!rawPastedText.trim()) {
        setError("Raw text is required. Paste or parse the original greentext first.");
        setLoading(false);
        return;
      }

      const finalVolumeData = { ...editableVolume, rawPastedText, status };

      // Client-side duplicate check: if creating new OR changing number to an existing one
      const targetNumber = finalVolumeData.volumeNumber;
      const conflicting = volumes.find((v) => v.volumeNumber === targetNumber && v._id !== editableVolume._id);
      if (!editableVolume._id && conflicting) {
        setError(`Volume number ${targetNumber} already exists.`);
        setLoading(false);
        return;
      }
      if (editableVolume._id && conflicting) {
        setError(`Cannot change to volume number ${targetNumber}; it already exists.`);
        setLoading(false);
        return;
      }

      if (editableVolume._id) {
        // Update existing volume – only send changed fields & optional reparse flag
        const {
          _id,
          createdAt,
          updatedAt,
          favoriteCount,
          ratings,
          averageRating,
          ratingCount,
          createdBy,
          rawPastedText: originalRaw,
          ...rest
        } = finalVolumeData;
        const reparse = rawPastedText !== (editableVolume.rawPastedText || "");
        const payload = { ...rest, status };
        if (reparse) {
          payload.rawPastedText = rawPastedText;
          payload.reparse = true;
        }
        const res = await api.put(`/admin/volumes/${editableVolume._id}`, payload);
        setVolumes((current) => upsertVolume(current, res.data.data));
        setSuccess(`Volume ${finalVolumeData.volumeNumber} updated successfully!`);
      } else {
        // Create new
        const res = await api.post("/admin/volumes", finalVolumeData);
        setVolumes((current) => upsertVolume(current, res.data.data));
        setSuccess(`Volume ${finalVolumeData.volumeNumber} created successfully!`);
      }
      clearSuccessMessage();
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message;
      setError(serverMsg || err.message || "An error occurred. Check console.");
      console.error("Volume save error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // The list has no raw paste, so load the full record before editing.
  const handleEditVolume = async (listVol) => {
    if (!listVol) return;
    let vol;
    try {
      vol = (await api.get(`/admin/volumes/${listVol._id}`)).data.data;
    } catch {
      setError("Couldn't open that volume. Try again.");
      return;
    }
    setEditableVolume(vol);
    // Reconstruct bodyText with > prefix; blank lines as ~ placeholder
    const bodyString = (vol.bodyLines || []).map((line) => (line.trim() ? `> ${line}` : "~")).join("\n");
    setBodyText(bodyString);
    setStatus(vol.status || "draft");
    setRawText(vol.rawPastedText || ""); // If stored; if not, leave blank
    setActiveTab("edit");
  };

  const handleDeleteVolume = async (vol) => {
    if (!vol?._id) return;
    if (!confirm(`Delete Volume ${vol.volumeNumber}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/volumes/${vol._id}`);
      if (editableVolume?._id === vol._id) {
        setEditableVolume(null);
      }
      setVolumes((current) => current.filter((v) => v._id !== vol._id));
    } catch (e) {
      console.error("Delete failed", e);
      setError("Delete failed");
    }
  };

  // --- EXPORT ALL PUBLISHED VOLUMES ---
  const exportPublishedVolumes = async () => {
    try {
      setError("");
      setSuccess("");
      // Ensure we have the freshest list (in case user just changed statuses)
      if (volumes.length === 0) {
        await fetchVolumes();
      }
      const published = (volumes || [])
        .filter((v) => v.status === "published")
        .sort((a, b) => a.volumeNumber - b.volumeNumber);
      if (published.length === 0) {
        setError("No published volumes to export.");
        return;
      }
      let content = `The Abel Experience™ CFW - Exported Volumes (All Published)\n`;
      content += `Generated on: ${new Date().toISOString()}\n`;
      content += "========================================\n\n";
      for (const vol of published) {
        content += `--- Volume ${vol.volumeNumber}: ${vol.title} ---\n\n`;
        // Body lines
        (vol.bodyLines || []).forEach((line) => {
          content += line && line.trim() !== "" ? `> ${line}\n` : "\n";
        });
        // Blessings
        if (vol.blessings && vol.blessings.length > 0) {
          content += `\n${vol.blessingIntro || "life is"}\n`;
          vol.blessings.forEach((b) => {
            const desc = b.description !== undefined ? b.description : "";
            content += `- ${b.item} (${desc})\n`;
          });
        }
        // Dream
        if (vol.dream) {
          content += `\n${vol.dream}\n`;
        }
        // Edition
        if (vol.edition) {
          content += `\nThe Abel Experience™: ${vol.edition}\n`;
        }
        content += "\n========================================\n\n";
      }
      // Trigger download
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Abel_Experience_All_Published_${published[0].volumeNumber}-${
        published[published.length - 1].volumeNumber
      }.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(`Exported ${published.length} published volumes.`);
      clearSuccessMessage();
    } catch (err) {
      console.error("Export failed", err);
      setError("Export failed. See console.");
    }
  };

  // Small helper to render highlighted snippets from search
  const Snippet = ({ parts }) => (
    <span>
      {parts.map((p, i) => (
        <span key={i} className={p.hit ? "text-amber-300 font-semibold" : ""}>
          {p.text}
        </span>
      ))}
    </span>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHeader
        title="Volume Authoring Workbench"
        subtitle="A dedicated space to craft and finalize your greentext volumes."
      />

      {/* TABS */}
      <div className="mt-4">
        <div className="flex border-b border-gray-700 mb-4 gap-2">
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-md border border-b-0 transition-colors ${
              activeTab === "raw"
                ? "bg-gray-800 text-white border-gray-700"
                : "text-text-secondary border-transparent hover:text-white"
            }`}
          >
            Raw Text
          </button>
          <button
            onClick={() => editableVolume && setActiveTab("edit")}
            disabled={!editableVolume}
            className={`px-4 py-2 text-sm font-semibold rounded-t-md border border-b-0 transition-colors ${
              activeTab === "edit"
                ? "bg-gray-800 text-white border-gray-700"
                : !editableVolume
                ? "text-gray-600 cursor-not-allowed border-transparent"
                : "text-text-secondary border-transparent hover:text-white"
            }`}
          >
            Parsed & Editable
          </button>
        </div>

        {/* TAB CONTENT WRAPPER */}
        <div className="bg-surface border border-gray-700/60 rounded-md p-4 min-h-[70vh] flex flex-col">
          {activeTab === "raw" && (
            <div className="flex flex-col h-full">
              <label className="text-xs uppercase tracking-wider text-text-tertiary mb-2">Raw Greentext</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your raw, unformatted volume text from your text editor here..."
                className="w-full flex-grow h-full min-h-[60vh] p-3 bg-gray-900 rounded-md text-sm font-mono resize-none"
              />
              <div className="pt-3 flex justify-end">
                <StyledButton
                  onClick={() => {
                    handleParse();
                    if (!editableVolume) setActiveTab("edit");
                  }}
                  disabled={!rawText}
                >
                  Parse Text <ChevronsRight size={20} />
                </StyledButton>
              </div>
            </div>
          )}

          {activeTab === "edit" && editableVolume && (
            <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2">
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Volume Meta</h3>
                <div className="grid grid-cols-6 gap-2">
                  <input
                    type="number"
                    placeholder="Vol #"
                    value={editableVolume.volumeNumber || ""}
                    onChange={(e) => handleFieldChange("volumeNumber", parseInt(e.target.value) || 0)}
                    className="col-span-1 bg-gray-700 p-2 rounded-md text-text-main font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Title"
                    value={editableVolume.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    className="col-span-4 bg-gray-700 p-2 rounded-md text-text-main font-bold"
                  />
                  {/* Removed edition input to avoid duplicate title-like field; edition derived automatically */}
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text-secondary">Body</h3>
                  <span className="text-[10px] text-text-tertiary">{editableVolume.bodyLines?.length || 0} lines</span>
                </div>
                <textarea
                  value={bodyText}
                  onChange={handleBodyChange}
                  className="w-full min-h-[30vh] p-3 bg-gray-900 rounded-md text-sm font-mono text-green-400 resize-none"
                />
              </div>

              {/* Life Is (Blessing Intro) */}
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Life Is Section</h3>
                <input
                  type="text"
                  placeholder="life is ..."
                  value={editableVolume.blessingIntro || ""}
                  onChange={(e) => handleFieldChange("blessingIntro", e.target.value)}
                  className="w-full bg-gray-700 p-2 rounded-md text-sm text-text-main"
                />
              </div>

              {/* Blessings */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-text-secondary">Blessings</h3>
                  <span className="text-[10px] text-text-tertiary">{editableVolume.blessings?.length || 0} items</span>
                </div>
                <div className="bg-gray-900/40 rounded-md p-2 max-h-[30vh] overflow-y-auto">
                  <DragDropContext onDragEnd={handleBlessingDragEnd}>
                    <Droppable droppableId="blessings">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {editableVolume.blessings.map((blessing, index) => (
                            <Draggable key={index} draggableId={`blessing-${index}`} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center gap-2 p-2 bg-gray-800/60 rounded-md"
                                >
                                  <div {...provided.dragHandleProps} className="cursor-grab text-gray-500">
                                    <GripVertical size={18} />
                                  </div>
                                  <div className="flex-grow grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Blessing Item"
                                      value={blessing.item}
                                      onChange={(e) => handleBlessingUpdate(index, "item", e.target.value)}
                                      className="bg-gray-700 p-1 rounded-md text-xs text-text-main"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Description"
                                      value={blessing.description}
                                      onChange={(e) => handleBlessingUpdate(index, "description", e.target.value)}
                                      className="bg-gray-700 p-1 rounded-md text-[10px] text-text-secondary"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleBlessingRemove(index)}
                                    className="p-1 text-gray-500 hover:text-red-500"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>

              {/* Dream */}
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Dream</h3>
                <input
                  type="text"
                  placeholder="the dream of ..."
                  value={editableVolume.dream || ""}
                  onChange={(e) => handleFieldChange("dream", e.target.value)}
                  className="w-full bg-gray-700 p-2 rounded-md text-sm text-text-secondary italic"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="mt-4 p-4 bg-surface border border-gray-700/50 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 bg-gray-700 rounded border border-gray-600 text-white"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <StyledButton
            onClick={() => {
              if (editableVolume) {
                setPreviewVolume(editableVolume);
                setIsPreviewOpen(true);
              }
            }}
            disabled={!editableVolume}
            className="bg-gray-600 hover:bg-gray-500"
          >
            <Eye size={16} /> Show Preview
          </StyledButton>
          <StyledButton
            onClick={exportPublishedVolumes}
            disabled={volumesLoading || volumes.filter((v) => v.status === "published").length === 0}
            className="bg-indigo-700/70 hover:bg-indigo-600"
          >
            <Download size={16} /> Export Published
          </StyledButton>
          <StyledButton onClick={() => setIsSearchOpen(true)} className="bg-gray-700/70 hover:bg-gray-600">
            <Search size={16} /> Search Volumes
          </StyledButton>
          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {success && <div className="text-green-400">{success}</div>}
        </div>
        <StyledButton onClick={handleSubmit} loading={loading} disabled={!editableVolume}>
          <Save size={16} />
          {`Save Volume ${editableVolume?.volumeNumber || ""}`}
        </StyledButton>
      </div>

      <PreviewModal
        volume={previewVolume}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewVolume(null);
        }}
      />

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-surface w-full max-w-4xl h-[70vh] rounded-lg border border-gray-700/50 p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-primary">Search Volumes</h2>
              <button onClick={() => setIsSearchOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 bg-gray-900 border border-gray-700 rounded px-2">
                <Search size={16} className="text-gray-400" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in title, body, blessings, dream, edition…"
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                />
              </div>
              <span className="text-xs text-text-tertiary">
                {searchResults.length} match{searchResults.length === 1 ? "" : "es"}
              </span>
            </div>
            <div className="flex-1 overflow-auto space-y-2 pr-1">
              {searchResults.length === 0 && (
                <div className="text-sm text-text-secondary">
                  {searchQuery ? "No matches found." : "Type to search."}
                </div>
              )}
              {searchResults.map(({ volume, matches }) => (
                <div key={volume._id} className="p-2 rounded border border-gray-700/50 bg-gray-900/40">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      Volume {volume.volumeNumber}: {volume.title}
                    </div>
                    <div className="text-[10px] text-text-tertiary">
                      {matches.length} hit{matches.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1">
                    {matches.slice(0, 6).map((m, idx) => (
                      <div key={idx} className="text-xs text-text-secondary">
                        <span className="px-1 py-0.5 mr-2 rounded bg-gray-700/50 text-[10px] uppercase">
                          {m.field}
                          {typeof m.index === "number" ? `#${m.index}` : ""}
                        </span>
                        <Snippet parts={highlightQuery(m.excerpt, searchQuery)} />
                      </div>
                    ))}
                    {matches.length > 6 && (
                      <div className="text-[10px] text-text-tertiary">…{matches.length - 6} more</div>
                    )}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <StyledButton
                      className="bg-gray-700/60 hover:bg-gray-600"
                      onClick={() => {
                        setPreviewVolume(volume);
                        setIsPreviewOpen(true);
                      }}
                    >
                      Preview
                    </StyledButton>
                    <StyledButton
                      className="bg-indigo-700/60 hover:bg-indigo-600"
                      onClick={() => {
                        handleEditVolume(volume);
                        setIsSearchOpen(false);
                      }}
                    >
                      Edit
                    </StyledButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EXISTING VOLUMES SECTION */}
      <Widget title="Existing Volumes" className="mt-8">
        {volumesLoading ? (
          <div className="text-sm text-text-secondary">Loading volumes...</div>
        ) : volumes.length === 0 ? (
          <div className="text-sm text-text-secondary">No volumes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-gray-700">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-2">Title</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Lines</th>
                  <th className="py-2 pr-2">Blessings</th>
                  <th className="py-2 pr-2">Dream</th>
                  <th className="py-2 pr-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {volumes.map((v) => (
                  <tr key={v._id} className="border-b border-gray-800 hover:bg-gray-800/40">
                    <td className="py-1 pr-2 font-mono">{v.volumeNumber}</td>
                    <td className="py-1 pr-2 truncate max-w-[240px]">{v.title}</td>
                    <td className="py-1 pr-2 capitalize text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          v.status === "published"
                            ? "bg-emerald-600/20 text-emerald-300 border border-emerald-600/40"
                            : "bg-gray-600/20 text-gray-300 border border-gray-600/40"
                        }`}
                      >
                        {v.status || "draft"}
                      </span>
                    </td>
                    <td className="py-1 pr-2 text-xs text-text-secondary">{v.bodyLines?.length || 0}</td>
                    <td className="py-1 pr-2 text-xs text-text-secondary">{v.blessings?.length || 0}</td>
                    <td className="py-1 pr-2 text-xs italic text-text-tertiary truncate max-w-[160px]">
                      {v.dream ? "Yes" : ""}
                    </td>
                    <td className="py-1 pr-2 flex gap-2">
                      <button
                        onClick={() => {
                          setPreviewVolume(v);
                          setIsPreviewOpen(true);
                        }}
                        className="p-1.5 rounded bg-gray-700/60 hover:bg-indigo-600/70 text-gray-200"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditVolume(v)}
                        className="p-1.5 rounded bg-gray-700/60 hover:bg-gray-600 text-gray-200"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteVolume(v)}
                        className="p-1.5 rounded bg-gray-700/60 hover:bg-red-600/70 text-gray-200"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Widget>
    </motion.div>
  );
};

export default VolumeWorkbenchPage;
