import { axiosWrapper } from "../https/axiosWrapper";

const isForbiddenError = (error) => {
    const status = error?.response?.status;
    const message = `${error?.response?.data?.message || ""}`.toLowerCase();
    return status === 403 || message.includes("không có quyền") || message.includes("access denied");
};

export const normalizeApiErrorMessage = (error, fallbackMessage = "Đã xảy ra lỗi. Vui lòng thử lại.") => {
    const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallbackMessage;

    return `${message}`;
};

export const createCustomerOrder = async (payload) => {
    try {
        const response = await axiosWrapper.post("/api/customer/orders", payload);
        return response?.data;
    } catch (error) {
        throw new Error(normalizeApiErrorMessage(error, "Không thể tạo đơn hàng."));
    }
};

export const createGuestCustomerOrder = async (payload) => {
    try {
        const response = await axiosWrapper.post("/api/customer/orders", payload);
        return response?.data;
    } catch (error) {
        throw new Error(normalizeApiErrorMessage(error, "Không thể tạo đơn hàng."));
    }
};

export const getMyOrders = async () => {
    try {
        const response = await axiosWrapper.get("/api/customer/orders");
        return response?.data;
    } catch (error) {
        if (isForbiddenError(error)) {
            try {
                const fallbackResponse = await axiosWrapper.get("/api/order");
                return fallbackResponse?.data;
            } catch (fallbackError) {
                throw new Error(normalizeApiErrorMessage(fallbackError, "Không thể tải danh sách đơn hàng."));
            }
        }
        throw new Error(normalizeApiErrorMessage(error, "Không thể tải danh sách đơn hàng."));
    }
};

export const getMyOrderDetail = async (orderId) => {
    try {
        const response = await axiosWrapper.get(`/api/customer/orders/${orderId}`);
        return response?.data;
    } catch (error) {
        if (isForbiddenError(error)) {
            try {
                const fallbackResponse = await axiosWrapper.get(`/api/order/${orderId}`);
                return fallbackResponse?.data;
            } catch (fallbackError) {
                throw new Error(normalizeApiErrorMessage(fallbackError, "Không thể tải chi tiết đơn hàng."));
            }
        }
        throw new Error(normalizeApiErrorMessage(error, "Không thể tải chi tiết đơn hàng."));
    }
};

export const cancelMyOrderItem = async ({ orderId, itemId }) => {
    try {
        const response = await axiosWrapper.post(`/api/customer/orders/${orderId}/items/cancel`, { itemId });
        return response?.data;
    } catch (error) {
        if (isForbiddenError(error)) {
            try {
                const fallbackResponse = await axiosWrapper.post(`/api/order/${orderId}/items/cancel`, { itemId });
                return fallbackResponse?.data;
            } catch (fallbackError) {
                throw new Error(normalizeApiErrorMessage(fallbackError, "Không thể hủy món trong đơn."));
            }
        }
        throw new Error(normalizeApiErrorMessage(error, "Không thể hủy món trong đơn."));
    }
};
