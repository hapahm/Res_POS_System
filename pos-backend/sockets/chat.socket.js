/**
 * CHAT SOCKET HANDLER
 * Xử lý toàn bộ logic realtime chat qua Socket.IO
 * 
 * Luồng hoạt động:
 * 1. Customer/Staff kết nối → emit "user_connect"
 * 2. Customer gửi tin → emit "send_message"
 *    - Nếu có staff online → forward tin đến staff
 *    - Nếu không có staff → chatbot tự động reply
 * 3. Staff nhận tin → có thể reply qua "send_message"
 * 4. Load lịch sử chat → emit "get_chat_history"
 * 5. Ngắt kết nối → cập nhật trạng thái offline
 */

const ChatMessage = require("../models/chatMessageModel");
const Conversation = require("../models/conversationModel");
const ChatbotService = require("../services/chatbot.service");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const normalizeRole = (role = "") => `${role}`.trim().toLowerCase();
const isStaffRole = (role = "") => ["staff", "admin", "cashier", "waiter"].includes(normalizeRole(role));
const CHAT_ROOMS = {
    STAFF: "chat_staff_room",
    CUSTOMER: "chat_customer_room"
};
const GUEST_EMAIL_DOMAIN = "guest.chat.local";

/**
 * Biến global lưu trạng thái online của staff
 * Format: { userId: true/false }
 * - true: staff đang online
 * - false: staff offline
 */
const staffOnlineMap = {};
const STAFF_REQUEST_DEDUP_MS = 2500;
const recentStaffRequestMap = new Map();

/**
 * Biến lưu phiên chat đang active giữa customer-staff
 * Format: { customerId: staffId }
 * Dùng để route tin nhắn đến đúng staff đang chat
 */
const activeChats = {};
let chatbotUserCache = null;

const asObjectId = (id) => (isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null);

const normalizeGuestExternalId = (externalId = "") =>
    `${externalId}`.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);

const buildGuestEmail = (externalId) => {
    const normalized = normalizeGuestExternalId(externalId);
    return `guest_${normalized || "anonymous"}@${GUEST_EMAIL_DOMAIN}`;
};

const buildGuestPhone = (externalId) => {
    const normalized = normalizeGuestExternalId(externalId);
    const source = normalized || `guest${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
        hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
    }

    const digits = `${hash}`.padStart(10, "0").slice(0, 10);
    return digits === "0000000000" ? "0123456789" : digits;
};

async function findGuestUserByExternalId(externalId) {
    const guestEmail = buildGuestEmail(externalId);
    return User.findOne({ email: guestEmail, role: "customer" });
}

async function generateUniqueGuestPhone(externalId) {
    const base = buildGuestPhone(externalId);
    for (let attempt = 0; attempt < 50; attempt++) {
        const numeric = `${parseInt(base, 10) + attempt}`.replace(/\D/g, "").padStart(10, "0").slice(-10);
        const existed = await User.exists({ phone: numeric });
        if (!existed) {
            return numeric;
        }
    }

    return `${Date.now()}`.slice(-10);
}

async function getOrCreateGuestUser(externalId) {
    let guestUser = await findGuestUserByExternalId(externalId);
    if (guestUser) {
        return guestUser;
    }

    const normalized = normalizeGuestExternalId(externalId);
    const email = buildGuestEmail(externalId);
    const phone = await generateUniqueGuestPhone(externalId);

    try {
        guestUser = await User.create({
            name: `Guest ${normalized.slice(-6) || "User"}`,
            email,
            phone,
            password: `guest_${normalized || Date.now()}`,
            role: "customer",
            accountStatus: "approved"
        });
    } catch (error) {
        if (error?.code === 11000) {
            const existingByEmail = await User.findOne({ email, role: "customer" });
            if (existingByEmail) {
                return existingByEmail;
            }
        }
        throw error;
    }

    return guestUser;
}

async function ensureChatbotUser() {
    if (chatbotUserCache) {
        return chatbotUserCache;
    }

    let chatbotUser = await User.findOne({ role: "chatbot" }).select("_id name email role");
    if (!chatbotUser) {
        chatbotUser = await User.create({
            name: "POS Chatbot",
            email: "chatbot@pos.system",
            phone: "0000000000",
            password: `chatbot_${Date.now()}`,
            role: "chatbot",
            accountStatus: "approved"
        });
    }

    chatbotUserCache = chatbotUser;
    return chatbotUser;
}

async function findOrCreateConversation({ customerId, staffId = null }) {
    const customerObjectId = asObjectId(customerId);
    if (!customerObjectId) {
        throw new Error("customerId không hợp lệ");
    }

    const staffObjectId = asObjectId(staffId);
    let conversation = await Conversation.findOne({ customerId: customerObjectId }).sort({ updatedAt: -1 });

    if (!conversation) {
        conversation = await Conversation.create({
            customerId: customerObjectId,
            staffId: staffObjectId,
            lastMessage: "",
            lastMessageAt: new Date(),
            unreadCount: 0
        });
        return conversation;
    }

    if (!conversation.staffId && staffObjectId) {
        conversation.staffId = staffObjectId;
        await conversation.save();
    }

    return conversation;
}

async function updateConversationOnMessage({ conversationId, message, increaseUnread }) {
    const updatePayload = {
        lastMessage: message,
        lastMessageAt: new Date()
    };

    if (increaseUnread) {
        updatePayload.$inc = { unreadCount: 1 };
    }

    if (updatePayload.$inc) {
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: updatePayload.lastMessage,
            lastMessageAt: updatePayload.lastMessageAt,
            $inc: updatePayload.$inc
        });
        return;
    }

    await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: updatePayload.lastMessage,
        lastMessageAt: updatePayload.lastMessageAt
    });
}

async function createChatMessage({
    sender,
    senderRole,
    receiver,
    message,
    messageType,
    customerId,
    staffId,
    increaseUnread
}) {
    const conversation = await findOrCreateConversation({ customerId, staffId });
    const senderObjectId = asObjectId(sender);
    const receiverObjectId = asObjectId(receiver);

    if (!senderObjectId) {
        throw new Error("sender không hợp lệ");
    }

    const savedMessage = await ChatMessage.create({
        sender: senderObjectId,
        senderRole,
        receiver: receiverObjectId,
        message,
        messageType,
        conversationId: conversation._id
    });

    await updateConversationOnMessage({
        conversationId: conversation._id,
        message,
        increaseUnread
    });

    return { savedMessage, conversation };
}

async function resolveConversationForHistory({ conversationId, customerId }) {
    if (isValidObjectId(conversationId)) {
        const byId = await Conversation.findById(conversationId);
        if (byId) {
            return byId;
        }
    }

    const candidateCustomerId = customerId || conversationId;
    const resolvedCustomerId = asObjectId(candidateCustomerId);
    if (resolvedCustomerId) {
        return Conversation.findOne({ customerId: resolvedCustomerId }).sort({ updatedAt: -1 });
    }

    const guestUser = await findGuestUserByExternalId(candidateCustomerId);
    if (!guestUser) {
        return null;
    }

    return Conversation.findOne({ customerId: guestUser._id }).sort({ updatedAt: -1 });
}

/**
 * ============================================
 * REGEX PARAMETER EXTRACTION (FREE - No AI)
 * ============================================
 */

/**
 * Extract orderId từ message bằng regex
 * Pattern: ORD + số, hoặc ObjectId 24 chars
 * @param {string} message - User message
 * @returns {string|null} - orderId hoặc null
 */
function extractOrderId(message) {
    // Pattern 1: ORD123, ORD456, etc.
    const ordPattern = /ORD\d+/i;
    const ordMatch = message.match(ordPattern);
    if (ordMatch) return ordMatch[0];

    // Pattern 2: ObjectId 24 ký tự hex
    const objectIdPattern = /[0-9a-f]{24}/i;
    const objectIdMatch = message.match(objectIdPattern);
    if (objectIdMatch) return objectIdMatch[0];

    return null;
}

/**
 * Extract table number từ message bằng regex
 * Pattern: "bàn 5", "table 10", "số 3", v.v.
 * @param {string} message - User message
 * @returns {number|null} - table number hoặc null
 */
function extractTableNumber(message) {
    const lowerMsg = message.toLowerCase();

    // Pattern 1: "bàn 5", "bàn số 5"
    const banPattern = /b\u00e0n\s*(?:s\u1ed1\s*)?(\d+)/i;
    const banMatch = lowerMsg.match(banPattern);
    if (banMatch) return parseInt(banMatch[1]);

    // Pattern 2: "table 5", "table number 5"
    const tablePattern = /table\s*(?:number\s*)?(\d+)/i;
    const tableMatch = lowerMsg.match(tablePattern);
    if (tableMatch) return parseInt(tableMatch[1]);

    // Pattern 3: "số 5" (standalone)
    const soPattern = /s\u1ed1\s*(\d+)/i;
    const soMatch = lowerMsg.match(soPattern);
    if (soMatch) return parseInt(soMatch[1]);

    // Pattern 4: chỉ có số (1-100)
    const numPattern = /^(\d{1,2})$/;
    const numMatch = message.trim().match(numPattern);
    if (numMatch) {
        const num = parseInt(numMatch[1]);
        if (num >= 1 && num <= 100) return num;
    }

    return null;
}

/**
 * ============================================
 * DATABASE QUERY HELPERS (FREE VERSION)
 * ============================================
 */

/**
 * Xử lý câu hỏi về trạng thái đơn hàng
 * Extract orderId bằng REGEX (không cần AI)
 * @param {string} message - User message
 * @returns {Promise<Object>} - { found, response }
 */
async function handleOrderStatusQuery(message) {
    try {
        // Extract orderId bằng regex (FREE!)
        const orderId = extractOrderId(message);

        if (!orderId) {
            return {
                found: false,
                response: "📦 **Vui lòng cung cấp mã đơn hàng**\n\n" +
                    "Ví dụ: ORD123 hoặc 6970e98e5c51d222e69bdd6c"
            };
        }

        console.log(`🔍 Extracted orderId from message: ${orderId}`);

        // Query database for order (dùng ObjectId)
        let order = null;

        // Thử query bằng ObjectId
        if (isValidObjectId(orderId)) {
            order = await Order.findById(orderId);
        }

        // Nếu không tìm thấy và có pattern ORDxxx, thông báo
        if (!order) {
            return {
                found: true,
                response: `📦 **Không tìm thấy đơn hàng**: ${orderId}\n\n` +
                    `Vui lòng kiểm tra lại mã đơn hàng hoặc liên hệ nhân viên!`
            };
        }

        // Format order info
        const statusEmoji = {
            "pending": "⏳",
            "confirmed": "✅",
            "preparing": "👨‍🍳",
            "ready": "🍴",
            "served": "✨",
            "completed": "✅",
            "cancelled": "❌",
            "in process": "👨‍🍳"
        };

        const emoji = statusEmoji[order.orderStatus?.toLowerCase()] || "📦";

        // Format items
        const itemsList = order.items?.slice(0, 3).map(item =>
            `   • ${item.name} x${item.quantity} - ${item.price}đ`
        ).join('\n') || '   (Không có món)';

        return {
            found: true,
            response: `${emoji} **Đơn hàng #${orderId.slice(-6)}**\n\n` +
                `👤 Khách: ${order.customerDetails?.name || 'N/A'}\n` +
                `📅 Ngày đặt: ${new Date(order.orderDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}\n` +
                `📦 Trạng thái: **${order.orderStatus}**\n\n` +
                `🍽️ Món ăn:\n${itemsList}\n\n` +
                `💰 Tổng tiền: **${Math.round(order.bills?.totalWithTax || 0).toLocaleString('vi-VN')}đ**\n\n` +
                `Cảm ơn quý khách! 😊`
        };

    } catch (error) {
        console.error(`❌ Error querying order:`, error.message);
        return {
            found: true,
            response: "📦 Xin lỗi, có lỗi xảy ra khi tra cứu đơn hàng. Vui lòng thử lại!"
        };
    }
}

/**
 * Xử lý câu hỏi về trạng thái bàn
 * Extract tableNumber bằng REGEX (không cần AI)
 * @param {string} message - User message
 * @returns {Promise<Object>} - { found, response }
 */
async function handleTableStatusQuery(message) {
    try {
        // Extract table number bằng regex (FREE!)
        const tableNumber = extractTableNumber(message);

        if (!tableNumber) {
            return {
                found: false,
                response: "🪑 **Vui lòng cung cấp số bàn**\n\n" +
                    "Ví dụ: Bàn 5, Table 10, hoặc chỉ số: 5"
            };
        }

        console.log(`🔍 Extracted table number from message: ${tableNumber}`);

        // Query database for table
        const table = await Table.findOne({ tableNo: tableNumber });

        if (!table) {
            return {
                found: true,
                response: `🪑 **Không tìm thấy bàn số ${tableNumber}**\n\n` +
                    `Vui lòng kiểm tra lại số bàn hoặc liên hệ nhân viên!`
            };
        }

        const statusEmoji = {
            "available": "✅",
            "occupied": "👥",
            "reserved": "🔒",
            "booked": "🔒",
            "cleaning": "🧹"
        };

        const emoji = statusEmoji[table.status?.toLowerCase()] || "🪑";

        const statusText = table.status?.toLowerCase() === "available"
            ? "✅ **CÒN TRỐNG**"
            : `🔒 **${table.status}**`;

        return {
            found: true,
            response: `${emoji} **Bàn số ${tableNumber}**\n\n` +
                `${statusText}\n` +
                `👥 Số ghế: ${table.seats} người\n` +
                `${table.currentOrder ? `📦 Có đơn hàng hiện tại` : "📦 Chưa có đơn hàng"}\n\n` +
                `${table.status?.toLowerCase() === "available"
                    ? "✨ Bàn này sẵn sàng phục vụ quý khách!"
                    : "⚠️ Bàn đang được sử dụng. Vui lòng chọn bàn khác!"}`
        };

    } catch (error) {
        console.error(`❌ Error querying table:`, error.message);
        return {
            found: true,
            response: "🪑 Xin lỗi, có lỗi xảy ra khi tra cứu bàn. Vui lòng thử lại!"
        };
    }
}

/**
 * Xử lý bot response dựa trên intent từ AI
 * Thực hiện database query nếu cần dựa trên intent
 * @param {Object} botResponse - Response từ ChatbotService
 * @returns {Promise<Object>} - Updated response with database data
 */
async function processAIResponse(botResponse) {
    // Nếu không phải từ AI, trả về như bình thường
    if (botResponse.source !== 'AI') {
        return botResponse;
    }

    console.log(`🔍 Processing AI response for intent: ${botResponse.intent}`);

    // Thực hiện database query dựa trên intent
    switch (botResponse.intent) {
        case 'ORDER_STATUS':
            console.log(`🔎 Handling ORDER_STATUS with parameters:`, botResponse.parameters);
            const orderResponse = await handleOrderStatusQuery(botResponse.parameters);
            return {
                ...botResponse,
                response: orderResponse
            };

        case 'TABLE_STATUS':
            console.log(`🔎 Handling TABLE_STATUS with parameters:`, botResponse.parameters);
            const tableResponse = await handleTableStatusQuery(botResponse.parameters);
            return {
                ...botResponse,
                response: tableResponse
            };

        case 'MENU':
            return {
                ...botResponse,
                response: "📋 **Thực đơn của nhà hàng:**\n\n" +
                    "🍜 **Món mặn:**\n" +
                    "- Phở bò: 80.000đ\n" +
                    "- Cơm gà: 75.000đ\n" +
                    "- Bánh mì: 30.000đ\n\n" +
                    "🍰 **Tráng miệng:**\n" +
                    "- Kem ốc quế: 20.000đ\n" +
                    "- Bánh flan: 25.000đ\n\n" +
                    "Vui lòng liên hệ để xem thực đơn đầy đủ!"
            };

        case 'PRICING':
            return {
                ...botResponse,
                response: "💰 **Bảng giá thực đơn:**\n\n" +
                    "Các giá bao gồm VAT 10%\n" +
                    "Giao hàng thêm +30.000đ\n" +
                    "Nhóm ≥10 người giảm 10%\n\n" +
                    "Liên hệ: 0123456789 để biết thêm chi tiết!"
            };

        case 'ADDRESS':
            return {
                ...botResponse,
                response: "📍 **Địa chỉ nhà hàng:**\n\n" +
                    "🏘️ Số 123 Đường Nguyễn Huệ\n" +
                    "📍 Quận 1, TP. Hồ Chí Minh\n" +
                    "☎️ Hotline: 0123456789\n" +
                    "📧 Email: info@restaurant.com\n\n" +
                    "⏰ Giờ mở cửa: 10:00 - 22:00 (Tất cả các ngày)"
            };

        // Nếu là intents không cần query, giữ nguyên response
        default:
            return botResponse;
    }
}

async function getCustomerInfo(customerId) {
    if (!isValidObjectId(customerId)) {
        return null;
    }

    return User.findById(customerId).select("name email phone");
}

async function emitStaffRequest(io, { customerId, conversationId, message, source = "unknown" }) {
    const dedupKey = `${customerId}:${conversationId}`;
    const now = Date.now();
    const lastRequestAt = recentStaffRequestMap.get(dedupKey) || 0;

    if (now - lastRequestAt < STAFF_REQUEST_DEDUP_MS) {
        return {
            customerId,
            conversationId,
            message: message || "Khách hàng yêu cầu hỗ trợ từ nhân viên",
            timestamp: new Date().toISOString(),
            source,
            deduped: true
        };
    }

    recentStaffRequestMap.set(dedupKey, now);

    // Dọn dữ liệu cũ để tránh map tăng không giới hạn.
    for (const [key, value] of recentStaffRequestMap.entries()) {
        if (now - value > STAFF_REQUEST_DEDUP_MS * 4) {
            recentStaffRequestMap.delete(key);
        }
    }

    const customerInfo = await getCustomerInfo(customerId);
    const payload = {
        customerId,
        customerName: customerInfo ? customerInfo.name : `Khách hàng ${customerId}`,
        customerInfo,
        conversationId,
        message: message || "Khách hàng yêu cầu hỗ trợ từ nhân viên",
        timestamp: new Date().toISOString(),
        source,
        deduped: false
    };

    io.to(CHAT_ROOMS.STAFF).emit("staff_request", payload);
    io.to(CHAT_ROOMS.STAFF).emit("customer_chat_activity", {
        customerId,
        customerName: payload.customerName,
        conversationId,
        lastMessage: payload.message,
        timestamp: payload.timestamp,
        activityType: "staff_request"
    });

    io.to(`user_${customerId}`).emit("staff_request_sent", {
        conversationId,
        status: "pending",
        onlineStaffCount: ChatbotService.getOnlineStaffCount(staffOnlineMap),
        message: "Đã gửi yêu cầu hỗ trợ đến nhân viên"
    });

    return payload;
}

/**
 * MAIN SOCKET HANDLER
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const chatSocketHandler = (io) => {
    // Lắng nghe sự kiện kết nối mới
    io.on("connection", async (socket) => {
        console.log(`🔌 Client mới kết nối: ${socket.id}`);

        // ==========================================
        // EVENT 1: USER CONNECT (Authentication)
        // ==========================================
        /**
         * Client emit event này khi kết nối để xác thực
         * Data: { userId, role }
         */
        socket.on("user_connect", async (userData) => {
            try {
                const { userId, role } = userData;
                const normalizedRole = normalizeRole(role);
                const rawUserId = `${userId}`;
                const isGuestExternalId = !isValidObjectId(rawUserId);

                // Validate dữ liệu
                if (!userId || !normalizedRole) {
                    socket.emit("error", { message: "Thiếu userId hoặc role" });
                    return;
                }

                let existingUser = null;
                if (isValidObjectId(rawUserId)) {
                    existingUser = await User.findById(rawUserId).select("_id role");
                } else if (normalizedRole === "customer") {
                    existingUser = await getOrCreateGuestUser(rawUserId);
                }

                if (!existingUser) {
                    socket.emit("error", { message: "User không tồn tại hoặc không hợp lệ" });
                    return;
                }

                if (isGuestExternalId && normalizedRole !== "customer") {
                    socket.emit("error", { message: "Guest chỉ được kết nối với role customer" });
                    return;
                }

                const resolvedUserId = `${existingUser._id}`;
                const resolvedRole = normalizeRole(existingUser.role || normalizedRole);

                if (isGuestExternalId) {
                    console.log(`👤 Guest mapped: external=${rawUserId} -> userId=${resolvedUserId}`);
                }

                // Gắn thông tin user vào socket (dùng cho các event sau)
                socket.userId = resolvedUserId;
                socket.userRole = resolvedRole;
                socket.externalUserId = rawUserId;

                // Join room riêng theo userId (để gửi tin cá nhân)
                socket.join(`user_${resolvedUserId}`);
                if (resolvedRole === "customer") {
                    socket.join(CHAT_ROOMS.CUSTOMER);
                }

                // Nếu là staff → đánh dấu online và join staff room
                if (isStaffRole(resolvedRole)) {
                    staffOnlineMap[resolvedUserId] = true;
                    socket.join(CHAT_ROOMS.STAFF);

                    // Broadcast số lượng staff online đến tất cả client
                    io.emit("staff_status_update", {
                        onlineStaffCount: ChatbotService.getOnlineStaffCount(staffOnlineMap)
                    });

                    console.log(`👨‍💼 Staff ${resolvedUserId} đã online và join ${CHAT_ROOMS.STAFF}`);
                    console.log(`📊 Tổng staff online:`, Object.keys(staffOnlineMap).length);
                }

                // Gửi xác nhận kết nối thành công
                socket.emit("connection_success", {
                    message: "Kết nối thành công",
                    role: resolvedRole,
                    userId: resolvedUserId
                });

            } catch (error) {
                console.error("❌ Lỗi khi kết nối:", error);
                socket.emit("error", { message: "Kết nối thất bại" });
            }
        });

        // ==========================================
        // EVENT 2: SEND MESSAGE (Gửi tin nhắn)
        // ==========================================
        /**
         * Client emit event này để gửi tin nhắn
         * Data: { message, conversationId, targetCustomerId? }
         */
        socket.on("send_message", async (data) => {
            try {
                const { message, conversationId, targetCustomerId } = data;
                const senderId = socket.userId;
                const senderRole = socket.userRole;

                console.log(`💬 send_message context | senderId=${senderId} | senderRole=${senderRole} | conversationId=${conversationId}`);

                // Validate
                if (!message || !senderId || !conversationId) {
                    socket.emit("error", { message: "Thiếu thông tin tin nhắn" });
                    return;
                }

                // ===== XỬ LÝ KHI CUSTOMER GỬI TIN =====
                if (senderRole === "customer") {

                    // Check if customer has an active staff session
                    const assignedStaffId = activeChats[senderId];

                    // CASE 1: Customer has active staff → send to staff
                    if (assignedStaffId) {
                        console.log(`📞 Customer ${senderId} has active staff ${assignedStaffId}`);

                        // Lưu tin nhắn customer vào DB
                        try {
                            console.log(`💾 Lưu tin từ customer ${senderId} (CASE 1)...`);
                            const { savedMessage: customerMsg, conversation } = await createChatMessage({
                                sender: senderId,
                                senderRole: "customer",
                                receiver: assignedStaffId,
                                message,
                                messageType: "user",
                                customerId: senderId,
                                staffId: assignedStaffId,
                                increaseUnread: true
                            });
                            console.log(`✅ Tin customer đã lưu thành công (ID: ${customerMsg._id})`);
                            console.log(`📊 Message details:`, {
                                _id: customerMsg._id,
                                sender: customerMsg.sender,
                                senderRole: customerMsg.senderRole,
                                receiver: customerMsg.receiver,
                                message: customerMsg.message,
                                messageType: customerMsg.messageType,
                                conversationId: conversationId,
                                conversationRefId: conversation._id,
                                createdAt: customerMsg.createdAt
                            });

                            // Lấy thông tin customer (nếu là ObjectId)
                            let customerInfo = null;
                            if (isValidObjectId(senderId)) {
                                customerInfo = await User.findById(senderId).select("name email phone");
                            }

                            io.to(CHAT_ROOMS.STAFF).emit("customer_chat_activity", {
                                customerId: senderId,
                                customerName: customerInfo ? customerInfo.name : `Khách hàng ${senderId}`,
                                conversationId,
                                lastMessage: message,
                                timestamp: new Date().toISOString()
                            });

                            // Gửi tin nhắn realtime đến staff
                            io.to(`user_${assignedStaffId}`).emit("receive_message", {
                                ...customerMsg.toObject(),
                                sender: senderId,
                                senderRole: "customer",
                                senderName: customerInfo ? customerInfo.name : `Khách hàng ${senderId}`,
                                senderInfo: customerInfo,
                                conversationId: conversationId,
                                conversationRefId: conversation._id
                            });

                            // Xác nhận đã gửi cho customer
                            socket.emit("message_sent", {
                                success: true,
                                messageType: "user"
                            });

                            console.log(`💬 Tin từ customer ${senderId} → staff ${assignedStaffId}`);
                        } catch (saveError) {
                            console.error(`❌ Lỗi lưu tin customer (CASE 1):`, saveError.message);
                            socket.emit("error", { message: "Không thể lưu tin nhắn: " + saveError.message });
                        }
                    }
                    // CASE 2: No active staff → route through chatbot
                    else {
                        console.log(`🤖 Customer ${senderId} has no active staff, routing to chatbot`);

                        // Always route through chatbot (staff online status doesn't matter)
                        // Only notify staff when customer explicitly requests help (CALL_STAFF intent)
                        try {
                            // Lưu tin nhắn customer vào DB
                            console.log(`💾 Lưu tin từ customer ${senderId}...`);
                            const { conversation } = await createChatMessage({
                                sender: senderId,
                                senderRole: "customer",
                                receiver: null,
                                message,
                                messageType: "user",
                                customerId: senderId,
                                staffId: activeChats[senderId] || null,
                                increaseUnread: true
                            });
                            console.log(`✅ Tin customer đã lưu vào conversation ${conversation._id}`);

                            let customerInfo = null;
                            if (isValidObjectId(senderId)) {
                                customerInfo = await User.findById(senderId).select("name email phone");
                            }

                            io.to(CHAT_ROOMS.STAFF).emit("customer_chat_activity", {
                                customerId: senderId,
                                customerName: customerInfo ? customerInfo.name : `Khách hàng ${senderId}`,
                                conversationId,
                                lastMessage: message,
                                timestamp: new Date().toISOString()
                            });

                            // ==========================================
                            // CHECK REGEX FIRST (FREE - No AI cost!)
                            // ==========================================
                            let botResponse = null;
                            let directQueryHandled = false;

                            // Check 1: Order status query?
                            if (message.match(/đơn|order|ORD|trạng thái|status|[0-9a-f]{24}/i)) {
                                const orderResult = await handleOrderStatusQuery(message);
                                if (orderResult.found) {
                                    console.log(`✅ REGEX: Handled order query (FREE)`);
                                    botResponse = {
                                        intent: "ORDER_STATUS",
                                        response: orderResult.response,
                                        requiresStaff: false,
                                        messageType: "chatbot",
                                        source: "REGEX_FREE"
                                    };
                                    directQueryHandled = true;
                                }
                            }

                            // Check 2: Table status query?
                            if (!directQueryHandled && message.match(/bàn|table|trống|available|chỗ|số \d+|^\d{1,2}$/i)) {
                                const tableResult = await handleTableStatusQuery(message);
                                if (tableResult.found) {
                                    console.log(`✅ REGEX: Handled table query (FREE)`);
                                    botResponse = {
                                        intent: "TABLE_STATUS",
                                        response: tableResult.response,
                                        requiresStaff: false,
                                        messageType: "chatbot",
                                        source: "REGEX_FREE"
                                    };
                                    directQueryHandled = true;
                                }
                            }

                            // If not handled by regex, use chatbot/AI
                            if (!directQueryHandled) {
                                botResponse = await ChatbotService.classifyAndRespond(message);
                                console.log(`🤖 Chatbot response:`, botResponse);

                                // If AI classified, process database queries
                                if (botResponse.source === 'AI') {
                                    botResponse = await processAIResponse(botResponse);
                                    console.log(`✅ AI response processed with database query`);
                                }
                            }

                            // Lưu tin trả lời của chatbot vào DB
                            console.log(`💾 Lưu tin từ chatbot...`);
                            const chatbotUser = await ensureChatbotUser();
                            const { savedMessage: chatbotMsg } = await createChatMessage({
                                sender: chatbotUser._id,
                                senderRole: "chatbot",
                                receiver: senderId,
                                message: botResponse.response,
                                messageType: "chatbot",
                                customerId: senderId,
                                staffId: activeChats[senderId] || null,
                                increaseUnread: false
                            });
                            console.log(`✅ Tin chatbot đã lưu (ID: ${chatbotMsg._id})`);

                            // Gửi tin chatbot realtime đến customer
                            socket.emit("receive_message", {
                                ...chatbotMsg.toObject(),
                                senderName: "🤖 POS Bot",
                                senderRole: "chatbot",
                                intent: botResponse.intent,
                                conversationId
                            });

                            console.log(`🤖 Chatbot trả lời customer ${senderId} (Intent: ${botResponse.intent})`);

                            // Nếu customer yêu cầu gọi staff → notify staff room
                            if (botResponse.requiresStaff) {
                                const staffRoomData = await emitStaffRequest(io, {
                                    customerId: senderId,
                                    conversationId,
                                    message: "Khách hàng yêu cầu hỗ trợ từ nhân viên",
                                    source: "chatbot_intent"
                                });

                                console.log(`\n📢 === BROADCAST STAFF_REQUEST ===`);
                                console.log(`📊 Staff online:`, Object.keys(staffOnlineMap));
                                console.log(`📊 Staff count:`, io.sockets.adapter.rooms.get(CHAT_ROOMS.STAFF)?.size || 0);
                                console.log(`📤 Gửi data:`, JSON.stringify(staffRoomData, null, 2));

                                console.log(`📞 Customer ${senderId} yêu cầu gọi staff`);
                                console.log(`===================================\n`);
                            }
                        } catch (dbError) {
                            console.error(`❌ Lỗi khi lưu tin nhắn:`, dbError);
                            console.error(`❌ Error details - Message: ${dbError.message}, Stack: ${dbError.stack}`);
                            socket.emit("error", { message: "Không thể lưu tin nhắn: " + dbError.message });
                        }
                    }
                }

                // ===== XỬ LÝ KHI STAFF GỬI TIN =====
                else if (isStaffRole(senderRole)) {

                    // Staff cần chỉ định customer nhận tin (targetCustomerId)
                    if (!targetCustomerId) {
                        socket.emit("error", { message: "Thiếu targetCustomerId" });
                        return;
                    }

                    // Lưu tin nhắn staff vào DB
                    const { savedMessage, conversation } = await createChatMessage({
                        sender: senderId,
                        senderRole: "staff",
                        receiver: targetCustomerId,
                        message,
                        messageType: "staff",
                        customerId: targetCustomerId,
                        staffId: senderId,
                        increaseUnread: false
                    });

                    // Lấy thông tin staff (chỉ khi senderId là ObjectId)
                    let staffInfo = null;
                    if (isValidObjectId(senderId)) {
                        staffInfo = await User.findById(senderId).select("name email");
                    }

                    // Gửi tin nhắn realtime đến customer
                    io.to(`user_${targetCustomerId}`).emit("receive_message", {
                        ...savedMessage.toObject(),
                        senderName: staffInfo ? staffInfo.name : "Nhân viên",
                        senderInfo: staffInfo,
                        conversationId,
                        conversationRefId: conversation._id
                    });

                    // Xác nhận đã gửi cho staff
                    socket.emit("message_sent", {
                        success: true,
                        messageType: "staff"
                    });

                    console.log(`👨‍💼 Tin từ staff ${senderId} → customer ${targetCustomerId}`);
                }

            } catch (error) {
                console.error("❌ Lỗi khi gửi tin nhắn:", error);
                socket.emit("error", { message: "Gửi tin nhắn thất bại", error: error.message });
            }
        });

        // ==========================================
        // EVENT 2.5: REQUEST STAFF (Customer gọi nhân viên)
        // ==========================================
        /**
         * Customer emit event này để gọi nhân viên rõ ràng
         * Data: { conversationId, message? }
         */
        socket.on("request_staff", async (data = {}) => {
            try {
                const senderId = socket.userId;
                const senderRole = socket.userRole;
                const { conversationId, message } = data;

                if (senderRole !== "customer") {
                    socket.emit("error", { message: "Chỉ customer mới được gọi nhân viên" });
                    return;
                }

                if (!senderId || !conversationId) {
                    socket.emit("error", { message: "Thiếu senderId hoặc conversationId" });
                    return;
                }

                const assignedStaffId = activeChats[senderId];
                if (assignedStaffId) {
                    let staffInfo = null;
                    if (isValidObjectId(assignedStaffId)) {
                        staffInfo = await User.findById(assignedStaffId).select("name email");
                    }

                    socket.emit("staff_joined", {
                        staffId: assignedStaffId,
                        staffName: staffInfo ? staffInfo.name : "Nhân viên",
                        staffInfo,
                        conversationId,
                        message: `${staffInfo ? staffInfo.name : "Nhân viên"} đang hỗ trợ bạn`
                    });
                    return;
                }

                const staffRequestData = await emitStaffRequest(io, {
                    customerId: senderId,
                    conversationId,
                    message: message || "Khách hàng yêu cầu hỗ trợ từ nhân viên",
                    source: "explicit_request"
                });

                console.log(`📞 Customer ${senderId} gửi request_staff`);
                console.log(`📤 staff_request payload:`, JSON.stringify(staffRequestData, null, 2));
            } catch (error) {
                console.error("❌ Lỗi request_staff:", error);
                socket.emit("error", { message: "Không thể gửi yêu cầu đến nhân viên" });
            }
        });

        // ==========================================
        // EVENT 3: STAFF ACCEPT CHAT (Staff nhận chat)
        // ==========================================
        /**
         * Staff emit event này để chính thức nhận chat với customer
         * Data: { customerId, conversationId }
         */
        socket.on("accept_chat", async (data) => {
            try {
                const { customerId, conversationId } = data;
                const staffId = socket.userId;

                // Validate
                if (!customerId || !conversationId) {
                    socket.emit("error", { message: "Thiếu thông tin chat" });
                    return;
                }

                // Lưu phiên chat active
                activeChats[customerId] = staffId;

                const acceptedConversation = await findOrCreateConversation({
                    customerId,
                    staffId
                });
                if (!acceptedConversation.staffId || `${acceptedConversation.staffId}` !== `${staffId}`) {
                    acceptedConversation.staffId = asObjectId(staffId);
                    await acceptedConversation.save();
                }

                // Staff join room của conversation
                socket.join(`chat_${conversationId}`);

                // Lấy thông tin staff (chỉ khi staffId là ObjectId)
                let staffInfo = null;
                if (isValidObjectId(staffId)) {
                    staffInfo = await User.findById(staffId).select("name email");
                }

                // Thông báo cho customer rằng staff đã join
                io.to(`user_${customerId}`).emit("staff_joined", {
                    staffId: staffId,
                    staffName: staffInfo ? staffInfo.name : "Nhân viên",
                    staffInfo: staffInfo,
                    conversationId: conversationId,
                    message: `${staffInfo ? staffInfo.name : "Nhân viên"} đã tham gia hỗ trợ bạn`
                });

                // Xác nhận cho staff
                socket.emit("chat_accepted", {
                    customerId: customerId,
                    conversationId: conversationId,
                    conversationRefId: acceptedConversation._id
                });

                console.log(`✅ Staff ${staffId} đã nhận chat với customer ${customerId}`);

            } catch (error) {
                console.error("❌ Lỗi khi accept chat:", error);
                socket.emit("error", { message: "Không thể nhận chat" });
            }
        });

        // ==========================================
        // EVENT 4: GET CHAT HISTORY (Lấy lịch sử chat)
        // ==========================================
        /**
         * Client emit event này để load lịch sử chat
         * Data: { conversationId, limit? }
         */
        socket.on("get_chat_history", async (data) => {
            try {
                const { conversationId, limit = 50 } = data;

                // Validate
                if (!conversationId) {
                    socket.emit("error", { message: "Thiếu conversationId" });
                    return;
                }

                console.log(`\n📜 === QUERY CHAT HISTORY ===`);
                console.log(`🔍 conversationId: ${conversationId}`);
                console.log(`📊 limit: ${limit}`);

                const conversationDoc = await resolveConversationForHistory({
                    conversationId,
                    customerId: socket.userRole === "customer" ? socket.userId : conversationId
                });

                if (!conversationDoc) {
                    socket.emit("chat_history", {
                        conversationId,
                        messages: [],
                        count: 0
                    });
                    return;
                }

                const messages = await ChatMessage.find({ conversationId: conversationDoc._id })
                    .sort({ createdAt: 1 }) // Sắp xếp từ cũ đến mới
                    .limit(limit)
                    .populate("sender", "name email role")
                    .populate("receiver", "name email role")
                    .lean();

                console.log(`✅ Query thành công, tìm được ${messages.length} tin nhắn`);

                if (messages.length > 0) {
                    console.log(`📋 First message:`, messages[0]);
                    console.log(`📋 Last message:`, messages[messages.length - 1]);
                }

                const enrichedMessages = messages.map((msg) => ({
                    ...msg,
                    conversationRefId: conversationDoc._id,
                    conversationId,
                    senderInfo: msg.sender || null,
                    receiverInfo: msg.receiver || null,
                    sender: msg.sender?._id || msg.sender,
                    receiver: msg.receiver?._id || msg.receiver
                }));

                console.log(`📤 Gửi ${enrichedMessages.length} tin nhắn cho client`);

                // Gửi lịch sử chat về client
                socket.emit("chat_history", {
                    conversationId: conversationId,
                    messages: enrichedMessages,
                    count: enrichedMessages.length
                });

                console.log(`✅ Chat history event đã emit thành công`);
                console.log(`===========================\n`);

            } catch (error) {
                console.error("❌ Lỗi khi load lịch sử chat:", error);
                socket.emit("error", { message: "Không thể tải lịch sử chat" });
            }
        });

        // ==========================================
        // EVENT 5: MARK AS READ (Đánh dấu đã đọc)
        // ==========================================
        /**
         * Client emit event này để đánh dấu tin nhắn đã đọc
         * Data: { messageIds: [...] }
         */
        socket.on("mark_as_read", async (data) => {
            try {
                const { messageIds } = data;

                if (!messageIds || !Array.isArray(messageIds)) {
                    socket.emit("error", { message: "messageIds phải là array" });
                    return;
                }

                // Update isRead = true cho các tin nhắn
                await ChatMessage.updateMany(
                    { _id: { $in: messageIds } },
                    { $set: { isRead: true } }
                );

                const relatedMessages = await ChatMessage.find({ _id: { $in: messageIds } }).select("conversationId");
                const conversationIds = [...new Set(relatedMessages.map((item) => `${item.conversationId}`))]
                    .filter((id) => isValidObjectId(id));

                if (conversationIds.length) {
                    await Conversation.updateMany(
                        { _id: { $in: conversationIds } },
                        { $set: { unreadCount: 0 } }
                    );
                }

                socket.emit("mark_read_success", { count: messageIds.length });

                console.log(`✅ Đã đánh dấu ${messageIds.length} tin nhắn là đã đọc`);

            } catch (error) {
                console.error("❌ Lỗi khi mark as read:", error);
                socket.emit("error", { message: "Không thể đánh dấu đã đọc" });
            }
        });

        // ==========================================
        // EVENT 6: GET ACTIVE CONVERSATIONS (Lấy danh sách cuộc hội thoại)
        // ==========================================
        /**
         * Staff emit event này để lấy danh sách customer đang chờ chat
         */
        socket.on("get_active_conversations", async () => {
            try {
                // Chỉ staff mới được xem
                if (!isStaffRole(socket.userRole)) {
                    socket.emit("error", { message: "Chỉ staff mới có quyền xem" });
                    return;
                }

                const conversations = await Conversation.find({
                    $or: [
                        { staffId: null },
                        { staffId: asObjectId(socket.userId) }
                    ]
                })
                    .sort({ lastMessageAt: -1 })
                    .limit(100)
                    .populate("customerId", "name email phone")
                    .lean();

                const mappedConversations = conversations.map((conversation) => {
                    const customer = conversation.customerId;
                    return {
                        id: `${conversation.customerId?._id || conversation.customerId}`,
                        conversationId: `${conversation.customerId?._id || conversation.customerId}`,
                        conversationRefId: conversation._id,
                        customerId: `${conversation.customerId?._id || conversation.customerId}`,
                        customerName: customer?.name || `Khách hàng ${conversation.customerId}`,
                        customerInfo: customer || null,
                        staffId: conversation.staffId,
                        lastMessage: conversation.lastMessage,
                        lastMessageTime: conversation.lastMessageAt,
                        unreadCount: conversation.unreadCount
                    };
                });

                socket.emit("active_conversations", {
                    conversations: mappedConversations,
                    count: mappedConversations.length
                });

                console.log(`📋 Đã gửi ${mappedConversations.length} conversations cho staff ${socket.userId}`);

            } catch (error) {
                console.error("❌ Lỗi khi get conversations:", error);
                socket.emit("error", { message: "Không thể tải conversations" });
            }
        });

        // ==========================================
        // EVENT 7: DISCONNECT (Ngắt kết nối)
        // ==========================================
        socket.on("disconnect", () => {
            const userId = socket.userId;
            const userRole = socket.userRole;

            // Nếu là staff → cập nhật trạng thái offline
            if (isStaffRole(userRole) && userId) {
                delete staffOnlineMap[userId];

                // Broadcast số lượng staff online mới
                io.emit("staff_status_update", {
                    onlineStaffCount: ChatbotService.getOnlineStaffCount(staffOnlineMap)
                });

                console.log(`👨‍💼 Staff ${userId} đã offline`);
            }

            // Xóa khỏi active chats
            Object.keys(activeChats).forEach((customerId) => {
                if (activeChats[customerId] === userId) {
                    delete activeChats[customerId];
                }
            });

            console.log(`🔌 Client ${socket.id} đã ngắt kết nối`);
        });
    });
};

// Export handler
module.exports = chatSocketHandler;
