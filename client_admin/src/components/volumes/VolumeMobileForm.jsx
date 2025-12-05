import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { parseRawGreentext } from "../../utils/greentextParser";
import { listBlessingDefs } from "../../services/blessingsService";

const VolumeMobileForm = ({ formData, onFormChange, onSubmit, loading, submitButtonText = "Submit" }) => {
  const [parsedPreview, setParsedPreview] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem("tae.volumes.mobile.activeTab") || "raw";
    } catch {
      return "raw";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("tae.volumes.mobile.activeTab", activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setParsedPreview(parseRawGreentext(formData.rawPastedText || ""));
    }, 300);
    return () => clearTimeout(handler);
  }, [formData.rawPastedText]);

  const handleChange = (e) => {
    onFormChange({ ...formData, [e.target.name]: e.target.value });
  };

  const blessings = Array.isArray(formData.blessings) ? formData.blessings : [];
  const updateBlessing = (idx, field, value) => {
    const next = [...blessings];
    next[idx] = { item: "", description: "", context: "", ...next[idx], [field]: value };
    onFormChange({ ...formData, blessings: next });
  };

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
    if (presentNameSet.has(item.trim().toLowerCase())) return;
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
    setActiveTab("fields"); // Switch to fields tab after applying
  };

  return (
    <form onSubmit={onSubmit} className="pb-4" style={{ color: "var(--color-text-main)" }}>
      {/* Tabs */}
      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-background pt-2 pb-2 mb-4 border-b border-white/10 overflow-x-auto flex gap-2 scrollbar-hide">
        {["raw", "preview", "fields", "blessings"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab
                ? "bg-primary text-white"
                : "bg-surface border border-white/10 text-text-secondary hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "raw" && (
          <div className="space-y-3">
            <label htmlFor="rawPastedText" className="block text-sm font-medium text-text-secondary">
              Raw Greentext Content
            </label>
            <textarea
              id="rawPastedText"
              name="rawPastedText"
              value={formData.rawPastedText || ""}
              onChange={handleChange}
              placeholder="Paste raw text here..."
              className="w-full h-[300px] p-3 rounded font-mono text-sm focus:outline-none bg-black/20 border border-white/10 text-white resize-none"
            />
            <button
              type="button"
              onClick={applyParsedToFields}
              className="w-full py-2 rounded bg-primary/20 hover:bg-primary/30 border border-primary/40 text-main text-sm font-medium"
            >
              Parse & Apply to Fields
            </button>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">Live JSON Preview</label>
            <pre className="w-full h-[350px] p-3 rounded text-xs overflow-auto bg-black/20 border border-white/10 text-text-secondary">
              {JSON.stringify(parsedPreview, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === "fields" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Volume Number</label>
              <input
                type="number"
                name="volumeNumber"
                value={formData.volumeNumber || ""}
                onChange={handleChange}
                className="w-full p-2 rounded bg-black/20 border border-white/10 text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                className="w-full p-2 rounded bg-black/20 border border-white/10 text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Blessing Intro</label>
              <input
                type="text"
                name="blessingIntro"
                value={formData.blessingIntro || ""}
                onChange={handleChange}
                className="w-full p-2 rounded bg-black/20 border border-white/10 text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Body Text</label>
              <textarea
                name="bodyText"
                value={formData.bodyText || ""}
                onChange={handleChange}
                rows={8}
                className="w-full p-2 rounded font-mono text-sm bg-black/20 border border-white/10 text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Dream</label>
              <textarea
                name="dream"
                value={formData.dream || ""}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 rounded bg-black/20 border border-white/10 text-white focus:border-primary outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === "blessings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Blessings ({blessings.length})</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={splitAllBlessings}
                  className="px-2 py-1 text-xs rounded bg-surface border border-white/20 text-white"
                >
                  Split All
                </button>
                <button
                  type="button"
                  onClick={addBlessing}
                  className="px-2 py-1 text-xs rounded bg-primary text-white"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Missing Master Blessings */}
            {(missingFromMaster?.length > 0 || masterError) && (
              <div className="p-2 rounded border border-amber-600/50 bg-amber-900/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-amber-200">
                    {masterError || `Missing: ${missingFromMaster.length}`}
                  </span>
                  {!masterError && (
                    <button
                      type="button"
                      onClick={addAllMissingFromMaster}
                      className="px-2 py-0.5 text-[10px] rounded bg-amber-700 text-white"
                    >
                      Add All
                    </button>
                  )}
                </div>
                {!masterError && (
                  <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                    {missingFromMaster.map((m) => (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => addFromMaster(m)}
                        className="px-2 py-1 text-[10px] rounded bg-surface border border-amber-500/30 text-amber-100 truncate max-w-[120px]"
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blessings List */}
            <div className="space-y-3">
              {blessings.length === 0 && (
                <div className="text-center py-4 text-xs text-text-secondary">No blessings added.</div>
              )}
              {blessings.map((b, i) => (
                <div key={i} className="p-3 rounded bg-surface border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">#{i + 1}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlessing(i, -1)}
                        className="p-1 rounded hover:bg-white/10 text-text-secondary"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlessing(i, 1)}
                        className="p-1 rounded hover:bg-white/10 text-text-secondary"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlessing(i)}
                        className="p-1 rounded hover:bg-red-500/20 text-red-400 text-xs px-2"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-2 rounded bg-black/20 border border-white/10 text-white text-xs"
                      placeholder="Name"
                      value={b.item || ""}
                      onChange={(e) => updateBlessing(i, "item", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => splitBlessingAtIndex(i)}
                      className="px-2 rounded border border-white/10 text-xs text-text-secondary"
                    >
                      Split
                    </button>
                  </div>
                  <input
                    className="w-full p-2 rounded bg-black/20 border border-white/10 text-white text-xs"
                    placeholder="Description"
                    value={b.description || ""}
                    onChange={(e) => updateBlessing(i, "description", e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer Action */}
      <div
        className="fixed p-4 bg-surface border-t border-white/10 flex items-center gap-3 z-20 transition-[left,right,bottom] duration-300"
        style={{
          left: "var(--left-sidebar-width, 0px)",
          right: "var(--right-sidebar-width, 0px)",
          bottom: "var(--bottom-nav-height, 0px)",
        }}
      >
        <select
          name="status"
          value={formData.status || "draft"}
          onChange={handleChange}
          className="bg-black/20 border border-white/10 text-white text-sm rounded px-3 py-2 outline-none"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-white font-bold py-2 rounded-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? "Saving..." : submitButtonText}
        </button>
      </div>
    </form>
  );
};

export default VolumeMobileForm;
