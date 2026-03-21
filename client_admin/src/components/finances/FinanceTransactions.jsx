import React, { useState, useMemo, useEffect } from "react";
import Widget from "../ui/Widget";
import StyledInput from "../ui/StyledInput";
import StyledButton from "../ui/StyledButton";
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import api from "../../services/api";

const TransactionModal = ({ isOpen, transaction, onClose, onSave, categories }) => {
  const [form, setForm] = useState(
    transaction || {
      description: "",
      amount: "",
      type: "expense",
      category: "",
      date: new Date().toISOString().split("T")[0],
    },
  );

  // Update form when transaction changes
  React.useEffect(() => {
    if (transaction) {
      setForm(transaction);
    } else {
      setForm({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [transaction]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: Number(form.amount) });
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full md:max-w-md md:rounded-lg rounded-t-xl border border-gray-700 p-6 animate-in slide-in-from-bottom-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{transaction ? "Edit Transaction" : "New Transaction"}</h2>
          <button onClick={onClose}>
            <X size={24} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-text-secondary mb-1">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "expense" })}
                className={`p-2 rounded border ${form.type === "expense" ? "bg-red-500/20 border-red-500 text-red-400" : "border-gray-700 text-gray-400"}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: "income" })}
                className={`p-2 rounded border ${form.type === "income" ? "bg-green-500/20 border-green-500 text-green-400" : "border-gray-700 text-gray-400"}`}
              >
                Income
              </button>
            </div>
          </div>
          <StyledInput
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <StyledInput
            type="number"
            placeholder="Amount"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={form.category._id || form.category} // Handle both populated object and ID string
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded p-3 text-white w-full outline-none focus:border-primary"
              required
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <StyledInput
              type="date"
              value={form.date.split("T")[0]}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <StyledButton type="submit" className="w-full py-3 mt-4 text-base font-bold">
            {transaction ? "Update Transaction" : "Add Transaction"}
          </StyledButton>
        </form>
      </div>
    </div>
  );
};

const FinanceTransactions = ({ transactions, categories, onUpdate }) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date_desc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const filtered = useMemo(() => {
    const base = transactions.filter((t) => {
      const matchSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.category?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "All" || t.type === filterType.toLowerCase();
      const matchCategory = filterCategory === "All" || t.category?._id === filterCategory;
      return matchSearch && matchType && matchCategory;
    });

    return [...base].sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.date) - new Date(b.date);
        case "amount_desc":
          return b.amount - a.amount;
        case "amount_asc":
          return a.amount - b.amount;
        case "date_desc":
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
  }, [transactions, search, filterType, filterCategory, sortBy]);

  const summary = useMemo(() => {
    const income = filtered.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
    const expense = filtered.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
      count: filtered.length,
    };
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const displayItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, filterType, filterCategory, sortBy]);

  const exportFilteredCsv = () => {
    const lines = ["Date,Type,Description,Category,Amount"];
    filtered.forEach((t) => {
      const safeDesc = `"${(t.description || "").replaceAll('"', '""')}"`;
      const safeCategory = `"${(t.category?.name || "Uncategorized").replaceAll('"', '""')}"`;
      lines.push(
        [new Date(t.date).toISOString().split("T")[0], t.type, safeDesc, safeCategory, t.amount.toFixed(2)].join(","),
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleSave = async (data) => {
    try {
      if (editingTx) {
        await api.put(`/finance/transactions/${editingTx._id}`, data);
      } else {
        await api.post("/finance/transactions", data);
      }
      setIsModalOpen(false);
      setEditingTx(null);
      onUpdate();
    } catch (err) {
      alert("Error saving transaction");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/finance/transactions/${id}`);
      onUpdate();
    } catch (err) {
      alert("Error deleting");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search size={16} className="absolute left-3 top-3 text-gray-500" />
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded pl-10 pr-4 py-2 text-sm focus:border-primary outline-none transition-colors"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm flex-1 md:flex-none outline-none"
          >
            <option value="All">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm flex-1 md:flex-none outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm flex-1 md:flex-none outline-none"
          >
            <option value="date_desc">Newest</option>
            <option value="date_asc">Oldest</option>
            <option value="amount_desc">Amount High-Low</option>
            <option value="amount_asc">Amount Low-High</option>
          </select>
          <StyledButton onClick={exportFilteredCsv} className="flex-1 md:flex-none text-sm">
            Export CSV
          </StyledButton>
          <StyledButton
            onClick={() => {
              setEditingTx(null);
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2"
          >
            <Plus size={16} /> <span className="md:inline">Add</span>
          </StyledButton>
        </div>
      </div>

      <Widget title="Visible Summary" className="border-gray-700/50" padding="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-text-secondary text-xs uppercase">Transactions</p>
            <p className="font-semibold text-white tabular-nums">{summary.count}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs uppercase">Income</p>
            <p className="font-semibold text-green-400 tabular-nums">+${summary.income.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs uppercase">Expenses</p>
            <p className="font-semibold text-red-400 tabular-nums">-${summary.expense.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs uppercase">Net</p>
            <p className={`font-semibold tabular-nums ${summary.net >= 0 ? "text-emerald-400" : "text-red-500"}`}>
              {summary.net >= 0 ? "+" : ""}${summary.net.toFixed(2)}
            </p>
          </div>
        </div>
      </Widget>

      {/* List - Desktop Table / Mobile Cards */}
      <div className="bg-surface border border-gray-700/50 rounded-lg overflow-hidden flex-grow flex flex-col relative min-h-[400px]">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-800/50 border-b border-gray-700 font-semibold text-text-secondary text-xs uppercase tracking-wider">
          <div className="col-span-2">Date</div>
          <div className="col-span-5">Description</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-center">Actions</div>
        </div>

        <div className="overflow-y-auto flex-1">
          {displayItems.map((t) => (
            <div key={t._id} className="group border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
              {/* Desktop View */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-3 items-center text-sm">
                <div className="col-span-2 text-text-secondary">{new Date(t.date).toLocaleDateString()}</div>
                <div className="col-span-5 font-medium text-white truncate">{t.description}</div>
                <div className="col-span-2">
                  <span
                    className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700"
                    style={{ color: t.category?.color || "#ccc" }}
                  >
                    {t.category?.name || "Uncategorized"}
                  </span>
                </div>
                <div
                  className={`col-span-2 text-right font-mono font-semibold ${t.type === "income" ? "text-green-400" : "text-text-main"}`}
                >
                  {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingTx(t);
                      setIsModalOpen(true);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(t._id)} className="text-gray-400 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden p-4 flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className={`w-1 h-10 rounded-full ${t.type === "income" ? "bg-green-500" : "bg-red-500"}`} />
                  <div className="overflow-hidden">
                    <p className="font-semibold text-white truncate max-w-[180px]">{t.description}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
                      <span>{new Date(t.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span style={{ color: t.category?.color }}>{t.category?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-mono font-bold ${t.type === "income" ? "text-green-400" : "text-white"}`}>
                    {t.type === "income" ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                  </p>
                  <button
                    onClick={() => {
                      setEditingTx(t);
                      setIsModalOpen(true);
                    }}
                    className="text-xs text-primary mt-1"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
          {displayItems.length === 0 && <div className="p-8 text-center text-gray-500">No transactions found.</div>}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-700 bg-gray-800/30 flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1 disabled:opacity-30 hover:text-white"
            >
              <ChevronLeft />
            </button>
            <span className="text-xs text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 disabled:opacity-30 hover:text-white"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        transaction={editingTx}
        categories={categories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
};

export default FinanceTransactions;
