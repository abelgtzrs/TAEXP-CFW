import { useAuth } from "../../context/AuthContext";
import Widget from "../ui/Widget";
import { Camera, MapPin, Globe, MessageSquare, Zap, Pencil, Check, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import api from "../../services/api";

const AvatarUploader = memo(function AvatarUploader({ src, username, onPick, uploading }) {
  return (
    <div className="relative group flex-shrink-0" style={{ width: 80, height: 80 }}>
      {/* Gradient ring using the padding-box technique */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(135deg, var(--color-primary) 0%, transparent 70%)",
          padding: 2,
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-background">
          <img
            src={src}
            alt={username ? `${username}'s avatar` : "User Avatar"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <button
        type="button"
        aria-label="Upload profile picture"
        className="absolute inset-0 rounded-full bg-black/65 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer z-10"
        onClick={onPick}
        disabled={uploading}
      >
        <Camera size={18} className="text-white" />
      </button>
    </div>
  );
});

const XPBar = memo(function XPBar({ level, xp, xpToNextLevel }) {
  const percent = useMemo(() => {
    if (!xpToNextLevel || xpToNextLevel <= 0) return 0;
    return Math.max(0, Math.min(100, (xp / xpToNextLevel) * 100));
  }, [xp, xpToNextLevel]);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          <Zap size={11} className="text-primary" />
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.12em]">Level {level}</span>
        </div>
        <span className="text-[10px] text-text-tertiary tabular-nums font-mono">
          {xp} / {xpToNextLevel} XP
        </span>
      </div>
      <div className="relative w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percent}%`, boxShadow: "0 0 8px var(--color-primary)" }}
        />
      </div>
    </div>
  );
});

const FieldInput = ({ label, value, onChange, maxLength, placeholder, multiline, rows = 3 }) => {
  const base =
    "w-full bg-transparent border-b border-white/10 text-text-main text-sm py-1.5 focus:outline-none focus:border-primary placeholder:text-text-tertiary/40 transition-colors duration-150";
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-text-tertiary mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={rows}
          className={`${base} resize-none`}
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          className={base}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

const UserInfoCard = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [motto, setMotto] = useState("");
  const [saving, setSaving] = useState(false);

  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];

  useEffect(() => {
    setBio(user?.bio || "");
    setLocation(user?.location || "");
    setWebsite(user?.website || "");
    setMotto(user?.motto || "");
  }, [user]);

  if (!user) return null;

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePicture", file);
    try {
      setUploading(true);
      const { data } = await api.put("/users/me/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data.data);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const normalizeUrl = (url) => {
    const trimmed = (url || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        bio: bio.trim(),
        location: location.trim(),
        website: normalizeUrl(website),
        motto: motto.trim(),
      };
      const { data } = await api.put("/users/me/profile", payload);
      setUser(data.data);
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = user.profilePicture
    ? `${serverBaseUrl}${user.profilePicture}`
    : `https://api.dicebear.com/8.x/pixel-art/svg?seed=${user?.username || "user"}`;

  return (
    <Widget title="" padding="p-0" className="overflow-hidden">
      {/* Accent banner */}
      <div className="w-full h-16 flex-shrink-0 bg-gradient-to-br from-primary/10 to-transparent" />

      <div className="px-5 pb-5">
        {/* Avatar + identity â€” overlaps the banner */}
        <div className="flex items-end gap-4 -mt-10 mb-5">
          <AvatarUploader src={avatarSrc} username={user.username} onPick={handleFileSelect} uploading={uploading} />
          <div className="pb-0.5 min-w-0 flex-1">
            <h2 className="text-base font-bold text-text-main leading-tight truncate">{user.username}</h2>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-widest mt-1.5 px-2 py-[3px] text-primary bg-primary/10 border border-primary/20">
              {user.equippedTitle?.titleBase?.name || "Cognitive Framework User"}
            </span>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

        {/* XP Bar */}
        <XPBar level={user.level} xp={user.experience} xpToNextLevel={user.xpToNextLevel} />

        {/* Divider */}
        <div className="h-px bg-white/5 my-4" />

        {/* Profile view / edit */}
        {!editing ? (
          <div className="space-y-3 min-h-[60px]">
            {bio && <p className="text-sm text-text-secondary leading-relaxed">{bio}</p>}
            <div className="space-y-1.5">
              {location && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <MapPin size={11} className="flex-shrink-0 text-primary/60" />
                  <span>{location}</span>
                </div>
              )}
              {motto && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <MessageSquare size={11} className="flex-shrink-0 text-primary/60" />
                  <span className="italic">{motto}</span>
                </div>
              )}
              {website && (
                <div className="flex items-center gap-2 text-xs">
                  <Globe size={11} className="flex-shrink-0 text-primary/60" />
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 truncate transition-colors"
                  >
                    {website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FieldInput
              label="Bio"
              value={bio}
              onChange={setBio}
              maxLength={500}
              placeholder="Tell us about yourself..."
              multiline
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                label="Location"
                value={location}
                onChange={setLocation}
                maxLength={100}
                placeholder="City, Country"
              />
              <FieldInput
                label="Motto"
                value={motto}
                onChange={setMotto}
                maxLength={80}
                placeholder="Stay curious..."
              />
            </div>
            <FieldInput
              label="Website"
              value={website}
              onChange={setWebsite}
              maxLength={200}
              placeholder="example.com"
            />
          </div>
        )}

        {/* Actions */}
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full mt-5 flex items-center justify-center gap-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary border border-white/10 hover:border-primary/40 hover:text-primary transition-all duration-200"
          >
            <Pencil size={11} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <X size={11} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-all duration-200 disabled:opacity-50"
            >
              <Check size={11} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
    </Widget>
  );
};

export default UserInfoCard;
