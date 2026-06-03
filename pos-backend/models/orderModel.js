const mongoose = require("mongoose");

const ORDER_STATUSES = ["PENDING_APPROVAL", "OPEN", "COMPLETED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PAID"];

const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pricePerQuantity: { type: Number, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    notes: { type: String, default: "" },
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", default: null },
    status: {
        type: String,
        enum: ["active", "cancelled"],
        default: "active"
    },
    cancelled_at: { type: Date, default: null },
    added_at: { type: Date, default: Date.now }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String, required: true },
        phone: { type: String, requried: true },
        guests: { type: Number, required: true },
    },
    orderStatus: {
        type: String,
        enum: ORDER_STATUSES,
        default: "OPEN",
        required: true
    },
    orderDate: {
        type: Date,
        default: () => new Date()
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true }
    },
    items: [orderItemSchema],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdByRole: {
        type: String,
        enum: ["admin", "cashier", "waiter", "customer", "staff"],
        default: "staff"
    },
    staff: {
        type: String,
        default: "N/A"
    },
    paymentMethod: String,
    paymentData: {
        razorpay_order_id: String,
        razorpay_payment_id: String
    },
    kitchenStatus: {
        type: String,
        enum: ['pending', 'preparing', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: PAYMENT_STATUSES,
        default: "UNPAID"
    },
    paid_at: {
        type: Date,
        default: null
    },
    closedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);