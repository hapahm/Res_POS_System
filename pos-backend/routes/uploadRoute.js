const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const { uploadDishImage } = require("../controllers/uploadController");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    }
});

const fileFilter = (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Chỉ cho phép upload ảnh!"));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/dish-image", isVerifiedUser, upload.single("image"), uploadDishImage);

module.exports = router;
