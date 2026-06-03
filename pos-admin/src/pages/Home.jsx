import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import { useAdminSocket } from "../hooks/useAdminSocket";
import { getMetrics, getOrders } from "../https";
import { formatVND } from "../utils";

const Home = () => {

  // Connect to admin socket for real-time kitchen updates
  // Enable notifications on Home page only
  useAdminSocket({ showNotifications: true });

  // Khi màn hình Home được load → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Home"
  }, [])

  const { data: metricsRes } = useQuery({
    queryKey: ["dashboard", "metrics", "home"],
    queryFn: getMetrics,
    placeholderData: keepPreviousData,
  });

  const { data: ordersRes } = useQuery({
    queryKey: ["orders", "home", "processing"],
    queryFn: async () => await getOrders(),
    placeholderData: keepPreviousData,
  });

  const metricsData = metricsRes?.data?.data || {};
  const allOrders = Array.isArray(ordersRes?.data?.data) ? ordersRes.data.data : [];
  const totalRevenue = Number(metricsData?.totalRevenue || 0);
  const activeTableOrders = allOrders.filter((order) => {
    const normalizedStatus = `${order?.kitchenStatus || ""}`.trim().toLowerCase();
    return normalizedStatus === "pending" || normalizedStatus === "preparing";
  }).length;
  const revenueChangePercent = Number(metricsData?.revenueChangePercent || 0);
  const activeOrdersChangePercent = Number(metricsData?.activeOrdersChangePercent || 0);

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex gap-3">

      {/* ================= LEFT AREA - THỐNG KÊ + ĐƠN HÀNG ================= */}
      <div className="flex-[3] min-h-0 flex flex-col">

        {/* Component hiển thị lời chào người dùng */}
        <Greetings />

        {/* Các thẻ thống kê nhanh */}
        <div className="flex items-center w-full gap-3 px-8 mt-8">

          {/* Tổng doanh thu */}
          <MiniCard
            title="Tổng doanh thu"
            icon={<BsCashCoin />}
            value={formatVND(totalRevenue)}
            percent={revenueChangePercent}
            isPositive={revenueChangePercent >= 0}
            iconVariant="success"
          />

          {/* Đơn đang xử lý */}
          <MiniCard
            title="Đang xử lý"
            icon={<GrInProgress />}
            value={activeTableOrders.toLocaleString("vi-VN")}
            percent={activeOrdersChangePercent}
            isPositive={activeOrdersChangePercent >= 0}
            iconVariant="warning"
          />
        </div>

        {/* Danh sách đơn hàng gần đây */}
        <RecentOrders />
      </div>

      {/* ================= RIGHT AREA - MÓN BÁN CHẠY ================= */}
      <div className="flex-[2] min-h-0 pb-6">
        {/* Component hiển thị các món ăn phổ biến */}
        <PopularDishes />
      </div>

      {/* Thanh điều hướng phía dưới (mobile / tablet) */}
      <BottomNav />
    </section>
  );
};

export default Home;
