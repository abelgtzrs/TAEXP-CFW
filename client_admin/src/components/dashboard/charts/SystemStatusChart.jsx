import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { tooltipProps } from "./theme";
import { useChartData } from "./ChartDataContext";
import ChartHeadline from "./ChartHeadline";

export default function SystemStatusChart() {
  const { systemStatus } = useChartData();
  const lead = systemStatus[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChartHeadline value={lead ? `${lead.value}%` : "—"} caption={lead ? String(lead.name).toLowerCase() : null} />
      <div className="flex min-h-0 flex-1 items-center gap-4">
        <div className="h-full min-h-[100px] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={systemStatus}
                dataKey="value"
                innerRadius="68%"
                outerRadius="92%"
                paddingAngle={2}
                cornerRadius={3}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {systemStatus.map((entry) => (
                  // style, not the fill attribute, so var(--color-*) values resolve
                  <Cell key={entry.name} style={{ fill: entry.color }} />
                ))}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(v, name) => [`${v}%`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="dash-rows w-36 shrink-0 text-xs">
          {systemStatus.map((item) => (
            <li key={item.name} className="flex items-center gap-2 py-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 truncate text-text-secondary">{item.name}</span>
              <span className="dash-value">{item.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
