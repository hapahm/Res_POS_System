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
            state.customers = action.payload;
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
