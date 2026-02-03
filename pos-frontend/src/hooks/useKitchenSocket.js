import { useEffect, useState, useCallback, useRef } from 'react';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const useKitchenSocket = () => {
    const userState = useSelector(state => state.user);
    const user = userState;
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [orders, setOrders] = useState([]);
    const [elapsedTimes, setElapsedTimes] = useState({});

    // Debug: Log user state
    useEffect(() => {
        console.log('👤 User State in Kitchen:', { userState, userId: userState?._id });
    }, [userState]);

    // Utility: Play notification sound
    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }, []);

    // Utility: Calculate elapsed time
    const getElapsedTime = useCallback((createdAt) => {
        const now = new Date().getTime();
        const created = new Date(createdAt).getTime();
        const diffMs = now - created;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins === 1) return '1m ago';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return '1h ago';
        return `${diffHours}h ago`;
    }, []);

    // Update elapsed times periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTimes(prev => {
                const newTimes = { ...prev };
                orders.forEach(order => {
                    newTimes[order._id] = getElapsedTime(order.orderTime);
                });
                return newTimes;
            });
        }, 60000); // Update every minute

        // Initialize elapsed times
        const initialTimes = {};
        orders.forEach(order => {
            initialTimes[order._id] = getElapsedTime(order.orderTime);
        });
        setElapsedTimes(initialTimes);

        return () => clearInterval(interval);
    }, [orders, getElapsedTime]);

    // Initialize socket and connect
    useEffect(() => {
        console.log('🍳 Initializing Kitchen Socket - User ID:', user?._id);

        if (!user?._id) {
            console.warn('⚠️ Kitchen Socket: User not loaded yet');
            setIsConnected(false);
            return;
        }

        console.log('✅ Kitchen Socket: User loaded, connecting to', SOCKET_URL);

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

        // Connection event
        socket.on('connect', () => {
            console.log('✅ 🍳 Kitchen socket connected:', socket.id);
            setIsConnected(true);

            // Authenticate as kitchen staff
            const authData = {
                userId: user._id,
                staffName: user.name || 'Kitchen Staff'
            };
            console.log('📤 Sending kitchen_connect:', authData);
            socket.emit('kitchen_connect', authData);

            // Request initial orders
            socket.emit('get_kitchen_orders', { filter: 'all' });
        });

        // Kitchen connected response
        socket.on('kitchen_connected', (data) => {
            console.log('✅ Kitchen authentication successful:', data);
        });

        // Receive new order
        socket.on('new_order', (orderData) => {
            console.log('📦 New order received:', orderData);

            // Play notification sound
            playNotificationSound();

            // Add to orders
            setOrders(prev => {
                // Check if order already exists
                if (prev.find(o => o._id === orderData.orderId)) {
                    return prev;
                }
                return [{ ...orderData, _id: orderData.orderId }, ...prev];
            });

            // Show toast notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`🚀 New Order - Table ${orderData.tableNumber}`, {
                    body: `${orderData.items.length} items`,
                    tag: `order-${orderData.orderId}`
                });
            }
        });

        // Receive kitchen orders list
        socket.on('kitchen_orders_list', (data) => {
            console.log('📋 Kitchen orders received:', data);
            setOrders(data.orders || []);
        });

        // Order cancelled
        socket.on('order_cancelled', (data) => {
            console.log('❌ Order cancelled:', data);
            setOrders(prev => prev.filter(o => o._id !== data.orderId));
        });

        // Status update confirmation
        socket.on('status_updated', (data) => {
            console.log('✅ Status updated:', data);
            setOrders(prev =>
                prev.map(order =>
                    order._id === data.orderId
                        ? { ...order, kitchenStatus: data.kitchenStatus }
                        : order
                )
            );
        });

        // Disconnect event
        socket.on('disconnect', () => {
            console.log('❌ Kitchen socket disconnected');
            setIsConnected(false);
        });

        // Error event
        socket.on('error', (error) => {
            console.error('⚠️ Kitchen socket error:', error);
        });

        // Connect error event
        socket.on('connect_error', (error) => {
            console.error('⚠️ Kitchen socket connect_error:', error);
        });

        return () => {
            if (socket.connected) {
                socket.disconnect();
            }
        };
    }, [user._id, user.name]);

    // Update kitchen status
    const updateOrderStatus = useCallback((orderId, newStatus) => {
        if (!socketRef.current?.connected) {
            console.error('Socket not connected');
            return;
        }

        console.log(`Updating order ${orderId} status to ${newStatus}`);

        // Optimistic update
        setOrders(prev =>
            prev.map(order =>
                order._id === orderId
                    ? { ...order, kitchenStatus: newStatus }
                    : order
            )
        );

        // Emit to server
        socketRef.current.emit('update_kitchen_status', {
            orderId,
            kitchenStatus: newStatus
        });

        // Auto-hide completed orders after 30 seconds
        if (newStatus === 'completed') {
            setTimeout(() => {
                setOrders(prev => prev.filter(o => o._id !== orderId));
            }, 30000);
        }
    }, []);

    // Request orders with filter
    const getOrdersByFilter = useCallback((filter) => {
        if (!socketRef.current?.connected) {
            console.error('Socket not connected');
            return;
        }

        socketRef.current.emit('get_kitchen_orders', { filter });
    }, []);

    // Get filtered orders
    const getFilteredOrders = useCallback((filter) => {
        if (filter === 'all') return orders;
        return orders.filter(order => order.kitchenStatus === filter);
    }, [orders]);

    return {
        orders,
        isConnected,
        elapsedTimes,
        updateOrderStatus,
        getOrdersByFilter,
        getFilteredOrders,
        socket: socketRef.current
    };
};
