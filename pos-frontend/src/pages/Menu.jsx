import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";

const Menu = () => {

  // Khi màn hình Menu được load → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Menu"
  }, [])

  // Lấy thông tin khách hàng từ Redux Store
  const customerData = useSelector((state) => state.customer);

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex gap-3">

      {/* ================= LEFT AREA - DANH SÁCH MÓN ================= */}
      <div className="flex-[3]">

        {/* Thanh header */}
        <div className="flex items-center justify-between px-10 py-4">

          {/* Nút quay lại + tiêu đề */}
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
              Thực đơn
            </h1>
          </div>

          {/* Thông tin khách hàng + bàn */}
          <div className="flex items-center justify-around gap-4">
            <div className="flex items-center gap-3 cursor-pointer">
              <MdRestaurantMenu className="text-[#f5f5f5] text-4xl" />

              <div className="flex flex-col items-start">
                {/* Tên khách hàng */}
                <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
                  {customerData.customerName || "Tên khách hàng"}
                </h1>

                {/* Số bàn */}
                <p className="text-xs text-[#ababab] font-medium">
                  Bàn : {customerData.table?.tableNo || "Chưa chọn"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách món ăn */}
        <MenuContainer />
      </div>

      {/* ================= RIGHT AREA - GIỎ HÀNG + HÓA ĐƠN ================= */}
      <div className="flex-[1] bg-[#1a1a1a] mt-4 mr-3 h-[780px] rounded-lg pt-2">

        {/* Thông tin khách hàng */}
        <CustomerInfo />
        <hr className="border-[#2a2a2a] border-t-2" />

        {/* Danh sách món đã chọn */}
        <CartInfo />
        <hr className="border-[#2a2a2a] border-t-2" />

        {/* Hóa đơn */}
        <Bill />
      </div>

      {/* Thanh điều hướng dưới */}
      <BottomNav />
    </section>
  );
};

export default Menu;
