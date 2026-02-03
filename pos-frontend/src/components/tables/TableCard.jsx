import React from "react";
import { useNavigate } from "react-router-dom";
import { getAvatarName, getBgColor } from "../../utils";
import { useDispatch } from "react-redux";
import { updateTable } from "../../redux/slices/customerSlice";
import { FaLongArrowAltRight } from "react-icons/fa";

const TableCard = ({ id, name, status, initials, seats }) => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Xử lý khi click vào bàn
  const handleClick = (name) => {
    // Nếu bàn đã được đặt thì không cho click
    if (status === "Booked") return;

    // Lưu thông tin bàn vào Redux Store
    const table = { tableId: id, tableNo: name };
    dispatch(updateTable({ table }));

    // Chuyển sang màn hình menu để gọi món
    navigate(`/menu`);
  };

  return (
    <div
      onClick={() => handleClick(name)}
      key={id}
      className="w-[300px] hover:bg-[#2c2c2c] bg-[#262626] p-4 rounded-lg cursor-pointer"
    >

      {/* ================= HEADER CỦA THẺ BÀN ================= */}
      <div className="flex items-center justify-between px-1">

        {/* Tên bàn */}
        <h1 className="text-[#f5f5f5] text-xl font-semibold">
          Bàn
          <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" />
          {name}
        </h1>

        {/* Trạng thái bàn */}
        <p
          className={`${status === "Booked"
              ? "text-green-600 bg-[#2e4a40]"
              : "bg-[#664a04] text-white"
            } px-2 py-1 rounded-lg`}
        >
          {status === "Booked" ? "Đã đặt" : "Trống"}
        </p>
      </div>

      {/* ================= AVATAR KHÁCH ================= */}
      <div className="flex items-center justify-center mt-5 mb-8">

        {/* 
          Hiển thị avatar chữ cái đầu của tên khách.
          Nếu chưa có khách → nền xám + N/A
        */}
        <h1
          className="text-white rounded-full p-5 text-xl"
          style={{
            backgroundColor: initials ? getBgColor() : "#1f1f1f",
          }}
        >
          {getAvatarName(initials) || "N/A"}
        </h1>
      </div>

      {/* ================= SỐ CHỖ NGỒI ================= */}
      <p className="text-[#ababab] text-xs">
        Số chỗ: <span className="text-[#f5f5f5]">{seats}</span>
      </p>
    </div>
  );
};

export default TableCard;
