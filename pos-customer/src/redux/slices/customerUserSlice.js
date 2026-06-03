import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    _id: "",
    name: "",
    email: "",
    phone: "",
    role: "",
    accountStatus: "",
    isAuth: false,
};

const customerUserSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            const { _id, name, phone, email, role, accountStatus } = action.payload;
            state._id = _id;
            state.name = name;
            state.phone = phone;
            state.email = email;
            state.role = role;
            state.accountStatus = accountStatus;
            state.isAuth = true;
        },
        removeUser: (state) => {
            state._id = "";
            state.email = "";
            state.name = "";
            state.phone = "";
            state.role = "";
            state.accountStatus = "";
            state.isAuth = false;
        },
    },
});

export const { setUser, removeUser } = customerUserSlice.actions;
export default customerUserSlice.reducer;