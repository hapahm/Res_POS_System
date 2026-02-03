const mongoose = require("mongoose");

/**
 * CHAT MESSAGE MODEL
 * Model lưu trữ toàn bộ tin nhắn chat giữa customer, staff và chatbot
 * 
 * Cấu trúc:
 * - sender: ID người gửi (User reference)
 * - senderRole: Vai trò người gửi (customer/staff)
 * - receiver: ID người nhận (có thể null nếu là tin từ chatbot)
 * - message: Nội dung tin nhắn
 * - messageType: Loại tin nhắn (user/chatbot/staff)
 * - conversationId: ID cuộc hội thoại (để nhóm tin nhắn)
 * - isRead: Trạng thái đã đọc
 * - createdAt: Thời gian tạo
 */

const chatMessageSchema = new mongoose.Schema({
    // Người gửi tin nhắn (tham chiếu đến User model)
    // Cho phép cả ObjectId (staff đã đăng ký) và string (khách test dùng UUID)
    sender: {
        type: mongoose.Schema.Types.Mixed,
        ref: "User",
        required: false
    },

    // Vai trò của người gửi: customer (khách) hoặc staff (nhân viên)
    senderRole: {
        type: String,
        enum: ["customer", "staff"],
        required: true
    },

    // Người nhận tin nhắn (có thể null nếu là tin nhắn từ chatbot)
    // Có thể là ObjectId (staff) hoặc string (customer UUID)
    receiver: {
        type: mongoose.Schema.Types.Mixed,
        ref: "User",
        default: null
    },

    // Nội dung tin nhắn
    message: {
        type: String,
        required: true
    },

    // Loại tin nhắn:
    // - "user": Tin nhắn từ người dùng thật (customer hoặc staff)
    // - "chatbot": Tin nhắn tự động từ bot
    // - "staff": Tin nhắn từ staff (để phân biệt khi cần)
    messageType: {
        type: String,
        enum: ["user", "chatbot", "staff"],
        required: true
    },

    // ID cuộc hội thoại (để nhóm các tin nhắn cùng conversation)
    // Format: "conv_customerID" hoặc "conv_customerID_staffID"
    conversationId: {
        type: String,
        required: true,
        index: true  // Tạo index để query nhanh
    },

    // Trạng thái đã đọc tin nhắn
    isRead: {
        type: Boolean,
        default: false
    },

    // Thời gian tạo tin nhắn
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    // Tự động tạo createdAt và updatedAt
    timestamps: true
});

// Tạo index composite để tìm kiếm nhanh theo conversationId và thời gian
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });

// Export model
module.exports = mongoose.model("ChatMessage", chatMessageSchema);
