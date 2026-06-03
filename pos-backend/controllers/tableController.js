const Table = require("../models/tableModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose")
const Order = require("../models/orderModel");
const config = require("../config/config");

const OPEN_ORDER_STATUSES_COMPAT = ["OPEN"];

const normalizeRole = (role = "") => `${role}`.trim().toLowerCase();

const isCustomerRole = (role = "") => normalizeRole(role) === "customer";

const isTableOwner = (table, userId) => {
  if (!table || !userId) return false;
  return (
    `${table.reservedBy || ""}` === `${userId}` ||
    `${table.currentCustomer || ""}` === `${userId}`
  );
};

const normalizeBaseUrl = (url = "") => {
  return `${url || ""}`.trim().replace(/\/+$/, "");
};

const buildTableQrOrderUrl = (tableId, tableNo) => {
  const baseUrl = normalizeBaseUrl(config.customerAppUrl) || "http://localhost:5174";
  const params = new URLSearchParams({
    tableId: `${tableId}`,
    tableNo: `${tableNo}`
  });
  return `${baseUrl}/qr-order?${params.toString()}`;
};

const addTable = async (req, res, next) => {
  try {
    const { tableNo, seats } = req.body;
    if (!tableNo) {
      const error = createHttpError(400, "Please provide table No!");
      return next(error);
    }
    const isTablePresent = await Table.findOne({ tableNo });

    if (isTablePresent) {
      const error = createHttpError(400, "Table already exist!");
      return next(error);
    }

    const newTable = new Table({ tableNo, seats });
    newTable.qrOrderUrl = buildTableQrOrderUrl(newTable._id, tableNo);
    await newTable.save();
    res
      .status(201)
      .json({ success: true, message: "Table added!", data: newTable });
  } catch (error) {
    next(error);
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().populate({
      path: "currentOrder",
      select: "customerDetails"
    });

    const tableIds = tables.map((table) => table._id);
    const unpaidOrders = await Order.find({
      table: { $in: tableIds },
      orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
    })
      .select("table")
      .lean();

    const unpaidMap = unpaidOrders.reduce((acc, order) => {
      const key = `${order.table}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const data = tables.map((table) => {
      const hasUnpaid = unpaidMap[`${table._id}`] > 0;
      const ownedByMe = `${table.reservedBy || ""}` === `${req.user?._id || ""}` || `${table.currentCustomer || ""}` === `${req.user?._id || ""}`;
      return {
        ...table.toObject(),
        qrOrderUrl: buildTableQrOrderUrl(table._id, table.tableNo),
        status: hasUnpaid ? "Đã đặt" : "Trống",
        ownedByMe
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getTableOrders = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid table id!");
      return next(error);
    }

    const table = await Table.findById(id).select("reservedBy currentCustomer");
    if (!table) {
      return next(createHttpError(404, "Table not found!"));
    }

    if (isCustomerRole(req.user?.role) && !isTableOwner(table, req.user?._id)) {
      return next(createHttpError(403, "Bạn chỉ có thể xem đơn hàng của bàn bạn đang đặt/ngồi."));
    }

    const orders = await Order.find({
      table: id,
      orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
    })
      .select("items createdAt orderDate kitchenStatus bills customerDetails")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, orderId, tableNo, seats } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const isAdminEdit = typeof tableNo !== "undefined" || typeof seats !== "undefined";

    if (isAdminEdit) {
      const hasUnpaidOrder = await Order.exists({
        table: id,
        orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
      });
      if (hasUnpaidOrder) {
        return next(createHttpError(409, "Không thể sửa bàn đang được đặt."));
      }
    }

    const currentTable = await Table.findById(id).select("tableNo");
    if (!currentTable) {
      return next(createHttpError(404, "Table not found!"));
    }

    const updatePayload = {};
    if (typeof status !== "undefined") updatePayload.status = status;
    if (typeof orderId !== "undefined") updatePayload.currentOrder = orderId;
    if (typeof tableNo !== "undefined") updatePayload.tableNo = tableNo;
    if (typeof seats !== "undefined") updatePayload.seats = seats;

    const nextTableNo = typeof tableNo !== "undefined" ? tableNo : currentTable.tableNo;
    updatePayload.qrOrderUrl = buildTableQrOrderUrl(id, nextTableNo);

    const table = await Table.findByIdAndUpdate(id, updatePayload, { new: true });

    if (!table) {
      const error = createHttpError(404, "Table not found!");
      return error;
    }

    res.status(200).json({ success: true, message: "Table updated!", data: table });

  } catch (error) {
    next(error);
  }
};

const customerReserveTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reservationNote = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid table id!"));
    }

    const table = await Table.findById(id);
    if (!table) {
      return next(createHttpError(404, "Table not found!"));
    }

    const hasOpenOrder = await Order.exists({
      table: id,
      orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
    });
    if (hasOpenOrder && !isTableOwner(table, req.user?._id)) {
      return next(createHttpError(409, "Bàn này đang được sử dụng."));
    }

    if (table.reservedBy && `${table.reservedBy}` !== `${req.user._id}`) {
      return next(createHttpError(409, "Bàn này đã được khách khác đặt."));
    }

    table.reservedBy = req.user._id;
    table.reservationAt = new Date();
    table.reservationNote = reservationNote;
    table.status = "Reserved";
    await table.save();

    return res.status(200).json({
      success: true,
      message: "Đặt bàn thành công",
      data: table
    });
  } catch (error) {
    return next(error);
  }
};

const customerCheckInTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid table id!"));
    }

    const table = await Table.findById(id);
    if (!table) {
      return next(createHttpError(404, "Table not found!"));
    }

    if (table.currentCustomer && `${table.currentCustomer}` !== `${req.user._id}`) {
      return next(createHttpError(409, "Bàn này đang có khách khác sử dụng."));
    }

    if (table.reservedBy && `${table.reservedBy}` !== `${req.user._id}`) {
      return next(createHttpError(403, "Bạn không thể nhận bàn này vì thuộc đặt chỗ của khách khác."));
    }

    table.currentCustomer = req.user._id;
    table.reservedBy = req.user._id;
    table.reservationAt = table.reservationAt || new Date();
    table.status = "Occupied";
    await table.save();

    return res.status(200).json({
      success: true,
      message: "Nhận bàn thành công",
      data: table
    });
  } catch (error) {
    return next(error);
  }
};

const customerReleaseTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid table id!"));
    }

    const table = await Table.findById(id);
    if (!table) {
      return next(createHttpError(404, "Table not found!"));
    }

    if (!isTableOwner(table, req.user?._id)) {
      return next(createHttpError(403, "Bạn chỉ có thể trả bàn của chính bạn."));
    }

    const hasOpenOrder = await Order.exists({
      table: id,
      orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
    });
    if (hasOpenOrder) {
      return next(createHttpError(409, "Không thể trả bàn khi vẫn còn đơn mở."));
    }

    table.currentCustomer = null;
    table.reservedBy = null;
    table.reservationAt = null;
    table.reservationNote = "";
    table.status = "Available";
    await table.save();

    return res.status(200).json({
      success: true,
      message: "Trả bàn thành công",
      data: table
    });
  } catch (error) {
    return next(error);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid id!"));
    }

    const hasUnpaidOrder = await Order.exists({
      table: id,
      orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
    });
    if (hasUnpaidOrder) {
      return next(createHttpError(409, "Không thể xóa bàn đang được đặt."));
    }

    const table = await Table.findByIdAndDelete(id);
    if (!table) {
      return next(createHttpError(404, "Table not found!"));
    }

    res.status(200).json({ success: true, message: "Table deleted!" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addTable,
  getTables,
  updateTable,
  getTableOrders,
  deleteTable,
  customerReserveTable,
  customerCheckInTable,
  customerReleaseTable
};
