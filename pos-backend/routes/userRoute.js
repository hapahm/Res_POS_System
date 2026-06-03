const express = require("express");
const {
    register,
    login,
    getUserData,
    logout,
    getInternalAccounts,
    updateAccountStatus,
    updateAccountRole
} = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { isAdminUser } = require("../middlewares/tokenVerification");
const router = express.Router();


// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout)

router.route("/").get(isVerifiedUser, getUserData);
router.route("/admin/accounts").get(isVerifiedUser, isAdminUser, getInternalAccounts);
router.route("/admin/accounts/:userId/status").patch(isVerifiedUser, isAdminUser, updateAccountStatus);
router.route("/admin/accounts/:userId/role").patch(isVerifiedUser, isAdminUser, updateAccountRole);

module.exports = router;