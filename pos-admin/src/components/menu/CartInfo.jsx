import React, { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, updateItemNotes } from "../../redux/slices/cartSlice";
import { formatVND } from "../../utils";

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrolLRef = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (scrolLRef.current) {
      scrolLRef.current.scrollTo({
        top: scrolLRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [cartData]);

  const handleRemove = (itemId) => {
    dispatch(removeItem(itemId));
  }

  const handleNotesChange = (itemId, notes) => {
    dispatch(updateItemNotes({ id: itemId, notes }));
  }

  return (
    <div className="px-4 py-2">
      <h1 className="text-lg text-[#e4e4e4] font-semibold tracking-wide">
        Chi tiết đơn hàng
      </h1>
      <div className="mt-4" ref={scrolLRef} >
        {cartData.length === 0 ? (
          <p className="text-[#ababab] text-sm flex justify-center items-center min-h-[120px]">Giỏ hàng trống. Thêm món vào giỏ hàng!</p>
        ) : cartData.map((item) => {
          return (
            <div className="bg-[#1f1f1f] rounded-lg px-4 py-4 mb-2" key={item.id}>
              <div className="flex items-center justify-between">
                <h1 className="text-[#ababab] font-semibold tracling-wide text-md">
                  {item.name}
                </h1>
                <p className="text-[#ababab] font-semibold">x{item.quantity}</p>
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  value={item.notes || ""}
                  onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  placeholder="Ghi chú cho món..."
                  className="w-full bg-[#262626] text-[#e4e4e4] text-xs px-3 py-2 rounded-lg focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <RiDeleteBin2Fill
                    onClick={() => handleRemove(item.id)}
                    className="text-[#ababab] cursor-pointer"
                    size={20}
                  />
                  <FaNotesMedical
                    className="text-[#ababab] cursor-pointer"
                    size={20}
                  />
                </div>
                <p className="text-[#f5f5f5] text-md font-bold">{formatVND(item.price)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartInfo;
