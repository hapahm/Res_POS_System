import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCustomer, updateTable } from "../../redux/slices/customerSlice";
import { enqueueSnackbar } from "notistack";

const CustomerInfoModal = ({ tableId, tableNo, onClose }) => {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [guests, setGuests] = useState("");
    const [errors, setErrors] = useState({});

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = "Tên khách hàng không được bỏ trống";
        }

        if (!guests || guests <= 0) {
            newErrors.guests = "Không được bỏ trống số người";
        }

        // Phone là optional, nhưng nếu có nhập thì validate format
        if (phone && !/^\d{10,11}$/.test(phone.replace(/\D/g, ""))) {
            newErrors.phone = "Số điện thoại không hợp lệ";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Dispatch setCustomer action
        dispatch(
            setCustomer({
                name: name.trim(),
                phone: phone.trim() || "N/A",
                guests: Number(guests),
            })
        );

        // Dispatch updateTable action
        dispatch(
            updateTable({
                table: { tableId, tableNo },
            })
        );

        enqueueSnackbar("Đã lưu thông tin khách hàng", { variant: "success" });

        // Navigate to menu
        navigate(`/menu/${tableId}`, { state: { tableNo } });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-[#262626] rounded-lg p-6 w-[450px] shadow-lg">
                {/* Header */}
                <h2 className="text-[#f5f5f5] text-2xl font-bold mb-6">
                    Thông tin khách hàng - Bàn {tableNo}
                </h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tên khách hàng */}
                    <div>
                        <label className="block text-[#f5f5f5] text-sm font-semibold mb-2">
                            Tên khách hàng *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (errors.name) setErrors({ ...errors, name: "" });
                            }}
                            placeholder="Nhập tên khách hàng"
                            className="w-full bg-[#1a1a1a] border border-gray-600 text-[#f5f5f5] px-4 py-2 rounded-lg outline-none"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="block text-[#f5f5f5] text-sm font-semibold mb-2">
                            Số điện thoại
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                if (errors.phone) setErrors({ ...errors, phone: "" });
                            }}
                            placeholder="Nhập số điện thoại (tùy chọn)"
                            className="w-full bg-[#1a1a1a] border border-gray-600 text-[#f5f5f5] px-4 py-2 rounded-lg outline-none"
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                    </div>

                    {/* Số người */}
                    <div>
                        <label className="block text-[#f5f5f5] text-sm font-semibold mb-2">
                            Số người *
                        </label>
                        <input
                            type="number"
                            value={guests}
                            onChange={(e) => {
                                setGuests(e.target.value);
                                if (errors.guests) setErrors({ ...errors, guests: "" });
                            }}
                            placeholder="Nhập số người"
                            min="1"
                            max="100"
                            className="w-full bg-[#1a1a1a] border border-gray-600 text-[#f5f5f5] px-4 py-2 rounded-lg outline-none"
                        />
                        {errors.guests && (
                            <p className="text-red-500 text-sm mt-1">{errors.guests}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-[#333] text-[#f5f5f5] font-semibold px-4 py-2 rounded-lg hover:bg-[#444]"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-[#f6b100] text-[#1f1f1f] font-semibold px-4 py-2 rounded-lg hover:bg-[#e6a200]"
                        >
                            Tiếp tục
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerInfoModal;
