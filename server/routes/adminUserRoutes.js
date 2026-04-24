// server/routes/adminUserRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAllUsersAdmin,
  updateUserAdmin,
  resetUserPasswordAdmin,
  adminGetUserBadges,
  adminGrantBadge,
} = require("../controllers/userController");

// Middleware to ensure admin role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") return next();
  return res.status(403).json({ success: false, message: "Admin only" });
};

router.use(protect, requireAdmin);

router.get("/users", getAllUsersAdmin);
router.put("/users/:id", updateUserAdmin);
router.put("/users/:id/reset-password", resetUserPasswordAdmin);
router.get("/users/:id/badges", adminGetUserBadges);
router.post("/users/:id/badges", adminGrantBadge);

module.exports = router;
