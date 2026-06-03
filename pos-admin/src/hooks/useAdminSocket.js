import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Global socket instance to prevent multiple connections
let globalSocket = null;
let socketInitialized = false;

export const useAdminSocket = (options = {}) => {
    const { showNotifications = false } = options;
    const userState = useSelector(state => state.user);
    const user = userState;
    const socketRef = useRef(null);
    const queryClient = useQueryClient();
    const lastNotificationRef = useRef(null);
    const orderNotificationMapRef = useRef({});

    // Initialize socket connection for admin
    useEffect(() => {
        if (!user?._id) {
            console.warn('⚠️ Admin Socket: User not loaded yet');
            return;
        }

        let socket = globalSocket;
        if (!socket || !socketInitialized) {
            console.log('👨‍💼 Initializing Admin Socket for:', user.name);
            socket = io(SOCKET_URL, {
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: Infinity,
                transports: ['websocket', 'polling'],
                upgrade: true,
                path: '/socket.io/'
            });

            globalSocket = socket;
            socketInitialized = true;
        } else {
            console.log('♻️ Reusing existing admin socket connection');
        }

        socketRef.current = socket;

        const shouldDispatchOrderNotification = (orderId) => {
            if (!orderId) return false;

            const now = Date.now();
            const previous = orderNotificationMapRef.current[orderId] || 0;
            if (now - previous < 2500) {
                return false;
            }

            orderNotificationMapRef.current[orderId] = now;

            Object.keys(orderNotificationMapRef.current).forEach((key) => {
                if (now - orderNotificationMapRef.current[key] > 15000) {
                    delete orderNotificationMapRef.current[key];
                }
            });

            return true;
        };

        const handleConnect = () => {
            console.log('✅ 👨‍💼 Admin socket connected:', socket.id);
        };

        // Listen for kitchen status updates
        const handleKitchenStatusUpdated = (data) => {
            console.log('🔔 Kitchen status update received:', data);

            const { orderId, kitchenStatus, customerName, tableNumber } = data;

            // Prevent duplicate notifications - only show if enabled and not a duplicate
            const notificationKey = `${orderId}-${kitchenStatus}`;
            if (showNotifications && lastNotificationRef.current !== notificationKey) {
                lastNotificationRef.current = notificationKey;

                // Show toast notification
                const statusText = {
                    'pending': 'Đang chờ',
                    'preparing': 'Đang chế biến',
                    'completed': 'Hoàn thành',
                    'cancelled': 'Đã hủy'
                }[kitchenStatus] || kitchenStatus;

                enqueueSnackbar(
                    `Bếp cập nhật: ${customerName} (Bàn ${tableNumber}) - ${statusText}`,
                    {
                        variant: kitchenStatus === 'completed' ? 'success' : 'info',
                        autoHideDuration: 4000
                    }
                );
            }

            // Invalidate orders query to refresh data
            queryClient.invalidateQueries(['orders']);

            // Optional: Update specific order in cache optimistically
            queryClient.setQueryData(['orders'], (oldData) => {
                if (!oldData?.data?.data) return oldData;

                const updatedOrders = oldData.data.data.map(order =>
                    order._id === orderId
                        ? { ...order, kitchenStatus }
                        : order
                );

                return {
                    ...oldData,
                    data: {
                        ...oldData.data,
                        data: updatedOrders
                    }
                };
            });
        };

        const handleCustomerOrderCreated = (data) => {
            console.log('🔔 New customer order waiting approval:', data);

            queryClient.invalidateQueries({ queryKey: ['pendingCustomerOrders'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            queryClient.setQueryData(['pendingCustomerOrders'], (oldData) => {
                const current = oldData?.data?.data;
                if (!Array.isArray(current)) return oldData;

                const incomingOrderId = `${data?.orderId || ''}`;
                const alreadyExists = current.some((order) => `${order?._id || ''}` === incomingOrderId);
                if (alreadyExists || !incomingOrderId) return oldData;

                const optimisticOrder = {
                    _id: incomingOrderId,
                    table: {
                        _id: data?.tableId || null,
                        tableNo: data?.tableNo || '--',
                    },
                    customerDetails: {
                        name: data?.customerName || 'Khách',
                        phone: data?.customerPhone || 'Không rõ',
                        guests: Number(data?.guests || 1),
                    },
                    items: Array.from({ length: Number(data?.itemCount || 0) }).map((_, index) => ({
                        name: `Món ${index + 1}`,
                        quantity: 1,
                    })),
                    bills: {
                        totalWithTax: Number(data?.totalAmount || 0),
                    },
                    orderDate: data?.createdAt || new Date().toISOString(),
                    createdAt: data?.createdAt || new Date().toISOString(),
                };

                return {
                    ...oldData,
                    data: {
                        ...oldData.data,
                        data: [optimisticOrder, ...current],
                    },
                };
            });

            const incomingOrderId = `${data?.orderId || ''}`;
            if (shouldDispatchOrderNotification(incomingOrderId)) {
                window.dispatchEvent(new CustomEvent('admin-customer-order-notification', {
                    detail: data,
                }));
            }

            if (showNotifications) {
                enqueueSnackbar(
                    `Đơn mới từ ${data?.customerName || 'khách hàng'} - Bàn ${data?.tableNo || '--'}`,
                    {
                        variant: 'info',
                        autoHideDuration: 5000,
                    }
                );
            }
        };

        const handleCustomerOrderApproved = (data) => {
            const approvedOrderId = `${data?.orderId || ''}`;
            if (!approvedOrderId) return;

            queryClient.invalidateQueries({ queryKey: ['pendingCustomerOrders'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            queryClient.setQueryData(['pendingCustomerOrders'], (oldData) => {
                const current = oldData?.data?.data;
                if (!Array.isArray(current)) return oldData;

                return {
                    ...oldData,
                    data: {
                        ...oldData.data,
                        data: current.filter((order) => `${order?._id || ''}` !== approvedOrderId),
                    },
                };
            });
        };

        const handleCustomerOrderRejected = (data) => {
            const rejectedOrderId = `${data?.orderId || ''}`;
            if (!rejectedOrderId) return;

            queryClient.invalidateQueries({ queryKey: ['pendingCustomerOrders'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            queryClient.setQueryData(['pendingCustomerOrders'], (oldData) => {
                const current = oldData?.data?.data;
                if (!Array.isArray(current)) return oldData;

                return {
                    ...oldData,
                    data: {
                        ...oldData.data,
                        data: current.filter((order) => `${order?._id || ''}` !== rejectedOrderId),
                    },
                };
            });
        };

        // Disconnect event
        const handleDisconnect = () => {
            console.log('❌ Admin socket disconnected');
        };

        // Error event
        const handleError = (error) => {
            console.error('⚠️ Admin socket error:', error);
        };

        // Connect error event
        const handleConnectError = (error) => {
            console.error('⚠️ Admin socket connect_error:', error);
        };

        socket.on('connect', handleConnect);
        socket.on('kitchen_status_updated', handleKitchenStatusUpdated);
        socket.on('customer_order_created', handleCustomerOrderCreated);
        socket.on('customer_order_approved', handleCustomerOrderApproved);
        socket.on('customer_order_rejected', handleCustomerOrderRejected);
        socket.on('disconnect', handleDisconnect);
        socket.on('error', handleError);
        socket.on('connect_error', handleConnectError);

        return () => {
            // Don't disconnect global socket when component unmounts
            // It will be reused by other components
            socket.off('connect', handleConnect);
            socket.off('kitchen_status_updated', handleKitchenStatusUpdated);
            socket.off('customer_order_created', handleCustomerOrderCreated);
            socket.off('customer_order_approved', handleCustomerOrderApproved);
            socket.off('customer_order_rejected', handleCustomerOrderRejected);
            socket.off('disconnect', handleDisconnect);
            socket.off('error', handleError);
            socket.off('connect_error', handleConnectError);
            console.log('🔄 Admin socket hook cleanup (keeping connection alive)');
        };
    }, [user._id, user.name, queryClient, showNotifications]);

    return {
        socket: socketRef.current
    };
};
