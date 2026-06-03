import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from "react-icons/fa";
import CustomerBackButton from "../components/shared/CustomerBackButton";
import logo from "../assets/images/logo2.png";
import { formatVND } from "../utils";

const TAX_RATE = 5.25;

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");
    const hasAutoPrintedRef = useRef(false);

    const handlePrintReceipt = () => {
        const txnRef = searchParams.get("vnp_TxnRef") || "--";
        const totalAmount = Number(searchParams.get("vnp_Amount") || 0) / 100;
        const subtotal = totalAmount / (1 + TAX_RATE / 100);
        const taxAmount = totalAmount - subtotal;
        const bankCode = searchParams.get("vnp_BankCode") || "--";
        const payDate = searchParams.get("vnp_PayDate") || "--";
        const transactionNo = searchParams.get("vnp_TransactionNo") || "--";
        const logoSrc = new URL(logo, window.location.origin).href;

        const printWindow = window.open("", "", "width=900,height=650");
        if (!printWindow) return;

        printWindow.document.write(`
                        <html>
                            <head>
                                <title>Hóa đơn KChick - VNPAY</title>
                                <style>
                                    @page { size: 80mm auto; margin: 4mm; }
                                    * { box-sizing: border-box; }
                                    body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #111827; background: #fff; display: flex; justify-content: center; }
                                    .receipt { width: 302px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
                                    .brand { text-align: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 10px; }
                                    .logo { width: 48px; height: 48px; object-fit: contain; border-radius: 999px; }
                                    .name { margin: 6px 0 2px; font-size: 17px; font-weight: 700; }
                                    .desc { margin: 0; font-size: 11px; color: #6b7280; }
                                    .meta { margin-top: 10px; font-size: 12px; }
                                    .row { display: flex; justify-content: space-between; gap: 8px; margin: 5px 0; }
                                    .row span:first-child { color: #6b7280; }
                                    .summary { margin-top: 10px; border-top: 1px dashed #d1d5db; padding-top: 8px; }
                                    .grand { margin-top: 8px; border-top: 1px solid #111827; padding-top: 8px; font-size: 14px; font-weight: 700; display: flex; justify-content: space-between; }
                                    .footer { margin-top: 10px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px dashed #d1d5db; padding-top: 8px; }
                                </style>
                            </head>
                            <body>
                                <div class="receipt">
                                    <div class="brand">
                                        <img src="${logoSrc}" alt="KChick" class="logo" />
                                        <p class="name">KChick Restaurant</p>
                                        <p class="desc">HÓA ĐƠN THANH TOÁN VNPAY</p>
                                    </div>

                                    <div class="meta">
                                        <div class="row"><span>Mã giao dịch:</span><strong>${txnRef}</strong></div>
                                        <div class="row"><span>Mã thanh toán:</span><strong>${transactionNo}</strong></div>
                                        <div class="row"><span>Ngân hàng:</span><strong>${bankCode}</strong></div>
                                        <div class="row"><span>Thời gian:</span><strong>${payDate}</strong></div>
                                        <div class="row"><span>Thanh toán:</span><strong>Online (VNPAY)</strong></div>
                                    </div>

                                    <div class="summary">
                                        <div class="row"><span>Tạm tính</span><strong>${formatVND(subtotal)}</strong></div>
                                        <div class="row"><span>Thuế (${TAX_RATE}%)</span><strong>${formatVND(taxAmount)}</strong></div>
                                        <div class="grand"><span>Tổng tiền</span><strong>${formatVND(totalAmount)}</strong></div>
                                    </div>

                                    <div class="footer">Cảm ơn quý khách đã dùng bữa tại KChick!</div>
                                </div>
                            </body>
                        </html>
                `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    useEffect(() => {
        document.title = "POS | Kết quả thanh toán";

        const responseCode = searchParams.get("vnp_ResponseCode");
        const txnRef = searchParams.get("vnp_TxnRef");
        const amount = searchParams.get("vnp_Amount");

        if (!responseCode || !txnRef) {
            setStatus("error");
            setMessage("Không tìm thấy thông tin giao dịch");
            return;
        }

        if (responseCode === "00") {
            setStatus("success");
            setMessage("Thanh toán thành công!");
        } else if (["10", "11"].includes(responseCode)) {
            setStatus("expired");
            setMessage("Giao dịch đã hết hạn");
        } else if (["24", "51", "65", "75", "79"].includes(responseCode)) {
            setStatus("failed");
            setMessage("Thanh toán thất bại");
        } else {
            setStatus("failed");
            setMessage(`Giao dịch không thành công (Mã lỗi: ${responseCode})`);
        }
    }, [searchParams]);

    useEffect(() => {
        if (status === "success" && !hasAutoPrintedRef.current) {
            hasAutoPrintedRef.current = true;
            handlePrintReceipt();
        }
    }, [status]);

    const getStatusIcon = () => {
        switch (status) {
            case "success":
                return <FaCheckCircle className="text-green-500" size={80} />;
            case "failed":
                return <FaTimesCircle className="text-red-500" size={80} />;
            case "expired":
                return <FaExclamationTriangle className="text-orange-500" size={80} />;
            default:
                return null;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case "success":
                return "text-green-400";
            case "failed":
                return "text-red-400";
            case "expired":
                return "text-orange-400";
            default:
                return "text-gray-400";
        }
    };

    return (
        <section className="bg-[#1f1f1f] min-h-screen flex items-center justify-center">
            <div className="bg-[#262626] rounded-lg p-8 max-w-md w-full mx-4 text-center">
                <div className="flex items-center justify-between mb-6">
                    <CustomerBackButton />
                    <h1 className="text-[#f5f5f5] text-xl font-bold">Kết quả thanh toán</h1>
                    <div className="w-10"></div>
                </div>

                <div className="flex flex-col items-center gap-6 my-8">
                    {getStatusIcon()}
                    <h2 className={`text-2xl font-bold ${getStatusColor()}`}>
                        {message}
                    </h2>

                    {status === "success" && (
                        <p className="text-[#ababab] text-sm">
                            Đơn hàng của bạn đã được thanh toán thành công qua VNPAY
                        </p>
                    )}

                    {status === "failed" && (
                        <p className="text-[#ababab] text-sm">
                            Vui lòng thử lại hoặc chọn phương thức thanh toán khác
                        </p>
                    )}

                    {status === "expired" && (
                        <p className="text-[#ababab] text-sm">
                            Phiên thanh toán đã hết hạn. Vui lòng tạo giao dịch mới
                        </p>
                    )}

                    <div className="w-full bg-[#1a1a1a] rounded-lg p-4 text-left">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-[#ababab]">Mã giao dịch:</span>
                            <span className="text-[#f5f5f5] font-mono">
                                {searchParams.get("vnp_TxnRef")?.slice(-12) || "--"}
                            </span>
                        </div>
                        {searchParams.get("vnp_Amount") && (
                            <>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-[#ababab]">Tạm tính:</span>
                                    <span className="text-[#f5f5f5] font-semibold">
                                        {formatVND((Number(searchParams.get("vnp_Amount")) / 100) / (1 + TAX_RATE / 100))}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-[#ababab]">Thuế ({TAX_RATE}%):</span>
                                    <span className="text-[#f5f5f5] font-semibold">
                                        {formatVND((Number(searchParams.get("vnp_Amount")) / 100) - ((Number(searchParams.get("vnp_Amount")) / 100) / (1 + TAX_RATE / 100)))}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mb-2 pt-2 border-t border-[#333]">
                                    <span className="text-[#ababab]">Tổng tiền:</span>
                                    <span className="text-[#f5f5f5] font-semibold">
                                        {formatVND(Number(searchParams.get("vnp_Amount")) / 100)}
                                    </span>
                                </div>
                            </>
                        )}
                        {searchParams.get("vnp_BankCode") && (
                            <div className="flex justify-between text-sm">
                                <span className="text-[#ababab]">Ngân hàng:</span>
                                <span className="text-[#f5f5f5]">
                                    {searchParams.get("vnp_BankCode")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    {status === "success" && (
                        <button
                            onClick={handlePrintReceipt}
                            className="flex-1 bg-[#1a1a1a] text-[#f5f5f5] rounded-lg px-6 py-3 hover:bg-[#2c2c2c]"
                        >
                            In hóa đơn
                        </button>
                    )}
                    <button
                        onClick={() => navigate("/payment")}
                        className="flex-1 bg-[#1a1a1a] text-[#f5f5f5] rounded-lg px-6 py-3 hover:bg-[#2c2c2c]"
                    >
                        Thanh toán khác
                    </button>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex-1 bg-[#f6b100] text-[#1f1f1f] rounded-lg px-6 py-3 font-semibold hover:bg-[#e5a000]"
                    >
                        Về Dashboard
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PaymentResult;
