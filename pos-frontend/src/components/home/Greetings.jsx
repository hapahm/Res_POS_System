import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const Greetings = () => {

  // Lấy thông tin người dùng từ Redux Store
  const userData = useSelector(state => state.user);

  // State lưu thời gian hiện tại (để cập nhật đồng hồ realtime)
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    // Tạo timer cập nhật thời gian mỗi 1 giây
    const timer = setInterval(() => setDateTime(new Date()), 1000);

    // Clear timer khi component unmount để tránh leak bộ nhớ
    return () => clearInterval(timer);
  }, []);

  // Hàm format ngày theo dạng: Tháng Ngày, Năm (VD: Tháng 1 22, 2026)
  const formatDate = (date) => {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];

    return `${months[date.getMonth()]} ${String(
      date.getDate()
    ).padStart(2, '0')}, ${date.getFullYear()}`;
  };

  // Hàm format giờ theo dạng HH:mm:ss
  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;

  return (
    <div className="flex justify-between items-center px-8 mt-5">

      {/* Khu vực lời chào */}
      <div>
        <h1 className="text-[#f5f5f5] text-2xl font-semibold tracking-wide">
          Chào buổi sáng, {userData.name || "NGƯỜI DÙNG"}
        </h1>
        <p className="text-[#ababab] text-sm">
          Hãy phục vụ khách hàng với chất lượng tốt nhất 😀
        </p>
      </div>

      {/* Khu vực hiển thị thời gian */}
      <div>
        <h1 className="text-[#f5f5f5] text-3xl font-bold tracking-wide w-[130px]">
          {formatTime(dateTime)}
        </h1>
        <p className="text-[#ababab] text-sm">
          {formatDate(dateTime)}
        </p>
      </div>

    </div>
  );
};

export default Greetings;
