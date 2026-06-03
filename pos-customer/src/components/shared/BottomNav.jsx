import React from "react";
import { FaHome } from "react-icons/fa";
import { MdOutlineReorder, MdTableBar } from "react-icons/md";
import { CiCircleMore } from "react-icons/ci";
import { BiSolidDish } from "react-icons/bi";
import { FaMoneyBillWave } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useSelector((state) => state.user);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#262626] p-2 h-16 flex justify-around">
      <button
        onClick={() => navigate("/")}
        className={`flex items-center justify-center font-bold ${isActive("/") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } w-[300px] rounded-[20px]`}
      >
        <FaHome className="inline mr-2" size={20} /> <p>Trang chủ</p>
      </button>
      <button
        onClick={() => navigate("/orders")}
        className={`flex items-center justify-center font-bold ${isActive("/orders") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } w-[300px] rounded-[20px]`}
      >
        <MdOutlineReorder className="inline mr-2" size={20} /> <p>Đơn hàng</p>
      </button>
      <button
        onClick={() => navigate("/tables")}
        className={`flex items-center justify-center font-bold ${isActive("/tables") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
          } w-[300px] rounded-[20px]`}
      >
        <MdTableBar className="inline mr-2" size={20} /> <p>Bàn</p>
      </button>
      {["admin", "cashier"].includes(`${role || ""}`.toLowerCase()) && (
        <button
          onClick={() => navigate("/admin/payment")}
          className={`flex items-center justify-center font-bold ${isActive("/payment") || isActive("/admin/payment") ? "text-[#f5f5f5] bg-[#343434]" : "text-[#ababab]"
            } w-[300px] rounded-[20px]`}
        >
          <FaMoneyBillWave className="inline mr-2" size={20} /> <p>Thanh toán</p>
        </button>
      )}
      <button className="flex items-center justify-center font-bold text-[#ababab] w-[300px]">
        <CiCircleMore className="inline mr-2" size={20} /> <p>Thêm</p>
      </button>

      <button
        disabled={isActive("/tables") || isActive("/menu")}
        onClick={() => navigate("/tables")}
        className="absolute bottom-6 bg-[#F6B100] text-[#f5f5f5] rounded-full p-4 items-center"
      >
        <BiSolidDish size={40} />
      </button>
    </div>
  );
};

export default BottomNav;
