import { FaUser } from 'react-icons/fa';

const CustomerList = ({ customers = [], selectedCustomerId, onSelectCustomer }) => {
    return (
        <div className="w-full h-full border-r border-[#2f2f2f] bg-[#1a1a1a] flex flex-col">
            <div className="p-4 border-b border-[#2f2f2f]">
                <h3 className="text-xl font-semibold text-[#f5f5f5]">Cuộc trò chuyện đang hoạt động</h3>
                <p className="text-sm text-[#ababab]">{customers.length} khách hàng</p>
            </div>

            {customers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[#777]">
                    <div className="text-center">
                        <FaUser className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-base">Không có khách hàng đang chat</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto dark-scrollbar p-2 space-y-2">
                    {customers.map((customer) => (
                        <button
                            key={customer.id}
                            onClick={() => onSelectCustomer(customer.id, customer.name)}
                            className={`w-full text-left p-4 border border-[#2a2a2a] rounded-2xl transition ${selectedCustomerId === customer.id
                                ? 'bg-[#262626] border-[#4c4220] shadow-[inset_0_0_0_1px_rgba(246,177,0,0.25)]'
                                : 'hover:bg-[#222222]'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-semibold text-base text-[#f5f5f5]">{customer.name}</p>
                                    <p className="text-xs text-[#8f8f8f]">{customer.userId}</p>
                                    <p className="text-sm text-[#ababab] mt-1 line-clamp-1">
                                        {customer.lastMessage || 'Chưa có tin nhắn'}
                                    </p>
                                </div>
                                <div>
                                    <span className={`text-[11px] px-2 py-1 rounded ${customer.isOnline ? 'bg-[#2e4a40] text-[#8fe2b8]' : 'bg-[#2c2c2c] text-[#ababab]'}`}>
                                        {customer.isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerList;
