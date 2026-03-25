import { Fragment, useEffect, useMemo, useState } from "react";
import {
  listBlessingDefs,
  createBlessingDef,
  updateBlessingDef,
  deleteBlessingDef,
} from "../services/blessingsService";
import { fetchVolumes, updateVolume } from "./volumeFunctionality/volumeApi";

const emptyForm = { key: "", name: "", context: "", defaultDescription: "", tags: "", active: true, index: 0 };

const toSlug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const sortByIndex = (list = []) =>
  [...list].sort((a, b) => {
    const ai = Number.isFinite(Number(a?.index)) ? Number(a.index) : 0;
    const bi = Number.isFinite(Number(b?.index)) ? Number(b.index) : 0;
    if (ai !== bi) return ai - bi;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });

const emptyInlineForm = { name: "", key: "", defaultDescription: "", context: "", tags: "", active: true };

export default function BlessingsAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [keyTouched, setKeyTouched] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [insertAfterId, setInsertAfterId] = useState(null); // null | "__TOP__" | "__END__" | blessingId
  const [inlineForm, setInlineForm] = useState(emptyInlineForm);
  const [inlineKeyTouched, setInlineKeyTouched] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [inlineSaving, setInlineSaving] = useState(false);
  const [usageModalItem, setUsageModalItem] = useState(null);
  const [updatingVolumeIds, setUpdatingVolumeIds] = useState(new Set());
  const [bulkAddingMissing, setBulkAddingMissing] = useState(false);
  const [modalInsertIndex, setModalInsertIndex] = useState("0");
  const [modalDescription, setModalDescription] = useState("");
  const [hoverVolumeId, setHoverVolumeId] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await listBlessingDefs();
      setItems(Array.isArray(data) ? data : []);
      const vols = await fetchVolumes();
      setVolumes(vols || []);
    } catch (e) {
      setError(e?.message || "Failed to load blessings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const orderedItems = useMemo(() => sortByIndex(items), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orderedItems;
    return orderedItems.filter((x) =>
      [x.key, x.name, x.context, x.defaultDescription, (x.tags || []).join(", ")]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [orderedItems, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setKeyTouched(false);
    setFormError("");
    setEditingId(null);
  };

  const normalizedKeySet = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item._id === editingId) return;
      const key = normalize(item.key);
      if (key) set.add(key);
    });
    return set;
  }, [items, editingId]);

  const createOnlyKeySet = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const key = normalize(item.key);
      if (key) set.add(key);
    });
    return set;
  }, [items]);

  const usageByBlessing = useMemo(() => {
    const map = new Map();
    (volumes || []).forEach((v) => {
      (v.blessings || []).forEach((b) => {
        const blessingItem = normalize(b?.item);
        if (!blessingItem) return;
        if (!map.has(blessingItem)) map.set(blessingItem, []);
        map.get(blessingItem).push(v);
      });
    });
    return map;
  }, [volumes]);

  const getUsageCount = (item) => {
    const byName = usageByBlessing.get(normalize(item?.name));
    const byKey = usageByBlessing.get(normalize(item?.key));
    const uniq = new Set([...(byName || []), ...(byKey || [])].map((v) => v?._id).filter(Boolean));
    return uniq.size;
  };

  const getMissingVolumes = (item) => {
    const blessingNames = new Set([normalize(item?.name), normalize(item?.key)].filter(Boolean));
    return (volumes || []).filter((v) => {
      const present = new Set((v?.blessings || []).map((b) => normalize(b?.item)).filter(Boolean));
      for (const name of blessingNames) {
        if (present.has(name)) return false;
      }
      return true;
    });
  };

  const getUsageTooltip = (item) => {
    const missing = getMissingVolumes(item);
    if (!missing.length) return "Included in all volumes.";
    const lines = missing
      .map((v) => {
        const num = Number.isFinite(Number(v?.volumeNumber)) ? `V${v.volumeNumber}` : "Unnumbered";
        const title = String(v?.title || "Untitled").trim();
        return `${num}: ${title}`;
      })
      .join("\n");
    return `Missing from ${missing.length} volume${missing.length === 1 ? "" : "s"}:\n${lines}`;
  };

  const modalMissingVolumes = useMemo(() => {
    if (!usageModalItem) return [];
    return getMissingVolumes(usageModalItem);
  }, [usageModalItem, volumes]);

  const hoveredModalVolume = useMemo(() => {
    if (!modalMissingVolumes.length) return null;
    const byId = modalMissingVolumes.find((v) => v._id === hoverVolumeId);
    return byId || modalMissingVolumes[0];
  }, [modalMissingVolumes, hoverVolumeId]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFormError("");
    try {
      const cleanName = form.name.trim();
      const cleanKey = toSlug(form.key);

      if (!cleanName) throw new Error("Name is required.");
      if (!cleanKey) throw new Error("Key is required.");
      if (!/^[a-z0-9-]+$/.test(cleanKey)) {
        throw new Error("Key can only contain lowercase letters, numbers, and hyphens.");
      }
      if (normalizedKeySet.has(cleanKey)) {
        throw new Error("That key already exists. Use a different key.");
      }

      const payload = {
        key: cleanKey,
        name: cleanName,
        context: form.context || "",
        defaultDescription: form.defaultDescription || "",
        tags: String(form.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        active: !!form.active,
        index: Number(form.index) || 0,
      };
      if (editingId) {
        await updateBlessingDef(editingId, payload);
      } else {
        await createBlessingDef(payload);
      }
      resetForm();
      await fetchAll();
    } catch (e) {
      setFormError(e?.response?.data?.message || e?.message || "Failed to save blessing");
    } finally {
      setLoading(false);
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      key: item.key || "",
      name: item.name || "",
      context: item.context || "",
      defaultDescription: item.defaultDescription || "",
      tags: (item.tags || []).join(", "),
      active: !!item.active,
      index: item.index || 0,
    });
    setKeyTouched(true);
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this blessing definition?")) return;
    try {
      await deleteBlessingDef(id);
      await fetchAll();
    } catch (e) {
      setError(e?.message || "Failed to delete");
    }
  };

  const quickToggleActive = async (item) => {
    try {
      await updateBlessingDef(item._id, { active: !item.active });
      await fetchAll();
    } catch (e) {
      setError(e?.message || "Failed to update blessing status");
    }
  };

  const onNameChange = (value) => {
    setForm((prev) => {
      if (editingId || keyTouched) return { ...prev, name: value };
      return { ...prev, name: value, key: toSlug(value) };
    });
  };

  const resetInline = () => {
    setInsertAfterId(null);
    setInlineForm(emptyInlineForm);
    setInlineKeyTouched(false);
    setInlineError("");
  };

  const openInlineAfter = (id) => {
    setInsertAfterId(id);
    setInlineForm(emptyInlineForm);
    setInlineKeyTouched(false);
    setInlineError("");
  };

  const onInlineNameChange = (value) => {
    setInlineForm((prev) => {
      if (inlineKeyTouched) return { ...prev, name: value };
      return { ...prev, name: value, key: toSlug(value) };
    });
  };

  const getInsertPosition = (afterId) => {
    if (afterId === "__TOP__") return 0;
    if (afterId === "__END__" || !afterId) return orderedItems.length;
    const anchorIndex = orderedItems.findIndex((x) => x._id === afterId);
    if (anchorIndex < 0) return orderedItems.length;
    return anchorIndex + 1;
  };

  const persistSequentialIndexes = async (orderedList) => {
    const updates = [];
    orderedList.forEach((it, idx) => {
      if (!it?._id) return;
      if (Number(it.index) !== idx) updates.push(updateBlessingDef(it._id, { index: idx }));
    });
    if (updates.length) await Promise.all(updates);
  };

  const submitInlineInsert = async () => {
    setInlineSaving(true);
    setInlineError("");
    setError("");
    try {
      const cleanName = inlineForm.name.trim();
      const cleanKey = toSlug(inlineForm.key);
      if (!cleanName) throw new Error("Inline insert requires a blessing name.");
      if (!cleanKey) throw new Error("Inline insert requires a key.");
      if (!/^[a-z0-9-]+$/.test(cleanKey)) {
        throw new Error("Inline key can only contain lowercase letters, numbers, and hyphens.");
      }
      if (createOnlyKeySet.has(cleanKey)) {
        throw new Error("That key already exists. Use a different key.");
      }

      const insertAt = getInsertPosition(insertAfterId);
      const created = await createBlessingDef({
        key: cleanKey,
        name: cleanName,
        context: inlineForm.context || "",
        defaultDescription: inlineForm.defaultDescription || "",
        tags: String(inlineForm.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        active: !!inlineForm.active,
        index: insertAt,
      });

      const nextOrder = [...orderedItems];
      nextOrder.splice(insertAt, 0, { ...created, index: insertAt });
      await persistSequentialIndexes(nextOrder);
      resetInline();
      await fetchAll();
    } catch (e) {
      setInlineError(e?.response?.data?.message || e?.message || "Failed to insert blessing");
    } finally {
      setInlineSaving(false);
    }
  };

  const openUsageModal = (item) => {
    setUsageModalItem(item);
    const idx = Number.isFinite(Number(item?.index)) ? Math.max(0, Number(item.index)) : 0;
    setModalInsertIndex(String(idx));
    setModalDescription(String(item?.defaultDescription || ""));
    setError("");
  };

  const closeUsageModal = () => {
    setUsageModalItem(null);
    setUpdatingVolumeIds(new Set());
    setBulkAddingMissing(false);
    setModalInsertIndex("0");
    setModalDescription("");
    setHoverVolumeId(null);
  };

  const addBlessingToVolume = async (blessingItem, volume, options = {}) => {
    const normalizedName = normalize(blessingItem?.name);
    const normalizedKey = normalize(blessingItem?.key);
    const existing = (volume?.blessings || []).map((b) => normalize(b?.item));
    if ((normalizedName && existing.includes(normalizedName)) || (normalizedKey && existing.includes(normalizedKey))) {
      return;
    }

    const currentBlessings = [...(volume?.blessings || [])];
    const requestedIndex = Number(options.insertIndex);
    const safeIndex = Number.isFinite(requestedIndex)
      ? Math.max(0, Math.min(requestedIndex, currentBlessings.length))
      : currentBlessings.length;
    const selectedDescription = String(options.description ?? blessingItem?.defaultDescription ?? "").trim();

    const newEntry = {
      item: String(blessingItem?.name || blessingItem?.key || "").trim(),
      description: selectedDescription,
      context: String(blessingItem?.context || "").trim(),
    };
    if (!newEntry.item) return;

    setUpdatingVolumeIds((prev) => new Set(prev).add(volume._id));
    try {
      const nextBlessings = [
        ...currentBlessings.slice(0, safeIndex),
        newEntry,
        ...currentBlessings.slice(safeIndex),
      ];
      await updateVolume(volume._id, { blessings: nextBlessings });
      const latest = await fetchVolumes();
      setVolumes(latest || []);
    } finally {
      setUpdatingVolumeIds((prev) => {
        const next = new Set(prev);
        next.delete(volume._id);
        return next;
      });
    }
  };

  const addToAllMissingVolumes = async () => {
    if (!usageModalItem || !modalMissingVolumes.length) return;
    setBulkAddingMissing(true);
    setError("");
    try {
      for (const vol of modalMissingVolumes) {
        await addBlessingToVolume(usageModalItem, vol, {
          insertIndex: modalInsertIndex,
          description: modalDescription,
        });
      }
      const latest = await fetchVolumes();
      setVolumes(latest || []);
    } catch (e) {
      setError(e?.message || "Failed to add blessing to some volumes");
    } finally {
      setBulkAddingMissing(false);
    }
  };

  return (
    <div className="p-3 md:p-4 space-y-4">
      <div
        className="rounded border p-4"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
      >
        <h1 className="text-2xl font-bold text-primary">Master Blessings</h1>
        <p className="text-xs text-text-secondary mt-1">
          Create your canonical blessings here. Every new greentext volume auto-includes all active blessings.
        </p>
      </div>

      {error && <div className="text-red-400 mb-3 text-sm">{error}</div>}

      <form
        onSubmit={submit}
        className="p-4 rounded border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg text-text-main">{editingId ? "Edit Blessing" : "Add Blessing"}</h2>
          <div className="text-[11px] text-text-secondary">Fields marked with * are required</div>
        </div>
        {formError && <div className="text-red-400 mb-3 text-xs">{formError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-text-secondary mb-1">Blessing Name *</label>
            <input
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              value={form.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Example: Boundless Faith"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Key (unique) *</label>
            <input
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              value={form.key}
              onChange={(e) => {
                setKeyTouched(true);
                setForm({ ...form, key: toSlug(e.target.value) });
              }}
              placeholder="boundless-faith"
              required={!editingId}
              disabled={!!editingId}
            />
            <div className="text-[10px] mt-1 text-text-secondary">Lowercase letters, numbers, hyphens only.</div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Display Order</label>
            <input
              type="number"
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              value={form.index}
              onChange={(e) => setForm({ ...form, index: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-text-secondary mb-1">Canonical Context</label>
            <textarea
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              rows={3}
              value={form.context}
              onChange={(e) => setForm({ ...form, context: e.target.value })}
            />
            <div className="text-[10px] mt-1 text-text-secondary">
              Used as guidance for volume generation quality and consistency.
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-text-secondary mb-1">Default Description</label>
            <textarea
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              rows={2}
              value={form.defaultDescription}
              onChange={(e) => setForm({ ...form, defaultDescription: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Tags (comma-separated)</label>
            <input
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input
              id="active"
              type="checkbox"
              checked={!!form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label htmlFor="active" className="text-xs text-text-secondary">
              Active
            </label>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="px-3 py-1.5 text-xs rounded bg-primary hover:opacity-90 border text-white"
            style={{ borderColor: "var(--color-primary)" }}
            disabled={loading}
          >
            {loading ? "Saving..." : editingId ? "Update Blessing" : "Create Blessing"}
          </button>
          {editingId && (
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded border bg-background text-text-main hover:opacity-90"
              style={{ borderColor: "var(--color-primary)" }}
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div
        className="rounded border p-3"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
      >
        <div className="mb-3 flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-lg text-text-main">Blessings Library</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              placeholder="Search by name, key, context or tags..."
              className="w-full md:w-80 p-2 rounded border text-xs"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="px-2.5 py-2 text-xs rounded border text-text-main hover:opacity-90 whitespace-nowrap"
              style={{ borderColor: "var(--color-primary)", background: "var(--color-background)" }}
              onClick={() => openInlineAfter("__TOP__")}
            >
              Insert At Top
            </button>
          </div>
        </div>
        <div className="text-[11px] text-text-secondary mb-3">
          {filtered.length} result{filtered.length === 1 ? "" : "s"} • {items.filter((x) => x.active).length} active
        </div>

        <div className="overflow-x-auto rounded border" style={{ borderColor: "var(--color-primary)" }}>
          <table className="min-w-full text-left text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <thead style={{ background: "var(--color-background)" }}>
              <tr>
                <th className="p-2 text-text-secondary">Order</th>
                <th className="p-2 text-text-secondary">Name</th>
                <th className="p-2 text-text-secondary">Key</th>
                <th className="p-2 text-text-secondary">Usage</th>
                <th className="p-2 text-text-secondary">Status</th>
                <th className="p-2 text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody style={{ background: "var(--color-surface)" }}>
              {insertAfterId === "__TOP__" && (
                <tr className="border-t" style={{ borderColor: "var(--color-primary)" }}>
                  <td className="p-2" colSpan={6}>
                    <div className="rounded border p-2.5" style={{ borderColor: "var(--color-primary)" }}>
                      <div className="text-[11px] text-text-secondary mb-2">
                        Insert at index 0 (all existing rows shift down by 1)
                      </div>
                      {inlineError && <div className="text-red-400 text-xs mb-2">{inlineError}</div>}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          className="p-2 rounded border text-xs"
                          style={{
                            background: "var(--color-background)",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-text-main)",
                          }}
                          placeholder="Blessing name"
                          value={inlineForm.name}
                          onChange={(e) => onInlineNameChange(e.target.value)}
                        />
                        <input
                          className="p-2 rounded border text-xs"
                          style={{
                            background: "var(--color-background)",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-text-main)",
                          }}
                          placeholder="key-slug"
                          value={inlineForm.key}
                          onChange={(e) => {
                            setInlineKeyTouched(true);
                            setInlineForm((prev) => ({ ...prev, key: toSlug(e.target.value) }));
                          }}
                        />
                        <input
                          className="p-2 rounded border text-xs"
                          style={{
                            background: "var(--color-background)",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-text-main)",
                          }}
                          placeholder="Default description (optional)"
                          value={inlineForm.defaultDescription}
                          onChange={(e) => setInlineForm((prev) => ({ ...prev, defaultDescription: e.target.value }))}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-2.5 py-2 text-xs rounded bg-primary text-white border hover:opacity-90"
                            style={{ borderColor: "var(--color-primary)" }}
                            onClick={submitInlineInsert}
                            disabled={inlineSaving}
                          >
                            {inlineSaving ? "Inserting..." : "Insert"}
                          </button>
                          <button
                            type="button"
                            className="px-2.5 py-2 text-xs rounded border text-text-main"
                            style={{ borderColor: "var(--color-primary)" }}
                            onClick={resetInline}
                            disabled={inlineSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {filtered.map((it) => (
                <Fragment key={it._id}>
                  <tr key={it._id} className="border-t" style={{ borderColor: "var(--color-primary)" }}>
                    <td className="p-2">{it.index ?? 0}</td>
                    <td className="p-2 text-text-main">
                      <div className="font-medium">{it.name}</div>
                      {it.defaultDescription && <div className="opacity-70 mt-0.5">{it.defaultDescription}</div>}
                    </td>
                    <td className="p-2 font-mono text-[11px] text-text-main">{it.key}</td>
                    <td className="p-2">
                      <button
                        type="button"
                        className="inline-flex items-center rounded px-2 py-0.5 border cursor-pointer hover:opacity-90"
                        style={{ borderColor: "var(--color-primary)" }}
                        title={getUsageTooltip(it)}
                        onClick={() => openUsageModal(it)}
                      >
                        {getUsageCount(it)} volume{getUsageCount(it) === 1 ? "" : "s"}
                      </button>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => quickToggleActive(it)}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          it.active ? "text-green-300" : "text-text-secondary"
                        }`}
                        style={{ borderColor: "var(--color-primary)" }}
                      >
                        {it.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-2 space-x-2 whitespace-nowrap">
                      <button className="text-primary hover:opacity-90" onClick={() => edit(it)}>
                        Edit
                      </button>
                      <button className="text-primary hover:opacity-90" onClick={() => openInlineAfter(it._id)}>
                        Insert Below
                      </button>
                      <button className="text-red-400 hover:text-red-300" onClick={() => remove(it._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>

                  {insertAfterId === it._id && (
                    <tr className="border-t" style={{ borderColor: "var(--color-primary)" }}>
                      <td className="p-2" colSpan={6}>
                        <div className="rounded border p-2.5" style={{ borderColor: "var(--color-primary)" }}>
                          <div className="text-[11px] text-text-secondary mb-2">
                            Insert at index {getInsertPosition(insertAfterId)} (later rows shift up by 1)
                          </div>
                          {inlineError && <div className="text-red-400 text-xs mb-2">{inlineError}</div>}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              className="p-2 rounded border text-xs"
                              style={{
                                background: "var(--color-background)",
                                borderColor: "var(--color-primary)",
                                color: "var(--color-text-main)",
                              }}
                              placeholder="Blessing name"
                              value={inlineForm.name}
                              onChange={(e) => onInlineNameChange(e.target.value)}
                            />
                            <input
                              className="p-2 rounded border text-xs"
                              style={{
                                background: "var(--color-background)",
                                borderColor: "var(--color-primary)",
                                color: "var(--color-text-main)",
                              }}
                              placeholder="key-slug"
                              value={inlineForm.key}
                              onChange={(e) => {
                                setInlineKeyTouched(true);
                                setInlineForm((prev) => ({ ...prev, key: toSlug(e.target.value) }));
                              }}
                            />
                            <input
                              className="p-2 rounded border text-xs"
                              style={{
                                background: "var(--color-background)",
                                borderColor: "var(--color-primary)",
                                color: "var(--color-text-main)",
                              }}
                              placeholder="Default description (optional)"
                              value={inlineForm.defaultDescription}
                              onChange={(e) =>
                                setInlineForm((prev) => ({ ...prev, defaultDescription: e.target.value }))
                              }
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="px-2.5 py-2 text-xs rounded bg-primary text-white border hover:opacity-90"
                                style={{ borderColor: "var(--color-primary)" }}
                                onClick={submitInlineInsert}
                                disabled={inlineSaving}
                              >
                                {inlineSaving ? "Inserting..." : "Insert"}
                              </button>
                              <button
                                type="button"
                                className="px-2.5 py-2 text-xs rounded border text-text-main"
                                style={{ borderColor: "var(--color-primary)" }}
                                onClick={resetInline}
                                disabled={inlineSaving}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}

              {insertAfterId === "__END__" && (
                <tr className="border-t" style={{ borderColor: "var(--color-primary)" }}>
                  <td className="p-2" colSpan={6}>
                    <div className="rounded border p-2.5" style={{ borderColor: "var(--color-primary)" }}>
                      <div className="text-[11px] text-text-secondary mb-2">Insert at end (new highest index)</div>
                      {inlineError && <div className="text-red-400 text-xs mb-2">{inlineError}</div>}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <input
                          className="p-2 rounded border text-xs"
                          style={{
                            background: "var(--color-background)",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-text-main)",
                          }}
                          placeholder="Blessing name"
                          value={inlineForm.name}
                          onChange={(e) => onInlineNameChange(e.target.value)}
                        />
                        <input
                          className="p-2 rounded border text-xs"
                          style={{
                            background: "var(--color-background)",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-text-main)",
                          }}
                          placeholder="key-slug"
                          value={inlineForm.key}
                          onChange={(e) => {
                            setInlineKeyTouched(true);
                            setInlineForm((prev) => ({ ...prev, key: toSlug(e.target.value) }));
                          }}
                        />
                        <input
                          className="p-2 rounded border text-xs"
                          style={{
                            background: "var(--color-background)",
                            borderColor: "var(--color-primary)",
                            color: "var(--color-text-main)",
                          }}
                          placeholder="Default description (optional)"
                          value={inlineForm.defaultDescription}
                          onChange={(e) => setInlineForm((prev) => ({ ...prev, defaultDescription: e.target.value }))}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-2.5 py-2 text-xs rounded bg-primary text-white border hover:opacity-90"
                            style={{ borderColor: "var(--color-primary)" }}
                            onClick={submitInlineInsert}
                            disabled={inlineSaving}
                          >
                            {inlineSaving ? "Inserting..." : "Insert"}
                          </button>
                          <button
                            type="button"
                            className="px-2.5 py-2 text-xs rounded border text-text-main"
                            style={{ borderColor: "var(--color-primary)" }}
                            onClick={resetInline}
                            disabled={inlineSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-text-secondary" colSpan={6}>
                    No blessings found.
                  </td>
                </tr>
              )}
              <tr className="border-t" style={{ borderColor: "var(--color-primary)" }}>
                <td className="p-2" colSpan={6}>
                  <button
                    type="button"
                    className="text-xs px-2.5 py-1.5 rounded border text-text-main hover:opacity-90"
                    style={{ borderColor: "var(--color-primary)", background: "var(--color-background)" }}
                    onClick={() => openInlineAfter("__END__")}
                  >
                    Insert At End
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {usageModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center" onClick={closeUsageModal}>
          <div
            className="w-full max-w-2xl max-h-[82vh] overflow-auto rounded border p-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg text-text-main font-semibold">Missing Volumes</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Blessing: <span className="text-text-main">{usageModalItem.name}</span>
                </p>
              </div>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded border text-text-main"
                style={{ borderColor: "var(--color-primary)" }}
                onClick={closeUsageModal}
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-xs text-text-secondary">
                {modalMissingVolumes.length === 0
                  ? "This blessing is already present in all volumes."
                  : `Missing from ${modalMissingVolumes.length} volume${modalMissingVolumes.length === 1 ? "" : "s"}.`}
              </div>
              <button
                type="button"
                className="px-2.5 py-1.5 text-xs rounded border text-white bg-primary hover:opacity-90 disabled:opacity-60"
                style={{ borderColor: "var(--color-primary)" }}
                onClick={addToAllMissingVolumes}
                disabled={!modalMissingVolumes.length || bulkAddingMissing}
              >
                {bulkAddingMissing ? "Adding..." : "Add To All Missing"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block text-[11px] text-text-secondary mb-1">Insert Index</label>
                <input
                  type="number"
                  min={0}
                  className="w-full p-2 rounded border text-xs"
                  style={{
                    background: "var(--color-background)",
                    borderColor: "var(--color-primary)",
                    color: "var(--color-text-main)",
                  }}
                  value={modalInsertIndex}
                  onChange={(e) => setModalInsertIndex(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] text-text-secondary mb-1">Description For Added Blessing</label>
                <input
                  className="w-full p-2 rounded border text-xs"
                  style={{
                    background: "var(--color-background)",
                    borderColor: "var(--color-primary)",
                    color: "var(--color-text-main)",
                  }}
                  placeholder="Write a custom description for this add action"
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-2">
                {modalMissingVolumes.map((vol) => {
                  const isUpdating = updatingVolumeIds.has(vol._id);
                  const isHovered = hoverVolumeId === vol._id;
                  return (
                    <div
                      key={vol._id}
                      className="rounded border p-2.5 flex items-center justify-between gap-3"
                      style={{
                        borderColor: "var(--color-primary)",
                        background: isHovered ? "var(--color-surface)" : "var(--color-background)",
                      }}
                      onMouseEnter={() => setHoverVolumeId(vol._id)}
                    >
                      <div>
                        <div className="text-sm text-text-main">
                          V{vol.volumeNumber}: {vol.title}
                        </div>
                        <div className="text-[11px] text-text-secondary">{(vol.blessings || []).length} blessing entries</div>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 text-xs rounded border text-text-main hover:opacity-90 disabled:opacity-60"
                        style={{ borderColor: "var(--color-primary)" }}
                        onClick={() =>
                          addBlessingToVolume(usageModalItem, vol, {
                            insertIndex: modalInsertIndex,
                            description: modalDescription,
                          })
                        }
                        disabled={isUpdating || bulkAddingMissing}
                      >
                        {isUpdating ? "Adding..." : "Add To Volume"}
                      </button>
                    </div>
                  );
                })}
                {!modalMissingVolumes.length && (
                  <div
                    className="rounded border p-3 text-xs text-text-secondary"
                    style={{ borderColor: "var(--color-primary)", background: "var(--color-background)" }}
                  >
                    No missing volumes for this blessing.
                  </div>
                )}
              </div>

              <div
                className="rounded border p-3 max-h-[52vh] overflow-auto"
                style={{ borderColor: "var(--color-primary)", background: "var(--color-background)" }}
              >
                {!hoveredModalVolume && (
                  <div className="text-xs text-text-secondary">Hover a volume on the left to preview it here.</div>
                )}
                {hoveredModalVolume && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-text-main">
                        V{hoveredModalVolume.volumeNumber}: {hoveredModalVolume.title}
                      </div>
                      <div className="text-[11px] text-text-secondary mt-0.5">
                        {hoveredModalVolume.status || "draft"} • {(hoveredModalVolume.blessings || []).length} blessings
                      </div>
                    </div>

                    {hoveredModalVolume.rawPastedText ? (
                      <pre className="text-[11px] whitespace-pre-wrap text-text-main leading-relaxed">
                        {hoveredModalVolume.rawPastedText}
                      </pre>
                    ) : (
                      <div className="space-y-2">
                        {!!hoveredModalVolume.bodyLines?.length && (
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">Body</div>
                            <div className="text-[11px] whitespace-pre-wrap text-text-main">
                              {hoveredModalVolume.bodyLines.join("\n")}
                            </div>
                          </div>
                        )}
                        {!!hoveredModalVolume.blessings?.length && (
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">Blessings</div>
                            <div className="space-y-1">
                              {hoveredModalVolume.blessings.map((b, i) => (
                                <div key={`${hoveredModalVolume._id}-b-${i}`} className="text-[11px] text-text-main">
                                  • {b?.item}
                                  {b?.description ? ` (${b.description})` : ""}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!!hoveredModalVolume.dream && (
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-text-secondary mb-1">Dream</div>
                            <div className="text-[11px] text-text-main">{hoveredModalVolume.dream}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
