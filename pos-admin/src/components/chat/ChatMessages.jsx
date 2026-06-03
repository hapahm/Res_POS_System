import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

const ChatMessages = ({ messages = [], isCurrentUser = false }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-[#777] bg-[#1a1a1a] px-4">
                <div className="text-center">
                    <p className="text-xl font-semibold text-[#f5f5f5]">Chưa có tin nhắn</p>
                    <p className="text-base text-[#ababab]">Bắt đầu cuộc trò chuyện với khách hàng</p>
                </div>
            </div>
        );
    }

    console.log("🧪 ChatMessages received messages:", messages);

    return (
        <div className="flex-1 overflow-y-auto dark-scrollbar p-5 space-y-4 bg-[#1a1a1a]">
            {messages.map((msg, index) => (
                <ChatMessage
                    key={index}
                    message={msg}
                    isCurrentUser={
                        isCurrentUser
                            ? msg.senderRole === 'customer'   // customer view
                            : msg.senderRole === 'staff' || msg.senderRole === 'chatbot' // staff/admin view
                    }
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;
