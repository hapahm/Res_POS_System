/**
 * KITCHEN DISPLAY SYSTEM (KDS) SOCKET HANDLER
 * Xử lý toàn bộ logic realtime KDS qua Socket.IO
 * 
 * Luồng hoạt động:
 * 1. Kitchen staff kết nối → emit "kitchen_connect"
 * 2. Admin tạo đơn hàng → server emit "new_order" đến kitchen room
 * 3. Kitchen staff cập nhật trạng thái → emit "update_kitchen_status"
 * 4. Server emit "kitchen_status_updated" đến POS admin dashboard
 * 5. Admin hủy đơn → server emit "order_cancelled" đến kitchen
 */

const Order = require("../models/orderModel");
const { default: mongoose } = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const PENDING_APPROVAL_STATUS = "PENDING_APPROVAL";

/**
 * Biến global lưu trạng thái online của kitchen staff
 * Format: { userId: { socketId, connectedAt } }
 */
const kitchenStaffOnline = {};

/**
 * MAIN KITCHEN SOCKET HANDLER
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const kitchenSocketHandler = (io) => {
    // Lắng nghe sự kiện kết nối mới
    io.on("connection", async (socket) => {
        console.log(`🍳 Kitchen client mới kết nối: ${socket.id}`);
        console.log(`📝 Socket handshake data:`, socket.handshake?.query);

        // ==========================================
        // EVENT 1: KITCHEN CONNECT (Authentication)
        // ==========================================
        /**
         * Kitchen staff emit event này khi kết nối
         * Data: { userId, staffName }
         */
        socket.on("kitchen_connect", async (userData) => {
            try {
                const { userId, staffName } = userData;

                if (!userId) {
                    console.error("❌ Kitchen connect: Missing userId");
                    socket.emit("error", { message: "Invalid credentials" });
                    return;
                }

                // Lưu thông tin staff
                kitchenStaffOnline[userId] = {
                    socketId: socket.id,
                    staffName: staffName || "Kitchen Staff",
                    connectedAt: new Date()
                };

                // Join vào kitchen room
                socket.join("kitchen");

                console.log(`✅ Kitchen staff ${userId} connected`);
                console.log(`👥 Active kitchen staff: ${Object.keys(kitchenStaffOnline).length}`);

                // Emit thông báo kết nối thành công
                socket.emit("kitchen_connected", {
                    success: true,
                    staffName: staffName || "Kitchen Staff",
                    connectedAt: new Date()
                });

                // Broadcast cho tất cả kitchen staff biết có staff mới
                io.to("kitchen").emit("staff_status_changed", {
                    event: "staff_online",
                    staffCount: Object.keys(kitchenStaffOnline).length,
                    timestamp: new Date()
                });

            } catch (error) {
                console.error("❌ Error in kitchen_connect:", error.message);
                socket.emit("error", { message: "Connection failed" });
            }
        });

        // ==========================================
        // EVENT 2: UPDATE KITCHEN STATUS (Kitchen updates order)
        // ==========================================
        /**
         * Kitchen staff emit event này để cập nhật trạng thái đơn hàng
         * Data: { orderId, kitchenStatus: 'preparing' | 'completed' }
         */
        socket.on("update_kitchen_status", async (data) => {
            try {
                const { orderId, kitchenStatus } = data;

                // Validate input
                if (!orderId || !kitchenStatus) {
                    socket.emit("error", {
                        message: "Missing orderId or kitchenStatus"
                    });
                    return;
                }

                if (!isValidObjectId(orderId)) {
                    socket.emit("error", {
                        message: "Invalid orderId format"
                    });
                    return;
                }

                // Validate enum
                const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];
                if (!validStatuses.includes(kitchenStatus)) {
                    socket.emit("error", {
                        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                    });
                    return;
                }

                // Update order in database
                const order = await Order.findByIdAndUpdate(
                    orderId,
                    { kitchenStatus },
                    { new: true }
                ).populate("table");

                if (!order) {
                    socket.emit("error", {
                        message: `Order not found: ${orderId}`
                    });
                    return;
                }

                console.log(`✅ Order ${orderId} status updated to: ${kitchenStatus}`);

                // Emit to kitchen room - confirm update
                socket.emit("status_updated", {
                    orderId: order._id,
                    kitchenStatus: order.kitchenStatus,
                    updatedAt: new Date()
                });

                // Broadcast to POS admin dashboard
                io.emit("kitchen_status_updated", {
                    orderId: order._id,
                    kitchenStatus: order.kitchenStatus,
                    customerName: order.customerDetails?.name,
                    tableNumber: order.table?.tableNo,
                    itemsCount: order.items?.length,
                    updatedAt: new Date(),
                    statusEmoji: {
                        'pending': '⏳',
                        'preparing': '👨‍🍳',
                        'completed': '✅',
                        'cancelled': '❌'
                    }[kitchenStatus]
                });

                // Log for monitoring
                console.log(`📤 Emitted kitchen_status_updated to POS: ${orderId} → ${kitchenStatus}`);

            } catch (error) {
                console.error("❌ Error updating kitchen status:", error.message);
                socket.emit("error", {
                    message: "Failed to update status"
                });
            }
        });

        // ==========================================
        // EVENT 3: GET ACTIVE KITCHEN ORDERS
        // ==========================================
        /**
         * Kitchen emit event này để lấy danh sách đơn hàng đang chờ
         * Data: { filter?: 'pending' | 'preparing' | 'all' }
         */
        socket.on("get_kitchen_orders", async (data) => {
            try {
                const { filter = 'all' } = data || {};

                let query = {
                    orderStatus: { $ne: PENDING_APPROVAL_STATUS }
                };

                // Filter by kitchen status
                if (filter !== 'all') {
                    query.kitchenStatus = filter;
                }

                // Fetch orders
                const orders = await Order.find(query)
                    .populate("table")
                    .sort({ createdAt: -1 })
                    .lean();

                // Format response (remove sensitive price info)
                const formattedOrders = orders.map(order => ({
                    _id: order._id,
                    customerName: order.customerDetails?.name,
                    tableNumber: order.table?.tableNo,
                    tableId: order.table?._id,
                    items: order.items.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        notes: item.notes
                    })),
                    kitchenStatus: order.kitchenStatus,
                    orderTime: order.createdAt,
                    notes: order.notes,
                    urgency: calculateUrgency(order.createdAt)
                }));

                socket.emit("kitchen_orders_list", {
                    orders: formattedOrders,
                    count: formattedOrders.length,
                    filter,
                    timestamp: new Date()
                });

                console.log(`📋 Sent ${formattedOrders.length} kitchen orders to kitchen staff`);

            } catch (error) {
                console.error("❌ Error fetching kitchen orders:", error.message);
                socket.emit("error", {
                    message: "Failed to fetch orders"
                });
            }
        });

        // ==========================================
        // EVENT 4: DISCONNECT (Ngắt kết nối)
        // ==========================================
        socket.on("disconnect", () => {
            try {
                // Tìm staff bị disconnect
                const disconnectedStaff = Object.entries(kitchenStaffOnline).find(
                    ([_, staff]) => staff.socketId === socket.id
                );

                if (disconnectedStaff) {
                    const [userId, staffData] = disconnectedStaff;
                    delete kitchenStaffOnline[userId];

                    console.log(`👋 Kitchen staff ${userId} (${staffData.staffName}) disconnected`);
                    console.log(`👥 Active kitchen staff now: ${Object.keys(kitchenStaffOnline).length}`);

                    // Broadcast status change
                    io.to("kitchen").emit("staff_status_changed", {
                        event: "staff_offline",
                        staffCount: Object.keys(kitchenStaffOnline).length,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error("❌ Error in disconnect:", error.message);
            }
        });
    });
};

/**
 * Helper function: Calculate how urgent an order is
 * Based on time since order was created
 * @param {Date} orderTime - Order creation time
 * @returns {string} - 'critical' | 'high' | 'normal'
 */
function calculateUrgency(orderTime) {
    const minutesElapsed = Math.floor((Date.now() - new Date(orderTime)) / 60000);

    if (minutesElapsed > 20) return 'critical';
    if (minutesElapsed > 10) return 'high';
    return 'normal';
}

/**
 * Utility function: Emit new order to kitchen
 * Called from orderController when order is created
 * @param {Object} io - Socket.IO instance
 * @param {Object} order - Order document
 */
async function emitNewOrderToKitchen(io, order) {
    try {
        // Fetch table info if available
        const fullOrder = await order.populate("table");

        if (`${fullOrder?.orderStatus || ""}`.toUpperCase() === PENDING_APPROVAL_STATUS) {
            console.log(`⏸️ Skip kitchen emit for pending approval order: ${fullOrder._id}`);
            return;
        }

        // Format order data for kitchen (no price info)
        const kitchenOrderData = {
            orderId: fullOrder._id,
            customerName: fullOrder.customerDetails?.name,
            tableNumber: fullOrder.table?.tableNo,
            tableId: fullOrder.table?._id,
            items: fullOrder.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                notes: item.notes
            })),
            orderTime: fullOrder.createdAt,
            notes: fullOrder.notes,
            kitchenStatus: fullOrder.kitchenStatus
        };

        // Emit to kitchen room
        io.to("kitchen").emit("new_order", kitchenOrderData);

        console.log(`📦 New order emitted to kitchen: ${fullOrder._id}`);
    } catch (error) {
        console.error("❌ Error emitting new order to kitchen:", error.message);
    }
}

/**
 * Utility function: Emit order cancellation to kitchen
 * Called when admin cancels an order
 * @param {Object} io - Socket.IO instance
 * @param {string} orderId - Order ID
 */
function emitOrderCancelledToKitchen(io, orderId) {
    try {
        io.to("kitchen").emit("order_cancelled", {
            orderId,
            cancelledAt: new Date()
        });

        console.log(`❌ Order cancellation emitted to kitchen: ${orderId}`);
    } catch (error) {
        console.error("❌ Error emitting order cancellation:", error.message);
    }
}

module.exports = {
    kitchenSocketHandler,
    emitNewOrderToKitchen,
    emitOrderCancelledToKitchen,
    kitchenStaffOnline
};
