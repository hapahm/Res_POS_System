/**
 * CHATBOT SERVICE
 * Hybrid service: Rule-based matching + AI fallback
 * 
 * Flow:
 * 1. Try rule-based intent matching (fast, no API cost)
 * 2. If no rule matches → call AI service for intent classification
 * 3. AI returns structured JSON with intent and parameters
 * 4. Backend executes database query based on intent
 * 5. Return formatted response to user
 */

const AIService = require('./ai.service');

/**
 * INTENTS - Các ý định người dùng có thể có
 * Mỗi intent gồm:
 * - keywords: Danh sách từ khóa để nhận diện intent
 * - responses: Danh sách câu trả lời (random để đa dạng)
 */
const INTENTS = {
    // Intent 1: Hỏi giờ mở cửa
    OPENING_HOURS: {
        keywords: [
            "giờ", "mở", "cửa", "mở cửa", "đóng cửa",
            "opening", "hours", "close", "timing", "time",
            "when", "open", "khi nào"
        ],
        responses: [
            "🕐 **Giờ mở cửa của nhà hàng:**\n\n" +
            "📅 Thứ Hai - Thứ Năm: 11:00 AM - 10:00 PM\n" +
            "🎉 Thứ Sáu - Thứ Bảy: 11:00 AM - 11:00 PM\n" +
            "☀️ Chủ Nhật: 12:00 PM - 9:00 PM\n\n" +
            "Hẹn gặp quý khách! 😊"
        ]
    },

    // Intent 2: Hỏi về menu
    MENU: {
        keywords: [
            "menu", "thực đơn", "món", "món ăn", "đồ ăn",
            "dishes", "items", "food", "serve", "phục vụ",
            "có gì", "bán gì", "order"
        ],
        responses: [
            "📋 **Thực đơn của chúng tôi:**\n\n" +
            "🍕 Pizza (nhiều loại)\n" +
            "🍔 Burger & Sandwich\n" +
            "🍜 Mì & Phở\n" +
            "🥗 Salad tươi\n" +
            "🍰 Tráng miệng\n" +
            "☕ Đồ uống\n\n" +
            "💡 Gõ 'gọi nhân viên' để được tư vấn chi tiết!"
        ]
    },

    // Intent 3: Kiểm tra trạng thái đơn hàng
    ORDER_STATUS: {
        keywords: [
            "đơn", "order", "status", "trạng thái", "đơn hàng",
            "where", "pending", "ready", "delivered", "đang ở đâu",
            "kiểm tra", "check", "track", "mã đơn"
        ],
        responses: [
            "📦 **Kiểm tra trạng thái đơn hàng:**\n\n" +
            "Vui lòng cung cấp **mã đơn hàng** của bạn\n" +
            "(Ví dụ: ORD123, ORD456)\n\n" +
            "💬 Hoặc gõ **'gọi nhân viên'** để được hỗ trợ tra cứu ngay!"
        ]
    },

    // Intent 3.5: Kiểm tra bàn trống
    TABLE_STATUS: {
        keywords: [
            "bàn", "table", "trống", "available", "đặt bàn",
            "reservation", "book", "chỗ", "seat", "còn bàn",
            "bàn nào", "số bàn"
        ],
        responses: [
            "🪑 **Kiểm tra bàn trống:**\n\n" +
            "Vui lòng cho biết **số bàn** bạn muốn kiểm tra\n" +
            "(Ví dụ: Bàn 1, Bàn 5, Bàn 10)\n\n" +
            "💬 Hoặc gõ **'gọi nhân viên'** để được tư vấn đặt bàn!"
        ]
    },

    // Intent 4: Yêu cầu gọi nhân viên
    CALL_STAFF: {
        keywords: [
            "call", "staff", "gọi", "nhân viên", "agent",
            "help", "human", "speak", "hỗ trợ", "người",
            "tư vấn", "support"
        ],
        responses: [
            "📞 **Đang kết nối với nhân viên...**\n\n" +
            "Vui lòng đợi trong giây lát!\n\n" +
            "Nếu không có nhân viên trực, chúng tôi sẽ phản hồi sớm nhất có thể. 😊"
        ]
    },

    // Intent 5: Hỏi về giá cả
    PRICING: {
        keywords: [
            "giá", "price", "cost", "bao nhiêu", "tiền",
            "how much", "expensive", "rẻ", "đắt"
        ],
        responses: [
            "💰 **Về giá cả:**\n\n" +
            "Giá các món ăn dao động từ:\n" +
            "🍕 Pizza: 120.000đ - 250.000đ\n" +
            "🍔 Burger: 80.000đ - 150.000đ\n" +
            "🍜 Mì/Phở: 60.000đ - 120.000đ\n\n" +
            "💬 Gõ 'menu' hoặc 'gọi nhân viên' để biết chi tiết!"
        ]
    },

    // Intent 6: Hỏi về địa chỉ
    LOCATION: {
        keywords: [
            "địa chỉ", "location", "address", "ở đâu", "where",
            "chỗ", "đường", "quận", "thành phố"
        ],
        responses: [
            "📍 **Địa chỉ nhà hàng:**\n\n" +
            "123 Đường Nguyễn Huệ, Quận 1\n" +
            "TP. Hồ Chí Minh\n\n" +
            "🚗 Có bãi đậu xe miễn phí\n" +
            "🚇 Gần ga metro Bến Thành\n\n" +
            "Hẹn gặp quý khách! 😊"
        ]
    },

    // Intent 7: Chào hỏi
    GREETING: {
        keywords: [
            "hello", "hi", "chào", "xin chào", "hey",
            "good morning", "good afternoon", "good evening"
        ],
        responses: [
            "👋 **Xin chào! Chào mừng đến với nhà hàng!**\n\n" +
            "Tôi có thể giúp gì cho bạn:\n" +
            "• 'giờ mở cửa' - Xem giờ hoạt động\n" +
            "• 'menu' - Xem thực đơn\n" +
            "• 'địa chỉ' - Xem vị trí\n" +
            "• 'gọi nhân viên' - Nói chuyện với nhân viên\n\n" +
            "😊 Hãy hỏi tôi bất cứ điều gì!"
        ]
    },

    // Intent 8: Cảm ơn
    THANKS: {
        keywords: [
            "cảm ơn", "thanks", "thank", "cám ơn", "thank you",
            "thanks you", "tks", "ty"
        ],
        responses: [
            "💖 **Rất vui được giúp đỡ bạn!**\n\n" +
            "Nếu cần hỗ trợ thêm, đừng ngại hỏi nhé! 😊"
        ]
    }
};

/**
 * Câu trả lời mặc định khi không hiểu câu hỏi
 * Sẽ liệt kê các lựa chọn có thể
 */
const FALLBACK_RESPONSE =
    "🤔 **Xin lỗi, tôi chưa hiểu câu hỏi của bạn.**\n\n" +
    "Tôi có thể giúp bạn về:\n" +
    "• 'giờ mở cửa' - Xem giờ hoạt động\n" +
    "• 'menu' - Xem thực đơn\n" +
    "• 'giá' - Thông tin giá cả\n" +
    "• 'địa chỉ' - Vị trí nhà hàng\n" +
    "• 'đơn hàng' - Kiểm tra đơn\n" +
    "• 'gọi nhân viên' - Nói chuyện với nhân viên\n\n" +
    "💬 Hãy gõ một trong các từ khóa trên!";

/**
 * CLASS CHATBOT SERVICE
 * Chứa các phương thức xử lý logic chatbot
 */
class ChatbotService {

    /**
     * Phân loại và trả lời tin nhắn người dùng
     * Hybrid: Rule-based first, then AI if no match
     * @param {string} userMessage - Tin nhắn từ người dùng
     * @returns {Promise<Object>} - { intent, response, requiresStaff, messageType, source }
     */
    static async classifyAndRespond(userMessage) {
        // Step 1: Try rule-based matching
        console.log(`\n🔍 === CLASSIFY MESSAGE ===`);
        console.log(`📝 User message: "${userMessage}"`);

        const lowerMessage = userMessage.toLowerCase().trim();

        // Duyệt qua từng intent để tìm keyword match
        for (const [intentName, intentData] of Object.entries(INTENTS)) {
            const matched = intentData.keywords.some(keyword =>
                lowerMessage.includes(keyword.toLowerCase())
            );

            if (matched) {
                console.log(`✅ Rule-based match found: ${intentName}`);

                // Random chọn 1 response từ danh sách
                const response = intentData.responses[
                    Math.floor(Math.random() * intentData.responses.length)
                ];

                return {
                    intent: intentName,
                    response: response,
                    requiresStaff: intentName === "CALL_STAFF",
                    messageType: "chatbot",
                    source: 'RULE_BASED'
                };
            }
        }

        // Step 2: Rule-based failed, try AI
        console.log(`⚠️ No rule-based match, trying AI...`);

        if (!AIService.shouldUseAI(userMessage)) {
            console.log(`⏭️ Message too short for AI, using fallback`);
            return {
                intent: "FALLBACK",
                response: FALLBACK_RESPONSE,
                requiresStaff: false,
                messageType: "chatbot",
                source: 'FALLBACK'
            };
        }

        try {
            // Call AI service for intent classification
            const aiResult = await AIService.classifyWithAI(userMessage);
            console.log(`🤖 AI classified intent: ${aiResult.intent} (source: ${aiResult.source})`);

            // Return AI classification with generic response
            // (database query will be handled by backend based on intent + parameters)
            return {
                intent: aiResult.intent,
                response: this.getResponseForIntent(aiResult.intent),
                parameters: aiResult.parameters,
                confidence: aiResult.confidence,
                requiresStaff: aiResult.requiresStaff,
                messageType: "chatbot",
                source: aiResult.source
            };

        } catch (error) {
            console.error(`❌ Error during AI classification:`, error.message);

            // Final fallback: request human help
            return {
                intent: "CALL_STAFF",
                response:
                    "📞 **Xin lỗi, tôi gặp vấn đề kỹ thuật.**\n\n" +
                    "Đang chuyển bạn đến nhân viên...",
                requiresStaff: true,
                messageType: "chatbot",
                source: 'ERROR_FALLBACK'
            };
        }
    }

    /**
     * Get generic response for an intent (used by AI classification)
     * @param {string} intent - Intent name
     * @returns {string} - Generic response
     */
    static getResponseForIntent(intent) {
        const responseMap = {
            'ORDER_STATUS': '📦 Đang kiểm tra trạng thái đơn hàng của bạn...',
            'TABLE_STATUS': '🪑 Đang kiểm tra trạng thái bàn...',
            'OPENING_HOURS': '🕐 Đang lấy giờ mở cửa...',
            'MENU': '📋 Đang tải thực đơn...',
            'PRICING': '💰 Đang lấy thông tin giá...',
            'ADDRESS': '📍 Đang lấy địa chỉ nhà hàng...',
            'CALL_STAFF': '📞 Đang kết nối với nhân viên...',
            'GREETING': '👋 Chào mừng đến nhà hàng! Có gì tôi có thể giúp?',
            'THANKS': '💖 Cảm ơn bạn! Hẹn gặp lại.',
            'FALLBACK': FALLBACK_RESPONSE
        };

        return responseMap[intent] || FALLBACK_RESPONSE;
    }

    /**
     * Đếm số lượng staff đang online
     * @param {Object} staffOnlineMap - Map lưu trạng thái online của staff
     * @returns {number} - Số lượng staff online
     */
    static getOnlineStaffCount(staffOnlineMap) {
        return Object.values(staffOnlineMap).filter(status => status === true).length;
    }

    /**
     * Kiểm tra xem có staff nào online không
     * @param {Object} staffOnlineMap - Map lưu trạng thái online của staff
     * @returns {boolean} - True nếu có staff online
     */
    static hasOnlineStaff(staffOnlineMap) {
        return this.getOnlineStaffCount(staffOnlineMap) > 0;
    }

    /**
     * Lấy danh sách staff ID đang online
     * @param {Object} staffOnlineMap - Map lưu trạng thái online của staff
     * @returns {Array} - Mảng các staff ID đang online
     */
    static getOnlineStaffIds(staffOnlineMap) {
        return Object.entries(staffOnlineMap)
            .filter(([_, isOnline]) => isOnline)
            .map(([staffId, _]) => staffId);
    }
}

// Export service
module.exports = ChatbotService;
