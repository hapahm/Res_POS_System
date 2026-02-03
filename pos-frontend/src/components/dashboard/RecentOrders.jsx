import React from "react";
import { GrUpdate } from "react-icons/gr";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders, updateOrderStatus } from "../../https/index";
import { formatDateAndTime } from "../../utils";

const RecentOrders = () => {

  // React Query client dùng để refresh lại dữ liệu cache
  const queryClient = useQueryClient();

  // Hàm xử lý khi người dùng thay đổi trạng thái đơn hàng
  const handleStatusChange = ({ orderId, orderStatus }) => {
    console.log(orderId);

    // Gửi request cập nhật trạng thái đơn hàng
    orderStatusUpdateMutation.mutate({ orderId, orderStatus });
  };

  // Mutation cập nhật trạng thái đơn hàng
  const orderStatusUpdateMutation = useMutation({
    mutationFn: ({ orderId, orderStatus }) =>
      updateOrderStatus({ orderId, orderStatus }),

    // Khi cập nhật thành công
    onSuccess: () => {
      enqueueSnackbar("Cập nhật trạng thái đơn hàng thành công!", {
        variant: "success",
      });

      // Làm mới lại danh sách đơn hàng
      queryClient.invalidateQueries(["orders"]);
    },

    // Khi cập nhật thất bại
    onError: () => {
      enqueueSnackbar("Cập nhật trạng thái đơn hàng thất bại!", {
        variant: "error",
      });
    },
  });

  // Query lấy danh sách đơn hàng từ server
  const { data: resData, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      return await getOrders();
    },
    placeholderData: keepPreviousData,
  });

  // Xử lý khi xảy ra lỗi load dữ liệu
  if (isError) {
    enqueueSnackbar("Đã xảy ra lỗi khi tải dữ liệu!", { variant: "error" });
  }

  console.log(resData?.data?.data);

  return (
    <div className="container mx-auto bg-[#262626] p-4 rounded-lg">

      {/* Tiêu đề */}
      <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4">
        Đơn hàng gần đây
      </h2>

      {/* Bảng danh sách đơn hàng */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[#f5f5f5]">

          {/* Header bảng */}
          <thead className="bg-[#333] text-[#ababab]">
            <tr>
              <th className="p-3">Mã đơn</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Ngày & Giờ</th>
              <th className="p-3">Số món</th>
              <th className="p-3">Số bàn</th>
              <th className="p-3">Tổng tiền</th>
              <th className="p-3 text-center">Hình thức thanh toán</th>
            </tr>
          </thead>

          {/* Body bảng */}
          <tbody>
            {resData?.data.data.map((order, index) => (
              <tr
                key={index}
                className="border-b border-gray-600 hover:bg-[#333]"
              >

                {/* Mã đơn hàng */}
                <td className="p-4">
                  #{Math.floor(new Date(order.orderDate).getTime())}
                </td>

                {/* Tên khách hàng */}
                <td className="p-4">
                  {order.customerDetails.name}
                </td>

                {/* Trạng thái đơn hàng */}
                <td className="p-4">
                  <select
                    className={`bg-[#1a1a1a] text-[#f5f5f5] border border-gray-500 p-2 rounded-lg focus:outline-none 
                      ${order.orderStatus === "Ready"
                        ? "text-green-500"
                        : "text-yellow-500"
                      }`}
                    value={order.orderStatus}
                    onChange={(e) =>
                      handleStatusChange({
                        orderId: order._id,
                        orderStatus: e.target.value,
                      })
                    }
                  >
                    <option
                      className="text-yellow-500"
                      value="In Progress"
                    >
                      Đang xử lý
                    </option>

                    <option
                      className="text-green-500"
                      value="Ready"
                    >
                      Hoàn thành
                    </option>
                  </select>
                </td>

                {/* Ngày giờ đặt hàng */}
                <td className="p-4">
                  {formatDateAndTime(order.orderDate)}
                </td>

                {/* Số lượng món */}
                <td className="p-4">
                  {order.items.length} món
                </td>

                {/* Số bàn */}
                <td className="p-4">
                  Bàn - {order.table.tableNo}
                </td>

                {/* Tổng tiền */}
                <td className="p-4">
                  ₫{order.bills.totalWithTax}
                </td>

                {/* Phương thức thanh toán */}
                <td className="p-4">
                  {order.paymentMethod}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default RecentOrders;
