const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const { default: mongoose } = require("mongoose");
const { emitNewOrderToKitchen, emitOrderCancelledToKitchen } = require("../sockets/kitchen.socket");

// Initialize io (will be set by app.js)
let io = null;

const setIOInstance = (ioInstance) => {
  io = ioInstance;
};

const addOrder = async (req, res, next) => {
  try {
    const order = new Order(req.body);
    await order.save();

    // Emit new order to kitchen in real-time
    if (io) {
      await emitNewOrderToKitchen(io, order);
    }

    res
      .status(201)
      .json({ success: true, message: "Order created!", data: order });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("table");
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res
      .status(200)
      .json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

const updateKitchenStatus = async (req, res, next) => {
  try {
    const { kitchenStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid order id!");
      return next(error);
    }

    // Validate enum
    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];
    if (!validStatuses.includes(kitchenStatus)) {
      const error = createHttpError(
        400,
        `Invalid kitchen status. Must be one of: ${validStatuses.join(', ')}`
      );
      return next(error);
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { kitchenStatus },
      { new: true }
    ).populate("table");

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    // Emit socket event to notify POS of kitchen status update
    if (io) {
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

      console.log(`📤 Kitchen status updated via API: ${id} → ${kitchenStatus}`);
    }

    res.status(200).json({
      success: true,
      message: "Kitchen status updated",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  updateOrder,
  updateKitchenStatus,
  setIOInstance
};
