import React, { useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSearch = () => {
    setSearchKeyword(searchTerm.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Gọi API lấy danh sách đơn hàng bằng React Query
  const { data: resData, isError } = useQuery({
    queryKey: ["orders", "home"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  // Nếu xảy ra lỗi khi gọi API → hiển thị thông báo
  if (isError) {
    enqueueSnackbar("Có lỗi xảy ra!", { variant: "error" });
  }

  const normalizeText = (value = "") => {
    return `${value}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizedKeyword = normalizeText(searchKeyword);
  const allOrders = resData?.data?.data || [];

  const isWithinLast12Hours = (dateInput) => {
    if (!dateInput) return false;
    const orderTime = new Date(dateInput).getTime();
    if (Number.isNaN(orderTime)) return false;

    const twelveHoursMs = 12 * 60 * 60 * 1000;
    return Date.now() - orderTime <= twelveHoursMs;
  };

  const recentOrders = allOrders.filter((order) => {
    const sourceTime = order?.orderDate || order?.createdAt;
    return isWithinLast12Hours(sourceTime);
  });

  const filteredOrders = recentOrders
    .filter((order) => {
      if (!normalizedKeyword) return true;

      const customerName = normalizeText(order?.customerDetails?.name || "");
      const customerPhone = normalizeText(order?.customerDetails?.phone || "");
      const tableNo = normalizeText(`${order?.table?.tableNo || ""}`);
      const orderCode = normalizeText(`${Math.floor(new Date(order?.orderDate || order?.createdAt || Date.now()).getTime())}`);
      const itemNames = normalizeText((order?.items || []).map((item) => item?.name || "").join(" "));

      return (
        customerName.includes(normalizedKeyword) ||
        customerPhone.includes(normalizedKeyword) ||
        tableNo.includes(normalizedKeyword) ||
        orderCode.includes(normalizedKeyword) ||
        itemNames.includes(normalizedKeyword)
      );
    })
    .sort((a, b) => new Date(b?.orderDate || b?.createdAt || 0) - new Date(a?.orderDate || a?.createdAt || 0));

  return (
    <div className="px-8 mt-6 flex-1 min-h-0 pb-6">
      <div className="bg-[#1a1a1a] w-full h-full rounded-lg flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Đơn hàng gần đây
          </h1>
        </div>

        {/* Ô tìm kiếm */}
        <div className="flex items-center gap-3 bg-[#1f1f1f] rounded-[15px] px-4 py-3 mx-6">
          <FaSearch className="text-[#f5f5f5]" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng gần đây"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchKeyword(e.target.value.trim());
            }}
            onKeyDown={handleKeyDown}
            className="bg-[#1f1f1f] outline-none text-[#f5f5f5] flex-1"
          />
          <button
            onClick={handleSearch}
            className="bg-[#f6b100] text-[#1f1f1f] font-semibold px-4 py-2 rounded-lg"
          >
            Tìm kiếm
          </button>
        </div>

        {/* Danh sách đơn hàng */}
        <div className="mt-4 px-6 pb-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              return <OrderList key={order._id} order={order} />;
            })
          ) : (
            <p className="col-span-3 text-gray-500">
              {normalizedKeyword ? "Không tìm thấy đơn hàng phù hợp" : "Không có đơn hàng nào"}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default RecentOrders;
