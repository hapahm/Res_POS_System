const mongoose = require("mongoose");
const Order = require("../models/orderModel");

const connectDB = require("../config/database");

const fixTimezone = async () => {
    try {
        await connectDB();
        console.log("✅ Kết nối database thành công");

        // Lấy tất cả các đơn hàng
        const orders = await Order.find({});
        console.log(`📦 Tìm thấy ${orders.length} đơn hàng`);

        if (orders.length === 0) {
            console.log("⚠️  Không có đơn hàng nào để update");
            process.exit(0);
        }

        // Sửa từng đơn hàng bằng cách re-save với orderDate mới
        let updatedCount = 0;

        for (const order of orders) {
            // Tính lại orderDate: lấy thời điểm hiện tại thay vì giữ cái cũ sai
            // Hoặc nếu muốn giữ ngày cũ nhưng fix giờ:
            // const originalDate = new Date(order.orderDate);
            // const utcDate = new Date(originalDate.getTime() + (7 * 60 * 60 * 1000)); // Cộng 7h
            // order.orderDate = utcDate;

            // Cách đơn giản: xóa orderDate, mongoose sẽ set default = new Date()
            delete order.orderDate;

            await order.save();
            updatedCount++;
        }

        console.log(`✅ Đã cập nhật ${updatedCount} đơn hàng`);
        console.log("🎉 Migration complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi:", error.message);
        process.exit(1);
    }
};

fixTimezone();
