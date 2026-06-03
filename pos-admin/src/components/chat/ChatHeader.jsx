import { FaArrowLeft, FaCircle } from 'react-icons/fa';

const ChatHeader = ({ customerName, isOnline, onlineStatus, onToggleStatus, onBack }) => {
    return (
        <div className="border-b border-[#2f2f2f] p-4 bg-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
                <button
                    onClick={onBack}
                    className="md:hidden p-2 hover:bg-[#2a2a2a] rounded-lg transition text-[#ababab]"
                >
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-semibold text-[#f5f5f5]">{customerName || 'Chat'}</h2>
                    {isOnline !== undefined && (
                        <p className="text-sm text-[#ababab] flex items-center gap-1 mt-1">
                            <FaCircle className={`w-2 h-2 ${isOnline ? 'text-green-500' : 'text-gray-400'}`} />
                            {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                        </p>
                    )}
                </div>
            </div>

            {onlineStatus !== undefined && (
                onToggleStatus ? (
                    <button
                        onClick={onToggleStatus}
                        className={`px-4 py-2 rounded-full font-medium transition ${onlineStatus
                            ? 'bg-[#2e4a40] text-[#8fe2b8] hover:bg-[#365a4e] border border-[#3e6a5e]'
                            : 'bg-[#2c2c2c] text-[#ababab] hover:bg-[#343434] border border-[#3a3a3a]'
                            }`}
                    >
                        {onlineStatus ? '🟢 Trực tuyến' : '🔴 Ngoại tuyến'}
                    </button>
                ) : (
                    <div
                        className={`px-4 py-2 rounded-full font-medium ${onlineStatus
                            ? 'bg-[#2e4a40] text-[#8fe2b8] border border-[#3e6a5e]'
                            : 'bg-[#2c2c2c] text-[#ababab] border border-[#3a3a3a]'
                            }`}
                    >
                        {onlineStatus ? '🟢 Trực tuyến' : '🔴 Ngoại tuyến'}
                    </div>
                )
            )}
        </div>
    );
};

export default ChatHeader;
