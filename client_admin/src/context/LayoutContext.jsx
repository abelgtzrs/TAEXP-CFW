import React from "react";
import { useAuth } from "./AuthContext";
import layoutService from "../services/layoutService";

const LS_KEY = "dashboardLayoutV1";
const LAYOUT_PROFILES_KEY = "dashboardLayoutProfilesV1";
const ACTIVE_COLS_KEY = "dashboardActiveColumnsV1";
const WIDGET_VISIBILITY_KEY = "dashboardWidgetVisibilityV1";
const AUTO_COLUMN_BREAKPOINTS_KEY = "dashboardAutoColumnBreakpointsV1";
const COLUMN_IDS = ["col1", "col2", "col3", "col4"];

const DEFAULT_AUTO_COLUMN_BREAKPOINTS = Object.freeze({
  twoColsMin: 768,
  threeColsMin: 1200,
  fourColsMin: 1600,
});

const toFiniteInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAutoColumnBreakpoints = (value) => {
  const rawTwo = toFiniteInt(value?.twoColsMin, DEFAULT_AUTO_COLUMN_BREAKPOINTS.twoColsMin);
  const rawThree = toFiniteInt(value?.threeColsMin, DEFAULT_AUTO_COLUMN_BREAKPOINTS.threeColsMin);
  const rawFour = toFiniteInt(value?.fourColsMin, DEFAULT_AUTO_COLUMN_BREAKPOINTS.fourColsMin);

  const twoColsMin = Math.max(1, rawTwo);
  const threeColsMin = Math.max(twoColsMin + 1, rawThree);
  const fourColsMin = Math.max(threeColsMin + 1, rawFour);

  return { twoColsMin, threeColsMin, fourColsMin };
};

const defaultLayout = {
  col1: [
    { id: "calendar", key: "calendar", size: "md" },
    { id: "habit", key: "habit", size: "lg" },
    { id: "book", key: "book", size: "md" },
  ],
  col2: [
    { id: "chart-coherence", key: "chart-coherence", size: "lg" },
    { id: "chart-anomaly", key: "chart-anomaly", size: "lg" },
    { id: "chart-drift", key: "chart-drift", size: "lg" },
    { id: "chart-status", key: "chart-status", size: "lg" },
    { id: "workout", key: "workout", size: "md" },
    { id: "security", key: "security", size: "md" },
  ],
  col3: [
    { id: "strokes", key: "strokes", size: "md" },
    { id: "goals", key: "goals", size: "md" },
    { id: "recent", key: "recent", size: "md" },
    { id: "top", key: "top", size: "md" },
    { id: "currency", key: "currency", size: "md" },
  ],
  col4: [
    { id: "quick-notes", key: "quick-notes", size: "md" },
    { id: "quick-links", key: "quick-links", size: "md" },
    { id: "focus-timer", key: "focus-timer", size: "sm" },
    { id: "daily-quote", key: "daily-quote", size: "sm" },
    { id: "countdown", key: "countdown", size: "sm" },
  ],
};

const DEFAULT_WIDGET_ITEMS = COLUMN_IDS.flatMap((columnId) =>
  (defaultLayout[columnId] || []).map((item) => ({ ...item, defaultColumnId: columnId })),
);

export const LayoutContext = React.createContext(null);

export function LayoutProvider({ children }) {
  const { user } = useAuth();
  const [editMode, setEditMode] = React.useState(false);
  const sizeToPx = (size) => {
    switch (size) {
      case "sm":
        return 192; // 12rem
      case "md":
        return 256; // 16rem
      case "lg":
        return 320; // 20rem
      case "xl":
        return 448; // 28rem
      default:
        return 256;
    }
  };

  const cloneColumns = (source) => {
    const copy = {};
    for (const id of COLUMN_IDS) {
      copy[id] = [...(source[id] || [])];
    }
    return copy;
  };

  const getOrderedUniqueItems = (layout) => {
    const ordered = [];
    const seen = new Set();
    for (const c of COLUMN_IDS) {
      for (const item of layout[c] || []) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        ordered.push(item);
      }
    }
    return ordered;
  };

  const withHeights = (layout) => {
    const copy = cloneColumns({});
    for (const c of COLUMN_IDS) {
      copy[c] = (layout[c] || []).map((it) => ({
        ...it,
        height: it.height ?? sizeToPx(it.size || "md"),
        maxWidth: it.maxWidth ?? null, // px; null means full width of the column
      }));
    }
    return copy;
  };

  const ensureNewItems = (layout, maxCols = 4) => {
    const normalized = cloneColumns(layout || {});
    const activeCols = COLUMN_IDS.slice(0, Math.max(1, Math.min(4, maxCols)));

    // Ensure additional widgets exist if user had an older saved layout
    const present = new Set([
      ...normalized.col1.map((i) => i.id),
      ...normalized.col2.map((i) => i.id),
      ...normalized.col3.map((i) => i.id),
      ...normalized.col4.map((i) => i.id),
    ]);
    DEFAULT_WIDGET_ITEMS.forEach(({ defaultColumnId, ...item }) => {
      if (present.has(item.id)) return;
      // Clamp to active columns so widgets never land in a column that isn't rendered
      const targetCol = activeCols.includes(defaultColumnId) ? defaultColumnId : activeCols[activeCols.length - 1];
      normalized[targetCol] = [...normalized[targetCol], item];
      present.add(item.id);
    });

    return normalized;
  };

  const normalizeToColumnCount = (layout, columnCount) => {
    const safe = Math.max(1, Math.min(4, Number(columnCount) || 4));
    const normalized = cloneColumns({});
    const activeCols = COLUMN_IDS.slice(0, safe);
    const orderedItems = getOrderedUniqueItems(ensureNewItems(layout || {}));
    orderedItems.forEach((item, idx) => {
      const targetCol = activeCols[idx % activeCols.length];
      normalized[targetCol].push(item);
    });
    return normalized;
  };

  // Move any widgets sitting in inactive columns into the last active column,
  // preserving the arrangement within active columns.
  const clampColumnsToCount = (layout, count) => {
    const safe = Math.max(1, Math.min(4, count));
    const inactiveCols = COLUMN_IDS.slice(safe);
    const orphans = inactiveCols.flatMap((id) => layout[id] || []);
    if (orphans.length === 0) return layout;
    const result = cloneColumns(layout);
    const lastActive = COLUMN_IDS[safe - 1];
    const activeIds = new Set(COLUMN_IDS.slice(0, safe).flatMap((id) => result[id].map((x) => x.id)));
    const uniqueOrphans = orphans.filter((x) => !activeIds.has(x.id));
    result[lastActive] = [...result[lastActive], ...uniqueOrphans];
    for (const id of inactiveCols) result[id] = [];
    return result;
  };

  const [columns, setColumns] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const savedColsRaw = Number(localStorage.getItem(ACTIVE_COLS_KEY));
        const savedCols = Number.isFinite(savedColsRaw) && savedColsRaw >= 1 ? Math.min(4, savedColsRaw) : 4;
        const parsed = JSON.parse(raw);
        return withHeights(clampColumnsToCount(ensureNewItems(parsed, savedCols), savedCols));
      }
    } catch {}
    return withHeights(defaultLayout);
  });

  const [activeColumnCount, setActiveColumnCount] = React.useState(() => {
    try {
      const raw = Number(localStorage.getItem(ACTIVE_COLS_KEY) || 4);
      const safe = Math.max(1, Math.min(4, raw));
      return Number.isFinite(safe) ? safe : 4;
    } catch {
      return 4;
    }
  });

  // Ref so async callbacks always read the latest activeColumnCount without stale closures.
  const activeColumnCountRef = React.useRef(activeColumnCount);
  React.useEffect(() => {
    activeColumnCountRef.current = activeColumnCount;
  }, [activeColumnCount]);

  const [autoColumnBreakpoints, setAutoColumnBreakpointsState] = React.useState(() => {
    try {
      const raw = localStorage.getItem(AUTO_COLUMN_BREAKPOINTS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return normalizeAutoColumnBreakpoints(parsed || DEFAULT_AUTO_COLUMN_BREAKPOINTS);
    } catch {
      return DEFAULT_AUTO_COLUMN_BREAKPOINTS;
    }
  });

  const [layoutProfiles, setLayoutProfiles] = React.useState(() => {
    try {
      const raw = localStorage.getItem(LAYOUT_PROFILES_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return {};
      const out = {};
      for (const k of [1, 2, 3, 4]) {
        if (parsed[k]) out[k] = withHeights(clampColumnsToCount(ensureNewItems(parsed[k], k), k));
      }
      return out;
    } catch {
      return {};
    }
  });

  const [widgetVisibility, setWidgetVisibility] = React.useState(() => {
    try {
      const raw = localStorage.getItem(WIDGET_VISIBILITY_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}

    const all = {};
    getOrderedUniqueItems(withHeights(ensureNewItems(defaultLayout))).forEach((item) => {
      all[item.id] = true;
    });
    return all;
  });

  const persistLocalConfigurations = React.useCallback(
    (
      nextColumns = columns,
      nextActiveColumnCount = activeColumnCount,
      nextProfiles = layoutProfiles,
      nextVisibility = widgetVisibility,
      nextAutoColumnBreakpoints = autoColumnBreakpoints,
    ) => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(nextColumns));
        localStorage.setItem(ACTIVE_COLS_KEY, String(nextActiveColumnCount));
        const serializable = {};
        for (const k of [1, 2, 3, 4]) {
          if (nextProfiles[k]) serializable[k] = nextProfiles[k];
        }
        localStorage.setItem(LAYOUT_PROFILES_KEY, JSON.stringify(serializable));
        localStorage.setItem(WIDGET_VISIBILITY_KEY, JSON.stringify(nextVisibility));
        localStorage.setItem(AUTO_COLUMN_BREAKPOINTS_KEY, JSON.stringify(nextAutoColumnBreakpoints));
      } catch {}
    },
    [columns, activeColumnCount, layoutProfiles, widgetVisibility, autoColumnBreakpoints],
  );

  // Load per-user layout on login (if available)
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return; // only for authenticated users
      try {
        const serverLayout = await layoutService.getLayout();
        if (cancelled) return;
        if (serverLayout && typeof serverLayout === "object") {
          // Use the ref so we get the current count even after auto-resize has fired
          const curCols = activeColumnCountRef.current;
          const withNew = ensureNewItems(serverLayout, curCols);
          setColumns(withHeights(clampColumnsToCount(withNew, curCols)));
        }
      } catch (e) {
        // ignore network errors; keep local layout
        console.warn("Layout: failed to fetch user layout; using local", e?.message || e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleEditMode = () => setEditMode((v) => !v);
  const enableEditMode = () => setEditMode(true);
  const disableEditMode = () => setEditMode(false);

  const findItem = (id) => {
    for (const colId of Object.keys(columns)) {
      const idx = columns[colId].findIndex((i) => i.id === id);
      if (idx !== -1) return { colId, idx, item: columns[colId][idx] };
    }
    return null;
  };

  const moveWidget = (id, toColId, toIndex) => {
    setColumns((prev) => {
      const loc = (() => {
        for (const c of COLUMN_IDS) {
          const i = prev[c].findIndex((x) => x.id === id);
          if (i !== -1) return { colId: c, idx: i };
        }
        return null;
      })();
      if (!loc) return prev;
      const item = prev[loc.colId][loc.idx];
      const next = cloneColumns(prev);
      next[loc.colId].splice(loc.idx, 1);
      const insertIndex = Math.max(0, Math.min(toIndex ?? next[toColId].length, next[toColId].length));
      next[toColId].splice(insertIndex, 0, item);
      return next;
    });
  };

  const reorderWithinColumn = (colId, fromIndex, toIndex) => {
    setColumns((prev) => {
      const list = [...prev[colId]];
      const [it] = list.splice(fromIndex, 1);
      list.splice(Math.max(0, Math.min(toIndex, list.length)), 0, it);
      return { ...prev, [colId]: list };
    });
  };

  const resizeWidget = (id, size) => {
    setColumns((prev) => {
      const next = cloneColumns(prev);
      for (const c of COLUMN_IDS) {
        const i = next[c].findIndex((x) => x.id === id);
        if (i !== -1) {
          next[c][i] = { ...next[c][i], size, height: sizeToPx(size) };
          break;
        }
      }
      return next;
    });
  };

  const adjustHeight = (id, deltaPx) => {
    setColumns((prev) => {
      const next = cloneColumns(prev);
      for (const c of COLUMN_IDS) {
        const i = next[c].findIndex((x) => x.id === id);
        if (i !== -1) {
          const cur = next[c][i].height ?? sizeToPx(next[c][i].size || "md");
          const nh = Math.max(120, Math.min(cur + deltaPx, 1200));
          next[c][i] = { ...next[c][i], height: nh };
          break;
        }
      }
      return next;
    });
  };

  const setMaxWidth = (id, pxOrNull) => {
    setColumns((prev) => {
      const next = cloneColumns(prev);
      for (const c of COLUMN_IDS) {
        const i = next[c].findIndex((x) => x.id === id);
        if (i !== -1) {
          next[c][i] = { ...next[c][i], maxWidth: pxOrNull };
          break;
        }
      }
      return next;
    });
  };

  const adjustMaxWidth = (id, deltaPx) => {
    setColumns((prev) => {
      const next = cloneColumns(prev);
      for (const c of COLUMN_IDS) {
        const i = next[c].findIndex((x) => x.id === id);
        if (i !== -1) {
          const cur = next[c][i].maxWidth ?? 0; // 0 means no cap; treat as 0 then clamp upwards
          const newVal = Math.max(200, Math.min(cur === 0 ? 400 + deltaPx : cur + deltaPx, 1200));
          next[c][i] = { ...next[c][i], maxWidth: newVal };
          break;
        }
      }
      return next;
    });
  };

  const moveWidgetToAdjacentColumn = (id, direction) => {
    setColumns((prev) => {
      const order = COLUMN_IDS.slice(0, activeColumnCount);
      // locate
      let fromCol = null;
      let fromIdx = -1;
      for (const c of order) {
        const i = prev[c].findIndex((x) => x.id === id);
        if (i !== -1) {
          fromCol = c;
          fromIdx = i;
          break;
        }
      }
      if (!fromCol) return prev;
      const fromPos = order.indexOf(fromCol);
      const toPos = fromPos + (direction === "right" ? 1 : -1);
      if (toPos < 0 || toPos >= order.length) return prev;
      const toCol = order[toPos];
      const next = cloneColumns(prev);
      const [item] = next[fromCol].splice(fromIdx, 1);
      next[toCol].splice(next[toCol].length, 0, item);
      return next;
    });
  };

  const saveLayoutProfile = (columnCount) => {
    const safe = Math.max(1, Math.min(4, Number(columnCount) || 4));
    const normalized = withHeights(normalizeToColumnCount(columns, safe));
    setColumns(normalized);
    setLayoutProfiles((prev) => ({
      ...prev,
      [safe]: normalized,
    }));
    setActiveColumnCount(safe);
  };

  const applyLayoutProfile = (columnCount) => {
    const safe = Math.max(1, Math.min(4, Number(columnCount) || 4));
    const profile = layoutProfiles[safe];
    if (profile) {
      // Add any missing default widgets, then clamp all widgets to active columns
      const withNew = ensureNewItems(profile, safe);
      setColumns(withHeights(clampColumnsToCount(withNew, safe)));
    } else {
      setColumns((prev) => withHeights(normalizeToColumnCount(prev, safe)));
    }
    setActiveColumnCount(safe);
  };

  const setAutoColumnBreakpoints = React.useCallback((nextValue) => {
    setAutoColumnBreakpointsState((prev) => {
      const candidate = typeof nextValue === "function" ? nextValue(prev) : nextValue;
      return normalizeAutoColumnBreakpoints(candidate);
    });
  }, []);

  const resetAutoColumnBreakpoints = React.useCallback(() => {
    setAutoColumnBreakpointsState(DEFAULT_AUTO_COLUMN_BREAKPOINTS);
  }, []);

  const autoColumnRanges = React.useMemo(() => {
    const { twoColsMin, threeColsMin, fourColsMin } = autoColumnBreakpoints;
    return {
      1: { min: 0, max: twoColsMin - 1 },
      2: { min: twoColsMin, max: threeColsMin - 1 },
      3: { min: threeColsMin, max: fourColsMin - 1 },
      4: { min: fourColsMin, max: null },
    };
  }, [autoColumnBreakpoints]);

  const getAutoColumnCountForWidth = React.useCallback(
    (width) => {
      const safeWidth = Math.max(0, Number(width) || 0);
      if (safeWidth >= autoColumnBreakpoints.fourColsMin) return 4;
      if (safeWidth >= autoColumnBreakpoints.threeColsMin) return 3;
      if (safeWidth >= autoColumnBreakpoints.twoColsMin) return 2;
      return 1;
    },
    [autoColumnBreakpoints],
  );

  const setWidgetVisible = (widgetId, visible) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [widgetId]: !!visible,
    }));
  };

  const toggleWidgetVisible = (widgetId) => {
    setWidgetVisibility((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  const widgetCatalog = React.useMemo(() => {
    return getOrderedUniqueItems(ensureNewItems(columns)).map((it) => ({ id: it.id, key: it.key }));
  }, [columns]);

  const saveConfigurations = async () => {
    persistLocalConfigurations(columns, activeColumnCount, layoutProfiles, widgetVisibility);
    if (user) {
      await layoutService.saveLayout(columns);
    }
    return true;
  };

  const resetLayout = () => setColumns(withHeights(defaultLayout));

  const value = {
    editMode,
    enableEditMode,
    disableEditMode,
    toggleEditMode,
    columns,
    moveWidget,
    reorderWithinColumn,
    resizeWidget,
    adjustHeight,
    moveWidgetToAdjacentColumn,
    setMaxWidth,
    adjustMaxWidth,
    resetLayout,
    findItem,
    activeColumnCount,
    setActiveColumnCount,
    autoColumnBreakpoints,
    setAutoColumnBreakpoints,
    resetAutoColumnBreakpoints,
    autoColumnRanges,
    getAutoColumnCountForWidth,
    layoutProfiles,
    saveLayoutProfile,
    applyLayoutProfile,
    widgetVisibility,
    setWidgetVisible,
    toggleWidgetVisible,
    widgetCatalog,
    saveConfigurations,
    persistLocalConfigurations,
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const ctx = React.useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}
