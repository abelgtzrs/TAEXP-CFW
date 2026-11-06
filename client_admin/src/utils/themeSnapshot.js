// Saves the theme variables currently set on <html> so the inline script in index.html can
// re-apply them before first paint. Keep THEME_SNAPSHOT_KEY in sync with that script.
export const THEME_SNAPSHOT_KEY = "tae.themeSnapshot.v1";

const THEME_VARS = [
  "--color-bg",
  "--color-background",
  "--color-surface",
  "--color-primary",
  "--color-secondary",
  "--color-tertiary",
  "--color-text-main",
  "--color-text-secondary",
  "--color-text-tertiary",
  "--font-main",
  "--glass-blur",
  "--glass-surface-alpha",
];

// Watches <html> instead of hooking each place that sets theme variables (useTheme,
// AdminLayout, the customizer), so whatever was applied last is what gets saved.
export function startThemeSnapshot() {
  const root = document.documentElement;
  const save = () => {
    const vars = {};
    for (const name of THEME_VARS) {
      const value = root.style.getPropertyValue(name).trim();
      if (value) vars[name] = value;
    }
    try {
      localStorage.setItem(THEME_SNAPSHOT_KEY, JSON.stringify({ vars, glass: root.getAttribute("data-glass") }));
    } catch {
      // Storage blocked: the next load just falls back to the stylesheet defaults.
    }
  };
  new MutationObserver(save).observe(root, { attributes: true, attributeFilter: ["style", "data-glass"] });
}
