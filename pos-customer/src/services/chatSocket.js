import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

let socket = null;

export const connectSocket = (userId, role) => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        console.log(`📌 Connecting as ${role}: ${userId}`);
        // Authenticate user after connection
        socket.emit('user_connect', { userId, role });
    });

    socket.on('connection_success', (data) => {
        console.log('✅ Authentication successful:', data);
        if (data.role === 'staff') {
            console.log('👨‍💼 Connected as STAFF - Ready to receive customer requests');
        }
    });

    socket.on('disconnect', () => console.log('❌ Socket disconnected'));
    socket.on('error', (error) => console.error('⚠️ Socket error:', error));

    return socket;
};

export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect();
        socket = null;
    }
};

export const getSocket = () => socket;

export const isSocketConnected = () => socket?.connected || false;

// Event emitters
export const joinChat = (userId, role) => {
    if (socket?.connected) {
        socket.emit('user_connect', { userId, role });
    }
};

export const sendMessage = (message, conversationId, targetCustomerId = null) => {
    if (socket?.connected) {
        const payload = { message, conversationId };
        if (targetCustomerId) {
            payload.targetCustomerId = targetCustomerId;
        }
        socket.emit('send_message', payload);
    }
};

export const acceptChat = (customerId, conversationId) => {
    if (socket?.connected) {
        socket.emit('accept_chat', { customerId, conversationId });
    }
};

export const getChatHistory = (conversationId) => {
    if (socket?.connected) {
        socket.emit('get_chat_history', { conversationId });
    }
};

export const requestStaff = (conversationId, message = 'Khách hàng yêu cầu hỗ trợ từ nhân viên') => {
    if (socket?.connected) {
        socket.emit('request_staff', { conversationId, message });
    }
};

// Event listeners
export const onConnectionSuccess = (callback) => {
    socket?.on('connection_success', callback);
};

export const onReceiveMessage = (callback) => {
    socket?.on('receive_message', callback);
};

export const onMessageSent = (callback) => {
    socket?.on('message_sent', callback);
};

export const onStaffRequest = (callback) => {
    if (!socket) {
        console.error('❌ Socket not initialized when setting up onStaffRequest listener');
        return;
    }
    console.log('🎧 Setting up staff_request listener');
    socket?.on('staff_request', (data) => {
        console.log('🆘 STAFF REQUEST RECEIVED:', data);
        callback(data);
    });
};

export const onStaffJoined = (callback) => {
    socket?.on('staff_joined', callback);
};

export const onChatAccepted = (callback) => {
    socket?.on('chat_accepted', callback);
};

export const onStaffStatusUpdate = (callback) => {
    socket?.on('staff_status_update', callback);
};

export const onStaffRequestSent = (callback) => {
    socket?.on('staff_request_sent', callback);
};

export const onChatHistory = (callback) => {
    socket?.on('chat_history', callback);
};

export const onSocketError = (callback) => {
    socket?.on('error', callback);
};

// Cleanup listeners
export const offReceiveMessage = () => {
    socket?.off('receive_message');
};

export const offConnectionSuccess = () => {
    socket?.off('connection_success');
};

export const offMessageSent = () => {
    socket?.off('message_sent');
};

export const offStaffRequest = () => {
    socket?.off('staff_request');
};

export const offStaffJoined = () => {
    socket?.off('staff_joined');
};

export const offChatAccepted = () => {
    socket?.off('chat_accepted');
};

export const offStaffStatusUpdate = () => {
    socket?.off('staff_status_update');
};

export const offStaffRequestSent = () => {
    socket?.off('staff_request_sent');
};

export const offChatHistory = () => {
    socket?.off('chat_history');
};

export const offSocketError = () => {
    socket?.off('error');
};
