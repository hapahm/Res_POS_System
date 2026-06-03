const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    txnRef: { type: String, index: true },
    paymentId: String,
    orderId: String,
    amount: Number,
    currency: String,
    bankCode: String,
    transactionNo: String,
    payDate: Date,
    status: {
        type: String,
        enum: ["pending", "paid", "failed", "expired", "refunded"],
        default: "pending"
    },
    rawPayload: mongoose.Schema.Types.Mixed,
    method: String,
    email: String,
    contact: String,
    createdAt: Date
}, { timestamps: true })

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;