import React from "react";
import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { getAvatarName } from "../../utils/index";

/**
 * OrderList
 * Component hiển thị một đơn hàng trong danh sách:
 * - Avatar tên khách hàng
 * - Tên khách
 * - Số lượng món
 * - Số bàn
 * - Trạng thái đơn hàng (Đang làm / Hoàn thành)
 */
const OrderList = ({ key, order }) => {
  // Kitchen status display helper
  const getKitchenStatusDisplay = (kitchenStatus) => {
    const statusMap = {
      'pending': {
        text: '⏳ Đang chờ',
        bgColor: 'bg-[#4a452e]',
        textColor: 'text-yellow-400'
      },
      'preparing': {
        text: '👨‍🍳 Đang chế biến',
        bgColor: 'bg-[#2e3a4a]',
        textColor: 'text-blue-400'
      },
      'completed': {
        text: '✅ Hoàn thành',
        bgColor: 'bg-[#2e4a40]',
        textColor: 'text-green-400'
      },
      'cancelled': {
        text: '❌ Đã hủy',
        bgColor: 'bg-[#4a2e2e]',
        textColor: 'text-red-400'
      }
    };
    return statusMap[kitchenStatus] || {
      text: kitchenStatus,
      bgColor: 'bg-[#383838]',
      textColor: 'text-gray-400'
    };
  };

  const kitchenStatusDisplay = getKitchenStatusDisplay(order.kitchenStatus);

  return (
    <div className="flex items-center gap-5 mb-3">

      {/* Avatar chữ cái đại diện cho khách hàng */}
      <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
        {getAvatarName(order.customerDetails.name)}
      </button>

      {/* Thông tin đơn hàng */}
      <div className="flex items-center justify-between w-[100%]">

        {/* Tên khách + số lượng món */}
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            {order.customerDetails.name}
          </h1>
          <p className="text-[#ababab] text-sm">
            {order.items.length} món
          </p>
        </div>

        {/* Thông tin bàn */}
        <h1 className="text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg p-1">
          Bàn <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" />{" "}
          {order.table.tableNo}
        </h1>

        {/* Trạng thái bếp - Kitchen Status */}
        <div className="flex flex-col items-end gap-2">
          <p className={`${kitchenStatusDisplay.textColor} ${kitchenStatusDisplay.bgColor} px-3 py-1 rounded-lg font-semibold`}>
            {kitchenStatusDisplay.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
