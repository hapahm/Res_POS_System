const express = require("express");
const { addOrder, getOrders, getOrderById, updateOrder, cancelOrderItem, getPaymentHistory } = require("../controllers/orderController");
const { isVerifiedUser, isAdminUser, isStaffUser } = require("../middlewares/tokenVerification");
const router = express.Router();


router.route("/").post(isVerifiedUser, isStaffUser, addOrder);
router.route("/").get(isVerifiedUser, isStaffUser, getOrders);
router.route("/payments/history").get(isVerifiedUser, isAdminUser, getPaymentHistory);
router.route("/:id/items/cancel").post(isVerifiedUser, isStaffUser, cancelOrderItem);
router.route("/:id").get(isVerifiedUser, isStaffUser, getOrderById);
router.route("/:id").put(isVerifiedUser, isStaffUser, updateOrder);

module.exports = router;