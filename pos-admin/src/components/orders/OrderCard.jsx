import React from "react";
import { formatDateAndTime, formatVND, getAvatarName } from "../../utils/index";

const OrderCard = ({ order }) => {
  // Kitchen status display helper
  const getKitchenStatusDisplay = (kitchenStatus) => {
    const statusMap = {
      'pending': {
        text: 'Đang chờ',
        bgColor: 'bg-[#4a3a12]',
        textColor: 'text-[#f6d07a]'
      },
      'preparing': {
        text: 'Đang chế biến',
        bgColor: 'bg-[#1f3c5a]',
        textColor: 'text-[#9fd3ff]'
      },
      'completed': {
        text: 'Hoàn thành',
        bgColor: 'bg-[#2e4a40]',
        textColor: 'text-[#8fe2b8]'
      },
      'cancelled': {
        text: 'Đã hủy',
        bgColor: 'bg-[#4a2e2e]',
        textColor: 'text-[#f1b5b5]'
      }
    };
    return statusMap[kitchenStatus] || {
      text: kitchenStatus,
      bgColor: 'bg-[#3a3a3a]',
      textColor: 'text-[#d1d5db]'
    };
  };

  const kitchenStatusDisplay = getKitchenStatusDisplay(order.kitchenStatus);

  return (
    <div className="w-full bg-[#262626] p-4 rounded-lg mb-4">
      <div className="flex items-start gap-4">
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
          {getAvatarName(order.customerDetails.name)}
        </button>
        <div className="flex items-start justify-between w-full min-w-0 gap-3">
          <div className="flex flex-col items-start gap-1 min-w-0">
            <h1 className="text-[#f5f5f5] text-base md:text-lg font-semibold tracking-wide truncate w-full">
              {order.customerDetails.name}
            </h1>
            <p className="text-[#ababab] text-sm break-all">#{Math.floor(new Date(order.orderDate).getTime())} / Ăn tại chỗ</p>
            <p className="text-[#ababab] text-sm">Bàn {order.table.tableNo}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Kitchen Status Badge - Single Source of Truth */}
            <div className={`${kitchenStatusDisplay.bgColor} ${kitchenStatusDisplay.textColor} px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap`}>
              {kitchenStatusDisplay.text}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 text-[#ababab]">
        <p>{formatDateAndTime(order.orderDate)}</p>
        <p>{order.items.length} Món</p>
      </div>
      <hr className="w-full mt-4 border-t-1 border-gray-500" />

      {/* Items List */}
      <div className="mt-4 space-y-2">
        {order.items.map((item, index) => {
          const isCancelled = item.cancelled_at || item.status === 'cancelled';
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded ${isCancelled
                ? 'bg-gray-700 bg-opacity-50 border border-gray-600 line-through opacity-60'
                : 'bg-[#1f1f1f]'
                }`}
            >
              <span className="text-[#f5f5f5] text-sm font-medium">
                {isCancelled && '[Đã hủy] '}
                {item.name}
              </span>
              <span className={`text-sm font-bold ${isCancelled ? 'text-gray-400' : 'text-[#f6b100]'}`}>
                ×{item.quantity}
              </span>
            </div>
          );
        })}
      </div>

      <hr className="w-full mt-4 border-t-1 border-gray-500" />
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-[#f5f5f5] text-lg font-semibold">Tổng tiền</h1>
        <p className="text-[#f5f5f5] text-lg font-semibold">{formatVND(order.bills.totalWithTax)}</p>
      </div>
    </div>
  );
};

export default OrderCard;
