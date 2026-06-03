const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true
    },
    lastMessage: {
        type: String,
        default: ""
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    unreadCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

conversationSchema.index({ staffId: 1, lastMessageAt: -1 });
conversationSchema.index({ customerId: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
