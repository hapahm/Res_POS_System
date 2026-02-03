import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import Greetings from "../components/home/Greetings";
import { BsCashCoin } from "react-icons/bs";
import { GrInProgress } from "react-icons/gr";
import MiniCard from "../components/home/MiniCard";
import RecentOrders from "../components/home/RecentOrders";
import PopularDishes from "../components/home/PopularDishes";
import { useAdminSocket } from "../hooks/useAdminSocket";

const Home = () => {

  // Connect to admin socket for real-time kitchen updates
  // Enable notifications on Home page only
  useAdminSocket({ showNotifications: true });

  // Khi màn hình Home được load → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Home"
  }, [])

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex gap-3">

      {/* ================= LEFT AREA - THỐNG KÊ + ĐƠN HÀNG ================= */}
      <div className="flex-[3]">

        {/* Component hiển thị lời chào người dùng */}
        <Greetings />

        {/* Các thẻ thống kê nhanh */}
        <div className="flex items-center w-full gap-3 px-8 mt-8">

          {/* Tổng doanh thu */}
          <MiniCard
            title="Tổng doanh thu"
            icon={<BsCashCoin />}
            number={512}
            footerNum={1.6}
          />

          {/* Đơn đang xử lý */}
          <MiniCard
            title="Đang xử lý"
            icon={<GrInProgress />}
            number={16}
            footerNum={3.6}
          />
        </div>

        {/* Danh sách đơn hàng gần đây */}
        <RecentOrders />
      </div>

      {/* ================= RIGHT AREA - MÓN BÁN CHẠY ================= */}
      <div className="flex-[2]">
        {/* Component hiển thị các món ăn phổ biến */}
        <PopularDishes />
      </div>

      {/* Thanh điều hướng phía dưới (mobile / tablet) */}
      <BottomNav />
    </section>
  );
};

export default Home;
