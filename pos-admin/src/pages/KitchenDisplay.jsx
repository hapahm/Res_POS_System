import React, { useState, useEffect } from 'react';
import KitchenOrderCard from '../components/kitchen/KitchenOrderCard';
import { useKitchenSocket } from '../hooks/useKitchenSocket';
import { FaCircle } from 'react-icons/fa';

const KitchenDisplay = () => {
    const {
        orders,
        isConnected,
        elapsedTimes,
        updateOrderStatus,
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

    const isWithinLast12Hours = (dateInput) => {
        if (!dateInput) return false;
        const orderTime = new Date(dateInput).getTime();
        if (Number.isNaN(orderTime)) return false;

        const twelveHoursMs = 12 * 60 * 60 * 1000;
        return Date.now() - orderTime <= twelveHoursMs;
    };

    const recentOrders = orders.filter((order) => {
        const sourceTime = order.orderTime || order.createdAt || order.orderDate;
        return isWithinLast12Hours(sourceTime);
    });

    // Get filtered orders (only last 12 hours)
    const filteredOrders = (() => {
        if (filter === 'all') return recentOrders;
        if (filter === 'cancelled') {
            return recentOrders.filter(order =>
                order.items && order.items.some(item => item.cancelled_at || item.status === 'cancelled')
            );
        }

        return recentOrders.filter(order => order.kitchenStatus === filter);
    })();

    // Get all cancelled items across all orders
    const cancelledItems = recentOrders.flatMap(order =>
        (order.items || [])
            .filter(item => item.cancelled_at || item.status === 'cancelled')
            .map(item => ({
                ...item,
                orderId: order._id,
                tableNumber: order.tableNumber,
                customerName: order.customerName,
                orderTime: order.orderTime
            }))
    );

    const filterButtons = [
        { label: 'Tất cả', value: 'all' },
        { label: 'Chờ xử lý', value: 'pending' },
        { label: 'Đang nấu', value: 'preparing' },
        { label: 'Hoàn thành', value: 'completed' },
        // { label: '❌ Đã hủy', value: 'cancelled' }
    ];

    return (
        <div className="bg-[#1f1f1f] min-h-screen w-full text-[#f5f5f5]">
            {/* Header */}
            <header className="bg-[#262626] border-b border-gray-700 p-5 sticky top-0 z-50">
                <div className="w-full flex items-center justify-between gap-6">
                    {/* Left: Title */}
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#f5f5f5]">
                                MÀN HÌNH BẾP (KDS)
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Quản lý đơn hàng theo thời gian thực • Hiển thị đơn trong 12 giờ gần nhất
                            </p>
                        </div>
                    </div>

                    {/* Right: Connection Status & Active Orders */}
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-gray-400 text-sm">Đơn trong 12 giờ gần nhất</p>
                            <p className="text-3xl font-bold text-[#f5f5f5]">
                                {filteredOrders.length}
                            </p>
                        </div>

                        {/* Cancelled Items Counter */}
                        {cancelledItems.length > 0 && (
                            <div className="text-right bg-[#3b2a2a] border border-[#6b3c3c] px-4 py-2 rounded-lg">
                                <p className="text-[#f3b8b8] text-sm">Món đã hủy</p>
                                <p className="text-3xl font-bold text-[#ffd0d0]">
                                    {cancelledItems.length}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 bg-[#1f1f1f] px-5 py-2.5 rounded-lg border border-gray-700">
                            <FaCircle
                                className={`text-xl ${isConnected
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                    }`}
                            />
                            <div>
                                <p className="text-gray-400 text-sm">Kết nối</p>
                                <p
                                    className={`text-lg font-bold ${isConnected
                                        ? 'text-emerald-400'
                                        : 'text-rose-400'
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
                <div className="flex gap-3 mt-5 flex-wrap">
                    {filterButtons.map(btn => (
                        <button
                            key={btn.value}
                            onClick={() => setFilter(btn.value)}
                            className={`px-5 py-2.5 rounded-lg font-semibold text-base transition-all ${filter === btn.value
                                ? 'bg-[#f6b100] text-[#1f1f1f]'
                                : 'bg-[#383838] text-[#d1d5db] hover:bg-[#444444]'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full p-5">
                {/* Cancelled Items Section */}
                {cancelledItems.length > 0 && (
                    <div className="mb-6 bg-[#2b2323] border border-[#6b3c3c] rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-[#ffd0d0]">
                                    Món đã hủy ({cancelledItems.length})
                                </h2>
                                <p className="text-[#f3b8b8] text-sm">
                                    Danh sách các món đã bị hủy gần đây
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {cancelledItems.map((item, index) => (
                                <div
                                    key={`${item.orderId}-${item._id}-${index}`}
                                    className="bg-[#262626] border border-[#6b3c3c] rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <p className="text-[#ffd0d0] font-bold text-lg mb-1">
                                                {item.name}
                                            </p>
                                            <p className="text-gray-300 text-sm">
                                                Số lượng: <span className="text-[#ffd0d0] font-bold">×{item.quantity}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700 mt-3 pt-3 space-y-1">
                                        <p className="text-gray-300 text-sm">
                                            Bàn: <span className="text-[#f5f5f5] font-semibold">#{item.tableNumber}</span>
                                        </p>
                                        <p className="text-gray-300 text-sm">
                                            Khách: <span className="text-[#f5f5f5]">{item.customerName}</span>
                                        </p>
                                        <p className="text-[#f3b8b8] text-xs mt-2">
                                            Hủy lúc: {new Date(item.cancelled_at).toLocaleTimeString('vi-VN')}
                                        </p>
                                    </div>

                                    {item.notes && (
                                        <div className="mt-3 bg-[#5a4a2f] rounded p-2 border border-[#8b7440]">
                                            <p className="text-[#ffdf9a] text-xs">
                                                Ghi chú: {item.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {filteredOrders.length === 0 ? (
                    <div className="h-[calc(100vh-300px)] flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-2xl text-gray-400">
                                Không có đơn hàng
                            </p>
                            <p className="text-gray-500 text-lg mt-2">
                                {filter === 'all'
                                    ? 'Đang chờ đơn mới trong 12 giờ gần nhất...'
                                    : 'Hiện không có đơn phù hợp'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-max">
                        {filteredOrders.map(order => (
                            <div
                                key={order._id}
                                className={`w-full transition-opacity ${updatingOrders.has(order._id)
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
            <footer className="bg-[#262626] border-t border-gray-700 p-4 text-center text-gray-400 text-sm mt-8">
                <p>
                    Màn hình bếp • Cập nhật lần cuối:{' '}
                    {new Date().toLocaleTimeString()}
                </p>
            </footer>
        </div>
    );
};

export default KitchenDisplay;
