import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import io from "socket.io-client";
import { getMyOrders } from "../services/customerOrder.service";
import { enqueueSnackbar } from "notistack";
import CustomerHeader from "../components/customer/CustomerHeader";
import Footer from "../components/customer/Footer";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const Orders = () => {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "POS | Đơn của tôi";
  }, []);

  const {
    data: resData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: getMyOrders,
    refetchOnWindowFocus: false,
  });

  const formatCurrencyVnd = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const formatDateTimeVi = (date) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(date));
  };

  const getKitchenStatusBadge = (status) => {
    const normalized = `${status || "pending"}`.toLowerCase();
    const statusMap = {
      pending: { text: "Đang chờ", className: "bg-amber-100 text-amber-700" },
      preparing: { text: "Đang chế biến", className: "bg-blue-100 text-blue-700" },
      completed: { text: "Hoàn thành", className: "bg-emerald-100 text-emerald-700" },
      cancelled: { text: "Đã hủy", className: "bg-red-100 text-red-700" },
    };

    return statusMap[normalized] || statusMap.pending;
  };

  const getPaymentStatusBadge = (status) => {
    const normalized = `${status || "UNPAID"}`.toUpperCase();
    const statusMap = {
      PAID: { text: "Đã thanh toán", className: "bg-emerald-100 text-emerald-700" },
      UNPAID: { text: "Chưa thanh toán", className: "bg-amber-100 text-amber-700" },
    };

    return statusMap[normalized] || statusMap.UNPAID;
  };

  const getOrderStatusLabel = (status) => {
    const normalized = `${status || "OPEN"}`.toUpperCase();
    const statusMap = {
      PENDING_APPROVAL: "Chờ duyệt",
      OPEN: "Đang phục vụ",
      COMPLETED: "Hoàn tất",
      CANCELLED: "Từ chối",
    };

    return statusMap[normalized] || normalized;
  };

  const getOrderStatusBadge = (status) => {
    const normalized = `${status || "OPEN"}`.toUpperCase();
    const statusMap = {
      PENDING_APPROVAL: { text: "Chờ duyệt", className: "bg-amber-100 text-amber-700 ring-1 ring-amber-300" },
      OPEN: { text: "Đang phục vụ", className: "bg-blue-100 text-blue-700 ring-1 ring-blue-300" },
      CANCELLED: { text: "Từ chối", className: "bg-rose-100 text-rose-700 ring-1 ring-rose-300" },
      COMPLETED: { text: "Hoàn tất", className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300" },
    };

    return statusMap[normalized] || statusMap.OPEN;
  };

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });

    const patchOrderInCache = (orderId, patch) => {
      const targetId = `${orderId || ""}`;
      if (!targetId) return;

      queryClient.setQueryData(["orders"], (oldData) => {
        const list = Array.isArray(oldData?.data)
          ? oldData.data
          : Array.isArray(oldData?.data?.data)
            ? oldData.data.data
            : null;

        if (!Array.isArray(list)) return oldData;

        let found = false;
        const nextList = list.map((order) => {
          if (`${order?._id || ""}` !== targetId) return order;
          found = true;
          return { ...order, ...patch };
        });

        if (!found) return oldData;

        if (Array.isArray(oldData?.data)) {
          return { ...oldData, data: nextList };
        }

        if (Array.isArray(oldData?.data?.data)) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              data: nextList,
            },
          };
        }

        return oldData;
      });
    };

    socket.on("customer_order_approved", (payload) => {
      const orderId = payload?.orderId;
      patchOrderInCache(orderId, { orderStatus: "OPEN" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    socket.on("customer_order_rejected", (payload) => {
      const orderId = payload?.orderId;
      patchOrderInCache(orderId, { orderStatus: "CANCELLED", kitchenStatus: "cancelled" });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    socket.on("kitchen_status_updated", (payload) => {
      const orderId = payload?.orderId;
      const kitchenStatus = payload?.kitchenStatus;
      patchOrderInCache(orderId, { kitchenStatus });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    return () => {
      socket.off("customer_order_approved");
      socket.off("customer_order_rejected");
      socket.off("kitchen_status_updated");
      socket.disconnect();
    };
  }, [queryClient]);

  const orders = useMemo(() => {
    const list = Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData?.data?.data)
        ? resData.data.data
        : [];

    return [...list].sort((firstOrder, secondOrder) => {
      const firstDate = new Date(firstOrder.orderDate || firstOrder.createdAt || 0).getTime();
      const secondDate = new Date(secondOrder.orderDate || secondOrder.createdAt || 0).getTime();
      return secondDate - firstDate;
    });
  }, [resData]);

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderId("");
      return;
    }

    setSelectedOrderId((prev) => {
      const stillExists = orders.some((order) => order._id === prev);
      return stillExists ? prev : orders[0]._id;
    });
  }, [orders]);

  const selectedOrder = orders.find((order) => order._id === selectedOrderId) || null;

  useEffect(() => {
    if (isError) {
      enqueueSnackbar(error?.message || "Đã xảy ra lỗi khi tải đơn hàng!", { variant: "error" });
    }
  }, [isError, error]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <CustomerHeader />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Đơn hàng của tôi</h1>
          <div className="text-sm text-slate-500">Sắp xếp: Mới nhất → Cũ nhất</div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 space-y-3 lg:col-span-7">
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse bg-slate-200" />
                ))}
              </div>
            )}

            {!isLoading && isError && (
              <div className="bg-red-50 p-5 text-center">
                <p className="font-semibold text-red-600">Không thể tải danh sách đơn hàng.</p>
                <p className="mt-1 text-sm text-red-500">{error?.message || "Vui lòng thử lại sau."}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!isLoading && !isError && orders.length === 0 && (
              <div className="bg-white p-8 text-center shadow-sm">
                <p className="text-xl font-semibold text-slate-800">Bạn chưa có đơn hàng nào</p>
                <p className="mt-2 text-slate-500">Đơn mới tạo sẽ hiển thị tại đây.</p>
              </div>
            )}

            {!isLoading && !isError && orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => {
                  const kitchenStatus = getKitchenStatusBadge(order.kitchenStatus);
                  const paymentStatus = getPaymentStatusBadge(order.paymentStatus);
                  const orderStatus = getOrderStatusBadge(order.orderStatus);
                  const isPendingApproval = `${order?.orderStatus || ""}`.toUpperCase() === "PENDING_APPROVAL";
                  const isActive = selectedOrderId === order._id;
                  const orderTime = order.orderDate || order.createdAt;

                  return (
                    <div
                      key={order._id}
                      className={`rounded-2xl p-4 shadow-sm transition ${isActive
                        ? "bg-orange-50 ring-1 ring-orange-200"
                        : "bg-white"
                        } ${isPendingApproval ? "opacity-60" : "opacity-100"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">
                            #{Math.floor(new Date(orderTime).getTime())}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{formatDateTimeVi(orderTime)}</p>
                        </div>
                        <button
                          onClick={() => setSelectedOrderId(order._id)}
                          className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-200"
                        >
                          Xem chi tiết
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${orderStatus.className}`}>
                          {orderStatus.text}
                        </span>
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${kitchenStatus.className}`}>
                          {kitchenStatus.text}
                        </span>
                        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${paymentStatus.className}`}>
                          {paymentStatus.text}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <p className="text-slate-500">Tổng món: <span className="font-semibold text-slate-800">{order?.items?.length || 0}</span></p>
                        <p className="text-slate-500">Tổng tiền: <span className="font-semibold text-orange-500">{formatCurrencyVnd(order?.bills?.totalWithTax)}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div className="sticky top-24 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-800">Chi tiết đơn</h2>

              {!selectedOrder && (
                <p className="text-sm text-slate-500">Chọn một đơn ở danh sách bên trái để xem chi tiết.</p>
              )}

              {selectedOrder && (
                <>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-slate-800">
                      #{Math.floor(new Date(selectedOrder.orderDate || selectedOrder.createdAt).getTime())}
                    </p>
                    <p className="text-slate-500">{formatDateTimeVi(selectedOrder.orderDate || selectedOrder.createdAt)}</p>
                    <p className="text-slate-500">Bàn: <span className="text-slate-800">{selectedOrder?.table?.tableNo || "--"}</span></p>
                    <p className="text-slate-500">Khách: <span className="text-slate-800">{selectedOrder?.customerDetails?.name || "Khách"}</span></p>
                    <p className="text-slate-500">SĐT: <span className="text-slate-800">{selectedOrder?.customerDetails?.phone || "N/A"}</span></p>
                    <p className="text-slate-500">Số người: <span className="text-slate-800">{selectedOrder?.customerDetails?.guests || 1}</span></p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getOrderStatusBadge(selectedOrder.orderStatus).className}`}>
                      {getOrderStatusBadge(selectedOrder.orderStatus).text}
                    </span>
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getKitchenStatusBadge(selectedOrder.kitchenStatus).className}`}>
                      {getKitchenStatusBadge(selectedOrder.kitchenStatus).text}
                    </span>
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getPaymentStatusBadge(selectedOrder.paymentStatus).className}`}>
                      {getPaymentStatusBadge(selectedOrder.paymentStatus).text}
                    </span>
                  </div>

                  <hr className="my-4 border-slate-200" />

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(selectedOrder.items || []).map((item, index) => {
                      const isCancelled = item.cancelled_at || item.status === "cancelled";
                      return (
                        <div
                          key={`${selectedOrder._id}-${index}`}
                          className={`rounded-lg px-3 py-2 ${isCancelled
                            ? "bg-slate-100"
                            : "bg-slate-50"
                            }`}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <p className={`${isCancelled ? "text-slate-400 line-through" : "text-slate-800"}`}>
                              {isCancelled ? "❌ " : ""}
                              {item.name}
                            </p>
                            <p className="font-semibold text-orange-500">×{item.quantity}</p>
                          </div>
                          {!!item.notes && (
                            <p className="mt-1 text-xs text-slate-500">Ghi chú: {item.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <hr className="my-4 border-slate-200" />

                  <div className="space-y-1 text-sm">
                    <p className="text-slate-500">Tạm tính: <span className="text-slate-800">{formatCurrencyVnd(selectedOrder?.bills?.total)}</span></p>
                    <p className="text-slate-500">Thuế: <span className="text-slate-800">{formatCurrencyVnd(selectedOrder?.bills?.tax)}</span></p>
                    <p className="text-base font-semibold text-slate-800">Tổng tiền: <span className="text-orange-500">{formatCurrencyVnd(selectedOrder?.bills?.totalWithTax)}</span></p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </section>

      <Footer />
    </main>
  );
};

export default Orders;
