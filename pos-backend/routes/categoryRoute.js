const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const {
    addCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

router.route("/").post(isVerifiedUser, addCategory).get(getCategories);
router.route("/:id")
    .get(getCategoryById)
    .put(isVerifiedUser, updateCategory)
    .delete(isVerifiedUser, deleteCategory);

module.exports = router;
