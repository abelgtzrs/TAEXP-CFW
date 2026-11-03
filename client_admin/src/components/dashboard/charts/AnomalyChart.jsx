import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Widget from "../../ui/Widget";
import { getTheme } from "./theme";
import React from "react";
import api from "../../../services/api";

export default function AnomalyChart() {
  const { primary, textSecondary } = getTheme();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [volumes, setVolumes] = React.useState([]);
  const containerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    let cancelled = false;
    const fetchVolumes = async () => {
      try {
        setLoading(true);
        const resp = await api.get("/admin/volumes");
        if (!cancelled) setVolumes(resp?.data?.data || []);
      } catch (e) {
        if (!cancelled) setError("Failed to load volumes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchVolumes();
    return () => {
      cancelled = true;
    };
  }, []);

  const data = React.useMemo(() => {
    const arr = (volumes || [])
      .map((v) => ({
        name: `V${v.volumeNumber ?? "?"}`,
        lines: Array.isArray(v.bodyLines) ? v.bodyLines.length : 0,
        num: Number(v.volumeNumber) || 0,
      }))
      .sort((a, b) => a.num - b.num);
    // Keep last 16 by volume number to match compact chart style
    return arr.slice(-16);
  }, [volumes]);

  // Auto-fit scale: aim for a base content height; scale down if the container is shorter
  React.useEffect(() => {
    if (!containerRef.current) return;
    const baseHeight = 220; // px content target before scaling
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const ch = entry.contentRect?.height || el.clientHeight || 0;
        if (!ch) continue;
        const next = Math.min(1, Math.max(0.5, ch / baseHeight));
        setScale(next);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <Widget title="Volume Line Counts" className="h-full min-h-0">
      <div className="flex-1 w-full h-full min-h-0 py-2">
        <div ref={containerRef} className="relative h-full w-full">
          <div
            className="origin-top-left h-full w-full"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: scale ? `calc(100% / ${scale})` : "100%",
            }}
          >
            <ResponsiveContainer width="100%" height="100%" minHeight={80}>
              <BarChart data={data} margin={{ top: 6, right: 12, left: -10, bottom: 6 }} barCategoryGap={1}>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" tick={{ fill: textSecondary, fontSize: 9 }} />
                <YAxis stroke="rgba(255,255,255,0.12)" tick={{ fill: textSecondary, fontSize: 9 }} />
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12, color: "#e5e7eb" }}
                  formatter={(value, name) => [value, "Lines"]}
                />
                <Bar dataKey="lines" fill={primary} style={{ cursor: "default" }} className="no-hover" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {loading && (
            <div className="absolute left-2 bottom-1 text-[10px] text-text-secondary pointer-events-none">
              Loading volumes…
            </div>
          )}
          {error && (
            <div className="absolute left-2 bottom-1 text-[10px] text-red-400 pointer-events-none">{error}</div>
          )}
        </div>
      </div>
    </Widget>
  );
}
