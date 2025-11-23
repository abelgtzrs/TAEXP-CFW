import { useEffect, useMemo, useState } from "react";
import {
  listBlessingDefs,
  createBlessingDef,
  updateBlessingDef,
  deleteBlessingDef,
} from "../services/blessingsService";

const emptyForm = { key: "", name: "", context: "", defaultDescription: "", tags: "", active: true, index: 0 };

export default function BlessingsAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await listBlessingDefs();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load blessings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      [x.key, x.name, x.context, x.defaultDescription, (x.tags || []).join(", ")]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [items, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        key: form.key.trim(),
        name: form.name.trim(),
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
      setError(e?.response?.data?.message || e?.message || "Failed to save");
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

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold text-primary mb-4">Master Blessings</h1>

      {error && <div className="text-red-400 mb-3 text-sm">{error}</div>}

      <form
        onSubmit={submit}
        className="p-4 rounded border mb-6"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-primary)" }}
      >
        <h2 className="text-lg text-text-main mb-3">{editingId ? "Edit Blessing" : "Create Blessing"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Key (unique)</label>
            <input
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              required={!editingId}
              disabled={!!editingId}
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Index (Order)</label>
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
          <div>
            <label className="block text-xs text-text-secondary mb-1">Name</label>
            <input
              className="w-full p-2 rounded border"
              style={{
                background: "var(--color-background)",
                borderColor: "var(--color-primary)",
                color: "var(--color-text-main)",
              }}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
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
            {loading ? "Saving..." : editingId ? "Update" : "Create"}
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

      <div className="mb-2 flex justify-between items-center">
        <h2 className="text-lg text-text-main">All Blessings</h2>
        <input
          placeholder="Search..."
          className="w-56 p-2 rounded border text-xs"
          style={{
            background: "var(--color-background)",
            borderColor: "var(--color-primary)",
            color: "var(--color-text-main)",
          }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-auto rounded border" style={{ borderColor: "var(--color-primary)" }}>
        <table className="min-w-full text-left text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <thead style={{ background: "var(--color-surface)" }}>
            <tr>
              <th className="p-2 text-text-secondary">Index</th>
              <th className="p-2 text-text-secondary">Key</th>
              <th className="p-2 text-text-secondary">Name</th>
              <th className="p-2 text-text-secondary">Tags</th>
              <th className="p-2 text-text-secondary">Active</th>
              <th className="p-2 text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody style={{ background: "var(--color-background)" }}>
            {filtered.map((it) => (
              <tr key={it._id} className="border-t" style={{ borderColor: "var(--color-primary)" }}>
                <td className="p-2 text-text-secondary">{it.index || 0}</td>
                <td className="p-2 font-mono text-[11px] text-text-main">{it.key}</td>
                <td className="p-2 text-text-main">{it.name}</td>
                <td className="p-2 text-text-secondary">{(it.tags || []).join(", ")}</td>
                <td className="p-2 text-text-secondary">{it.active ? "Yes" : "No"}</td>
                <td className="p-2 space-x-2">
                  <button className="text-primary hover:opacity-90" onClick={() => edit(it)}>
                    Edit
                  </button>
                  <button className="text-red-400 hover:text-red-300" onClick={() => remove(it._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-3 text-center text-text-secondary" colSpan={5}>
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
