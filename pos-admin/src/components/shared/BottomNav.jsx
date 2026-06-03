import React from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { FaMoneyBillWave } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useSelector((state) => state.user);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex items-center gap-2 overflow-x-auto">
      <button
        onClick={() => navigate("/")}
        className={`flex items-center justify-center font-bold ${isActive("/") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } flex-1 min-w-[120px] rounded-[20px] h-full px-3`}
      >
        <FaHome className="inline mr-2" size={18} /> <p className="text-sm">Trang chủ</p>
      </button>
      <button
        onClick={() => navigate("/orders")}
        className={`flex items-center justify-center font-bold ${isActive("/orders") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } flex-1 min-w-[120px] rounded-[20px] h-full px-3`}
      >
        <MdOutlineReorder className="inline mr-2" size={18} /> <p className="text-sm">Đơn hàng</p>
      </button>
      <button
        onClick={() => navigate("/tables")}
        className={`flex items-center justify-center font-bold ${isActive("/tables") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } flex-1 min-w-[120px] rounded-[20px] h-full px-3`}
      >
        <MdTableBar className="inline mr-2" size={18} /> <p className="text-sm">Bàn</p>
      </button>
      {["admin", "cashier"].includes(`${role || ""}`.toLowerCase()) && (
        <button
          onClick={() => navigate("/admin/payment")}
          className={`flex items-center justify-center font-bold ${isActive("/payment") || isActive("/admin/payment") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
            } flex-1 min-w-[120px] rounded-[20px] h-full px-3`}
        >
          <FaMoneyBillWave className="inline mr-2" size={18} /> <p className="text-sm">Thanh toán</p>
        </button>
      )}
    </div>
  );
};

export default BottomNav;
