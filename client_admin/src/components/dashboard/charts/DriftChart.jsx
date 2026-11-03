import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Widget from "../../ui/Widget";
import { getTheme } from "./theme";
import { useChartData } from "./ChartDataContext";
import React from "react";

export default function DriftChart() {
  const { primary, textSecondary } = getTheme();
  const { driftSeries } = useChartData();
  const data = React.useMemo(() => driftSeries.map((d) => ({ name: d.name, drift: d.value })), [driftSeries]);
  return (
    <Widget title="Temporal Drift Analysis" className="h-full min-h-0">
      <div className="flex-1 w-full h-full min-h-0 py-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={120}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" tick={{ fill: textSecondary, fontSize: 10 }} />
            <YAxis stroke="rgba(255,255,255,0.12)" domain={[0, 0.25]} tick={{ fill: textSecondary, fontSize: 10 }} />
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12, color: "#e5e7eb" }}
            />
            <Line type="monotone" dataKey="drift" stroke={primary} strokeWidth={2} dot={{ r: 3, fill: primary }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
}
