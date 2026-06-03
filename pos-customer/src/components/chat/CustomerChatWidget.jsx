import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import {
    connectSocket,
    disconnectSocket,
    sendMessage,
    getChatHistory,
    requestStaff,
    onConnectionSuccess,
    onReceiveMessage,
    onChatHistory,
    onStaffJoined,
    onStaffStatusUpdate,
    onStaffRequestSent,
    onSocketError,
    offConnectionSuccess,
    offReceiveMessage,
    offChatHistory,
    offStaffJoined,
    offStaffStatusUpdate,
    offStaffRequestSent,
    offSocketError
} from '../../services/chatSocket';

const GUEST_CHAT_ID_KEY = 'pos_guest_chat_customer_id';

const generateGuestId = () => {
    return `guest_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
};

const getOrCreateGuestId = () => {
    const storedId = localStorage.getItem(GUEST_CHAT_ID_KEY);
    if (storedId) return storedId;

    const newId = generateGuestId();
    localStorage.setItem(GUEST_CHAT_ID_KEY, newId);
    return newId;
};

const normalizeIncomingMessage = (rawMessage, fallbackConversationId) => {
    const isBotMessage =
        rawMessage?.messageType === 'chatbot' ||
        rawMessage?.sender === 'chatbot' ||
        rawMessage?.senderRole === 'chatbot';

    const senderRole = isBotMessage
        ? 'bot'
        : rawMessage?.senderRole || rawMessage?.messageType || 'staff';

    return {
        id: rawMessage?._id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        conversationId: rawMessage?.conversationId || fallbackConversationId,
        message: rawMessage?.message || '',
        senderRole,
        senderName: rawMessage?.senderName || (senderRole === 'bot' ? 'POS Bot' : senderRole === 'staff' ? 'Nhân viên' : 'Bạn'),
        timestamp: rawMessage?.createdAt || rawMessage?.timestamp || new Date().toISOString()
    };
};

const CustomerChatWidget = () => {
    const { _id: authUserId, name: authName } = useSelector((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [staffStatus, setStaffStatus] = useState('bot');
    const [onlineStaffCount, setOnlineStaffCount] = useState(0);

    const customerId = useMemo(() => authUserId || getOrCreateGuestId(), [authUserId]);
    const customerName = authName || `Khách ${customerId.slice(0, 6)}`;
    const conversationId = customerId;

    useEffect(() => {
        const socket = connectSocket(customerId, 'customer');

        const handleConnectionSuccess = () => {
            setIsConnected(true);
            getChatHistory(conversationId);
        };

        const handleReceiveMessage = (data) => {
            const normalizedMessage = normalizeIncomingMessage(data, conversationId);
            setMessages((prev) => [...prev, normalizedMessage]);
        };

        const handleChatHistory = (data) => {
            const historyMessages = (data?.messages || []).map((item) =>
                normalizeIncomingMessage(item, conversationId)
            );
            setMessages(historyMessages);
        };

        const handleStaffJoined = (data) => {
            setStaffStatus('joined');
            setMessages((prev) => [
                ...prev,
                {
                    id: `staff_joined_${Date.now()}`,
                    conversationId,
                    message: data?.message || 'Nhân viên đã tham gia cuộc trò chuyện.',
                    senderRole: 'system',
                    senderName: 'Hệ thống',
                    timestamp: new Date().toISOString()
                }
            ]);
        };

        const handleStaffStatusUpdate = (data) => {
            setOnlineStaffCount(data?.onlineStaffCount || 0);
        };

        const handleStaffRequestSent = () => {
            setStaffStatus('waiting');
        };

        const handleSocketError = () => {
            setIsConnected(false);
        };

        onConnectionSuccess(handleConnectionSuccess);
        onReceiveMessage(handleReceiveMessage);
        onChatHistory(handleChatHistory);
        onStaffJoined(handleStaffJoined);
        onStaffStatusUpdate(handleStaffStatusUpdate);
        onStaffRequestSent(handleStaffRequestSent);
        onSocketError(handleSocketError);

        if (socket?.connected) {
            setIsConnected(true);
            getChatHistory(conversationId);
        }

        return () => {
            offConnectionSuccess();
            offReceiveMessage();
            offChatHistory();
            offStaffJoined();
            offStaffStatusUpdate();
            offStaffRequestSent();
            offSocketError();
            disconnectSocket();
        };
    }, [conversationId, customerId]);

    const handleSendMessage = (text) => {
        if (!text?.trim()) return;

        sendMessage(text.trim(), conversationId);
        setMessages((prev) => [
            ...prev,
            {
                id: `local_${Date.now()}`,
                conversationId,
                message: text.trim(),
                senderRole: 'customer',
                senderName: customerName,
                timestamp: new Date().toISOString()
            }
        ]);
    };

    const handleCallStaff = () => {
        requestStaff(conversationId);
        setStaffStatus('waiting');
        setMessages((prev) => [
            ...prev,
            {
                id: `request_staff_${Date.now()}`,
                conversationId,
                message: 'Đã gửi yêu cầu hỗ trợ tới nhân viên. Vui lòng chờ trong giây lát.',
                senderRole: 'system',
                senderName: 'Hệ thống',
                timestamp: new Date().toISOString()
            }
        ]);
    };

    const handleSuggestionSelect = (suggestion) => {
        if (!suggestion) return;
        if (suggestion.toLowerCase().includes('gọi nhân viên')) {
            handleCallStaff();
            return;
        }
        handleSendMessage(suggestion);
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {isOpen && (
                <div className="mb-3 h-[78vh] w-[95vw] max-w-[440px] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden sm:h-[680px] sm:w-[430px]">
                    <div className="px-4 py-3 border-b border-slate-200 bg-white flex items-start justify-between gap-3">
                        <div>
                            <p className="font-semibold text-gray-800">Hỗ trợ khách hàng</p>
                            <p className="text-xs text-gray-500">
                                {staffStatus === 'joined'
                                    ? 'Nhân viên đã tham gia hỗ trợ'
                                    : staffStatus === 'waiting'
                                        ? 'Đã gửi yêu cầu nhân viên'
                                        : 'Bạn đang trò chuyện với POS Bot'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {onlineStaffCount > 0 ? `${onlineStaffCount} nhân viên đang online` : 'Hiện chưa có nhân viên online'}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <ChatMessages
                        messages={messages}
                        isCurrentUser={true}
                        onSuggestionSelect={handleSuggestionSelect}
                        canCallStaff={staffStatus !== 'joined'}
                    />

                    <ChatInput
                        onSendMessage={handleSendMessage}
                        placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối chat...'}
                    />
                </div>
            )}

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-500 transition"
                aria-label="Mở chat hỗ trợ"
            >
                <FaComments className="text-xl" />
            </button>
        </div>
    );
};

export default CustomerChatWidget;
