import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { listPersonas } from "../../services/personaService";
import {
  User, Image as ImageIcon, Camera, Palette, Award, Layers, Upload, RotateCcw, Check, X,
  Zap, Sparkles,
} from "lucide-react";

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.06]">
        <Icon size={13} className="text-white/35" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-white/30">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/45">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-white/22">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/90 placeholder-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition"
    />
  );
}

function TextareaInput({ value, onChange, placeholder, maxLength, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/90 placeholder-white/20 px-3 py-2 text-sm focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition resize-none"
    />
  );
}

function SliderRow({ label, id, min, max, step = 1, value, onChange, unit = "", defaultValue, accent }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs text-white/45">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-white/50 tabular-nums">
            {value}
            {unit}
          </span>
          {defaultValue !== undefined && (
            <button
              type="button"
              onClick={() => onChange(defaultValue)}
              className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/5 transition"
              title="Reset"
            >
              <RotateCcw size={10} />
            </button>
          )}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

function UploadBtn({ onClick, loading, children, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white/65 hover:text-white text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Upload size={12} className="shrink-0" />
      {loading ? "Uploading…" : children}
    </button>
  );
}

function SaveBtn({ onClick, loading, children = "Save Changes", accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: accent }}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Check size={13} />
          {children}
        </>
      )}
    </button>
  );
}

function AppliedBadge() {
  return (
    <span className="text-xs text-emerald-400 flex items-center gap-1 mr-3">
      <Check size={11} /> Applied
    </span>
  );
}

function SavedBadge() {
  return (
    <span className="text-xs text-emerald-400 flex items-center gap-1 mr-3">
      <Check size={11} /> Saved
    </span>
  );
}

// ─── Section: Identity ────────────────────────────────────────────────────────

function IdentitySection({ user, setUser, accent }) {
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [motto, setMotto] = useState(user?.motto || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/users/me/profile", { bio, location, website, motto });
      setUser(data.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Identity" icon={User}>
      <div className="space-y-4">
        <Field label="Bio">
          <TextareaInput value={bio} onChange={setBio} placeholder="Tell us about yourself…" maxLength={500} rows={4} />
          <p className="text-right text-[11px] text-white/20 -mt-0.5">{bio.length}/500</p>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location">
            <TextInput value={location} onChange={setLocation} placeholder="City, Country" maxLength={100} />
          </Field>
          <Field label="Motto">
            <TextInput value={motto} onChange={setMotto} placeholder="Stay curious. Keep building." maxLength={80} />
          </Field>
        </div>
        <Field label="Website">
          <TextInput value={website} onChange={setWebsite} placeholder="https://example.com" maxLength={200} />
        </Field>
        <div className="flex items-center justify-end pt-1">
          {saved && <SavedBadge />}
          <SaveBtn onClick={handleSave} loading={saving} accent={accent} />
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section: Banner ──────────────────────────────────────────────────────────

function BannerSection({ user, setUser, accent, bannerHeightPx, setBannerHeightPx }) {
  const [localFit, setLocalFit] = useState(user?.bannerFitMode || "cover");
  const [posX, setPosX] = useState(user?.bannerPositionX ?? 50);
  const [posY, setPosY] = useState(user?.bannerPositionY ?? 50);
  const [uploading, setUploading] = useState(false);
  const bannerInputRef = useRef(null);
  const debounceRef = useRef(null);

  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const bannerUrl = user?.bannerImage ? `${serverBaseUrl}${user.bannerImage}` : null;

  useEffect(() => {
    setLocalFit(user?.bannerFitMode || "cover");
    setPosX(user?.bannerPositionX ?? 50);
    setPosY(user?.bannerPositionY ?? 50);
  }, [user]);

  const pushBannerSettings = async (updates) => {
    try {
      const { data } = await api.put("/users/me/profile/banner-settings", updates);
      setUser(data.data);
    } catch (err) {
      console.error("Failed to update banner settings:", err);
    }
  };

  const debouncedPush = (updates) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushBannerSettings(updates), 280);
  };

  const onChangeFit = (val) => {
    setLocalFit(val);
    pushBannerSettings({ bannerFitMode: val });
  };
  const onChangePosX = (val) => {
    setPosX(val);
    debouncedPush({ bannerPositionX: val });
  };
  const onChangePosY = (val) => {
    setPosY(val);
    debouncedPush({ bannerPositionY: val });
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profileBanner", file);
    try {
      setUploading(true);
      const { data } = await api.put("/users/me/profile-banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data.data);
    } catch (err) {
      console.error("Error uploading banner:", err);
      alert("Failed to upload banner image.");
    } finally {
      setUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  return (
    <SectionCard title="Banner" icon={ImageIcon}>
      <div className="space-y-5">
        {/* Live preview */}
        <div
          className="relative w-full overflow-hidden rounded-xl border border-white/[0.07]"
          style={{ height: Math.round(bannerHeightPx * 0.38 + 48) }}
        >
          {bannerUrl ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${bannerUrl})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: localFit,
                backgroundPosition: `${posX}% ${posY}%`,
              }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 20% 20%, ${accent}28 0%, transparent 60%), linear-gradient(160deg, #0c0c14, #14141f)`,
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(145deg, ${accent}14 0%, transparent 55%)`, mixBlendMode: "overlay" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-10"
            style={{ background: "linear-gradient(to top, rgba(10,10,18,0.9), transparent)" }}
          />
          <span className="absolute bottom-2 left-3 text-[10px] text-white/28 font-medium tracking-wide uppercase">
            Preview
          </span>
        </div>

        {/* Upload + fit */}
        <div className="flex flex-wrap items-center gap-3">
          <UploadBtn onClick={() => bannerInputRef.current?.click()} loading={uploading} accent={accent}>
            Upload Banner
          </UploadBtn>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-white/28">Fit</span>
            <select
              value={localFit}
              onChange={(e) => onChangeFit(e.target.value)}
              className="rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/75 text-xs px-2 py-1.5 focus:outline-none"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-3 pt-1">
          <SliderRow
            label="Horizontal position"
            id="bPosX"
            min={0}
            max={100}
            value={posX}
            onChange={onChangePosX}
            unit="%"
            accent={accent}
          />
          <SliderRow
            label="Vertical position"
            id="bPosY"
            min={0}
            max={100}
            value={posY}
            onChange={onChangePosY}
            unit="%"
            accent={accent}
          />
          <SliderRow
            label="Banner height"
            id="bHeight"
            min={160}
            max={520}
            step={8}
            value={bannerHeightPx}
            onChange={setBannerHeightPx}
            defaultValue={260}
            unit="px"
            accent={accent}
          />
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Section: Avatar ──────────────────────────────────────────────────────────

function AvatarSection({ user, setUser, accent }) {
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
  const avatarUrl = user?.profilePicture
    ? `${serverBaseUrl}${user.profilePicture}`
    : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user?.username || "user"}`;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      setUploading(true);
      const { data } = await api.put("/users/me/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data.data);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Failed to upload profile picture.");
    } finally {
      setUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  return (
    <SectionCard title="Avatar" icon={Camera}>
      <div className="flex items-center gap-5">
        <div
          className="shrink-0 rounded-full p-[3px]"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}50)`,
            boxShadow: `0 0 18px ${accent}35`,
          }}
        >
          <div className="rounded-full overflow-hidden" style={{ padding: 2, background: "var(--color-bg)" }}>
            <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover block" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-white/38 leading-relaxed max-w-xs">
            Upload a new profile picture. Square images work best; 256×256px or larger recommended.
          </p>
          <UploadBtn onClick={() => avatarInputRef.current?.click()} loading={uploading} accent={accent}>
            Upload Avatar
          </UploadBtn>
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>
    </SectionCard>
  );
}

// ─── Section: Theme ───────────────────────────────────────────────────────────

function ThemeSection({ accent }) {
  const [glassBlur, setGlassBlur] = useState(() => localStorage.getItem("tae.glass.blur") || "8px");
  const [glassSurfaceAlpha, setGlassSurfaceAlpha] = useState(
    () => localStorage.getItem("tae.glass.surfaceAlpha") || "0.6",
  );
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem("tae.pageBgImage") || "");
  const [bgFit, setBgFit] = useState(() => localStorage.getItem("tae.pageBgFit") || "cover");
  const [bgPosX, setBgPosX] = useState(() => Number(localStorage.getItem("tae.pageBgPosX") || 50));
  const [bgPosY, setBgPosY] = useState(() => Number(localStorage.getItem("tae.pageBgPosY") || 50));
  const [bgTint, setBgTint] = useState(() => localStorage.getItem("tae.pageBgTint") || "rgba(0,0,0,0)");
  const [glassApplied, setGlassApplied] = useState(false);
  const [bgApplied, setBgApplied] = useState(false);
  const pageBgFileRef = useRef(null);

  const dispatch = () => window.dispatchEvent(new Event("tae:settings-changed"));

  const applyGlass = () => {
    localStorage.setItem("tae.glass.blur", glassBlur);
    localStorage.setItem("tae.glass.surfaceAlpha", glassSurfaceAlpha);
    document.documentElement.style.setProperty("--glass-blur", glassBlur);
    document.documentElement.style.setProperty("--glass-surface-alpha", glassSurfaceAlpha);
    dispatch();
    setGlassApplied(true);
    setTimeout(() => setGlassApplied(false), 2500);
  };

  const applyBg = () => {
    localStorage.setItem("tae.pageBgFit", bgFit);
    localStorage.setItem("tae.pageBgPosX", String(bgPosX));
    localStorage.setItem("tae.pageBgPosY", String(bgPosY));
    localStorage.setItem("tae.pageBgImage", bgUrl || "");
    localStorage.setItem("tae.pageBgTint", bgTint || "rgba(0,0,0,0)");
    dispatch();
    setBgApplied(true);
    setTimeout(() => setBgApplied(false), 2500);
  };

  const clearBg = () => {
    localStorage.removeItem("tae.pageBgImage");
    setBgUrl("");
    dispatch();
  };

  const handleBgFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem("tae.pageBgImage", reader.result);
        setBgUrl(reader.result);
        dispatch();
      } catch {
        alert("Failed to set page background.");
      }
    };
    reader.readAsDataURL(file);
  };

  const isDataUrl = bgUrl.startsWith("data:");

  return (
    <div className="space-y-4">
      {/* Glass morphism */}
      <SectionCard title="Glass Morphism" icon={Layers}>
        <div className="space-y-3">
          <SliderRow
            label="Blur radius"
            id="glassBlur"
            min={0}
            max={30}
            value={parseInt(glassBlur) || 0}
            onChange={(v) => setGlassBlur(`${v}px`)}
            unit="px"
            defaultValue={8}
            accent={accent}
          />
          <SliderRow
            label="Surface opacity"
            id="glassSurface"
            min={0}
            max={1}
            step={0.05}
            value={parseFloat(glassSurfaceAlpha)}
            onChange={(v) => setGlassSurfaceAlpha(String(v))}
            defaultValue={0.6}
            accent={accent}
          />
          <div className="flex items-center justify-end pt-1">
            {glassApplied && <AppliedBadge />}
            <SaveBtn onClick={applyGlass} accent={accent}>
              Apply Glass
            </SaveBtn>
          </div>
        </div>
      </SectionCard>

      {/* Page background */}
      <SectionCard title="Page Background" icon={Palette}>
        <div className="space-y-4">
          {/* Preview strip */}
          {bgUrl && (
            <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/[0.07]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${bgUrl})`,
                  backgroundSize: bgFit,
                  backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                  backgroundRepeat: "no-repeat",
                }}
              />
              <button
                type="button"
                onClick={clearBg}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-600/80 text-white/70 hover:text-white transition"
              >
                <X size={11} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Upload image">
              <UploadBtn onClick={() => pageBgFileRef.current?.click()} accent={accent}>
                Choose File
              </UploadBtn>
              <input ref={pageBgFileRef} type="file" accept="image/*" className="hidden" onChange={handleBgFile} />
            </Field>
            <Field label="Or paste URL">
              <TextInput value={isDataUrl ? "" : bgUrl} onChange={setBgUrl} placeholder="https://example.com/bg.jpg" />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fit mode">
              <select
                value={bgFit}
                onChange={(e) => setBgFit(e.target.value)}
                className="w-full rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/75 text-sm px-3 py-2 focus:outline-none"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </Field>
            <Field label="Tint overlay (CSS color)">
              <TextInput value={bgTint} onChange={setBgTint} placeholder="rgba(0,0,0,0.3)" />
            </Field>
          </div>

          <SliderRow
            label="Horizontal position"
            id="bgPosX"
            min={0}
            max={100}
            value={bgPosX}
            onChange={setBgPosX}
            unit="%"
            accent={accent}
          />
          <SliderRow
            label="Vertical position"
            id="bgPosY"
            min={0}
            max={100}
            value={bgPosY}
            onChange={setBgPosY}
            unit="%"
            accent={accent}
          />

          <div className="flex items-center justify-end pt-1">
            {bgApplied && <AppliedBadge />}
            <SaveBtn onClick={applyBg} accent={accent}>
              Apply Background
            </SaveBtn>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Section: Persona ────────────────────────────────────────────────────────

function PersonaSection({ user, setUser, accent }) {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    listPersonas()
      .then((list) => setPersonas(list || []))
      .catch((e) => console.error("Failed to load personas", e))
      .finally(() => setLoading(false));
  }, []);

  const activatePersona = async (id) => {
    try {
      setActivating(id);
      const { data } = await api.put("/users/me/profile/active-persona", { personaId: id || null });
      setUser(data.data);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    } catch (err) {
      console.error("Failed to set active persona:", err);
      alert("Failed to set active persona.");
    } finally {
      setActivating(null);
    }
  };

  const activeId = user?.activeAbelPersona?._id || user?.activeAbelPersona || null;

  return (
    <SectionCard title="Persona" icon={Zap}>
      <div className="space-y-4">
        <p className="text-xs text-white/35 leading-relaxed">
          Switch your active persona to change the accent color and theme across the dashboard.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <span
              className="w-4 h-4 rounded-full border-2 border-white/15 animate-spin"
              style={{ borderTopColor: accent }}
            />
            <span className="text-xs text-white/28">Loading personas…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Standard / no persona */}
            <button
              type="button"
              onClick={() => activatePersona(null)}
              disabled={!!activating}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                !activeId
                  ? "border-white/25 bg-white/[0.06]"
                  : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/15" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/75">Standard</p>
                <p className="text-[11px] text-white/28">Default theme</p>
              </div>
              {!activeId && <Check size={13} className="text-emerald-400 shrink-0" />}
              {activating === "__null__" && (
                <span className="w-3 h-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              )}
            </button>

            {personas.map((p) => {
              const primary = p.colors?.primary || "#22d3ee";
              const secondary = p.colors?.secondary || primary;
              const isActive = String(activeId) === String(p._id);
              const isActivating = activating === p._id;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => activatePersona(p._id)}
                  disabled={!!activating}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left ${
                    isActive
                      ? "border-white/25 bg-white/[0.06]"
                      : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${secondary}60)`,
                      boxShadow: isActive ? `0 0 12px ${primary}50` : undefined,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-[11px] text-white/28 truncate">{p.description}</p>
                    )}
                  </div>
                  {isActive && <Check size={13} className="text-emerald-400 shrink-0" />}
                  {isActivating && (
                    <span
                      className="w-3 h-3 rounded-full border-2 border-white/20 animate-spin shrink-0"
                      style={{ borderTopColor: primary }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {applied && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <Check size={11} /> Persona applied — reload to see full effect
          </p>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Section: Appearance ─────────────────────────────────────────────────────

const AVATAR_SHAPES = [
  { id: "circle",   label: "Circle",   radius: "50%"   },
  { id: "squircle", label: "Squircle", radius: "32%"   },
  { id: "rounded",  label: "Rounded",  radius: "18px"  },
];

const AVATAR_RINGS = [
  { id: "thin",   label: "Thin",   px: 2 },
  { id: "medium", label: "Medium", px: 3 },
  { id: "thick",  label: "Thick",  px: 5 },
];

const CARD_RADII = [
  { id: "8",  label: "Sharp"  },
  { id: "12", label: "Normal" },
  { id: "20", label: "Soft"   },
  { id: "32", label: "Pill"   },
];

function ToggleChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
        active
          ? "bg-white/[0.08] border-white/20 text-white"
          : "bg-white/[0.02] border-white/[0.06] text-white/30 hover:text-white/55"
      }`}
    >
      {active && <Check size={10} className="text-emerald-400" />}
      {children}
    </button>
  );
}

function OptionRow({ options, value, onChange, accent, renderOption }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              active ? "text-black border-transparent" : "text-white/38 border-white/[0.07] bg-white/[0.02] hover:text-white/60"
            }`}
            style={active ? { background: accent } : {}}
          >
            {renderOption ? renderOption(opt) : opt.label}
          </button>
        );
      })}
    </div>
  );
}

function AppearanceSection({ accent: liveAccent }) {
  const dispatch = () => window.dispatchEvent(new Event("tae:settings-changed"));

  const [accentOverride, setAccentOverride] = useState(
    () => localStorage.getItem("tae.appearance.accentOverride") || "",
  );
  const [avatarShape, setAvatarShape] = useState(
    () => localStorage.getItem("tae.appearance.avatarShape") || "circle",
  );
  const [avatarRing, setAvatarRing] = useState(
    () => localStorage.getItem("tae.appearance.avatarRing") || "medium",
  );
  const [avatarGlow, setAvatarGlow] = useState(
    () => Number(localStorage.getItem("tae.appearance.avatarGlow") ?? 45),
  );
  const [showStreakChip, setShowStreakChip] = useState(
    () => localStorage.getItem("tae.appearance.showStreakChip") !== "false",
  );
  const [showItemsChip, setShowItemsChip] = useState(
    () => localStorage.getItem("tae.appearance.showItemsChip") !== "false",
  );
  const [showBadgesChip, setShowBadgesChip] = useState(
    () => localStorage.getItem("tae.appearance.showBadgesChip") !== "false",
  );
  const [cardRadius, setCardRadius] = useState(
    () => localStorage.getItem("tae.appearance.cardRadius") || "12",
  );

  // Persist + dispatch on every change
  const set = (key, val, setter) => {
    setter(val);
    try {
      if (key === "tae.appearance.accentOverride") {
        if (val) localStorage.setItem(key, val); else localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, String(val));
      }
    } catch {}
    dispatch();
  };

  const previewAccent = accentOverride || liveAccent;
  const previewShape = AVATAR_SHAPES.find((s) => s.id === avatarShape)?.radius || "50%";
  const previewRingPad = AVATAR_RINGS.find((r) => r.id === avatarRing)?.px || 3;
  const previewGlowAlpha = Math.round((avatarGlow / 100) * 80).toString(16).padStart(2, "0");

  return (
    <div className="space-y-4">
      {/* ── Accent Color ─── */}
      <SectionCard title="Accent Color" icon={Palette}>
        <div className="space-y-4">
          <p className="text-xs text-white/35 leading-relaxed">
            Override your persona&rsquo;s accent color with a custom one. Leave blank to use the persona color.
          </p>
          <div className="flex items-center gap-4">
            {/* Color preview + native picker */}
            <div className="relative shrink-0">
              <div
                className="w-12 h-12 rounded-xl border-2 border-black/20 cursor-pointer shadow-lg"
                style={{ background: previewAccent }}
              />
              <input
                type="color"
                value={accentOverride || liveAccent}
                onChange={(e) => set("tae.appearance.accentOverride", e.target.value, setAccentOverride)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-xl"
                title="Pick accent color"
              />
            </div>
            <div className="flex-1 space-y-2">
              <TextInput
                value={accentOverride}
                onChange={(v) => set("tae.appearance.accentOverride", v, setAccentOverride)}
                placeholder="#22d3ee or leave blank for persona"
              />
              {accentOverride && (
                <button
                  type="button"
                  onClick={() => set("tae.appearance.accentOverride", "", setAccentOverride)}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/55 transition"
                >
                  <RotateCcw size={10} /> Reset to persona color
                </button>
              )}
            </div>
            {/* Quick swatches */}
            <div className="flex flex-col gap-1.5">
              {["#22d3ee", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("tae.appearance.accentOverride", c, setAccentOverride)}
                  className="w-4 h-4 rounded-full border border-black/20 transition hover:scale-125"
                  style={{ background: c, boxShadow: accentOverride === c ? `0 0 6px ${c}` : undefined }}
                />
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Avatar Style ─── */}
      <SectionCard title="Avatar Style" icon={Camera}>
        <div className="space-y-5">
          {/* Live mini-preview */}
          <div className="flex items-center gap-5">
            <div
              className="shrink-0"
              style={{
                borderRadius: previewShape,
                padding: previewRingPad,
                background: `linear-gradient(135deg, ${previewAccent}, ${previewAccent}50)`,
                boxShadow: avatarGlow > 0 ? `0 0 16px ${previewAccent}${previewGlowAlpha}` : "none",
              }}
            >
              <div
                className="w-16 h-16 bg-white/[0.06] flex items-center justify-center"
                style={{ borderRadius: previewShape, overflow: "hidden", padding: 2, background: "var(--color-bg)" }}
              >
                <span className="text-2xl select-none">👤</span>
              </div>
            </div>
            <div className="text-xs text-white/25 leading-relaxed">
              Live preview — changes apply immediately to the profile header.
            </div>
          </div>

          <Field label="Shape">
            <OptionRow
              options={AVATAR_SHAPES}
              value={avatarShape}
              onChange={(v) => set("tae.appearance.avatarShape", v, setAvatarShape)}
              accent={previewAccent}
              renderOption={(opt) => (
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 bg-white/30"
                    style={{ borderRadius: opt.radius }}
                  />
                  {opt.label}
                </span>
              )}
            />
          </Field>

          <Field label="Ring weight">
            <OptionRow
              options={AVATAR_RINGS}
              value={avatarRing}
              onChange={(v) => set("tae.appearance.avatarRing", v, setAvatarRing)}
              accent={previewAccent}
            />
          </Field>

          <SliderRow
            label="Glow intensity"
            id="avatarGlow"
            min={0}
            max={80}
            value={avatarGlow}
            onChange={(v) => set("tae.appearance.avatarGlow", v, setAvatarGlow)}
            defaultValue={45}
            unit=""
            accent={previewAccent}
          />
        </div>
      </SectionCard>

      {/* ── Header Chips ─── */}
      <SectionCard title="Header Chips" icon={Sparkles}>
        <div className="space-y-3">
          <p className="text-xs text-white/35 leading-relaxed">
            Choose which stat chips are visible in your profile header.
          </p>
          <div className="flex gap-2 flex-wrap">
            <ToggleChip
              active={showStreakChip}
              onClick={() => set("tae.appearance.showStreakChip", !showStreakChip, setShowStreakChip)}
            >
              🔥 Streak
            </ToggleChip>
            <ToggleChip
              active={showItemsChip}
              onClick={() => set("tae.appearance.showItemsChip", !showItemsChip, setShowItemsChip)}
            >
              🖼 Items
            </ToggleChip>
            <ToggleChip
              active={showBadgesChip}
              onClick={() => set("tae.appearance.showBadgesChip", !showBadgesChip, setShowBadgesChip)}
            >
              🏅 Badges
            </ToggleChip>
          </div>
        </div>
      </SectionCard>

      {/* ── Card Radius ─── */}
      <SectionCard title="Card Corner Radius" icon={Layers}>
        <div className="space-y-3">
          <p className="text-xs text-white/35 leading-relaxed">
            Control how rounded the profile&rsquo;s cards and panels look.
          </p>
          <OptionRow
            options={CARD_RADII}
            value={cardRadius}
            onChange={(v) => {
              set("tae.appearance.cardRadius", v, setCardRadius);
              document.documentElement.style.setProperty("--profile-card-radius", `${v}px`);
            }}
            accent={previewAccent}
          />
          {/* Sample card preview */}
          <div className="flex gap-2 pt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-1 h-10 bg-white/[0.05] border border-white/[0.07] transition-all"
                style={{ borderRadius: `${cardRadius}px` }}
              />
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Section: Badges ──────────────────────────────────────────────────────────

function BadgesSection({ user, setUser, accent }) {
  const [badgeCollections, setBadgeCollections] = useState([]);
  const [settingCollection, setSettingCollection] = useState(false);

  useEffect(() => {
    api
      .get("/badges/base")
      .then(({ data }) => {
        const keys = Array.from(new Set((data?.data || []).map((b) => b.collectionKey).filter(Boolean))).sort((a, b) =>
          String(a).localeCompare(String(b)),
        );
        setBadgeCollections(keys);
      })
      .catch((e) => console.error("Failed to load badge collections:", e));
  }, []);

  const setCollection = async (val) => {
    try {
      setSettingCollection(true);
      const { data } = await api.put("/users/me/profile/active-badge-collection", {
        collectionKey: val || null,
      });
      setUser(data.data);
    } catch (err) {
      console.error("Failed to set active badge collection:", err);
      alert("Failed to set active badge collection.");
    } finally {
      setSettingCollection(false);
    }
  };

  return (
    <SectionCard title="Badge Collection" icon={Award}>
      <div className="space-y-4">
        <p className="text-xs text-white/35 leading-relaxed">
          Choose an active badge collection. You earn 1 new badge every 5 streak days.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={user?.activeBadgeCollectionKey || ""}
            onChange={(e) => setCollection(e.target.value)}
            disabled={settingCollection}
            className="rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/80 text-sm px-3 py-2 focus:outline-none min-w-[180px]"
          >
            <option value="">None (disabled)</option>
            {badgeCollections.map((key) => (
              <option key={key} value={key}>
                {String(key)}
              </option>
            ))}
          </select>

          {user?.activeBadgeCollectionKey && (
            <button
              type="button"
              onClick={() => setCollection(null)}
              disabled={settingCollection}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/38 hover:text-white/65 hover:border-white/15 text-xs transition disabled:opacity-40"
            >
              <X size={11} />
              Clear
            </button>
          )}

          {settingCollection && <span className="text-xs text-white/28 animate-pulse">Saving…</span>}
        </div>

        {user?.activeBadgeCollectionKey && (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
            style={{ color: accent, borderColor: `${accent}35`, background: `${accent}10` }}
          >
            <Award size={9} />
            Active: {user.activeBadgeCollectionKey}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Main EditTab ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "identity",   label: "Identity",   Icon: User        },
  { id: "banner",     label: "Banner",     Icon: ImageIcon   },
  { id: "avatar",     label: "Avatar",     Icon: Camera      },
  { id: "appearance", label: "Appearance", Icon: Sparkles    },
  { id: "theme",      label: "Theme",      Icon: Palette     },
  { id: "persona",    label: "Persona",    Icon: Zap         },
  { id: "badges",     label: "Badges",     Icon: Award       },
];

const EditTab = ({ bannerHeightPx, setBannerHeightPx, accent }) => {
  const { user, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState("identity");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      className="flex gap-6 items-start"
    >
      {/* Sidebar (desktop) */}
      <nav className="hidden sm:flex flex-col w-40 shrink-0 sticky top-4 gap-0.5">
        {SECTIONS.map(({ id, label, Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                active ? "text-white bg-white/[0.07]" : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={13} className="shrink-0" style={active ? { color: accent } : {}} />
              {label}
              {active && <span className="ml-auto w-1 h-1 rounded-full" style={{ background: accent }} />}
            </button>
          );
        })}
      </nav>

      {/* Pill nav (mobile) */}
      <div className="sm:hidden w-full">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-3">
          {SECTIONS.map(({ id, label, Icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  active ? "text-black" : "text-white/40 bg-white/[0.05] hover:text-white/60"
                }`}
                style={active ? { background: accent } : {}}
              >
                <Icon size={11} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content panel */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.14 }}
          >
            {activeSection === "identity" && <IdentitySection user={user} setUser={setUser} accent={accent} />}
            {activeSection === "banner" && (
              <BannerSection
                user={user}
                setUser={setUser}
                accent={accent}
                bannerHeightPx={bannerHeightPx}
                setBannerHeightPx={setBannerHeightPx}
              />
            )}
            {activeSection === "avatar" && <AvatarSection user={user} setUser={setUser} accent={accent} />}
            {activeSection === "appearance" && <AppearanceSection accent={accent} />}
            {activeSection === "theme" && <ThemeSection accent={accent} />}
            {activeSection === "persona" && <PersonaSection user={user} setUser={setUser} accent={accent} />}
            {activeSection === "badges" && <BadgesSection user={user} setUser={setUser} accent={accent} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default EditTab;
