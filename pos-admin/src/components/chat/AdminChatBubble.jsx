import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaComments, FaTimes } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import {
    connectSocket,
    sendMessage,
    acceptChat,
    getChatHistory,
    getActiveConversations,
    onConnectionSuccess,
    onSocketDisconnect,
    onReceiveMessage,
    onStaffRequest,
    onChatHistory,
    onActiveConversations,
    onCustomerChatActivity,
    offConnectionSuccess,
    offSocketDisconnect,
    offReceiveMessage,
    offStaffRequest,
    offChatHistory,
    offActiveConversations,
    offCustomerChatActivity
} from '../../services/chatSocket';

const STAFF_ROLES = ['admin', 'cashier', 'waiter', 'staff'];

const sortCustomers = (list = []) => {
    return [...list].sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0).getTime();
        const timeB = new Date(b.lastMessageTime || 0).getTime();
        return timeB - timeA;
    });
};

const AdminChatBubble = () => {
    const { _id: userId, role } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const selectedCustomerRef = useRef('');
    const customersRef = useRef([]);
    const lastChatNotificationRef = useRef({});

    const normalizedRole = `${role || ''}`.toLowerCase();
    const isStaff = STAFF_ROLES.includes(normalizedRole);

    const unreadCount = useMemo(
        () => customers.reduce((acc, item) => acc + (item.unreadCount || 0), 0),
        [customers]
    );

    const playNotificationSound = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = 920;
            gainNode.gain.setValueAtTime(0.0001, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.2);
        } catch (error) {
            console.warn('notification sound error', error);
        }
    };

    const dispatchChatNotification = (detail) => {
        window.dispatchEvent(
            new CustomEvent('admin-chat-notification', {
                detail: {
                    createdAt: new Date().toISOString(),
                    ...detail
                }
            })
        );
        playNotificationSound();
    };

    const shouldNotifyByKey = (key, cooldownMs = 2500) => {
        const now = Date.now();
        const previous = lastChatNotificationRef.current[key] || 0;
        if (now - previous < cooldownMs) {
            return false;
        }
        lastChatNotificationRef.current[key] = now;
        return true;
    };

    const upsertCustomer = (incoming, increaseUnread = false) => {
        setCustomers((prev) => {
            const existingIndex = prev.findIndex((item) => item.id === incoming.id);
            let next = [...prev];
            if (existingIndex >= 0) {
                const current = next[existingIndex];
                next[existingIndex] = {
                    ...current,
                    ...incoming,
                    unreadCount: increaseUnread
                        ? (current.unreadCount || 0) + 1
                        : incoming.unreadCount ?? current.unreadCount ?? 0
                };
            } else {
                next.push({
                    ...incoming,
                    unreadCount: increaseUnread ? 1 : incoming.unreadCount || 0
                });
            }

            return sortCustomers(next);
        });
    };

    useEffect(() => {
        selectedCustomerRef.current = selectedCustomerId;
    }, [selectedCustomerId]);

    useEffect(() => {
        customersRef.current = customers;
    }, [customers]);

    useEffect(() => {
        if (!isStaff || !userId) return;

        const socket = connectSocket(userId, normalizedRole || 'staff');

        const normalizeCustomer = (customer) => ({
            id: customer.customerId || customer.id,
            name: customer.customerName || customer.name || `Khách hàng ${customer.customerId || customer.id}`,
            userId: customer.customerId || customer.userId || customer.id,
            isOnline: true,
            lastMessage: customer.lastMessage || customer.message || 'Chưa có tin nhắn',
            lastMessageTime: customer.lastMessageTime || customer.timestamp || new Date().toISOString(),
            unreadCount: customer.unreadCount || 0,
            conversationId: customer.conversationId || customer.customerId || customer.id
        });

        const handleConnectionSuccess = () => {
            setSocketConnected(true);
            getActiveConversations();
        };

        const handleDisconnect = () => {
            setSocketConnected(false);
        };

        const handleActiveConversations = (data) => {
            const normalized = (data?.conversations || []).map(normalizeCustomer);
            setCustomers(sortCustomers(normalized));
        };

        const handleStaffRequest = (data) => {
            const customer = normalizeCustomer(data);
            const shouldNotify = selectedCustomerRef.current !== customer.id;
            upsertCustomer(customer, shouldNotify);
            const notificationKey = `staff_request:${customer.id}:${customer.conversationId || customer.id}`;
            if (shouldNotify && shouldNotifyByKey(notificationKey)) {
                dispatchChatNotification({
                    type: 'chat',
                    message: `${customer.name} đang gọi nhân viên hỗ trợ`,
                    customerId: customer.id,
                    customerName: customer.name
                });
            }
        };

        const handleCustomerChatActivity = (data) => {
            const customer = normalizeCustomer(data);
            const shouldNotify = selectedCustomerRef.current !== customer.id;
            upsertCustomer(customer, shouldNotify);
            if (data?.activityType === 'staff_request') {
                return;
            }

            const notificationKey = `chat_activity:${customer.id}:${customer.lastMessage || ''}`;
            if (shouldNotify && shouldNotifyByKey(notificationKey, 1500)) {
                dispatchChatNotification({
                    type: 'chat',
                    message: `Tin nhắn mới từ ${customer.name}`,
                    customerId: customer.id,
                    customerName: customer.name
                });
            }
        };

        const handleReceiveMessage = (data) => {
            const customerId = data.senderRole === 'customer' ? data.sender : selectedCustomerRef.current;
            if (!customerId) return;

            const incomingCustomer = {
                id: customerId,
                name: data.senderRole === 'customer' ? (data.senderName || `Khách hàng ${customerId}`) : (customersRef.current.find((item) => item.id === customerId)?.name || 'Khách hàng'),
                userId: customerId,
                isOnline: true,
                lastMessage: data.message,
                lastMessageTime: data.timestamp || new Date().toISOString(),
                conversationId: data.conversationId || customerId
            };

            const isCurrentConversation = selectedCustomerRef.current === customerId;
            upsertCustomer(incomingCustomer, !isCurrentConversation && data.senderRole === 'customer');

            if (isCurrentConversation) {
                setMessages((prev) => [
                    ...prev,
                    {
                        conversationId: data.conversationId || customerId,
                        message: data.message,
                        senderRole: data.senderRole || 'customer',
                        senderName: data.senderName || 'Khách hàng',
                        timestamp: data.timestamp || new Date().toISOString()
                    }
                ]);
            }
        };

        const handleChatHistory = (data) => {
            const formatted = (data?.messages || []).map((msg) => ({
                conversationId: msg.conversationId,
                message: msg.message,
                senderRole: msg.senderRole || msg.messageType || 'customer',
                senderName: msg.senderInfo?.name || msg.senderName || 'User',
                timestamp: msg.createdAt || new Date().toISOString()
            }));
            setMessages(formatted);
        };

        onConnectionSuccess(handleConnectionSuccess);
        onSocketDisconnect(handleDisconnect);
        onActiveConversations(handleActiveConversations);
        onStaffRequest(handleStaffRequest);
        onCustomerChatActivity(handleCustomerChatActivity);
        onReceiveMessage(handleReceiveMessage);
        onChatHistory(handleChatHistory);

        if (socket?.connected) {
            handleConnectionSuccess();
        }

        return () => {
            offConnectionSuccess();
            offSocketDisconnect();
            offActiveConversations();
            offStaffRequest();
            offCustomerChatActivity();
            offReceiveMessage();
            offChatHistory();
        };
    }, [isStaff, userId, normalizedRole]);

    if (!isStaff) {
        return null;
    }

    const selectedCustomer = customers.find((item) => item.id === selectedCustomerId);

    const handleOpenConversation = (customer) => {
        setSelectedCustomerId(customer.id);
        setMessages([]);
        setCustomers((prev) =>
            prev.map((item) =>
                item.id === customer.id ? { ...item, unreadCount: 0 } : item
            )
        );
        acceptChat(customer.id, customer.id);
        getChatHistory(customer.id);
    };

    const handleSendMessage = (event) => {
        event.preventDefault();
        if (!inputMessage.trim() || !selectedCustomerId) return;

        sendMessage(inputMessage.trim(), selectedCustomerId, selectedCustomerId);
        setMessages((prev) => [
            ...prev,
            {
                conversationId: selectedCustomerId,
                message: inputMessage.trim(),
                senderRole: 'staff',
                senderName: 'Bạn',
                timestamp: new Date().toISOString()
            }
        ]);
        setInputMessage('');
    };

    return (
        <div className="fixed bottom-6 right-4 md:right-6 z-50">
            {isOpen && (
                <div className="mb-3 w-[900px] max-w-[calc(100vw-16px)] h-[min(620px,80vh)] bg-[#1a1a1a] border border-[#343434] rounded-2xl shadow-2xl overflow-hidden flex">
                    <div className="w-72 max-md:w-64 border-r border-[#2f2f2f] bg-[#1f1f1f] flex flex-col">
                        <div className="px-4 py-3 border-b border-[#2f2f2f]">
                            <p className="text-[#f5f5f5] text-lg font-semibold">Danh sách chat</p>
                            <p className="text-xs text-[#ababab] mt-1">
                                {socketConnected ? 'Đã kết nối thời gian thực' : 'Đang kết nối...'}
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto dark-scrollbar">
                            {customers.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[#7f7f7f] text-sm px-4 text-center">
                                    Chưa có cuộc trò chuyện
                                </div>
                            ) : (
                                customers.map((customer) => (
                                    <button
                                        key={customer.id}
                                        onClick={() => handleOpenConversation(customer)}
                                        className={`w-full text-left px-4 py-3 border-b border-[#2a2a2a] ${selectedCustomerId === customer.id ? 'bg-[#262626] border-l-4 border-l-[#f6b100]' : 'hover:bg-[#242424]'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-[#f5f5f5] font-semibold text-base">{customer.name}</p>
                                                <p className="text-[11px] text-[#8f8f8f]">{customer.userId}</p>
                                                <p className="text-sm text-[#ababab] mt-1 line-clamp-1">{customer.lastMessage}</p>
                                            </div>
                                            {customer.unreadCount > 0 && (
                                                <span className="min-w-5 h-5 px-1 rounded-full bg-[#f6b100] text-[#1f1f1f] text-[10px] font-bold flex items-center justify-center">
                                                    {customer.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-[#1a1a1a]">
                        <div className="h-14 px-4 border-b border-[#2f2f2f] flex items-center justify-between">
                            <div>
                                <p className="text-[#f5f5f5] text-lg font-semibold">{selectedCustomer?.name || 'Chọn cuộc trò chuyện'}</p>
                                <p className="text-xs text-[#ababab]">{selectedCustomer?.userId || '---'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/staff/chat');
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[#f6b100] text-[#1f1f1f] text-xs font-semibold hover:opacity-90"
                                >
                                    Mở trang chat
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 rounded-lg text-[#ababab] hover:bg-[#2a2a2a] flex items-center justify-center"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto dark-scrollbar p-4 space-y-3 bg-[#1a1a1a]">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[#7f7f7f] text-base text-center px-4">
                                    {selectedCustomerId ? 'Chưa có tin nhắn' : 'Hãy chọn cuộc trò chuyện bên trái'}
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMine = msg.senderRole === 'staff';
                                    return (
                                        <div key={`${msg.timestamp}_${idx}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[78%] rounded-xl px-3 py-2 border ${isMine ? 'bg-[#2b4239] border-[#3a5f52] text-[#f5f5f5]' : 'bg-[#262626] border-[#343434] text-[#f5f5f5]'}`}>
                                                <p className="text-xs text-[#9a9a9a] mb-1">{msg.senderName}</p>
                                                <p className="text-base whitespace-pre-wrap break-words">{msg.message}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 border-t border-[#2f2f2f] flex gap-2 bg-[#1a1a1a]">
                            <input
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder={selectedCustomerId ? 'Nhập tin nhắn...' : 'Chọn cuộc trò chuyện để chat'}
                                disabled={!selectedCustomerId}
                                className="flex-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#3a3a3a] text-[#f5f5f5] text-base placeholder-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-[#f6b100]"
                            />
                            <button
                                type="submit"
                                disabled={!selectedCustomerId || !inputMessage.trim()}
                                className="px-3 py-2 rounded-lg bg-[#f6b100] hover:opacity-90 disabled:opacity-50 text-[#1f1f1f]"
                            >
                                <IoSend />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative h-14 w-14 rounded-full bg-[#f6b100] text-[#1f1f1f] flex items-center justify-center shadow-xl hover:opacity-90 transition"
                aria-label="Admin chat"
            >
                <FaComments className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#ef4444] text-white text-[10px] flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default AdminChatBubble;
