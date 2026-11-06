import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getTheme, axisProps, gridProps, tooltipProps } from "./theme";
import { useChartData } from "./ChartDataContext";
import ChartHeadline from "./ChartHeadline";

export default function CoherenceChart() {
  const { primary, textSecondary } = getTheme();
  const { coherenceSeries } = useChartData();
  const data = React.useMemo(
    () => coherenceSeries.map((d) => ({ name: d.name, coherence: Number(d.value) || 0 })),
    [coherenceSeries],
  );
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChartHeadline
        value={last ? last.coherence.toFixed(1) : "—"}
        delta={first && last ? (last.coherence - first.coherence).toFixed(1) : null}
        caption={first ? `since ${first.name}` : null}
      />
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="coherenceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity={0.28} />
                <stop offset="100%" stopColor={primary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps(textSecondary)} minTickGap={24} />
            <YAxis {...axisProps(textSecondary)} domain={["dataMin - 2", "dataMax + 2"]} tickFormatter={(v) => Math.round(v)} />
            <Tooltip {...tooltipProps} formatter={(v) => [Number(v).toFixed(1), "Coherence"]} />
            <Area
              type="monotone"
              dataKey="coherence"
              stroke={primary}
              strokeWidth={1.75}
              fill="url(#coherenceFill)"
              activeDot={{ r: 3.5, strokeWidth: 0, fill: primary }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
