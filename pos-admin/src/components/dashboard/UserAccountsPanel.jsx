import React, { useEffect } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { useSelector } from "react-redux";
import {
    getInternalAccounts,
    updateInternalAccountRole,
    updateInternalAccountStatus,
} from "../../https";

const ROLE_OPTIONS = ["waiter", "cashier", "admin", "staff"];
const ROLE_LABELS = {
    waiter: "Phục vụ",
    cashier: "Thu ngân",
    admin: "Quản trị",
    staff: "Nhân viên",
    customer: "Khách hàng",
    chatbot: "Chatbot"
};

const UserAccountsPanel = () => {
    const queryClient = useQueryClient();
    const currentUser = useSelector((state) => state.user);

    const { data: resData, isError, error } = useQuery({
        queryKey: ["dashboard", "internal-accounts"],
        queryFn: async () => await getInternalAccounts(),
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (!isError) return;
        const message = error?.response?.data?.message || "Đã xảy ra lỗi khi tải tài khoản nội bộ!";
        enqueueSnackbar(message, { variant: "error" });
    }, [isError, error]);

    const users = (resData?.data?.data || []).filter((user) => {
        const normalizedRole = `${user?.role || ""}`.toLowerCase();
        return !["customer", "chatbot"].includes(normalizedRole);
    });

    const statusMutation = useMutation({
        mutationFn: (reqData) => updateInternalAccountStatus(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Cập nhật trạng thái thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "internal-accounts"]);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể cập nhật trạng thái tài khoản.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const roleMutation = useMutation({
        mutationFn: (reqData) => updateInternalAccountRole(reqData),
        onSuccess: (res) => {
            enqueueSnackbar(res?.data?.message || "Cập nhật quyền thành công!", { variant: "success" });
            queryClient.invalidateQueries(["dashboard", "internal-accounts"]);
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Không thể cập nhật quyền tài khoản.";
            enqueueSnackbar(message, { variant: "error" });
        }
    });

    const toStatusLabel = (status) => {
        if (status === "approved") return "Đã duyệt";
        if (status === "locked") return "Đã khóa";
        return "Chờ duyệt";
    };

    const toStatusClass = (status) => {
        if (status === "approved") return "bg-[#243324] text-[#02ca3a]";
        if (status === "locked") return "bg-[#3b2a2a] text-[#f6b100]";
        return "bg-[#2f2b1f] text-[#f6b100]";
    };

    const handleApprove = (userId) => {
        statusMutation.mutate({ userId, accountStatus: "approved" });
    };

    const handleLock = (userId) => {
        statusMutation.mutate({ userId, accountStatus: "locked" });
    };

    const handleRoleChange = (userId, role) => {
        roleMutation.mutate({ userId, role });
    };

    const toRoleLabel = (role) => {
        const normalizedRole = `${role || ""}`.toLowerCase();
        return ROLE_LABELS[normalizedRole] || role || "Không rõ";
    };

    return (
        <div className="bg-[#1a1a1a] rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-[#f5f5f5] text-lg font-semibold">Quản lý tài khoản nội bộ</h3>
                    <p className="text-[#ababab] text-sm">Tổng: {users.length}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-[#e4e4e4]">
                    <thead className="text-xs uppercase text-[#ababab]">
                        <tr>
                            <th className="px-4 py-3">Nhân viên</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Vai trò</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const isSelf = `${user._id}` === `${currentUser._id}`;
                            const status = user.accountStatus || "pending";
                            const normalizedRole = `${user.role || ""}`.toLowerCase();
                            const isDefaultAdmin = `${user.email || ""}`.toLowerCase() === "admin1@ex.com";
                            const isCustomerAccount = ["customer", "chatbot"].includes(normalizedRole);
                            const canChangeRole = !isSelf && !isCustomerAccount;
                            const canLock = !isSelf && !isDefaultAdmin && !isCustomerAccount;

                            return (
                                <tr key={user._id} className="border-t border-[#2a2a2a]">
                                    <td className="px-4 py-3">{user.name}</td>
                                    <td className="px-4 py-3">{user.email}</td>
                                    <td className="px-4 py-3">
                                        {isCustomerAccount ? (
                                            <span className="px-2 py-1 rounded-md text-xs bg-[#2a2a2a] text-[#ababab]">
                                                {toRoleLabel(normalizedRole)}
                                            </span>
                                        ) : (
                                            <select
                                                value={normalizedRole || "waiter"}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                disabled={!canChangeRole || isDefaultAdmin || roleMutation.isPending}
                                                className="bg-[#1f1f1f] text-white rounded-lg px-3 py-2 focus:outline-none disabled:opacity-60"
                                            >
                                                {ROLE_OPTIONS.map((role) => (
                                                    <option key={role} value={role}>
                                                        {toRoleLabel(role)}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-md text-xs ${toStatusClass(status)}`}>
                                            {toStatusLabel(status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isCustomerAccount ? (
                                            <span className="text-xs text-[#ababab]">Không quản lý</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(user._id)}
                                                    disabled={statusMutation.isPending}
                                                    className="px-3 py-1 rounded-md text-xs bg-[#243324] text-[#02ca3a] hover:opacity-90 disabled:opacity-60"
                                                >
                                                    Duyệt
                                                </button>
                                                <button
                                                    onClick={() => handleLock(user._id)}
                                                    disabled={!canLock || statusMutation.isPending}
                                                    className="px-3 py-1 rounded-md text-xs bg-[#3b2a2a] text-[#f6b100] hover:opacity-90 disabled:opacity-60"
                                                >
                                                    Khóa
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {users.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-[#ababab]">
                                    Chưa có tài khoản nội bộ nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserAccountsPanel;
