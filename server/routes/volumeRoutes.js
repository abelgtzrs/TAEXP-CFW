// server/routes/volumeRoutes.js

const express = require("express");
const router = express.Router();

// Import controller functions.
const {
  createVolumeFromRaw,
  getAllVolumesForAdmin,
  getVolumeSummaryForAdmin,
  getVolumeByIdForAdmin,
  updateVolumeFromRaw,
  deleteVolume,
} = require("../controllers/volumeController"); // We will create this next.

// Import middleware for security.
const { protect, authorize } = require("../middleware/authMiddleware");

// Apply 'protect' and 'authorize('admin')' to all routes in this file.
// This ensures only logged-in admins can access these endpoints.
router.use(protect, authorize("admin"));

// Route to get all volumes (for the admin dashboard) and create a new one.
router.route("/").get(getAllVolumesForAdmin).post(createVolumeFromRaw);

// Must come before /:id so "summary" isn't read as an id.
router.get("/summary", getVolumeSummaryForAdmin);

// Routes for managing a specific volume by its ID.
router.route("/:id").get(getVolumeByIdForAdmin).put(updateVolumeFromRaw).delete(deleteVolume);

module.exports = router;
