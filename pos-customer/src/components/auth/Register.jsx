import React, { useState } from "react";
import { register } from "../../https";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VN_PHONE_REGEX = /^\d{10}$/;

const Register = ({ setIsRegister }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone") {
      const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
      setFormData({
        ...formData,
        phone: onlyDigits,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPhone = formData.phone.trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      enqueueSnackbar("Email không đúng định dạng.", { variant: "warning" });
      return;
    }

    if (!VN_PHONE_REGEX.test(normalizedPhone)) {
      enqueueSnackbar("Số điện thoại phải đủ 10 chữ số.", { variant: "warning" });
      return;
    }

    if (formData.password.length < 6) {
      enqueueSnackbar("Mật khẩu phải có ít nhất 6 ký tự.", { variant: "warning" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      enqueueSnackbar("Mật khẩu nhập lại không khớp.", { variant: "warning" });
      return;
    }

    if (!formData.acceptedTerms) {
      enqueueSnackbar("Vui lòng đồng ý điều khoản trước khi đăng ký.", { variant: "warning" });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: formData.password,
      role: "customer",
    };

    registerMutation.mutate(payload);
  };

  const registerMutation = useMutation({
    mutationFn: (reqData) => register(reqData),
    onSuccess: (res) => {
      const { data } = res;
      enqueueSnackbar(data.message, { variant: "success" });
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        acceptedTerms: false,
      });

      setTimeout(() => {
        setIsRegister(false);
      }, 1500);
    },
    onError: (error) => {
      const { response } = error;
      enqueueSnackbar(response.data.message, { variant: "error" });
    },
  });

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-slate-600 mb-2 text-sm font-medium">
            Họ và tên
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 px-4 py-3 bg-white focus-within:border-orange-400">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
              className="bg-transparent flex-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 mb-2 mt-4 text-sm font-medium">
            Email
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 px-4 py-3 bg-white focus-within:border-orange-400">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              className="bg-transparent flex-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 mb-2 mt-4 text-sm font-medium">
            Số điện thoại
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 px-4 py-3 bg-white focus-within:border-orange-400">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Ví dụ: 0912345678"
              inputMode="numeric"
              maxLength={10}
              className="bg-transparent flex-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              required
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">Định dạng bắt buộc: đúng 10 chữ số</p>
        </div>

        <div>
          <label className="block text-slate-600 mb-2 mt-4 text-sm font-medium">
            Mật khẩu
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 px-4 py-3 bg-white focus-within:border-orange-400">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              className="bg-transparent flex-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-600 mb-2 mt-4 text-sm font-medium">
            Nhập lại mật khẩu
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 px-4 py-3 bg-white focus-within:border-orange-400">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              className="bg-transparent flex-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="acceptedTerms"
            checked={formData.acceptedTerms}
            onChange={handleChange}
            className="mt-0.5 h-4 w-4 accent-orange-500"
          />
          <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của nhà hàng.</span>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg mt-6 py-3 text-base bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
        >
          Đăng ký
        </button>
      </form>
    </div>
  );
};

export default Register;
