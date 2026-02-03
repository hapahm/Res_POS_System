const express = require("express");
const { updateKitchenStatus } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

/**
 * PUT /api/kitchen/orders/:id/status
 * Update kitchen status of an order
 * Body: { kitchenStatus: 'pending' | 'preparing' | 'completed' | 'cancelled' }
 */
router.route("/orders/:id/status").put(isVerifiedUser, updateKitchenStatus);

module.exports = router;
