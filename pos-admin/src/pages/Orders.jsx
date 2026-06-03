import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import OrderCard from "../components/orders/OrderCard";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../https/index";
import { enqueueSnackbar } from "notistack";
import { useAdminSocket } from "../hooks/useAdminSocket";

const Orders = () => {

  // Connect to admin socket for real-time kitchen updates
  // Notifications disabled here (handled by Home page)
  useAdminSocket({ showNotifications: false });

  // State lưu trạng thái lọc đơn hàng theo kitchenStatus
  // all | pending | preparing | completed
  const [status, setStatus] = useState("all");

  // Khi màn hình Orders được load → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Đơn hàng"
  }, [])

  // Gọi API lấy danh sách đơn hàng bằng React Query
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    // Giữ lại dữ liệu cũ trong lúc loading
    placeholderData: keepPreviousData
  })

  // Nếu API lỗi → hiện thông báo
  if (isError) {
    enqueueSnackbar("Đã xảy ra lỗi khi tải đơn hàng!", { variant: "error" })
  }

  const isWithinLast12Hours = (dateInput) => {
    if (!dateInput) return false;
    const orderTime = new Date(dateInput).getTime();
    if (Number.isNaN(orderTime)) return false;

    const twelveHoursMs = 12 * 60 * 60 * 1000;
    return Date.now() - orderTime <= twelveHoursMs;
  };

  const recentOrders = (resData?.data?.data || []).filter((order) => {
    const sourceTime = order?.orderDate || order?.createdAt;
    return isWithinLast12Hours(sourceTime);
  });

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-4">

        {/* Nút quay lại + tiêu đề */}
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider">
            Đơn hàng
          </h1>
        </div>

        {/* Bộ lọc trạng thái bếp - Kitchen Status */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">

          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-sm md:text-base ${status === "all" && "bg-[#383838]"} rounded-lg px-3 md:px-4 py-2 font-semibold whitespace-nowrap`}
          >
            Tất cả
          </button>

          <button
            onClick={() => setStatus("pending")}
            className={`text-[#ababab] text-sm md:text-base ${status === "pending" && "bg-[#383838]"} rounded-lg px-3 md:px-4 py-2 font-semibold whitespace-nowrap`}
          >
            Đang chờ
          </button>

          <button
            onClick={() => setStatus("preparing")}
            className={`text-[#ababab] text-sm md:text-base ${status === "preparing" && "bg-[#383838]"} rounded-lg px-3 md:px-4 py-2 font-semibold whitespace-nowrap`}
          >
            Đang chế biến
          </button>

          <button
            onClick={() => setStatus("completed")}
            className={`text-[#ababab] text-sm md:text-base ${status === "completed" && "bg-[#383838]"} rounded-lg px-3 md:px-4 py-2 font-semibold whitespace-nowrap`}
          >
            Hoàn thành
          </button>

          <button
            onClick={() => setStatus("cancelled")}
            className={`text-[#ababab] text-sm md:text-base ${status === "cancelled" && "bg-[#383838]"} rounded-lg px-3 md:px-4 py-2 font-semibold whitespace-nowrap`}
          >
            Đã hủy
          </button>
        </div>
      </div>

      {/* ================= DANH SÁCH ĐƠN HÀNG ================= */}
      <div className="flex-1 min-h-0 overflow-y-auto dark-scrollbar px-4 md:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 py-2">

          {
            recentOrders.length > 0 ? (
              recentOrders
                .filter(order => {
                  if (status === "all") return true;
                  // Tab "Đã hủy" - hiện orders có món bị hủy
                  if (status === "cancelled") {
                    return order.items && order.items.some(item =>
                      item.cancelled_at || item.status === 'cancelled'
                    );
                  }
                  // Các tab khác filter theo kitchenStatus
                  return order.kitchenStatus === status;
                })
                .map((order) => {
                  return <OrderCard key={order._id} order={order} />
                })
            ) : (
              <p className="col-span-full text-gray-500">
                Không có đơn hàng trong 12 giờ gần nhất
              </p>
            )
          }
        </div>
      </div>

      {/* Thanh điều hướng phía dưới */}
      <BottomNav />
    </section>
  );
};

export default Orders;
