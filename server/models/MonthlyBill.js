const mongoose = require("mongoose");

const MonthlyBillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    category: { type: String, default: "general" },
    notes: { type: String, default: "" },
    paidForMonths: { type: [String], default: [] },
    autoPay: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("MonthlyBill", MonthlyBillSchema);
