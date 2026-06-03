import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    messages: [],           // All messages in current conversation
    customers: [],          // Active customers (for staff view)
    currentCustomerId: null,
    currentCustomerName: "",
    isStaffOnline: false,   // Staff online status
    loading: false,
    error: null,
    socketConnected: false
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        // Messages
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        clearMessages: (state) => {
            state.messages = [];
        },

        // Customers list (for staff)
        setCustomers: (state, action) => {
            state.customers = [...action.payload].sort((a, b) => {
                const timeA = new Date(a.lastMessageTime || 0).getTime();
                const timeB = new Date(b.lastMessageTime || 0).getTime();
                return timeB - timeA;
            });
        },
        upsertCustomer: (state, action) => {
            const incoming = action.payload;
            const existingIndex = state.customers.findIndex(c => c.id === incoming.id);

            if (existingIndex >= 0) {
                state.customers[existingIndex] = {
                    ...state.customers[existingIndex],
                    ...incoming
                };
            } else {
                state.customers.push(incoming);
            }

            state.customers.sort((a, b) => {
                const timeA = new Date(a.lastMessageTime || 0).getTime();
                const timeB = new Date(b.lastMessageTime || 0).getTime();
                return timeB - timeA;
            });
        },
        addCustomer: (state, action) => {
            if (!state.customers.find(c => c.id === action.payload.id)) {
                state.customers.push(action.payload);
            }
        },
        removeCustomer: (state, action) => {
            state.customers = state.customers.filter(c => c.id !== action.payload);
        },

        // UI state
        setCurrentCustomer: (state, action) => {
            const { customerId, customerName } = action.payload;
            state.currentCustomerId = customerId;
            state.currentCustomerName = customerName;
            state.messages = [];
        },
        clearCurrentCustomer: (state) => {
            state.currentCustomerId = null;
            state.currentCustomerName = "";
            state.messages = [];
        },
        toggleStaffOnline: (state) => {
            state.isStaffOnline = !state.isStaffOnline;
        },
        setStaffOnline: (state, action) => {
            state.isStaffOnline = action.payload;
        },
        setSocketConnected: (state, action) => {
            state.socketConnected = action.payload;
        },

        // Loading & Errors
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const {
    addMessage,
    setMessages,
    clearMessages,
    setCustomers,
    upsertCustomer,
    addCustomer,
    removeCustomer,
    setCurrentCustomer,
    clearCurrentCustomer,
    toggleStaffOnline,
    setStaffOnline,
    setSocketConnected,
    setLoading,
    setError
} = chatSlice.actions;

export default chatSlice.reducer;
