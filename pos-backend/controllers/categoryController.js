const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Category = require("../models/categoryModel");
const Dish = require("../models/dishModel");
const Order = require("../models/orderModel");

const OPEN_ORDER_STATUSES_COMPAT = ["OPEN"];

const hasUnpaidOrdersForDishes = async (dishIds = [], dishNames = []) => {
    if (!dishIds.length && !dishNames.length) return false;

    return Order.exists({
        $and: [
            {
                orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
            },
            {
                $or: [
                    dishIds.length
                        ? { items: { $elemMatch: { cancelled_at: null, dishId: { $in: dishIds } } } }
                        : null,
                    dishNames.length
                        ? { items: { $elemMatch: { cancelled_at: null, name: { $in: dishNames } } } }
                        : null
                ].filter(Boolean)
            }
        ]
    });
};

const addCategory = async (req, res, next) => {
    try {
        const { name, description, isActive } = req.body;

        if (!name) {
            return next(createHttpError(400, "Vui lòng nhập tên danh mục!"));
        }

        const existing = await Category.findOne({ name: name.trim() });
        if (existing) {
            return next(createHttpError(400, "Danh mục đã tồn tại!"));
        }

        const category = new Category({
            name: name.trim(),
            description: description || "",
            isActive: typeof isActive === "boolean" ? isActive : true
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: "Thêm danh mục thành công!",
            data: category
        });
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "ID không hợp lệ!"));
        }

        const category = await Category.findById(id);
        if (!category) {
            return next(createHttpError(404, "Không tìm thấy danh mục!"));
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "ID không hợp lệ!"));
        }

        const category = await Category.findById(id);
        if (!category) {
            return next(createHttpError(404, "Không tìm thấy danh mục!"));
        }

        const dishes = await Dish.find({ category: id }).select("_id name");
        const dishIds = dishes.map((d) => d._id);
        const dishNames = dishes.map((d) => d.name);

        const hasUnpaid = await hasUnpaidOrdersForDishes(dishIds, dishNames);
        if (hasUnpaid) {
            return next(createHttpError(409, "Không thể sửa danh mục đang được đặt."));
        }

        if (name && name.trim() !== category.name) {
            const exists = await Category.findOne({ name: name.trim() });
            if (exists) {
                return next(createHttpError(400, "Tên danh mục đã tồn tại!"));
            }
            category.name = name.trim();
        }

        if (typeof description !== "undefined") {
            category.description = description;
        }

        if (typeof isActive === "boolean") {
            category.isActive = isActive;
        }

        await category.save();

        res.status(200).json({
            success: true,
            message: "Cập nhật danh mục thành công!",
            data: category
        });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "ID không hợp lệ!"));
        }

        const category = await Category.findById(id);
        if (!category) {
            return next(createHttpError(404, "Không tìm thấy danh mục!"));
        }

        const dishes = await Dish.find({ category: id }).select("_id name");
        const dishIds = dishes.map((d) => d._id);
        const dishNames = dishes.map((d) => d.name);

        const hasUnpaid = await hasUnpaidOrdersForDishes(dishIds, dishNames);
        if (hasUnpaid) {
            return next(createHttpError(409, "Không thể xóa danh mục đang được đặt."));
        }

        if (dishes.length > 0) {
            return next(createHttpError(400, "Danh mục đang có món, không thể xóa."));
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Xóa danh mục thành công!" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
