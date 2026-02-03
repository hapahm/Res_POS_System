import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import CustomerList from './CustomerList';
import {
    addMessage,
    setCurrentCustomer,
    clearCurrentCustomer,
    toggleStaffOnline,
    setCustomers,
    addCustomer,
    removeCustomer,
    setSocketConnected
} from '../../redux/slices/chatSlice';
import {
    connectSocket,
    disconnectSocket,
    sendMessage,
    joinChat,
    acceptChat,
    getChatHistory,
    onReceiveMessage,
    onStaffRequest,
    onStaffJoined,
    onChatHistory,
    offReceiveMessage,
    offStaffRequest,
    offStaffJoined
} from '../../services/chatSocket';

const StaffChatPanel = () => {
    const dispatch = useDispatch();
    const { messages, customers, currentCustomerId, currentCustomerName, isStaffOnline, socketConnected } = useSelector(
        state => state.chat
    );
    const { _id: userId } = useSelector(state => state.user);
    const [showCustomerList, setShowCustomerList] = useState(true);

    useEffect(() => {
        if (!socketConnected && userId) {
            console.log('🔌 StaffChatPanel: Connecting socket for staff:', userId);
            const socket = connectSocket(userId, 'staff');
            dispatch(setSocketConnected(true));

            // Listen for staff requests (when customer asks for help)
            const handleStaffRequest = (data) => {
                console.log('🆘 Staff request received in component:', data);
                console.log('📍 Adding customer with ID:', data.customerId);
                dispatch(addCustomer({
                    id: data.customerId,
                    name: data.customerName || `Customer ${data.customerId}`,
                    userId: data.customerId,
                    isOnline: true,
                    lastMessage: data.message
                }));
            };

            // Listen for when staff joins conversation
            const handleStaffJoined = (data) => {
                console.log('👥 Staff joined:', data);
                dispatch(addMessage({
                    conversationId: data.conversationId,
                    message: data.message,
                    senderRole: 'system',
                    senderName: 'System',
                    timestamp: new Date().toISOString()
                }));
            };

            // Listen for chat history from server
            const handleChatHistory = (data) => {
                console.log('📚 Chat history received:', data);
                console.log(`📊 Total messages: ${data.count}`);

                // Add all historical messages to Redux
                if (data.messages && Array.isArray(data.messages)) {
                    data.messages.forEach(msg => {
                        dispatch(addMessage({
                            conversationId: msg.conversationId,
                            message: msg.message,
                            senderRole: msg.senderRole || 'unknown',
                            senderName: msg.senderName || msg.sender || 'Unknown',
                            timestamp: msg.createdAt || new Date().toISOString()
                        }));
                    });
                    console.log(`✅ Added ${data.messages.length} messages to chat`);
                }
            };

            // Attach listeners
            console.log('🎧 Attaching socket listeners');
            onStaffRequest(handleStaffRequest);
            onStaffJoined(handleStaffJoined);
            onChatHistory(handleChatHistory);

            return () => {
                console.log('🧹 Cleanup: Keeping listeners alive for next render');
            };
        }
    }, [userId, socketConnected, dispatch]);

    // Separate useEffect for receive message listener (needs currentCustomerId)
    useEffect(() => {
        const handleReceiveMessage = (data) => {
            console.log('📨 Message received:', data);
            console.log(`📍 Checking if message is for current customer: ${currentCustomerId} === ${data.sender}`);

            // Add or update customer in list
            const customerId = data.sender;
            if (!customers.find(c => c.id === customerId)) {
                console.log('➕ Adding customer to list:', customerId);
                dispatch(addCustomer({
                    id: customerId,
                    name: data.senderName || `Customer ${customerId}`,
                    userId: customerId,
                    isOnline: true,
                    lastMessage: data.message
                }));
            }

            // Add message to current conversation
            if (currentCustomerId === customerId) {
                console.log('✅ Message is for current customer, adding to chat');
                dispatch(addMessage({
                    conversationId: data.conversationId,
                    message: data.message,
                    senderRole: data.senderRole || 'customer',
                    senderName: data.senderName || 'Customer',
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
            // Listeners persist for component lifetime
        };
    }, [socketConnected, currentCustomerId, customers, dispatch]);

    const handleSelectCustomer = (customerId, customerName) => {
        dispatch(setCurrentCustomer({ customerId, customerName }));
        setShowCustomerList(false);

        // Accept the chat with customer
        acceptChat(customerId, customerId);

        // Load chat history
        getChatHistory(customerId);
    };

    const handleSendMessage = (message) => {
        if (!currentCustomerId) {
            alert('Please select a customer first');
            return;
        }

        // Send message via socket (targetCustomerId tells backend who to send to)
        sendMessage(message, currentCustomerId, currentCustomerId);

        // Add message to local state
        dispatch(addMessage({
            conversationId: currentCustomerId,
            message: message,
            senderRole: 'staff',
            senderName: 'You',
            timestamp: new Date().toISOString()
        }));
    };

    const handleToggleStatus = () => {
        dispatch(toggleStaffOnline());
    };

    const handleBackToList = () => {
        dispatch(clearCurrentCustomer());
        setShowCustomerList(true);
    };

    console.log("🧪 STAFF UI MESSAGES:", messages);

    return (
        <div className="flex h-screen bg-white">
            {/* Customer List - Hidden on mobile when in chat */}
            {showCustomerList && (
                <CustomerList
                    customers={customers}
                    selectedCustomerId={currentCustomerId}
                    onSelectCustomer={handleSelectCustomer}
                />
            )}

            {/* Chat Area */}
            {currentCustomerId ? (
                <div className="flex-1 flex flex-col">
                    <ChatHeader
                        customerName={currentCustomerName}
                        isOnline={customers.find(c => c.id === currentCustomerId)?.isOnline}
                        onlineStatus={isStaffOnline}
                        onToggleStatus={handleToggleStatus}
                        onBack={handleBackToList}
                    />
                    <ChatMessages messages={messages} isCurrentUser={false} />
                    <ChatInput onSendMessage={handleSendMessage} placeholder="Reply to customer..." />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <p className="text-xl font-semibold mb-2">Welcome to Chat Support</p>
                        <p className="text-sm">Select a customer to start chatting</p>
                        <button
                            onClick={handleToggleStatus}
                            className={`mt-4 px-6 py-2 rounded-lg font-medium transition ${isStaffOnline
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {isStaffOnline ? '🟢 You are Online' : '🔴 You are Offline'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffChatPanel;
