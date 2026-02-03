import { FaUser, FaRobot } from 'react-icons/fa';
import { MdPersonPin } from 'react-icons/md';

const ChatMessage = ({ message, isCurrentUser }) => {
    const isBot = message.senderRole === 'bot';
    const isStaff = message.senderRole === 'staff';
    const isCustomer = message.senderRole === 'customer';

    const getSenderIcon = () => {
        if (isBot) return <FaRobot className="w-5 h-5" />;
        if (isStaff) return <MdPersonPin className="w-5 h-5" />;
        return <FaUser className="w-5 h-5" />;
    };

    const getSenderColor = () => {
        if (isBot) return 'bg-blue-100 text-blue-800';
        if (isStaff) return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getMessageBg = () => {
        if (isBot) return 'bg-blue-50 border-l-4 border-blue-400';
        if (isCurrentUser) return 'bg-green-50 border-l-4 border-green-400';
        return 'bg-gray-50 border-l-4 border-gray-300';
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
            <div className={`flex-1 max-w-xs`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-700">
                        {message.senderName || 'Unknown'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSenderColor()}`}>
                        {message.senderRole === 'bot' ? 'Bot' : message.senderRole === 'staff' ? 'Staff' : 'Customer'}
                    </span>
                </div>
                <div className={`p-3 rounded-lg ${getMessageBg()}`}>
                    <p className="text-sm text-gray-800 break-words">{message.message}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1 block">
                    {formatTime(message.timestamp || Date.now())}
                </span>
            </div>
        </div>
    );
};

export default ChatMessage;
