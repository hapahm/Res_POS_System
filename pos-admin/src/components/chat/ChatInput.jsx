import { useState } from 'react';
import { IoSend } from 'react-icons/io5';

const ChatInput = ({ onSendMessage, placeholder = "Nhập tin nhắn..." }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-[#2f2f2f] p-4 bg-[#1a1a1a]">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-3 border border-[#3a3a3a] bg-[#262626] text-[#f5f5f5] text-base placeholder-[#8a8a8a] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#f6b100] focus:border-transparent"
                />
                <button
                    type="submit"
                    disabled={!message.trim()}
                    className="px-5 py-3 bg-[#f6b100] text-[#1f1f1f] rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition font-semibold"
                >
                    <IoSend />
                    <span className="hidden sm:inline">Gửi</span>
                </button>
            </div>
        </form>
    );
};

export default ChatInput;
