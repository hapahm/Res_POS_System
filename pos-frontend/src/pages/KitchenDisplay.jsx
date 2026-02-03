import React, { useState, useEffect } from 'react';
import KitchenOrderCard from '../components/kitchen/KitchenOrderCard';
import { useKitchenSocket } from '../hooks/useKitchenSocket';
import { FaCircle, FaUtensils } from 'react-icons/fa';

const KitchenDisplay = () => {
    const {
        orders,
        isConnected,
        elapsedTimes,
        updateOrderStatus,
        getOrdersByFilter,
        getFilteredOrders
    } = useKitchenSocket();

    const [filter, setFilter] = useState('all');
    const [updatingOrders, setUpdatingOrders] = useState(new Set());

    // Set page title
    useEffect(() => {
        document.title = 'POS | Màn hình bếp';
    }, []);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Handle status update
    const handleStatusUpdate = (orderId, newStatus) => {
        setUpdatingOrders(prev => new Set(prev).add(orderId));

        updateOrderStatus(orderId, newStatus);

        // Remove from updating after animation
        setTimeout(() => {
            setUpdatingOrders(prev => {
                const updated = new Set(prev);
                updated.delete(orderId);
                return updated;
            });
        }, 1000);
    };

    // Get filtered orders
    const filteredOrders = getFilteredOrders(filter);

    const filterButtons = [
        { label: '📦 Tất cả', value: 'all' },
        { label: '⏳ Chờ xử lý', value: 'pending' },
        { label: '👨‍🍳 Đang nấu', value: 'preparing' }
    ];

    return (
        <div className="bg-[#1f1f1f] min-h-screen w-full">
            {/* Header */}
            <header className="bg-[#262626] border-b-2 border-gray-700 p-6 sticky top-0 z-50">
                <div className="flex items-center justify-between">
                    {/* Left: Title */}
                    <div className="flex items-center gap-4">
                        <FaUtensils className="text-4xl text-[#f6b100]" />
                        <div>
                            <h1 className="text-4xl font-bold text-[#f5f5f5]">
                                🍳 MÀN HÌNH BẾP (KDS)
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Quản lý đơn hàng theo thời gian thực
                            </p>
                        </div>
                    </div>

                    {/* Right: Connection Status & Active Orders */}
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Đơn đang xử lý</p>
                            <p className="text-4xl font-bold text-[#f5f5f5]">
                                {filteredOrders.length}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 bg-[#1f1f1f] px-6 py-3 rounded-lg">
                            <FaCircle
                                className={`text-2xl ${isConnected
                                    ? 'text-green-500 animate-pulse'
                                    : 'text-red-500'
                                    }`}
                            />
                            <div>
                                <p className="text-gray-400 text-sm">Kết nối</p>
                                <p
                                    className={`text-lg font-bold ${isConnected
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                        }`}
                                >
                                    {isConnected
                                        ? 'Đã kết nối'
                                        : 'Mất kết nối'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-3 mt-6">
                    {filterButtons.map(btn => (
                        <button
                            key={btn.value}
                            onClick={() => setFilter(btn.value)}
                            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all ${filter === btn.value
                                ? 'bg-[#f6b100] text-[#1f1f1f]'
                                : 'bg-[#383838] text-[#ababab] hover:bg-[#454545]'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                {filteredOrders.length === 0 ? (
                    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-5xl mb-4">📭</p>
                            <p className="text-3xl text-gray-400">
                                Không có đơn hàng
                            </p>
                            <p className="text-gray-500 text-xl mt-2">
                                {filter === 'all'
                                    ? 'Đang chờ đơn mới...'
                                    : 'Hiện không có đơn phù hợp'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                        {filteredOrders.map(order => (
                            <div
                                key={order._id}
                                className={`transition-opacity ${updatingOrders.has(order._id)
                                    ? 'opacity-75'
                                    : 'opacity-100'
                                    }`}
                            >
                                <KitchenOrderCard
                                    order={order}
                                    elapsedTime={
                                        elapsedTimes[order._id] || 'đang tính...'
                                    }
                                    onUpdateStatus={handleStatusUpdate}
                                    isUpdating={updatingOrders.has(order._id)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer Info */}
            <footer className="bg-[#262626] border-t border-gray-700 p-4 text-center text-gray-500 text-sm mt-8">
                <p>
                    🍳 Màn hình bếp • Cập nhật lần cuối:{' '}
                    {new Date().toLocaleTimeString()}
                </p>
            </footer>
        </div>
    );
};

export default KitchenDisplay;
