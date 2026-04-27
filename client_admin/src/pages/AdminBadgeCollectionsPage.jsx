// src/pages/AdminBadgeCollectionsPage.jsx
import { useEffect, useMemo, useState } from "react";
import Widget from "../components/ui/Widget";
import StyledButton from "../components/ui/StyledButton";
import StyledInput from "../components/ui/StyledInput";
import PageHeader from "../components/ui/PageHeader";
import api from "../services/api";

const toFormData = (obj) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  return fd;
};

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function AdminBadgeCollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [creatingCollection, setCreatingCollection] = useState(false);
  const API_ORIGIN = useMemo(() => {
    try {
      const u = new URL(api.defaults.baseURL || "");
      return u.origin;
    } catch {
      return "";
    }
  }, []);
  const [collectionForm, setCollectionForm] = useState({
    key: "",
    name: "",
    description: "",
    generation: 1,
    totalItems: 8,
    order: 0,
    legendaryGateNeeded: false,
  });
  const [rowForms, setRowForms] = useState({}); // { [index]: { name, small, large, saving } }
  const [editingRows, setEditingRows] = useState({}); // { [index]: boolean }
  const [editingCollection, setEditingCollection] = useState(false);
  const [editCollectionForm, setEditCollectionForm] = useState({});
  const [editCollectionSaving, setEditCollectionSaving] = useState(false);

  const selectedCollection = useMemo(
    () => collections.find((c) => c.key === selectedKey) || null,
    [collections, selectedKey],
  );

  const fetchCollections = async () => {
    try {
      const res = await api.get("/admin/badge-collections/collections");
      setCollections(res.data.data || []);
      if (!selectedKey && res.data.data?.length) setSelectedKey(res.data.data[0].key);
    } catch (e) {
      setError("Failed to load collections");
    }
  };

  const fetchBadges = async (key) => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/badge-collections/collections/${key}`);
      setBadges(res.data.data || []);
    } catch (e) {
      setError("Failed to load badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    fetchBadges(selectedKey);
    setEditingCollection(false);
  }, [selectedKey]);

  // Initialize row forms per index (1..totalItems)
  useEffect(() => {
    if (!selectedCollection) {
      // cleanup previews on reset
      Object.values(rowForms || {}).forEach((frm) => {
        if (frm?.smallPreview) URL.revokeObjectURL(frm.smallPreview);
        if (frm?.largePreview) URL.revokeObjectURL(frm.largePreview);
      });
      setRowForms({});
      setEditingRows({});
      return;
    }
    const total = Number(selectedCollection.totalItems || 0);
    const byIndex = Object.fromEntries((badges || []).map((b) => [Number(b.orderInCategory || 0), b]));
    const forms = {};
    const edits = {};
    for (let i = 1; i <= total; i++) {
      const exist = byIndex[i];
      const wasEditing = !!editingRows[i];
      const prev = rowForms?.[i] || {};
      forms[i] = {
        name: wasEditing ? (prev.name ?? exist?.name ?? "") : (exist?.name ?? ""),
        small: wasEditing ? (prev.small ?? null) : null,
        smallPreview: wasEditing ? (prev.smallPreview ?? null) : null,
        large: wasEditing ? (prev.large ?? null) : null,
        largePreview: wasEditing ? (prev.largePreview ?? null) : null,
        saving: false,
      };
      // keep rows in edit if they were, otherwise default to editing for missing rows
      edits[i] = wasEditing || !exist;
    }
    setRowForms(forms);
    setEditingRows(edits);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollection, badges]);

  const [form, setForm] = useState({
    name: "",
    orderInCategory: 1,
    small: null,
    large: null,
  });

  useEffect(() => {
    // Reset badge form index to 1 when switching collections
    setForm((f) => ({ ...f, orderInCategory: 1 }));
  }, [selectedKey]);

  const createBadge = async () => {
    setSaving(true);
    try {
      // Basic client-side validation
      if (!selectedKey) throw new Error("Select or create a collection first");
      if (!form.name) throw new Error("Please provide a badge name");
      if (!form.orderInCategory || form.orderInCategory < 1) throw new Error("Please set a valid index");
      if (selectedCollection?.totalItems && form.orderInCategory > selectedCollection.totalItems) {
        throw new Error(`Index cannot exceed total items (${selectedCollection.totalItems})`);
      }

      // Generate required fields for backend schema
      const badgeId = `${selectedKey}_${String(form.orderInCategory).padStart(2, "0")}`;
      const payload = {
        collectionKey: selectedKey,
        badgeId,
        name: form.name,
        description: form.name, // BadgeBase requires description; use name by default
        orderInCategory: form.orderInCategory,
      };

      const fd = toFormData(payload);
      if (form.small) fd.append("small", form.small);
      if (form.large) fd.append("large", form.large);
      const res = await api.post("/admin/badge-collections/badges", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const nextOrder = (badges?.length || 0) + 1;
      setBadges((b) => [...b, res.data.data]);
      setForm((f) => ({
        name: "",
        orderInCategory: nextOrder,
        small: null,
        large: null,
      }));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create badge");
    } finally {
      setSaving(false);
    }
  };

  const startEditCollection = () => {
    if (!selectedCollection) return;
    setEditCollectionForm({
      name: selectedCollection.name || "",
      description: selectedCollection.description || "",
      generation: selectedCollection.generation ?? 1,
      totalItems: selectedCollection.totalItems ?? 8,
      order: selectedCollection.order ?? 0,
      legendaryGateNeeded: selectedCollection.legendaryGateNeeded ?? false,
      active: selectedCollection.active ?? false,
    });
    setEditingCollection(true);
  };

  const updateCollectionMeta = async () => {
    if (!selectedCollection) return;
    setEditCollectionSaving(true);
    setError("");
    try {
      const res = await api.put(`/admin/badge-collections/collections/${selectedCollection.key}`, editCollectionForm);
      const updated = res.data?.data;
      setCollections((prev) => prev.map((c) => (c.key === updated.key ? updated : c)));
      setEditingCollection(false);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update collection");
    } finally {
      setEditCollectionSaving(false);
    }
  };

  const createCollection = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...collectionForm };
      if (!payload.key) payload.key = slugify(payload.name);
      const res = await api.post("/admin/badge-collections/collections", payload);
      const newCol = res.data?.data;
      setCollections((prev) => {
        const next = [...prev, newCol].sort((a, b) => (a.order || 0) - (b.order || 0) || a.key.localeCompare(b.key));
        return next;
      });
      setSelectedKey(newCol.key);
      setCreatingCollection(false);
      setCollectionForm({
        key: "",
        name: "",
        description: "",
        generation: 1,
        totalItems: 8,
        order: 0,
        legendaryGateNeeded: false,
        active: false,
      });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to create collection");
    } finally {
      setSaving(false);
    }
  };

  const updateBadgeAtIndex = async (mongoId, index) => {
    try {
      setRowForms((prev) => ({ ...prev, [index]: { ...prev[index], saving: true } }));
      const frm = rowForms[index] || {};
      const fd = new FormData();
      if (frm.name) fd.append("name", frm.name);
      fd.append("orderInCategory", String(index));
      if (frm.small) fd.append("small", frm.small);
      if (frm.large) fd.append("large", frm.large);
      const res = await api.put(`/admin/badge-collections/badges/${mongoId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data?.data;
      setBadges((arr) => arr.map((b) => (b._id === updated._id ? updated : b)));
      setEditingRows((prev) => ({ ...prev, [index]: false }));
      // Preserve other fields; just update name and saving flag
      setRowForms((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          name: updated.name || prev[index]?.name || "",
          saving: false,
        },
      }));
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update badge");
      setRowForms((prev) => ({ ...prev, [index]: { ...prev[index], saving: false } }));
    }
  };

  const createBadgeAtIndex = async (index) => {
    try {
      setRowForms((prev) => ({ ...prev, [index]: { ...prev[index], saving: true } }));
      const frm = rowForms[index] || {};
      if (!selectedKey) throw new Error("Select or create a collection first");
      if (!frm.name) throw new Error("Please provide a badge name");
      const badgeId = `${selectedKey}_${String(index).padStart(2, "0")}`;
      const payload = {
        collectionKey: selectedKey,
        badgeId,
        name: frm.name,
        description: frm.name,
        orderInCategory: index,
      };
      const fd = toFormData(payload);
      if (frm.small) fd.append("small", frm.small);
      if (frm.large) fd.append("large", frm.large);
      const res = await api.post("/admin/badge-collections/badges", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = res.data?.data;
      setBadges((arr) => [...arr, created]);
      setEditingRows((prev) => ({ ...prev, [index]: false }));
      // Preserve selected files after create; just stop saving and keep name
      setRowForms((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          name: created.name || prev[index]?.name || "",
          saving: false,
        },
      }));
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to create badge");
      setRowForms((prev) => ({ ...prev, [index]: { ...prev[index], saving: false } }));
    }
  };

  return (
    <div>
      <PageHeader title="Badge Collections" subtitle="Step 1: Create/select a collection • Step 2: Add badges" />
      {error && <p className="text-status-danger mt-2">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Widget title="Step 1 — Collections" className="lg:col-span-1">
          <div className="space-y-1 text-[11px]">
            {collections.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedKey(c.key)}
                className={`w-full text-left px-2 py-1 rounded border ${
                  selectedKey === c.key ? "border-primary text-white" : "border-gray-700 text-text-secondary"
                }`}
              >
                <div className="text-[11px] font-medium flex items-center gap-2">
                  <span>{c.name || c.key}</span>
                  {c.active ? (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-primary/30 text-primary">Active</span>
                  ) : null}
                </div>
                <div className="text-[10px] text-text-tertiary">
                  Gen {c.generation} • Items {c.totalItems}
                </div>
              </button>
            ))}
            {selectedCollection && !creatingCollection && (
              <div className="pt-2 border-t border-gray-800 mt-2">
                <StyledButton
                  onClick={() => (editingCollection ? setEditingCollection(false) : startEditCollection())}
                  className="w-full py-1 px-2 text-[11px]"
                >
                  {editingCollection ? "Cancel Edit" : `Edit "${selectedCollection.name || selectedCollection.key}"`}
                </StyledButton>
                {editingCollection && (
                  <div className="mt-2 space-y-1">
                    <div>
                      <label className="block text-[10px] text-text-tertiary">Name</label>
                      <StyledInput
                        className="p-1 text-[11px]"
                        value={editCollectionForm.name || ""}
                        onChange={(e) => setEditCollectionForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-tertiary">Description</label>
                      <StyledInput
                        className="p-1 text-[11px]"
                        value={editCollectionForm.description || ""}
                        onChange={(e) => setEditCollectionForm((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-tertiary">Generation</label>
                      <StyledInput
                        type="number"
                        min={1}
                        className="p-1 text-[11px]"
                        value={editCollectionForm.generation ?? 1}
                        onChange={(e) => setEditCollectionForm((f) => ({ ...f, generation: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-tertiary">Total Items</label>
                      <StyledInput
                        type="number"
                        min={1}
                        className="p-1 text-[11px]"
                        value={editCollectionForm.totalItems ?? 8}
                        onChange={(e) => setEditCollectionForm((f) => ({ ...f, totalItems: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-text-tertiary">Order</label>
                      <StyledInput
                        type="number"
                        className="p-1 text-[11px]"
                        value={editCollectionForm.order ?? 0}
                        onChange={(e) => setEditCollectionForm((f) => ({ ...f, order: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="edit-legendaryGateNeeded"
                        type="checkbox"
                        checked={!!editCollectionForm.legendaryGateNeeded}
                        onChange={(e) =>
                          setEditCollectionForm((f) => ({ ...f, legendaryGateNeeded: e.target.checked }))
                        }
                      />
                      <label htmlFor="edit-legendaryGateNeeded" className="text-[10px] text-text-secondary">
                        Unlocks legendaries when completed
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="edit-activeCollection"
                        type="checkbox"
                        checked={!!editCollectionForm.active}
                        onChange={(e) => setEditCollectionForm((f) => ({ ...f, active: e.target.checked }))}
                      />
                      <label htmlFor="edit-activeCollection" className="text-[10px] text-text-secondary">
                        Active collection
                      </label>
                    </div>
                    <StyledButton
                      onClick={updateCollectionMeta}
                      disabled={editCollectionSaving || !editCollectionForm.name}
                      className="bg-status-success w-full py-1 px-2 text-[11px]"
                    >
                      {editCollectionSaving ? "Saving..." : "Save Changes"}
                    </StyledButton>
                  </div>
                )}
              </div>
            )}
            <div className="pt-2 border-t border-gray-800 mt-2">
              <StyledButton onClick={() => setCreatingCollection((v) => !v)} className="w-full py-1 px-2 text-[11px]">
                {creatingCollection ? "Cancel" : "New Collection"}
              </StyledButton>
              {creatingCollection && (
                <div className="mt-2 space-y-1">
                  <div>
                    <label className="block text-[10px] text-text-tertiary">Name</label>
                    <StyledInput
                      className="p-1 text-[11px]"
                      value={collectionForm.name}
                      onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                      placeholder="Kanto Gym Badges"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-tertiary">Description</label>
                    <StyledInput
                      className="p-1 text-[11px]"
                      value={collectionForm.description}
                      onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-tertiary">Generation</label>
                    <StyledInput
                      type="number"
                      min={1}
                      className="p-1 text-[11px]"
                      value={collectionForm.generation}
                      onChange={(e) => setCollectionForm({ ...collectionForm, generation: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-tertiary">Total Items</label>
                    <StyledInput
                      type="number"
                      min={1}
                      className="p-1 text-[11px]"
                      value={collectionForm.totalItems}
                      onChange={(e) => setCollectionForm({ ...collectionForm, totalItems: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-text-tertiary">Order (optional)</label>
                    <StyledInput
                      type="number"
                      className="p-1 text-[11px]"
                      value={collectionForm.order}
                      onChange={(e) => setCollectionForm({ ...collectionForm, order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="legendaryGateNeeded"
                      type="checkbox"
                      checked={collectionForm.legendaryGateNeeded}
                      onChange={(e) => setCollectionForm({ ...collectionForm, legendaryGateNeeded: e.target.checked })}
                    />
                    <label htmlFor="legendaryGateNeeded" className="text-[10px] text-text-secondary">
                      Completing this collection unlocks legendaries for its generation
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="activeCollection"
                      type="checkbox"
                      checked={collectionForm.active}
                      onChange={(e) => setCollectionForm({ ...collectionForm, active: e.target.checked })}
                    />
                    <label htmlFor="activeCollection" className="text-[10px] text-text-secondary">
                      Mark as active collection (currently being unlocked)
                    </label>
                  </div>
                  <StyledButton
                    onClick={createCollection}
                    disabled={
                      saving || !collectionForm.name || !collectionForm.generation || !collectionForm.totalItems
                    }
                    className="bg-status-success w-full py-1 px-2 text-[11px]"
                  >
                    {saving ? "Saving..." : "Create Collection"}
                  </StyledButton>
                </div>
              )}
            </div>
          </div>
        </Widget>
        <Widget title="Step 2 — Badges" className="lg:col-span-2">
          <div className="space-y-3 text-[11px]">
            {!selectedCollection ? (
              <div className="text-text-tertiary">
                <p>Select a collection on the left or create a new one to begin adding badges.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {loading ? (
                  <p className="text-text-tertiary">Loading…</p>
                ) : (
                  <table className="min-w-full text-[11px]">
                    <thead className="text-text-tertiary">
                      <tr>
                        <th className="text-left py-1 pr-2">#</th>
                        <th className="text-left py-1 pr-2">Name</th>
                        <th className="text-left py-1 pr-2">Sprite</th>
                        <th className="text-left py-1 pr-2">Large</th>
                        <th className="text-left py-1 pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Number(selectedCollection.totalItems || 0) }, (_, idx) => idx + 1).map(
                        (i) => {
                          const existing = badges.find((b) => Number(b.orderInCategory) === i);
                          const editing = !!editingRows[i];
                          const frm = rowForms[i] || { name: "", small: null, large: null, saving: false };
                          return (
                            <tr key={i} className="border-t border-gray-800 align-top">
                              <td className="py-1 pr-2 text-center w-6">{i}</td>
                              <td className="py-1 pr-2">
                                {editing ? (
                                  <StyledInput
                                    className="p-1 text-[11px]"
                                    value={frm.name}
                                    onChange={(e) =>
                                      setRowForms((prev) => ({ ...prev, [i]: { ...prev[i], name: e.target.value } }))
                                    }
                                    placeholder="Badge name"
                                  />
                                ) : (
                                  <span>{existing?.name || "—"}</span>
                                )}
                              </td>
                              <td className="py-1 pr-2">
                                {editing ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      id={`small-file-${i}`}
                                      className="hidden"
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        setRowForms((prev) => {
                                          const file = e.target.files?.[0] || null;
                                          const row = prev[i] || {};
                                          if (row.smallPreview) URL.revokeObjectURL(row.smallPreview);
                                          return {
                                            ...prev,
                                            [i]: {
                                              ...row,
                                              small: file,
                                              smallPreview: file ? URL.createObjectURL(file) : null,
                                            },
                                          };
                                        })
                                      }
                                    />
                                    <label
                                      htmlFor={`small-file-${i}`}
                                      className="inline-flex items-center px-2 py-1 bg-gray-700/60 rounded text-[10px] cursor-pointer"
                                    >
                                      Choose
                                    </label>
                                    {frm.smallPreview ? (
                                      <img src={frm.smallPreview} alt="small preview" className="h-5" />
                                    ) : frm.small ? (
                                      <span className="text-[10px] text-text-tertiary">
                                        {frm.small.name?.slice(0, 10) || "file"}
                                      </span>
                                    ) : existing?.spriteSmallUrl ? (
                                      <img
                                        src={`${API_ORIGIN}${existing.spriteSmallUrl}`}
                                        alt="small"
                                        className="h-5"
                                      />
                                    ) : (
                                      <span className="text-text-tertiary">—</span>
                                    )}
                                  </div>
                                ) : existing?.spriteSmallUrl ? (
                                  <img src={`${API_ORIGIN}${existing.spriteSmallUrl}`} alt="small" className="h-5" />
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-1 pr-2">
                                {editing ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      id={`large-file-${i}`}
                                      className="hidden"
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        setRowForms((prev) => {
                                          const file = e.target.files?.[0] || null;
                                          const row = prev[i] || {};
                                          if (row.largePreview) URL.revokeObjectURL(row.largePreview);
                                          return {
                                            ...prev,
                                            [i]: {
                                              ...row,
                                              large: file,
                                              largePreview: file ? URL.createObjectURL(file) : null,
                                            },
                                          };
                                        })
                                      }
                                    />
                                    <label
                                      htmlFor={`large-file-${i}`}
                                      className="inline-flex items-center px-2 py-1 bg-gray-700/60 rounded text-[10px] cursor-pointer"
                                    >
                                      Choose
                                    </label>
                                    {frm.largePreview ? (
                                      <img src={frm.largePreview} alt="large preview" className="h-5" />
                                    ) : frm.large ? (
                                      <span className="text-[10px] text-text-tertiary">
                                        {frm.large.name?.slice(0, 10) || "file"}
                                      </span>
                                    ) : existing?.spriteLargeUrl ? (
                                      <img
                                        src={`${API_ORIGIN}${existing.spriteLargeUrl}`}
                                        alt="large"
                                        className="h-5"
                                      />
                                    ) : (
                                      <span className="text-text-tertiary">—</span>
                                    )}
                                  </div>
                                ) : existing?.spriteLargeUrl ? (
                                  <img src={`${API_ORIGIN}${existing.spriteLargeUrl}`} alt="large" className="h-5" />
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="py-1 pr-2">
                                {editing ? (
                                  <div className="flex gap-2">
                                    <StyledButton
                                      disabled={frm.saving || !frm.name}
                                      onClick={() =>
                                        existing ? updateBadgeAtIndex(existing._id, i) : createBadgeAtIndex(i)
                                      }
                                      className="bg-status-success py-1 px-2 text-[10px]"
                                    >
                                      {frm.saving ? "Saving..." : existing ? "Save" : "Create"}
                                    </StyledButton>
                                    {existing ? (
                                      <StyledButton
                                        onClick={() => {
                                          setEditingRows((prev) => ({ ...prev, [i]: false }));
                                          setRowForms((prev) => ({
                                            ...prev,
                                            [i]: { name: existing.name || "", small: null, large: null, saving: false },
                                          }));
                                        }}
                                        className="bg-gray-700 py-1 px-2 text-[10px]"
                                      >
                                        Cancel
                                      </StyledButton>
                                    ) : null}
                                  </div>
                                ) : existing ? (
                                  <StyledButton
                                    onClick={() => setEditingRows((prev) => ({ ...prev, [i]: true }))}
                                    className="py-1 px-2 text-[10px]"
                                  >
                                    Edit
                                  </StyledButton>
                                ) : (
                                  <StyledButton
                                    onClick={() => setEditingRows((prev) => ({ ...prev, [i]: true }))}
                                    className="py-1 px-2 text-[10px]"
                                  >
                                    Add
                                  </StyledButton>
                                )}
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </Widget>
      </div>
    </div>
  );
}
