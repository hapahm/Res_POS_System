import React, { useEffect, useState } from "react";
// Import ảnh nền nhà hàng
import restaurant from "../assets/images/restaurant-img.jpg";
// Import logo
import logo from "../assets/images/logo2.png";
// Import component đăng ký
import Register from "../components/auth/Register";
// Import component đăng nhập
import Login from "../components/auth/Login";
import { useNavigate } from "react-router-dom";

const Auth = () => {

  // useEffect chạy 1 lần khi component được render
  // Dùng để đổi tiêu đề của tab trình duyệt
  useEffect(() => {
    document.title = "POS | Auth"
  }, [])

  // State để kiểm tra đang hiển thị form Đăng ký hay Đăng nhập
  // false = Login | true = Register
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen w-full bg-slate-50">

      {/* ================= LEFT SECTION - ẢNH NỀN + CÂU QUOTE ================= */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center bg-cover">

        {/* Ảnh nền */}
        <img
          className="w-full h-full object-cover"
          src={restaurant}
          alt="Restaurant Image"
        />

        {/* Lớp phủ màu đen để ảnh tối lại */}
        <div className="absolute inset-0 bg-black/55"></div>

        {/* Quote hiển thị phía dưới ảnh */}
        <blockquote className="absolute bottom-10 px-8 mb-10 text-xl italic text-white">
          "Mỗi món ăn đều được chuẩn bị với sự tận tâm để mang lại trải nghiệm trọn vẹn
          cho từng khách hàng."
          <br />
          <span className="block mt-4 text-orange-300">
            - KChick Restaurant
          </span>
        </blockquote>
      </div>

      {/* ================= RIGHT SECTION - FORM ĐĂNG NHẬP / ĐĂNG KÝ ================= */}
      <div className="w-full lg:w-1/2 min-h-screen p-6 sm:p-10 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mb-5 text-sm font-medium text-orange-500 hover:text-orange-600"
          >
            ← Quay về trang chủ
          </button>

          {/* Logo + Tên nhà hàng */}
          <div className="flex flex-col items-center gap-2">
            <img
              src={logo}
              alt="KChick Logo"
              className="h-14 w-14 rounded-full border border-slate-200 p-1"
            />
            <h1 className="text-lg font-semibold text-slate-800 tracking-wide">
              KChick
            </h1>
          </div>

          {/* Tiêu đề form */}
          <h2 className="text-2xl text-center mt-6 font-semibold text-slate-800 mb-2">
            {isRegister
              ? "Tạo tài khoản khách hàng"
              : "Đăng nhập tài khoản"}
          </h2>
          <p className="text-center text-sm text-slate-500 mb-8">
            {isRegister
              ? "Đăng ký để đặt món nhanh hơn và theo dõi đơn hàng dễ dàng."
              : "Chào mừng quay lại! Vui lòng đăng nhập để tiếp tục đặt món."}
          </p>

          {/* Hiển thị component Login hoặc Register tùy theo state */}
          {isRegister
            ? <Register setIsRegister={setIsRegister} />
            : <Login />
          }

          {/* Nút chuyển đổi giữa Đăng nhập <-> Đăng ký */}
          <div className="flex justify-center mt-6">
            <p className="text-sm text-slate-500">
              {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
              <a
                onClick={() => setIsRegister(!isRegister)}
                className="text-orange-500 font-semibold hover:underline ml-1"
                href="#"
              >
                {isRegister ? "Đăng nhập" : "Đăng ký"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
