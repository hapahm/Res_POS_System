import React, { useState } from "react";
import { getAvatarName, getBgColor } from "../../utils";
import { FaLongArrowAltRight } from "react-icons/fa";
import CustomerInfoModal from "./CustomerInfoModal";
import { getTableOrders } from "../../https";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";

const TableCard = ({ id, name, status, initials, seats }) => {

  const [showModal, setShowModal] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(false);
  const navigate = useNavigate();

  const handleTableClick = async () => {
    if (checkingOrder) return;

    try {
      setCheckingOrder(true);
      const res = await getTableOrders(id);
      const openOrders = res?.data?.data || [];

      if (openOrders.length > 0) {
        navigate(`/menu/${id}`, { state: { tableNo: name } });
        return;
      }

      setShowModal(true);
    } catch (error) {
      enqueueSnackbar("Không kiểm tra được trạng thái bàn, vui lòng thử lại", { variant: "error" });
    } finally {
      setCheckingOrder(false);
    }
  };

  return (
    <>
      <div
        onClick={handleTableClick}
        key={id}
        className="w-full hover:bg-[#2c2c2c] bg-[#262626] p-4 rounded-lg cursor-pointer"
      >

        {/* ================= HEADER CỦA THẺ BÀN ================= */}
        <div className="flex items-center justify-between px-1 gap-3">

          {/* Tên bàn */}
          <h1 className="text-[#f5f5f5] text-lg md:text-xl font-semibold min-w-0 truncate">
            Bàn
            <FaLongArrowAltRight className="text-[#ababab] ml-2 inline" />
            {name}
          </h1>

          {/* Trạng thái bàn */}
          <p
            className={`${status === "Đã đặt"
              ? "text-green-600 bg-[#2e4a40]"
              : "bg-[#664a04] text-white"
              } px-2 py-1 rounded-lg whitespace-nowrap text-xs md:text-sm`}
          >
            {checkingOrder ? "Đang kiểm tra..." : status === "Đã đặt" ? "Đã đặt" : "Trống"}
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

      {showModal && (
        <CustomerInfoModal
          tableId={id}
          tableNo={name}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default TableCard;
