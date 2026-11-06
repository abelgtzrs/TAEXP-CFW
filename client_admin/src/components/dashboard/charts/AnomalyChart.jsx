import React from "react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getTheme, axisProps, gridProps, tooltipProps } from "./theme";
import api from "../../../services/api";
import ChartHeadline from "./ChartHeadline";

export default function AnomalyChart() {
  const { primary, textSecondary } = getTheme();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [volumes, setVolumes] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchVolumes = async () => {
      try {
        setLoading(true);
        const resp = await api.get("/admin/volumes/summary");
        if (!cancelled) setVolumes(resp?.data?.data || []);
      } catch (e) {
        if (!cancelled) setError("Couldn't load volumes. Refresh to try again.");
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
        lines: v.lineCount || 0,
        num: Number(v.volumeNumber) || 0,
      }))
      .sort((a, b) => a.num - b.num);
    // Keep last 16 by volume number to match compact chart style
    return arr.slice(-16);
  }, [volumes]);

  const last = data[data.length - 1];
  const average = data.length ? Math.round(data.reduce((sum, d) => sum + d.lines, 0) / data.length) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChartHeadline
        value={last ? last.lines.toLocaleString() : loading ? "…" : "—"}
        caption={last ? `lines in ${last.name}, average ${average.toLocaleString()}` : null}
      />
      <div className="relative min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps(textSecondary)} interval="preserveStartEnd" minTickGap={8} />
            <YAxis {...axisProps(textSecondary)} tickCount={4} />
            <Tooltip {...tooltipProps} formatter={(v) => [Number(v).toLocaleString(), "Lines"]} />
            <Bar dataKey="lines" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={primary} fillOpacity={i === data.length - 1 ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {error && <p className="absolute inset-x-0 bottom-1 text-center text-[11px] text-rose-300">{error}</p>}
      </div>
    </div>
  );
}
