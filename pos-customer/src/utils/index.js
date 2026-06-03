export const getBgColor = () => {
  const bgarr = [
    "#b73e3e",
    "#5b45b0",
    "#7f167f",
    "#735f32",
    "#1d2569",
    "#285430",
    "#f6b100",
    "#025cca",
    "#be3e3f",
    "#02ca3a",
  ];
  const randomBg = Math.floor(Math.random() * bgarr.length);
  const color = bgarr[randomBg];
  return color;
};

export const getAvatarName = (name) => {
  if (!name) return "";

  return name.split(" ").map(word => word[0]).join("").toUpperCase();

}

export const formatDate = (date) => {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh"
  });
  return formatter.format(new Date(date));
};

export const formatDateAndTime = (date) => {
  // Đảm bảo parse đúng ISO date từ backend (UTC)
  const dateObj = new Date(date);

  // Nếu invalid date, return "--"
  if (isNaN(dateObj.getTime())) {
    return "--";
  }

  const dateAndTime = dateObj.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh"
  })

  return dateAndTime;
}

export const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

export const formatVND = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

export const resolveAssetUrl = (value = "") => {
  const rawValue = `${value || ""}`.trim();
  const envBase = `${import.meta.env.VITE_BACKEND_URL || ""}`.trim().replace(/\/+$/, "");
  const runtimeBase = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "";
  const backendBase = envBase || runtimeBase;

  if (!rawValue) return "";
  if (!backendBase) return rawValue;

  if (rawValue.startsWith("/")) {
    return `${backendBase}${rawValue}`;
  }

  try {
    const parsed = new URL(rawValue);
    if (["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
      return `${backendBase}${parsed.pathname}${parsed.search || ""}`;
    }
    return rawValue;
  } catch (error) {
    return rawValue;
  }
};