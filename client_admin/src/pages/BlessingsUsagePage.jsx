import { useEffect, useMemo, useState } from "react";
import Widget from "../components/ui/Widget";
import api from "../services/api";

export default function BlessingsUsagePage() {
  const [volumes, setVolumes] = useState([]);
  const [blessings, setBlessings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBlessing, setSelectedBlessing] = useState(null);
  const [search, setSearch] = useState("");
  // Editing state: volumeId -> { index -> { item, description } }
  const [edits, setEdits] = useState({});
  // Full volume preview modal state
  const [previewVol, setPreviewVol] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [vRes, bRes] = await Promise.all([api.get("/admin/volumes"), api.get("/admin/blessings")]);
        setVolumes(vRes.data.data || []);
        setBlessings((bRes.data.items || []).filter((b) => b.active));
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allVolumeNumbers = useMemo(() => {
    const nums = volumes.map((v) => v.volumeNumber).sort((a, b) => a - b);
    return nums;
  }, [volumes]);

  const usageIndex = useMemo(() => {
    // Map blessing item -> { volumes: Map<volumeNumber, entries[]> }
    // entry shape: { volumeId, index, item, description, context }
    const map = new Map();
    for (const v of volumes) {
      const vn = v.volumeNumber;
      const entries = Array.isArray(v.blessings) ? v.blessings : [];
      entries.forEach((entry, idx) => {
        const key = (entry.item || "").trim();
        if (!key) return;
        if (!map.has(key)) map.set(key, { volumes: new Map() });
        const bucket = map.get(key);
        if (!bucket.volumes.has(vn)) bucket.volumes.set(vn, []);
        bucket.volumes.get(vn).push({
          volumeId: v._id,
          index: idx,
          item: entry.item || "",
          description: entry.description || "",
          context: entry.context || "",
        });
      });
    }
    return map;
  }, [volumes]);

  const blessingList = useMemo(() => {
    const items = [];
    const ensureSet = new Set();
    // Include all active blessing definitions
    for (const b of blessings) {
      const key = b.name || b.key;
      if (!ensureSet.has(key)) {
        const used = usageIndex.get(key);
        items.push({ key, def: b, usedVolumes: used ? used.volumes : new Map() });
        ensureSet.add(key);
      }
    }
    // Also include any used blessing names that may not have a definition
    for (const key of usageIndex.keys()) {
      if (!ensureSet.has(key)) {
        items.push({ key, def: null, usedVolumes: usageIndex.get(key).volumes });
        ensureSet.add(key);
      }
    }
    // Sort by name
    return items.sort((a, b) => a.key.localeCompare(b.key));
  }, [blessings, usageIndex]);

  const filteredBlessings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return blessingList;
    return blessingList.filter((b) => b.key.toLowerCase().includes(q));
  }, [blessingList, search]);

  const VolumePreview = ({ vol }) => {
    return (
      <div className="p-3 text-xs max-w-md space-y-2" style={{ background: "var(--color-surface)" }}>
        <div className="font-semibold text-text-main">
          Volume {vol.volumeNumber} – {vol.title}
        </div>
        <div className="text-text-secondary">Blessing Intro: {vol.blessingIntro || "—"}</div>
        <div className="max-h-48 overflow-auto border rounded p-2" style={{ borderColor: "var(--color-primary)" }}>
          {(vol.bodyLines || []).map((l, i) => (
            <div key={i} className="whitespace-pre-wrap text-text-main">
              {l}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  const setEntryEdit = (volumeId, index, patch) =>
    setEdits((prev) => ({
      ...prev,
      [volumeId]: { ...(prev[volumeId] || {}), [index]: { ...(prev[volumeId]?.[index] || {}), ...patch } },
    }));

  const getEntryValue = (entry, volumeId) => {
    const e = edits[volumeId]?.[entry.index];
    return { item: e?.item ?? entry.item, description: e?.description ?? entry.description };
  };

  const splitParentheses = (text) => {
    // 1) Prefer split by en dash "– " if present: "Name – Description"
    const dashIdx = text.indexOf("– ");
    if (dashIdx !== -1) {
      const left = text.slice(0, dashIdx).trim();
      const right = text.slice(dashIdx + 2).trim(); // skip the en dash and following space
      return { item: left, description: right };
    }
    // 2) Fallback: split by parentheses "Name (Description)"
    const m = text.match(/^(.*?)(?:\s*\((.*)\))?$/);
    if (!m) return { item: text, description: "" };
    return { item: (m[1] || "").trim(), description: (m[2] || "").trim() };
  };

  const saveVolumeEdits = async (volumeId) => {
    try {
      const vol = volumes.find((v) => v._id === volumeId);
      if (!vol) return;
      const volEdits = edits[volumeId] || {};
      const updatedBlessings = (vol.blessings || []).map((b, idx) => {
        if (volEdits[idx]) {
          return {
            ...b,
            item: (volEdits[idx].item ?? b.item) || "",
            description: volEdits[idx].description ?? b.description ?? "",
          };
        }
        return b;
      });
      const res = await api.put(`/admin/volumes/${volumeId}`, { blessings: updatedBlessings });
      // Update local volumes state with the returned doc if present, else patch current
      const updated = res.data?.data || { ...vol, blessings: updatedBlessings };
      setVolumes((prev) => prev.map((v) => (v._id === volumeId ? updated : v)));
      // Clear edits for this volume
      setEdits((prev) => {
        const copy = { ...prev };
        delete copy[volumeId];
        return copy;
      });
    } catch (e) {
      alert(e.response?.data?.message || "Failed to save volume edits");
    }
  };

  const saveAllForBlessing = async () => {
    if (!selectedBlessing) return;
    // Collect unique volumeIds from entries
    const volIds = new Set();
    selectedBlessing.usedVolumes.forEach((entries) => entries.forEach((entry) => volIds.add(entry.volumeId)));
    for (const volumeId of volIds) {
      await saveVolumeEdits(volumeId);
    }
    alert("Saved edits across all volumes for this blessing.");
  };

  return (
    <div className="space-y-3 blessings-usage-page" style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <h1 className="text-2xl font-bold text-primary">Blessings Usage</h1>
      <div className="grid grid-cols-12 gap-3 h-full overflow-hidden min-h-0">
        {/* Left: Blessings selector (aligned with right; no vertical offset) */}
        <div className="col-span-12 lg:col-span-3" style={{ height: "calc(100vh - 114px)" }}>
          <div
            className="rounded-lg border p-3 flex flex-col gap-2 h-full min-h-0"
            style={{ borderColor: "var(--color-primary)", background: "var(--color-surface)" }}
          >
            <div className="text-sm font-semibold">Blessings</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search blessings…"
              className="w-full rounded border px-2 py-1 text-xs"
              style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
            />
            <div className="text-[11px] text-text-secondary">{filteredBlessings.length} results</div>
            <div
              className="overflow-y-auto flex-1 pr-1 space-y-1 min-h-0 pb-10"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {filteredBlessings.map((b) => {
                const usedNums = Array.from(b.usedVolumes.keys()).sort((a, z) => a - z);
                const missingNums = allVolumeNumbers.filter((n) => !b.usedVolumes.has(n));
                const active = selectedBlessing?.key === b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => setSelectedBlessing(b)}
                    className="w-full text-left px-3 py-2 rounded border text-sm transition"
                    style={{
                      background: active ? "var(--color-surface)" : "var(--color-background)",
                      borderColor: "var(--color-primary)",
                      color: active ? "var(--color-primary)" : "var(--color-text-main)",
                    }}
                  >
                    <div className="truncate">{b.key}</div>
                    <div className="flex items-center gap-2 text-[10px] mt-1 text-text-secondary">
                      <span>used {usedNums.length}</span>
                      {missingNums.length > 0 && <span className="text-yellow-300">missing {missingNums.length}</span>}
                    </div>
                  </button>
                );
              })}
              {!filteredBlessings.length && (
                <div className="text-xs text-text-secondary py-4 text-center">No blessings found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Detail editor (volumes fixed, entries scroll) */}
        <div className="col-span-12 lg:col-span-9 min-h-0 overflow-hidden">
          {!selectedBlessing ? (
            <div
              className="rounded-lg border p-6 text-sm text-text-secondary"
              style={{ borderColor: "var(--color-primary)", background: "var(--color-surface)" }}
            >
              Select a blessing from the left to view volumes and edit entries.
            </div>
          ) : (
            <Widget title={`Blessing: ${selectedBlessing.key}`}>
              <div className="flex flex-col min-h-0" style={{ height: "calc(100vh - 54px)" }}>
                <div className="shrink-0 space-y-3">
                  <div className="text-xs text-text-secondary">
                    Click a volume number to preview; hover to see details. Missing volumes are highlighted.
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {allVolumeNumbers.map((vn) => {
                      const used = selectedBlessing.usedVolumes.has(vn);
                      const vol = volumes.find((v) => v.volumeNumber === vn);
                      return (
                        <div key={vn} className="relative">
                          <div
                            className={`px-2 py-1 text-xs rounded border ${
                              used ? "bg-primary/20" : "bg-red-900/20 border-red-700/40"
                            }`}
                            style={{ borderColor: used ? "var(--color-primary)" : undefined }}
                          >
                            <div className="group inline-block">
                              <button
                                type="button"
                                className="underline"
                                title="Click to preview full volume"
                                onClick={() => vol && setPreviewVol(vol)}
                              >
                                Vol {vn}
                              </button>
                              <div className="absolute z-10 hidden group-hover:block mt-1">
                                <div
                                  className="shadow-lg rounded border"
                                  style={{ borderColor: "var(--color-primary)" }}
                                >
                                  {vol ? <VolumePreview vol={vol} /> : <div className="p-2 text-xs">No data</div>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per-volume entries for this blessing (editable) */}
                <div className="mt-3 flex-1 overflow-y-auto min-h-0 pb-12" style={{ WebkitOverflowScrolling: "touch" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold">Entries</div>
                    <button
                      onClick={saveAllForBlessing}
                      className="px-3 py-1 rounded border text-xs hover:opacity-90"
                      style={{ borderColor: "var(--color-primary)" }}
                    >
                      Save All Changes
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Array.from(selectedBlessing.usedVolumes.entries())
                      .sort((a, b) => a[0] - b[0])
                      .map(([vn, entries]) => {
                        const volumeId = entries[0]?.volumeId;
                        const vol = volumes.find((v) => v.volumeNumber === vn);
                        return (
                          <div
                            key={vn}
                            className="rounded border p-2 space-y-2"
                            style={{ borderColor: "var(--color-primary)" }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-semibold">
                                Volume {vn}
                                {vol?.title ? ` – ${vol.title}` : ""}
                              </div>
                              {volumeId && (
                                <button
                                  onClick={() => saveVolumeEdits(volumeId)}
                                  className="px-2 py-1 rounded border text-[11px] hover:opacity-90"
                                  style={{ borderColor: "var(--color-primary)" }}
                                >
                                  Save Volume
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {entries.map((entry) => {
                                const { item, description } = getEntryValue(entry, entry.volumeId);
                                return (
                                  <div
                                    key={`${entry.volumeId}-${entry.index}`}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-2"
                                  >
                                    <div>
                                      <label className="text-[10px] text-text-secondary">Item (Blessing Name)</label>
                                      <div className="flex gap-2 items-center mt-1">
                                        <input
                                          value={item}
                                          onChange={(e) =>
                                            setEntryEdit(entry.volumeId, entry.index, { item: e.target.value })
                                          }
                                          className="w-full rounded border px-2 py-1 text-xs"
                                          style={{
                                            background: "var(--color-background)",
                                            borderColor: "var(--color-primary)",
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="px-2 py-1 rounded border text-[10px]"
                                          style={{ borderColor: "var(--color-primary)" }}
                                          onClick={() => {
                                            const split = splitParentheses(item);
                                            setEntryEdit(entry.volumeId, entry.index, split);
                                          }}
                                          title="Split 'Name – desc' or 'Name (desc)' into fields"
                                        >
                                          Split
                                        </button>
                                      </div>
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="text-[10px] text-text-secondary">Description</label>
                                      <input
                                        value={description}
                                        onChange={(e) =>
                                          setEntryEdit(entry.volumeId, entry.index, { description: e.target.value })
                                        }
                                        className="w-full rounded border px-2 py-1 text-xs mt-1"
                                        style={{
                                          background: "var(--color-background)",
                                          borderColor: "var(--color-primary)",
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    {!selectedBlessing.usedVolumes.size && (
                      <div className="text-xs text-text-secondary">No entries.</div>
                    )}
                  </div>
                </div>
              </div>
            </Widget>
          )}
        </div>
      </div>
      {/* Full volume preview modal */}
      {previewVol && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewVol(null)}
        >
          <div
            className="max-w-5xl w-full max-h-[85vh] overflow-auto rounded-lg border shadow-2xl"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--color-primary)" }}
            >
              <div className="text-lg font-semibold text-primary">
                Volume {previewVol.volumeNumber} – {previewVol.title}
              </div>
              <button
                className="px-3 py-1.5 rounded border text-sm hover:opacity-90"
                style={{ borderColor: "var(--color-primary)" }}
                onClick={() => setPreviewVol(null)}
              >
                Close
              </button>
            </div>
            <div className="p-4 space-y-3">
              {previewVol.blessingIntro && (
                <div className="text-sm text-text-secondary">{previewVol.blessingIntro}</div>
              )}
              <div className="border rounded p-3 space-y-1" style={{ borderColor: "var(--color-primary)" }}>
                {(previewVol.bodyLines || []).map((l, i) => (
                  <div key={i} className="font-mono text-sm" style={{ color: "#7CFC00" }}>
                    &gt; {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
