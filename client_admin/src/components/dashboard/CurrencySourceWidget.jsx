import Widget from "../ui/Widget";
import { useAuth } from "../../context/AuthContext";

const CurrencySourceWidget = () => {
  const { user } = useAuth();

  const currencies = [
    { name: "Temu Tokens (Habits)", value: user?.temuTokens || 0, color: "!bg-yellow-400" },
    { name: "Gatilla Gold (Workouts)", value: user?.gatillaGold || 0, color: "!bg-amber-400" },
    { name: "Wendy Hearts (Reading)", value: user?.wendyHearts || 0, color: "!bg-pink-400" },
  ];

  // Calculate total for percentage bars
  const total = currencies.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Widget title="Currency Acquisition">
      <div className="space-y-4">
        {currencies.map((currency) => {
          const percentage = total > 0 ? (currency.value / total) * 100 : 0;
          return (
            <div key={currency.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm mb-1.5">
                <span className="text-text-secondary">{currency.name}</span>
                <span className="flex items-baseline gap-2">
                  <span className="dash-value">{currency.value.toLocaleString()}</span>
                  <span className="w-9 text-right text-[11px] text-text-secondary tabular-nums">{Math.round(percentage)}%</span>
                </span>
              </div>
              <div className="dash-meter">
                <span className={currency.color} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
};

export default CurrencySourceWidget;
