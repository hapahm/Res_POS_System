const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const Table = require("../models/tableModel");
const { default: mongoose } = require("mongoose");
const { emitNewOrderToKitchen } = require("../sockets/kitchen.socket");

const ORDER_STATUS = Object.freeze({
  PENDING_APPROVAL: "PENDING_APPROVAL",
  OPEN: "OPEN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

const PAYMENT_STATUS = Object.freeze({
  UNPAID: "UNPAID",
  PAID: "PAID",
});

const PAYMENT_METHODS = Object.freeze({
  CASH: "CASH",
  VNPAY: "VNPAY",
});

const OPEN_ORDER_STATUSES_COMPAT = [ORDER_STATUS.OPEN];
const STAFF_ROLES = ["admin", "cashier", "waiter", "staff"];

const normalizeRole = (role = "") => `${role}`.trim().toLowerCase();

const isCustomerRole = (role = "") => normalizeRole(role) === "customer";

const isStaffRole = (role = "") => STAFF_ROLES.includes(normalizeRole(role));

const isPaidOrderStatus = (value) => `${value || ""}`.toUpperCase() === PAYMENT_STATUS.PAID;
const normalizePhone = (phone = "") => `${phone}`.replace(/\D/g, "");

const buildCustomerOrderAccess = (user) => {
  const userId = `${user?._id || ""}`;
  const rawPhone = `${user?.phone || ""}`.trim();
  const normalizedPhone = normalizePhone(rawPhone);
  const phoneCandidates = [rawPhone, normalizedPhone].filter(Boolean);

  return {
    userId,
    normalizedPhone,
    phoneCandidates,
    query: {
      $or: [
        { createdBy: user?._id || null },
        ...(phoneCandidates.length ? [{ "customerDetails.phone": { $in: phoneCandidates } }] : []),
      ],
    },
  };
};

const canAccessCustomerOrder = (order, user) => {
  if (!order || !user) return false;
  const { userId, normalizedPhone } = buildCustomerOrderAccess(user);

  const createdByMatches = `${order.createdBy || ""}` === userId;
  const orderPhone = normalizePhone(order?.customerDetails?.phone || "");
  const phoneMatches = Boolean(normalizedPhone) && orderPhone === normalizedPhone;

  return createdByMatches || phoneMatches;
};
// Khởi tạo biến io (sẽ được set từ app.js)
let io = null;

// Hàm truyền instance socket.io từ app.js vào controller
const setIOInstance = (ioInstance) => {
  io = ioInstance;
};

const normalizeText = (value = "") => {
  return `${value}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

const calculateBillsFromItems = (items = [], taxRate = 5.25) => {
  const activeItems = items.filter((item) => item.status !== "cancelled" && !item.cancelled_at);
  const total = activeItems.reduce((acc, item) => {
    const lineTotal = Number(item.price ?? Number(item.pricePerQuantity || 0) * Number(item.quantity || 0));
    return acc + (Number.isFinite(lineTotal) ? lineTotal : 0);
  }, 0);
  const tax = (total * taxRate) / 100;
  const totalWithTax = total + tax;

  return { total, tax, totalWithTax };
};

const getStaffDisplayName = (user) => {
  if (!user) return "N/A";
  return user.name || user.email || "N/A";
};

const emitCustomerOrderCreated = async (order) => {
  if (!io || !order) return;

  const populatedOrder = await Order.findById(order._id).populate("table", "tableNo");

  io.emit("customer_order_created", {
    orderId: populatedOrder?._id,
    customerName: populatedOrder?.customerDetails?.name || "Khách",
    customerPhone: populatedOrder?.customerDetails?.phone || "N/A",
    guests: populatedOrder?.customerDetails?.guests || 1,
    tableId: populatedOrder?.table?._id || populatedOrder?.table || null,
    tableNo: populatedOrder?.table?.tableNo || "--",
    totalAmount: populatedOrder?.bills?.totalWithTax || 0,
    itemCount: populatedOrder?.items?.length || 0,
    orderStatus: populatedOrder?.orderStatus,
    createdAt: populatedOrder?.createdAt || new Date(),
  });
};

// =======================
// TẠO ĐƠN HÀNG MỚI
// =======================
const addOrder = async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    const hasAuthenticatedUser = Boolean(req.user?._id);
    const currentRole = normalizeRole(req.user?.role);
    const isCustomer = isCustomerRole(currentRole);
    const isGuestCustomer = !hasAuthenticatedUser;
    const currentUserId = `${req.user?._id || ""}`;
    const isCustomerAppOrder = isCustomer || `${req.body?.orderSource || ""}`.toLowerCase() === "customer_app";

    if (isGuestCustomer && !isCustomerAppOrder) {
      return next(createHttpError(401, "Vui lòng đăng nhập để thực hiện thao tác này."));
    }

    if (!req.body?.table || !mongoose.Types.ObjectId.isValid(req.body.table)) {
      return next(createHttpError(400, "Bàn không hợp lệ"));
    }

    if (!Array.isArray(items) || items.length === 0) {
      return next(createHttpError(400, "Danh sách món không hợp lệ"));
    }

    // Chuẩn hóa danh sách món
    const normalizedItems = items.map((item) => ({
      ...item,
      notes: item.notes || "",
      dishId: item.dishId || item.dish || null,
      status: "active",
      cancelled_at: null,        // Chưa bị hủy
      added_at: new Date()       // Thời điểm thêm món
    }));

    const incomingTaxRate = Number(req.body?.bills?.total) > 0
      ? (Number(req.body?.bills?.tax || 0) / Number(req.body?.bills?.total || 1)) * 100
      : 5.25;

    const targetTable = await Table.findById(req.body.table).select("reservedBy currentCustomer tableNo");
    if (!targetTable) {
      return next(createHttpError(404, "Không tìm thấy bàn"));
    }

    if (isCustomer && hasAuthenticatedUser) {
      const ownsTable =
        `${targetTable.reservedBy || ""}` === currentUserId ||
        `${targetTable.currentCustomer || ""}` === currentUserId;

      if (!ownsTable) {
        return next(createHttpError(403, "Khách chỉ có thể gọi món cho bàn mình đang ngồi/đặt."));
      }
    }

    const targetOrderStatus = isCustomerAppOrder ? ORDER_STATUS.PENDING_APPROVAL : ORDER_STATUS.OPEN;

    let order = await Order.findOne({
      table: req.body.table,
      ...(isCustomerAppOrder ? { createdBy: req.user?._id || null } : {}),
      orderStatus: targetOrderStatus,
    });

    if (order) {
      if (isCustomer && `${order.createdBy || ""}` !== currentUserId) {
        return next(createHttpError(403, "Bạn chỉ có thể thêm món vào đơn của chính bạn."));
      }

      order.items.push(...normalizedItems);
      order.bills = calculateBillsFromItems(order.items, incomingTaxRate);
      if (isCustomer) {
        order.customerDetails = {
          name: req.user?.name || order.customerDetails?.name || "Khách",
          phone: `${req.user?.phone || order.customerDetails?.phone || ""}`,
          guests: Number(req.body?.customerDetails?.guests || order.customerDetails?.guests || 1)
        };
      } else if (isGuestCustomer) {
        order.customerDetails = {
          name: order.customerDetails?.name || `Khách bàn ${targetTable.tableNo}`,
          phone: order.customerDetails?.phone || "N/A",
          guests: Number(req.body?.customerDetails?.guests || order.customerDetails?.guests || 1)
        };
      } else {
        order.customerDetails = req.body.customerDetails || order.customerDetails;
      }
      order.orderStatus = targetOrderStatus;
      order.paymentStatus = PAYMENT_STATUS.UNPAID;
      order.closedAt = null;
      if (!order.staff || order.staff === "N/A") {
        order.staff = getStaffDisplayName(req.user);
      }
      await order.save();
    } else {
      order = new Order({
        ...req.body,
        customerDetails: isCustomer
          ? {
            name: req.user?.name || req.body?.customerDetails?.name || "Khách",
            phone: `${req.user?.phone || req.body?.customerDetails?.phone || ""}`,
            guests: Number(req.body?.customerDetails?.guests || 1)
          }
          : isGuestCustomer
            ? {
              name: req.body?.customerDetails?.name || `Khách bàn ${targetTable.tableNo}`,
              phone: req.body?.customerDetails?.phone || "N/A",
              guests: Number(req.body?.customerDetails?.guests || 1)
            }
            : req.body.customerDetails,
        items: normalizedItems,
        staff: getStaffDisplayName(req.user),
        createdBy: req.user?._id || null,
        createdByRole: isStaffRole(currentRole) ? currentRole : currentRole || "staff",
        orderStatus: targetOrderStatus,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        closedAt: null,
        bills: calculateBillsFromItems(normalizedItems, incomingTaxRate),
      });
      await order.save();
    }

    if (isCustomerAppOrder) {
      await emitCustomerOrderCreated(order);
    } else if (io) {
      // Gửi đơn mới sang màn hình bếp (realtime)
      await emitNewOrderToKitchen(io, order);
    }

    res.status(201).json({
      success: true,
      message: isCustomerAppOrder
        ? "Đặt món thành công, chúng tôi sẽ liên hệ với bạn sớm nhất"
        : "Lưu đơn hàng thành công!",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// LẤY ĐƠN THEO ID
// =======================
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra ObjectId hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "ID không hợp lệ!"));
    }

    const order = await Order.findById(id);

    if (!order) {
      return next(createHttpError(404, "Không tìm thấy đơn hàng!"));
    }

    const mustOwnOrder = Boolean(req.customerScope) || isCustomerRole(req.user?.role);
    if (mustOwnOrder && !canAccessCustomerOrder(order, req.user)) {
      return next(createHttpError(403, "Bạn không có quyền xem đơn hàng này."));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// =======================
// LẤY TẤT CẢ ĐƠN HÀNG
// =======================
const getOrders = async (req, res, next) => {
  try {
    const search = normalizeText(req.query.search || "");
    const paymentStatus = (req.query.paymentStatus || "").toLowerCase().trim();

    const query = {};
    if (isCustomerRole(req.user?.role)) {
      query.createdBy = req.user?._id;
    }

    const orders = await Order.find(query).populate("table");

    const orderIds = orders.map((order) => `${order._id}`);
    const paymentLogs = await Payment.find({
      orderId: { $in: orderIds },
    })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const latestPaymentByOrder = paymentLogs.reduce((acc, payment) => {
      const key = `${payment.orderId}`;
      if (!acc[key]) {
        acc[key] = payment;
      }
      return acc;
    }, {});

    const enrichedOrders = orders.map((order) => {
      const normalizedOrder = order.toObject();
      const latestPayment = latestPaymentByOrder[`${order._id}`] || null;
      const legacyStatus = isPaidOrderStatus(normalizedOrder.paymentStatus) ? "paid" : "pending";

      return {
        ...normalizedOrder,
        paymentGatewayStatus: latestPayment?.status || legacyStatus,
        paymentTransaction: latestPayment
          ? {
            txnRef: latestPayment.txnRef || null,
            amount: latestPayment.amount ?? null,
            bankCode: latestPayment.bankCode || null,
            transactionNo: latestPayment.transactionNo || null,
            payDate: latestPayment.payDate || null,
            status: latestPayment.status || legacyStatus,
            rawPayload: latestPayment.rawPayload || null,
          }
          : null,
      };
    });

    const filteredOrders = enrichedOrders.filter((order) => {
      // ===== SEARCH TEXT FILTER =====
      let matchesSearch = true;

      if (search) {
        const customerName = normalizeText(order.customerDetails?.name || "");
        const customerPhone = normalizeText(order.customerDetails?.phone || "");
        const tableNo = normalizeText(`${order.table?.tableNo || ""}`);
        const orderCode = normalizeText(`${Math.floor(new Date(order.orderDate).getTime())}`);
        const itemNames = (order.items || [])
          .map((item) => normalizeText(item.name || ""))
          .join(" ");

        // Tìm theo giá tiền (hỗ trợ "100000" hoặc "100000-200000")
        let matchesPrice = false;
        if (search.match(/^\d+(-\d+)?$/)) {
          const priceAmount = order?.bills?.totalWithTax || 0;

          if (search.includes("-")) {
            const [minPrice, maxPrice] = search.split("-").map(Number);
            matchesPrice = priceAmount >= minPrice && priceAmount <= maxPrice;
          } else {
            const targetPrice = Number(search);
            matchesPrice = priceAmount.toString().includes(search);
          }
        }

        // Tìm theo ngày (format dd/mm hoặc dd/mm/yyyy)
        let matchesDate = false;
        if (search.match(/^\d{2}\/\d{2}(\/\d{4})?$/)) {
          const orderDate = new Date(order.orderDate);
          const day = String(orderDate.getDate()).padStart(2, "0");
          const month = String(orderDate.getMonth() + 1).padStart(2, "0");
          const year = orderDate.getFullYear();

          const dateFormatShort = `${day}/${month}`;
          const dateFormatFull = `${day}/${month}/${year}`;

          matchesDate = search === dateFormatShort || search === dateFormatFull;
        }

        matchesSearch =
          customerName.includes(search) ||
          customerPhone.includes(search) ||
          tableNo.includes(search) ||
          orderCode.includes(search) ||
          itemNames.includes(search) ||
          matchesPrice ||
          matchesDate;
      }

      // ===== PAYMENT STATUS FILTER =====
      let matchesPaymentStatus = true;
      const resolvedPaymentStatus = order.paymentGatewayStatus || "pending";

      if (paymentStatus === "paid") {
        matchesPaymentStatus = resolvedPaymentStatus === "paid";
      } else if (paymentStatus === "unpaid") {
        matchesPaymentStatus = resolvedPaymentStatus !== "paid";
      } else if (["pending", "failed", "expired", "refunded"].includes(paymentStatus)) {
        matchesPaymentStatus = resolvedPaymentStatus === paymentStatus;
      }

      return matchesSearch && matchesPaymentStatus;
    });

    res.status(200).json({
      success: true,
      data: filteredOrders
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (ORDER STATUS)
// =======================
const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "ID không hợp lệ!"));
    }

    if (![ORDER_STATUS.PENDING_APPROVAL, ORDER_STATUS.OPEN, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(orderStatus)) {
      return next(createHttpError(400, "Trạng thái đơn hàng không hợp lệ"));
    }

    const existingOrder = await Order.findById(id).select("createdBy");
    if (!existingOrder) {
      return next(createHttpError(404, "Không tìm thấy đơn hàng!"));
    }

    if (isCustomerRole(req.user?.role) && `${existingOrder.createdBy || ""}` !== `${req.user?._id || ""}`) {
      return next(createHttpError(403, "Bạn không có quyền cập nhật đơn hàng này."));
    }

    const updatePayload = {
      orderStatus,
      closedAt: orderStatus === ORDER_STATUS.OPEN ? null : new Date(),
    };

    if (orderStatus === ORDER_STATUS.COMPLETED) {
      updatePayload.paymentStatus = PAYMENT_STATUS.PAID;
      updatePayload.paid_at = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    );

    if (!order) {
      return next(createHttpError(404, "Không tìm thấy đơn hàng!"));
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// CẬP NHẬT TRẠNG THÁI BẾP
// =======================
const updateKitchenStatus = async (req, res, next) => {
  try {
    const { kitchenStatus } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "ID đơn hàng không hợp lệ!"));
    }

    // Danh sách trạng thái hợp lệ
    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];

    if (!validStatuses.includes(kitchenStatus)) {
      return next(createHttpError(
        400,
        `Trạng thái bếp không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}`
      ));
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { kitchenStatus },
      { new: true }
    ).populate("table");

    if (!order) {
      return next(createHttpError(404, "Không tìm thấy đơn hàng!"));
    }

    // Gửi sự kiện realtime về POS
    if (io) {
      io.emit("kitchen_status_updated", {
        orderId: order._id,
        kitchenStatus: order.kitchenStatus,
        customerName: order.customerDetails?.name,
        tableNumber: order.table?.tableNo,
        itemsCount: order.items?.length,
        updatedAt: new Date(),
        statusEmoji: {
          pending: '⏳',
          preparing: '👨‍🍳',
          completed: '✅',
          cancelled: '❌'
        }[kitchenStatus]
      });

      console.log(`📤 Cập nhật trạng thái bếp: ${id} → ${kitchenStatus}`);
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái bếp thành công",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// HỦY MỘT MÓN TRONG ĐƠN
// =======================
const cancelOrderItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "ID đơn hàng không hợp lệ!"));
    }

    if (!itemId) {
      return next(createHttpError(400, "Thiếu ID món cần hủy!"));
    }

    const order = await Order.findById(id);

    if (!order) {
      return next(createHttpError(404, "Không tìm thấy đơn hàng!"));
    }

    const mustOwnOrder = Boolean(req.customerScope) || isCustomerRole(req.user?.role);
    if (mustOwnOrder && !canAccessCustomerOrder(order, req.user)) {
      return next(createHttpError(403, "Bạn không có quyền hủy món của đơn này."));
    }

    const item =
      order.items.id(itemId) ||
      order.items.find((i) => `${i.id}` === `${itemId}`);

    if (!item) {
      return next(createHttpError(404, "Không tìm thấy món trong đơn!"));
    }

    // Đánh dấu thời gian hủy (không xóa khỏi DB)
    if (item.status === "cancelled") {
      return next(createHttpError(400, "Món này đã được hủy trước đó!"));
    }

    item.status = "cancelled";
    item.cancelled_at = new Date();
    await order.save();

    if (io) {
      const populatedOrder = await Order.findById(id).populate("table");
      const payload = {
        orderId: order._id,
        itemId: item._id,
        itemName: item.name,
        itemStatus: item.status,
        tableNumber: populatedOrder.table?.tableNo,
        customerName: populatedOrder.customerDetails?.name,
        cancelledAt: item.cancelled_at
      };

      // Emit to kitchen room AND broadcast to all clients
      io.to("kitchen").emit("item_cancelled", payload);
      io.emit("item_cancelled", payload);

      console.log(`🚫 Đã hủy món: ${item.name} (đơn ${id}) - Emitted to kitchen & all clients`);
    }

    res.status(200).json({
      success: true,
      message: "Hủy món thành công",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentHistory = async (req, res, next) => {
  try {
    const { date, table, paymentMethod } = req.query;

    const query = {
      orderStatus: ORDER_STATUS.COMPLETED,
    };

    if (paymentMethod) {
      query.paymentMethod = `${paymentMethod}`.toUpperCase();
    }

    if (date) {
      const start = new Date(date);
      if (Number.isNaN(start.getTime())) {
        return next(createHttpError(400, "Ngày lọc không hợp lệ"));
      }
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      query.closedAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query)
      .populate("table", "tableNo")
      .sort({ closedAt: -1, updatedAt: -1 });

    const filtered = table
      ? orders.filter((order) => `${order?.table?.tableNo || ""}` === `${table}`)
      : orders;

    const data = filtered.map((order) => ({
      _id: order._id,
      orderId: Math.floor(new Date(order.orderDate || order.createdAt).getTime()),
      tableNo: order?.table?.tableNo || "--",
      totalAmount: Number(order?.bills?.totalWithTax || 0),
      paymentMethod: order.paymentMethod || PAYMENT_METHODS.CASH,
      paymentDate: order.closedAt || order.paid_at || order.updatedAt,
      staff: order.staff || "N/A",
      orderStatus: order.orderStatus,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getCustomerOrders = async (req, res, next) => {
  try {
    const accessFilter = buildCustomerOrderAccess(req.user);

    const orders = await Order.find(accessFilter.query)
      .populate("table", "tableNo")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getPendingCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ orderStatus: ORDER_STATUS.PENDING_APPROVAL })
      .populate("table", "tableNo")
      .populate("createdBy", "name phone email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const approveCustomerOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "ID đơn hàng không hợp lệ"));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(createHttpError(404, "Không tìm thấy đơn hàng"));
    }

    if (order.orderStatus !== ORDER_STATUS.PENDING_APPROVAL) {
      return next(createHttpError(409, "Đơn hàng không ở trạng thái chờ duyệt"));
    }

    order.orderStatus = ORDER_STATUS.OPEN;
    order.staff = getStaffDisplayName(req.user);
    order.closedAt = null;
    await order.save();

    if (io) {
      await emitNewOrderToKitchen(io, order);
      io.emit("customer_order_approved", {
        orderId: order._id,
        approvedBy: getStaffDisplayName(req.user),
        approvedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Duyệt đơn thành công, đơn đã chuyển tới bếp.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const rejectCustomerOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(400, "ID đơn hàng không hợp lệ"));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(createHttpError(404, "Không tìm thấy đơn hàng"));
    }

    if (order.orderStatus !== ORDER_STATUS.PENDING_APPROVAL) {
      return next(createHttpError(409, "Chỉ có thể từ chối đơn hàng đang chờ duyệt"));
    }

    order.orderStatus = ORDER_STATUS.CANCELLED;
    order.staff = getStaffDisplayName(req.user);
    order.closedAt = new Date();
    await order.save();

    if (io) {
      io.emit("customer_order_rejected", {
        orderId: order._id,
        rejectedBy: getStaffDisplayName(req.user),
        rejectedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã từ chối đơn hàng.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrder,
  getOrderById,
  getOrders,
  getPaymentHistory,
  getCustomerOrders,
  getPendingCustomerOrders,
  approveCustomerOrder,
  rejectCustomerOrder,
  updateOrder,
  updateKitchenStatus,
  cancelOrderItem,
  setIOInstance
};