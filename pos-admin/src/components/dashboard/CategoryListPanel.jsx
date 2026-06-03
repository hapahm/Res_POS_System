import React, { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { addCategory, deleteCategory, getCategories, updateCategory } from "../../https";

const CategoryListPanel = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("add");
    const [formData, setFormData] = useState({ name: "", description: "", isActive: true });
    const [editingId, setEditingId] = useState(null);

    const { data: resData, isError } = useQuery({
        queryKey: ["dashboard", "categories"],
        queryFn: async () => await getCategories(),
        placeholderData: keepPreviousData,
    });

    if (isError) {
        enqueueSnackbar("Đã xảy ra lỗi khi tải danh mục!", { variant: "error" });
    }

    const categories = resData?.data?.data || [];

    const openAddForm = () => {
        setFormMode("add");
        setEditingId(null);
        setFormData({ name: "", description: "", isActive: true });
        setIsFormOpen(true);
    };

    const openEditForm = (category) => {
        setFormMode("edit");
        setEditingId(category._id);
        setFormData({
            name: category.name || "",
            description: category.description || "",
            isActive: Boolean(category.isActive)
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

    const addMutation = useMutation({
        mutationFn: (reqData) => addCategory(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Thêm danh mục thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "categories"]);
            setIsFormOpen(false);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể thêm danh mục.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (reqData) => updateCategory(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Cập nhật danh mục thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "categories"]);
            setIsFormOpen(false);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể cập nhật danh mục.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (categoryId) => deleteCategory(categoryId),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Xóa danh mục thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "categories"]);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể xóa danh mục.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive
        };

        if (formMode === "add") {
            addMutation.mutate(payload);
            return;
        }

        updateMutation.mutate({ categoryId: editingId, ...payload });
    };

    const handleDelete = (categoryId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        deleteMutation.mutate(categoryId);
    };

    return (
        <div className="bg-[#1a1a1a] rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[#f5f5f5] text-lg font-semibold">Danh sách danh mục</h3>
                    <p className="text-[#ababab] text-sm">Tổng: {categories.length}</p>
                </div>
                <button
                    onClick={openAddForm}
                    className="bg-[#025cca] hover:bg-[#1b4d9a] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                    Thêm danh mục
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-[#e4e4e4]">
                    <thead className="text-xs uppercase text-[#ababab]">
                        <tr>
                            <th className="px-4 py-3">Tên danh mục</th>
                            <th className="px-4 py-3">Mô tả</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category._id} className="border-t border-[#2a2a2a]">
                                <td className="px-4 py-3">{category.name}</td>
                                <td className="px-4 py-3">{category.description || "-"}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs ${category.isActive ? "bg-[#243324] text-[#02ca3a]" : "bg-[#3b2a2a] text-[#f6b100]"
                                            }`}
                                    >
                                        {category.isActive ? "Đang bán" : "Ngừng bán"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditForm(category)}
                                            className="px-3 py-1 rounded-md text-xs bg-[#2a2a2a] text-[#f5f5f5] hover:bg-[#3a3a3a]"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category._id)}
                                            className="px-3 py-1 rounded-md text-xs bg-[#3b2a2a] text-[#f6b100] hover:bg-[#4b2a2a]"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {categories.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-4 py-6 text-center text-[#ababab]">
                                    Chưa có danh mục nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#262626] rounded-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[#f5f5f5] text-lg font-semibold">
                                {formMode === "add" ? "Thêm danh mục" : "Cập nhật danh mục"}
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
                                <label className="block text-sm text-[#ababab] mb-2">Tên danh mục</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                    required
                                />
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
                                    name="isActive"
                                    checked={formData.isActive}
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

export default CategoryListPanel;
