import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { enqueueSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import CustomerList from './CustomerList';
import {
    addMessage,
    setMessages,
    setCurrentCustomer,
    clearCurrentCustomer,
    setStaffOnline,
    setCustomers,
    upsertCustomer,
    setSocketConnected
} from '../../redux/slices/chatSlice';
import {
    connectSocket,
    disconnectSocket,
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

const StaffChatPanel = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { messages, customers, currentCustomerId, currentCustomerName, isStaffOnline, socketConnected } = useSelector(
        state => state.chat
    );
    const { _id: userId } = useSelector(state => state.user);
    const [showCustomerList, setShowCustomerList] = useState(true);
    const [customerListWidth, setCustomerListWidth] = useState(360);
    const [isResizing, setIsResizing] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const lastNotificationRef = useRef({});
    const currentCustomerRef = useRef(null);
    const containerRef = useRef(null);
    const handledNotificationTargetRef = useRef('');

    useEffect(() => {
        currentCustomerRef.current = currentCustomerId;
    }, [currentCustomerId]);

    useEffect(() => {
        const updateViewport = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        updateViewport();
        window.addEventListener('resize', updateViewport);
        return () => window.removeEventListener('resize', updateViewport);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (event) => {
            const container = containerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const minWidth = 280;
            const maxWidth = Math.min(560, rect.width - 360);
            const nextWidth = Math.max(minWidth, Math.min(event.clientX - rect.left, maxWidth));
            setCustomerListWidth(nextWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    const handleResizeStart = () => {
        if (!isDesktop) return;
        setIsResizing(true);
    };

    const playNotificationSound = () => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gainNode.gain.setValueAtTime(0.0001, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.25);
        } catch (error) {
            console.warn('Không thể phát âm báo', error);
        }
    };

    const notifyStaff = (key, message, variant = 'info') => {
        const now = Date.now();
        const previous = lastNotificationRef.current[key] || 0;
        if (now - previous < 1500) return;
        lastNotificationRef.current[key] = now;
        enqueueSnackbar(message, { variant });
        playNotificationSound();
    };

    useEffect(() => {
        if (!userId) return;

        console.log('🔌 StaffChatPanel: Connecting socket for staff:', userId);
        const socket = connectSocket(userId, 'staff');

        const normalizeCustomer = (customer) => ({
            id: customer.customerId || customer.id,
            name: customer.customerName || customer.name || `Khách hàng ${customer.customerId || customer.id}`,
            userId: customer.customerId || customer.userId || customer.id,
            isOnline: true,
            lastMessage: customer.lastMessage || customer.message || 'Chưa có tin nhắn',
            lastMessageTime: customer.lastMessageTime || customer.timestamp || new Date().toISOString(),
            unreadCount: customer.unreadCount || 0,
            conversationId: customer.conversationId || customer.id || customer.customerId
        });

        const handleConnectionSuccess = () => {
            dispatch(setSocketConnected(true));
            dispatch(setStaffOnline(true));
            getActiveConversations();
        };

        const handleSocketDisconnect = () => {
            dispatch(setSocketConnected(false));
            dispatch(setStaffOnline(false));
        };

        const handleStaffRequest = (data) => {
            dispatch(upsertCustomer(normalizeCustomer(data)));
            notifyStaff(`staff_request_${data.customerId}`, `${data.customerName || 'Khách hàng'} đang gọi nhân viên`, 'warning');
        };

        const handleCustomerChatActivity = (data) => {
            dispatch(upsertCustomer(normalizeCustomer(data)));
            if (currentCustomerRef.current !== data.customerId) {
                notifyStaff(`activity_${data.customerId}`, `Tin nhắn mới từ ${data.customerName || 'khách hàng'}`, 'info');
            }
        };

        const handleActiveConversations = (data) => {
            const normalized = (data?.conversations || []).map(normalizeCustomer);
            dispatch(setCustomers(normalized));
        };

        const handleChatHistory = (data) => {
            const formattedMessages = (data?.messages || []).map(msg => ({
                conversationId: msg.conversationId,
                message: msg.message,
                senderRole: msg.senderRole || msg.messageType || 'unknown',
                senderName: msg.senderInfo?.name || msg.senderName || msg.sender || 'Không rõ',
                timestamp: msg.createdAt || new Date().toISOString()
            }));
            dispatch(setMessages(formattedMessages));
        };

        onConnectionSuccess(handleConnectionSuccess);
        onSocketDisconnect(handleSocketDisconnect);
        onStaffRequest(handleStaffRequest);
        onCustomerChatActivity(handleCustomerChatActivity);
        onActiveConversations(handleActiveConversations);
        onChatHistory(handleChatHistory);

        if (socket?.connected) {
            handleConnectionSuccess();
        }

        return () => {
            offConnectionSuccess();
            offSocketDisconnect();
            offStaffRequest();
            offCustomerChatActivity();
            offActiveConversations();
            offChatHistory();
            offReceiveMessage();
            dispatch(setSocketConnected(false));
            dispatch(setStaffOnline(false));
            disconnectSocket();
        };
    }, [userId, dispatch]);

    // Separate useEffect for receive message listener (needs currentCustomerId)
    useEffect(() => {
        const handleReceiveMessage = (data) => {
            console.log('📨 Message received:', data);
            console.log(`📍 Checking if message is for current customer: ${currentCustomerId} === ${data.sender}`);

            // Add or update customer in list
            const customerId = data.senderRole === 'customer' ? data.sender : currentCustomerId;
            if (customerId) {
                dispatch(upsertCustomer({
                    id: customerId,
                    name: data.senderRole === 'customer' ? (data.senderName || `Khách hàng ${customerId}`) : currentCustomerName,
                    userId: customerId,
                    isOnline: true,
                    lastMessage: data.message,
                    lastMessageTime: data.timestamp || new Date().toISOString(),
                    conversationId: data.conversationId || customerId
                }));
            }

            // Add message to current conversation
            if (currentCustomerId && currentCustomerId === customerId) {
                console.log('✅ Message is for current customer, adding to chat');
                dispatch(addMessage({
                    conversationId: data.conversationId,
                    message: data.message,
                    senderRole: data.senderRole || 'customer',
                    senderName: data.senderName || 'Khách hàng',
                    timestamp: data.timestamp || new Date().toISOString()
                }));
            } else {
                console.log(`⏭️ Message skipped - not for current customer (${currentCustomerId})`);
            }
        };

        if (socketConnected) {
            console.log('🎧 Setting up receive_message listener for current customer:', currentCustomerId);
            onReceiveMessage(handleReceiveMessage);
        }

        return () => {
            offReceiveMessage();
        };
    }, [socketConnected, currentCustomerId, currentCustomerName, dispatch]);

    const handleSelectCustomer = (customerId, customerName) => {
        dispatch(setCurrentCustomer({ customerId, customerName }));
        setShowCustomerList(false);

        // Accept the chat with customer
        acceptChat(customerId, customerId);

        // Load chat history
        getChatHistory(customerId);
    };

    useEffect(() => {
        const targetCustomerId = searchParams.get('customerId');
        if (!targetCustomerId || !socketConnected) {
            return;
        }

        const targetCustomerName = searchParams.get('customerName') || `Khách hàng ${targetCustomerId}`;
        const targetKey = `${targetCustomerId}:${targetCustomerName}`;

        if (handledNotificationTargetRef.current === targetKey) {
            return;
        }

        const existingCustomer = customers.find((item) => item.id === targetCustomerId);
        if (existingCustomer) {
            if (currentCustomerId !== targetCustomerId) {
                handleSelectCustomer(existingCustomer.id, existingCustomer.name);
            }
        } else {
            dispatch(upsertCustomer({
                id: targetCustomerId,
                name: targetCustomerName,
                userId: targetCustomerId,
                isOnline: true,
                lastMessage: 'Mở từ thông báo',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                conversationId: targetCustomerId,
            }));
            handleSelectCustomer(targetCustomerId, targetCustomerName);
        }

        handledNotificationTargetRef.current = targetKey;
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('customerId');
        nextParams.delete('customerName');
        setSearchParams(nextParams, { replace: true });
    }, [searchParams, setSearchParams, socketConnected, customers, currentCustomerId, dispatch]);

    const handleSendMessage = (message) => {
        if (!currentCustomerId) {
            alert('Vui lòng chọn khách hàng trước');
            return;
        }

        // Send message via socket (targetCustomerId tells backend who to send to)
        sendMessage(message, currentCustomerId, currentCustomerId);

        // Add message to local state
        dispatch(addMessage({
            conversationId: currentCustomerId,
            message: message,
            senderRole: 'staff',
            senderName: 'Bạn',
            timestamp: new Date().toISOString()
        }));
    };

    const handleBackToList = () => {
        dispatch(clearCurrentCustomer());
        setShowCustomerList(true);
    };

    console.log("🧪 STAFF UI MESSAGES:", messages);

    return (
        <div
            ref={containerRef}
            className={`flex h-[calc(100vh-5rem)] bg-[#1f1f1f] text-[#f5f5f5] p-3 md:p-4 ${isResizing ? 'select-none cursor-col-resize' : ''}`}
        >
            <div className="w-full h-full flex rounded-3xl border border-[#2e2e2e] bg-[#181818] shadow-[0_20px_40px_rgba(0,0,0,0.35)] overflow-hidden">
                <div
                    className={`${showCustomerList || !currentCustomerId ? 'flex' : 'hidden'} md:flex shrink-0`}
                    style={{ width: isDesktop ? `${customerListWidth}px` : '100%' }}
                >
                    <CustomerList
                        customers={customers}
                        selectedCustomerId={currentCustomerId}
                        onSelectCustomer={handleSelectCustomer}
                    />
                </div>

                <button
                    type="button"
                    onMouseDown={handleResizeStart}
                    className="hidden md:flex w-1 bg-[#2f2f2f] hover:bg-[#f6b100] active:bg-[#f6b100] transition-colors cursor-col-resize"
                    aria-label="Kéo để co giãn danh sách chat"
                />

                {currentCustomerId ? (
                    <div className="flex-1 flex flex-col bg-[#1a1a1a] border-l border-[#2f2f2f]">
                        <ChatHeader
                            customerName={currentCustomerName}
                            isOnline={customers.find(c => c.id === currentCustomerId)?.isOnline}
                            onlineStatus={isStaffOnline}
                            onToggleStatus={undefined}
                            onBack={handleBackToList}
                        />
                        <ChatMessages messages={messages} isCurrentUser={false} />
                        <ChatInput onSendMessage={handleSendMessage} placeholder="Trả lời khách hàng..." />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[#ababab] bg-[#1a1a1a] border-l border-[#2f2f2f] p-6">
                        <div className="text-center">
                            <p className="text-3xl font-semibold mb-3 text-[#f5f5f5]">Hỗ trợ chat</p>
                            <p className="text-base text-[#ababab]">Chọn cuộc trò chuyện để phản hồi khách hàng</p>
                            <div
                                className={`mt-5 px-6 py-2 rounded-full font-semibold text-sm ${isStaffOnline
                                    ? 'bg-[#2e4a40] text-[#8fe2b8] border border-[#3e6a5e]'
                                    : 'bg-[#2c2c2c] text-[#ababab] border border-[#3a3a3a]'
                                    }`}
                            >
                                {isStaffOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {currentCustomerId && (
                <button
                    onClick={() => setShowCustomerList((prev) => !prev)}
                    className="md:hidden fixed left-4 bottom-20 px-4 py-2 rounded-full bg-[#262626] text-[#f5f5f5] text-sm border border-[#3a3a3a]"
                >
                    {showCustomerList ? 'Ẩn danh sách' : 'Danh sách chat'}
                </button>
            )}
        </div>
    );
};

export default StaffChatPanel;
