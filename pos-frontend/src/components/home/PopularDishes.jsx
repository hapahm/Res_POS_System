import React from "react";
import { popularDishes } from "../../constants";

/**
 * PopularDishes
 * Component hiển thị danh sách các món ăn được gọi nhiều nhất:
 * - Thứ tự món
 * - Hình ảnh món
 * - Tên món
 * - Số lượt gọi
 */
const PopularDishes = () => {
  return (
    <div className="mt-6 pr-6">
      <div className="bg-[#1a1a1a] w-full rounded-lg">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Món ăn phổ biến
          </h1>
          <a href="" className="text-[#025cca] text-sm font-semibold">
            Xem tất cả
          </a>
        </div>

        {/* Danh sách món ăn */}
        <div className="overflow-y-scroll h-[680px] scrollbar-hide">
          {popularDishes.map((dish) => {
            return (
              <div
                key={dish.id}
                className="flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-6 py-4 mt-4 mx-6"
              >

                {/* Số thứ tự món */}
                <h1 className="text-[#f5f5f5] font-bold text-xl mr-4">
                  {dish.id < 10 ? `0${dish.id}` : dish.id}
                </h1>

                {/* Hình ảnh món ăn */}
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-[50px] h-[50px] rounded-full"
                />

                {/* Thông tin món */}
                <div>
                  <h1 className="text-[#f5f5f5] font-semibold tracking-wide">
                    {dish.name}
                  </h1>
                  <p className="text-[#f5f5f5] text-sm font-semibold mt-1">
                    <span className="text-[#ababab]">Số lượt gọi: </span>
                    {dish.numberOfOrders}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default PopularDishes;
