import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import ExistingOrders from "../components/menu/ExistingOrders";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrderItem, getTableOrders } from "../https";
import { updateTable } from "../redux/slices/customerSlice";
import { enqueueSnackbar } from "notistack";

const Menu = () => {

  const { tableId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Khi màn hình Menu được load → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Thực đơn"
  }, [])

  // Lấy thông tin khách hàng từ Redux Store
  const customerData = useSelector((state) => state.customer);

  useEffect(() => {
    if (tableId && customerData.table?.tableId !== tableId) {
      const tableNo = location.state?.tableNo || customerData.table?.tableNo;
      dispatch(updateTable({ table: { tableId, tableNo } }));
    }
  }, [tableId, location.state, dispatch]);

  const { data: tableOrdersRes } = useQuery({
    queryKey: ["tableOrders", tableId],
    queryFn: async () => getTableOrders(tableId),
    enabled: !!tableId,
    placeholderData: keepPreviousData
  });

  const cancelItemMutation = useMutation({
    mutationFn: ({ orderId, itemId }) => cancelOrderItem({ orderId, itemId }),
    onSuccess: () => {
      queryClient.invalidateQueries(["tableOrders", tableId]);
      enqueueSnackbar("Đã hủy món", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Không thể hủy món", { variant: "error" });
    }
  });

  const handleCancelItem = (orderId, itemId) => {
    cancelItemMutation.mutate({ orderId, itemId });
  };

  const handleOrderPlaced = () => {
    queryClient.invalidateQueries(["tableOrders", tableId]);
  };

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto dark-scrollbar px-3 md:px-4 lg:px-0 pb-24">
        <div className="flex flex-col lg:flex-row gap-3 py-3">

          {/* ================= LEFT AREA - DANH SÁCH MÓN ================= */}
          <div className="flex-1 min-w-0">

            {/* Thanh header */}
            <div className="sticky top-0 z-20 bg-[#1f1f1f]/95 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 md:px-4 lg:px-7 py-4">

              {/* Nút quay lại + tiêu đề */}
              <div className="flex items-center gap-4">
                <BackButton />
                <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
                  Thực đơn
                </h1>
              </div>

              {/* Thông tin khách hàng + bàn */}
              <div className="flex items-center justify-around gap-4">
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="flex flex-col items-start">
                    {/* Tên khách hàng */}
                    <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
                      {customerData.customerName || "Tên khách hàng"}
                    </h1>

                    {/* Số bàn */}
                    <p className="text-xs text-[#ababab] font-medium">
                      Bàn : {customerData.table?.tableNo || "Chưa chọn"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danh sách món ăn */}
            <div className="px-1 md:px-4 lg:px-7 pb-4 lg:pb-6">
              <MenuContainer />
            </div>
          </div>

          {/* ================= RIGHT AREA - GIỎ HÀNG + HÓA ĐƠN ================= */}
          <div className="w-full lg:w-[380px] bg-[#1a1a1a] rounded-lg pt-2 flex flex-col h-[calc(100vh-10rem)] overflow-hidden">

            {/* Thông tin khách hàng */}
            <CustomerInfo />
            <hr className="border-[#2a2a2a] border-t-2" />

            <div className="flex-1 min-h-0 overflow-y-auto dark-scrollbar">
              {/* Đơn chưa thanh toán */}
              <ExistingOrders
                orders={tableOrdersRes?.data?.data || []}
                onCancelItem={handleCancelItem}
              />
              <hr className="border-[#2a2a2a] border-t-2" />

              {/* Danh sách món đã chọn */}
              <CartInfo />
            </div>
            <hr className="border-[#2a2a2a] border-t-2" />

            {/* Hóa đơn */}
            <div className="bg-[#1a1a1a] shrink-0 pb-3">
              <Bill onOrderSuccess={handleOrderPlaced} />
            </div>
          </div>
        </div>
      </div>

      {/* Thanh điều hướng dưới */}
      <BottomNav />
    </section>
  );
};

export default Menu;
