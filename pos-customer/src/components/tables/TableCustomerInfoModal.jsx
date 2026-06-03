import React, { useState } from "react";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCustomer, updateTable } from "../../redux/slices/customerSessionSlice";
import { customerReserveTable } from "../../https";

const TableCustomerInfoModal = ({ tableId, tableNo, onClose }) => {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [guests, setGuests] = useState("");
    const [errors, setErrors] = useState({});

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const validateForm = () => {
        const nextErrors = {};

        if (!name.trim()) {
            nextErrors.name = "Tên khách hàng không được bỏ trống";
        }

        if (!guests || Number(guests) <= 0) {
            nextErrors.guests = "Không được bỏ trống số người";
        }

        if (phone && !/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) {
            nextErrors.phone = "Số điện thoại không hợp lệ";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;

        try {
            await customerReserveTable(tableId);
        } catch (error) {
            const message = error?.response?.data?.message || "Không thể đặt bàn này. Vui lòng thử bàn khác.";
            enqueueSnackbar(message, { variant: "error" });
            return;
        }

        dispatch(
            setCustomer({
                name: name.trim(),
                phone: phone.trim() || "N/A",
                guests: Number(guests),
            })
        );

        dispatch(updateTable({ table: { tableId, tableNo } }));

        enqueueSnackbar("Đã lưu thông tin khách hàng", { variant: "success" });
        navigate(`/menu/${tableId}`, { state: { tableNo } });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="w-[450px] rounded-lg bg-[#262626] p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-[#f5f5f5]">Thông tin khách hàng - Bàn {tableNo}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-[#f5f5f5]">Tên khách hàng *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => {
                                setName(event.target.value);
                                if (errors.name) setErrors({ ...errors, name: "" });
                            }}
                            placeholder="Nhập tên khách hàng"
                            className="w-full rounded-lg border border-gray-600 bg-[#1a1a1a] px-4 py-2 text-[#f5f5f5] outline-none"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-[#f5f5f5]">Số điện thoại</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) => {
                                setPhone(event.target.value);
                                if (errors.phone) setErrors({ ...errors, phone: "" });
                            }}
                            placeholder="Nhập số điện thoại (tùy chọn)"
                            className="w-full rounded-lg border border-gray-600 bg-[#1a1a1a] px-4 py-2 text-[#f5f5f5] outline-none"
                        />
                        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-[#f5f5f5]">Số người *</label>
                        <input
                            type="number"
                            value={guests}
                            onChange={(event) => {
                                setGuests(event.target.value);
                                if (errors.guests) setErrors({ ...errors, guests: "" });
                            }}
                            placeholder="Nhập số người"
                            min="1"
                            max="100"
                            className="w-full rounded-lg border border-gray-600 bg-[#1a1a1a] px-4 py-2 text-[#f5f5f5] outline-none"
                        />
                        {errors.guests && <p className="mt-1 text-sm text-red-500">{errors.guests}</p>}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg bg-[#333] px-4 py-2 font-semibold text-[#f5f5f5] hover:bg-[#444]"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-lg bg-[#f6b100] px-4 py-2 font-semibold text-[#1f1f1f] hover:bg-[#e6a200]"
                        >
                            Tiếp tục
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TableCustomerInfoModal;