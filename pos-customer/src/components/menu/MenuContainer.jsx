import React, { useEffect, useMemo, useState } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { getCategories, getDishes } from "../../https";
import { enqueueSnackbar } from "notistack";
import { resolveAssetUrl } from "../../utils";


const MenuContainer = () => {
  const [selected, setSelected] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [itemId, setItemId] = useState();
  const dispatch = useDispatch();

  const { data: categoriesRes, isError: categoryError } = useQuery({
    queryKey: ["menu", "categories"],
    queryFn: async () => await getCategories(),
    placeholderData: keepPreviousData,
  });

  const { data: dishesRes, isError: dishError } = useQuery({
    queryKey: ["menu", "dishes"],
    queryFn: async () => await getDishes(),
    placeholderData: keepPreviousData,
  });

  if (categoryError || dishError) {
    enqueueSnackbar("Không thể tải thực đơn từ máy chủ.", { variant: "error" });
  }

  const categories = categoriesRes?.data?.data || [];
  const dishes = dishesRes?.data?.data || [];

  const menuColors = [
    "#b73e3e",
    "#5b45b0",
    "#7f167f",
    "#735f32",
    "#1d2569",
    "#285430",
    "#b73e3e",
    "#5b45b0",
  ];

  const menus = useMemo(() => {
    return categories.map((category, index) => ({
      id: category._id,
      name: category.name,
      bgColor: menuColors[index % menuColors.length],
      icon: "",
      isActive: Boolean(category.isActive),
      items: dishes.filter((dish) => `${dish.category?._id || dish.category}` === `${category._id}`),
    }));
  }, [categories, dishes]);

  useEffect(() => {
    if (!selected && menus.length > 0) {
      const firstActive = menus.find((menu) => menu.isActive) || menus[0];
      setSelected(firstActive);
    }
  }, [menus, selected]);

  const increment = (id) => {
    setItemId(id);
    if (itemCount >= 4) return;
    setItemCount((prev) => prev + 1);
  };

  const decrement = (id) => {
    setItemId(id);
    if (itemCount <= 0) return;
    setItemCount((prev) => prev - 1);
  };

  const handleAddToCart = (item) => {
    if (itemCount === 0) return;

    const { name, price, _id, imageUrl } = item;
    const newObj = {
      id: `${_id}`,
      name,
      pricePerQuantity: price,
      quantity: itemCount,
      price: price * itemCount,
      notes: "",
      dishId: _id,
      imageUrl: resolveAssetUrl(imageUrl || "")
    };

    dispatch(addItems(newObj));
    setItemCount(0);
    enqueueSnackbar("Đã thêm món vào giỏ.", { variant: "success" });
  }


  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 py-2 w-full">
        {menus.map((menu) => {
          return (
            <div
              key={menu.id}
              className={`flex flex-col items-start justify-between p-4 rounded-lg h-[100px] ${menu.isActive ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                }`}
              style={{ backgroundColor: menu.bgColor }}
              onClick={() => {
                if (!menu.isActive) return;
                setSelected(menu);
                setItemId(0);
                setItemCount(0);
              }}
            >
              <div className="flex items-center justify-between w-full">
                <h1 className={`text-lg font-semibold ${menu.isActive ? "text-[#f5f5f5]" : "text-[#b0b0b0]"}`}>
                  {menu.icon} {menu.name}
                </h1>
                {selected?.id === menu.id && (
                  <GrRadialSelected className="text-white" size={20} />
                )}
              </div>
              <p className="text-[#ababab] text-sm font-semibold">
                {menu.items.length} Items
              </p>
              {!menu.isActive && (
                <span className="text-xs text-[#f6b100]">Ngừng bán</span>
              )}
            </div>
          );
        })}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-3" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 py-4 w-full">
        {selected?.items.map((item) => {
          const isItemActive = item.isAvailable && selected?.isActive;
          return (
            <div
              key={item._id}
              className={`flex flex-col items-start justify-between p-4 rounded-lg min-h-[150px] ${isItemActive ? "cursor-pointer hover:bg-[#2a2a2a]" : "cursor-not-allowed opacity-60"
                } bg-[#1a1a1a]`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={resolveAssetUrl(item.imageUrl)}
                      alt={item.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#2a2a2a]" />
                  )}
                  <h1 className="text-[#f5f5f5] text-lg font-semibold">
                    {item.name}
                  </h1>
                </div>
                <button
                  onClick={() => isItemActive && handleAddToCart(item)}
                  disabled={!isItemActive}
                  className={`p-2 rounded-lg ${isItemActive
                    ? "bg-[#2e4a40] text-[#02ca3a]"
                    : "bg-[#2a2a2a] text-[#666]"
                    }`}
                >
                  <FaShoppingCart size={20} />
                </button>
              </div>
              <div className="flex items-center justify-between w-full">
                <p className="text-[#f5f5f5] text-xl font-bold">
                  {item.price?.toLocaleString("vi-VN")}₫
                </p>
                <div className="flex items-center justify-between bg-[#1f1f1f] px-3 py-2 rounded-lg gap-4 min-w-[118px]">
                  <button
                    onClick={() => isItemActive && decrement(item._id)}
                    disabled={!isItemActive}
                    className="text-yellow-500 text-2xl"
                  >
                    &minus;
                  </button>
                  <span className="text-white">
                    {itemId == item._id ? itemCount : "0"}
                  </span>
                  <button
                    onClick={() => isItemActive && increment(item._id)}
                    disabled={!isItemActive}
                    className="text-yellow-500 text-2xl"
                  >
                    &#43;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MenuContainer;
