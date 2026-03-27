import { useState, useEffect } from "react";
import { Outlet, Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "./Header";
import BottomNav from "./BottomNav";
import UiCustomizerModal from "../settings/UiCustomizerModal";
import GlobalToastHost from "../ui/GlobalToastHost";
import { LayoutProvider, useLayout } from "../../context/LayoutContext";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Dumbbell,
  Library,
  Users,
  Settings,
  User,
  LogOut,
  Store,
  Image,
  PenSquare,
  ClipboardList,
  Clapperboard,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Settings2,
  DollarSign,
  Music,
  FileSignature,
  Trophy,
  CalendarDays,
  FileText,
  Smartphone,
  Terminal as TerminalIcon,
} from "lucide-react";

const NavItem = ({ to, icon: Icon, children, isCollapsed }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `group flex items-center rounded-lg transition-all duration-300 text-text-secondary hover:bg-gray-700/50 hover:text-white px-[9px] py-[7px] ${
            isActive ? "bg-primary/20 text-white shadow-lg" : ""
          }`
        }
      >
        <span className="flex-none w-[22px] flex items-center justify-center">
          <Icon size={16} />
        </span>
        <span
          className={`ml-1.5 overflow-hidden whitespace-nowrap transition-all duration-300 ${
            isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 text-[11px]"
          }`}
        >
          {children}
        </span>
      </NavLink>
    </li>
  );
};

// Layout edit mode toggle button shown in the sidebar footer
const LayoutToggleButton = ({ isSidebarCollapsed }) => {
  const { editMode, toggleEditMode } = useLayout();
  return (
    <button
      onClick={toggleEditMode}
      className={`w-full flex items-center p-2 rounded-lg text-xs transition-all duration-300 ${
        editMode
          ? "bg-emerald-600 text-white hover:bg-emerald-500"
          : "text-text-secondary hover:bg-primary/30 hover:text-white"
      } ${isSidebarCollapsed ? "justify-center" : ""}`}
      title={editMode ? "Exit Layout & Size Mode" : "Edit Layout & Size (drag/resize widgets & sidebar)"}
    >
      <LayoutDashboard size={14} className={isSidebarCollapsed ? "" : "mr-2"} />
      <span
        className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
          isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        }`}
      >
        {editMode ? "Exit Layout & Size" : "Edit Layout & Size"}
      </span>
    </button>
  );
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  // Default: expanded on desktop (lg: >=1024px), collapsed on smaller screens
  // On mobile (<1024px), we treat "collapsed" as hidden/drawer closed, and !collapsed as drawer open
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024; // collapse (hide) on tablets/phones, expand on desktop by default
    }
    return false;
  });

  // Mobile drawer state - separate from desktop collapse state if needed, but reusing isSidebarCollapsed for simplicity
  // On mobile: isSidebarCollapsed = true (hidden), false = open (drawer)

  const toggleSidebar = () => setIsSidebarCollapsed((p) => !p);

  // ~20% size increase and align numeric width with Tailwind classes below
  const sidebarCollapsedWidth = 48; // w-12 (was ~40)
  const sidebarExpandedWidth = 208; // w-52 (was 176)
  const headerHeight = 48; // compact header height (was 56)
  const sidebarWidth = isSidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth;
  const mobileBottomNavHeight = 56;

  // Mobile specific: Sidebar is hidden (width 0) when collapsed, full width (or drawer width) when open
  // We'll handle this via CSS classes, but for JS calculations:
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const effectiveSidebarWidth = isMobile ? 0 : sidebarWidth;

  const logoImg = import.meta.env.VITE_TAE_LOGO;

  // Load and apply glass + background settings from localStorage
  const loadUiSettings = () => {
    try {
      return {
        pageBgImage: localStorage.getItem("tae.pageBgImage") || null,
        pageBgFit: localStorage.getItem("tae.pageBgFit") || "cover",
        pageBgPosX: Number(localStorage.getItem("tae.pageBgPosX") || 50),
        pageBgPosY: Number(localStorage.getItem("tae.pageBgPosY") || 50),
        pageBgTint: localStorage.getItem("tae.pageBgTint") || "rgba(0,0,0,0)",
        glassBlur: localStorage.getItem("tae.glass.blur") || "8px",
        glassSurfaceAlpha: localStorage.getItem("tae.glass.surfaceAlpha") || "0.6",
      };
    } catch (e) {
      return {
        pageBgImage: null,
        pageBgFit: "cover",
        pageBgPosX: 50,
        pageBgPosY: 50,
        pageBgTint: "rgba(0,0,0,0)",
        glassBlur: "8px",
        glassSurfaceAlpha: "0.6",
      };
    }
  };

  const applyCssVars = (settings) => {
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty("--glass-blur", settings.glassBlur || "8px");
    root.style.setProperty("--glass-surface-alpha", settings.glassSurfaceAlpha || "0.6");
  };

  const [uiSettings, setUiSettings] = useState(loadUiSettings());

  // Theme & persona settings for live customization
  const getRootVar = (name, fallback) => {
    if (typeof window === "undefined") return fallback;
    const cs = getComputedStyle(document.documentElement);
    const v = cs.getPropertyValue(name);
    return v?.trim() || fallback;
  };

  const loadThemeSettings = () => {
    try {
      return {
        glassEnabled: (localStorage.getItem("tae.glass.enabled") ?? "true") === "true",
        glassBlur: localStorage.getItem("tae.glass.blur") || getRootVar("--glass-blur", "8px"),
        glassSurfaceAlpha: localStorage.getItem("tae.glass.surfaceAlpha") || getRootVar("--glass-surface-alpha", "0.6"),
        // Fallbacks aligned to Standard Issue persona values
        primary: localStorage.getItem("tae.theme.primary") || "#1a6359ff",
        secondary: localStorage.getItem("tae.theme.secondary") || "#0099c399",
        background: localStorage.getItem("tae.theme.background") || "#0D1117",
        surface: localStorage.getItem("tae.theme.surface") || "#161B22",
        textMain: localStorage.getItem("tae.theme.textMain") || "#E5E7EB",
        textSecondary: localStorage.getItem("tae.theme.textSecondary") || "#9CA3AF",
        textTertiary: localStorage.getItem("tae.theme.textTertiary") || "#4B5563",
        persona: localStorage.getItem("tae.persona") || "default",
      };
    } catch {
      return {
        glassEnabled: true,
        glassBlur: "8px",
        glassSurfaceAlpha: "0.6",
        primary: "#1a6359ff",
        secondary: "#0099c399",
        background: "#0D1117",
        surface: "#161B22",
        textMain: "#E5E7EB",
        textSecondary: "#9CA3AF",
        textTertiary: "#4B5563",
        persona: "default",
      };
    }
  };

  const [theme, setTheme] = useState(loadThemeSettings());
  const [presets, setPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("tae.theme.presets") || "[]");
    } catch {
      return [];
    }
  });
  const [showCustomizer, setShowCustomizer] = useState(false);

  useEffect(() => {
    applyCssVars(uiSettings);
  }, [uiSettings]);

  useEffect(() => {
    const onStorage = (e) => {
      if (!e || (e && !e.key)) {
        setUiSettings(loadUiSettings());
        return;
      }
      if (
        [
          "tae.pageBgImage",
          "tae.pageBgFit",
          "tae.pageBgPosX",
          "tae.pageBgPosY",
          "tae.pageBgTint",
          "tae.glass.blur",
          "tae.glass.surfaceAlpha",
          "tae.theme.primary",
          "tae.theme.secondary",
          "tae.theme.background",
          "tae.theme.surface",
          "tae.theme.textMain",
          "tae.theme.textSecondary",
          "tae.theme.textTertiary",
          "tae.persona",
        ].includes(e.key)
      ) {
        setUiSettings(loadUiSettings());
        setTheme(loadThemeSettings());
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("tae:settings-changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tae:settings-changed", onStorage);
    };
  }, []);

  // Apply theme variables whenever theme changes (live preview + persist)
  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;
    // Glass
    root.setAttribute("data-glass", theme.glassEnabled ? "on" : "off");
    root.style.setProperty("--glass-blur", theme.glassBlur || "8px");
    root.style.setProperty("--glass-surface-alpha", theme.glassSurfaceAlpha || "0.6");
    localStorage.setItem("tae.glass.enabled", String(!!theme.glassEnabled));
    localStorage.setItem("tae.glass.blur", theme.glassBlur || "8px");
    localStorage.setItem("tae.glass.surfaceAlpha", theme.glassSurfaceAlpha || "0.6");
    // Colors
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--color-secondary", theme.secondary);
    root.style.setProperty("--color-background", theme.background);
    root.style.setProperty("--color-surface", theme.surface);
    root.style.setProperty("--color-text-main", theme.textMain);
    root.style.setProperty("--color-text-secondary", theme.textSecondary);
    root.style.setProperty("--color-text-tertiary", theme.textTertiary);
    localStorage.setItem("tae.theme.primary", theme.primary);
    localStorage.setItem("tae.theme.secondary", theme.secondary);
    localStorage.setItem("tae.theme.background", theme.background);
    localStorage.setItem("tae.theme.surface", theme.surface);
    localStorage.setItem("tae.theme.textMain", theme.textMain);
    localStorage.setItem("tae.theme.textSecondary", theme.textSecondary);
    localStorage.setItem("tae.theme.textTertiary", theme.textTertiary);
    // Persona
    if (theme.persona) localStorage.setItem("tae.persona", theme.persona);
    // Notify
    window.dispatchEvent(new Event("tae:settings-changed"));
  }, [theme]);

  // Enforce Standard Issue persona defaults if no active persona is set on the user profile
  useEffect(() => {
    if (!user?.activeAbelPersona) {
      const root = document.documentElement;
      if (!root) return;
      root.style.setProperty("--color-background", "#0D1117");
      root.style.setProperty("--color-bg", "#0D1117");
      root.style.setProperty("--color-surface", "#161B22");
      root.style.setProperty("--color-primary", "#1a6359ff");
      root.style.setProperty("--color-secondary", "#0099c399");
      root.style.setProperty("--color-tertiary", "#A5F3FC");
      root.style.setProperty("--color-text-main", "#E5E7EB");
      root.style.setProperty("--color-text-secondary", "#9CA3AF");
      root.style.setProperty("--color-text-tertiary", "#4B5563");
      root.style.setProperty("--font-main", "Inter, sans-serif");
    }
  }, [user?.activeAbelPersona]);

  const handleSavePreset = (name) => {
    const id = `${Date.now()}`;
    const entry = { id, name, settings: theme };
    const next = [...presets, entry];
    setPresets(next);
    localStorage.setItem("tae.theme.presets", JSON.stringify(next));
  };
  const handleDeletePreset = (id) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    localStorage.setItem("tae.theme.presets", JSON.stringify(next));
  };

  // Right sidebar is now rendered as a header dropdown, so reserve no persistent width.
  useEffect(() => {
    const root = document.documentElement;
    if (root) root.style.setProperty("--right-sidebar-width", "0px");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root) {
      root.style.setProperty("--left-sidebar-width", `${effectiveSidebarWidth}px`);
      root.style.setProperty("--bottom-nav-height", isMobile ? "64px" : "0px");
    }
  }, [effectiveSidebarWidth, isMobile]);

  return (
    <LayoutProvider>
      <div className="relative h-screen w-screen overflow-hidden bg-background text-text-main text-xs">
        {/* Global toast host for cross-app notifications */}
        <GlobalToastHost />
        {/* Default gradient background (visible when no custom image set) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(1200px 400px at 0% 0%, var(--color-primary) 6%, transparent 60%), radial-gradient(1000px 600px at 100% 100%, var(--color-secondary) 5%, transparent 60%), linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 80%)",
            opacity: 0.35,
          }}
        />
        {/* Page background layer */}
        {uiSettings.pageBgImage && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${uiSettings.pageBgImage})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: uiSettings.pageBgFit || "cover",
              backgroundPosition: `${uiSettings.pageBgPosX || 50}% ${uiSettings.pageBgPosY || 50}%`,
            }}
          />
        )}
        {/* Optional tint overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: uiSettings.pageBgTint }}
        />
        {/* Sidebar full height */}
        {/* Sidebar full height */}
        <aside
          className={`fixed top-0 left-0 z-50 flex flex-col bg-surface/95 backdrop-blur-md border-r border-gray-700/80 shadow-2xl transition-all duration-500 ease-in-out 
            ${isSidebarCollapsed ? "w-12 -translate-x-full lg:translate-x-0" : "w-64 lg:w-52 translate-x-0"}
            lg:block
          `}
          style={{ bottom: isMobile ? "64px" : "0" }}
        >
          {/* Toggle (15px from bottom) - Desktop only */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:block absolute right-0 translate-x-full bg-surface/80 backdrop-blur-md border border-gray-700/40 rounded-r-md p-1 hover:bg-gray-700/60 transition-all duration-300 shadow-md"
            style={{ bottom: 15 }}
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={18} className="text-white" />
            ) : (
              <ChevronLeft size={18} className="text-white" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsSidebarCollapsed(true)}
            className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Brand */}
          <div className="px-2 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-none w-[26px] h-[26px] rounded-md overflow-hidden bg-primary/40 flex items-center justify-center">
                {logoImg ? (
                  <img src={logoImg} alt="TAE" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-[9px] leading-none">TAE</span>
                )}
              </div>
              <span
                className={`text-white font-bold text-[10px] tracking-wide transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[144px] opacity-100"
                }`}
              >
                The Abel Experience™ CFW
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-grow space-y-3 overflow-y-auto scrollbar-hide px-1 pb-2">
            {/* Overview */}
            <div>
              <p
                className={`px-1 text-[10px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                  isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                }`}
              >
                Overview
              </p>
              <ul className="space-y-0.1">
                <NavItem to="/dashboard" icon={LayoutDashboard} isCollapsed={isSidebarCollapsed}>
                  System Dashboard
                </NavItem>
                <NavItem to="/profile" icon={User} isCollapsed={isSidebarCollapsed}>
                  Account Profile
                </NavItem>
                <NavItem to="/shop" icon={Store} isCollapsed={isSidebarCollapsed}>
                  Storefront
                </NavItem>
              </ul>
            </div>

            {/* Productivity */}
            <div>
              <p
                className={`px-1 text-[10px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                  isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                }`}
              >
                Productivity
              </p>
              <ul className="space-y-0.1">
                <NavItem to="/tasks" icon={Clapperboard} isCollapsed={isSidebarCollapsed}>
                  Task Administrator
                </NavItem>
                <NavItem to="/habits" icon={CheckSquare} isCollapsed={isSidebarCollapsed}>
                  Habit Tracker
                </NavItem>
                <NavItem to="/books" icon={BookOpen} isCollapsed={isSidebarCollapsed}>
                  Reading Log
                </NavItem>
                <NavItem to="/workouts" icon={Dumbbell} isCollapsed={isSidebarCollapsed}>
                  Training Sessions
                </NavItem>
              </ul>
            </div>

            {/* Collections */}
            <div>
              <p
                className={`px-1 text-[11px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                  isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                }`}
              >
                Digital Asset Admin
              </p>
              <ul className="space-y-0.1">
                <NavItem to="/collections" icon={Boxes} isCollapsed={isSidebarCollapsed}>
                  Collection Index
                </NavItem>
                <NavItem to="/pokedex" icon={Image} isCollapsed={isSidebarCollapsed}>
                  Pokémon Index
                </NavItem>
                <NavItem to="/admin/pokemon-editor" icon={PenSquare} isCollapsed={isSidebarCollapsed}>
                  Pokémon Data Manager
                </NavItem>
                <NavItem to="/admin/habbo-rares" icon={Boxes} isCollapsed={isSidebarCollapsed}>
                  Habbo Rares Manager
                </NavItem>
                <NavItem to="/admin/snoopys" icon={Boxes} isCollapsed={isSidebarCollapsed}>
                  Snoopy Manager
                </NavItem>
                <NavItem to="/admin/badge-collections" icon={Trophy} isCollapsed={isSidebarCollapsed}>
                  Badge Manager
                </NavItem>
              </ul>
            </div>

            {/* Finance */}
            <div>
              <p
                className={`px-1 text-[11px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                  isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                }`}
              >
                Finance
              </p>
              <ul className="space-y-0.1">
                <NavItem to="/finance" icon={DollarSign} isCollapsed={isSidebarCollapsed}>
                  Console
                </NavItem>
                <NavItem to="/finance/rich" icon={DollarSign} isCollapsed={isSidebarCollapsed}>
                  Dashboard
                </NavItem>
              </ul>
            </div>

            {/* Media */}
            <div>
              <p
                className={`px-1 text-[10px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                  isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                }`}
              >
                Media
              </p>
              <ul className="space-y-0.1">
                <NavItem to="/spotify-stats" icon={Music} isCollapsed={isSidebarCollapsed}>
                  Spotify Analytics
                </NavItem>
                {user?.role === "admin" && (
                  <NavItem to="/admin/strokes" icon={Music} isCollapsed={isSidebarCollapsed}>
                    Strokes Lyrics
                  </NavItem>
                )}
              </ul>
            </div>

            {/* Sports */}
            <div>
              <p
                className={`px-1 text-[10px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                  isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                }`}
              >
                Sports
              </p>
              <ul className="space-y-0.1">
                <NavItem to="/football-tracker" icon={Trophy} isCollapsed={isSidebarCollapsed}>
                  Football Tracker
                </NavItem>
              </ul>
            </div>

            {/* Admin */}
            {user?.role === "admin" && (
              <div className="space-y-0.1">
                {/* Admin: Content */}
                <div>
                  <p
                    className={`px-1 text-[10px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                      isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                    }`}
                  >
                    Volume Administration
                  </p>
                  <ul className="space-y-1">
                    <NavItem
                      to={isMobile ? "/admin/volumes-mobile" : "/admin/volumes"}
                      icon={Library}
                      isCollapsed={isSidebarCollapsed}
                    >
                      JSON Parser
                    </NavItem>
                    <NavItem to="/admin/volumes-mobile" icon={Smartphone} isCollapsed={isSidebarCollapsed}>
                      JSON Parser (Mobile)
                    </NavItem>
                    <NavItem to="/admin/volume-workbench" icon={FileSignature} isCollapsed={isSidebarCollapsed}>
                      Workbench
                    </NavItem>
                    <NavItem to="/admin/blessings" icon={ClipboardList} isCollapsed={isSidebarCollapsed}>
                      Blessings Library
                    </NavItem>
                    <NavItem to="/admin/blessings/usage" icon={ClipboardList} isCollapsed={isSidebarCollapsed}>
                      Blessings Usage
                    </NavItem>
                    <NavItem to="/daily-drafts" icon={FileText} isCollapsed={isSidebarCollapsed}>
                      Daily Drafts
                    </NavItem>
                  </ul>
                </div>
                {/* Admin: Fitness */}
                <div>
                  <p
                    className={`px-1 text-[10px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                      isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                    }`}
                  >
                    Activity Tracking
                  </p>
                  <ul className="space-y-0.1">
                    <NavItem to="/admin/exercises" icon={Settings} isCollapsed={isSidebarCollapsed}>
                      Exercise Schema
                    </NavItem>
                    <NavItem to="/admin/templates" icon={Settings} isCollapsed={isSidebarCollapsed}>
                      Workout Templates
                    </NavItem>
                  </ul>
                </div>

                {/* Admin: System */}
                <div>
                  <p
                    className={`px-1 text-[10px] font-semibold text-text-tertiary uppercase mb-1 transition-all ${
                      isSidebarCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto mb-1"
                    }`}
                  >
                    System
                  </p>
                  <ul className="space-y-1">
                    <NavItem to="/admin/users" icon={Users} isCollapsed={isSidebarCollapsed}>
                      User Directory Admin
                    </NavItem>
                  </ul>
                  <ul className="space-y-1">
                    <NavItem to="/admin/calendar" icon={CalendarDays} isCollapsed={isSidebarCollapsed}>
                      Calendar Admin
                    </NavItem>
                  </ul>
                  <ul className="space-y-1">
                    <NavItem to="/settings" icon={Settings2} isCollapsed={isSidebarCollapsed}>
                      System Settings
                    </NavItem>
                    <NavItem to="/terminal" icon={TerminalIcon} isCollapsed={isSidebarCollapsed}>
                      Public Terminal
                    </NavItem>
                  </ul>
                </div>
              </div>
            )}
          </nav>

          {/* Footer buttons */}
          <div className="mt-auto flex-shrink-0 border-t border-gray-700/50 pt-2 px-1 pb-3 space-y-2">
            <LayoutToggleButton isSidebarCollapsed={isSidebarCollapsed} />
            <button
              onClick={() => setShowCustomizer(true)}
              className={`w-full flex items-center p-2 rounded-lg text-xs text-text-secondary hover:bg-primary/30 hover:text-white transition-all duration-300 ${
                isSidebarCollapsed ? "justify-center" : ""
              }`}
              title="Customize UI (glass, colors, persona)"
            >
              <Settings2 size={14} className={isSidebarCollapsed ? "" : "mr-2"} />
              <span
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
              >
                Customize UI
              </span>
            </button>
            {/* Logout */}
            <button
              onClick={logout}
              className={`w-full flex items-center p-2 rounded-lg text-xs text-text-secondary hover:bg-red-800/50 hover:text-white transition-all duration-300 ${
                isSidebarCollapsed ? "justify-center" : ""
              }`}
            >
              <LogOut size={14} className={isSidebarCollapsed ? "" : "mr-2"} />
              <span
                className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${
                  isSidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </aside>

        {/* UI Customizer Modal */}
        <UiCustomizerModal
          open={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          settings={theme}
          onChange={(s) => setTheme(s)}
          presets={presets}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          anchorLeft={effectiveSidebarWidth}
          anchorBottom={8}
        />

        {/* Header offset by left sidebar */}
        <div
          className="fixed top-0 right-0 z-40 transition-[left,width] duration-500"
          style={{ left: effectiveSidebarWidth, right: 0, height: headerHeight }}
        >
          <Header />
        </div>

        {/* Main content */}
        <main
          className="absolute overflow-hidden flex flex-col z-10"
          style={{
            left: effectiveSidebarWidth,
            top: headerHeight,
            right: 0,
            bottom: isMobile ? mobileBottomNavHeight : 0,
          }}
        >
          <div className="flex-1 overflow-y-auto scrollbar-hide p-2 lg:p-3 min-h-0 pb-0 lg:pb-3">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav onMenuClick={toggleSidebar} />

        {/* Mobile Sidebar Overlay - Close when clicking outside */}
        {!isSidebarCollapsed && isMobile && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            style={{ bottom: "64px" }}
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}
      </div>
    </LayoutProvider>
  );
};

export default AdminLayout;
