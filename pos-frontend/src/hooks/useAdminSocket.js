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

    // Initialize socket connection for admin
    useEffect(() => {
        if (!user?._id) {
            console.warn('⚠️ Admin Socket: User not loaded yet');
            return;
        }

        // Reuse existing socket if already initialized
        if (globalSocket && socketInitialized) {
            console.log('♻️ Reusing existing admin socket connection');
            socketRef.current = globalSocket;
            return;
        }

        console.log('👨‍💼 Initializing Admin Socket for:', user.name);

        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            transports: ['websocket', 'polling'],
            upgrade: true,
            path: '/socket.io/'
        });

        socketRef.current = socket;
        globalSocket = socket;
        socketInitialized = true;

        // Connection event
        socket.on('connect', () => {
            console.log('✅ 👨‍💼 Admin socket connected:', socket.id);
        });

        // Listen for kitchen status updates
        socket.on('kitchen_status_updated', (data) => {
            console.log('🔔 Kitchen status update received:', data);

            const { orderId, kitchenStatus, customerName, tableNumber, statusEmoji } = data;

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
                    `${statusEmoji} Bếp cập nhật: ${customerName} (Bàn ${tableNumber}) - ${statusText}`,
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
        });

        // Disconnect event
        socket.on('disconnect', () => {
            console.log('❌ Admin socket disconnected');
        });

        // Error event
        socket.on('error', (error) => {
            console.error('⚠️ Admin socket error:', error);
        });

        // Connect error event
        socket.on('connect_error', (error) => {
            console.error('⚠️ Admin socket connect_error:', error);
        });

        return () => {
            // Don't disconnect global socket when component unmounts
            // It will be reused by other components
            console.log('🔄 Admin socket hook cleanup (keeping connection alive)');
        };
    }, [user._id, user.name, queryClient, showNotifications]);

    return {
        socket: socketRef.current
    };
};
