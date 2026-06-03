import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import {
  addOrder,
  updateTable,
} from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import { formatVND } from "../../utils";

const Bill = ({ onOrderSuccess }) => {
  const dispatch = useDispatch();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);
  const taxRate = 5.25;
  const tax = (total * taxRate) / 100;
  const totalPriceWithTax = total + tax;

  const [showInvoice, setShowInvoice] = useState(false);
  const [orderInfo, setOrderInfo] = useState();

  const handlePrintDraftInvoice = () => {
    if (!cartData || cartData.length === 0) {
      enqueueSnackbar("Giỏ hàng trống, không thể in hóa đơn.", {
        variant: "warning",
      });
      return;
    }

    setOrderInfo({
      _id: `DRAFT-${Date.now()}`,
      orderDate: new Date().toISOString(),
      customerDetails: {
        name: customerData.customerName || "Khách hàng",
        phone: customerData.customerPhone || "N/A",
        guests: customerData.guests || 1,
      },
      paymentMethod: "Cash",
      bills: {
        total,
        tax,
        totalWithTax: totalPriceWithTax,
      },
      items: cartData,
    });
    setShowInvoice(true);
  };

  const handlePlaceOrder = async () => {
    // Validate cart and customer data
    if (!cartData || cartData.length === 0) {
      enqueueSnackbar("Vui lòng thêm món vào giỏ hàng!", {
        variant: "warning",
      });
      return;
    }

    if (!customerData.table?.tableId) {
      enqueueSnackbar("Vui lòng chọn bàn!", {
        variant: "warning",
      });
      return;
    }

    // Place the order without payment method
    const orderData = {
      customerDetails: {
        name: customerData.customerName || "Khách hàng",
        phone: customerData.customerPhone || "N/A",
        guests: customerData.guests || 1,
      },
      orderStatus: "In Progress",
      bills: {
        total: total,
        tax: tax,
        totalWithTax: totalPriceWithTax,
      },
      items: cartData,
      table: customerData.table.tableId,
    };
    orderMutation.mutate(orderData);
  };

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      console.log(data);

      setOrderInfo(data);
      dispatch(removeAllItems());

      if (onOrderSuccess) {
        onOrderSuccess();
      }

      // Update Table
      const tableData = {
        status: "Booked",
        orderId: data._id,
        tableId: data.table,
      };

      setTimeout(() => {
        tableUpdateMutation.mutate(tableData);
      }, 1500);

      enqueueSnackbar("Đặt đơn thành công!", {
        variant: "success",
      });
      setShowInvoice(true);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: (resData) => {
      console.log(resData);
      dispatch(removeCustomer());
      dispatch(removeAllItems());
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <>
      {/* Tổng số món */}
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Số món ({cartData.length})
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          {formatVND(total)}
        </h1>
      </div>

      {/* Thuế */}
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Thuế (5.25%)
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          {formatVND(tax)}
        </h1>
      </div>

      {/* Tổng tiền sau thuế */}
      <div className="flex items-center justify-between px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Tổng cộng (đã bao gồm thuế)
        </p>
        <h1 className="text-[#f5f5f5] text-md font-bold">
          {formatVND(totalPriceWithTax)}
        </h1>
      </div>

      {/* Hành động */}
      <div className="flex items-center gap-2 px-4 sm:px-5 mt-4">
        <button
          onClick={handlePrintDraftInvoice}
          className="bg-[#025cca] px-3 py-3 w-full rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-base"
        >
          In hóa đơn
        </button>

        <button
          onClick={handlePlaceOrder}
          disabled={!cartData || cartData.length === 0}
          className="bg-[#f6b100] px-3 py-3 w-full rounded-lg text-[#1f1f1f] font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Đặt đơn
        </button>
      </div>

      {/* Hiển thị hóa đơn */}
      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}
    </>

  );
};

export default Bill;
