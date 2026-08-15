const express = require("express");
const router = express.Router();
const { buyAccountUpgrade, getAccountUpgrades, pullFromGacha } = require("../controllers/shopController.js");
const { protect } = require("../middleware/authMiddleware");

router.get("/account-upgrades", protect, getAccountUpgrades);
router.post("/account-upgrades/:upgradeKey/buy", protect, buyAccountUpgrade);
router.post("/pull/:category", protect, pullFromGacha);

module.exports = router;
