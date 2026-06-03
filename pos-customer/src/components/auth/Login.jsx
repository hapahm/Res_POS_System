import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/customerUserSlice";
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
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-slate-600 mb-2 text-sm font-medium">
            Email
          </label>
          <div className="flex items-center rounded-lg border border-slate-200 px-4 py-3 bg-white focus-within:border-orange-400">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email của bạn"
              className="bg-transparent flex-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              required
            />
          </div>
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
              placeholder="Nhập mật khẩu"
              className="bg-transparent flex-1 text-slate-800 placeholder:text-slate-400 focus:outline-none"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg mt-6 py-3 text-base bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
};

export default Login;
