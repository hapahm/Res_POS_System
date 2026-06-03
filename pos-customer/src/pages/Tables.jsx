import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import CustomerBackButton from "../components/shared/CustomerBackButton";
import TableCard from "../components/tables/TableCard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTables } from "../https";
import { enqueueSnackbar } from "notistack";

const Tables = () => {

  // State lưu trạng thái lọc bàn
  // all | occupied
  const [status, setStatus] = useState("all");

  // Khi màn hình Tables được load → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Tables"
  }, [])

  // Gọi API lấy danh sách bàn bằng React Query
  const { data: resData, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      return await getTables();
    },
    // Giữ lại dữ liệu cũ khi đang loading
    placeholderData: keepPreviousData,
  });

  // Nếu API lỗi → hiện thông báo
  if (isError) {
    enqueueSnackbar("Đã xảy ra lỗi khi tải danh sách bàn!", { variant: "error" })
  }

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between px-10 py-4">

        {/* Nút quay lại + tiêu đề */}
        <div className="flex items-center gap-4">
          <CustomerBackButton />
          <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
            Danh sách bàn
          </h1>
        </div>

        {/* Bộ lọc trạng thái bàn */}
        <div className="flex items-center justify-around gap-4">

          {/* Tất cả */}
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-lg ${status === "all" && "bg-[#383838]"
              } rounded-lg px-5 py-2 font-semibold`}
          >
            Tất cả
          </button>

          {/* Đã đặt */}
          <button
            onClick={() => setStatus("occupied")}
            className={`text-[#ababab] text-lg ${status === "occupied" && "bg-[#383838]"
              } rounded-lg px-5 py-2 font-semibold`}
          >
            Đã đặt
          </button>
        </div>
      </div>

      {/* ================= DANH SÁCH BÀN ================= */}
      <div className="grid grid-cols-5 gap-3 px-16 py-4 h-[650px] overflow-y-scroll scrollbar-hide">

        {resData?.data.data
          .filter((table) => status === "all" || table.status === "Đã đặt")
          .map((table) => {
            return (
              <TableCard
                key={table._id}
                id={table._id}
                name={table.tableNo}
                status={table.status}
                ownedByMe={Boolean(table.ownedByMe)}
                initials={table?.currentOrder?.customerDetails.name}
                seats={table.seats}
              />
            );
          })}

      </div>

      {/* Thanh điều hướng phía dưới */}
      <BottomNav />
    </section>
  );
};

export default Tables;
