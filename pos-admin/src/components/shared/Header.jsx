import React, { useEffect, useMemo, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { FaBell } from "react-icons/fa";
import logo from "../../assets/images/logo2.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isBellOpen, setIsBellOpen] = useState(false);

  const roleLabel = {
    admin: "Quản trị",
    cashier: "Thu ngân",
    waiter: "Phục vụ",
    staff: "Nhân viên"
  }[`${userData.role || ""}`.toLowerCase()] || userData.role || "Vai trò";

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  useEffect(() => {
    const handleIncomingNotification = (event) => {
      const payload = event?.detail || {};
      const newNotification = {
        id: `${payload?.orderId || Date.now()}-${Date.now()}`,
        type: "order",
        read: false,
        createdAt: new Date().toISOString(),
        message: `Đơn mới: ${payload?.customerName || "Khách"} - Bàn ${payload?.tableNo || "--"}`,
        payload,
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
    };

    const handleIncomingChatNotification = (event) => {
      const payload = event?.detail || {};
      const newNotification = {
        id: `${payload?.customerId || Date.now()}-${Date.now()}`,
        type: "chat",
        read: false,
        createdAt: payload?.createdAt || new Date().toISOString(),
        message: payload?.message || "Có yêu cầu hỗ trợ chat mới",
        payload,
      };

      setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
    };

    window.addEventListener("admin-customer-order-notification", handleIncomingNotification);
    window.addEventListener("admin-chat-notification", handleIncomingChatNotification);
    return () => {
      window.removeEventListener("admin-customer-order-notification", handleIncomingNotification);
      window.removeEventListener("admin-chat-notification", handleIncomingChatNotification);
    };
  }, []);

  const handleToggleBell = () => {
    setIsBellOpen((prev) => !prev);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleNotificationClick = (notification) => {
    const payload = notification?.payload || {};

    if (notification?.type === "chat") {
      const params = new URLSearchParams();
      if (payload?.customerId) {
        params.set("customerId", payload.customerId);
      }
      if (payload?.customerName) {
        params.set("customerName", payload.customerName);
      }

      const query = params.toString();
      navigate(query ? `/staff/chat?${query}` : "/staff/chat");
    } else {
      navigate("/dashboard?tab=orders");
    }

    setIsBellOpen(false);
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
  };

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      console.log(data);
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-[#1a1a1a]">
      {/* LOGO */}
      <div onClick={() => navigate("/")} className="flex items-center gap-2 cursor-pointer">
        <img src={logo} className="h-8 w-8" alt="restro logo" />
        <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
          KChick
        </h1>
      </div>

      {/* LOGGED USER DETAILS */}
      <div className="flex items-center gap-4">
        {userData.role?.toLowerCase() === "admin" && (
          <div onClick={() => navigate("/dashboard")} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer">
            <MdDashboard className="text-[#f5f5f5] text-2xl" />
          </div>
        )}
        <div className="relative">
          <div onClick={handleToggleBell} className="bg-[#1f1f1f] rounded-[15px] p-3 cursor-pointer relative">
            <FaBell className="text-[#f5f5f5] text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>

          {isBellOpen && (
            <div className="absolute right-0 mt-2 w-[340px] rounded-lg border border-gray-700 bg-[#1f1f1f] p-3 shadow-xl z-50">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#f5f5f5]">Thông báo đơn hàng & chat</p>
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Xóa tất cả
                </button>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500">Chưa có thông báo mới</p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full rounded-md border border-gray-700 bg-[#262626] p-2 text-left hover:bg-[#2f2f2f]"
                    >
                      <p className="text-[11px] text-violet-300 mb-1">
                        {notification.type === "chat" ? "Chat" : "Đơn hàng"}
                      </p>
                      <p className="text-sm text-[#f5f5f5]">{notification.message}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(notification.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 cursor-pointer">
          <FaUserCircle className="text-[#f5f5f5] text-4xl" />
          <div className="flex flex-col items-start">
            <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
              {userData.name || "TEST USER"}
            </h1>
            <p className="text-xs text-[#ababab] font-medium">
              {userData.role || "Role"}
            </p>
          </div>
          <IoLogOut
            onClick={handleLogout}
            className="text-[#f5f5f5] ml-2"
            size={40}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
