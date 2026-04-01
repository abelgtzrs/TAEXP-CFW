const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/calendarController");

router.use(protect);

// Events
router.get("/events", ctrl.listEvents);
router.post("/events", ctrl.createEvent);
router.put("/events/:id", ctrl.updateEvent);
router.delete("/events/:id", ctrl.deleteEvent);

// Bills
router.get("/bills", ctrl.listBills);
router.post("/bills", ctrl.createBill);
router.put("/bills/:id", ctrl.updateBill);
router.delete("/bills/:id", ctrl.deleteBill);
router.put("/bills/:id/toggle-paid", ctrl.toggleBillPaid);

// Yearly (birthday/anniversary)
router.get("/yearly", ctrl.listYearly);
router.post("/yearly", ctrl.createYearly);
router.put("/yearly/:id", ctrl.updateYearly);
router.delete("/yearly/:id", ctrl.deleteYearly);

// Monthly schedule feed (for widget)
router.get("/monthly-schedule", ctrl.getMonthlySchedule);

module.exports = router;
