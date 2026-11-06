export const getTheme = () => {
  const root = getComputedStyle(document.documentElement);
  return {
    primary: root.getPropertyValue("--color-primary").trim() || "#426280",
    secondary: root.getPropertyValue("--color-secondary").trim() || "#144573",
    textSecondary: root.getPropertyValue("--color-text-secondary").trim() || "#9ca3af",
  };
};

// Shared chart chrome: quiet axes, faint horizontal grid, neutral tooltip.
export const axisProps = (textSecondary) => ({
  axisLine: false,
  tickLine: false,
  tick: { fill: textSecondary, fontSize: 10, opacity: 0.8 },
});

export const gridProps = { vertical: false, stroke: "rgba(255,255,255,0.05)" };

export const tooltipProps = {
  cursor: { stroke: "rgba(255,255,255,0.15)", fill: "rgba(255,255,255,0.03)" },
  contentStyle: {
    background: "rgba(12, 14, 20, 0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 12,
    color: "#e5e7eb",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
  },
  labelStyle: { color: "#9ca3af", marginBottom: 2 },
  itemStyle: { color: "#e5e7eb", padding: 0 },
};
