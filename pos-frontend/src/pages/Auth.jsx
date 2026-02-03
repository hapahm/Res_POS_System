import React, { useEffect, useState } from "react";
// Import ảnh nền nhà hàng
import restaurant from "../assets/images/restaurant-img.jpg";
// Import logo
import logo from "../assets/images/logo.png";
// Import component đăng ký
import Register from "../components/auth/Register";
// Import component đăng nhập
import Login from "../components/auth/Login";

const Auth = () => {

  // useEffect chạy 1 lần khi component được render
  // Dùng để đổi tiêu đề của tab trình duyệt
  useEffect(() => {
    document.title = "POS | Auth"
  }, [])

  // State để kiểm tra đang hiển thị form Đăng ký hay Đăng nhập
  // false = Login | true = Register
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="flex min-h-screen w-full">

      {/* ================= LEFT SECTION - ẢNH NỀN + CÂU QUOTE ================= */}
      <div className="w-1/2 relative flex items-center justify-center bg-cover">

        {/* Ảnh nền */}
        <img
          className="w-full h-full object-cover"
          src={restaurant}
          alt="Restaurant Image"
        />

        {/* Lớp phủ màu đen để ảnh tối lại */}
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>

        {/* Quote hiển thị phía dưới ảnh */}
        <blockquote className="absolute bottom-10 px-8 mb-10 text-2xl italic text-white">
          "Phục vụ khách hàng những món ăn tốt nhất với dịch vụ nhanh chóng và thân thiện
          trong một không gian ấm cúng, để họ luôn muốn quay lại."
          <br />
          <span className="block mt-4 text-yellow-400">
            - Nhà sáng lập KChick
          </span>
        </blockquote>
      </div>

      {/* ================= RIGHT SECTION - FORM ĐĂNG NHẬP / ĐĂNG KÝ ================= */}
      <div className="w-1/2 min-h-screen bg-[#1a1a1a] p-10">

        {/* Logo + Tên nhà hàng */}
        <div className="flex flex-col items-center gap-2">
          <img
            src={logo}
            alt="KChick Logo"
            className="h-14 w-14 border-2 rounded-full p-1"
          />
          {/* Đổi tên nhà hàng */}
          <h1 className="text-lg font-semibold text-[#f5f5f5] tracking-wide">
            KChick
          </h1>
        </div>

        {/* Tiêu đề form */}
        <h2 className="text-4xl text-center mt-10 font-semibold text-yellow-400 mb-10">
          {isRegister
            ? "Hệ thống quản lý nhà hàng - Đăng ký"
            : "Hệ thống quản lý nhà hàng - Đăng nhập"}
        </h2>

        {/* Hiển thị component Login hoặc Register tùy theo state */}
        {isRegister
          ? <Register setIsRegister={setIsRegister} />
          : <Login />
        }

        {/* Nút chuyển đổi giữa Đăng nhập <-> Đăng ký */}
        <div className="flex justify-center mt-6">
          <p className="text-sm text-[#ababab]">
            {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
            <a
              onClick={() => setIsRegister(!isRegister)}
              className="text-yellow-400 font-semibold hover:underline ml-1"
              href="#"
            >
              {isRegister ? "Đăng nhập" : "Đăng ký"}
            </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Auth;
