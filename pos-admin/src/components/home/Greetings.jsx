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

  // Hàm format ngày theo dạng Việt Nam
  const formatDate = (date) => {
    const formatter = new Intl.DateTimeFormat("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Ho_Chi_Minh"
    });
    return formatter.format(date);
  };

  // Hàm format giờ theo dạng HH:mm:ss (múi giờ Việt Nam)
  const formatTime = (date) => {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh"
    };
    return new Intl.DateTimeFormat("vi-VN", options).format(date);
  };

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
