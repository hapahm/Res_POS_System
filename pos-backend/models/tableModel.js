const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
    tableNo: { type: Number, required: true, unique: true },
    status: {
        type: String,
        default: "Available"
    },
    seats: {
        type: Number,
        required: true
    },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reservationAt: { type: Date, default: null },
    reservationNote: { type: String, default: "" },
    currentCustomer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    qrOrderUrl: { type: String, default: "" }
});

module.exports = mongoose.model("Table", tableSchema);