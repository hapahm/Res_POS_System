import React, { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { addDish, deleteDish, getCategories, getDishes, updateDish, uploadDishImage } from "../../https";
import { formatVND } from "../../utils";

const DishListPanel = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("add");
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        categoryId: "",
        description: "",
        imageUrl: "",
        isAvailable: true
    });
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);

    const { data: resData, isError } = useQuery({
        queryKey: ["dashboard", "dishes"],
        queryFn: async () => await getDishes(),
        placeholderData: keepPreviousData,
    });

    const { data: categoryRes } = useQuery({
        queryKey: ["dashboard", "categories"],
        queryFn: async () => await getCategories(),
        placeholderData: keepPreviousData,
    });

    if (isError) {
        enqueueSnackbar("Đã xảy ra lỗi khi tải danh sách món!", { variant: "error" });
    }

    const dishes = resData?.data?.data || [];
    const categories = categoryRes?.data?.data || [];

    const openAddForm = () => {
        setFormMode("add");
        setEditingId(null);
        setFormData({
            name: "",
            price: "",
            categoryId: categories?.[0]?._id || "",
            description: "",
            imageUrl: "",
            isAvailable: true
        });
        setIsFormOpen(true);
    };

    const openEditForm = (dish) => {
        setFormMode("edit");
        setEditingId(dish._id);
        setFormData({
            name: dish.name || "",
            price: dish.price || "",
            categoryId: dish.category?._id || "",
            description: dish.description || "",
            imageUrl: dish.imageUrl || "",
            isAvailable: Boolean(dish.isAvailable)
        });
        setIsFormOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formPayload = new FormData();
        formPayload.append("image", file);

        try {
            setUploading(true);
            const res = await uploadDishImage(formPayload);
            const url = res?.data?.data?.url;
            if (url) {
                setFormData((prev) => ({ ...prev, imageUrl: url }));
                enqueueSnackbar("Upload ảnh thành công!", { variant: "success" });
            }
        } catch (error) {
            const message = error?.response?.data?.message || "Upload ảnh thất bại.";
            enqueueSnackbar(message, { variant: "error" });
        } finally {
            setUploading(false);
        }
    };

    const addMutation = useMutation({
        mutationFn: (reqData) => addDish(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Thêm món thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "dishes"]);
            setIsFormOpen(false);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể thêm món.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (reqData) => updateDish(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Cập nhật món thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "dishes"]);
            setIsFormOpen(false);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể cập nhật món.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (dishId) => deleteDish(dishId),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Xóa món thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "dishes"]);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể xóa món.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            price: Number(formData.price),
            categoryId: formData.categoryId,
            description: formData.description,
            imageUrl: formData.imageUrl,
            isAvailable: formData.isAvailable
        };

        if (formMode === "add") {
            addMutation.mutate(payload);
            return;
        }

        updateMutation.mutate({ dishId: editingId, ...payload });
    };

    const handleDelete = (dishId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa món này?")) return;
        deleteMutation.mutate(dishId);
    };

    return (
        <div className="bg-[#1a1a1a] rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[#f5f5f5] text-lg font-semibold">Danh sách món ăn</h3>
                    <p className="text-[#ababab] text-sm">Tổng: {dishes.length}</p>
                </div>
                <button
                    onClick={openAddForm}
                    className="bg-[#025cca] hover:bg-[#1b4d9a] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                    Thêm món
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-[#e4e4e4]">
                    <thead className="text-xs uppercase text-[#ababab]">
                        <tr>
                            <th className="px-4 py-3">Hình ảnh</th>
                            <th className="px-4 py-3">Tên món</th>
                            <th className="px-4 py-3">Giá</th>
                            <th className="px-4 py-3">Danh mục</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dishes.map((dish) => (
                            <tr key={dish._id} className="border-t border-[#2a2a2a]">
                                <td className="px-4 py-3">
                                    {dish.imageUrl ? (
                                        <img
                                            src={dish.imageUrl}
                                            alt={dish.name}
                                            className="w-10 h-10 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded bg-[#2a2a2a]" />
                                    )}
                                </td>
                                <td className="px-4 py-3">{dish.name}</td>
                                <td className="px-4 py-3">{formatVND(dish.price)}</td>
                                <td className="px-4 py-3">{dish.category?.name || "-"}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs ${dish.isAvailable ? "bg-[#243324] text-[#02ca3a]" : "bg-[#3b2a2a] text-[#f6b100]"
                                            }`}
                                    >
                                        {dish.isAvailable ? "Đang bán" : "Ngừng bán"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditForm(dish)}
                                            className="px-3 py-1 rounded-md text-xs bg-[#2a2a2a] text-[#f5f5f5] hover:bg-[#3a3a3a]"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(dish._id)}
                                            className="px-3 py-1 rounded-md text-xs bg-[#3b2a2a] text-[#f6b100] hover:bg-[#4b2a2a]"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {dishes.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-4 py-6 text-center text-[#ababab]">
                                    Chưa có món nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#262626] rounded-lg w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[#f5f5f5] text-lg font-semibold">
                                {formMode === "add" ? "Thêm món" : "Cập nhật món"}
                            </h4>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="text-[#ababab] hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#ababab] mb-2">Tên món</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-[#ababab] mb-2">Giá</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[#ababab] mb-2">Danh mục</label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                        required
                                    >
                                        <option value="" disabled>Chọn danh mục</option>
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-[#ababab] mb-2">Hình ảnh</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                    />
                                    {formData.imageUrl && (
                                        <img
                                            src={formData.imageUrl}
                                            alt="preview"
                                            className="w-12 h-12 rounded object-cover"
                                        />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    className="w-full mt-2 bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                    placeholder="Hoặc dán URL ảnh"
                                    required
                                />
                                {uploading && (
                                    <p className="text-xs text-[#ababab] mt-1">Đang upload ảnh...</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-[#ababab] mb-2">Mô tả</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                    rows="3"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-[#ababab]">
                                <input
                                    type="checkbox"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleChange}
                                    className="accent-[#f6b100]"
                                />
                                Đang bán
                            </label>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-[#1f1f1f] text-[#ababab]"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#f6b100] text-[#1f1f1f] font-semibold"
                                >
                                    {formMode === "add" ? "Thêm" : "Lưu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DishListPanel;
