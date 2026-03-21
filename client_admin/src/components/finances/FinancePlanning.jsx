import React, { useState, useEffect } from "react";
import Widget from "../ui/Widget";
import StyledInput from "../ui/StyledInput";
import StyledButton from "../ui/StyledButton";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const FinancePlanning = ({ categories, transactions, selectedMonth, budgets, onUpdateBudgets }) => {
  const [localBudgets, setLocalBudgets] = useState({});

  useEffect(() => {
    // Flatten budget array into object { catId: amount }
    const initial = {};
    if (budgets) {
      // Assuming bills prop passed as budgets contain budget info,
      // OR we use a dedicated budget endpoint.
      // Based on original code, it reused the 'bills' endpoint or a similar structure.
      // We will adapt to whatever is passed.
      budgets.forEach((b) => {
        if (b.category) initial[b.category] = b.amount;
      });
    }
    setLocalBudgets(initial);
  }, [budgets]);

  // Calculate spending
  const spending = React.useMemo(() => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    const map = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (t.type === "expense" && d.getMonth() === month && d.getFullYear() === year && t.category) {
        map[t.category._id] = (map[t.category._id] || 0) + t.amount;
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  const handleSave = () => {
    // Transform back to array for API
    const payload = Object.keys(localBudgets).map((k) => ({ category: k, amount: Number(localBudgets[k]) }));
    onUpdateBudgets(payload);
  };

  const applyPreviousMonthAsBudget = () => {
    const previous = new Date(selectedMonth);
    previous.setMonth(previous.getMonth() - 1);
    const prevMonth = previous.getMonth();
    const prevYear = previous.getFullYear();
    const previousSpending = {};

    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (t.type === "expense" && d.getMonth() === prevMonth && d.getFullYear() === prevYear && t.category?._id) {
        previousSpending[t.category._id] = (previousSpending[t.category._id] || 0) + t.amount;
      }
    });

    setLocalBudgets((current) => ({ ...current, ...previousSpending }));
  };

  const totalBudget = Object.values(localBudgets).reduce((acc, value) => acc + (Number(value) || 0), 0);
  const totalSpent = Object.values(spending).reduce((acc, value) => acc + value, 0);
  const totalRemaining = totalBudget - totalSpent;

  const chartData = categories
    .map((cat) => ({
      name: cat.name,
      value: spending[cat._id] || 0,
      color: cat.color || "#6b7280",
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
      <Widget title="Category Budgets">
        <p className="text-sm text-text-secondary mb-4">Set your spending limits for each category this month.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="rounded-md border border-gray-700/50 bg-gray-900/40 p-3">
            <p className="text-xs text-text-secondary uppercase">Budgeted</p>
            <p className="font-mono text-lg text-sky-300">${totalBudget.toFixed(2)}</p>
          </div>
          <div className="rounded-md border border-gray-700/50 bg-gray-900/40 p-3">
            <p className="text-xs text-text-secondary uppercase">Spent</p>
            <p className="font-mono text-lg text-amber-300">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="rounded-md border border-gray-700/50 bg-gray-900/40 p-3">
            <p className="text-xs text-text-secondary uppercase">Remaining</p>
            <p className={`font-mono text-lg ${totalRemaining >= 0 ? "text-emerald-400" : "text-red-500"}`}>
              ${totalRemaining.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <StyledButton onClick={applyPreviousMonthAsBudget} className="w-full md:w-auto">
            Auto-Fill From Last Month
          </StyledButton>
        </div>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {categories.map((cat) => {
            const spent = spending[cat._id] || 0;
            const budget = localBudgets[cat._id] || 0;
            const percent = budget > 0 ? (spent / budget) * 100 : 0;
            const isOver = spent > budget && budget > 0;

            return (
              <div key={cat._id} className="bg-gray-800/30 border border-gray-700/30 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary mr-2">Limit:</span>
                    <StyledInput
                      type="number"
                      className="w-24 text-right py-1 px-2 text-sm"
                      value={localBudgets[cat._id] || ""}
                      onChange={(e) => setLocalBudgets({ ...localBudgets, [cat._id]: e.target.value })}
                      placeholder="None"
                    />
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isOver ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs font-mono">
                  <span className={isOver ? "text-red-400" : "text-gray-400"}>${spent.toFixed(2)} spent</span>
                  <span className="text-gray-500">{budget > 0 ? `${Math.round(percent)}%` : "No Limit"}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700">
          <StyledButton onClick={handleSave} className="w-full">
            Save Budget Settings
          </StyledButton>
        </div>
      </Widget>

      <Widget title="Spending Breakdown">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-secondary text-sm p-10 border border-dashed border-gray-700 rounded-lg">
            No spending data for this month yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, "Spent"]}
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "0.5rem" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {chartData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border border-gray-700/40 rounded px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-white">{item.name}</span>
                  </div>
                  <span className="font-mono text-sm text-gray-200">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Widget>
    </div>
  );
};
export default FinancePlanning;
