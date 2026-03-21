import React, { useMemo } from "react";
import Widget from "../ui/Widget";
import { ResponsiveContainer, BarChart, Bar, Cell, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity, Wallet } from "lucide-react";

const StatCard = ({ title, value, subtext, icon: Icon, colorClass = "text-white" }) => (
  <div className="bg-surface border border-gray-700/50 rounded-lg p-4 flex flex-col justify-between h-full shadow-sm relative overflow-hidden group hover:border-gray-600 transition-colors">
    <div className={`absolute top-4 right-4 opacity-20 ${colorClass}`}>{Icon && <Icon size={24} />}</div>
    <div>
      <p className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
      <h3 className={`text-2xl font-bold tabular-nums ${colorClass}`}>{value}</h3>
    </div>
    {subtext && <p className="text-xs text-text-secondary mt-2">{subtext}</p>}
  </div>
);

const FinanceDashboard = ({ transactions, checkingsBalance, savingsBalance, selectedMonth }) => {
  const { income, expense, net, sparkData, recentTransactions, avgDailySpend, savingsRate } = useMemo(() => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();

    // Filter for selected month
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    const inc = monthTx.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const exp = monthTx.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const netVal = inc - exp;

    // Daily net flow for the chart
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayTx = monthTx.filter((t) => new Date(t.date).getDate() === day);
      const dayNet = dayTx.reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);
      return { day, net: dayNet };
    });

    const recents = [...monthTx].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    const avgSpend = exp / Math.max(1, new Date().getDate());
    const monthSavingsRate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;

    return {
      income: inc,
      expense: exp,
      net: netVal,
      sparkData: data,
      recentTransactions: recents,
      avgDailySpend: avgSpend,
      savingsRate: monthSavingsRate,
    };
  }, [transactions, selectedMonth]);

  const monthName = selectedMonth.toLocaleString("default", { month: "long" });

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Checkings"
          value={`$${checkingsBalance.toFixed(2)}`}
          icon={Wallet}
          colorClass="text-emerald-400"
        />
        <StatCard title="Savings" value={`$${savingsBalance.toFixed(2)}`} icon={Activity} colorClass="text-sky-400" />
        <StatCard
          title={`${monthName} In`}
          value={`+$${income.toFixed(2)}`}
          icon={TrendingUp}
          colorClass="text-green-400"
        />
        <StatCard
          title={`${monthName} Out`}
          value={`-$${expense.toFixed(2)}`}
          icon={TrendingDown}
          colorClass="text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Chart Widget */}
        <div className="lg:col-span-2 h-64 bg-surface border border-gray-700/50 rounded-lg p-4 relative">
          <h3 className="text-xs font-semibold uppercase text-text-secondary tracking-wider mb-4">Cash Flow (Daily)</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparkData}>
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value;
                      return (
                        <div className="bg-gray-800 border border-gray-700 p-2 rounded text-xs shadow-xl">
                          <p className="text-gray-400 mb-1">Day {payload[0].payload.day}</p>
                          <p className={`font-bold tabular-nums ${val >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {val >= 0 ? "+" : ""}${val.toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="net" radius={[2, 2, 2, 2]}>
                  {sparkData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.net >= 0 ? "#4ade80" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Widget */}
        <div className="h-auto lg:h-64 bg-surface border border-gray-700/50 rounded-lg p-6 flex flex-col justify-center space-y-4">
          <h3 className="text-xs font-semibold uppercase text-text-secondary tracking-wider mb-2">Month Summary</h3>
          <div className="flex justify-between items-center border-b border-gray-700/50 pb-3">
            <span className="text-gray-400">Total Income</span>
            <span className="text-green-400 font-mono text-lg">+${income.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700/50 pb-3">
            <span className="text-gray-400">Total Expenses</span>
            <span className="text-red-400 font-mono text-lg">-${expense.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-200 font-bold">Net Result</span>
            <span className={`font-mono text-xl font-bold ${net >= 0 ? "text-emerald-400" : "text-red-500"}`}>
              {net >= 0 ? "+" : ""}${net.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
            <span className="text-gray-400">Savings Rate</span>
            <span className={`font-mono text-sm ${savingsRate >= 0 ? "text-emerald-400" : "text-red-500"}`}>
              {savingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Avg Daily Spend</span>
            <span className="font-mono text-sm text-amber-300">${avgDailySpend.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Widget title="Recent Activity" className="border-gray-700/50" padding="p-4">
        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-text-secondary">No transactions in this month yet.</p>
          ) : (
            recentTransactions.map((t) => (
              <div key={t._id} className="flex justify-between items-center border-b border-gray-700/40 pb-2">
                <div>
                  <p className="text-sm text-white font-medium">{t.description}</p>
                  <p className="text-xs text-text-secondary">{new Date(t.date).toLocaleDateString()}</p>
                </div>
                <p className={`font-mono text-sm ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                  {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </Widget>
    </div>
  );
};

export default FinanceDashboard;
