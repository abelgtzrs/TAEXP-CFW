import { useCallback, useEffect, useState } from "react";

import { getStoredJson, setStoredJson, LOCAL_STORAGE_KEYS } from "@/services/storage/localStorage";

// ── Section keys that can be toggled / reordered ──────
export type DashboardSection =
  | "streak"
  | "quickActions"
  | "stats"
  | "today"
  | "goals"
  | "acquisitions"
  | "budget"
  | "topProducts"
  | "currencies"
  | "you";

export const DEFAULT_SECTIONS: DashboardSection[] = [
  "streak",
  "quickActions",
  "stats",
  "today",
  "goals",
  "acquisitions",
  "budget",
  "topProducts",
  "currencies",
  "you",
];

export const SECTION_LABELS: Record<DashboardSection, string> = {
  streak: "Streak banner",
  quickActions: "Quick actions",
  stats: "At a glance",
  today: "Today snapshot",
  goals: "Goals",
  acquisitions: "Recent acquisitions",
  budget: "Budget",
  topProducts: "Top products",
  currencies: "Currencies",
  you: "Profile shortcuts",
};

type DashboardPrefs = {
  order: DashboardSection[];
  hidden: DashboardSection[];
};

const DEFAULTS: DashboardPrefs = {
  order: DEFAULT_SECTIONS,
  hidden: [],
};

export function useDashboardPrefs() {
  const [prefs, setPrefs] = useState<DashboardPrefs>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void getStoredJson<DashboardPrefs>(LOCAL_STORAGE_KEYS.dashboardPrefs, DEFAULTS).then((stored) => {
      // Ensure any new sections are appended
      const merged = [...stored.order];
      for (const s of DEFAULT_SECTIONS) {
        if (!merged.includes(s)) merged.push(s);
      }
      setPrefs({ order: merged, hidden: stored.hidden ?? [] });
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(async (next: DashboardPrefs) => {
    setPrefs(next);
    await setStoredJson(LOCAL_STORAGE_KEYS.dashboardPrefs, next);
  }, []);

  const toggleSection = useCallback(
    (section: DashboardSection) => {
      const hidden = prefs.hidden.includes(section)
        ? prefs.hidden.filter((s) => s !== section)
        : [...prefs.hidden, section];
      void persist({ ...prefs, hidden });
    },
    [prefs, persist],
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...prefs.order];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      void persist({ ...prefs, order: next });
    },
    [prefs, persist],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= prefs.order.length - 1) return;
      const next = [...prefs.order];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      void persist({ ...prefs, order: next });
    },
    [prefs, persist],
  );

  const reset = useCallback(() => {
    void persist(DEFAULTS);
  }, [persist]);

  const visibleSections = prefs.order.filter((s) => !prefs.hidden.includes(s));

  return {
    order: prefs.order,
    hidden: prefs.hidden,
    visibleSections,
    loaded,
    toggleSection,
    moveUp,
    moveDown,
    reset,
  };
}
