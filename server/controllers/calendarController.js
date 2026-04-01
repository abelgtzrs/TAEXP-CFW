const CalendarEvent = require("../models/CalendarEvent");
const MonthlyBill = require("../models/MonthlyBill");
const YearlyEvent = require("../models/YearlyEvent");

// Events CRUD
exports.listEvents = async (req, res) => {
  try {
    const items = await CalendarEvent.find({ user: req.user._id }).sort({ date: 1 });
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to load events" });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const payload = { ...req.body, user: req.user._id };
    const doc = await CalendarEvent.create(payload);
    res.status(201).json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to create event" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CalendarEvent.findOneAndUpdate({ _id: id, user: req.user._id }, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to update event" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await CalendarEvent.findOneAndDelete({ _id: id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to delete event" });
  }
};

// Monthly Bills CRUD
exports.listBills = async (req, res) => {
  try {
    const items = await MonthlyBill.find({ user: req.user._id, isActive: true }).sort({ dueDay: 1 });
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to load bills" });
  }
};

exports.createBill = async (req, res) => {
  try {
    const payload = { ...req.body, user: req.user._id };
    const doc = await MonthlyBill.create(payload);
    res.status(201).json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to create bill" });
  }
};

exports.updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MonthlyBill.findOneAndUpdate({ _id: id, user: req.user._id }, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Bill not found" });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to update bill" });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await MonthlyBill.findOneAndDelete({ _id: id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Bill not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to delete bill" });
  }
};

exports.toggleBillPaid = async (req, res) => {
  try {
    const { monthKey, isPaid } = req.body;
    if (!monthKey || typeof isPaid !== "boolean") {
      return res.status(400).json({ success: false, message: "monthKey and isPaid are required" });
    }

    const doc = await MonthlyBill.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Bill not found" });

    if (isPaid) doc.paidForMonths.addToSet(monthKey);
    else doc.paidForMonths.pull(monthKey);

    await doc.save();
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to toggle bill paid status" });
  }
};

// Combined feed for calendar widget
exports.getMonthlySchedule = async (req, res) => {
  try {
    const { year, month } = req.query; // month: 1-12
    const y = parseInt(year, 10);
    const m = parseInt(month, 10) - 1;
    if (isNaN(y) || isNaN(m)) return res.status(400).json({ success: false, message: "Invalid year or month" });

    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);

    const [events, bills, yearly] = await Promise.all([
      CalendarEvent.find({ user: req.user._id, date: { $gte: start, $lt: end } }).lean(),
      MonthlyBill.find({ user: req.user._id, isActive: true }).lean(),
      YearlyEvent.find({ user: req.user._id, isActive: true, month: m + 1 }).lean(),
    ]);

    // Map bills to concrete dates within the month (use dueDay or last day if overflow)
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const billItems = bills.map((b) => ({
      type: "bill",
      id: b._id,
      title: b.name,
      amount: b.amount,
      date: new Date(y, m, Math.min(Math.max(1, b.dueDay), daysInMonth)),
      category: b.category,
      color: "#f59e0b", // amber tint for bills
    }));

    const eventItems = events.map((e) => ({
      type: "event",
      id: e._id,
      title: e.title,
      description: e.description,
      date: e.date,
      allDay: e.allDay,
      category: e.category,
      color: e.color || "#4f46e5",
    }));

    const yearlyItems = yearly
      .map((y) => ({
        type: "yearly",
        id: y._id,
        title: y.title,
        date: new Date(year, m, Math.min(Math.max(1, y.day), daysInMonth)),
        category: y.category,
        color: y.color || "#10b981",
      }))
      .filter(Boolean);

    const items = [...billItems, ...eventItems, ...yearlyItems].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, items });
  } catch (e) {
    console.error("getMonthlySchedule error:", e);
    res.status(500).json({ success: false, message: "Failed to load monthly schedule" });
  }
};

// Yearly Events CRUD
exports.listYearly = async (req, res) => {
  try {
    const items = await YearlyEvent.find({ user: req.user._id, isActive: true }).sort({ month: 1, day: 1 });
    res.json({ success: true, items });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to load yearly events" });
  }
};

exports.createYearly = async (req, res) => {
  try {
    const payload = { ...req.body, user: req.user._id };
    const doc = await YearlyEvent.create(payload);
    res.status(201).json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to create yearly event" });
  }
};

exports.updateYearly = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await YearlyEvent.findOneAndUpdate({ _id: id, user: req.user._id }, req.body, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: "Yearly event not found" });
    res.json({ success: true, item: doc });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to update yearly event" });
  }
};

exports.deleteYearly = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await YearlyEvent.findOneAndDelete({ _id: id, user: req.user._id });
    if (!doc) return res.status(404).json({ success: false, message: "Yearly event not found" });
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message || "Failed to delete yearly event" });
  }
};
