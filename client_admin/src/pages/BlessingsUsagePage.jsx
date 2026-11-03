import { useEffect, useMemo, useState } from "react";
import { Scissors } from "lucide-react";
import Widget from "../components/ui/Widget";
import api from "../services/api";
import { planDashSplits } from "../utils/blessingSplit";

export default function BlessingsUsagePage() {
  const [volumes, setVolumes] = useState([]);
  const [blessings, setBlessings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBlessing, setSelectedBlessing] = useState(null);
  const [search, setSearch] = useState("");
  // Editing state: volumeId -> { index -> { item, description } }
  const [edits, setEdits] = useState({});
  // Volume shown in the right-hand preview pane
  const [previewVol, setPreviewVol] = useState(null);
  const [splitting, setSplitting] = useState(false);

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

  const volumesAsc = useMemo(() => [...volumes].sort((a, b) => a.volumeNumber - b.volumeNumber), [volumes]);

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

  const dashSplitPlans = planDashSplits(volumes);
  const dashSplitCount = dashSplitPlans.reduce((sum, plan) => sum + plan.changed, 0);

  const splitAllDashTitles = async () => {
    // Bulk split works from saved data, so pending field edits would be overwritten or re-apply stale names.
    if (Object.keys(edits).length > 0) {
      alert("Save or discard your unsaved entry edits before splitting.");
      return;
    }
    const ok = window.confirm(
      `Split ${dashSplitCount} blessing entr${dashSplitCount === 1 ? "y" : "ies"} across ${dashSplitPlans.length} volume${
        dashSplitPlans.length === 1 ? "" : "s"
      }?

Text after the first "–" moves into the description. This saves immediately.`,
    );
    if (!ok) return;

    setSplitting(true);
    const failed = [];
    for (const plan of dashSplitPlans) {
      try {
        const res = await api.put(`/admin/volumes/${plan.volume._id}`, { blessings: plan.blessings });
        const updated = res.data?.data || { ...plan.volume, blessings: plan.blessings };
        setVolumes((prev) => prev.map((v) => (v._id === plan.volume._id ? updated : v)));
      } catch (e) {
        failed.push(plan.volume.volumeNumber);
        console.error("Failed to split blessings for volume", plan.volume.volumeNumber, e);
      }
    }
    setSplitting(false);
    // Blessing names changed, so the selected blessing's usage data is stale.
    setSelectedBlessing(null);
    setPreviewVol(null);
    alert(
      failed.length
        ? `Split saved for ${dashSplitPlans.length - failed.length} volume(s). Failed: Vol ${failed.join(", ")}.`
        : `Split ${dashSplitCount} entries across ${dashSplitPlans.length} volume(s).`,
    );
  };

  return (
    <div className="space-y-3 blessings-usage-page" style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Blessings Usage</h1>
        <button
          type="button"
          onClick={splitAllDashTitles}
          disabled={splitting || dashSplitCount === 0}
          className="dash-btn"
          title='Move everything after "–" in a blessing name into its description, for every volume'
        >
          <Scissors size={13} aria-hidden="true" />
          {splitting ? "Splitting…" : `Split "–" titles (${dashSplitCount})`}
        </button>
      </div>
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
        <div className="col-span-12 lg:col-span-5 min-h-0 overflow-hidden">
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
                {/* Per-volume entries for this blessing (editable) */}
                <div className="flex-1 overflow-y-auto min-h-0 pb-12" style={{ WebkitOverflowScrolling: "touch" }}>
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

        {/* Right: all volumes (titles) + preview of the selected one */}
        <div className="col-span-12 lg:col-span-4 min-h-0" style={{ height: "calc(100vh - 114px)" }}>
          <div className="dashboard-card flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-white/[0.08] bg-surface">
            <div className="dashboard-card-heading flex items-center justify-between border-b border-white/[0.08] px-4 py-2.5">
              <h3 className="dashboard-card-title">Volumes</h3>
              <span className="text-[11px] text-text-secondary tabular-nums">{volumesAsc.length}</span>
            </div>

            <ul className="dash-rows max-h-[40%] shrink-0 overflow-y-auto px-2 py-1">
              {volumesAsc.map((vol) => {
                const active = previewVol?._id === vol._id;
                const missing = selectedBlessing && !selectedBlessing.usedVolumes.has(vol.volumeNumber);
                return (
                  <li key={vol._id}>
                    <button
                      type="button"
                      onClick={() => setPreviewVol(vol)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                        active ? "bg-white/[0.06] text-text-main" : "text-text-secondary hover:bg-white/[0.03] hover:text-text-main"
                      }`}
                    >
                      <span className="w-12 shrink-0 tabular-nums text-text-secondary">Vol {vol.volumeNumber}</span>
                      <span className="flex-1 truncate">{vol.title || "Untitled"}</span>
                      {missing && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400"
                          title={`Missing "${selectedBlessing.key}"`}
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/[0.08] p-4">
              {!previewVol ? (
                <p className="dash-empty">Select a volume to preview it here.</p>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="dashboard-label">Volume {previewVol.volumeNumber}</p>
                    <h4 className="text-sm font-semibold text-text-main">{previewVol.title || "Untitled"}</h4>
                  </div>
                  {previewVol.blessingIntro && (
                    <p className="text-xs text-text-secondary">{previewVol.blessingIntro}</p>
                  )}
                  <div className="space-y-1">
                    {(previewVol.bodyLines || []).map((l, i) => (
                      <div key={i} className="whitespace-pre-wrap font-mono text-xs" style={{ color: "#7CFC00" }}>
                        &gt; {l}
                      </div>
                    ))}
                    {!previewVol.bodyLines?.length && <p className="text-xs text-text-secondary">No story lines.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
