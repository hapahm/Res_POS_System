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
            <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                    <p className="text-lg font-semibold">No messages yet</p>
                    <p className="text-sm">Start the conversation</p>
                </div>
            </div>
        );
    }

    console.log("🧪 ChatMessages received messages:", messages);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((msg, index) => (
                <ChatMessage
                    key={index}
                    message={msg}
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
