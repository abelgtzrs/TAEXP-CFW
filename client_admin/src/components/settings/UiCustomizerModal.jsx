import { useEffect, useState } from "react";
import { X, Save, Eye, Sparkles, Palette } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { listPersonas, updatePersona } from "../../services/personaService";

const ColorInput = ({ label, value, onChange }) => (
  <label className="flex items-center gap-2 text-xs">
    <span className="w-24 text-text-secondary">{label}</span>
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-8 p-0 border border-gray-600 rounded bg-transparent"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[11px]"
      placeholder="#FFFFFF"
    />
  </label>
);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const UiCustomizerModal = ({ open, onClose, settings, onChange, anchorLeft = 0, anchorBottom = 8 }) => {
  const { user, setUser } = useAuth();
  const [local, setLocal] = useState(settings);
  const [personas, setPersonas] = useState([]);
  const activePersonaId = user?.activeAbelPersona?._id || null;
  const [selectedId, setSelectedId] = useState(activePersonaId || "__standard__");
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("glass");

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await listPersonas();
        if (mounted) setPersonas(list);
      } catch (e) {
        console.error("Failed to load personas", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedId(activePersonaId || "__standard__");
  }, [activePersonaId]);

  useEffect(() => {
    if (selectedId === "__standard__") {
      const DEFAULT_THEME = {
        _id: "__standard__",
        colors: {
          bg: "#0D1117",
          surface: "#161B22",
          primary: "#1a6359ff",
          secondary: "#0099c399",
          tertiary: "#A5F3FC",
        },
        text: { main: "#E5E7EB", secondary: "#9CA3AF", tertiary: "#4B5563" },
      };
      setEditing(JSON.parse(JSON.stringify(DEFAULT_THEME)));
      return;
    }
    if (selectedId === "__genesis__") {
      const GENESIS_THEME = {
        _id: "__genesis__",
        colors: {
          bg: "#0c0c0c",
          surface: "#18181b",
          primary: "#22c55e",
          secondary: "#3f3f46",
          tertiary: "#27272a",
        },
        text: { 
          main: "#d4d4d8", 
          secondary: "#a1a1aa", 
          tertiary: "#52525b" 
        },
      };
      setEditing(JSON.parse(JSON.stringify(GENESIS_THEME)));
      return;
    }
    const p = personas.find((x) => x._id === selectedId) || null;
    setEditing(p ? JSON.parse(JSON.stringify(p)) : null);
  }, [selectedId, personas]);

  const handleUpdate = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange?.(next);
  };

  useEffect(() => {
    if (!editing) return;
    const isActive = editing._id === (user?.activeAbelPersona?._id || null) || editing._id === "__standard__" || editing._id === "__genesis__";
    if (!isActive) return;
    const root = document.documentElement;
    const { colors, text } = editing;
    if (colors) {
      root.style.setProperty("--color-bg", colors.bg);
      root.style.setProperty("--color-background", colors.bg);
      root.style.setProperty("--color-surface", colors.surface);
      root.style.setProperty("--color-primary", colors.primary);
      root.style.setProperty("--color-secondary", colors.secondary);
      root.style.setProperty("--color-tertiary", colors.tertiary);
    }
    if (text) {
      root.style.setProperty("--color-text-main", text.main);
      root.style.setProperty("--color-text-secondary", text.secondary);
      root.style.setProperty("--color-text-tertiary", text.tertiary);
    }
    window.dispatchEvent(new Event("tae:settings-changed"));
  }, [editing, user?.activeAbelPersona]);

  const handleSelectPersona = async (id) => {
    setSelectedId(id);
    try {
      if (id === "__genesis__") {
        // Client-side only preset, do not persist to backend as active persona
        // But we might want to clear the active persona so it doesn't conflict?
        // For now, let's just let the local state override.
        return; 
      }
      const personaId = id === "__standard__" ? null : id;
      const response = await api.put("/users/me/profile/active-persona", { personaId });
      setUser(response.data.data);
    } catch (e) {
      console.error("Failed to set active persona", e);
    }
  };

  const handleSave = async () => {
    if (!editing || !editing._id || editing._id === "__standard__") return;
    try {
      const payload = { colors: editing.colors, text: editing.text };
      const updated = await updatePersona(editing._id, payload);
      setPersonas((arr) => arr.map((p) => (p._id === updated._id ? updated : p)));
      if ((user?.activeAbelPersona?._id || null) === updated._id) {
        const me = await api.get("/users/me");
        setUser(me.data.data);
      }
    } catch (e) {
      console.error("Failed to update persona", e);
      alert("Failed to save persona theme.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed z-[100] pointer-events-auto"
      style={{ left: anchorLeft, bottom: anchorBottom, width: "min(360px, 95vw)" }}
    >
      <div
        className="glass-surface border shadow-2xl rounded-lg flex flex-col"
        style={{ borderColor: "var(--color-primary)", maxHeight: "70vh" }}
        role="dialog"
        aria-label="UI Customizer"
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{ borderColor: "var(--color-primary)" }}
        >
          <div className="flex items-center gap-2 text-text-main">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-[13px] font-semibold">UI Customizer</h2>
          </div>
          <button className="rounded p-1 hover:bg-[var(--color-background)]" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>

        <div className="px-3 pt-2 border-b" style={{ borderColor: "var(--color-primary)" }}>
          <div className="flex items-center gap-2 text-[12px]">
            <button
              className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${
                tab === "glass" ? "bg-primary/20 border-primary/40 text-white" : "border-white/10 text-text-secondary"
              }`}
              onClick={() => setTab("glass")}
            >
              <Eye className="w-3.5 h-3.5" /> Glass
            </button>
            <button
              className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${
                tab === "persona" ? "bg-primary/20 border-primary/40 text-white" : "border-white/10 text-text-secondary"
              }`}
              onClick={() => setTab("persona")}
            >
              <Palette className="w-3.5 h-3.5" /> Persona
            </button>
          </div>
        </div>

        <div className="p-3 overflow-y-auto flex-1 space-y-3">
          {tab === "glass" && (
            <section className="rounded-lg border p-3" style={{ borderColor: "var(--color-primary)" }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-text-main text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Glassmorphism
                </h3>
                <label className="text-[11px] text-text-secondary inline-flex items-center gap-2">
                  Enabled
                  <input
                    type="checkbox"
                    checked={!!local.glassEnabled}
                    onChange={(e) => handleUpdate({ glassEnabled: e.target.checked })}
                  />
                </label>
              </div>
              <div className={`${local.glassEnabled ? "opacity-100" : "opacity-60"}`}>
                <label className="block text-xs text-text-secondary mb-1">Blur (px)</label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={parseInt(String(local.glassBlur || "8px").replace("px", ""))}
                  onChange={(e) => handleUpdate({ glassBlur: `${clamp(parseInt(e.target.value) || 0, 0, 24)}px` })}
                  className="w-full"
                />
                <div className="text-[11px] text-text-secondary mb-3">{local.glassBlur}</div>

                <label className="block text-xs text-text-secondary mb-1">Surface Alpha (0-1)</label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={parseFloat(local.glassSurfaceAlpha || "0.6")}
                  onChange={(e) =>
                    handleUpdate({ glassSurfaceAlpha: String(clamp(parseFloat(e.target.value) || 0, 0, 1)) })
                  }
                  className="w-full"
                />
                <div className="text-[11px] text-text-secondary">{local.glassSurfaceAlpha}</div>
              </div>
            </section>
          )}

          {tab === "persona" && (
            <section
              className="rounded-lg border p-3 flex flex-col min-h-0"
              style={{ borderColor: "var(--color-primary)" }}
            >
              <h3 className="font-semibold text-text-main mb-2 text-sm">Persona Theme</h3>
              <div className="mb-3 flex items-center gap-2">
                <label className="text-xs text-text-secondary w-28">Active Persona</label>
                <select
                  className="flex-1 rounded border px-2 py-1 text-xs"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-primary)" }}
                  value={selectedId}
                  onChange={(e) => handleSelectPersona(e.target.value)}
                >
                  <option value="__standard__">Standard Issue (default)</option>
                  <option value="__genesis__">Genesis (Login Aesthetic)</option>
                  {personas.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {!editing ? (
                <div className="text-[11px] text-text-secondary">Select a persona to edit its colors.</div>
              ) : (
                <div className="space-y-3 overflow-auto pr-1">
                  <div>
                    <div className="font-semibold text-white text-sm mb-2">Colors</div>
                    <div className="space-y-2">
                      <ColorInput
                        label="Background"
                        value={editing.colors.bg}
                        onChange={(v) => setEditing({ ...editing, colors: { ...editing.colors, bg: v } })}
                      />
                      <ColorInput
                        label="Surface"
                        value={editing.colors.surface}
                        onChange={(v) => setEditing({ ...editing, colors: { ...editing.colors, surface: v } })}
                      />
                      <ColorInput
                        label="Primary"
                        value={editing.colors.primary}
                        onChange={(v) => setEditing({ ...editing, colors: { ...editing.colors, primary: v } })}
                      />
                      <ColorInput
                        label="Secondary"
                        value={editing.colors.secondary}
                        onChange={(v) => setEditing({ ...editing, colors: { ...editing.colors, secondary: v } })}
                      />
                      <ColorInput
                        label="Tertiary"
                        value={editing.colors.tertiary}
                        onChange={(v) => setEditing({ ...editing, colors: { ...editing.colors, tertiary: v } })}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-2">Text</div>
                    <div className="space-y-2">
                      <ColorInput
                        label="Main"
                        value={editing.text.main}
                        onChange={(v) => setEditing({ ...editing, text: { ...editing.text, main: v } })}
                      />
                      <ColorInput
                        label="Secondary"
                        value={editing.text.secondary}
                        onChange={(v) => setEditing({ ...editing, text: { ...editing.text, secondary: v } })}
                      />
                      <ColorInput
                        label="Tertiary"
                        value={editing.text.tertiary}
                        onChange={(v) => setEditing({ ...editing, text: { ...editing.text, tertiary: v } })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSave}
                      disabled={!editing._id || editing._id === "__standard__" || editing._id === "__genesis__"}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        !editing._id || editing._id === "__standard__" || editing._id === "__genesis__"
                          ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-primary/20 hover:bg-primary/30 border-primary/40 text-primary"
                      }`}
                      title={
                        editing?._id === "__standard__" || editing?._id === "__genesis__"
                          ? "System presets apply live; no save needed"
                          : "Save to database"
                      }
                    >
                      <Save className="inline-block w-4 h-4 mr-1" /> Save Changes
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default UiCustomizerModal;
