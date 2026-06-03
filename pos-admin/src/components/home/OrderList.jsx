import React from "react";
import { FaLongArrowAltRight } from "react-icons/fa";
import { getAvatarName, formatDateAndTime } from "../../utils/index";

/**
 * OrderList
 * Component hiển thị một đơn hàng trong danh sách:
 * - Avatar tên khách hàng
 * - Tên khách
 * - Số lượng món
 * - Số bàn
 * - Trạng thái đơn hàng (Đang làm / Hoàn thành)
 */
const OrderList = ({ order }) => {
  // Kitchen status display helper
  const getKitchenStatusDisplay = (kitchenStatus) => {
    const statusMap = {
      'pending': {
        text: 'Đang chờ',
        bgColor: 'bg-[#4a452e]',
        textColor: 'text-yellow-400'
      },
      'preparing': {
        text: 'Đang chế biến',
        bgColor: 'bg-[#2e3a4a]',
        textColor: 'text-blue-400'
      },
      'completed': {
        text: 'Hoàn thành',
        bgColor: 'bg-[#2e4a40]',
        textColor: 'text-green-400'
      },
      'cancelled': {
        text: 'Đã hủy',
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
    <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,1fr)_180px_160px] items-center gap-3 md:gap-4 mb-3">

      {/* Cột khách hàng */}
      <div className="flex items-center gap-4 min-w-0">
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg shrink-0">
          {getAvatarName(order.customerDetails.name)}
        </button>

        <div className="flex flex-col items-start gap-1 min-w-0">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide truncate w-full">
            {order.customerDetails.name}
          </h1>
          <p className="text-[#ababab] text-sm">
            {order.items.length} món
          </p>
          <p className="text-[#ababab] text-xs">
            {formatDateAndTime(order.orderDate)}
          </p>
        </div>
      </div>

      {/* Cột bàn */}
      <div className="md:justify-self-center md:text-center">
        <h1 className="inline-flex items-center text-[#f6b100] font-semibold border border-[#f6b100] rounded-lg px-2 py-1 whitespace-nowrap">
          Bàn <FaLongArrowAltRight className="text-[#ababab] mx-2 inline" />
          {order.table.tableNo}
        </h1>
      </div>

      {/* Cột trạng thái */}
      <div className="md:justify-self-end">
        <p className={`inline-flex ${kitchenStatusDisplay.textColor} ${kitchenStatusDisplay.bgColor} px-3 py-1 rounded-lg font-semibold whitespace-nowrap`}>
          {kitchenStatusDisplay.text}
        </p>
      </div>
    </div>
  );
};

export default OrderList;
