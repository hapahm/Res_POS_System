const path = require("path");
const fs = require("fs");
const createHttpError = require("http-errors");

const uploadDishImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(createHttpError(400, "Vui lòng chọn ảnh để upload."));
        }

        const filePath = `/uploads/${req.file.filename}`;
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const absoluteUrl = `${baseUrl}${filePath}`;

        res.status(201).json({
            success: true,
            message: "Upload ảnh thành công!",
            data: { url: absoluteUrl }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadDishImage };
