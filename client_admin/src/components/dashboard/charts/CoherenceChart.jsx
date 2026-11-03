import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Widget from "../../ui/Widget";
import { getTheme } from "./theme";
import { useChartData } from "./ChartDataContext";

export default function CoherenceChart() {
  const { primary, secondary, textSecondary } = getTheme();
  const { coherenceSeries } = useChartData();
  const data = React.useMemo(
    () => coherenceSeries.map((d) => ({ name: d.name, coherence: d.value })),
    [coherenceSeries]
  );
  return (
    <Widget title="Narrative Coherence Index" className="h-full min-h-0">
      <div className="flex-1 w-full h-full min-h-0 py-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={120}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -15, bottom: 10 }}>
            <defs>
              <linearGradient id="colorCoherence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="50%" stopColor={primary} stopOpacity={0.4} />
                <stop offset="95%" stopColor={secondary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.12)" tick={{ fill: textSecondary, fontSize: 10 }} />
            <YAxis
              stroke="rgba(255,255,255,0.12)"
              domain={["dataMin - 2", "dataMax + 2"]}
              tick={{ fill: textSecondary, fontSize: 10 }}
            />
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <Tooltip
              contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", borderColor: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 12, color: "#e5e7eb" }}
            />
            <Area type="monotone" dataKey="coherence" stroke={primary} strokeWidth={2} fill="url(#colorCoherence)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
}
