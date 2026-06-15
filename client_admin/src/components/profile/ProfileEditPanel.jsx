import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api, { getAssetUrl } from "../../services/api";
import StyledButton from "../ui/StyledButton";

export default function ProfileEditPanel() {
  const { user, setUser } = useAuth();
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [motto, setMotto] = useState(user?.motto || "");
  const [saving, setSaving] = useState(false);
  const [localFit, setLocalFit] = useState(user?.bannerFitMode || "cover");
  const [posX, setPosX] = useState(user?.bannerPositionX ?? 50);
  const [posY, setPosY] = useState(user?.bannerPositionY ?? 50);
  const [uploading, setUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  // Badge collections
  const [badgeCollections, setBadgeCollections] = useState([]);
  const [settingCollection, setSettingCollection] = useState(false);
  // Background modal + glass controls
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [bgFit, setBgFit] = useState(localStorage.getItem("tae.pageBgFit") || "cover");
  const [bgPosX, setBgPosX] = useState(Number(localStorage.getItem("tae.pageBgPosX") || 50));
  const [bgPosY, setBgPosY] = useState(Number(localStorage.getItem("tae.pageBgPosY") || 50));
  const [bgUrl, setBgUrl] = useState(localStorage.getItem("tae.pageBgImage") || "");
  const [bgTint, setBgTint] = useState(localStorage.getItem("tae.pageBgTint") || "rgba(0,0,0,0)");
  const [glassBlur, setGlassBlur] = useState(localStorage.getItem("tae.glass.blur") || "8px");
  const [glassSurfaceAlpha, setGlassSurfaceAlpha] = useState(localStorage.getItem("tae.glass.surfaceAlpha") || "0.6");
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const pageBgFileRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalFit(user?.bannerFitMode || "cover");
    setPosX(user?.bannerPositionX ?? 50);
    setPosY(user?.bannerPositionY ?? 50);
  }, [user]);

  // Load distinct badge collections from base badges
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const { data } = await api.get("/badges/base");
        const bases = data?.data || [];
        const keys = Array.from(new Set(bases.map((b) => b.collectionKey).filter(Boolean)));
        keys.sort((a, b) => String(a).localeCompare(String(b)));
        setBadgeCollections(keys);
      } catch (e) {
        console.error("Failed to load badge collections:", e);
      }
    };
    loadCollections();
  }, []);

  const bannerUrl = getAssetUrl(user?.bannerImage, null);
  const avatarUrl = user?.profilePicture
    ? getAssetUrl(user.profilePicture)
    : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user?.username || "user"}`;

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
    debounceRef.current = setTimeout(() => pushBannerSettings(updates), 250);
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

  const handleBannerSelect = () => bannerInputRef.current?.click();
  const handleAvatarSelect = () => avatarInputRef.current?.click();
  const handlePageBgSelect = () => pageBgFileRef.current?.click();

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
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      setAvatarUploading(true);
      const { data } = await api.put("/users/me/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data.data);
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      alert("Failed to upload profile picture.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const dispatchSettingsChanged = () => {
    // notify layout to re-read settings
    const event = new Event("tae:settings-changed");
    window.dispatchEvent(event);
  };

  const handlePageBgFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        localStorage.setItem("tae.pageBgImage", reader.result);
        setBgUrl(reader.result);
        dispatchSettingsChanged();
      } catch (err) {
        console.error("Failed to set page background:", err);
        alert("Failed to set page background.");
      }
    };
    reader.readAsDataURL(file);
  };

  const applyBgSettings = () => {
    localStorage.setItem("tae.pageBgFit", bgFit);
    localStorage.setItem("tae.pageBgPosX", String(bgPosX));
    localStorage.setItem("tae.pageBgPosY", String(bgPosY));
    localStorage.setItem("tae.pageBgImage", bgUrl || "");
    localStorage.setItem("tae.pageBgTint", bgTint || "rgba(0,0,0,0)");
    dispatchSettingsChanged();
  };

  const clearBgSettings = () => {
    localStorage.removeItem("tae.pageBgImage");
    setBgUrl("");
    dispatchSettingsChanged();
  };

  const applyGlassSettings = () => {
    localStorage.setItem("tae.glass.blur", glassBlur);
    localStorage.setItem("tae.glass.surfaceAlpha", glassSurfaceAlpha);
    // apply to CSS vars immediately
    const root = document.documentElement;
    root.style.setProperty("--glass-blur", glassBlur);
    root.style.setProperty("--glass-surface-alpha", glassSurfaceAlpha);
    dispatchSettingsChanged();
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/users/me/profile", { bio, location, website, motto });
      setUser(data.data);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const accent = user?.activeAbelPersona?.colors?.primary || "#22d3ee";

  return (
    <>
      <div className="px-1 sm:px-2 space-y-4">
        {/* Preview */}
        <div className="relative h-[12.5rem] sm:h-[15rem] md:h-[17.5rem] w-full rounded-xl overflow-hidden border border-white/10">
          {bannerUrl && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${bannerUrl})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: localFit,
                backgroundPosition: `${posX}% ${posY}%`,
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${accent}33, transparent), radial-gradient(1200px 400px at 0% 0%, ${accent}22, transparent 60%)`,
              boxShadow: "inset 0 0 80px rgba(255,255,255,0.03)",
            }}
          />
          {/* Avatar overlay to show layering */}
          <div className="absolute bottom-2 left-2 z-10 w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden shadow-lg">
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Banner controls */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-slate-200 font-semibold">Banner Image</div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-md bg-black/40 border border-white/15 hover:bg-black/50 transition text-sm"
                onClick={handleBannerSelect}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload Banner"}
              </button>
              <button
                className="px-3 py-1.5 rounded-md bg-black/40 border border-white/15 hover:bg-black/50 transition text-sm"
                onClick={() => setBgModalOpen(true)}
              >
                Add Page Background
              </button>
              <select
                className="px-2 py-1.5 rounded-md bg-black/40 border border-white/15 text-sm"
                value={localFit}
                onChange={(e) => onChangeFit(e.target.value)}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <span className="w-10">X Pos</span>
              <input
                type="range"
                min="0"
                max="100"
                value={posX}
                onChange={(e) => onChangePosX(Number(e.target.value))}
                className="flex-1 accent-teal-400"
              />
              <span className="w-8 text-right">{posX}%</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-10">Y Pos</span>
              <input
                type="range"
                min="0"
                max="100"
                value={posY}
                onChange={(e) => onChangePosY(Number(e.target.value))}
                className="flex-1 accent-teal-400"
              />
              <span className="w-8 text-right">{posY}%</span>
            </label>
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
        </div>

        {/* Avatar controls */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-200 font-semibold">Profile Picture</div>
            <button
              className="px-3 py-1.5 rounded-md bg-black/40 border border-white/15 hover:bg-black/50 transition text-sm"
              onClick={handleAvatarSelect}
              disabled={avatarUploading}
            >
              {avatarUploading ? "Uploading…" : "Upload Avatar"}
            </button>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Glass morphism controls */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
          <div className="text-sm text-slate-200 font-semibold">Glass Morphism</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <span className="w-20">Blur</span>
              <input
                type="range"
                min="0"
                max="30"
                value={parseInt(glassBlur) || 0}
                onChange={(e) => setGlassBlur(`${e.target.value}px`)}
                className="flex-1 accent-teal-400"
              />
              <span className="w-10 text-right">{glassBlur}</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-20">Surface α</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={parseFloat(glassSurfaceAlpha)}
                onChange={(e) => setGlassSurfaceAlpha(e.target.value)}
                className="flex-1 accent-teal-400"
              />
              <span className="w-10 text-right">{glassSurfaceAlpha}</span>
            </label>
          </div>
          <div className="flex justify-end">
            <StyledButton onClick={applyGlassSettings}>Apply Glass</StyledButton>
          </div>
        </div>

        {/* Active Badge Collection */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-200 font-semibold">Active Badge Collection</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-2 py-1.5 rounded-md bg-black/40 border border-white/15 text-sm text-white"
              value={user?.activeBadgeCollectionKey || ""}
              onChange={async (e) => {
                const val = e.target.value;
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
              }}
            >
              <option value="">None (disabled)</option>
              {badgeCollections.map((key) => (
                <option key={key} value={key}>
                  {String(key)}
                </option>
              ))}
            </select>
            <button
              className="px-3 py-1.5 rounded-md bg-black/40 border border-white/15 hover:bg-black/50 transition text-sm"
              disabled={settingCollection || !user?.activeBadgeCollectionKey}
              onClick={async () => {
                try {
                  setSettingCollection(true);
                  const { data } = await api.put("/users/me/profile/active-badge-collection", { collectionKey: null });
                  setUser(data.data);
                } catch (err) {
                  console.error("Failed to clear active badge collection:", err);
                } finally {
                  setSettingCollection(false);
                }
              }}
            >
              {settingCollection ? "Saving…" : "Clear"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">Unlocks 1 badge every 5 streak days.</p>
        </div>

        {/* General profile fields (optional) */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3">
          <div className="text-sm text-slate-200 font-semibold">Profile Details</div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full rounded-md bg-black/40 border border-white/15 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
              placeholder="Tell us about yourself..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
                className="w-full rounded-md bg-black/40 border border-white/15 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Motto</label>
              <input
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                maxLength={80}
                className="w-full rounded-md bg-black/40 border border-white/15 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="Stay curious. Keep building."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Website</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              maxLength={200}
              className="w-full rounded-md bg-black/40 border border-white/15 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
              placeholder="https://example.com"
            />
          </div>
          <div className="flex justify-end">
            <StyledButton onClick={handleSaveProfile} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </StyledButton>
          </div>
        </div>
      </div>

      {/* Page Background Modal */}
      {bgModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setBgModalOpen(false)}
        >
          <div
            className="bg-surface w-full max-w-xl rounded-lg border border-gray-700 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Page Background</h3>
              <button className="text-slate-300 hover:text-white" onClick={() => setBgModalOpen(false)}>
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Upload Image</label>
                <button
                  className="px-3 py-1.5 rounded-md bg-black/40 border border-white/15 hover:bg-black/50 transition text-sm"
                  onClick={handlePageBgSelect}
                >
                  Choose File
                </button>
                <input
                  ref={pageBgFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePageBgFile}
                />
                <label className="block text-xs text-slate-300">Or Image URL</label>
                <input
                  className="w-full rounded-md bg-black/40 border border-white/15 text-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="https://example.com/image.jpg"
                  value={bgUrl}
                  onChange={(e) => setBgUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Fit</label>
                <select
                  className="w-full rounded-md bg-black/40 border border-white/15 text-white p-2 text-sm"
                  value={bgFit}
                  onChange={(e) => setBgFit(e.target.value)}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
                <label className="block text-xs text-slate-300">Tint (CSS color)</label>
                <input
                  className="w-full rounded-md bg-black/40 border border-white/15 text-white p-2 text-sm"
                  placeholder="e.g. rgba(0,0,0,0.3) or #00000080"
                  value={bgTint}
                  onChange={(e) => setBgTint(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <label className="flex items-center gap-2">
                <span className="w-16">X Pos</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgPosX}
                  onChange={(e) => setBgPosX(Number(e.target.value))}
                  className="flex-1 accent-teal-400"
                />
                <span className="w-8 text-right">{bgPosX}%</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="w-16">Y Pos</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={bgPosY}
                  onChange={(e) => setBgPosY(Number(e.target.value))}
                  className="flex-1 accent-teal-400"
                />
                <span className="w-8 text-right">{bgPosY}%</span>
              </label>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                className="px-3 py-1.5 rounded-md bg-red-600/80 hover:bg-red-600 text-white text-sm"
                onClick={clearBgSettings}
              >
                Clear Background
              </button>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-md bg-black/40 border border-white/15 hover:bg-black/50 text-sm"
                  onClick={() => setBgModalOpen(false)}
                >
                  Cancel
                </button>
                <StyledButton
                  onClick={() => {
                    applyBgSettings();
                    setBgModalOpen(false);
                  }}
                >
                  Apply Background
                </StyledButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
