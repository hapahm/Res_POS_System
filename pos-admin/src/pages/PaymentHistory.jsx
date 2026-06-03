import React, { useEffect, useMemo, useState } from "react";
import BackButton from "../components/shared/BackButton";
import BottomNav from "../components/shared/BottomNav";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getPaymentHistory } from "../https";

const formatCurrencyVnd = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
};

const formatDateTimeVi = (date) => {
    if (!date) return "--";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date(date));
};

const PaymentHistory = () => {
    const [filters, setFilters] = useState({
        date: "",
        table: "",
        paymentMethod: "",
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    useEffect(() => {
        document.title = "POS | Lịch sử thanh toán";
    }, []);

    const { data: resData, isError, error } = useQuery({
        queryKey: ["paymentHistory", filters.date, filters.table, filters.paymentMethod],
        queryFn: async () =>
            getPaymentHistory({
                date: filters.date,
                table: filters.table,
                paymentMethod: filters.paymentMethod,
            }),
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (isError) {
            enqueueSnackbar(
                error?.response?.data?.message || "Đã xảy ra lỗi khi tải lịch sử thanh toán!",
                { variant: "error" }
            );
        }
    }, [isError, error]);

    const rawRows = resData?.data?.data || [];

    const tableOptions = useMemo(() => {
        return [...new Set(rawRows.map((item) => `${item.tableNo || "--"}`))].sort((a, b) => Number(a) - Number(b));
    }, [rawRows]);

    const rows = useMemo(() => {
        if (!searchKeyword.trim()) return rawRows;

        const key = searchKeyword.toLowerCase().trim();
        return rawRows.filter((item) => {
            return (
                `${item.orderId || ""}`.toLowerCase().includes(key) ||
                `${item.tableNo || ""}`.toLowerCase().includes(key) ||
                `${item.staff || ""}`.toLowerCase().includes(key) ||
                `${item.paymentMethod || ""}`.toLowerCase().includes(key)
            );
        });
    }, [rawRows, searchKeyword]);

    return (
        <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] overflow-hidden">
            <div className="flex items-center justify-between px-10 py-4">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">Lịch sử thanh toán</h1>
                </div>
            </div>

            <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4 gap-4">
                    <h2 className="text-[#f5f5f5] text-xl font-semibold">Lịch sử thanh toán</h2>

                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        <div className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 w-[360px]">
                            <span className="text-[#ababab] text-sm">Tìm</span>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") setSearchKeyword(searchTerm);
                                }}
                                placeholder="Tìm mã đơn, bàn, nhân viên, phương thức..."
                                className="w-full bg-transparent outline-none text-[#f5f5f5] placeholder:text-[#7a7a7a] text-sm"
                            />
                            <button
                                onClick={() => setSearchKeyword(searchTerm)}
                                className="bg-[#f6b100] text-[#1f1f1f] font-semibold px-4 py-1.5 rounded-lg whitespace-nowrap"
                            >
                                Tìm
                            </button>
                        </div>

                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                            className="bg-[#1a1a1a] border border-gray-700 text-[#f5f5f5] rounded-lg px-3 py-2 text-sm"
                        />

                        <select
                            value={filters.table}
                            onChange={(e) => setFilters((prev) => ({ ...prev, table: e.target.value }))}
                            className="bg-[#1a1a1a] border border-gray-700 text-[#f5f5f5] rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">Tất cả bàn</option>
                            {tableOptions.map((tableNo) => (
                                <option key={tableNo} value={tableNo}>
                                    Bàn {tableNo}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.paymentMethod}
                            onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                            className="bg-[#1a1a1a] border border-gray-700 text-[#f5f5f5] rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="">Tất cả phương thức</option>
                            <option value="CASH">Tiền mặt</option>
                            <option value="VNPAY">VNPAY</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[#f5f5f5]">
                        <thead className="bg-[#333] text-[#ababab]">
                            <tr>
                                <th className="p-3">Mã đơn</th>
                                <th className="p-3">Bàn</th>
                                <th className="p-3">Tổng tiền</th>
                                <th className="p-3">Phương thức</th>
                                <th className="p-3">Ngày thanh toán</th>
                                <th className="p-3">Nhân viên</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length > 0 ? (
                                rows.map((item) => (
                                    <tr key={item._id} className="border-b border-gray-600 hover:bg-[#333]">
                                        <td className="p-3">#{item.orderId}</td>
                                        <td className="p-3">Bàn {item.tableNo}</td>
                                        <td className="p-3 font-semibold text-[#f6b100]">{formatCurrencyVnd(item.totalAmount)}</td>
                                        <td className="p-3">{item.paymentMethod === "CASH" ? "Tiền mặt" : item.paymentMethod}</td>
                                        <td className="p-3">{formatDateTimeVi(item.paymentDate)}</td>
                                        <td className="p-3">{item.staff || "Không rõ"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td className="p-4 text-gray-400" colSpan={6}>
                                        Không có dữ liệu thanh toán hoàn tất
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <BottomNav />
        </section>
    );
};

export default PaymentHistory;
