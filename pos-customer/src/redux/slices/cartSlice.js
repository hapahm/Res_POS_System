import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const getItemKey = (item = {}) => {
    return `${item.dishId || item.id || ""}`;
};

const recalculateItem = (item = {}) => {
    const safeQuantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.pricePerQuantity ?? item.price ?? 0) || 0;

    return {
        ...item,
        quantity: safeQuantity,
        pricePerQuantity: unitPrice,
        price: unitPrice * safeQuantity,
        notes: item.notes || "",
        id: item.id || item.dishId || `${Date.now()}`,
    };
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addItems: (state, action) => {
            const incomingItem = recalculateItem(action.payload || {});
            const incomingKey = getItemKey(incomingItem);

            const existingItem = state.find((item) => getItemKey(item) === incomingKey);
            if (existingItem) {
                const nextQuantity = (Number(existingItem.quantity) || 1) + (Number(incomingItem.quantity) || 1);
                existingItem.quantity = nextQuantity;
                existingItem.pricePerQuantity = Number(incomingItem.pricePerQuantity) || Number(existingItem.pricePerQuantity) || 0;
                existingItem.price = Number(existingItem.pricePerQuantity) * nextQuantity;
                if (!existingItem.imageUrl && incomingItem.imageUrl) {
                    existingItem.imageUrl = incomingItem.imageUrl;
                }
                return;
            }

            state.push(incomingItem);
        },

        removeItem: (state, action) => {
            return state.filter((item) => getItemKey(item) !== `${action.payload}` && `${item.id}` !== `${action.payload}`);
        },

        removeAllItems: (state) => {
            return [];
        },

        increaseQuantity: (state, action) => {
            const target = state.find((item) => getItemKey(item) === `${action.payload}` || `${item.id}` === `${action.payload}`);
            if (!target) return;
            target.quantity = (Number(target.quantity) || 1) + 1;
            target.price = (Number(target.pricePerQuantity) || 0) * target.quantity;
        },

        decreaseQuantity: (state, action) => {
            const target = state.find((item) => getItemKey(item) === `${action.payload}` || `${item.id}` === `${action.payload}`);
            if (!target) return;

            const nextQuantity = (Number(target.quantity) || 1) - 1;
            if (nextQuantity <= 0) {
                return state.filter((item) => getItemKey(item) !== `${action.payload}` && `${item.id}` !== `${action.payload}`);
            }

            target.quantity = nextQuantity;
            target.price = (Number(target.pricePerQuantity) || 0) * target.quantity;
        },

        hydrateCart: (state, action) => {
            const incoming = Array.isArray(action.payload) ? action.payload : [];
            return incoming.map((item) => recalculateItem(item));
        },

        updateItemNotes: (state, action) => {
            const { id, notes } = action.payload;
            const item = state.find((entry) => getItemKey(entry) === `${id}` || `${entry.id}` === `${id}`);
            if (item) {
                item.notes = `${notes || ""}`;
            }
        }
    }
})

export const selectCartItems = (state) => state.cart || [];
export const getCartCount = (state) => selectCartItems(state).reduce((total, item) => total + (Number(item.quantity) || 0), 0);
export const getCartSubtotal = (state) => selectCartItems(state).reduce((total, item) => total + ((Number(item.pricePerQuantity) || 0) * (Number(item.quantity) || 0)), 0);
export const getTotalPrice = getCartSubtotal;
export const getCartTotal = getCartSubtotal;

export const {
    addItems,
    removeItem,
    removeAllItems,
    increaseQuantity,
    decreaseQuantity,
    updateItemNotes,
    hydrateCart,
} = cartSlice.actions;
export default cartSlice.reducer;