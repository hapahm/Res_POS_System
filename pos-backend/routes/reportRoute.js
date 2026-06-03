const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { getMetrics, getDishStats, getCategoryStats } = require("../controllers/reportController");

router.get("/metrics", isVerifiedUser, getMetrics);
router.get("/dish-stats", isVerifiedUser, getDishStats);
router.get("/category-stats", isVerifiedUser, getCategoryStats);

module.exports = router;
