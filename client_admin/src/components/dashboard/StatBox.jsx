import { ArrowUpRight, ArrowDownRight } from "lucide-react";

// Lightweight inline sparkline. Pass an array of numbers in `trend`.
const Sparkline = ({ data = [], height = 28, stroke = "#60a5fa", fill = "rgba(96,165,250,0.12)" }) => {
  if (!Array.isArray(data) || data.length < 2) return null;
  const width = 120;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  const path = `M ${points[0]} L ${points.slice(1).join(" ")}`;
  const area = `M ${points[0]} L ${points.slice(1).join(" ")} L ${width},${height} L 0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[28px] overflow-visible">
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
};

const StatBox = ({
  title,
  value,
  change,
  changeType,
  period,
  lastUpdate = "1 min ago",
  trend, // optional array of numbers for sparkline
  compact = false, // optional compact styling
  showDivider = true, // whether to render right-side divider
}) => {
  const isIncrease = changeType === "increase";
  const changeColor = isIncrease ? "text-green-400" : "text-red-400";
  const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;

  if (compact) {
    return (
      <div
        className={`flex-1 py-4 px-4 flex flex-col justify-center ${
          showDivider ? "border-r border-gray-700/50 last:border-r-0" : ""
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold uppercase text-text-secondary tracking-wider text-[10px] truncate pr-2">{title}</h4>
          <span className={`flex items-center text-[10px] font-medium ${changeColor}`}>
            <Icon size={12} className="mr-0.5" />
            {change}
          </span>
        </div>

        <div className="flex justify-between items-end">
          <p className="text-xl font-semibold text-text-main leading-none">{value}</p>
          {Array.isArray(trend) && trend.length > 1 && (
            <div className="w-16 h-5 opacity-80">
              <Sparkline data={trend} height={20} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    // Each stat box is a flex container, growing to fill space.
    <div className={`flex-1 p-4 ${showDivider ? "border-r border-gray-700/50 last:border-r-0" : ""}`}>
      <h4 className="font-bold uppercase text-text-secondary tracking-wider text-xs mb-2">{title}</h4>
      <p className="text-3xl mb-1 font-semibold text-text-main">{value}</p>
      {Array.isArray(trend) && trend.length > 1 && (
        <div className="mt-1 mb-1 -mx-1">
          <Sparkline data={trend} height={28} />
        </div>
      )}
      <div className="flex items-center text-text-secondary text-xs">
        <span className={`flex items-center mr-2 ${changeColor}`}>
          <Icon size={16} className="mr-0.5" />
          {change}
        </span>
        <span>vs {period}</span>
      </div>
      <p className="text-[10px] text-text-tertiary mt-2">updated {lastUpdate}</p>
    </div>
  );
};

export default StatBox;
