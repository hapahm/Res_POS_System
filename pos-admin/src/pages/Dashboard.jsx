import React, { useState, useEffect } from "react";
import { MdTableBar, MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { FaUsersCog } from "react-icons/fa";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import TableListPanel from "../components/dashboard/TableListPanel";
import CategoryListPanel from "../components/dashboard/CategoryListPanel";
import DishListPanel from "../components/dashboard/DishListPanel";
import UserAccountsPanel from "../components/dashboard/UserAccountsPanel";
import { useAdminSocket } from "../hooks/useAdminSocket";
import { useNavigate, useSearchParams } from "react-router-dom";

// Danh sách các nút chức năng phía trên dashboard
const buttons = [
  { label: "Danh sách bàn", icon: <MdTableBar />, action: "table" },
  { label: "Danh sách danh mục", icon: <MdCategory />, action: "category" },
  { label: "Danh sách món ăn", icon: <BiSolidDish />, action: "dishes" },
  { label: "Tài khoản nội bộ", icon: <FaUsersCog />, action: "accounts" },
];

// Các tab hiển thị nội dung bên dưới
const tabs = ["Thống kê", "Đơn hàng", "Thanh toán"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Connect to admin socket for real-time kitchen updates
  // Notifications disabled here (handled by Home page)
  useAdminSocket({ showNotifications: false });

  // Khi component render lần đầu → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Admin Dashboard"
  }, [])

  // State lưu danh sách đang được hiển thị
  const [activeList, setActiveList] = useState(null);

  // State lưu tab đang được chọn
  const [activeTab, setActiveTab] = useState("Thống kê");

  useEffect(() => {
    const tabParam = `${searchParams.get("tab") || ""}`.toLowerCase();

    if (tabParam === "orders") {
      setActiveTab("Đơn hàng");
      return;
    }

    if (tabParam === "metrics") {
      setActiveTab("Thống kê");
    }
  }, [searchParams]);

  // Xử lý bật / tắt panel danh sách theo action
  const handleToggleList = (action) => {
    setActiveList((prev) => (prev === action ? null : action));
  };

  const handleTabClick = (tab) => {
    if (tab === "Thanh toán") {
      navigate("/admin/payments");
      return;
    }

    setActiveTab(tab);

    const nextParams = new URLSearchParams(searchParams);
    if (tab === "Đơn hàng") {
      nextParams.set("tab", "orders");
    } else if (tab === "Thống kê") {
      nextParams.set("tab", "metrics");
    } else {
      nextParams.delete("tab");
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-y-auto pb-6">

      {/* Thanh công cụ trên cùng */}
      <div className="container mx-auto flex items-center justify-between py-14 px-6 md:px-4">

        {/* Nhóm nút chức năng */}
        <div className="flex items-center gap-3">
          {buttons.map(({ label, icon, action }) => {
            return (
              <button
                key={action}
                onClick={() => handleToggleList(action)}
                className={`px-6 py-3 rounded-lg text-[#f5f5f5] font-semibold text-md flex items-center gap-2 ${activeList === action
                  ? "bg-[#262626]"
                  : "bg-[#1a1a1a] hover:bg-[#262626]"
                  }`}
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
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-4">
        {activeList === "table" && <TableListPanel />}
        {activeList === "category" && <CategoryListPanel />}
        {activeList === "dishes" && <DishListPanel />}
        {activeList === "accounts" && <UserAccountsPanel />}
      </div>

      {/* Nội dung hiển thị theo tab */}
      {activeTab === "Thống kê" && <Metrics />}
      {activeTab === "Đơn hàng" && <RecentOrders />}
    </div>
  );
};

export default Dashboard;
