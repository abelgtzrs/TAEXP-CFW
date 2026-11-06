import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { getTheme, axisProps, gridProps, tooltipProps } from "./theme";
import { useChartData } from "./ChartDataContext";
import ChartHeadline from "./ChartHeadline";

export default function DriftChart() {
  const { primary, textSecondary } = getTheme();
  const { driftSeries } = useChartData();
  const data = React.useMemo(
    () => driftSeries.map((d) => ({ name: d.name, drift: Number(d.value) || 0 })),
    [driftSeries],
  );
  const prev = data[data.length - 2];
  const last = data[data.length - 1];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChartHeadline
        value={last ? last.drift.toFixed(3) : "—"}
        delta={prev && last ? (last.drift - prev.drift).toFixed(3) : null}
        caption={prev ? `vs ${prev.name}` : null}
      />
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps(textSecondary)} minTickGap={24} />
            <YAxis {...axisProps(textSecondary)} domain={[0, 0.25]} tickCount={4} />
            <Tooltip {...tooltipProps} formatter={(v) => [Number(v).toFixed(3), "Drift"]} />
            <Line
              type="monotone"
              dataKey="drift"
              stroke={primary}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3.5, strokeWidth: 0, fill: primary }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
