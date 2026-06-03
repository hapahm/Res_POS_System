const Razorpay = require("razorpay");
const config = require("../config/config");
const crypto = require("crypto");
const createHttpError = require("http-errors");
const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");
const mongoose = require("mongoose");

const PAYMENT_STATUSES = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  EXPIRED: "expired",
  REFUNDED: "refunded",
});

const ORDER_STATUS = Object.freeze({
  OPEN: "OPEN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

const ORDER_PAYMENT_STATUS = Object.freeze({
  UNPAID: "UNPAID",
  PAID: "PAID",
});

const ORDER_PAYMENT_METHOD = Object.freeze({
  CASH: "CASH",
  VNPAY: "VNPAY",
});

const OPEN_ORDER_STATUSES_COMPAT = [ORDER_STATUS.OPEN];

const sortObject = (obj) => {
  const sorted = {};
  const str = [];
  let key;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }

  str.sort();

  for (let i = 0; i < str.length; i++) {
    const encodedKey = str[i];
    const decodedKey = decodeURIComponent(encodedKey);
    sorted[encodedKey] = encodeURIComponent(String(obj[decodedKey])).replace(/%20/g, "+");
  }

  return sorted;
};

const buildSignData = (params) => {
  const sortedParams = sortObject(params);
  return Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
};

const buildQueryString = (params) => {
  const str = [];
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();

  const encoded = {};
  for (let i = 0; i < str.length; i++) {
    for (const key in params) {
      if (encodeURIComponent(key) === str[i]) {
        encoded[str[i]] = encodeURIComponent(String(params[key])).replace(/%20/g, "+");
      }
    }
  }

  return Object.entries(encoded)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
};

const signVnpParams = (params) => {
  const qs = require("qs");
  const sortedParams = sortObject(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  return crypto
    .createHmac("sha512", config.vnpHashSecret)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
};

const getVnpDate = (date = new Date()) => {
  // Convert to GMT+7 (Vietnam time)
  const vietnamDate = new Date(date.getTime() + (7 - date.getTimezoneOffset() / 60) * 60 * 60 * 1000);

  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vietnamDate.getUTCDate()).padStart(2, "0");
  const hour = String(vietnamDate.getUTCHours()).padStart(2, "0");
  const minute = String(vietnamDate.getUTCMinutes()).padStart(2, "0");
  const second = String(vietnamDate.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hour}${minute}${second}`;
};

const mapVnpResponseToStatus = (vnpResponseCode) => {
  if (vnpResponseCode === "00") {
    return PAYMENT_STATUSES.PAID;
  }

  if (["24", "51", "65", "75", "79"].includes(vnpResponseCode)) {
    return PAYMENT_STATUSES.FAILED;
  }

  if (["10", "11"].includes(vnpResponseCode)) {
    return PAYMENT_STATUSES.EXPIRED;
  }

  return PAYMENT_STATUSES.FAILED;
};

const convertIpv6ToIpv4 = (ip) => {
  // Handle IPv6 loopback
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }

  // Remove IPv4-mapped IPv6 prefix (::ffff:)
  if (ip && ip.startsWith("::ffff:")) {
    return ip.slice(7);
  }

  // If still IPv6, use default
  if (ip && ip.includes(":")) {
    return "127.0.0.1";
  }

  return ip || "127.0.0.1";
};

const toDateFromVnpPayDate = (vnpPayDate) => {
  if (!vnpPayDate || `${vnpPayDate}`.length !== 14) {
    return null;
  }

  const value = `${vnpPayDate}`;
  const year = value.slice(0, 4);
  const month = value.slice(4, 6);
  const day = value.slice(6, 8);
  const hour = value.slice(8, 10);
  const minute = value.slice(10, 12);
  const second = value.slice(12, 14);

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`);
};

const getStaffDisplayName = (user) => {
  if (!user) return "N/A";
  return user.name || user.email || "N/A";
};

const updateOrderPaymentFromStatus = async (orderId, paymentStatus, payDate, paymentMethod = null, staff = null) => {
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    console.warn("⚠️ Invalid orderId for payment update:", orderId);
    return;
  }

  if (paymentStatus === PAYMENT_STATUSES.PAID) {
    const updatePayload = {
      paymentStatus: ORDER_PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED,
      closedAt: payDate || new Date(),
      paid_at: payDate || new Date(),
    };

    if (paymentMethod) {
      updatePayload.paymentMethod = paymentMethod;
    }
    if (staff) {
      updatePayload.staff = staff;
    }

    await Order.findByIdAndUpdate(orderId, {
      $set: updatePayload,
    });
    console.log(`✅ Order ${orderId} marked as PAID`);
    return;
  }

  await Order.findByIdAndUpdate(orderId, {
    $set: {
      paymentStatus: ORDER_PAYMENT_STATUS.UNPAID,
      orderStatus: ORDER_STATUS.OPEN,
      closedAt: null,
    },
  });
  console.log(`📝 Order ${orderId} marked as UNPAID`);
};

const createOrder = async (req, res, next) => {
  const razorpay = new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpaySecretKey,
  });

  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100, // Amount in paisa (1 INR = 100 paisa)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const expectedSignature = crypto
      .createHmac("sha256", config.razorpaySecretKey)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully!" });
    } else {
      const error = createHttpError(400, "Payment verification failed!");
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

const webHookVerification = async (req, res, next) => {
  try {
    const secret = config.razorpyWebhookSecret;
    const signature = req.headers["x-razorpay-signature"];

    const body = JSON.stringify(req.body);

    // 🛑 Verify the signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === signature) {
      console.log("✅ Webhook verified:", req.body);

      // ✅ Process payment (e.g., update DB, send confirmation email)
      if (req.body.event === "payment.captured") {
        const payment = req.body.payload.payment.entity;
        console.log(`💰 Payment Captured: ${payment.amount / 100} INR`);

        // Add Payment Details in Database
        const newPayment = new Payment({
          paymentId: payment.id,
          txnRef: payment.order_id,
          orderId: payment.order_id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: payment.status === "captured" ? PAYMENT_STATUSES.PAID : PAYMENT_STATUSES.FAILED,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
          rawPayload: req.body,
          createdAt: new Date(payment.created_at * 1000)
        })

        await newPayment.save();
      }

      res.json({ success: true });
    } else {
      const error = createHttpError(400, "❌ Invalid Signature!");
      return next(error);
    }
  } catch (error) {
    next(error);
  }
};

const markTablePaid = async (req, res, next) => {
  try {
    const { tableId } = req.body;

    if (!tableId || !mongoose.Types.ObjectId.isValid(tableId)) {
      const error = createHttpError(400, "Valid tableId is required!");
      return next(error);
    }

    const unpaidOrders = await Order.find({
      table: tableId,
      orderStatus: { $in: OPEN_ORDER_STATUSES_COMPAT }
    })
      .select("_id")
      .lean();

    const paidOrderIds = unpaidOrders.map((order) => order._id);

    if (paidOrderIds.length === 0) {
      return next(createHttpError(404, "Không có đơn OPEN để thanh toán cho bàn này"));
    }

    const now = new Date();
    await Order.updateMany(
      { _id: { $in: paidOrderIds } },
      {
        $set: {
          paid_at: now,
          paymentStatus: ORDER_PAYMENT_STATUS.PAID,
          orderStatus: ORDER_STATUS.COMPLETED,
          paymentMethod: ORDER_PAYMENT_METHOD.CASH,
          staff: getStaffDisplayName(req.user),
          closedAt: now,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Orders marked as paid",
      paidOrderIds
    });
  } catch (error) {
    next(error);
  }
};

const createVnpayPayment = async (req, res, next) => {
  try {
    if (!config.vnpTmnCode || !config.vnpHashSecret || !config.vnpUrl || !config.vnpReturnUrl) {
      return next(createHttpError(500, "VNPAY config is missing in environment variables"));
    }

    const { orderId } = req.body;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return next(createHttpError(400, "Valid orderId is required"));
    }

    const order = await Order.findById(orderId).lean();
    if (!order) {
      return next(createHttpError(404, "Order not found"));
    }

    if (!OPEN_ORDER_STATUSES_COMPAT.includes(`${order.orderStatus || ""}`)) {
      return next(createHttpError(400, "Only OPEN order can be paid"));
    }

    const amount = Number(order?.bills?.totalWithTax || 0);
    if (amount <= 0) {
      return next(createHttpError(400, "Order amount must be greater than 0"));
    }

    const txnRef = `${order._id}-${Date.now()}`;
    const createDate = getVnpDate();
    const expireDate = getVnpDate(new Date(Date.now() + 15 * 60 * 1000));
    let ipAddress =
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    // Convert IPv6 to IPv4
    ipAddress = convertIpv6ToIpv4(ipAddress);

    // Build VNPAY parameters according to official spec
    // Ref: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
    const vnpParams = {
      vnp_Version: "2.1.0",                                    // API version (Bắt buộc)
      vnp_Command: "pay",                                      // Command code (Bắt buộc)
      vnp_TmnCode: config.vnpTmnCode,                          // Terminal/Merchant code (Bắt buộc)
      vnp_Amount: Math.round(amount * 100),                    // Amount * 100 (Bắt buộc, khử thập phân)
      vnp_CreateDate: createDate,                              // Transaction create time yyyyMMddHHmmss GMT+7 (Bắt buộc)
      vnp_CurrCode: "VND",                                     // Currency code (Bắt buộc)
      vnp_IpAddr: ipAddress,                                   // Customer IP address (Bắt buộc)
      vnp_Locale: "vn",                                        // Language: vn=Tiếng Việt, en=English (Bắt buộc)
      vnp_OrderInfo: `Thanh toan don hang :${order._id}`,      // Order description - Tiếng Việt không dấu (Bắt buộc)
      vnp_OrderType: "other",                                  // Order category code (Bắt buộc)
      vnp_ReturnUrl: config.vnpReturnUrl,                      // Return URL after payment (Bắt buộc)
      vnp_TxnRef: txnRef,                                      // Transaction reference - unique per day (Bắt buộc)
      vnp_ExpireDate: expireDate,                              // Payment expiration time yyyyMMddHHmmss GMT+7 (Bắt buộc)
    };

    // vnp_BankCode: Optional - if not provided, user selects payment method on VNPAY page
    // Examples: "VNPAYQR" (QR), "VNBANK" (ATM), "INTCARD" (Visa/Master)

    // Save original params for database
    const originalParams = { ...vnpParams };

    // Sort and encode for signature
    const sortedParams = sortObject(vnpParams);

    const qs = require("qs");
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", config.vnpHashSecret);
    const signature = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    sortedParams["vnp_SecureHash"] = signature;
    const paymentUrl = config.vnpUrl + "?" + qs.stringify(sortedParams, { encode: false });

    console.log("📝 VNPAY Request Debug:");
    console.log("TMN Code:", config.vnpTmnCode);
    console.log("Hash Secret:", config.vnpHashSecret);
    console.log("Amount:", originalParams.vnp_Amount);
    console.log("IP Address:", ipAddress);
    console.log("TxnRef:", txnRef);
    console.log("CreateDate:", createDate);
    console.log("ExpireDate:", expireDate);
    console.log("Signature:", signature);
    console.log("Payment URL:", paymentUrl);

    await Payment.create({
      txnRef,
      orderId: `${order._id}`,
      amount,
      status: PAYMENT_STATUSES.PENDING,
      rawPayload: {
        createParams: originalParams,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        txnRef,
        paymentUrl,
        status: PAYMENT_STATUSES.PENDING,
      },
    });
  } catch (error) {
    console.error("❌ VNPAY Payment Creation Error:", error);
    next(error);
  }
};

const vnpayIpn = async (req, res, next) => {
  try {
    console.log("🔔 VNPAY IPN received:", req.query);

    if (!config.vnpHashSecret) {
      return next(createHttpError(500, "VNPAY hash secret is missing"));
    }

    const vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Save original values before sorting
    const originalValues = {
      txnRef: vnpParams.vnp_TxnRef,
      amount: Number(vnpParams.vnp_Amount || 0) / 100,
      responseCode: `${vnpParams.vnp_ResponseCode || ""}`,
      transactionNo: `${vnpParams.vnp_TransactionNo || ""}`,
      payDate: vnpParams.vnp_PayDate,
      bankCode: `${vnpParams.vnp_BankCode || ""}`,
    };

    const qs = require("qs");
    const sortedParams = sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const calculatedSignature = crypto
      .createHmac("sha512", config.vnpHashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");
    if (calculatedSignature !== secureHash) {
      return res.status(200).json({ RspCode: "97", Message: "Invalid checksum" });
    }

    const txnRef = originalValues.txnRef;
    const amount = originalValues.amount;
    const responseCode = originalValues.responseCode;
    const paymentStatus = mapVnpResponseToStatus(responseCode);
    const transactionNo = originalValues.transactionNo;
    const payDate = toDateFromVnpPayDate(originalValues.payDate);
    const bankCode = originalValues.bankCode;
    const payment = await Payment.findOne({ txnRef });
    if (!payment) {
      return res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }

    if (payment.status === PAYMENT_STATUSES.PAID && paymentStatus === PAYMENT_STATUSES.PAID) {
      return res.status(200).json({ RspCode: "02", Message: "Order already confirmed" });
    }

    if (Number(payment.amount) !== amount) {
      return res.status(200).json({ RspCode: "04", Message: "Invalid amount" });
    }

    payment.bankCode = bankCode || payment.bankCode;
    payment.transactionNo = transactionNo || payment.transactionNo;
    payment.payDate = payDate || payment.payDate;
    payment.status = paymentStatus;
    payment.rawPayload = {
      ...(payment.rawPayload || {}),
      ipnParams: req.query,
    };

    await payment.save();
    await updateOrderPaymentFromStatus(
      payment.orderId,
      paymentStatus,
      payDate,
      paymentStatus === PAYMENT_STATUSES.PAID ? ORDER_PAYMENT_METHOD.VNPAY : null
    );

    console.log(`✅ Payment updated via IPN: ${txnRef} - Status: ${paymentStatus}`);
    return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("❌ VNPAY IPN Error:", error);
    next(error);
  }
};

const vnpayReturn = async (req, res, next) => {
  try {
    if (!config.vnpHashSecret) {
      return next(createHttpError(500, "VNPAY hash secret is missing"));
    }

    const vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;

    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Save original values before sorting
    const originalValues = {
      txnRef: vnpParams.vnp_TxnRef,
      responseCode: `${vnpParams.vnp_ResponseCode || ""}`,
      amount: Number(vnpParams.vnp_Amount || 0) / 100,
      transactionNo: `${vnpParams.vnp_TransactionNo || ""}`,
      payDate: vnpParams.vnp_PayDate,
      bankCode: `${vnpParams.vnp_BankCode || ""}`,
    };

    const sortedParams = sortObject(vnpParams);

    const qs = require("qs");
    const signData = qs.stringify(sortedParams, { encode: false });
    const calculatedSignature = crypto
      .createHmac("sha512", config.vnpHashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (calculatedSignature !== secureHash) {
      return res.status(400).json({ success: false, message: "Invalid checksum" });
    }

    const txnRef = originalValues.txnRef;
    const responseCode = originalValues.responseCode;
    const paymentStatus = mapVnpResponseToStatus(responseCode);

    // Update payment record in database (since IPN won't work on localhost)
    const payment = await Payment.findOne({ txnRef });

    if (payment && payment.status === PAYMENT_STATUSES.PENDING) {
      payment.bankCode = originalValues.bankCode || payment.bankCode;
      payment.transactionNo = originalValues.transactionNo || payment.transactionNo;
      payment.payDate = toDateFromVnpPayDate(originalValues.payDate) || payment.payDate;
      payment.status = paymentStatus;
      payment.rawPayload = {
        ...(payment.rawPayload || {}),
        returnParams: req.query,
      };

      await payment.save();

      // Update order payment status
      await updateOrderPaymentFromStatus(
        payment.orderId,
        paymentStatus,
        payment.payDate,
        paymentStatus === PAYMENT_STATUSES.PAID ? ORDER_PAYMENT_METHOD.VNPAY : null
      );

      console.log(`✅ Payment updated via Return URL: ${txnRef} - Status: ${paymentStatus}`);
    }

    const frontendQuery = qs.stringify(req.query, { encode: true });
    const redirectUrl = `${config.vnpFrontendReturnUrl}?${frontendQuery}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("❌ VNPAY Return Error:", error);
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  webHookVerification,
  markTablePaid,
  createVnpayPayment,
  vnpayIpn,
  vnpayReturn,
};
