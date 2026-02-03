import React, { useState } from "react";
import { motion } from "framer-motion";
import { IoMdClose } from "react-icons/io";
import { useMutation } from "@tanstack/react-query";
import { addTable } from "../../https";
import { enqueueSnackbar } from "notistack"

const Modal = ({ setIsTableModalOpen }) => {

  // State lưu dữ liệu bàn đang nhập trong form
  const [tableData, setTableData] = useState({
    tableNo: "",   // Số bàn
    seats: "",    // Số ghế
  });

  // Hàm xử lý khi người dùng nhập dữ liệu vào input
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Cập nhật đúng field theo name (tableNo / seats)
    setTableData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Hàm xử lý khi submit form
  const handleSubmit = (e) => {
    e.preventDefault(); // Ngăn reload trang
    console.log(tableData);

    // Gửi dữ liệu lên server thông qua React Query
    tableMutation.mutate(tableData);
  };

  // Đóng modal khi bấm nút X
  const handleCloseModal = () => {
    setIsTableModalOpen(false);
  };

  // React Query mutation dùng để gọi API thêm bàn
  const tableMutation = useMutation({
    mutationFn: (reqData) => addTable(reqData),

    // Khi thêm bàn thành công
    onSuccess: (res) => {
      setIsTableModalOpen(false); // Đóng modal
      const { data } = res;
      enqueueSnackbar(data.message, { variant: "success" }) // Thông báo thành công
    },

    // Khi xảy ra lỗi
    onError: (error) => {
      const { data } = error.response;
      enqueueSnackbar(data.message, { variant: "error" }) // Thông báo lỗi
      console.log(error);
    }
  })

  return (
    // Lớp overlay che toàn màn hình
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      {/* Khung modal với animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}   // Trạng thái ban đầu
        animate={{ opacity: 1, scale: 1 }}     // Khi hiển thị
        exit={{ opacity: 0, scale: 0.9 }}       // Khi đóng
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-[#262626] p-6 rounded-lg shadow-lg w-96"
      >

        {/* ===== Header Modal ===== */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[#f5f5f5] text-xl font-semibold">
            Thêm bàn mới
          </h2>

          {/* Nút đóng modal */}
          <button
            onClick={handleCloseModal}
            className="text-[#f5f5f5] hover:text-red-500"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* ===== Nội dung Modal ===== */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-10">

          {/* Nhập số bàn */}
          <div>
            <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
              Số bàn
            </label>

            <div className="flex items-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
              <input
                type="number"
                name="tableNo"
                value={tableData.tableNo}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Nhập số ghế */}
          <div>
            <label className="block text-[#ababab] mb-2 mt-3 text-sm font-medium">
              Số lượng ghế
            </label>

            <div className="flex items-center rounded-lg p-5 px-4 bg-[#1f1f1f]">
              <input
                type="number"
                name="seats"
                value={tableData.seats}
                onChange={handleInputChange}
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Nút submit */}
          <button
            type="submit"
            className="w-full rounded-lg mt-10 mb-6 py-3 text-lg bg-yellow-400 text-gray-900 font-bold"
          >
            Thêm bàn
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Modal;
