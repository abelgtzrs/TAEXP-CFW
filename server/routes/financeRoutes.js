const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBills,
  createBill,
  updateBill,
  deleteBill,
  toggleBillPaid,
  getBudgets,
  upsertBudgets,
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  getFinancialGoals,
  createFinancialGoal,
  updateFinancialGoal,
  deleteFinancialGoal,
  clearFinances,
  getFinancialActionLog,
  createPlaidLinkToken,
  exchangePlaidPublicToken,
} = require("../controllers/financeController");

// Clear all finances for the current user (protected)
router.post("/clear", protect, clearFinances);

// Get financial action log for the current user (protected)
router.get("/log", protect, getFinancialActionLog);

router.use(protect);

// Plaid Routes
router.post("/plaid/create-link-token", createPlaidLinkToken);
router.post("/plaid/exchange-public-token", exchangePlaidPublicToken);

// Category Routes
router.route("/categories").get(getCategories).post(createCategory);
router.route("/categories/:id").put(updateCategory).delete(deleteCategory);

// Transaction Routes
router.route("/transactions").get(getTransactions).post(createTransaction);
router.route("/transactions/:id").put(updateTransaction).delete(deleteTransaction);

// Bill Routes
router.route("/bills").get(getBills).post(createBill);
router.route("/bills/:id").put(updateBill).delete(deleteBill);
router.put("/bills/:id/toggle-paid", toggleBillPaid);

// Budget Routes
router.route("/budgets").get(getBudgets).post(upsertBudgets);

// --- Debt Routes ---
router.route("/debts").get(getDebts).post(createDebt);
router.route("/debts/:id").put(updateDebt).delete(deleteDebt);

// --- Financial Goal Routes ---
router.route("/goals").get(getFinancialGoals).post(createFinancialGoal);
router.route("/goals/:id").put(updateFinancialGoal).delete(deleteFinancialGoal);

module.exports = router;
