import { FaUser, FaRobot } from 'react-icons/fa';
import { MdPersonPin } from 'react-icons/md';

const getNormalizedText = (text = '') =>
    `${text}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const getBotSuggestions = (messageText = '') => {
    const normalized = getNormalizedText(messageText);

    if (normalized.includes('gio mo cua')) {
        return ['Cho tôi xem thực đơn', 'Giá món ăn khoảng bao nhiêu?', 'Địa chỉ quán ở đâu?'];
    }

    if (normalized.includes('thuc don') || normalized.includes('mon an')) {
        return ['Giá món ăn khoảng bao nhiêu?', 'Món nào phù hợp cho 2 người?', 'Quán còn bàn trống không?'];
    }

    if (normalized.includes('gia') || normalized.includes('bao nhieu')) {
        return ['Cho tôi xem thực đơn', 'Quán có món nào đang bán chạy?', 'Kiểm tra trạng thái đơn hàng'];
    }

    if (normalized.includes('dia chi')) {
        return ['Giờ mở cửa của quán thế nào?', 'Quán còn bàn trống không?', 'Cho tôi xem thực đơn'];
    }

    if (normalized.includes('don hang') || normalized.includes('ma don')) {
        return ['Tôi muốn kiểm tra ORD123', 'Quán còn bàn trống không?', 'Gọi nhân viên hỗ trợ'];
    }

    if (normalized.includes('ban') || normalized.includes('table')) {
        return ['Kiểm tra bàn 5', 'Cho tôi xem thực đơn', 'Gọi nhân viên hỗ trợ'];
    }

    return ['Giờ mở cửa của quán thế nào?', 'Cho tôi xem thực đơn', 'Địa chỉ quán ở đâu?'];
};

const ChatMessage = ({ message, isCurrentUser, showSuggestions = false, onSuggestionSelect, canCallStaff = false }) => {
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
        if (isBot) return 'bg-orange-200 text-orange-800';
        if (isStaff) return 'bg-emerald-200 text-emerald-800';
        if (isSystem) return 'bg-amber-200 text-amber-800';
        return 'bg-slate-200 text-slate-700';
    };

    const getMessageBg = () => {
        if (isBot) return 'bg-orange-100 border border-orange-300';
        if (isStaff) return 'bg-emerald-100 border border-emerald-300';
        if (isSystem) return 'bg-amber-100 border border-amber-300';
        if (isCurrentUser) return 'bg-slate-100 border border-slate-300';
        return 'bg-white border border-slate-300';
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const suggestions = isBot && showSuggestions ? getBotSuggestions(message?.message) : [];
    const finalSuggestions = canCallStaff && suggestions.length > 0 && !suggestions.includes('Gọi nhân viên hỗ trợ')
        ? [...suggestions, 'Gọi nhân viên hỗ trợ']
        : suggestions;

    return (
        <div className={`mb-4 flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${getSenderColor()}`}>
                {getSenderIcon()}
            </div>
            <div className={`flex max-w-[82%] flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                <div className={`mb-1 flex items-center gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-semibold text-slate-700">
                        {message.senderName || 'Unknown'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSenderColor()}`}>
                        {normalizedRole === 'bot' ? 'Bot' : normalizedRole === 'staff' ? 'Nhân viên' : normalizedRole === 'system' ? 'Hệ thống' : 'Bạn'}
                    </span>
                </div>
                <div className={`w-fit max-w-full rounded-2xl px-3.5 py-2.5 ${getMessageBg()}`}>
                    <p className="text-sm leading-6 text-slate-800 break-words whitespace-pre-wrap">{message.message}</p>
                </div>

                {isBot && showSuggestions && finalSuggestions.length > 0 && (
                    <div className={`mt-2 flex flex-wrap gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        {finalSuggestions.map((suggestion) => (
                            <button
                                key={`${message.id || message.timestamp}-${suggestion}`}
                                type="button"
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${suggestion === 'Gọi nhân viên hỗ trợ'
                                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                                        : 'border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                                    }`}
                                onClick={() => onSuggestionSelect?.(suggestion)}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                <span className="text-xs text-slate-500 mt-1 block">
                    {formatTime(message.timestamp || Date.now())}
                </span>
            </div>
        </div>
    );
};

export default ChatMessage;
