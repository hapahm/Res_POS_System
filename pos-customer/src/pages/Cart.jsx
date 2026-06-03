import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import CustomerHeader from "../components/customer/CustomerHeader";
import Footer from "../components/customer/Footer";
import {
    decreaseQuantity,
    getCartSubtotal,
    increaseQuantity,
    removeAllItems,
    removeItem,
    updateItemNotes,
} from "../redux/slices/cartSlice";
import { createCustomerOrder, createGuestCustomerOrder } from "../services/customerOrder.service";
import { customerCheckInTable, getCustomerTables } from "../https";
import { formatCurrency, resolveAssetUrl } from "../utils";
import { updateTable } from "../redux/slices/customerSessionSlice";

const Cart = ({ qrMode = false }) => {
    const cartItems = useSelector((state) => state.cart || []);
    const customer = useSelector((state) => state.customer || {});
    const user = useSelector((state) => state.user || {});
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customerName, setCustomerName] = useState(customer?.customerName || user?.name || "");
    const [customerPhone, setCustomerPhone] = useState(customer?.customerPhone || user?.phone || "");
    const [guests, setGuests] = useState(Number(customer?.guests || 1));

    useEffect(() => {
        if (qrMode) return;
        setCustomerName((prev) => prev || user?.name || "");
        setCustomerPhone((prev) => prev || user?.phone || "");
        setGuests((prev) => Number(prev) > 0 ? prev : 1);
    }, [qrMode, user?.name, user?.phone]);

    const { data: tablesResponse } = useQuery({
        queryKey: ["customer", "tables", "for-cart", qrMode],
        queryFn: async () => await getCustomerTables(),
        placeholderData: keepPreviousData,
        enabled: Boolean(user?.isAuth) && !qrMode,
    });

    const availableTables = useMemo(() => {
        const source = tablesResponse?.data?.data || [];
        const freeStatus = ["trống", "available", "free", "trong"];
        const freeTables = source.filter((table) => freeStatus.includes(`${table?.status || ""}`.trim().toLowerCase()));

        const selectedTableFromState = source.find(
            (table) => `${table?._id}` === `${customer?.table?.tableId || customer?.table?._id || customer?.table || ""}`
        );

        if (!source.length && customer?.table?.tableId) {
            return [{
                _id: customer.table.tableId,
                tableNo: customer?.table?.tableNo || "--",
                status: "Đang chọn",
            }];
        }

        if (
            selectedTableFromState &&
            !freeTables.some((table) => `${table?._id}` === `${selectedTableFromState?._id}`)
        ) {
            return [selectedTableFromState, ...freeTables];
        }

        return freeTables;
    }, [tablesResponse, customer?.table]);

    const totalQuantity = useMemo(
        () => cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
        [cartItems]
    );

    const subtotal = useSelector(getCartSubtotal);
    const taxRate = 5.25;
    const tax = useMemo(() => (subtotal * taxRate) / 100, [subtotal]);
    const totalAmount = useMemo(() => subtotal + tax, [subtotal, tax]);

    const selectedTableId = customer?.table?.tableId || customer?.table?._id || customer?.table || "";

    const handleSelectTable = (tableId) => {
        const selectedTable = availableTables.find((table) => `${table._id}` === `${tableId}`);
        dispatch(
            updateTable({
                table: selectedTable
                    ? { tableId: selectedTable._id, tableNo: selectedTable.tableNo }
                    : null,
            })
        );
    };

    const validateBeforeSubmit = () => {
        if (!qrMode && !user?.isAuth) {
            enqueueSnackbar("Vui lòng đăng nhập để đặt món online.", { variant: "warning" });
            navigate("/auth");
            return false;
        }

        if (!cartItems.length) {
            enqueueSnackbar("Giỏ hàng đang trống.", { variant: "warning" });
            return false;
        }

        const hasInvalidQuantity = cartItems.some((item) => Number(item.quantity) <= 0);
        if (hasInvalidQuantity) {
            enqueueSnackbar("Số lượng món phải lớn hơn 0.", { variant: "error" });
            return false;
        }

        if (!selectedTableId) {
            enqueueSnackbar(
                qrMode
                    ? "Không xác định được bàn. Vui lòng quét lại QR tại bàn để đặt món."
                    : "Vui lòng chọn bàn trước khi đặt món online.",
                { variant: "error" }
            );
            return false;
        }

        if (!qrMode) {
            if (!`${customerName}`.trim()) {
                enqueueSnackbar("Vui lòng nhập tên khách hàng.", { variant: "error" });
                return false;
            }

            const rawPhone = `${customerPhone || ""}`.trim();
            const cleanedPhone = rawPhone.replace(/\D/g, "");
            const isOptionalPhone = !rawPhone || rawPhone.toUpperCase() === "N/A";

            if (!isOptionalPhone && (cleanedPhone.length < 9 || cleanedPhone.length > 11)) {
                enqueueSnackbar("Số điện thoại khách hàng không hợp lệ.", { variant: "error" });
                return false;
            }

            if (!Number.isFinite(Number(guests)) || Number(guests) <= 0) {
                enqueueSnackbar("Số lượng khách không hợp lệ.", { variant: "error" });
                return false;
            }
        }

        return true;
    };

    const handleSubmitOrder = async () => {
        if (!validateBeforeSubmit()) return;

        const payload = {
            orderSource: "customer_app",
            table: selectedTableId,
            customerDetails: {
                name: qrMode ? "" : `${customerName}`.trim(),
                phone: qrMode ? "" : `${customerPhone}`.trim() || "N/A",
                guests: qrMode ? 1 : Number(guests || 1),
            },
            items: cartItems.map((item) => ({
                name: item.name,
                pricePerQuantity: Number(item.pricePerQuantity) || 0,
                quantity: Number(item.quantity) || 1,
                price: (Number(item.pricePerQuantity) || 0) * (Number(item.quantity) || 1),
                notes: item.notes || "",
                dishId: item.dishId || item.id,
            })),
            bills: {
                total: subtotal,
                tax,
                totalWithTax: totalAmount,
            },
        };

        try {
            setIsSubmitting(true);

            let response = null;
            if (qrMode && !user?.isAuth) {
                response = await createGuestCustomerOrder(payload);
            } else {
                await customerCheckInTable(selectedTableId);
                response = await createCustomerOrder(payload);
            }
            dispatch(removeAllItems());
            enqueueSnackbar("Đặt món thành công", { variant: "success" });
            if (qrMode && !user?.isAuth) {
                navigate("/qr-order");
            } else {
                navigate("/orders", {
                    state: {
                        createdOrderId: response?.data?._id,
                    },
                });
            }
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || "Không thể đặt món, vui lòng thử lại.";
            enqueueSnackbar(message, { variant: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 text-slate-800">
            <CustomerHeader />

            <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-5 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Giỏ hàng</h1>
                    <span className="text-sm text-slate-500">{totalQuantity} món</span>
                </div>

                {cartItems.length === 0 ? (
                    <div className="bg-white p-8 text-center shadow-sm">
                        <p className="text-sm text-slate-500">Giỏ hàng đang trống.</p>
                        <button
                            className="mt-4 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white"
                            onClick={() => navigate(qrMode ? "/qr-order" : "/thuc-don")}
                        >
                            Tiếp tục chọn món
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cartItems.map((item) => (
                            <article key={item.id} className="bg-white p-4 shadow-sm sm:p-5">
                                <div className="grid gap-4 md:grid-cols-[130px_1fr]">
                                    <div className="h-24 w-full overflow-hidden bg-slate-100">
                                        {item.imageUrl ? (
                                            <img src={resolveAssetUrl(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="grid h-full w-full place-items-center text-xs text-slate-500">Image</div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-800">{item.name}</h3>
                                                <p className="mt-2 text-sm font-semibold text-orange-500">{formatCurrency((Number(item.pricePerQuantity) || 0) * (Number(item.quantity) || 1))}</p>
                                            </div>

                                            <button
                                                className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                                                onClick={() => dispatch(removeItem(item.dishId || item.id))}
                                            >
                                                Xóa
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                className="h-8 w-8 bg-slate-100 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
                                                onClick={() => dispatch(decreaseQuantity(item.dishId || item.id))}
                                            >
                                                -
                                            </button>
                                            <span className="min-w-6 text-center text-sm font-semibold">{item.quantity || 1}</span>
                                            <button
                                                className="h-8 w-8 bg-slate-100 text-base font-semibold text-slate-700 transition hover:bg-slate-200"
                                                onClick={() => dispatch(increaseQuantity(item.dishId || item.id))}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="w-full">
                                            <textarea
                                                value={item.notes || ""}
                                                onChange={(event) =>
                                                    dispatch(
                                                        updateItemNotes({
                                                            id: item.dishId || item.id,
                                                            notes: event.target.value,
                                                        })
                                                    )
                                                }
                                                placeholder="Ghi chú cho món này (ít cay, không hành... )"
                                                className="h-20 w-full bg-slate-50 p-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}

                        <div className="space-y-4 bg-white p-5 shadow-sm sm:p-6">
                            <div className="grid gap-3 md:grid-cols-2">
                                {!qrMode && (
                                    <>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-600">Tên khách hàng</label>
                                            <input
                                                value={customerName}
                                                onChange={(event) => setCustomerName(event.target.value)}
                                                className="w-full bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-600">Số điện thoại</label>
                                            <input
                                                value={customerPhone}
                                                onChange={(event) => setCustomerPhone(event.target.value)}
                                                className="w-full bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-600">Số khách</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={guests}
                                                onChange={(event) => setGuests(event.target.value)}
                                                className="w-full bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-slate-600">
                                        {qrMode ? "Bàn đang gọi món" : "Chọn bàn"}
                                    </label>
                                    {qrMode ? (
                                        <div className="w-full bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                                            {customer?.table?.tableNo
                                                ? `Bàn ${customer.table.tableNo}`
                                                : "Chưa nhận diện bàn. Vui lòng quét lại QR tại bàn."}
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedTableId}
                                            onChange={(event) => handleSelectTable(event.target.value)}
                                            className="w-full bg-slate-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                        >
                                            <option value="">-- Chọn bàn còn trống --</option>
                                            {availableTables.map((table) => (
                                                <option key={table._id} value={table._id}>
                                                    {`Bàn ${table.tableNo} (${table.status})`}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-slate-200 pt-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Tạm tính</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span>Thuế ({taxRate}%)</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="flex items-center justify-between text-base font-semibold">
                                    <span>Tổng cộng</span>
                                    <span className="text-orange-500">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    disabled={isSubmitting}
                                    className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white ${isSubmitting ? "cursor-not-allowed bg-slate-400" : "bg-orange-500 hover:bg-orange-600"}`}
                                    onClick={handleSubmitOrder}
                                >
                                    {isSubmitting ? "Đang đặt món..." : "Đặt món"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <Footer />
        </main>
    );
};

export default Cart;