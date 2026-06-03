const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const {
    createOrder,
    verifyPayment,
    webHookVerification,
    markTablePaid,
    createVnpayPayment,
    vnpayIpn,
    vnpayReturn,
} = require("../controllers/paymentController");

router.route("/create-order").post(isVerifiedUser, createOrder);
router.route("/verify-payment").post(isVerifiedUser, verifyPayment);
router.route("/mark-paid").post(isVerifiedUser, markTablePaid);
router.route("/webhook-verification").post(webHookVerification);
router.route("/vnpay/create").post(isVerifiedUser, createVnpayPayment);
router.route("/vnpay/ipn").get(vnpayIpn);
router.route("/vnpay/return").get(vnpayReturn);


module.exports = router;