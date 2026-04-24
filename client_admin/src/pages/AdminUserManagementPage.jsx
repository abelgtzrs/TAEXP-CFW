import { useEffect, useState, useMemo, useCallback } from "react";
import { adminUserService } from "../services/adminUserService";
import api from "../services/api";
import {
  FiRefreshCcw,
  FiEdit2,
  FiSave,
  FiX,
  FiKey,
  FiUser,
  FiUsers,
  FiShield,
  FiActivity,
  FiDollarSign,
  FiHeart,
  FiStar,
  FiCornerDownRight,
  FiTerminal,
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiGlobe,
  FiType,
  FiImage,
  FiAward,
  FiCheck,
  FiPlus,
  FiLoader,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const roleOptions = ["user", "wife_of_the_year", "admin"];

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [pwModal, setPwModal] = useState({ open: false, userId: null, password: "" });
  const [saving, setSaving] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "username", direction: "ascending" });
  const [searchTerm, setSearchTerm] = useState("");

  // Badge manager state
  const [badgeModal, setBadgeModal] = useState({ open: false, user: null });
  const [allCollections, setAllCollections] = useState([]);
  const [allBadgesMap, setAllBadgesMap] = useState({}); // { [collectionKey]: [BadgeBase] }
  const [earnedBadges, setEarnedBadges] = useState([]); // UserBadge[] with populated badgeBase
  const [badgeModalLoading, setBadgeModalLoading] = useState(false);
  const [badgeModalError, setBadgeModalError] = useState("");
  const [grantingId, setGrantingId] = useState(null); // badgeBase _id being granted
  const [badgeCollectionFilter, setBadgeCollectionFilter] = useState("");
  const [badgeSearch, setBadgeSearch] = useState("");
  const [badgesLoadedCollections, setBadgesLoadedCollections] = useState(new Set());

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminUserService.list();
      setUsers(data);
    } catch (e) {
      setError("Failed to load users");
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  // --- Badge Manager logic ---
  const openBadgeModal = useCallback(async (u) => {
    setBadgeModal({ open: true, user: u });
    setBadgeModalError("");
    setBadgeModalLoading(true);
    setBadgesLoadedCollections(new Set());
    setBadgeCollectionFilter("");
    setBadgeSearch("");
    try {
      const [collectionsRes, earnedRes] = await Promise.all([
        api.get("/admin/badge-collections/collections"),
        adminUserService.getUserBadges(u._id),
      ]);
      const cols = collectionsRes.data.data || [];
      setAllCollections(cols);
      setEarnedBadges(earnedRes || []);
      // Pre-load badges for first collection
      if (cols.length > 0) {
        const firstKey = cols[0].key;
        setBadgeCollectionFilter(firstKey);
        const badgesRes = await api.get(`/admin/badge-collections/collections/${firstKey}`);
        setAllBadgesMap({ [firstKey]: badgesRes.data.data || [] });
        setBadgesLoadedCollections(new Set([firstKey]));
      }
    } catch (e) {
      setBadgeModalError("Failed to load badge data");
    } finally {
      setBadgeModalLoading(false);
    }
  }, []);

  const switchBadgeCollection = useCallback(
    async (key) => {
      setBadgeCollectionFilter(key);
      setBadgeSearch("");
      if (badgesLoadedCollections.has(key)) return;
      try {
        const res = await api.get(`/admin/badge-collections/collections/${key}`);
        setAllBadgesMap((prev) => ({ ...prev, [key]: res.data.data || [] }));
        setBadgesLoadedCollections((prev) => new Set([...prev, key]));
      } catch {
        // silently fall back to empty
      }
    },
    [badgesLoadedCollections],
  );

  const grantBadge = useCallback(
    async (badgeBaseId) => {
      if (!badgeModal.user) return;
      setGrantingId(badgeBaseId);
      setBadgeModalError("");
      try {
        const newUserBadge = await adminUserService.grantBadge(badgeModal.user._id, badgeBaseId);
        setEarnedBadges((prev) => [...prev, newUserBadge]);
      } catch (e) {
        setBadgeModalError(e.response?.data?.message || "Failed to grant badge");
      } finally {
        setGrantingId(null);
      }
    },
    [badgeModal.user],
  );

  const closeBadgeModal = () => {
    setBadgeModal({ open: false, user: null });
    setAllCollections([]);
    setAllBadgesMap({});
    setEarnedBadges([]);
    setBadgeModalError("");
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setDraft({
      username: u.username,
      role: u.role,
      level: u.level,
      experience: u.experience,
      temuTokens: Number(u.temuTokens || 0),
      gatillaGold: Number(u.gatillaGold || 0),
      wendyHearts: Number(u.wendyHearts || 0),
      profilePicture: u.profilePicture,
      bio: u.bio || "",
      location: u.location || "",
      website: u.website || "",
      motto: u.motto || "",
      bannerImage: u.bannerImage,
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };
  const saveEdit = async () => {
    setSaving(true);
    try {
      const updated = await adminUserService.update(editingId, draft);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      cancelEdit();
    } catch (e) {
      setError(e.response?.data?.message || "Update failed");
    }
    setSaving(false);
  };
  const openPw = (id) => setPwModal({ open: true, userId: id, password: "" });
  const closePw = () => setPwModal({ open: false, userId: null, password: "" });
  const submitPw = async () => {
    if (pwModal.password.length < 6) {
      setError("Password too short");
      return;
    }
    try {
      await adminUserService.resetPassword(pwModal.userId, pwModal.password);
      closePw();
    } catch (e) {
      setError(e.response?.data?.message || "Password reset failed");
    }
  };

  // Helper to resolve avatar URL
  const getAvatarUrl = (u) => {
    const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").split("/api")[0];
    return u.profilePicture ? `${serverBaseUrl}${u.profilePicture}` : null;
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortableItems = [...users];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      sortableItems = sortableItems.filter(
        (u) =>
          u.username.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower) ||
          u._id.toLowerCase().includes(lower),
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested or special keys if needed, but for now flat keys work
        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig, searchTerm]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="w-4 inline-block" />;
    return sortConfig.direction === "ascending" ? (
      <FiChevronUp className="inline" />
    ) : (
      <FiChevronDown className="inline" />
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 font-mono text-xs text-primary selection:bg-primary selection:text-background">
      {/* Terminal Header */}
      <div className="mb-6 pb-2 border-b border-primary/20">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3 text-primary">
              <span className="animate-pulse">█</span> User Management
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
              <input
                type="text"
                placeholder="SEARCH USER..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-background border border-primary/30 pl-9 pr-4 py-1 text-primary focus:border-primary outline-none uppercase tracking-wider w-64 placeholder-primary/30"
              />
            </div>
            <button
              onClick={load}
              className="group relative px-4 py-1 bg-background border border-primary text-primary hover:bg-primary hover:text-background transition-colors uppercase tracking-wider"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 border border-status-danger bg-status-danger/20 text-status-danger p-3 flex items-center gap-3 uppercase tracking-wide">
          <FiX />
          <span>Error: {error}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-background relative overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center uppercase tracking-widest animate-pulse text-primary/50">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/10 text-primary font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("_id")}>
                  ID <SortIcon columnKey="_id" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("username")}>
                  User <SortIcon columnKey="username" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("role")}>
                  Role <SortIcon columnKey="role" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("lastLoginDate")}>
                  Last Active <SortIcon columnKey="lastLoginDate" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("createdAt")}>
                  Joined <SortIcon columnKey="createdAt" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("level")}>
                  Level <SortIcon columnKey="level" />
                </th>
                <th
                  className="p-3 cursor-pointer hover:bg-primary/20"
                  onClick={() => requestSort("currentLoginStreak")}
                >
                  Streak <SortIcon columnKey="currentLoginStreak" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("temuTokens")}>
                  TT <SortIcon columnKey="temuTokens" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("gatillaGold")}>
                  GG <SortIcon columnKey="gatillaGold" />
                </th>
                <th className="p-3 cursor-pointer hover:bg-primary/20" onClick={() => requestSort("wendyHearts")}>
                  HP <SortIcon columnKey="wendyHearts" />
                </th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => {
                const editing = editingId === u._id;
                const avatarUrl = getAvatarUrl(u);

                if (editing) {
                  return (
                    <tr key={u._id} className="bg-primary/5">
                      <td colSpan="11" className="p-0">
                        <div className="border-l-4 border-primary bg-background p-4">
                          <div className="flex items-center gap-2 mb-4 text-primary font-bold uppercase">
                            <FiTerminal /> Editing: {u.username}
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Identity */}
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase text-text-secondary block">Username</label>
                                <input
                                  value={draft.username}
                                  onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                                  className="w-full bg-background border-b border-primary/50 text-primary p-1 focus:border-primary outline-none font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase text-text-secondary block">Role</label>
                                <select
                                  value={draft.role}
                                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                                  className="w-full bg-background border-b border-primary/50 text-primary p-1 focus:border-primary outline-none font-mono uppercase"
                                >
                                  {roleOptions.map((r) => (
                                    <option key={r} value={r}>
                                      {r.toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              {u.profilePicture && (
                                <button
                                  onClick={() => setDraft((d) => ({ ...d, profilePicture: null }))}
                                  className="w-full border border-status-danger/50 text-status-danger hover:bg-status-danger/10 py-1 text-[10px] uppercase mt-2 flex items-center justify-center gap-2"
                                >
                                  <FiX /> Remove Avatar
                                </button>
                              )}
                              {u.bannerImage && (
                                <button
                                  onClick={() => setDraft((d) => ({ ...d, bannerImage: null }))}
                                  className="w-full border border-status-danger/50 text-status-danger hover:bg-status-danger/10 py-1 text-[10px] uppercase mt-1 flex items-center justify-center gap-2"
                                >
                                  <FiImage /> Remove Banner
                                </button>
                              )}
                            </div>

                            {/* Profile Info */}
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase text-text-secondary block">Bio</label>
                                <textarea
                                  value={draft.bio}
                                  onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                                  className="w-full bg-background border-b border-primary/50 text-primary p-1 focus:border-primary outline-none font-mono h-16 resize-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase text-text-secondary block">Location</label>
                                <div className="flex items-center gap-2">
                                  <FiMapPin className="text-primary/50" />
                                  <input
                                    value={draft.location}
                                    onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                                    className="w-full bg-background border-b border-primary/50 text-primary p-1 focus:border-primary outline-none font-mono"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase text-text-secondary block">Website</label>
                                <div className="flex items-center gap-2">
                                  <FiGlobe className="text-primary/50" />
                                  <input
                                    value={draft.website}
                                    onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
                                    className="w-full bg-background border-b border-primary/50 text-primary p-1 focus:border-primary outline-none font-mono"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase text-text-secondary block">Level</label>
                                  <input
                                    type="number"
                                    value={draft.level}
                                    onChange={(e) => setDraft((d) => ({ ...d, level: Number(e.target.value) }))}
                                    className="w-full bg-background border-b border-primary/50 text-primary p-1 focus:border-primary outline-none font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase text-text-secondary block">XP</label>
                                  <input
                                    type="number"
                                    value={draft.experience}
                                    onChange={(e) => setDraft((d) => ({ ...d, experience: Number(e.target.value) }))}
                                    className="w-full bg-background border-b border-primary/50 text-primary p-1 focus:border-primary outline-none font-mono"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2 pt-2 border-t border-primary/20">
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-500 w-6 text-right">TT:</span>
                                  <input
                                    type="number"
                                    value={draft.temuTokens}
                                    onChange={(e) => setDraft((d) => ({ ...d, temuTokens: Number(e.target.value) }))}
                                    className="flex-1 bg-background border-b border-primary/30 text-primary p-1 focus:border-primary outline-none text-right"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-yellow-500 w-6 text-right">GG:</span>
                                  <input
                                    type="number"
                                    value={draft.gatillaGold}
                                    onChange={(e) => setDraft((d) => ({ ...d, gatillaGold: Number(e.target.value) }))}
                                    className="flex-1 bg-background border-b border-primary/30 text-primary p-1 focus:border-primary outline-none text-right"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-pink-500 w-6 text-right">HP:</span>
                                  <input
                                    type="number"
                                    value={draft.wendyHearts}
                                    onChange={(e) => setDraft((d) => ({ ...d, wendyHearts: Number(e.target.value) }))}
                                    className="flex-1 bg-background border-b border-primary/30 text-primary p-1 focus:border-primary outline-none text-right"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col justify-center gap-3">
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="w-full bg-primary text-background font-bold py-3 px-4 uppercase hover:bg-primary/90 flex items-center justify-center gap-2"
                              >
                                {saving ? <span className="animate-spin">/</span> : <FiSave />} Save Changes
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="w-full border border-primary/50 text-primary hover:bg-primary/10 py-2 px-4 uppercase"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={u._id} className="hover:bg-primary/5 transition-colors group text-[11px]">
                    <td className="p-3 font-mono text-text-tertiary" title={u._id}>
                      {u._id.substring(u._id.length - 6).toUpperCase()}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border border-primary/50 bg-background flex-shrink-0 grayscale contrast-125">
                          {avatarUrl ? (
                            <img src={avatarUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/30">
                              <FiUser />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-primary font-bold truncate tracking-wide">{u.username}</div>
                          <div className="text-text-secondary truncate text-[9px]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`uppercase font-bold tracking-wider text-[9px] px-1 ${
                          u.role === "admin"
                            ? "bg-status-danger/30 text-status-danger"
                            : u.role === "wife_of_the_year"
                              ? "bg-pink-900/30 text-pink-500"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        {u.role === "wife_of_the_year" ? "WIFE_ADMIN" : u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-text-secondary text-[10px]">
                      {u.lastLoginDate ? new Date(u.lastLoginDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 font-mono text-text-secondary text-[10px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 font-mono text-primary text-right">{String(u.level).padStart(2, "0")}</td>
                    <td className="p-3 font-mono text-primary text-right">
                      {String(u.currentLoginStreak).padStart(3, "0")}
                    </td>
                    <td className="p-3 font-mono text-amber-500 text-right">{u.temuTokens}</td>
                    <td className="p-3 font-mono text-yellow-500 text-right">{u.gatillaGold}</td>
                    <td className="p-3 font-mono text-pink-500 text-right">{u.wendyHearts}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-primary hover:text-text-main hover:bg-primary/20 p-1"
                          title="MODIFY"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() => openPw(u._id)}
                          className="text-status-warning hover:text-text-main hover:bg-status-warning/20 p-1"
                          title="RESET_KEY"
                        >
                          <FiKey />
                        </button>
                        <button
                          onClick={() => openBadgeModal(u)}
                          className="text-cyan-400 hover:text-text-main hover:bg-cyan-400/20 p-1"
                          title="BADGES"
                        >
                          <FiAward />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Badge Manager Modal ── */}
      {badgeModal.open && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-background border-2 border-cyan-400/60 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_30px_rgba(34,211,238,0.15)] relative">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-cyan-400/30 bg-cyan-400/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <FiAward className="text-cyan-400" size={18} />
                <div>
                  <h2 className="font-bold uppercase tracking-widest text-cyan-400 text-sm">Badge Manager</h2>
                  <p className="text-[9px] text-text-tertiary uppercase tracking-wider">{badgeModal.user?.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-cyan-400/60 uppercase">{earnedBadges.length} earned</span>
                <button onClick={closeBadgeModal} className="text-primary/50 hover:text-primary p-1">
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {badgeModalLoading ? (
              <div className="flex-1 flex items-center justify-center text-cyan-400/50 uppercase tracking-widest animate-pulse text-xs py-12">
                Loading badges...
              </div>
            ) : (
              <>
                {badgeModalError && (
                  <div className="mx-5 mt-3 flex-shrink-0 border border-status-danger/40 bg-status-danger/10 text-status-danger text-[10px] px-3 py-2 uppercase tracking-wide flex items-center gap-2">
                    <FiX size={12} /> {badgeModalError}
                  </div>
                )}

                {/* Collection tabs */}
                <div className="flex gap-0 overflow-x-auto flex-shrink-0 border-b border-cyan-400/20 px-5 pt-3">
                  {allCollections.map((col) => (
                    <button
                      key={col.key}
                      onClick={() => switchBadgeCollection(col.key)}
                      className={`px-3 py-1.5 text-[9px] uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                        badgeCollectionFilter === col.key
                          ? "border-cyan-400 text-cyan-400"
                          : "border-transparent text-text-tertiary hover:text-primary"
                      }`}
                    >
                      {col.name || col.key}
                    </button>
                  ))}
                </div>

                {/* Search within collection */}
                <div className="px-5 pt-3 flex-shrink-0">
                  <div className="relative">
                    <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30" size={11} />
                    <input
                      type="text"
                      placeholder="SEARCH BADGES..."
                      value={badgeSearch}
                      onChange={(e) => setBadgeSearch(e.target.value)}
                      className="w-full bg-background border border-primary/20 pl-7 pr-3 py-1 text-[10px] text-primary placeholder-primary/25 focus:border-cyan-400/50 outline-none uppercase tracking-wider"
                    />
                  </div>
                </div>

                {/* Badge grid */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {(() => {
                    const earnedSet = new Set(
                      earnedBadges.map((eb) => String(eb.badgeBase?._id || eb.badgeBase)).filter(Boolean),
                    );
                    const badges = (allBadgesMap[badgeCollectionFilter] || []).filter((b) => {
                      if (!badgeSearch) return true;
                      return (
                        b.name?.toLowerCase().includes(badgeSearch.toLowerCase()) ||
                        b.badgeId?.toLowerCase().includes(badgeSearch.toLowerCase())
                      );
                    });
                    if (badges.length === 0) {
                      return (
                        <div className="text-center py-8 text-text-tertiary text-[10px] uppercase tracking-widest">
                          No badges found
                        </div>
                      );
                    }
                    const API_ORIGIN = (() => {
                      try {
                        return new URL(api.defaults.baseURL || "").origin;
                      } catch {
                        return "";
                      }
                    })();
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {badges.map((badge) => {
                          const isEarned = earnedSet.has(String(badge._id));
                          const isGranting = grantingId === badge._id;
                          const imgSrc = badge.spriteSmallUrl || badge.spriteLargeUrl || badge.imageUrl || "";
                          const resolvedImg = imgSrc.startsWith("http")
                            ? imgSrc
                            : imgSrc
                              ? `${API_ORIGIN}${imgSrc}`
                              : "";
                          return (
                            <div
                              key={badge._id}
                              className={`border p-3 flex flex-col items-center gap-2 transition-colors ${
                                isEarned
                                  ? "border-cyan-400/50 bg-cyan-400/5"
                                  : "border-primary/20 bg-background hover:border-primary/40"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 flex items-center justify-center relative ${
                                  isEarned ? "" : "opacity-40 grayscale"
                                }`}
                              >
                                {resolvedImg ? (
                                  <img src={resolvedImg} alt={badge.name} className="w-full h-full object-contain" />
                                ) : (
                                  <FiAward className="text-primary/40" size={24} />
                                )}
                                {isEarned && (
                                  <span className="absolute -top-1 -right-1 bg-cyan-400 rounded-full p-0.5">
                                    <FiCheck size={8} className="text-background" />
                                  </span>
                                )}
                              </div>
                              <div className="text-center min-w-0 w-full">
                                <div className="text-[9px] font-bold uppercase tracking-wide text-primary truncate">
                                  {badge.name}
                                </div>
                                <div className="text-[8px] text-text-tertiary truncate">{badge.badgeId}</div>
                              </div>
                              {isEarned ? (
                                <span className="text-[8px] text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                                  <FiCheck size={9} /> Earned
                                </span>
                              ) : (
                                <button
                                  onClick={() => grantBadge(badge._id)}
                                  disabled={!!grantingId}
                                  className="w-full border border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 text-[8px] uppercase tracking-wider py-1 flex items-center justify-center gap-1 disabled:opacity-40"
                                >
                                  {isGranting ? (
                                    <span className="animate-spin text-[10px]">◌</span>
                                  ) : (
                                    <>
                                      <FiPlus size={9} /> Grant
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {pwModal.open && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
          <div className="bg-background border-2 border-primary p-6 w-full max-w-sm shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] relative">
            <div className="flex items-center gap-3 text-primary mb-6 mt-2 border-b border-primary/30 pb-2">
              <FiKey size={20} />
              <h2 className="font-bold text-lg uppercase tracking-widest">Reset Password</h2>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-text-secondary">
                User ID: <span className="text-text-main">{pwModal.userId}</span>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={pwModal.password}
                  onChange={(e) => setPwModal((m) => ({ ...m, password: e.target.value }))}
                  placeholder="New Password"
                  className="w-full bg-background border border-primary/50 px-4 py-3 text-sm focus:border-primary outline-none text-primary placeholder-primary/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={closePw}
                className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/10 text-xs font-bold uppercase tracking-wide"
              >
                Cancel
              </button>
              <button
                onClick={submitPw}
                className="px-4 py-2 bg-primary text-background hover:bg-primary/90 text-xs font-bold uppercase tracking-wide"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;
