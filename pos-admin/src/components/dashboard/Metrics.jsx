import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMetrics, getDishStats, getCategoryStats, getOrders } from "../../https/index";
import { enqueueSnackbar } from "notistack";
import * as XLSX from "xlsx-js-style";
import { Pie, Line } from "react-chartjs-2";
import "chart.js/auto";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16"];

const Metrics = () => {
  // Fetch metrics data from API
  const { data: metricsResponse, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard", "metrics"],
    queryFn: getMetrics,
    onError: () => {
      enqueueSnackbar("Lỗi tải dữ liệu thống kê", { variant: "error" });
    }
  });

  const { data: ordersResponse } = useQuery({
    queryKey: ["dashboard", "metricsOrders"],
    queryFn: async () => await getOrders(),
    onError: () => {
      enqueueSnackbar("Lỗi tải dữ liệu đơn hàng", { variant: "error" });
    }
  });

  // Fetch dish stats
  const { data: dishStatsResponse } = useQuery({
    queryKey: ["dashboard", "dishStats"],
    queryFn: getDishStats,
    onError: () => {
      enqueueSnackbar("Lỗi tải dữ liệu món ăn", { variant: "error" });
    }
  });

  // Fetch category stats
  const { data: categoryStatsResponse } = useQuery({
    queryKey: ["dashboard", "categoryStats"],
    queryFn: getCategoryStats,
    onError: () => {
      enqueueSnackbar("Lỗi tải dữ liệu danh mục", { variant: "error" });
    }
  });

  // Format currency to VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const metricsPayload = metricsResponse?.data?.data || {};
  const ordersPayload = Array.isArray(ordersResponse?.data?.data)
    ? ordersResponse.data.data
    : [];
  const dishStatsPayload = dishStatsResponse?.data?.data || [];
  const categoryStatsPayload = categoryStatsResponse?.data?.data || [];

  const isActiveKitchenStatus = (status) => {
    const normalizedStatus = `${status || ""}`.trim().toLowerCase();
    return [
      "pending",
      "preparing",
      "đang chờ",
      "dang cho",
      "đang chế biến",
      "dang che bien"
    ].includes(normalizedStatus);
  };

  const totalCustomersFromOrders = ordersPayload.reduce((sum, order) => {
    const guests = Number(order?.customerDetails?.guests);
    return sum + (Number.isFinite(guests) && guests > 0 ? guests : 1);
  }, 0);

  const activeOrdersFromOrders = ordersPayload.reduce((sum, order) => {
    const kitchenStatus = order?.kitchenStatus;
    return isActiveKitchenStatus(kitchenStatus) ? sum + 1 : sum;
  }, 0);

  const totalCustomersMetric =
    ordersPayload.length > 0 ? totalCustomersFromOrders : Number(metricsPayload.totalCustomers || 0);
  const activeOrdersMetric =
    ordersPayload.length > 0 ? activeOrdersFromOrders : Number(metricsPayload.activeTableOrders || 0);

  const categoryShareData = categoryStatsPayload
    .slice()
    .sort((a, b) => Number(b?.totalRevenue || 0) - Number(a?.totalRevenue || 0));

  const totalCategoryRevenue = categoryShareData.reduce(
    (sum, item) => sum + Number(item?.totalRevenue || 0),
    0
  );

  const pieSlices = categoryShareData.map((item, index) => {
    const value = Number(item?.totalRevenue || 0);
    const percent = totalCategoryRevenue > 0 ? (value / totalCategoryRevenue) * 100 : 0;
    return {
      label: item?.categoryName || item?._id || "N/A",
      value,
      percent,
      color: CHART_COLORS[index % CHART_COLORS.length]
    };
  });

  const pieData = {
    labels: pieSlices.map((slice) => slice.label),
    datasets: [
      {
        data: pieSlices.map((slice) => Number(slice.value || 0)),
        backgroundColor: pieSlices.map((slice) => slice.color),
        borderColor: "#1a1a1a",
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = Number(context.raw || 0);
            const total = context.dataset.data.reduce((sum, item) => sum + Number(item || 0), 0);
            const percent = total > 0 ? (value / total) * 100 : 0;
            return `${context.label}: ${formatCurrency(value)} (${percent.toFixed(1)}%)`;
          }
        }
      }
    }
  };

  const lineSeries = dishStatsPayload
    .slice()
    .sort((a, b) => Number(b?.totalRevenue || 0) - Number(a?.totalRevenue || 0))
    .slice(0, 7)
    .map((dish) => ({
      label: dish?.dishName || dish?._id || "N/A",
      value: Number(dish?.totalRevenue || 0)
    }));

  const lineData = {
    labels: lineSeries.map((item, index) => `#${index + 1}`),
    datasets: [
      {
        label: "Doanh thu",
        data: lineSeries.map((item) => item.value),
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.2)",
        borderWidth: 3,
        pointBackgroundColor: "#f6b100",
        pointBorderColor: "#f6b100",
        pointRadius: 4,
        tension: 0.35,
        fill: true
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#f5f5f5" }
      },
      tooltip: {
        callbacks: {
          title: (items) => {
            const index = items?.[0]?.dataIndex ?? 0;
            return lineSeries[index]?.label || "N/A";
          },
          label: (context) => `Doanh thu: ${formatCurrency(Number(context.raw || 0))}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#ababab" },
        grid: { color: "rgba(255,255,255,0.08)" }
      },
      y: {
        ticks: {
          color: "#ababab",
          callback: (value) => {
            const numeric = Number(value || 0);
            if (numeric >= 1000000) {
              return `${(numeric / 1000000).toFixed(1)}M`;
            }
            if (numeric >= 1000) {
              return `${(numeric / 1000).toFixed(0)}K`;
            }
            return numeric;
          }
        },
        grid: { color: "rgba(255,255,255,0.08)" }
      }
    }
  };

  // Build metrics data for display
  const metrics = metricsResponse?.data?.data
    ? [
      {
        title: "Tổng doanh thu",
        value: formatCurrency(metricsPayload.totalRevenue || 0),
        color: "#1e3a8a"
      },
      {
        title: "Tổng khách hàng",
        value: totalCustomersMetric.toLocaleString("vi-VN"),
        color: "#059669"
      },
      {
        title: "Số đơn hàng",
        value: (metricsPayload.totalOrders || 0).toLocaleString("vi-VN"),
        color: "#ea580c"
      }
    ]
    : [];

  // Build items data for detail section
  const itemsData = metricsResponse?.data?.data
    ? [
      {
        title: "Tổng danh mục",
        value: (metricsPayload.totalCategories || 0).toLocaleString("vi-VN"),
        color: "#1e3a8a"
      },
      {
        title: "Tổng số món",
        value: (metricsPayload.totalDishes || 0).toLocaleString("vi-VN"),
        color: "#7c3aed"
      },
      {
        title: "Đơn đang hoạt động",
        value: activeOrdersMetric.toLocaleString("vi-VN"),
        color: "#059669"
      },
      {
        title: "Tổng số bàn",
        value: (metricsPayload.totalTables || 0).toLocaleString("vi-VN"),
        color: "#ea580c"
      }
    ]
    : [];

  const handleExportExcel = () => {
    if (!metricsResponse?.data?.data) {
      enqueueSnackbar("Dữ liệu chưa sẵn sàng", { variant: "warning" });
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      const summaryData = [
        ["BÁO CÁO TỔNG QUAN HỆ THỐNG QUẢN LÝ NHÀ HÀNG"],
        [""],
        ["Chỉ số", "Giá trị"],
        ["Tổng doanh thu", formatCurrency(metricsPayload.totalRevenue || 0)],
        ["Tổng khách hàng", totalCustomersMetric.toLocaleString("vi-VN")],
        ["Tổng số đơn hàng", Number(metricsPayload.totalOrders || 0).toLocaleString("vi-VN")],
        ["Tổng danh mục", Number(metricsPayload.totalCategories || 0).toLocaleString("vi-VN")],
        ["Tổng số món ăn", Number(metricsPayload.totalDishes || 0).toLocaleString("vi-VN")],
        ["Đơn hàng đang hoạt động", activeOrdersMetric.toLocaleString("vi-VN")],
        ["Tổng số bàn", Number(metricsPayload.totalTables || 0).toLocaleString("vi-VN")],
        ["Ngày xuất báo cáo", new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

      const titleStyle = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1F2937" } },
        alignment: { horizontal: "center", vertical: "center" }
      };

      const headerStyle = {
        font: { bold: true, sz: 12, color: { rgb: "1F1F1F" } },
        fill: { fgColor: { rgb: "F6B100" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "666666" } },
          bottom: { style: "thin", color: { rgb: "666666" } },
          left: { style: "thin", color: { rgb: "666666" } },
          right: { style: "thin", color: { rgb: "666666" } }
        }
      };

      const getBodyStyle = (rowIndex) => ({
        font: { sz: 11, color: { rgb: "1F1F1F" } },
        fill: { fgColor: { rgb: rowIndex % 2 === 0 ? "F9FAFB" : "EEF2F7" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "D1D5DB" } },
          bottom: { style: "thin", color: { rgb: "D1D5DB" } },
          left: { style: "thin", color: { rgb: "D1D5DB" } },
          right: { style: "thin", color: { rgb: "D1D5DB" } }
        }
      });

      summarySheet["A1"].s = titleStyle;
      summarySheet["B1"] = { t: "s", v: "", s: titleStyle };
      summarySheet["A3"].s = headerStyle;
      summarySheet["B3"].s = headerStyle;

      for (let row = 3; row < summaryData.length; row += 1) {
        const style = getBodyStyle(row);
        const indicatorCell = `A${row + 1}`;
        const valueCell = `B${row + 1}`;

        if (summarySheet[indicatorCell]) {
          summarySheet[indicatorCell].s = style;
        }

        if (summarySheet[valueCell]) {
          summarySheet[valueCell].s = {
            ...style,
            alignment: { horizontal: "right", vertical: "center" }
          };
        }
      }

      const columnWidths = [0, 1].map((colIndex) => {
        const maxLength = summaryData.reduce((max, row) => {
          const text = `${row[colIndex] ?? ""}`;
          return Math.max(max, text.length);
        }, 12);

        return { wch: Math.min(maxLength + 4, 60) };
      });

      summarySheet["!cols"] = columnWidths;
      summarySheet["!rows"] = [{ hpt: 26 }];

      XLSX.utils.book_append_sheet(wb, summarySheet, "Tổng quan");

      const timestamp = new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
      XLSX.writeFile(wb, `Báo cáo POS - ${timestamp}.xlsx`);
      enqueueSnackbar("Xuất Excel thành công!", { variant: "success" });
    } catch (error) {
      console.error("Export error:", error);
      enqueueSnackbar("Lỗi khi xuất Excel", { variant: "error" });
    }
  };

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">

      {/* ================= TỔNG QUAN HIỆU SUẤT ================= */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Tổng quan hiệu suất
          </h2>
          <p className="text-sm text-[#ababab]">
            Thống kê hiệu quả hoạt động của hệ thống trong thời gian gần đây.
          </p>
        </div>

        {/* Bộ lọc thời gian và Export */}
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-[#1a1a1a]">
            1 tháng gần nhất
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="4"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-4 py-2 rounded-md text-[#f5f5f5] bg-green-600 hover:bg-green-700 transition"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 2a1 1 0 011-1h12a1 1 0 011 1v2h2a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h2V2zm12 12H5v2h10v-2z" />
            </svg>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* ================= DANH SÁCH CHỈ SỐ ================= */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {metricsLoading ? (
          <div className="col-span-3 text-center text-[#ababab]">Đang tải dữ liệu...</div>
        ) : (
          metrics.map((metric, index) => {
            return (
              <div
                key={index}
                className="shadow-sm rounded-lg p-4"
                style={{ backgroundColor: metric.color }}
              >
                {/* Tên chỉ số */}
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {metric.title}
                </p>

                {/* Giá trị của chỉ số */}
                <p className="mt-2 font-semibold text-2xl text-[#f5f5f5]">
                  {metric.value}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* ================= CHI TIẾT MẶT HÀNG ================= */}
      <div className="flex flex-col justify-between mt-12">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Chi tiết mặt hàng
          </h2>
          <p className="text-sm text-[#ababab]">
            Thống kê chi tiết hiệu suất từng nhóm sản phẩm.
          </p>
        </div>

        {/* Danh sách item */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {
            itemsData.map((item, index) => {
              return (
                <div
                  key={index}
                  className="shadow-sm rounded-lg p-4"
                  style={{ backgroundColor: item.color }}
                >
                  {/* Tên mặt hàng */}
                  <p className="font-medium text-xs text-[#f5f5f5]">
                    {item.title}
                  </p>

                  {/* Giá trị */}
                  <p className="mt-2 font-semibold text-2xl text-[#f5f5f5]">
                    {item.value}
                  </p>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* ================= BIỂU ĐỒ ================= */}
      <div className="mt-12 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-lg bg-[#1a1a1a] p-5">
          <h3 className="text-[#f5f5f5] text-lg font-semibold">Biểu đồ tròn doanh thu theo danh mục</h3>
          <p className="text-sm text-[#ababab] mt-1">Tỷ trọng doanh thu từng danh mục sản phẩm.</p>

          {pieSlices.length === 0 ? (
            <p className="text-[#ababab] mt-6">Chưa có dữ liệu danh mục để hiển thị.</p>
          ) : (
            <div className="mt-5 flex flex-col md:flex-row items-center gap-6">
              <div className="h-[240px] w-[240px]">
                <Pie data={pieData} options={pieOptions} />
              </div>

              <div className="w-full space-y-2">
                {pieSlices.map((slice, index) => (
                  <div key={`${slice.label}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="text-[#f5f5f5] truncate">{slice.label}</span>
                    </div>
                    <span className="text-[#ababab] whitespace-nowrap">{slice.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-[#1a1a1a] p-5">
          <h3 className="text-[#f5f5f5] text-lg font-semibold">Biểu đồ đường doanh thu món bán chạy</h3>
          <p className="text-sm text-[#ababab] mt-1">So sánh doanh thu nhóm món top đầu theo thứ hạng.</p>

          {lineSeries.length === 0 ? (
            <p className="text-[#ababab] mt-6">Chưa có dữ liệu món ăn để hiển thị.</p>
          ) : (
            <div className="mt-5">
              <div className="h-[260px] w-full">
                <Line data={lineData} options={lineOptions} />
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lineSeries.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="text-xs text-[#ababab]">
                    <span className="text-[#f5f5f5]">#{index + 1}</span> {item.label}: <span className="text-[#f5f5f5]">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
