const express = require("express");
const {
    getTables,
    getTableOrders,
    customerReserveTable,
    customerCheckInTable,
    customerReleaseTable
} = require("../controllers/tableController");
const { isVerifiedUser, isCustomerUser } = require("../middlewares/tokenVerification");

const router = express.Router();

router.route("/").get(isVerifiedUser, isCustomerUser, getTables);
router.route("/:id/orders").get(isVerifiedUser, isCustomerUser, getTableOrders);
router.route("/:id/book").post(isVerifiedUser, isCustomerUser, customerReserveTable);
router.route("/:id/check-in").post(isVerifiedUser, isCustomerUser, customerCheckInTable);
router.route("/:id/release").post(isVerifiedUser, isCustomerUser, customerReleaseTable);

module.exports = router;
