import React, { useState } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { formatDateAndTime } from "../../utils";
import CustomerModal from "../shared/CustomerModal";

const CustomerExistingOrders = ({ orders = [], onCancelItem }) => {
    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        orderId: null,
        itemId: null,
        itemName: "",
    });

    const handleCancelClick = (orderId, itemId, itemName) => {
        setCancelModal({ isOpen: true, orderId, itemId, itemName });
    };

    const resetCancelModal = () => {
        setCancelModal({ isOpen: false, orderId: null, itemId: null, itemName: "" });
    };

    const handleConfirmCancel = () => {
        if (cancelModal.orderId && cancelModal.itemId) {
            onCancelItem(cancelModal.orderId, cancelModal.itemId);
        }
        resetCancelModal();
    };

    if (!orders.length) {
        return (
            <div className="px-4 py-2">
                <h1 className="text-lg font-semibold tracking-wide text-[#e4e4e4]">Đơn chưa thanh toán</h1>
                <p className="mt-3 text-sm text-[#ababab]">Chưa có món nào.</p>
            </div>
        );
    }

    return (
        <>
            <div className="px-4 py-2">
                <h1 className="text-lg font-semibold tracking-wide text-[#e4e4e4]">Đơn chưa thanh toán</h1>
                <div className="mt-3 pr-2">
                    {orders.map((order) => (
                        <div key={order._id} className="mb-3">
                            <p className="text-xs text-[#ababab]">
                                {formatDateAndTime(order.createdAt || order.orderDate)}
                            </p>
                            <div className="mt-2 space-y-2">
                                {order.items
                                    .filter((item) => !item.cancelled_at && item.status !== "cancelled")
                                    .map((item) => (
                                        <div
                                            key={item._id}
                                            className="flex items-center justify-between rounded-lg bg-[#1f1f1f] px-3 py-3"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-[#e4e4e4]">
                                                    {item.name} x{item.quantity}
                                                </span>
                                                <span className="text-xs text-[#8c8c8c]">
                                                    {formatDateAndTime(item.added_at || order.createdAt || order.orderDate)}
                                                </span>
                                                {item.notes ? (
                                                    <span className="mt-1 text-xs text-[#bdbdbd]">Ghi chú: {item.notes}</span>
                                                ) : null}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCancelClick(order._id, item._id, item.name)}
                                                className="text-[#ababab] hover:text-red-400"
                                                title="Hủy món"
                                            >
                                                <RiDeleteBin2Fill size={18} />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CustomerModal isOpen={cancelModal.isOpen} onClose={resetCancelModal} title="Xác nhận hủy món">
                <div className="mb-4">
                    <p className="text-sm text-[#e4e4e4]">
                        Bạn có chắc chắn muốn hủy món <span className="font-bold text-red-400">{cancelModal.itemName}</span>?
                    </p>
                    <p className="mt-2 text-xs text-[#ababab]">
                        Món này sẽ được đánh dấu là đã hủy và thông báo sẽ được gửi đến bếp.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={resetCancelModal}
                        className="flex-1 rounded-lg bg-[#2a2a2a] py-2 text-[#e4e4e4] hover:bg-[#3a3a3a]"
                    >
                        Không
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmCancel}
                        className="flex-1 rounded-lg bg-red-600 py-2 text-white hover:bg-red-700"
                    >
                        Xác nhận hủy
                    </button>
                </div>
            </CustomerModal>
        </>
    );
};

export default CustomerExistingOrders;