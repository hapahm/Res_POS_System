import { FaUser, FaRobot } from 'react-icons/fa';
import { MdPersonPin } from 'react-icons/md';

const ChatMessage = ({ message, isCurrentUser }) => {
    const normalizedRole = message.senderRole === 'chatbot' ? 'bot' : message.senderRole;
    const isBot = normalizedRole === 'bot';
    const isStaff = normalizedRole === 'staff';
    const isSystem = normalizedRole === 'system';

    const getSenderIcon = () => {
        if (isBot) return <FaRobot className="w-5 h-5" />;
        if (isStaff) return <MdPersonPin className="w-5 h-5" />;
        if (isSystem) return <FaRobot className="w-5 h-5" />;
        return <FaUser className="w-5 h-5" />;
    };

    const getSenderColor = () => {
        if (isBot) return 'bg-[#2e3a4a] text-[#9fd3ff]';
        if (isStaff) return 'bg-[#2e4a40] text-[#8fe2b8]';
        if (isSystem) return 'bg-[#4a452e] text-[#f6d07a]';
        return 'bg-[#2c2c2c] text-[#f5f5f5]';
    };

    const getMessageBg = () => {
        if (isBot) return 'bg-[#232f3f] border border-[#324a66]';
        if (isSystem) return 'bg-[#3a3725] border border-[#575134]';
        if (isCurrentUser) return 'bg-[#2b4239] border border-[#3a5f52]';
        return 'bg-[#262626] border border-[#343434]';
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`flex gap-3 mb-4 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${getSenderColor()}`}>
                {getSenderIcon()}
            </div>
            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-[#f5f5f5]">
                        {message.senderName || 'Unknown'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSenderColor()}`}>
                        {normalizedRole === 'bot' ? 'Bot' : normalizedRole === 'staff' ? 'Nhân viên' : normalizedRole === 'system' ? 'Hệ thống' : 'Khách'}
                    </span>
                </div>
                <div className={`inline-block w-fit max-w-full px-4 py-3 rounded-2xl ${getMessageBg()}`}>
                    <p className="text-base text-[#f5f5f5] break-words whitespace-pre-wrap">{message.message}</p>
                </div>
                <span className={`text-xs text-[#8f8f8f] mt-1 block ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.timestamp || Date.now())}
                </span>
            </div>
        </div>
    );
};

export default ChatMessage;
