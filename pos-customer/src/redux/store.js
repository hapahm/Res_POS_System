import { configureStore } from "@reduxjs/toolkit";
import customerSlice from "./slices/customerSessionSlice";
import cartSlice from "./slices/cartSlice";
import userSlice from "./slices/customerUserSlice";
import chatSlice from "./slices/chatSlice";

const CART_STORAGE_KEY = "pos_customer_cart";

const loadCartState = () => {
    try {
        const cartState = localStorage.getItem(CART_STORAGE_KEY);
        if (!cartState) return undefined;
        const parsed = JSON.parse(cartState);
        if (!Array.isArray(parsed)) return undefined;
        return parsed;
    } catch (error) {
        return undefined;
    }
};

const store = configureStore({
    preloadedState: {
        cart: loadCartState() || [],
    },
    reducer: {
        customer: customerSlice,
        cart: cartSlice,
        user: userSlice,
        chat: chatSlice
    },

    devTools: import.meta.env.NODE_ENV !== "production",
});

store.subscribe(() => {
    try {
        const cartState = store.getState().cart || [];
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    } catch (error) {
        // ignore localStorage write errors
    }
});

export default store;
