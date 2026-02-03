import { FaUser, FaCheckCircle, FaClock } from 'react-icons/fa';

const CustomerList = ({ customers = [], selectedCustomerId, onSelectCustomer }) => {
    return (
        <div className="w-full md:w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Active Chats</h3>
                <p className="text-sm text-gray-500">{customers.length} customer(s)</p>
            </div>

            {customers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                        <FaUser className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No active customers</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {customers.map((customer) => (
                        <button
                            key={customer.id}
                            onClick={() => onSelectCustomer(customer.id, customer.name)}
                            className={`w-full text-left p-4 border-b border-gray-200 transition hover:bg-gray-100 ${selectedCustomerId === customer.id
                                    ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                    : 'hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{customer.name}</p>
                                    <p className="text-sm text-gray-500">{customer.userId}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {customer.lastMessage || 'No messages yet'}
                                    </p>
                                </div>
                                <div>
                                    {customer.isOnline ? (
                                        <FaCheckCircle className="w-3 h-3 text-green-500" />
                                    ) : (
                                        <FaClock className="w-3 h-3 text-gray-400" />
                                    )}
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
