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
    document.title = "POS | Orders"
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

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between px-10 py-4">

        {/* Nút quay lại + tiêu đề */}
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Đơn hàng
          </h1>
        </div>

        {/* Bộ lọc trạng thái bếp - Kitchen Status */}
        <div className="flex items-center justify-around gap-4">

          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-lg ${status === "all" && "bg-[#383838]"} rounded-lg px-5 py-2 font-semibold`}
          >
            📦 Tất cả
          </button>

          <button
            onClick={() => setStatus("pending")}
            className={`text-[#ababab] text-lg ${status === "pending" && "bg-[#383838]"} rounded-lg px-5 py-2 font-semibold`}
          >
            ⏳ Đang chờ
          </button>

          <button
            onClick={() => setStatus("preparing")}
            className={`text-[#ababab] text-lg ${status === "preparing" && "bg-[#383838]"} rounded-lg px-5 py-2 font-semibold`}
          >
            👨‍🍳 Đang chế biến
          </button>

          <button
            onClick={() => setStatus("completed")}
            className={`text-[#ababab] text-lg ${status === "completed" && "bg-[#383838]"} rounded-lg px-5 py-2 font-semibold`}
          >
            ✅ Hoàn thành
          </button>
        </div>
      </div>

      {/* ================= DANH SÁCH ĐƠN HÀNG ================= */}
      <div className="grid grid-cols-3 gap-3 px-16 py-4 overflow-y-scroll scrollbar-hide">

        {
          resData?.data.data.length > 0 ? (
            resData.data.data
              .filter(order => status === "all" || order.kitchenStatus === status)
              .map((order) => {
                return <OrderCard key={order._id} order={order} />
              })
          ) : (
            <p className="col-span-3 text-gray-500">
              Không có đơn hàng nào
            </p>
          )
        }

      </div>

      {/* Thanh điều hướng phía dưới */}
      <BottomNav />
    </section>
  );
};

export default Orders;
