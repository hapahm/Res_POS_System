import { axiosWrapper } from "./axiosWrapper";

// API Endpoints

// Auth Endpoints
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => axiosWrapper.post("/api/user/logout");
export const getInternalAccounts = () => axiosWrapper.get("/api/user/admin/accounts");
export const updateInternalAccountStatus = ({ userId, accountStatus }) =>
  axiosWrapper.patch(`/api/user/admin/accounts/${userId}/status`, { accountStatus });
export const updateInternalAccountRole = ({ userId, role }) =>
  axiosWrapper.patch(`/api/user/admin/accounts/${userId}/role`, { role });

// Table Endpoints
export const addTable = (data) => axiosWrapper.post("/api/table/", data);
export const getTables = () => axiosWrapper.get("/api/table");
export const updateTable = ({ tableId, ...tableData }) =>
  axiosWrapper.put(`/api/table/${tableId}`, tableData);
export const deleteTable = (tableId) =>
  axiosWrapper.delete(`/api/table/${tableId}`);

// Category Endpoints
export const getCategories = () => axiosWrapper.get("/api/category");
export const addCategory = (data) => axiosWrapper.post("/api/category", data);
export const updateCategory = ({ categoryId, ...data }) =>
  axiosWrapper.put(`/api/category/${categoryId}`, data);
export const deleteCategory = (categoryId) =>
  axiosWrapper.delete(`/api/category/${categoryId}`);

// Dish Endpoints
export const getDishes = (categoryId) =>
  axiosWrapper.get(categoryId ? `/api/dish?categoryId=${categoryId}` : "/api/dish");
export const addDish = (data) => axiosWrapper.post("/api/dish", data);
export const updateDish = ({ dishId, ...data }) =>
  axiosWrapper.put(`/api/dish/${dishId}`, data);
export const deleteDish = (dishId) =>
  axiosWrapper.delete(`/api/dish/${dishId}`);

// Upload Endpoints
export const uploadDishImage = (formData) =>
  axiosWrapper.post("/api/upload/dish-image", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

// Payment Endpoints
export const createOrderRazorpay = (data) =>
  axiosWrapper.post("/api/payment/create-order", data);
export const verifyPaymentRazorpay = (data) =>
  axiosWrapper.post("/api/payment//verify-payment", data);
export const markTablePaid = (tableId) =>
  axiosWrapper.post("/api/payment/mark-paid", { tableId });
export const createVnpayPayment = (orderId) =>
  axiosWrapper.post("/api/payment/vnpay/create", { orderId });

// Order Endpoints
export const addOrder = (data) => axiosWrapper.post("/api/order/", data);
export const getOrders = (search = "", paymentStatus = "") => {
  const params = new URLSearchParams();
  if (search?.trim()) params.append("search", search.trim());
  if (paymentStatus && ["paid", "unpaid"].includes(paymentStatus)) {
    params.append("paymentStatus", paymentStatus);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return axiosWrapper.get(`/api/order${query}`);
};
export const getPendingCustomerOrders = () => axiosWrapper.get("/api/admin/orders/approvals");
export const approveCustomerOrder = (orderId) => axiosWrapper.post(`/api/admin/orders/${orderId}/approve`);
export const rejectCustomerOrder = (orderId) => axiosWrapper.delete(`/api/admin/orders/${orderId}/reject`);
export const getPaymentHistory = ({ date = "", table = "", paymentMethod = "" } = {}) => {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (table) params.append("table", table);
  if (paymentMethod) params.append("paymentMethod", paymentMethod);
  const query = params.toString() ? `?${params.toString()}` : "";
  return axiosWrapper.get(`/api/order/payments/history${query}`);
};
export const updateOrderStatus = ({ orderId, orderStatus }) =>
  axiosWrapper.put(`/api/order/${orderId}`, { orderStatus });
export const updateKitchenStatus = ({ orderId, kitchenStatus }) =>
  axiosWrapper.put(`/api/kitchen/orders/${orderId}/status`, { kitchenStatus });
export const cancelOrderItem = ({ orderId, itemId }) =>
  axiosWrapper.post(`/api/order/${orderId}/items/cancel`, { itemId });

// Table Orders Endpoints
export const getTableOrders = (tableId) =>
  axiosWrapper.get(`/api/table/${tableId}/orders`);

// Report Endpoints
export const getMetrics = () => axiosWrapper.get("/api/report/metrics");
export const getDishStats = () => axiosWrapper.get("/api/report/dish-stats");
export const getCategoryStats = () => axiosWrapper.get("/api/report/category-stats");
