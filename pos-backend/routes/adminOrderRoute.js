const express = require("express");
const {
    addOrder,
    getOrders,
    getOrderById,
    updateOrder,
    cancelOrderItem,
    getPaymentHistory,
    getPendingCustomerOrders,
    approveCustomerOrder,
    rejectCustomerOrder
} = require("../controllers/orderController");
const { isVerifiedUser, isStaffUser, isAdminUser } = require("../middlewares/tokenVerification");

const router = express.Router();

router.route("/").post(isVerifiedUser, isStaffUser, addOrder).get(isVerifiedUser, isStaffUser, getOrders);
router.route("/approvals").get(isVerifiedUser, isStaffUser, getPendingCustomerOrders);
router.route("/:id/approve").post(isVerifiedUser, isStaffUser, approveCustomerOrder);
router.route("/:id/reject").delete(isVerifiedUser, isStaffUser, rejectCustomerOrder);
router.route("/payments/history").get(isVerifiedUser, isAdminUser, getPaymentHistory);
router.route("/:id/items/cancel").post(isVerifiedUser, isStaffUser, cancelOrderItem);
router.route("/:id").get(isVerifiedUser, isStaffUser, getOrderById).put(isVerifiedUser, isStaffUser, updateOrder);

module.exports = router;
