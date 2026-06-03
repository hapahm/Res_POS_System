import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

const ChatMessages = ({ messages = [], isCurrentUser = false, onSuggestionSelect, canCallStaff = false }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400 bg-[#f7f8fa]">
                <div className="text-center">
                    <p className="text-lg font-semibold text-slate-700">Chưa có tin nhắn</p>
                    <p className="text-sm text-slate-500">Hãy nhập câu hỏi để bắt đầu trò chuyện</p>
                </div>
            </div>
        );
    }

    const lastBotIndex = messages
        .map((msg, index) => ({ msg, index }))
        .filter(({ msg }) => {
            const role = msg?.senderRole === 'chatbot' ? 'bot' : msg?.senderRole;
            return role === 'bot';
        })
        .map(({ index }) => index)
        .pop();

    return (
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[#f7f8fa]">
            {messages.map((msg, index) => (
                <ChatMessage
                    key={index}
                    message={msg}
                    showSuggestions={index === lastBotIndex}
                    onSuggestionSelect={onSuggestionSelect}
                    canCallStaff={canCallStaff}
                    isCurrentUser={
                        isCurrentUser
                            ? msg.senderRole === 'customer'   // customer view
                            : msg.senderRole === 'staff'      // staff view
                    }
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default ChatMessages;
