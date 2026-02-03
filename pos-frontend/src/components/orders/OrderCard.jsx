import React from "react";
import { FaCheckDouble, FaLongArrowAltRight } from "react-icons/fa";
import { FaCircle } from "react-icons/fa";
import { formatDateAndTime, getAvatarName } from "../../utils/index";

const OrderCard = ({ key, order }) => {
  console.log(order);

  // Kitchen status display helper
  const getKitchenStatusDisplay = (kitchenStatus) => {
    const statusMap = {
      'pending': {
        text: '⏳ Đang chờ',
        bgColor: 'bg-yellow-900 bg-opacity-40',
        textColor: 'text-yellow-300',
        borderColor: 'border-yellow-600'
      },
      'preparing': {
        text: '👨‍🍳 Đang chế biến',
        bgColor: 'bg-blue-900 bg-opacity-40',
        textColor: 'text-blue-300',
        borderColor: 'border-blue-600'
      },
      'completed': {
        text: '✅ Hoàn thành',
        bgColor: 'bg-green-900 bg-opacity-40',
        textColor: 'text-green-300',
        borderColor: 'border-green-600'
      },
      'cancelled': {
        text: '❌ Đã hủy',
        bgColor: 'bg-red-900 bg-opacity-40',
        textColor: 'text-red-300',
        borderColor: 'border-red-600'
      }
    };
    return statusMap[kitchenStatus] || {
      text: kitchenStatus,
      bgColor: 'bg-gray-900 bg-opacity-40',
      textColor: 'text-gray-300',
      borderColor: 'border-gray-600'
    };
  };

  const kitchenStatusDisplay = getKitchenStatusDisplay(order.kitchenStatus);

  return (
    <div key={key} className="w-[500px] bg-[#262626] p-4 rounded-lg mb-4">
      <div className="flex items-center gap-5">
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
          {getAvatarName(order.customerDetails.name)}
        </button>
        <div className="flex items-center justify-between w-[100%]">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
              {order.customerDetails.name}
            </h1>
            <p className="text-[#ababab] text-sm">#{Math.floor(new Date(order.orderDate).getTime())} / Ăn tại chỗ</p>
            <p className="text-[#ababab] text-sm">Bàn <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" /> {order.table.tableNo}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Kitchen Status Badge - Single Source of Truth */}
            <div className={`${kitchenStatusDisplay.bgColor} ${kitchenStatusDisplay.textColor} ${kitchenStatusDisplay.borderColor} border-2 px-4 py-2 rounded-lg font-bold text-base`}>
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
      <div className="flex items-center justify-between mt-4">
        <h1 className="text-[#f5f5f5] text-lg font-semibold">Tổng tiền</h1>
        <p className="text-[#f5f5f5] text-lg font-semibold">{order.bills.totalWithTax.toFixed(2)}₫</p>
      </div>
    </div>
  );
};

export default OrderCard;
