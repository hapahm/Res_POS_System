const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, required: true },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

dishSchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Dish", dishSchema);
