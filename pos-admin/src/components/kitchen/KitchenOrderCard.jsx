import React from 'react';

const KitchenOrderCard = ({ order, elapsedTime, onUpdateStatus, isUpdating }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]';
            case 'preparing':
                return 'bg-[#dbeafe] text-[#1e40af] border border-[#93c5fd]';
            case 'completed':
                return 'bg-[#dcfce7] text-[#166534] border border-[#86efac]';
            default:
                return 'bg-[#e5e7eb] text-[#374151] border border-[#d1d5db]';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'ĐANG CHỜ';
            case 'preparing':
                return 'ĐANG CHẾ BIẾN';
            case 'completed':
                return 'HOÀN THÀNH';
            default:
                return 'KHÔNG RÕ';
        }
    };

    return (
        <div
            className="border border-gray-700 bg-[#262626] rounded-lg p-5 flex flex-col h-full transition-all hover:shadow-lg"
        >
            {/* Header: Order ID */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-[#f5f5f5]">
                        Đơn #{order._id.toString().slice(-6).toUpperCase()}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Mã: {order._id}</p>
                </div>
            </div>

            {/* Customer & Table Info */}
            <div className="bg-[#1f1f1f] rounded-lg p-4 mb-4 border border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-base">
                    <div>
                        <p className="text-gray-400 text-sm">KHÁCH</p>
                        <p className="text-[#f5f5f5] font-semibold text-lg">{order.customerName}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">BÀN</p>
                        <p className="text-[#f5f5f5] font-bold text-2xl">#{order.tableNumber}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">THỜI GIAN</p>
                        <p className="text-[#f5f5f5] font-semibold text-base">{elapsedTime}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">SỐ MÓN</p>
                        <p className="text-[#f5f5f5] font-bold text-xl">{order.items.length}</p>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="bg-[#1f1f1f] rounded-lg p-4 mb-4 flex-grow border border-gray-700">
                <p className="text-gray-400 text-sm mb-3 font-bold">DANH SÁCH MÓN</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {order.items.map((item, index) => {
                        const isCancelled = item.cancelled_at || item.status === 'cancelled';
                        return (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded ${isCancelled
                                    ? 'bg-gray-700 border border-gray-600 line-through opacity-70'
                                    : 'bg-[#262626] border border-gray-700'
                                    }`}
                            >
                                <span className="text-[#f5f5f5] text-lg font-medium">
                                    {isCancelled && '[Đã hủy] '}
                                    {item.name}
                                </span>
                                <span className={`text-xl font-bold ${isCancelled ? 'text-gray-400' : 'text-[#e7b14d]'}`}>
                                    ×{item.quantity}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="bg-[#5a4a2f] border border-[#8b7440] rounded-lg p-3 mb-4">
                    <p className="text-[#ffdf9a] text-sm font-bold">GHI CHÚ:</p>
                    <p className="text-[#f5f5f5] text-lg mt-1">{order.notes}</p>
                </div>
            )}

            {/* Special Item Notes */}
            {order.items.some(item => item.notes) && (
                <div className="bg-[#5a4a2f] border border-[#8b7440] rounded-lg p-3 mb-4">
                    <p className="text-[#ffdf9a] text-sm font-bold">GHI CHÚ TỪNG MÓN:</p>
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
                <p className="text-xl font-semibold tracking-wide">
                    {getStatusText(order.kitchenStatus)}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {order.kitchenStatus === 'pending' && (
                    <button
                        onClick={() => onUpdateStatus(order._id, 'preparing')}
                        disabled={isUpdating}
                        className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-400 text-white font-semibold py-3 px-5 rounded-lg text-lg transition-colors"
                    >
                        {isUpdating ? 'Đang cập nhật...' : 'Bắt đầu chế biến'}
                    </button>
                )}

                {order.kitchenStatus === 'preparing' && (
                    <button
                        onClick={() => onUpdateStatus(order._id, 'completed')}
                        disabled={isUpdating}
                        className="flex-1 bg-[#16a34a] hover:bg-[#15803d] disabled:bg-gray-400 text-white font-semibold py-3 px-5 rounded-lg text-lg transition-colors"
                    >
                        {isUpdating ? 'Đang cập nhật...' : 'Đánh dấu hoàn thành'}
                    </button>
                )}

                {order.kitchenStatus === 'completed' && (
                    <button
                        disabled
                        className="flex-1 bg-gray-600 text-white font-semibold py-3 px-5 rounded-lg text-lg cursor-not-allowed"
                    >
                        Hoàn thành
                    </button>
                )}
            </div>
        </div>
    );
};

export default KitchenOrderCard;
