import { FaArrowLeft, FaCircle } from 'react-icons/fa';

const ChatHeader = ({ customerName, isOnline, onlineStatus, onToggleStatus, onBack }) => {
    return (
        <div className="border-b border-gray-200 p-4 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
                <button
                    onClick={onBack}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800">{customerName || 'Chat'}</h2>
                    {isOnline !== undefined && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <FaCircle className={`w-2 h-2 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                            {isOnline ? 'Online' : 'Offline'}
                        </p>
                    )}
                </div>
            </div>

            {onlineStatus !== undefined && (
                <button
                    onClick={onToggleStatus}
                    className={`px-4 py-2 rounded-lg font-medium transition ${onlineStatus
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {onlineStatus ? '🟢 Online' : '🔴 Offline'}
                </button>
            )}
        </div>
    );
};

export default ChatHeader;
