import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const loginMutation = useMutation({
    mutationFn: (reqData) => login(reqData),
    onSuccess: (res) => {
      const { data } = res;
      const { _id, name, email, phone, role, accountStatus } = data.data;
      dispatch(setUser({ _id, name, email, phone, role, accountStatus }));
      navigate("/");
    },
    onError: (error) => {
      const { response } = error;
      enqueueSnackbar(response.data.message, { variant: "error" });
    },
  });

  return (
    <div className="max-w-md mx-auto">
      {/* Tên nhà hàng */}


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">
            Email nhân viên
          </label>
          <div className="flex items-center rounded-lg p-4 bg-[#1f1f1f] border border-transparent focus-within:border-[#3a3a3a] transition-colors">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email nhân viên"
              className="bg-transparent flex-1 text-white placeholder:text-[#7b7b7b] focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[#ababab] mb-2 text-sm font-medium">
            Mật khẩu
          </label>
          <div className="flex items-center rounded-lg p-4 bg-[#1f1f1f] border border-transparent focus-within:border-[#3a3a3a] transition-colors">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              className="bg-transparent flex-1 text-white placeholder:text-[#7b7b7b] focus:outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg mt-2 py-3 text-lg bg-yellow-400 text-gray-900 font-bold hover:opacity-90"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
};

export default Login;
