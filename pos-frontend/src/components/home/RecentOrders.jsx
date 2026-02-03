import React from "react";
import { FaSearch } from "react-icons/fa";
import OrderList from "./OrderList";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders } from "../../https/index";

/**
 * RecentOrders
 * Component hiển thị danh sách đơn hàng gần đây tại màn hình Home:
 * - Lấy dữ liệu đơn hàng từ API
 * - Hiển thị danh sách OrderList
 * - Có ô tìm kiếm (UI, chưa xử lý logic filter)
 */
const RecentOrders = () => {

  // Gọi API lấy danh sách đơn hàng bằng React Query
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  // Nếu xảy ra lỗi khi gọi API → hiển thị thông báo
  if (isError) {
    enqueueSnackbar("Có lỗi xảy ra!", { variant: "error" });
  }

  return (
    <div className="px-8 mt-6">
      <div className="bg-[#1a1a1a] w-full h-[450px] rounded-lg">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Đơn hàng gần đây
          </h1>
          <a href="" className="text-[#025cca] text-sm font-semibold">
            Xem tất cả
          </a>
        </div>

        {/* Ô tìm kiếm */}
        <div className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng gần đây"
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5]"
          />
        </div>

        {/* Danh sách đơn hàng */}
        <div className="mt-4 px-6 overflow-y-scroll h-[300px] scrollbar-hide">
          {resData?.data.data.length > 0 ? (
            resData.data.data.map((order) => {
              return <OrderList key={order._id} order={order} />;
            })
          ) : (
            <p className="col-span-3 text-gray-500">
              Không có đơn hàng nào
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default RecentOrders;
