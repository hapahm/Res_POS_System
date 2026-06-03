import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import CustomerBackButton from "../components/shared/CustomerBackButton";
import { MdRestaurantMenu } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import CustomerExistingOrders from "../components/menu/CustomerExistingOrders";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrderItem, getTableOrders } from "../https";
import { updateTable } from "../redux/slices/customerSessionSlice";
import { enqueueSnackbar } from "notistack";

const Menu = () => {

  const { tableId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  // Khi màn hình Menu được load → đổi tiêu đề tab trình duyệt
  useEffect(() => {
    document.title = "POS | Menu"
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
    <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-3 overflow-y-auto pb-20 lg:pb-0">

      {/* ================= LEFT AREA - DANH SÁCH MÓN ================= */}
      <div className="flex-1 min-w-0">

        {/* Thanh header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-8 lg:px-10 py-4">

          {/* Nút quay lại + tiêu đề */}
          <div className="flex items-center gap-4">
            <CustomerBackButton />
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
              Thực đơn
            </h1>
          </div>

          {/* Thông tin khách hàng + bàn */}
          <div className="flex items-center justify-around gap-4">
            <div className="flex items-center gap-3 cursor-pointer">
              <MdRestaurantMenu className="text-[#f5f5f5] text-4xl" />

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
        <div className="px-4 md:px-8 lg:px-10 pb-4 lg:pb-6">
          <MenuContainer />
        </div>
      </div>

      {/* ================= RIGHT AREA - GIỎ HÀNG + HÓA ĐƠN ================= */}
      <div className="w-full lg:w-[380px] bg-[#1a1a1a] mx-3 lg:mr-3 mb-3 lg:mb-0 rounded-lg pt-2 flex flex-col">

        {/* Thông tin khách hàng */}
        <CustomerInfo />
        <hr className="border-[#2a2a2a] border-t-2" />

        <div>
          {/* Đơn chưa thanh toán */}
          <CustomerExistingOrders
            orders={tableOrdersRes?.data?.data || []}
            onCancelItem={handleCancelItem}
          />
          <hr className="border-[#2a2a2a] border-t-2" />

          {/* Danh sách món đã chọn */}
          <CartInfo />
        </div>
        <hr className="border-[#2a2a2a] border-t-2" />

        {/* Hóa đơn */}
        <div className="shrink-0 pb-3">
          <Bill onOrderSuccess={handleOrderPlaced} />
        </div>
      </div>

      {/* Thanh điều hướng dưới */}
      <BottomNav />
    </section>
  );
};

export default Menu;
