import { useCallback, useEffect, useState } from "react";

import { getStoredJson, setStoredJson, LOCAL_STORAGE_KEYS } from "@/services/storage/localStorage";

export const DEFAULT_TAB_ORDER = ["HomeTab", "PlanTab", "FitnessTab", "LibraryTab", "FinanceTab"] as const;
export type TabKey = (typeof DEFAULT_TAB_ORDER)[number];

const TAB_LABELS: Record<TabKey, string> = {
  HomeTab: "Home",
  PlanTab: "Plan",
  FitnessTab: "Fitness",
  LibraryTab: "Library",
  FinanceTab: "Finance",
};

export function getTabLabel(key: TabKey): string {
  return TAB_LABELS[key];
}

export function useTabOrder() {
  const [order, setOrder] = useState<TabKey[]>([...DEFAULT_TAB_ORDER]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getStoredJson<TabKey[]>(LOCAL_STORAGE_KEYS.bottomNavOrder, [...DEFAULT_TAB_ORDER]).then(
      (stored) => {
        // Validate stored order contains exactly the right keys
        const valid = stored.length === DEFAULT_TAB_ORDER.length &&
          DEFAULT_TAB_ORDER.every((k) => stored.includes(k));
        setOrder(valid ? stored : [...DEFAULT_TAB_ORDER]);
        setLoaded(true);
      },
    );
  }, []);

  const saveOrder = useCallback(async (newOrder: TabKey[]) => {
    setOrder(newOrder);
    await setStoredJson(LOCAL_STORAGE_KEYS.bottomNavOrder, newOrder);
  }, []);

  const resetOrder = useCallback(async () => {
    const def = [...DEFAULT_TAB_ORDER];
    setOrder(def);
    await setStoredJson(LOCAL_STORAGE_KEYS.bottomNavOrder, def);
  }, []);

  const moveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const next = [...order];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      void saveOrder(next);
    },
    [order, saveOrder],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index >= order.length - 1) return;
      const next = [...order];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      void saveOrder(next);
    },
    [order, saveOrder],
  );

  return { order, loaded, saveOrder, resetOrder, moveUp, moveDown };
}
