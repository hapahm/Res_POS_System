import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDishStats, getDishes } from "../../https";

/**
 * PopularDishes
 * Component hiển thị danh sách các món ăn được gọi nhiều nhất:
 * - Thứ tự món
 * - Hình ảnh món
 * - Tên món
 * - Số lượt gọi
 */
const PopularDishes = () => {
  const { data: dishStatsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "dishStats", "home"],
    queryFn: getDishStats,
    placeholderData: keepPreviousData,
  });

  const { data: dishesRes } = useQuery({
    queryKey: ["dishes", "all", "home"],
    queryFn: () => getDishes(),
    placeholderData: keepPreviousData,
  });

  const dishStats = (dishStatsRes?.data?.data || [])
    .slice()
    .sort((a, b) => Number(b?.totalQuantity || 0) - Number(a?.totalQuantity || 0));

  const dishImageById = (dishesRes?.data?.data || []).reduce((acc, dish) => {
    acc[`${dish?._id || ""}`] = dish?.imageUrl || "";
    return acc;
  }, {});

  return (
    <div className="mt-6 pr-6 h-full">
      <div className="bg-[#1a1a1a] w-full h-full rounded-lg flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Món ăn phổ biến
          </h1>
        </div>

        {/* Danh sách món ăn */}
        <div className="overflow-y-auto flex-1 min-h-0 pb-4 scrollbar-hide">
          {statsLoading ? (
            <p className="text-[#ababab] px-6">Đang tải món phổ biến...</p>
          ) : dishStats.length === 0 ? (
            <p className="text-[#ababab] px-6">Chưa có dữ liệu món phổ biến.</p>
          ) : (
            dishStats.map((dish, index) => {
              const dishImage = dishImageById[`${dish?._id || ""}`];

              return (
                <div
                  key={`${dish?._id || dish?.dishName || index}`}
                  className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mt-4 mx-6"
                >
                  <h1 className="text-[#f5f5f5] font-bold text-xl mr-4 min-w-8">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </h1>

                  {dishImage ? (
                    <img
                      src={dishImage}
                      alt={dish?.dishName || "Món ăn"}
                      className="w-[50px] h-[50px] rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-[50px] h-[50px] rounded-full bg-[#2a2a2a]" />
                  )}

                  <div>
                    <h1 className="text-[#f5f5f5] font-semibold tracking-wide">
                      {dish?.dishName || "Món không xác định"}
                    </h1>
                    <p className="text-[#f5f5f5] text-sm font-semibold mt-1">
                      <span className="text-[#ababab]">Số lượt gọi: </span>
                      {Number(dish?.totalQuantity || 0).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default PopularDishes;
