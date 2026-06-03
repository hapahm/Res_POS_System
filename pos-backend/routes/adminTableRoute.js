const express = require("express");
const {
    addTable,
    getTables,
    updateTable,
    getTableOrders,
    deleteTable
} = require("../controllers/tableController");
const { isVerifiedUser, isStaffUser } = require("../middlewares/tokenVerification");

const router = express.Router();

router.route("/").post(isVerifiedUser, isStaffUser, addTable).get(isVerifiedUser, isStaffUser, getTables);
router.route("/:id/orders").get(isVerifiedUser, isStaffUser, getTableOrders);
router.route("/:id").put(isVerifiedUser, isStaffUser, updateTable).delete(isVerifiedUser, isStaffUser, deleteTable);

module.exports = router;
