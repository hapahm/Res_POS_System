import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
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
    document.title = "POS | Bàn"
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
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">

      {/* ================= HEADER ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-4">

        {/* Nút quay lại + tiêu đề */}
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider">
            Danh sách bàn
          </h1>
        </div>

        {/* Bộ lọc trạng thái bàn */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">

          {/* Tất cả */}
          <button
            onClick={() => setStatus("all")}
            className={`text-[#ababab] text-sm md:text-base ${status === "all" && "bg-[#383838]"
              } rounded-lg px-3 md:px-4 py-2 font-semibold whitespace-nowrap`}
          >
            Tất cả
          </button>

          {/* Đã đặt */}
          <button
            onClick={() => setStatus("occupied")}
            className={`text-[#ababab] text-sm md:text-base ${status === "occupied" && "bg-[#383838]"
              } rounded-lg px-3 md:px-4 py-2 font-semibold whitespace-nowrap`}
          >
            Đã đặt
          </button>
        </div>
      </div>

      {/* ================= DANH SÁCH BÀN ================= */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 py-2">
          {resData?.data.data
            .filter((table) => status === "all" || table.status === "Đã đặt")
            .map((table) => {
              return (
                <TableCard
                  key={table._id}
                  id={table._id}
                  name={table.tableNo}
                  status={table.status}
                  initials={table?.currentOrder?.customerDetails.name}
                  seats={table.seats}
                />
              );
            })}
        </div>
      </div>

      {/* Thanh điều hướng phía dưới */}
      <BottomNav />
    </section>
  );
};

export default Tables;
