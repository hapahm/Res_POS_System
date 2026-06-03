const express = require("express");
const router = express.Router();
const { getStaffConversations } = require("../controllers/conversationController");
const { isVerifiedUser, isStaffUser } = require("../middlewares/tokenVerification");

router.get("/staff", isVerifiedUser, isStaffUser, getStaffConversations);

module.exports = router;
