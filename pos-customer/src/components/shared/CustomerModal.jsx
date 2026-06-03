import React from "react";
import { motion } from "framer-motion";

const CustomerModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="mx-4 w-full max-w-lg rounded-lg bg-[#1a1a1a] shadow-lg"
            >
                <div className="flex items-center justify-between border-b border-b-[#333] px-6 py-4">
                    <h2 className="text-xl font-semibold text-[#f5f5f5]">{title}</h2>
                    <button
                        type="button"
                        className="text-2xl text-gray-500 hover:text-gray-300"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </motion.div>
        </div>
    );
};

export default CustomerModal;