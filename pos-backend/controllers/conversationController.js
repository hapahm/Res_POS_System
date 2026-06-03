const createHttpError = require("http-errors");
const Conversation = require("../models/conversationModel");
const { normalizeRole } = require("../middlewares/tokenVerification");

const STAFF_ROLES = ["admin", "cashier", "waiter", "staff"];

const getConversationQueryForStaff = (staffId, role) => {
    if (normalizeRole(role) === "admin") {
        return {};
    }

    return {
        $or: [
            { staffId: null },
            { staffId }
        ]
    };
};

const getStaffConversations = async (req, res, next) => {
    try {
        const role = normalizeRole(req.user?.role);
        if (!STAFF_ROLES.includes(role)) {
            return next(createHttpError(403, "Chỉ staff mới được xem conversation"));
        }

        const query = getConversationQueryForStaff(req.user._id, role);
        const conversations = await Conversation.find(query)
            .sort({ lastMessageAt: -1 })
            .populate("customerId", "name email phone")
            .populate("staffId", "name email role")
            .lean();

        const data = conversations.map((conversation) => ({
            _id: conversation._id,
            customerId: conversation.customerId?._id || conversation.customerId,
            customer: conversation.customerId || null,
            staffId: conversation.staffId?._id || conversation.staffId || null,
            staff: conversation.staffId || null,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCount: conversation.unreadCount,
            createdAt: conversation.createdAt
        }));

        res.status(200).json({
            success: true,
            count: data.length,
            data
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStaffConversations
};
