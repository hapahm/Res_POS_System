import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatMessages from '../components/chat/ChatMessages';
import ChatInput from '../components/chat/ChatInput';
import ChatHeader from '../components/chat/ChatHeader';
import {
    connectSocket,
    disconnectSocket,
    sendMessage,
    joinChat,
    onReceiveMessage,
    offReceiveMessage
} from '../services/chatSocket';

// Simple UUID generator
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const ChatTest = () => {
    const [searchParams] = useSearchParams();
    const [messages, setMessages] = useState([]);
    const [connected, setConnected] = useState(false);
    const [customerId] = useState(searchParams.get('userId') || generateUUID());
    const [conversationId] = useState(customerId);
    const [customerName] = useState(searchParams.get('name') || `Khách ${customerId.slice(0, 8)}`);

    useEffect(() => {
        const socket = connectSocket(customerId, 'customer');

        setTimeout(() => {
            if (socket?.connected) {
                setConnected(true);
                console.log('✅ Customer connected:', customerId);
            }
        }, 500);

        // Listen for messages (from chatbot or staff)
        const handleReceiveMessage = (data) => {
            console.log('Message received:', data);
            setMessages(prev => [...prev, {
                conversationId: data.conversationId,
                message: data.message,
                senderRole: data.senderRole || data.messageType,
                senderName: data.senderName || 'Trợ lý',
                timestamp: data.timestamp || new Date().toISOString()
            }]);
        };

        onReceiveMessage(handleReceiveMessage);

        return () => {
            offReceiveMessage();
            disconnectSocket();
        };
    }, [customerId]);

    const handleSendMessage = (message) => {
        // Send message via socket (no targetCustomerId for customer)
        sendMessage(message, conversationId);

        // Add to local messages
        setMessages(prev => [...prev, {
            conversationId: conversationId,
            message: message,
            senderRole: 'customer',
            senderName: customerName,
            timestamp: new Date().toISOString()
        }]);
    };

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Header */}
            <ChatHeader
                customerName={`${customerName} (Kiểm thử)`}
                isOnline={connected}
                onlineStatus={undefined}
                onBack={() => window.history.back()}
            />

            {/* Connection Status */}
            <div className={`px-4 py-2 text-sm flex items-center gap-2 ${connected ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                }`}>
                <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                {connected ? 'Đã kết nối máy chủ chat' : 'Đang kết nối...'}
            </div>

            {/* Messages */}
            <ChatMessages messages={messages} isCurrentUser={true} />

            {/* Test Info */}
            <div className="border-t border-gray-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-700">
                    <strong>Chế độ kiểm thử:</strong> Mã khách: <code className="bg-blue-100 px-2 py-1 rounded">{customerId}</code> |
                    Hội thoại: <code className="bg-blue-100 px-2 py-1 rounded ml-2">{conversationId}</code>
                </p>
            </div>

            {/* Input */}
            <ChatInput
                onSendMessage={handleSendMessage}
                placeholder={connected ? "Gửi tin nhắn kiểm thử..." : "Đang chờ kết nối..."}
            />
        </div>
    );
};

export default ChatTest;
