const express = require("express");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const {
    addDish,
    getDishes,
    getDishById,
    updateDish,
    deleteDish
} = require("../controllers/dishController");

router.route("/").post(isVerifiedUser, addDish).get(getDishes);
router.route("/:id")
    .get(getDishById)
    .put(isVerifiedUser, updateDish)
    .delete(isVerifiedUser, deleteDish);

module.exports = router;
