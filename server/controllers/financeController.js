const axios = require("axios");
const FinancialCategory = require("../models/finance/FinancialCategory");
const FinancialActionLog = require("../models/finance/FinancialActionLog");
const User = require("../models/User");
const PLAID_ENV_BASE_URLS = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
};

const parseCsvEnv = (value, fallback = []) => {
  if (!value || !String(value).trim()) return fallback;
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const isPlaidEnabled = () => {
  const flag = String(process.env.PLAID_ENABLED ?? "true")
    .trim()
    .toLowerCase();
  return ["true", "1", "yes", "on"].includes(flag);
};

const isInvitedPlaidUser = (user) => {
  const invitedUsers = parseCsvEnv(process.env.PLAID_INVITED_USERS);
  if (invitedUsers.length === 0 || invitedUsers.includes("*")) return true;

  const normalized = invitedUsers.map((entry) => entry.toLowerCase());
  const userId = String(user?.id || user?._id || "").toLowerCase();
  const userEmail = String(user?.email || "").toLowerCase();
  return normalized.includes(userId) || normalized.includes(userEmail);
};

const getPlaidConfigValidationError = () => {
  const requiredKeys = ["PLAID_CLIENT_ID", "PLAID_SECRET", "PLAID_ENV"];
  const missing = requiredKeys.filter((key) => !process.env[key] || !String(process.env[key]).trim());
  if (missing.length > 0) {
    return `Missing required Plaid environment variables: ${missing.join(", ")}`;
  }

  const envKey = String(process.env.PLAID_ENV).trim().toLowerCase();
  if (!PLAID_ENV_BASE_URLS[envKey]) {
    return "Invalid PLAID_ENV. Expected one of: sandbox, development, production.";
  }

  return null;
};

const createPlaidRequestCorrelationId = () => `plaid-link-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const getPlaidHeaders = () => ({
  "Content-Type": "application/json",
  "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
  "PLAID-SECRET": process.env.PLAID_SECRET,
});

const sanitizePlaidError = (error) => ({
  status: error?.response?.status,
  code: error?.response?.data?.error_code,
  type: error?.response?.data?.error_type,
  message: error?.response?.data?.error_message || error?.message,
});

// --- Plaid: Create Link Token ---
exports.createPlaidLinkToken = async (req, res) => {
  const correlationId = createPlaidRequestCorrelationId();

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!isPlaidEnabled()) {
      return res.status(403).json({ success: false, message: "Plaid integration is disabled." });
    }

    if (!isInvitedPlaidUser(req.user)) {
      return res.status(403).json({ success: false, message: "Access not enabled for this account." });
    }

    const configError = getPlaidConfigValidationError();
    if (configError) {
      console.error(`[Plaid][${correlationId}] ${configError}`);
      return res.status(500).json({ success: false, message: "Plaid configuration is incomplete." });
    }

    const plaidEnv = String(process.env.PLAID_ENV).trim().toLowerCase();
    const products = parseCsvEnv(process.env.PLAID_PRODUCTS, ["transactions"]);
    const countryCodes = parseCsvEnv(process.env.PLAID_COUNTRY_CODES, ["US"]);

    const payload = {
      client_name: "The Abel Experience",
      language: "en",
      country_codes: countryCodes,
      products,
      user: {
        client_user_id: String(req.user.id),
      },
    };

    if (process.env.PLAID_REDIRECT_URI && String(process.env.PLAID_REDIRECT_URI).trim()) {
      payload.redirect_uri = String(process.env.PLAID_REDIRECT_URI).trim();
    }

    const plaidResponse = await axios.post(`${PLAID_ENV_BASE_URLS[plaidEnv]}/link/token/create`, payload, {
      headers: getPlaidHeaders(),
      timeout: 15000,
    });

    const { link_token: linkToken, expiration, request_id: requestId } = plaidResponse.data || {};
    if (!linkToken) {
      console.error(`[Plaid][${correlationId}] Missing link token in Plaid response.`);
      return res.status(502).json({ success: false, message: "Failed to create Plaid link token." });
    }

    return res.status(200).json({
      success: true,
      data: {
        linkToken,
        expiration,
        requestId: requestId || correlationId,
      },
    });
  } catch (error) {
    const sanitizedError = sanitizePlaidError(error);
    console.error(`[Plaid][${correlationId}] create-link-token failed:`, sanitizedError);
    return res.status(502).json({ success: false, message: "Failed to create Plaid link token." });
  }
};

// --- Plaid: Exchange Public Token ---
exports.exchangePlaidPublicToken = async (req, res) => {
  const correlationId = createPlaidRequestCorrelationId().replace("plaid-link", "plaid-exchange");

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!isPlaidEnabled()) {
      return res.status(403).json({ success: false, message: "Plaid integration is disabled." });
    }

    if (!isInvitedPlaidUser(req.user)) {
      return res.status(403).json({ success: false, message: "Access not enabled for this account." });
    }

    const configError = getPlaidConfigValidationError();
    if (configError) {
      console.error(`[Plaid][${correlationId}] ${configError}`);
      return res.status(500).json({ success: false, message: "Plaid configuration is incomplete." });
    }

    const publicToken = String(req.body?.publicToken || req.body?.public_token || "").trim();
    if (!publicToken) {
      return res.status(400).json({ success: false, message: "publicToken is required." });
    }

    const plaidEnv = String(process.env.PLAID_ENV).trim().toLowerCase();

    const plaidResponse = await axios.post(
      `${PLAID_ENV_BASE_URLS[plaidEnv]}/item/public_token/exchange`,
      { public_token: publicToken },
      {
        headers: getPlaidHeaders(),
        timeout: 15000,
      },
    );

    const { access_token: accessToken, item_id: itemId, request_id: requestId } = plaidResponse.data || {};
    if (!accessToken || !itemId) {
      console.error(`[Plaid][${correlationId}] Missing access token or item id in exchange response.`);
      return res.status(502).json({ success: false, message: "Failed to exchange Plaid public token." });
    }

    await User.findByIdAndUpdate(req.user.id, {
      plaidConnected: true,
      plaidItemId: itemId,
      plaidAccessToken: accessToken,
      plaidLastLinkedAt: new Date(),
    });

    await FinancialActionLog.create({
      user: req.user.id,
      action: "plaid_connect",
      details: {
        itemId,
        requestId: requestId || correlationId,
      },
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      data: {
        connected: true,
        itemId,
        requestId: requestId || correlationId,
      },
    });
  } catch (error) {
    const sanitizedError = sanitizePlaidError(error);
    console.error(`[Plaid][${correlationId}] exchange-public-token failed:`, sanitizedError);
    return res.status(502).json({ success: false, message: "Failed to exchange Plaid public token." });
  }
};

// --- Clear All Finances for User ---
exports.clearFinances = async (req, res) => {
  try {
    const userId = req.user.id;
    // Delete all user's transactions, bills, and budgets
    await FinancialTransaction.deleteMany({ user: userId });
    await RecurringBill.deleteMany({ user: userId });
    await Budget.deleteMany({ user: userId });
    // Log the clear action
    await FinancialActionLog.create({
      user: userId,
      action: "clear",
      details: {},
      timestamp: new Date(),
    });
    res.json({ success: true, message: "All finances cleared." });
  } catch (error) {
    console.error("Clear finances error:", error);
    res.status(500).json({ success: false, message: "Failed to clear finances.", error: error.message });
  }
};

// --- Get Financial Action Log ---
exports.getFinancialActionLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const logs = await FinancialActionLog.find({ user: userId }).sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get financial action log error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch log.", error: error.message });
  }
};
const FinancialTransaction = require("../models/finance/FinancialTransaction");
const RecurringBill = require("../models/finance/RecurringBill");
const Budget = require("../models/finance/Budget");
const Debt = require("../models/finance/Debt"); // Import the new Debt model
const FinancialGoal = require("../models/finance/FinancialGoal"); // Import the new FinancialGoal model

// Category Controllers
exports.getCategories = async (req, res) => {
  try {
    const categories = await FinancialCategory.find({ user: req.user.id }).sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.createCategory = async (req, res) => {
  try {
    const { name, color, parentCategory } = req.body;
    const category = await FinancialCategory.create({
      user: req.user.id,
      name,
      color,
      parentCategory: parentCategory || null,
    });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating category" });
  }
};
exports.updateCategory = async (req, res) => {
  try {
    let category = await FinancialCategory.findById(req.params.id);
    if (!category || category.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    category = await FinancialCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.deleteCategory = async (req, res) => {
  try {
    const category = await FinancialCategory.findById(req.params.id);
    if (!category || category.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    await category.deleteOne();
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Transaction Controllers
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await FinancialTransaction.find({ user: req.user.id })
      .populate("category", "name color")
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.createTransaction = async (req, res) => {
  try {
    const transaction = await FinancialTransaction.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating transaction" });
  }
};
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await FinancialTransaction.findById(req.params.id);
    if (!transaction || transaction.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    transaction = await FinancialTransaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id);
    if (!transaction || transaction.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    await transaction.deleteOne();
    res.status(200).json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
exports.getBills = async (req, res) => {
  try {
    const bills = await RecurringBill.find({ user: req.user.id })
      .populate("category", "name color")
      .sort({ dueDay: 1 });
    res.status(200).json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createBill = async (req, res) => {
  try {
    const bill = await RecurringBill.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: bill });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating bill" });
  }
};

exports.updateBill = async (req, res) => {
  try {
    let bill = await RecurringBill.findById(req.params.id);
    if (!bill || bill.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }
    bill = await RecurringBill.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const bill = await RecurringBill.findById(req.params.id);
    if (!bill || bill.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }
    await bill.deleteOne();
    res.status(200).json({ success: true, message: "Bill deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.toggleBillPaid = async (req, res) => {
  try {
    const { monthKey, isPaid } = req.body;
    const bill = await RecurringBill.findById(req.params.id);
    if (!bill || bill.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }
    if (isPaid) {
      bill.paidForMonths.addToSet(monthKey);
    } else {
      bill.paidForMonths.pull(monthKey);
    }
    await bill.save();
    res.status(200).json({ success: true, data: bill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Budget Controllers
exports.getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).populate("category", "name color");
    res.status(200).json({ success: true, data: budgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.upsertBudgets = async (req, res) => {
  const { budgets } = req.body; // Expect an array of budget objects
  const userId = req.user.id;

  if (!Array.isArray(budgets)) {
    return res.status(400).json({ success: false, message: "Invalid data format. Expected an array of budgets." });
  }

  try {
    const operations = budgets.map((b) => ({
      updateOne: {
        filter: { user: userId, category: b.category },
        update: { $set: { amount: b.amount } },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Budget.bulkWrite(operations);
    }

    res.status(200).json({ success: true, message: "Budgets updated successfully" });
  } catch (error) {
    console.error("Error upserting budgets:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- NEW Debt Controllers ---
exports.getDebts = async (req, res) => {
  try {
    const debts = await Debt.find({ user: req.user.id }).sort({ isPaidOff: 1, currentAmount: -1 });
    res.status(200).json({ success: true, data: debts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createDebt = async (req, res) => {
  try {
    const debt = await Debt.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: debt });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating debt entry", error: error.message });
  }
};

exports.updateDebt = async (req, res) => {
  try {
    let debt = await Debt.findById(req.params.id);
    if (!debt || debt.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Debt not found" });
    }
    debt = await Debt.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: debt });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteDebt = async (req, res) => {
  try {
    const debt = await Debt.findById(req.params.id);
    if (!debt || debt.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Debt not found" });
    }
    await debt.deleteOne();
    res.status(200).json({ success: true, message: "Debt deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- NEW Financial Goal Controllers ---
exports.getFinancialGoals = async (req, res) => {
  try {
    const goals = await FinancialGoal.find({ user: req.user.id }).sort({ isCompleted: 1, deadline: 1 });
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createFinancialGoal = async (req, res) => {
  try {
    const goal = await FinancialGoal.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(400).json({ success: false, message: "Error creating financial goal", error: error.message });
  }
};

exports.updateFinancialGoal = async (req, res) => {
  try {
    let goal = await FinancialGoal.findById(req.params.id);
    if (!goal || goal.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Financial goal not found" });
    }
    goal = await FinancialGoal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteFinancialGoal = async (req, res) => {
  try {
    const goal = await FinancialGoal.findById(req.params.id);
    if (!goal || goal.user.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: "Financial goal not found" });
    }
    await goal.deleteOne();
    res.status(200).json({ success: true, message: "Financial goal deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
