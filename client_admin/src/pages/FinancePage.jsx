import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../components/ui/PageHeader";
import api from "../services/api";
import FinanceDashboard from "../components/finances/FinanceDashboard";
import FinanceTransactions from "../components/finances/FinanceTransactions";
import FinanceBills from "../components/finances/FinanceBills";
import FinancePlanning from "../components/finances/FinancePlanning";
import { LayoutDashboard, List, FileText, PieChart, RefreshCw } from "lucide-react";

const FinancePage = () => {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    return localStorage.getItem("finance.activeTab") || "dashboard";
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ transactions: [], categories: [], bills: [], budgetBills: [] });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof window === "undefined") return new Date();
    const stored = localStorage.getItem("finance.selectedMonth");
    return stored ? new Date(stored) : new Date();
  });
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [tr, ca, bi, fb] = await Promise.all([
        api.get("/finance/transactions"),
        api.get("/finance/categories"),
        api.get("/calendar/bills"),
        api.get("/finance/bills"),
      ]);
      setData({
        transactions: tr.data.data,
        categories: ca.data.data,
        bills: bi.data.items,
        budgetBills: fb.data.data,
      });
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error("Failed to load finances", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("finance.activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("finance.selectedMonth", selectedMonth.toISOString());
  }, [selectedMonth]);

  // Calculate Balances Summary for Dashboard
  const balances = useMemo(() => {
    // Simplistic calculation based on all time transactions
    // In a real app, you might fetch this from a /stats endpoint
    const checkings = data.transactions.reduce((acc, t) => {
      // Find if transaction is savings category
      const isSavings = t.category?.name?.toLowerCase().includes("savings");
      if (isSavings) return acc;
      return acc + (t.type === "income" ? t.amount : -t.amount);
    }, 0);

    const savings = data.transactions.reduce((acc, t) => {
      const isSavings = t.category?.name?.toLowerCase().includes("savings");
      if (isSavings) return acc + (t.type === "income" ? t.amount : -t.amount);
      return acc;
    }, 0);

    return { checkings, savings };
  }, [data.transactions]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: List },
    { id: "bills", label: "Bills", icon: FileText },
    { id: "planning", label: "Budget", icon: PieChart },
  ];

  if (loading && !data.transactions.length) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Financial Data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 pb-24 md:pb-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <PageHeader title="Finance" subtitle="Manage your wealth." compact={false} />

        {/* Month Selector & Refresh */}
        <div className="flex items-center gap-3 bg-surface p-1 rounded-lg border border-gray-700/50">
          <button
            onClick={refreshData}
            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} />
          </button>
          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          <input
            type="month"
            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`}
            onChange={(e) => setSelectedMonth(new Date(e.target.value + "-01"))}
            className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
          />
        </div>
      </div>

      <div className="mb-4 text-xs text-text-secondary">
        Last sync: {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : "Not synced yet"}
      </div>

      {/* Mobile Tab Navigation (Bottom Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B0E0A] border-t border-gray-800 z-50 px-6 py-3 flex justify-between safe-area-pb">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-1 text-[10px] ${activeTab === t.id ? "text-primary" : "text-gray-500"}`}
          >
            <t.icon size={20} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden md:flex gap-6 border-b border-gray-800 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"}`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === "dashboard" && (
          <FinanceDashboard
            transactions={data.transactions}
            checkingsBalance={balances.checkings}
            savingsBalance={balances.savings}
            selectedMonth={selectedMonth}
          />
        )}
        {activeTab === "transactions" && (
          <FinanceTransactions transactions={data.transactions} categories={data.categories} onUpdate={refreshData} />
        )}
        {activeTab === "bills" && (
          <FinanceBills
            bills={data.bills}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onUpdate={refreshData}
          />
        )}
        {activeTab === "planning" && (
          <FinancePlanning
            categories={data.categories}
            transactions={data.transactions}
            selectedMonth={selectedMonth}
            budgets={(data.budgetBills || []).filter((b) => b.isBudget)} // Adjust based on how budgets are actually stored
            onUpdateBudgets={async (newBudgets) => {
              try {
                // Assuming endpoint exists or adapting to previous structure
                await Promise.all(
                  newBudgets.map((b) => api.put(`/finance/bills/${b.category}/budget`, { amount: b.amount })),
                );
                refreshData();
              } catch (e) {
                alert("Failed to update budget");
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FinancePage;
