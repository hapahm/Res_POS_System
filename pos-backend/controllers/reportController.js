const Order = require("../models/orderModel");
const Dish = require("../models/dishModel");
const Category = require("../models/categoryModel");
const Table = require("../models/tableModel");

const OPEN_ORDER_STATUSES_COMPAT = ["OPEN"];
const PAID_PAYMENT_STATUSES_COMPAT = ["PAID", "paid"];

const calculateChangePercent = (todayValue = 0, yesterdayValue = 0) => {
    if (!Number.isFinite(todayValue) || !Number.isFinite(yesterdayValue)) return 0;
    if (yesterdayValue === 0) {
        return todayValue > 0 ? 100 : 0;
    }

    return ((todayValue - yesterdayValue) / yesterdayValue) * 100;
};

const getMetrics = async (req, res, next) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        // Tổng doanh thu (từ đơn đã thanh toán)
        const totalRevenueAgg = await Order.aggregate([
            {
                $match: {
                    $or: [
                        { paymentStatus: { $in: PAID_PAYMENT_STATUSES_COMPAT } },
                        { paid_at: { $ne: null } }
                    ]
                }
            },
            { $group: { _id: null, total: { $sum: "$bills.totalWithTax" } } }
        ]);
        const totalRevenue = totalRevenueAgg[0]?.total || 0;

        const [
            totalOrders,
            totalCategories,
            totalDishes,
            totalTables,
            activeTableOrders,
            distinctCustomers,
            todayRevenueAgg,
            yesterdayRevenueAgg,
            todayActiveOrders,
            yesterdayActiveOrders
        ] = await Promise.all([
            Order.countDocuments({}),
            Category.countDocuments({}),
            Dish.countDocuments({}),
            Table.countDocuments({}),
            Order.countDocuments({
                orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
            }),
            Order.distinct("customerDetails.phone"),
            Order.aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    { paymentStatus: { $in: PAID_PAYMENT_STATUSES_COMPAT } },
                                    { paid_at: { $ne: null } }
                                ]
                            },
                            {
                                $or: [
                                    {
                                        paid_at: {
                                            $gte: startOfToday,
                                            $lt: startOfTomorrow
                                        }
                                    },
                                    {
                                        paid_at: null,
                                        orderDate: {
                                            $gte: startOfToday,
                                            $lt: startOfTomorrow
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: "$bills.totalWithTax" } } }
            ]),
            Order.aggregate([
                {
                    $match: {
                        $and: [
                            {
                                $or: [
                                    { paymentStatus: { $in: PAID_PAYMENT_STATUSES_COMPAT } },
                                    { paid_at: { $ne: null } }
                                ]
                            },
                            {
                                $or: [
                                    {
                                        paid_at: {
                                            $gte: startOfYesterday,
                                            $lt: startOfToday
                                        }
                                    },
                                    {
                                        paid_at: null,
                                        orderDate: {
                                            $gte: startOfYesterday,
                                            $lt: startOfToday
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: "$bills.totalWithTax" } } }
            ]),
            Order.countDocuments({
                orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT },
                orderDate: {
                    $gte: startOfToday,
                    $lt: startOfTomorrow
                }
            }),
            Order.countDocuments({
                orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT },
                orderDate: {
                    $gte: startOfYesterday,
                    $lt: startOfToday
                }
            })
        ]);

        const todayRevenue = Number(todayRevenueAgg?.[0]?.total || 0);
        const yesterdayRevenue = Number(yesterdayRevenueAgg?.[0]?.total || 0);
        const revenueChangePercent = calculateChangePercent(todayRevenue, yesterdayRevenue);
        const activeOrdersChangePercent = calculateChangePercent(
            Number(todayActiveOrders || 0),
            Number(yesterdayActiveOrders || 0)
        );

        // Tổng số khách (unique customers)
        const totalCustomers = distinctCustomers.length;

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalCustomers,
                totalOrders,
                totalCategories,
                totalDishes,
                activeTableOrders,
                totalTables,
                todayRevenue,
                yesterdayRevenue,
                revenueChangePercent,
                todayActiveOrders,
                yesterdayActiveOrders,
                activeOrdersChangePercent
            }
        });
    } catch (error) {
        next(error);
    }
};

const getDishStats = async (req, res, next) => {
    try {
        const dishStats = await Order.aggregate([
            { $unwind: "$items" },
            { $match: { "items.cancelled_at": null } },
            {
                $group: {
                    _id: "$items.dishId",
                    dishName: { $first: "$items.name" },
                    totalOrders: { $sum: 1 },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: {
                        $sum: { $multiply: ["$items.pricePerQuantity", "$items.quantity"] }
                    }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: dishStats
        });
    } catch (error) {
        next(error);
    }
};

const getCategoryStats = async (req, res, next) => {
    try {
        const categoryStats = await Order.aggregate([
            { $unwind: "$items" },
            { $match: { "items.cancelled_at": null } },
            {
                $lookup: {
                    from: "dishes",
                    localField: "items.dishId",
                    foreignField: "_id",
                    as: "dish"
                }
            },
            { $unwind: { path: "$dish", preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: "categories",
                    localField: "dish.category",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$dish.category",
                    categoryName: { $first: "$category.name" },
                    totalOrders: { $sum: 1 },
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: {
                        $sum: { $multiply: ["$items.pricePerQuantity", "$items.quantity"] }
                    }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: categoryStats
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMetrics,
    getDishStats,
    getCategoryStats
};
