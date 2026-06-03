const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Dish = require("../models/dishModel");
const Category = require("../models/categoryModel");
const Order = require("../models/orderModel");

const OPEN_ORDER_STATUSES_COMPAT = ["OPEN"];

const buildRequestOrigin = (req) => `${req.protocol}://${req.get("host")}`;

const normalizeDishImageUrl = (req, imageUrl = "") => {
    const origin = buildRequestOrigin(req);
    const normalizedInput = `${imageUrl || ""}`.trim();

    if (!normalizedInput) return "";

    if (normalizedInput.startsWith("/")) {
        return `${origin}${normalizedInput}`;
    }

    try {
        const parsed = new URL(normalizedInput);
        if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
            return `${origin}${parsed.pathname}${parsed.search || ""}`;
        }
        return normalizedInput;
    } catch (error) {
        return normalizedInput;
    }
};

const normalizeDishPayload = (req, dishDoc) => {
    const normalizedDish = dishDoc.toObject();
    normalizedDish.imageUrl = normalizeDishImageUrl(req, normalizedDish.imageUrl);
    return normalizedDish;
};

const hasUnpaidOrdersForDish = async (dishId, dishName) => {
    if (!dishId && !dishName) return false;

    return Order.exists({
        $and: [
            {
                orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
            },
            {
                $or: [
                    dishId
                        ? { items: { $elemMatch: { cancelled_at: null, dishId } } }
                        : null,
                    dishName
                        ? { items: { $elemMatch: { cancelled_at: null, name: dishName } } }
                        : null
                ].filter(Boolean)
            }
        ]
    });
};

const addDish = async (req, res, next) => {
    try {
        const { name, price, categoryId, description, imageUrl, isAvailable } = req.body;

        if (!name || typeof price === "undefined" || !categoryId || !imageUrl) {
            return next(createHttpError(400, "Vui lòng nhập đầy đủ tên, giá, danh mục và hình ảnh!"));
        }

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return next(createHttpError(404, "Danh mục không hợp lệ!"));
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return next(createHttpError(404, "Không tìm thấy danh mục!"));
        }

        const existing = await Dish.findOne({ name: name.trim(), category: categoryId });
        if (existing) {
            return next(createHttpError(400, "Món đã tồn tại trong danh mục này!"));
        }

        const dish = new Dish({
            name: name.trim(),
            price,
            category: categoryId,
            description: description || "",
            imageUrl: imageUrl,
            isAvailable: typeof isAvailable === "boolean" ? isAvailable : true
        });

        await dish.save();

        res.status(201).json({ success: true, message: "Thêm món thành công!", data: dish });
    } catch (error) {
        next(error);
    }
};

const getDishes = async (req, res, next) => {
    try {
        const { categoryId } = req.query;

        const filter = {};
        if (categoryId) {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return next(createHttpError(404, "Danh mục không hợp lệ!"));
            }
            filter.category = categoryId;
        }

        const dishes = await Dish.find(filter).populate("category", "name").sort({ name: 1 });
        const data = dishes.map((dish) => normalizeDishPayload(req, dish));
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const getDishById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "ID không hợp lệ!"));
        }

        const dish = await Dish.findById(id).populate("category", "name");
        if (!dish) {
            return next(createHttpError(404, "Không tìm thấy món!"));
        }

        res.status(200).json({ success: true, data: normalizeDishPayload(req, dish) });
    } catch (error) {
        next(error);
    }
};

const updateDish = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, price, categoryId, description, imageUrl, isAvailable } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "ID không hợp lệ!"));
        }

        const dish = await Dish.findById(id);
        if (!dish) {
            return next(createHttpError(404, "Không tìm thấy món!"));
        }

        const hasUnpaid = await hasUnpaidOrdersForDish(dish._id, dish.name);
        if (hasUnpaid) {
            return next(createHttpError(409, "Không thể sửa món đang được đặt."));
        }

        if (typeof categoryId !== "undefined") {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return next(createHttpError(404, "Danh mục không hợp lệ!"));
            }

            const category = await Category.findById(categoryId);
            if (!category) {
                return next(createHttpError(404, "Không tìm thấy danh mục!"));
            }
            dish.category = categoryId;
        }

        if (typeof name !== "undefined") dish.name = name.trim();
        if (typeof price !== "undefined") dish.price = price;
        if (typeof description !== "undefined") dish.description = description;
        if (typeof imageUrl !== "undefined") dish.imageUrl = imageUrl;
        if (typeof isAvailable === "boolean") dish.isAvailable = isAvailable;

        await dish.save();

        res.status(200).json({ success: true, message: "Cập nhật món thành công!", data: dish });
    } catch (error) {
        next(error);
    }
};

const deleteDish = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "ID không hợp lệ!"));
        }

        const dish = await Dish.findById(id);
        if (!dish) {
            return next(createHttpError(404, "Không tìm thấy món!"));
        }

        const hasUnpaid = await hasUnpaidOrdersForDish(dish._id, dish.name);
        if (hasUnpaid) {
            return next(createHttpError(409, "Không thể xóa món đang được đặt."));
        }

        await Dish.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Xóa món thành công!" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addDish,
    getDishes,
    getDishById,
    updateDish,
    deleteDish
};
