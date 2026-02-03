import React from 'react';
import { FaCheckCircle, FaClock, FaFire } from 'react-icons/fa';

const KitchenOrderCard = ({ order, elapsedTime, onUpdateStatus, isUpdating }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500';
            case 'preparing':
                return 'bg-blue-500';
            case 'completed':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusEmoji = (status) => {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'preparing':
                return '👨‍🍳';
            case 'completed':
                return '✅';
            default:
                return '📦';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'PENDING';
            case 'preparing':
                return 'PREPARING';
            case 'completed':
                return 'COMPLETED';
            default:
                return 'UNKNOWN';
        }
    };

    const isUrgent = order.urgency === 'critical' || order.urgency === 'high';
    const borderColor = isUrgent ? 'border-red-500 border-4' : 'border-gray-600 border-2';

    return (
        <div
            className={`${borderColor} bg-[#1f1f1f] rounded-lg p-6 flex flex-col h-full transition-all hover:shadow-xl`}
        >
            {/* Header: Order ID + Urgency */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-4xl font-bold text-[#f5f5f5]">
                        Order #{order._id.toString().slice(-6).toUpperCase()}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">ID: {order._id}</p>
                </div>
                {isUrgent && (
                    <div className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2">
                        <FaFire className="text-2xl text-yellow-300" />
                        <span className="text-white font-bold text-lg">URGENT</span>
                    </div>
                )}
            </div>

            {/* Customer & Table Info */}
            <div className="bg-[#262626] rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-lg">
                    <div>
                        <p className="text-gray-400 text-sm">CUSTOMER</p>
                        <p className="text-[#f5f5f5] font-bold text-xl">{order.customerName}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">TABLE</p>
                        <p className="text-[#f5f5f5] font-bold text-3xl">#{order.tableNumber}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">TIME</p>
                        <p className="text-[#f5f5f5] font-bold text-lg">{elapsedTime}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">ITEMS</p>
                        <p className="text-[#f5f5f5] font-bold text-2xl">{order.items.length}</p>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="bg-[#262626] rounded-lg p-4 mb-4 flex-grow">
                <p className="text-gray-400 text-sm mb-3 font-bold">ITEMS</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-[#1f1f1f] p-3 rounded">
                            <span className="text-[#f5f5f5] text-xl font-semibold">
                                {item.name}
                            </span>
                            <span className="text-[#f6b100] text-2xl font-bold">×{item.quantity}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="bg-amber-900 bg-opacity-40 border border-amber-700 rounded-lg p-3 mb-4">
                    <p className="text-gray-300 text-sm font-bold">📝 NOTES:</p>
                    <p className="text-[#f5f5f5] text-lg mt-1">{order.notes}</p>
                </div>
            )}

            {/* Special Item Notes */}
            {order.items.some(item => item.notes) && (
                <div className="bg-amber-900 bg-opacity-40 border border-amber-700 rounded-lg p-3 mb-4">
                    <p className="text-gray-300 text-sm font-bold">⚠️ ITEM NOTES:</p>
                    {order.items.map((item, index) => (
                        item.notes && (
                            <p key={index} className="text-[#f5f5f5] text-lg mt-2">
                                <span className="font-bold">{item.name}:</span> {item.notes}
                            </p>
                        )
                    ))}
                </div>
            )}

            {/* Status Badge */}
            <div className={`${getStatusColor(order.kitchenStatus)} rounded-lg p-4 mb-4 text-center`}>
                <p className="text-white text-2xl font-bold">
                    {getStatusEmoji(order.kitchenStatus)} {getStatusText(order.kitchenStatus)}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {order.kitchenStatus === 'pending' && (
                    <button
                        onClick={() => onUpdateStatus(order._id, 'preparing')}
                        disabled={isUpdating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
                    >
                        {isUpdating ? '⏳ Updating...' : '👨‍🍳 START COOKING'}
                    </button>
                )}

                {order.kitchenStatus === 'preparing' && (
                    <button
                        onClick={() => onUpdateStatus(order._id, 'completed')}
                        disabled={isUpdating}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
                    >
                        {isUpdating ? '⏳ Updating...' : '✅ MARK AS DONE'}
                    </button>
                )}

                {order.kitchenStatus === 'completed' && (
                    <button
                        disabled
                        className="flex-1 bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-xl cursor-not-allowed"
                    >
                        <FaCheckCircle className="inline mr-2" /> COMPLETED
                    </button>
                )}
            </div>
        </div>
    );
};

export default KitchenOrderCard;
