import { configureStore } from "@reduxjs/toolkit";
import customerSlice from "./slices/customerSlice"
import cartSlice from "./slices/cartSlice";
import userSlice from "./slices/userSlice";
import chatSlice from "./slices/chatSlice";

const store = configureStore({
    reducer: {
        customer: customerSlice,
        cart: cartSlice,
        user: userSlice,
        chat: chatSlice
    },

    devTools: import.meta.env.NODE_ENV !== "production",
});

export default store;
