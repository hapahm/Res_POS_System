import React, { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addTable, deleteTable, getTables, updateTable } from "../../https";
import { enqueueSnackbar } from "notistack";

const TableListPanel = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState("add");
    const [formData, setFormData] = useState({ tableNo: "", seats: "" });
    const [editingId, setEditingId] = useState(null);
    const [qrPreviewTable, setQrPreviewTable] = useState(null);

    const { data: resData, isError } = useQuery({
        queryKey: ["dashboard", "tables"],
        queryFn: async () => await getTables(),
        placeholderData: keepPreviousData,
    });

    if (isError) {
        enqueueSnackbar("Đã xảy ra lỗi khi tải danh sách bàn!", { variant: "error" });
    }

    const tables = resData?.data?.data || [];

    const openAddForm = () => {
        setFormMode("add");
        setEditingId(null);
        setFormData({ tableNo: "", seats: "" });
        setIsFormOpen(true);
    };

    const openEditForm = (table) => {
        setFormMode("edit");
        setEditingId(table._id);
        setFormData({ tableNo: table.tableNo, seats: table.seats });
        setIsFormOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const addMutation = useMutation({
        mutationFn: (reqData) => addTable(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Thêm bàn thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "tables"]);
            setIsFormOpen(false);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể thêm bàn.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: (reqData) => updateTable(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Cập nhật bàn thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "tables"]);
            setIsFormOpen(false);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể cập nhật bàn.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (tableId) => deleteTable(tableId),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Xóa bàn thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "tables"]);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể xóa bàn.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            tableNo: Number(formData.tableNo),
            seats: Number(formData.seats)
        };

        if (formMode === "add") {
            addMutation.mutate(payload);
            return;
        }

        updateMutation.mutate({ tableId: editingId, ...payload });
    };

    const handleDelete = (tableId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bàn này?")) return;
        deleteMutation.mutate(tableId);
    };

    const getQrImageUrl = (qrOrderUrl = "") => {
        if (!qrOrderUrl) return "";
        return `https://quickchart.io/qr?size=280&text=${encodeURIComponent(qrOrderUrl)}`;
    };

    const handleCopyQrLink = async (qrOrderUrl = "") => {
        if (!qrOrderUrl) {
            enqueueSnackbar("Chưa có link QR cho bàn này.", { variant: "warning" });
            return;
        }

        try {
            await navigator.clipboard.writeText(qrOrderUrl);
            enqueueSnackbar("Đã sao chép link QR gọi món.", { variant: "success" });
        } catch (error) {
            enqueueSnackbar("Không thể sao chép link QR.", { variant: "error" });
        }
    };

    const handleDownloadQrPng = (table) => {
        const qrOrderUrl = table?.qrOrderUrl || "";
        if (!qrOrderUrl) {
            enqueueSnackbar("Chưa có link QR cho bàn này.", { variant: "warning" });
            return;
        }

        const downloadLink = document.createElement("a");
        downloadLink.href = getQrImageUrl(qrOrderUrl);
        downloadLink.download = `qr-ban-${table?.tableNo || "unknown"}.png`;
        downloadLink.target = "_blank";
        downloadLink.rel = "noopener noreferrer";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return (
        <div className="bg-[#1a1a1a] rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[#f5f5f5] text-lg font-semibold">Danh sách bàn</h3>
                    <p className="text-[#ababab] text-sm">Tổng: {tables.length}</p>
                </div>
                <button
                    onClick={openAddForm}
                    className="bg-[#025cca] hover:bg-[#1b4d9a] text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                    Thêm bàn
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-[#e4e4e4]">
                    <thead className="text-xs uppercase text-[#ababab]">
                        <tr>
                            <th className="px-4 py-3">Số bàn</th>
                            <th className="px-4 py-3">Số ghế</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Khách</th>
                            <th className="px-4 py-3">QR gọi món</th>
                            <th className="px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tables.map((table) => (
                            <tr key={table._id} className="border-t border-[#2a2a2a]">
                                <td className="px-4 py-3">{table.tableNo}</td>
                                <td className="px-4 py-3">{table.seats}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs ${table.status === "Đã đặt"
                                            ? "bg-[#3b2a2a] text-[#f6b100]"
                                            : "bg-[#243324] text-[#02ca3a]"
                                            }`}
                                    >
                                        {table.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {table?.currentOrder?.customerDetails?.name || "-"}
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => setQrPreviewTable(table)}
                                        className="px-3 py-1 rounded-md text-xs bg-[#1f1f1f] text-[#f5f5f5] hover:bg-[#2a2a2a]"
                                    >
                                        Xem QR
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditForm(table)}
                                            className="px-3 py-1 rounded-md text-xs bg-[#2a2a2a] text-[#f5f5f5] hover:bg-[#3a3a3a]"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(table._id)}
                                            className="px-3 py-1 rounded-md text-xs bg-[#3b2a2a] text-[#f6b100] hover:bg-[#4b2a2a]"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {tables.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-4 py-6 text-center text-[#ababab]">
                                    Chưa có bàn nào.
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
                                {formMode === "add" ? "Thêm bàn" : "Cập nhật bàn"}
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
                                <label className="block text-sm text-[#ababab] mb-2">Số bàn</label>
                                <input
                                    type="number"
                                    name="tableNo"
                                    value={formData.tableNo}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#ababab] mb-2">Số ghế</label>
                                <input
                                    type="number"
                                    name="seats"
                                    value={formData.seats}
                                    onChange={handleChange}
                                    className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none"
                                    required
                                />
                            </div>

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

            {qrPreviewTable && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-[#262626] rounded-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[#f5f5f5] text-lg font-semibold">
                                QR gọi món - Bàn {qrPreviewTable.tableNo}
                            </h4>
                            <button
                                onClick={() => setQrPreviewTable(null)}
                                className="text-[#ababab] hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            {qrPreviewTable?.qrOrderUrl ? (
                                <img
                                    src={getQrImageUrl(qrPreviewTable.qrOrderUrl)}
                                    alt={`QR bàn ${qrPreviewTable.tableNo}`}
                                    className="w-64 h-64 rounded-md bg-white p-2"
                                />
                            ) : (
                                <p className="text-sm text-[#ababab]">Bàn này chưa có link QR.</p>
                            )}

                            <input
                                readOnly
                                value={qrPreviewTable?.qrOrderUrl || ""}
                                className="w-full bg-[#1f1f1f] text-[#e4e4e4] rounded-lg px-3 py-2 text-sm"
                            />

                            <div className="w-full flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setQrPreviewTable(null)}
                                    className="px-4 py-2 rounded-lg bg-[#1f1f1f] text-[#ababab]"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDownloadQrPng(qrPreviewTable)}
                                    className="px-4 py-2 rounded-lg bg-[#1f1f1f] text-[#f5f5f5] font-semibold"
                                >
                                    Tải QR (PNG)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleCopyQrLink(qrPreviewTable?.qrOrderUrl)}
                                    className="px-4 py-2 rounded-lg bg-[#f6b100] text-[#1f1f1f] font-semibold"
                                >
                                    Sao chép link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableListPanel;
