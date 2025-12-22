import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { parseRawGreentext } from "../../utils/greentextParser";
import { listBlessingDefs } from "../../services/blessingsService";

// The component now receives formData and a handler to change it.
const VolumeForm = ({ formData, onFormChange, onSubmit, loading, submitButtonText = "Submit" }) => {
  // The JSON preview state can still live here, as it's purely for display.
  const [parsedPreview, setParsedPreview] = useState({});

  // This effect updates the JSON preview whenever the raw text changes.
  useEffect(() => {
    const handler = setTimeout(() => {
      // We now get the raw text from the formData prop.
      setParsedPreview(parseRawGreentext(formData.rawPastedText || ""));
    }, 300); // Shortened delay for a snappier preview

    return () => clearTimeout(handler);
  }, [formData.rawPastedText]);

  // Update scalar field helper
  const handleChange = (e) => {
    onFormChange({ ...formData, [e.target.name]: e.target.value });
  };

  // Inline blessings editor helpers
  const blessings = Array.isArray(formData.blessings) ? formData.blessings : [];
  const updateBlessing = (idx, field, value) => {
    const next = [...blessings];
    next[idx] = { item: "", description: "", context: "", ...next[idx], [field]: value };
    onFormChange({ ...formData, blessings: next });
  };
  // Split helper: prefer en dash "– ", fallback to parentheses "(desc)"
  const splitBlessingString = (text) => {
    const s = String(text || "");
    const dashIdx = s.indexOf("– ");
    if (dashIdx !== -1) {
      const left = s.slice(0, dashIdx).trim();
      const right = s.slice(dashIdx + 2).trim();
      return { item: left, description: right };
    }
    const m = s.match(/^(.*?)(?:\s*\((.*)\))?$/);
    if (!m) return { item: s, description: "" };
    return { item: (m[1] || "").trim(), description: (m[2] || "").trim() };
  };
  const splitBlessingAtIndex = (idx) => {
    const b = blessings[idx] || {};
    const { item, description } = splitBlessingString(b.item || "");
    const next = [...blessings];
    next[idx] = { item, description, context: b.context || "" };
    onFormChange({ ...formData, blessings: next });
  };
  const splitAllBlessings = () => {
    if (!blessings.length) return;
    const next = blessings.map((b) => {
      const split = splitBlessingString(b?.item || "");
      return {
        item: split.item,
        description: b?.description ? b.description : split.description,
        context: b?.context || "",
      };
    });
    onFormChange({ ...formData, blessings: next });
  };
  const addBlessing = () => {
    onFormChange({
      ...formData,
      blessings: [...blessings, { item: "", description: "", context: "" }],
    });
  };
  const removeBlessing = (idx) => {
    const next = blessings.filter((_, i) => i !== idx);
    onFormChange({ ...formData, blessings: next });
  };
  const moveBlessing = (idx, dir) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= blessings.length) return;
    const arr = [...blessings];
    const [it] = arr.splice(idx, 1);
    arr.splice(nextIdx, 0, it);
    onFormChange({ ...formData, blessings: arr });
  };

  // Master blessings: fetch and compute which are missing on this volume
  const [masterBlessings, setMasterBlessings] = useState([]);
  const [masterError, setMasterError] = useState("");
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const defs = await listBlessingDefs();
        if (mounted) setMasterBlessings(Array.isArray(defs) ? defs : []);
      } catch (e) {
        if (mounted) setMasterError("Failed to load master blessings");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const presentNameSet = new Set(blessings.map((b) => (b?.item || "").trim().toLowerCase()).filter(Boolean));
  const missingFromMaster = (masterBlessings || [])
    .filter((m) => m?.active !== false)
    .filter(
      (m) =>
        !presentNameSet.has(
          String(m?.name || "")
            .trim()
            .toLowerCase()
        )
    );

  const addFromMaster = (m) => {
    const item = String(m?.name || "");
    if (!item) return;
    if (presentNameSet.has(item.trim().toLowerCase())) return; // guard against race duplicates
    const next = [...blessings, { item, description: m?.defaultDescription || "", context: m?.context || "" }];
    onFormChange({ ...formData, blessings: next });
  };
  const addAllMissingFromMaster = () => {
    if (!missingFromMaster.length) return;
    const next = [...blessings];
    const currentSet = new Set(presentNameSet);
    missingFromMaster.forEach((m) => {
      const name = String(m?.name || "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (currentSet.has(key)) return;
      currentSet.add(key);
      next.push({ item: name, description: m?.defaultDescription || "", context: m?.context || "" });
    });
    onFormChange({ ...formData, blessings: next });
  };

  // Apply parsed data from raw text into structured fields
  const applyParsedToFields = () => {
    const parsed = parseRawGreentext(formData.rawPastedText || "");
    onFormChange({
      ...formData,
      volumeNumber: parsed.volumeNumber ?? "",
      title: parsed.title ?? "",
      bodyText: (parsed.bodyLines || []).join("\n"),
      blessingIntro: parsed.blessingIntro ?? "",
      blessings: parsed.blessings || [],
      dream: parsed.dream ?? "",
      edition: parsed.edition ?? "",
    });
  };

  return (
    <form onSubmit={onSubmit} className="mb-8 p-6" style={{ color: "var(--color-text-main)" }}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* LEFT COLUMN: Raw Text & Fields */}
        <div className="lg:col-span-7 space-y-6">
          {/* Raw Text */}
          <div>
            <label htmlFor="rawPastedText" className="block text-sm font-medium text-text-secondary mb-2">
              Raw Greentext Content
            </label>
            <textarea
              id="rawPastedText"
              name="rawPastedText"
              value={formData.rawPastedText || ""}
              onChange={handleChange}
              className="w-full h-[200px] p-3 rounded font-mono text-sm focus:outline-none"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
            <div className="mt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={applyParsedToFields}
                className="px-3 py-1.5 text-xs rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
              >
                Apply Parsed Fields
              </button>
              <details className="text-xs relative">
                <summary className="cursor-pointer text-text-secondary">Show JSON Preview</summary>
                <pre
                  className="mt-2 w-[400px] h-[300px] p-3 rounded text-xs overflow-auto absolute right-0 z-10 shadow-lg border custom-scrollbar"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-primary)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {JSON.stringify(parsedPreview, null, 2)}
                </pre>
              </details>
            </div>
          </div>

          {/* Structured Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Volume Number</label>
              <input
                type="number"
                name="volumeNumber"
                value={formData.volumeNumber || ""}
                onChange={handleChange}
                className="w-full p-2 rounded"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                className="w-full p-2 rounded"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Blessing Intro (Life Is…)</label>
              <input
                type="text"
                name="blessingIntro"
                value={formData.blessingIntro || ""}
                onChange={handleChange}
                className="w-full p-2 rounded"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">Body</label>
            <textarea
              name="bodyText"
              value={formData.bodyText || ""}
              onChange={handleChange}
              rows={12}
              className="w-full p-2 rounded font-mono text-sm"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
          </div>

          {/* Dream */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">Dream</label>
            <textarea
              name="dream"
              value={formData.dream || ""}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 rounded"
              style={{
                backgroundColor: "var(--color-bg)",
                border: "1px solid var(--color-primary)",
                color: "var(--color-text-main)",
              }}
            />
          </div>

          {/* Status & Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div>
              <label htmlFor="status" className="mr-2 text-text-secondary">
                Status:
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || "draft"}
                onChange={handleChange}
                className="p-2 rounded focus:outline-none"
                style={{
                  backgroundColor: "var(--color-bg)",
                  border: "1px solid var(--color-primary)",
                  color: "var(--color-text-main)",
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-lg transition duration-300 border"
              style={{
                backgroundColor: "var(--color-primary)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-on-primary)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Saving..." : submitButtonText}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Blessings (Sticky) */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 flex flex-col" style={{ maxHeight: "calc(100vh - 100px)" }}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-text-secondary">
                Blessings (per-volume)
                {missingFromMaster?.length > 0 && (
                  <span className="ml-2 text-[10px] text-amber-300">{missingFromMaster.length} missing from master</span>
                )}
              </label>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <Link
                  to="/admin/blessings"
                  target="_blank"
                  className="px-2 py-1 text-[10px] rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
                >
                  Manage master
                </Link>
                <button
                  type="button"
                  onClick={splitAllBlessings}
                  title="Split all names with '– ' or '(...)' into name + description"
                  className="px-2 py-1 text-[10px] rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
                >
                  Split All
                </button>
                <button
                  type="button"
                  onClick={addBlessing}
                  className="px-2 py-1 text-[10px] rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Missing master blessings panel */}
            {(missingFromMaster?.length > 0 || masterError) && (
              <div className="mb-3 p-2 rounded border border-amber-600 bg-amber-900/20 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-amber-200">
                    {masterError ? (
                      <span>{masterError}</span>
                    ) : (
                      <span>
                        Missing from library: <strong>{missingFromMaster.length}</strong>
                      </span>
                    )}
                  </div>
                  {!masterError && (
                    <button
                      type="button"
                      onClick={addAllMissingFromMaster}
                      className="px-2 py-0.5 text-[11px] rounded bg-amber-700 hover:bg-amber-600 border border-amber-500 text-white"
                    >
                      Add all
                    </button>
                  )}
                </div>
                {!masterError && (
                  <div className="mt-2 grid grid-cols-1 gap-1 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {missingFromMaster.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between text-[11px] rounded px-2 py-1"
                        style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-primary)" }}
                      >
                        <span className="truncate mr-2">{m.name}</span>
                        <button
                          type="button"
                          onClick={() => addFromMaster(m)}
                          className="px-2 py-0.5 text-[10px] rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {blessings.length === 0 && (
                <div className="text-xs text-text-secondary opacity-70">No blessings yet. Click Add Blessing to start.</div>
              )}
              {blessings.map((b, i) => (
                <div
                  key={i}
                  className="group mb-1 border-l-2 border-white/5 hover:border-primary bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                >
                  {/* Top Row: Index, Name, Actions */}
                  <div className="flex items-center gap-2 p-1.5">
                    <span className="text-[9px] font-mono text-white/20 select-none w-4 text-right">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    
                    <input
                      className="flex-1 bg-transparent text-xs font-medium text-gray-200 placeholder-white/10 focus:text-primary outline-none transition-colors"
                      placeholder="Blessing name"
                      value={b.item || ""}
                      onChange={(e) => updateBlessing(i, "item", e.target.value)}
                    />

                    {/* Actions (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => splitBlessingAtIndex(i)}
                        className="p-1 text-white/30 hover:text-primary hover:bg-white/5 rounded transition-colors"
                        title="Split Name/Description"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                        </svg>
                      </button>
                      <div className="w-px h-3 bg-white/10 mx-0.5"></div>
                      <button
                        type="button"
                        className="p-1 text-white/30 hover:text-primary hover:bg-white/5 rounded transition-colors"
                        onClick={() => moveBlessing(i, -1)}
                        title="Move Up"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="p-1 text-white/30 hover:text-primary hover:bg-white/5 rounded transition-colors"
                        onClick={() => moveBlessing(i, 1)}
                        title="Move Down"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="p-1 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        onClick={() => removeBlessing(i)}
                        title="Remove"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Description */}
                  <div className="mx-2 mb-1.5 pt-1.5 border-t border-white/5">
                    <textarea
                      className="w-full bg-transparent text-xs text-gray-300 placeholder-white/20 outline-none resize-none leading-snug"
                      placeholder="Description..."
                      rows={2}
                      value={b.description || ""}
                      onChange={(e) => updateBlessing(i, "description", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default VolumeForm;
