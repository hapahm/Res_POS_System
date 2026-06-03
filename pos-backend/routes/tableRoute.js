const express = require("express");
const { addTable, getTables, updateTable, getTableOrders, deleteTable } = require("../controllers/tableController");
const router = express.Router();
const { isVerifiedUser, isStaffUser } = require("../middlewares/tokenVerification")

router.route("/").post(isVerifiedUser, isStaffUser, addTable);
router.route("/").get(isVerifiedUser, isStaffUser, getTables);
router.route("/:id/orders").get(isVerifiedUser, isStaffUser, getTableOrders);
router.route("/:id").put(isVerifiedUser, isStaffUser, updateTable).delete(isVerifiedUser, isStaffUser, deleteTable);

module.exports = router;