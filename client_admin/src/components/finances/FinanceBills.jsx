import React, { useState } from "react";
import Widget from "../ui/Widget";
import StyledButton from "../ui/StyledButton";
import { Plus, CheckSquare, Square, Trash2, Calendar } from "lucide-react";
import api from "../../services/api";

const FinanceBills = ({ bills, selectedMonth, onUpdate, categories }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [newBill, setNewBill] = useState({ name: "", amount: "", dueDay: "1", category: "" });

  const currentMonthKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;

  const handleTogglePaid = async (billId, isPaid) => {
    try {
      await api.put(`/finance/bills/${billId}/toggle-paid`, { monthKey: currentMonthKey, isPaid });
      onUpdate();
    } catch (err) {
      alert("Failed to update bill");
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      await api.post("/finance/bills", { ...newBill, amount: Number(newBill.amount), dueDay: Number(newBill.dueDay) });
      setIsAdding(false);
      setNewBill({ name: "", amount: "", dueDay: "1", category: "" });
      onUpdate();
    } catch (err) {
      alert("Failed to add bill");
    }
  };

  const deleteBill = async (id) => {
    if (!window.confirm("Stop tracking this recurring bill?")) return;
    try {
      await api.delete(`/finance/bills/${id}`);
      onUpdate();
    } catch (err) {}
  };

  const updateAllBillStatuses = async (isPaid) => {
    if (!bills.length) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        bills.map((bill) => api.put(`/finance/bills/${bill._id}/toggle-paid`, { monthKey: currentMonthKey, isPaid })),
      );
      onUpdate();
    } catch (err) {
      alert("Failed to apply bulk bill status update");
    } finally {
      setBulkLoading(false);
    }
  };

  const sortedBills = [...bills].sort((a, b) => a.dueDay - b.dueDay);
  const filteredBills = sortedBills.filter((bill) => {
    const isPaid = bill.paidForMonths?.includes(currentMonthKey);
    if (statusFilter === "paid") return isPaid;
    if (statusFilter === "unpaid") return !isPaid;
    return true;
  });

  const selectedMonthIsCurrent =
    selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear();
  const todayDay = new Date().getDate();

  const totalDue = bills.reduce((acc, b) => acc + b.amount, 0);
  const totalPaid = bills
    .filter((b) => b.paidForMonths?.includes(currentMonthKey))
    .reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
      {/* Bill List */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={20} className="text-primary" /> Monthly Checklist
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm outline-none"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <StyledButton
              onClick={() => updateAllBillStatuses(true)}
              disabled={bulkLoading}
              className="text-xs py-1.5 px-3"
            >
              Mark All Paid
            </StyledButton>
            <StyledButton
              onClick={() => updateAllBillStatuses(false)}
              disabled={bulkLoading}
              className="text-xs py-1.5 px-3 bg-gray-700 hover:bg-gray-600"
            >
              Reset Month
            </StyledButton>
            <StyledButton onClick={() => setIsAdding(true)} className="text-xs py-1.5 px-3">
              <Plus size={14} className="mr-1 inline" /> Track New Bill
            </StyledButton>
          </div>
        </div>

        {isAdding && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 mb-4 animate-in slide-in-from-top-2">
            <h3 className="font-bold text-sm mb-3">Add Recurring Bill</h3>
            <form onSubmit={handleAddBill} className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <input
                placeholder="Name"
                className="bg-gray-900 border border-gray-700 rounded p-2 text-sm col-span-2"
                value={newBill.name}
                onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                className="bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                required
              />
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Day (1-31)"
                className="bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                value={newBill.dueDay}
                onChange={(e) => setNewBill({ ...newBill, dueDay: e.target.value })}
                required
              />
              <select
                value={newBill.category}
                onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                className="bg-gray-900 border border-gray-700 rounded p-2 text-sm col-span-2 md:col-span-1"
                required
              >
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-black font-bold rounded p-2 text-sm col-span-2 md:col-span-5 mt-2 md:mt-0"
              >
                Save
              </button>
            </form>
          </div>
        )}

        <div className="bg-surface rounded-lg border border-gray-700/50 divide-y divide-gray-700/50">
          {filteredBills.map((bill) => {
            const isPaid = bill.paidForMonths?.includes(currentMonthKey);
            const dueSoon = selectedMonthIsCurrent && !isPaid && bill.dueDay >= todayDay && bill.dueDay <= todayDay + 3;
            return (
              <div
                key={bill._id}
                className={`p-4 flex items-center justify-between transition-colors ${isPaid ? "bg-green-900/10" : "hover:bg-gray-800/30"}`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleTogglePaid(bill._id, !isPaid)}
                    className="transition-transform active:scale-90 flex-shrink-0"
                  >
                    {isPaid ? (
                      <CheckSquare className="text-green-500" size={24} />
                    ) : (
                      <Square className="text-gray-500 hover:text-white" size={24} />
                    )}
                  </button>
                  <div>
                    <p className={`font-medium ${isPaid ? "text-gray-500 line-through" : "text-white"}`}>{bill.name}</p>
                    <p className="text-xs text-text-secondary">
                      Due day {bill.dueDay}
                      {dueSoon ? <span className="ml-2 text-amber-400 font-semibold">Due Soon</span> : null}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <p className={`font-mono font-bold ${isPaid ? "text-gray-500" : "text-white"}`}>
                    ${bill.amount.toFixed(2)}
                  </p>
                  <button onClick={() => deleteBill(bill._id)} className="text-gray-600 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredBills.length === 0 && <p className="p-6 text-center text-gray-500">No recurring bills tracked.</p>}
        </div>
      </div>

      {/* Summary Card */}
      <div>
        <Widget title="Overview">
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-text-secondary text-sm">Total Obligations</p>
              <p className="text-3xl font-bold text-white">${totalDue.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Bills Paid</span>
                <span className="font-mono text-white">
                  {bills.filter((b) => b.paidForMonths?.includes(currentMonthKey)).length}/{bills.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Paid So Far</span>
                <span className="font-mono text-white">${totalPaid.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ width: `${totalDue ? (totalPaid / totalDue) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Remaining</span>
                <span className="font-mono text-white">${(totalDue - totalPaid).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Widget>
      </div>
    </div>
  );
};

export default FinanceBills;
