import React, { useEffect, useRef } from "react";
import logo from "../../assets/images/logo2.png";
import { formatDateAndTime, formatVND } from "../../utils";

const TAX_RATE = 5.25;

const Invoice = ({ orderInfo, setShowInvoice, autoPrint = false }) => {
    const invoiceRef = useRef(null);

    const subtotal = Number(orderInfo?.bills?.total || 0);
    const tax = Number(orderInfo?.bills?.tax || 0);
    const total = Number(orderInfo?.bills?.totalWithTax || subtotal + tax);

    const handlePrint = () => {
        if (!invoiceRef.current) return;

        const printContent = invoiceRef.current.outerHTML;
        const printWindow = window.open("", "", "width=900,height=700");
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn KChick</title>
          <style>
                        @page { size: 80mm auto; margin: 4mm; }
            * { box-sizing: border-box; }
                        html, body { width: 80mm; }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #111827;
              background: #ffffff;
            }
            .receipt {
                            width: 100%;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 12px;
            }
            .brand { text-align: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 10px; }
            .logo { width: 48px; height: 48px; object-fit: contain; border-radius: 999px; }
            .name { margin: 6px 0 2px; font-size: 17px; font-weight: 700; }
            .desc { margin: 0; font-size: 11px; color: #6b7280; }
            .meta { margin-top: 10px; font-size: 12px; }
            .meta-row, .sum-row { display: flex; justify-content: space-between; gap: 8px; margin: 5px 0; }
            .meta-row span:first-child, .sum-row span:first-child { color: #6b7280; }
            .items { margin-top: 10px; border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db; padding: 8px 0; }
            .item { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; font-size: 12px; margin-bottom: 6px; }
            .item-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .summary { margin-top: 10px; font-size: 12px; }
            .grand {
              margin-top: 8px;
              border-top: 1px solid #111827;
              padding-top: 8px;
              font-size: 14px;
              font-weight: 700;
              display: flex;
              justify-content: space-between;
            }
            .footer {
              margin-top: 10px;
              text-align: center;
              font-size: 11px;
              color: #6b7280;
              border-top: 1px dashed #d1d5db;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          ${printContent}
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
        if (!autoPrint) return undefined;
        const timer = setTimeout(() => {
            handlePrint();
        }, 300);
        return () => clearTimeout(timer);
    }, [autoPrint]);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-[380px] rounded-xl p-3 shadow-2xl">
                <style>{`
          .receipt {
            width: 302px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px;
            margin: 0 auto;
            font-family: Arial, sans-serif;
            color: #111827;
          }
          .brand { text-align: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 10px; }
          .logo { width: 48px; height: 48px; object-fit: contain; border-radius: 999px; }
          .name { margin: 6px 0 2px; font-size: 17px; font-weight: 700; }
          .desc { margin: 0; font-size: 11px; color: #6b7280; }
          .meta { margin-top: 10px; font-size: 12px; }
          .meta-row, .sum-row { display: flex; justify-content: space-between; gap: 8px; margin: 5px 0; }
          .meta-row span:first-child, .sum-row span:first-child { color: #6b7280; }
          .items { margin-top: 10px; border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db; padding: 8px 0; }
          .item { display: grid; grid-template-columns: 1fr auto auto; gap: 6px; font-size: 12px; margin-bottom: 6px; }
          .item-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .summary { margin-top: 10px; font-size: 12px; }
          .grand { margin-top: 8px; border-top: 1px solid #111827; padding-top: 8px; font-size: 14px; font-weight: 700; display: flex; justify-content: space-between; }
          .footer { margin-top: 10px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px dashed #d1d5db; padding-top: 8px; }
        `}</style>
                <div ref={invoiceRef} className="receipt">
                    <div className="brand">
                        <img src={logo} alt="KChick" className="logo mx-auto" />
                        <p className="name">KChick Restaurant</p>
                        <p className="desc">HÓA ĐƠN THANH TOÁN</p>
                    </div>

                    <div className="meta">
                        <div className="meta-row">
                            <span>Mã đơn:</span>
                            <strong>{orderInfo?._id?.slice(-8) || "--"}</strong>
                        </div>
                        <div className="meta-row">
                            <span>Thời gian:</span>
                            <strong>{formatDateAndTime(orderInfo?.orderDate) || "--"}</strong>
                        </div>
                        <div className="meta-row">
                            <span>Khách hàng:</span>
                            <strong>{orderInfo?.customerDetails?.name || "Khách lẻ"}</strong>
                        </div>
                        <div className="meta-row">
                            <span>SĐT:</span>
                            <strong>{orderInfo?.customerDetails?.phone || "--"}</strong>
                        </div>
                        <div className="meta-row">
                            <span>Thanh toán:</span>
                            <strong>{orderInfo?.paymentMethod === "Cash" ? "Tiền mặt" : "Online"}</strong>
                        </div>
                    </div>

                    <div className="items">
                        {(orderInfo?.items || []).map((item, index) => {
                            const quantity = Number(item?.quantity || 0);
                            const price = Number(item?.price || 0);
                            const lineTotal = quantity * price;
                            return (
                                <div key={`${item?.name || "item"}-${index}`} className="item">
                                    <span className="item-name">{item?.name || "Món"}</span>
                                    <span>x{quantity}</span>
                                    <strong>{formatVND(lineTotal)}</strong>
                                </div>
                            );
                        })}
                    </div>

                    <div className="summary">
                        <div className="sum-row">
                            <span>Tạm tính</span>
                            <strong>{formatVND(subtotal)}</strong>
                        </div>
                        <div className="sum-row">
                            <span>Thuế ({TAX_RATE}%)</span>
                            <strong>{formatVND(tax)}</strong>
                        </div>
                        <div className="grand">
                            <span>Tổng tiền</span>
                            <span>{formatVND(total)}</span>
                        </div>
                    </div>

                    <div className="footer">
                        Cảm ơn quý khách đã dùng bữa tại KChick!
                    </div>
                </div>

                <div className="flex justify-between gap-2 mt-3">
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-[#1f1f1f] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#2d2d2d]"
                    >
                        In hóa đơn
                    </button>
                    <button
                        onClick={() => setShowInvoice(false)}
                        className="flex-1 bg-[#f3f4f6] text-[#111827] py-2 rounded-lg text-sm font-semibold hover:bg-[#e5e7eb]"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
