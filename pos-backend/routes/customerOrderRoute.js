const express = require("express");
const {
    addOrder,
    getCustomerOrders,
    getOrderById,
    cancelOrderItem
} = require("../controllers/orderController");
const { isVerifiedUser, isCustomerUser } = require("../middlewares/tokenVerification");

const router = express.Router();

router.route("/").post(addOrder).get(isVerifiedUser, isCustomerUser, getCustomerOrders);
router.route("/:id").get(isVerifiedUser, isCustomerUser, getOrderById);
router.route("/:id/items/cancel").post(isVerifiedUser, isCustomerUser, cancelOrderItem);

module.exports = router;
