import React, { useEffect, useMemo, useState } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { useSearchParams } from "react-router-dom";
import { createVnpayPayment, getTableOrders, getTables, markTablePaid } from "../https";
import Invoice from "../components/invoice/Invoice";
import { formatVND } from "../utils";

const Payment = () => {
    const [searchParams] = useSearchParams();
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceOrderInfo, setInvoiceOrderInfo] = useState(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        document.title = "POS | Payment";
    }, []);

    useEffect(() => {
        const tableIdFromQuery = searchParams.get("tableId");
        const orderIdFromQuery = searchParams.get("orderId");

        if (tableIdFromQuery) {
            setSelectedTableId(tableIdFromQuery);
        }

        if (orderIdFromQuery) {
            setSelectedOrderId(orderIdFromQuery);
        }
    }, [searchParams]);

    const { data: tablesRes, isError: tablesError } = useQuery({
        queryKey: ["tables"],
        queryFn: async () => getTables(),
        placeholderData: keepPreviousData
    });

    const { data: tableOrdersRes } = useQuery({
        queryKey: ["tableOrders", selectedTableId],
        queryFn: async () => getTableOrders(selectedTableId),
        enabled: !!selectedTableId,
        placeholderData: keepPreviousData
    });

    const orders = tableOrdersRes?.data?.data || [];

    const payableOrderId = useMemo(() => {
        if (!orders.length) {
            return null;
        }

        const matchedOrder = selectedOrderId
            ? orders.find((order) => `${order._id}` === `${selectedOrderId}`)
            : null;

        if (matchedOrder) {
            return matchedOrder._id;
        }

        return orders[0]._id;
    }, [orders, selectedOrderId]);

    const total = useMemo(() => {
        if (!orders.length) return 0;
        const billSum = orders.reduce(
            (sum, order) => sum + (order.bills?.totalWithTax || 0),
            0
        );
        if (billSum > 0) return billSum;

        return orders.reduce((sum, order) => {
            const itemsTotal = (order.items || [])
                .filter((item) => !item.cancelled_at && item.status !== 'cancelled')
                .reduce((s, item) => s + (item.price || 0), 0);
            return sum + itemsTotal;
        }, 0);
    }, [orders]);

    const markPaidMutation = useMutation({
        mutationFn: (tableId) => markTablePaid(tableId),
        onSuccess: () => {
            const firstOrder = orders[0] || null;
            const invoiceItems = orders.flatMap((order) =>
                (order.items || []).filter((item) => !item.cancelled_at && item.status !== "cancelled")
            );

            if (firstOrder) {
                const mergedInvoice = {
                    orderDate: new Date().toISOString(),
                    customerDetails: firstOrder.customerDetails || {
                        name: "Khách hàng",
                        phone: "N/A",
                        guests: 1,
                    },
                    items: invoiceItems,
                    bills: {
                        total: Number(total) || 0,
                        tax: 0,
                        totalWithTax: Number(total) || 0,
                    },
                    paymentMethod: "Cash",
                    paymentData: null,
                };
                setInvoiceOrderInfo(mergedInvoice);
                setShowInvoice(true);
            }

            enqueueSnackbar("Đã thanh toán thành công", { variant: "success" });
            queryClient.invalidateQueries(["tables"]);
            if (selectedTableId) {
                queryClient.invalidateQueries(["tableOrders", selectedTableId]);
            }
            setSelectedTableId(null);
            setSelectedOrderId(null);
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data?.message || "Thanh toán thất bại", { variant: "error" });
        }
    });

    const bankPaymentMutation = useMutation({
        mutationFn: (orderId) => createVnpayPayment(orderId),
        onSuccess: (res) => {
            const paymentUrl = res?.data?.data?.paymentUrl;
            if (!paymentUrl) {
                enqueueSnackbar("Không tạo được link thanh toán VNPAY", { variant: "error" });
                return;
            }

            window.location.href = paymentUrl;
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data?.message || "Tạo thanh toán VNPAY thất bại", { variant: "error" });
        }
    });

    const handlePay = () => {
        if (!selectedTableId) {
            return;
        }

        if (paymentMethod === "cash") {
            markPaidMutation.mutate(selectedTableId);
            return;
        }

        if (!payableOrderId) {
            enqueueSnackbar("Không tìm thấy đơn hàng để thanh toán online", { variant: "warning" });
            return;
        }

        bankPaymentMutation.mutate(payableOrderId);
    };

    if (tablesError) {
        enqueueSnackbar("Đã xảy ra lỗi khi tải danh sách bàn!", { variant: "error" });
    }

    return (
        <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-8 py-4">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-[#f5f5f5] text-xl md:text-2xl font-bold tracking-wider">
                        Thanh toán
                    </h1>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 pb-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-3 py-2">
                    {tablesRes?.data?.data.map((table) => (
                        <button
                            key={table._id}
                            onClick={() => {
                                setSelectedTableId(table._id);
                                setSelectedOrderId(null);
                            }}
                            className={`w-full text-left hover:bg-[#2c2c2c] bg-[#262626] p-4 rounded-lg cursor-pointer ${selectedTableId === table._id ? "ring-2 ring-yellow-500" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <h1 className="text-[#f5f5f5] text-lg md:text-xl font-semibold">
                                    Bàn {table.tableNo}
                                </h1>
                                <span
                                    className={`${table.status === "Đã đặt"
                                        ? "text-green-600 bg-[#2e4a40]"
                                        : "bg-[#664a04] text-white"
                                        } px-2 py-1 rounded-lg text-xs whitespace-nowrap`}
                                >
                                    {table.status}
                                </span>
                            </div>
                            <p className="text-[#ababab] text-xs mt-3">
                                Số chỗ: <span className="text-[#f5f5f5]">{table.seats}</span>
                            </p>
                        </button>
                    ))}
                </div>

                <div className="py-4">
                    <div className="bg-[#262626] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-[#f5f5f5] text-lg font-semibold">
                                Tổng cần thanh toán
                            </h2>
                            <p className="text-[#ababab] text-sm">
                                {selectedTableId ? `Số đơn: ${orders.length}` : "Chọn bàn để xem tổng"}
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <div className="flex items-center gap-3 mb-2 flex-wrap md:justify-end">
                                <label className="flex items-center gap-2 text-sm text-[#f5f5f5]">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cash"
                                        checked={paymentMethod === "cash"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    Tiền mặt
                                </label>
                                <label className="flex items-center gap-2 text-sm text-[#f5f5f5]">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="bank"
                                        checked={paymentMethod === "bank"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    Bank (VNPAY)
                                </label>
                            </div>
                            <p className="text-[#f5f5f5] text-xl font-bold">
                                {formatVND(total)}
                            </p>
                            <button
                                onClick={handlePay}
                                disabled={
                                    !selectedTableId ||
                                    total <= 0 ||
                                    markPaidMutation.isLoading ||
                                    bankPaymentMutation.isLoading
                                }
                                className="mt-2 bg-[#F6B100] text-[#f5f5f5] rounded-lg px-6 py-2 disabled:opacity-50"
                            >
                                {paymentMethod === "cash" ? "Thanh toán tiền mặt" : "Thanh toán qua VNPAY"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BottomNav />

            {showInvoice && invoiceOrderInfo && (
                <Invoice orderInfo={invoiceOrderInfo} setShowInvoice={setShowInvoice} autoPrint />
            )}
        </section>
    );
};

export default Payment;
