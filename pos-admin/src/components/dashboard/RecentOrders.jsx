import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient
} from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import {
    approveCustomerOrder,
    getOrders,
    getPendingCustomerOrders,
    rejectCustomerOrder,
    updateKitchenStatus
} from "../../https/index";

const RecentOrders = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(""); // "" = all, "paid" = đã thanh toán, "unpaid" = chưa
    const [expandedTables, setExpandedTables] = useState({});
    const [expandedPendingOrders, setExpandedPendingOrders] = useState({});

    const toggleTableItems = (tableKey) => {
        setExpandedTables((prev) => ({
            ...prev,
            [tableKey]: !prev[tableKey],
        }));
    };

    const togglePendingItems = (orderId) => {
        setExpandedPendingOrders((prev) => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    const formatDateTimeVi = (date) => {
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

    const formatCurrencyVnd = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(Number(amount) || 0);
    };

    const getPaymentStatusLabel = (paymentStatus) => {
        const statusMap = {
            pending: { text: "Chờ thanh toán", className: "text-yellow-400", status: "pending" },
            paid: { text: "Đã thanh toán", className: "text-green-400", status: "paid" },
            failed: { text: "Thanh toán thất bại", className: "text-red-400", status: "failed" },
            expired: { text: "Hết hạn thanh toán", className: "text-orange-400", status: "expired" },
            refunded: { text: "Đã hoàn tiền", className: "text-sky-300", status: "refunded" },
            mixed: { text: "Nhiều trạng thái", className: "text-blue-300", status: "mixed" },
        };

        return statusMap[paymentStatus] || statusMap.pending;
    };

    const getResolvedPaymentStatus = (order) => {
        if (order?.paymentGatewayStatus) {
            return order.paymentGatewayStatus;
        }

        return order?.paymentStatus === "paid" ? "paid" : "pending";
    };

    const handleNavigateToPayment = ({ tableId, orderId }) => {
        if (!tableId) {
            return;
        }

        const params = new URLSearchParams({ tableId, from: "dashboard" });
        if (orderId) {
            params.set("orderId", orderId);
        }

        navigate(`/payment?${params.toString()}`);
    };

    const getKitchenStatusLabel = (kitchenStatus) => {
        const statusMap = {
            pending: { text: "Đang chờ", className: "text-yellow-500" },
            preparing: { text: "Đang chế biến", className: "text-blue-400" },
            completed: { text: "Hoàn thành", className: "text-green-500" },
            cancelled: { text: "Đã hủy", className: "text-red-500" },
            mixed: { text: "Nhiều trạng thái", className: "text-gray-300" },
        };

        return statusMap[kitchenStatus] || statusMap.pending;
    };

    const handleSearch = () => {
        setSearchKeyword(searchTerm.trim());
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const queryClient = useQueryClient();

    const handleStatusChange = ({ orderIds, kitchenStatus }) => {
        kitchenStatusUpdateMutation.mutate({ orderIds, kitchenStatus });
    };

    const kitchenStatusUpdateMutation = useMutation({
        mutationFn: async ({ orderIds, kitchenStatus }) => {
            await Promise.all(
                orderIds.map((orderId) => updateKitchenStatus({ orderId, kitchenStatus }))
            );
        },
        onSuccess: () => {
            enqueueSnackbar("Cập nhật trạng thái bếp thành công!", {
                variant: "success",
            });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: () => {
            enqueueSnackbar("Cập nhật trạng thái bếp thất bại!", {
                variant: "error",
            });
        },
    });

    const { data: resData, isError } = useQuery({
        queryKey: ["orders", paymentStatusFilter],
        queryFn: async () => {
            return await getOrders("", paymentStatusFilter);
        },
        placeholderData: keepPreviousData,
    });

    const { data: pendingApprovalsRes } = useQuery({
        queryKey: ["pendingCustomerOrders"],
        queryFn: async () => await getPendingCustomerOrders(),
        placeholderData: keepPreviousData,
    });

    const approveOrderMutation = useMutation({
        mutationFn: async (orderId) => await approveCustomerOrder(orderId),
        onSuccess: (response) => {
            enqueueSnackbar(response?.data?.message || "Duyệt đơn thành công", { variant: "success" });
            queryClient.invalidateQueries({ queryKey: ["pendingCustomerOrders"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data?.message || "Không thể duyệt đơn", { variant: "error" });
        },
    });

    const rejectOrderMutation = useMutation({
        mutationFn: async (orderId) => await rejectCustomerOrder(orderId),
        onSuccess: (response) => {
            enqueueSnackbar(response?.data?.message || "Đã từ chối đơn", { variant: "success" });
            queryClient.invalidateQueries({ queryKey: ["pendingCustomerOrders"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (error) => {
            enqueueSnackbar(error?.response?.data?.message || "Không thể từ chối đơn", { variant: "error" });
        },
    });

    if (isError) {
        enqueueSnackbar("Đã xảy ra lỗi khi tải dữ liệu!", { variant: "error" });
    }

    const normalizeText = (value = "") => {
        return `${value}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    };

    const normalizedKeyword = normalizeText(searchKeyword);

    const isWithinLast12Hours = (dateInput) => {
        if (!dateInput) return false;
        const orderTime = new Date(dateInput).getTime();
        if (Number.isNaN(orderTime)) return false;

        const twelveHoursMs = 12 * 60 * 60 * 1000;
        return Date.now() - orderTime <= twelveHoursMs;
    };

    const openOrders = (resData?.data?.data || [])
        .filter((order) => {
            const sourceTime = order?.orderDate || order?.createdAt;
            return isWithinLast12Hours(sourceTime);
        })
        .filter((order) => `${order?.orderStatus || ""}` === "OPEN")
        .filter((order) => {
            if (!normalizedKeyword) return true;

            const customerName = normalizeText(order?.customerDetails?.name || "");
            const customerPhone = normalizeText(order?.customerDetails?.phone || "");
            const tableNo = normalizeText(`${order?.table?.tableNo || ""}`);
            const orderCode = normalizeText(`${Math.floor(new Date(order?.orderDate || order?.createdAt || Date.now()).getTime())}`);
            const itemNames = normalizeText((order?.items || []).map((item) => item?.name || "").join(" "));

            let matchesPrice = false;
            if (/^\d+(-\d+)?$/.test(normalizedKeyword)) {
                const amount = Number(order?.bills?.totalWithTax || 0);
                if (normalizedKeyword.includes("-")) {
                    const [minPrice, maxPrice] = normalizedKeyword.split("-").map(Number);
                    matchesPrice = amount >= minPrice && amount <= maxPrice;
                } else {
                    matchesPrice = `${amount}`.includes(normalizedKeyword);
                }
            }

            let matchesDate = false;
            if (/^\d{2}\/\d{2}(\/\d{4})?$/.test(normalizedKeyword)) {
                const orderDate = new Date(order?.orderDate || order?.createdAt || Date.now());
                const day = String(orderDate.getDate()).padStart(2, "0");
                const month = String(orderDate.getMonth() + 1).padStart(2, "0");
                const year = orderDate.getFullYear();
                matchesDate = normalizedKeyword === `${day}/${month}` || normalizedKeyword === `${day}/${month}/${year}`;
            }

            return (
                customerName.includes(normalizedKeyword) ||
                customerPhone.includes(normalizedKeyword) ||
                tableNo.includes(normalizedKeyword) ||
                orderCode.includes(normalizedKeyword) ||
                itemNames.includes(normalizedKeyword) ||
                matchesPrice ||
                matchesDate
            );
        });

    const pendingApprovals = pendingApprovalsRes?.data?.data || [];

    const groupedTables = Object.values(
        openOrders.reduce((acc, order) => {
            const tableNo = order?.table?.tableNo ?? "--";
            const tableKey = `${tableNo}`;

            if (!acc[tableKey]) {
                acc[tableKey] = {
                    tableKey,
                    tableNo,
                    tableId: order?.table?._id || null,
                    orders: [],
                };
            }

            // Cập nhật tableId nếu chưa có (lấy tableId hợp lệ đầu tiên)
            if (!acc[tableKey].tableId && order?.table?._id) {
                acc[tableKey].tableId = order.table._id;
            }

            acc[tableKey].orders.push(order);
            return acc;
        }, {})
    ).sort((a, b) => {
        const tableA = Number(a.tableNo) || 0;
        const tableB = Number(b.tableNo) || 0;
        return tableA - tableB;
    });

    return (
        <div className="container mx-auto bg-[#262626] p-4 rounded-lg">
            <div className="mb-6 rounded-lg border border-yellow-600/40 bg-[#1f1f1f] p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-yellow-400">Đơn khách chờ duyệt</h3>
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300">
                        {pendingApprovals.length} đơn
                    </span>
                </div>

                {pendingApprovals.length === 0 ? (
                    <p className="text-sm text-gray-400">Không có đơn chờ duyệt.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[#f5f5f5]">
                            <thead className="bg-[#333] text-[#ababab]">
                                <tr>
                                    <th className="p-3">Bàn</th>
                                    <th className="p-3">Mã đơn</th>
                                    <th className="p-3">Số người</th>
                                    <th className="p-3">Số điện thoại</th>
                                    <th className="p-3">Danh sách món</th>
                                    <th className="p-3">Ngày & Giờ</th>
                                    <th className="p-3">Tổng tiền</th>
                                    <th className="p-3 text-center">Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {pendingApprovals.map((order) => {
                                    const isExpanded = !!expandedPendingOrders[order._id];
                                    const isApprovingCurrent = approveOrderMutation.isPending && approveOrderMutation.variables === order._id;
                                    const isRejectingCurrent = rejectOrderMutation.isPending && rejectOrderMutation.variables === order._id;
                                    const itemCount = order?.items?.length || 0;

                                    return (
                                        <React.Fragment key={order._id}>
                                            <tr className="border-b border-gray-700 hover:bg-[#2b2b2b]">
                                                <td className="p-4 font-semibold text-[#f6b100]">
                                                    Bàn {order?.table?.tableNo || "--"}
                                                </td>
                                                <td className="p-4">
                                                    #{Math.floor(new Date(order.orderDate || order.createdAt).getTime())}
                                                </td>
                                                <td className="p-4 font-semibold text-[#f6b100]">
                                                    {Number(order?.customerDetails?.guests) || 1} người
                                                </td>
                                                <td className="p-4">
                                                    {order?.customerDetails?.phone || order?.createdBy?.phone || "N/A"}
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => togglePendingItems(order._id)}
                                                        className="flex items-center gap-2 text-[#f5f5f5] hover:text-[#f6b100]"
                                                    >
                                                        {itemCount} món
                                                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    {formatDateTimeVi(order.orderDate || order.createdAt)}
                                                </td>
                                                <td className="p-4">
                                                    {formatCurrencyVnd(order?.bills?.totalWithTax || 0)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                                                            onClick={() => approveOrderMutation.mutate(order._id)}
                                                            className={`rounded-lg px-4 py-2 text-sm font-semibold ${approveOrderMutation.isPending || rejectOrderMutation.isPending
                                                                ? "cursor-not-allowed bg-gray-600 text-gray-300"
                                                                : "bg-green-600 text-white hover:bg-green-700"
                                                                }`}
                                                        >
                                                            {isApprovingCurrent ? "Đang duyệt..." : "Duyệt"}
                                                        </button>

                                                        <button
                                                            disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                                                            onClick={() => rejectOrderMutation.mutate(order._id)}
                                                            className={`rounded-lg px-4 py-2 text-sm font-semibold ${approveOrderMutation.isPending || rejectOrderMutation.isPending
                                                                ? "cursor-not-allowed bg-gray-600 text-gray-300"
                                                                : "bg-red-600 text-white hover:bg-red-700"
                                                                }`}
                                                        >
                                                            {isRejectingCurrent ? "Đang xóa..." : "Xóa"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="bg-[#1f1f1f] border-b border-gray-700">
                                                    <td colSpan={8} className="p-4">
                                                        <div className="space-y-2">
                                                            {order.items?.map((item, itemIndex) => (
                                                                <div
                                                                    key={`${order._id}-${itemIndex}`}
                                                                    className="flex items-center justify-between rounded-md bg-[#2b2b2b] px-3 py-2"
                                                                >
                                                                    <p className="text-sm text-[#f5f5f5]">{item.name}</p>
                                                                    <p className="text-sm font-semibold text-[#f6b100]">×{item.quantity}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mb-4 gap-4">
                <h2 className="text-[#f5f5f5] text-xl font-semibold">
                    Đơn hàng gần đây
                </h2>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 w-[420px]">
                        <FaSearch className="text-[#ababab]" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSearchKeyword(e.target.value.trim());
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Tìm: mã, khách, bàn, giá (100000), ngày (24/02)..."
                            className="w-full bg-transparent outline-none text-[#f5f5f5] placeholder:text-[#7a7a7a] text-sm"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-[#f6b100] text-[#1f1f1f] font-semibold px-4 py-1.5 rounded-lg whitespace-nowrap"
                        >
                            Tìm kiếm
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-1">
                        <label className="text-[#ababab] text-sm font-semibold">Thanh toán:</label>
                        <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="bg-[#262626] outline-none text-[#f5f5f5] text-sm px-2 py-1 rounded border border-gray-600"
                        >
                            <option value="" style={{ backgroundColor: "#1f1f1f", color: "#f5f5f5" }}>Tất cả</option>
                            <option value="paid" style={{ backgroundColor: "#1f1f1f", color: "#4ade80" }}>Đã thanh toán</option>
                            <option value="unpaid" style={{ backgroundColor: "#1f1f1f", color: "#fbbf24" }}>Chưa thanh toán</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-[#f5f5f5]">
                    <thead className="bg-[#333] text-[#ababab]">
                        <tr>
                            <th className="p-3">Bàn</th>
                            <th className="p-3">Mã đơn</th>
                            <th className="p-3">Số người</th>
                            <th className="p-3">Trạng thái bếp</th>
                            <th className="p-3">Danh sách món</th>
                            <th className="p-3">Ngày & Giờ</th>
                            <th className="p-3">Tổng tiền</th>
                            <th className="p-3 text-center">Trạng thái thanh toán</th>
                        </tr>
                    </thead>

                    <tbody>
                        {groupedTables.length > 0 ? (
                            groupedTables.map((tableGroup) => {
                                const isExpanded = !!expandedTables[tableGroup.tableKey];
                                const orderIds = tableGroup.orders.map((order) => order._id);

                                const allKitchenStatuses = [
                                    ...new Set(tableGroup.orders.map((order) => order.kitchenStatus || "pending"))
                                ];
                                const tableKitchenStatus = allKitchenStatuses.length === 1 ? allKitchenStatuses[0] : "mixed";

                                const allPaymentStatuses = [
                                    ...new Set(tableGroup.orders.map((order) => getResolvedPaymentStatus(order)))
                                ];
                                const tablePaymentStatus = allPaymentStatuses.length === 1
                                    ? getPaymentStatusLabel(allPaymentStatuses[0])
                                    : getPaymentStatusLabel("mixed");

                                const latestOrder = [...tableGroup.orders].sort(
                                    (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
                                )[0];

                                const totalAmount = tableGroup.orders.reduce(
                                    (sum, order) => sum + (Number(order?.bills?.totalWithTax) || 0),
                                    0
                                );

                                const totalItems = tableGroup.orders.reduce(
                                    (sum, order) => sum + (order?.items?.length || 0),
                                    0
                                );

                                const totalGuests = tableGroup.orders.reduce(
                                    (sum, order) => sum + (Number(order?.customerDetails?.guests) || 0),
                                    0
                                );

                                const orderCodes = tableGroup.orders.map((order) => `#${Math.floor(new Date(order.orderDate).getTime())}`);

                                const payableOrder = [...tableGroup.orders]
                                    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                                    .find((order) => getResolvedPaymentStatus(order) !== "paid");
                                const canNavigatePayment = tablePaymentStatus.status !== "paid" && !!tableGroup.tableId;

                                const kitchenStatusLabel = getKitchenStatusLabel(tableKitchenStatus);

                                return (
                                    <React.Fragment key={tableGroup.tableKey}>
                                        <tr className="border-b border-gray-600 hover:bg-[#333]">
                                            <td className="p-4 font-semibold text-[#f6b100]">
                                                Bàn {tableGroup.tableNo}
                                            </td>

                                            <td className="p-4">{orderCodes.join(", ")}</td>

                                            <td className="p-4 font-semibold text-[#f6b100]">{totalGuests} người</td>

                                            <td className="p-4">
                                                <select
                                                    className={`bg-[#1a1a1a] text-[#f5f5f5] border border-gray-500 p-2 rounded-lg focus:outline-none ${kitchenStatusLabel.className}`}
                                                    value={tableKitchenStatus}
                                                    onChange={(e) =>
                                                        handleStatusChange({
                                                            orderIds,
                                                            kitchenStatus: e.target.value,
                                                        })
                                                    }
                                                >
                                                    {tableKitchenStatus === "mixed" && (
                                                        <option className="text-gray-300" value="mixed" disabled>
                                                            Nhiều trạng thái
                                                        </option>
                                                    )}
                                                    <option className="text-yellow-500" value="pending">Đang chờ</option>
                                                    <option className="text-blue-400" value="preparing">Đang chế biến</option>
                                                    <option className="text-green-500" value="completed">Hoàn thành</option>
                                                    <option className="text-red-500" value="cancelled">Đã hủy</option>
                                                </select>
                                            </td>

                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleTableItems(tableGroup.tableKey)}
                                                    className="flex items-center gap-2 text-[#f5f5f5] hover:text-[#f6b100]"
                                                >
                                                    {totalItems} món
                                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                </button>
                                            </td>

                                            <td className="p-4">
                                                {latestOrder?.orderDate ? formatDateTimeVi(latestOrder.orderDate) : "--"}
                                            </td>

                                            <td className="p-4">{formatCurrencyVnd(totalAmount)}</td>

                                            <td className="p-4 text-center font-semibold">
                                                {canNavigatePayment ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleNavigateToPayment({
                                                                tableId: tableGroup.tableId,
                                                                orderId: payableOrder?._id,
                                                            })
                                                        }
                                                        className={`${tablePaymentStatus.className} hover:underline`}
                                                    >
                                                        {tablePaymentStatus.text}
                                                    </button>
                                                ) : (
                                                    <span className={tablePaymentStatus.className}>
                                                        {tablePaymentStatus.text}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-[#1f1f1f] border-b border-gray-700">
                                                <td colSpan={8} className="p-4">
                                                    <div className="space-y-2">
                                                        {tableGroup.orders.map((order) => (
                                                            <div key={order._id} className="bg-[#2b2b2b] rounded-md p-3">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <p className="text-[#f6b100] text-sm font-semibold">
                                                                        {`#${Math.floor(new Date(order.orderDate).getTime())} - ${order.customerDetails?.name || "--"}`}
                                                                    </p>
                                                                    <p className="text-[#ababab] text-xs">
                                                                        {formatDateTimeVi(order.orderDate)}
                                                                    </p>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {order.items?.map((item, itemIndex) => (
                                                                        <div
                                                                            key={`${order._id}-${itemIndex}`}
                                                                            className="flex items-center justify-between px-1"
                                                                        >
                                                                            <p className={`text-sm ${item.status === "cancelled" || item.cancelled_at ? "text-gray-400 line-through" : "text-[#f5f5f5]"}`}>
                                                                                {item.status === "cancelled" || item.cancelled_at ? "[Đã hủy] " : ""}
                                                                                {item.name}
                                                                            </p>
                                                                            <p className="text-sm font-semibold text-[#f6b100]">×{item.quantity}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <tr>
                                <td className="p-4 text-gray-400" colSpan={8}>
                                    {normalizedKeyword ? "Không tìm thấy đơn hàng mở phù hợp" : "Không có đơn hàng mở nào"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentOrders;
