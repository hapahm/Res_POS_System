import React, { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import Modal from "../components/dashboard/Modal";
import { useAdminSocket } from "../hooks/useAdminSocket";

// Danh sách các nút chức năng phía trên dashboard
const buttons = [
  { label: "Thêm bàn", icon: <MdTableBar />, action: "table" },
  { label: "Thêm danh mục", icon: <MdCategory />, action: "category" },
  { label: "Thêm món ăn", icon: <BiSolidDish />, action: "dishes" },
];

// Các tab hiển thị nội dung bên dưới
const tabs = ["Thống kê", "Đơn hàng", "Thanh toán"];

const Dashboard = () => {

  // Connect to admin socket for real-time kitchen updates
  // Notifications disabled here (handled by Home page)
  useAdminSocket({ showNotifications: false });

  // Khi component render lần đầu → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Admin Dashboard"
  }, [])

  // State kiểm soát việc mở / đóng modal thêm bàn
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // State lưu tab đang được chọn
  const [activeTab, setActiveTab] = useState("Thống kê");

  // Xử lý mở modal theo action của button
  const handleOpenModal = (action) => {
    if (action === "table") setIsTableModalOpen(true);
  };

  return (
    <div className="bg-[#1f1f1f] h-[calc(100vh-5rem)]">

      {/* Thanh công cụ trên cùng */}
      <div className="container mx-auto flex items-center justify-between py-14 px-6 md:px-4">

        {/* Nhóm nút chức năng */}
        <div className="flex items-center gap-3">
          {buttons.map(({ label, icon, action }) => {
            return (
              <button
                key={action}
                onClick={() => handleOpenModal(action)}
                className="bg-[#1a1a1a] hover:bg-[#262626] px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2"
              >
                {label} {icon}
              </button>
            );
          })}
        </div>

        {/* Nhóm nút tab */}
        <div className="flex items-center gap-3">
          {tabs.map((tab) => {
            return (
              <button
                key={tab}
                className={`
                px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2 ${activeTab === tab
                    ? "bg-[#262626]"
                    : "bg-[#1a1a1a] hover:bg-[#262626]"
                  }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nội dung hiển thị theo tab */}
      {activeTab === "Thống kê" && <Metrics />}
      {activeTab === "Đơn hàng" && <RecentOrders />}
      {activeTab === "Thanh toán" &&
        <div className="text-white p-6 container mx-auto">
          Chức năng thanh toán đang phát triển
        </div>
      }

      {/* Modal thêm bàn */}
      {isTableModalOpen && <Modal setIsTableModalOpen={setIsTableModalOpen} />}
    </div>
  );
};

export default Dashboard;
