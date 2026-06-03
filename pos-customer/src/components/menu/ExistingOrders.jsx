import React, { useState } from "react";
import { formatDateAndTime } from "../../utils";
import { RiDeleteBin2Fill } from "react-icons/ri";
import Modal from "../shared/Modal";

const ExistingOrders = ({ orders = [], onCancelItem }) => {
    const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: null, itemId: null, itemName: "" });

    const handleCancelClick = (orderId, itemId, itemName) => {
        setCancelModal({ isOpen: true, orderId, itemId, itemName });
    };

    const handleConfirmCancel = () => {
        if (cancelModal.orderId && cancelModal.itemId) {
            onCancelItem(cancelModal.orderId, cancelModal.itemId);
        }
        setCancelModal({ isOpen: false, orderId: null, itemId: null, itemName: "" });
    };

    const handleCloseModal = () => {
        setCancelModal({ isOpen: false, orderId: null, itemId: null, itemName: "" });
    };

    if (!orders.length) {
        return (
            <div className="px-4 py-2">
                <h1 className="text-lg text-[#e4e4e4] font-semibold tracking-wide">
                    Đơn chưa thanh toán
                </h1>
                <p className="text-[#ababab] text-sm mt-3">Chưa có món nào.</p>
            </div>
        );
    }

    return (
        <>
            <div className="px-4 py-2">
                <h1 className="text-lg text-[#e4e4e4] font-semibold tracking-wide">
                    Đơn chưa thanh toán
                </h1>
                <div className="mt-3 pr-2">
                    {orders.map((order) => (
                        <div key={order._id} className="mb-3">
                            <p className="text-xs text-[#ababab]">
                                {formatDateAndTime(order.createdAt || order.orderDate)}
                            </p>
                            <div className="mt-2 space-y-2">
                                {order.items
                                    .filter((item) => !item.cancelled_at && item.status !== 'cancelled')
                                    .map((item) => (
                                        <div
                                            key={item._id}
                                            className="bg-[#1f1f1f] rounded-lg px-3 py-3 flex items-center justify-between"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[#e4e4e4] text-sm font-semibold">
                                                    {item.name} x{item.quantity}
                                                </span>
                                                <span className="text-[#8c8c8c] text-xs">
                                                    {formatDateAndTime(item.added_at || order.createdAt || order.orderDate)}
                                                </span>
                                                {item.notes ? (
                                                    <span className="text-[#bdbdbd] text-xs mt-1">
                                                        Ghi chú: {item.notes}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <button
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

            <Modal isOpen={cancelModal.isOpen} onClose={handleCloseModal} title="Xác nhận hủy món">
                <div className="mb-4">
                    <p className="text-[#e4e4e4] text-sm">
                        Bạn có chắc chắn muốn hủy món <span className="font-bold text-red-400">{cancelModal.itemName}</span>?
                    </p>
                    <p className="text-[#ababab] text-xs mt-2">
                        Món này sẽ được đánh dấu là đã hủy và thông báo sẽ được gửi đến bếp.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleCloseModal}
                        className="flex-1 bg-[#2a2a2a] text-[#e4e4e4] rounded-lg py-2 hover:bg-[#3a3a3a]"
                    >
                        Không
                    </button>
                    <button
                        onClick={handleConfirmCancel}
                        className="flex-1 bg-red-600 text-white rounded-lg py-2 hover:bg-red-700"
                    >
                        Xác nhận hủy
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default ExistingOrders;
