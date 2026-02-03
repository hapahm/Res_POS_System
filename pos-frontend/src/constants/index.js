import butterChicken from '../assets/images/butter-chicken-4.jpg';
import palakPaneer from '../assets/images/Saag-Paneer-1.jpg';
import biryani from '../assets/images/hyderabadibiryani.jpg';
import masalaDosa from '../assets/images/masala-dosa.jpg';
import choleBhature from '../assets/images/chole-bhature.jpg';
import rajmaChawal from '../assets/images/rajma-chawal-1.jpg';
import paneerTikka from '../assets/images/paneer-tika.webp';
import gulabJamun from '../assets/images/gulab-jamun.webp';
import pooriSabji from '../assets/images/poori-sabji.webp';
import roganJosh from '../assets/images/rogan-josh.jpg';
import { color } from 'framer-motion';

export const popularDishes = [
  { id: 1, image: butterChicken, name: "Gà bơ Ấn Độ", numberOfOrders: 250 },
  { id: 2, image: palakPaneer, name: "Phô mai rau bina", numberOfOrders: 190 },
  { id: 3, image: biryani, name: "Cơm gà Biryani", numberOfOrders: 300 },
  { id: 4, image: masalaDosa, name: "Bánh Dosa cà ri", numberOfOrders: 220 },
  { id: 5, image: choleBhature, name: "Bánh chiên đậu cà ri", numberOfOrders: 270 },
  { id: 6, image: rajmaChawal, name: "Cơm đậu đỏ Ấn Độ", numberOfOrders: 180 },
  { id: 7, image: paneerTikka, name: "Phô mai nướng Tikka", numberOfOrders: 210 },
  { id: 8, image: gulabJamun, name: "Bánh sữa Gulab Jamun", numberOfOrders: 310 },
  { id: 9, image: pooriSabji, name: "Bánh Poori & cà ri rau", numberOfOrders: 140 },
  { id: 10, image: roganJosh, name: "Cà ri cừu Rogan Josh", numberOfOrders: 160 },
];



export const tables = [
  { id: 1, name: "Table 1", status: "Booked", initial: "AM", seats: 4 },
  { id: 2, name: "Table 2", status: "Available", initial: "MB", seats: 6 },
  { id: 3, name: "Table 3", status: "Booked", initial: "JS", seats: 2 },
  { id: 4, name: "Table 4", status: "Available", initial: "HR", seats: 4 },
  { id: 5, name: "Table 5", status: "Booked", initial: "PL", seats: 3 },
  { id: 6, name: "Table 6", status: "Available", initial: "RT", seats: 4 },
  { id: 7, name: "Table 7", status: "Booked", initial: "LC", seats: 5 },
  { id: 8, name: "Table 8", status: "Available", initial: "DP", seats: 5 },
  { id: 9, name: "Table 9", status: "Booked", initial: "NK", seats: 6 },
  { id: 10, name: "Table 10", status: "Available", initial: "SB", seats: 6 },
  { id: 11, name: "Table 11", status: "Booked", initial: "GT", seats: 4 },
  { id: 12, name: "Table 12", status: "Available", initial: "JS", seats: 6 },
  { id: 13, name: "Table 13", status: "Booked", initial: "EK", seats: 2 },
  { id: 14, name: "Table 14", status: "Available", initial: "QN", seats: 6 },
  { id: 15, name: "Table 15", status: "Booked", initial: "TW", seats: 3 }
];

export const startersItem = [
  { id: 1, name: "Phô mai nướng Tikka", price: 59000, category: "Chay" },
  { id: 2, name: "Gà nướng Tikka", price: 69000, category: "Mặn" },
  { id: 3, name: "Gà nướng Tandoori", price: 79000, category: "Mặn" },
  { id: 4, name: "Bánh samosa nhân khoai", price: 25000, category: "Chay" },
  { id: 5, name: "Bánh khoai tây chiên", price: 30000, category: "Chay" },
  { id: 6, name: "Chả rau củ nướng", price: 55000, category: "Chay" },
];


export const mainCourse = [
  { id: 1, name: "Gà sốt bơ", price: 129000, category: "Mặn" },
  { id: 2, name: "Phô mai sốt bơ", price: 109000, category: "Chay" },
  { id: 3, name: "Cơm gà Biryani", price: 139000, category: "Mặn" },
  { id: 4, name: "Đậu hầm kem (Dal Makhani)", price: 69000, category: "Chay" },
  { id: 5, name: "Phô mai xào cay", price: 99000, category: "Chay" },
  { id: 6, name: "Cà ri cừu Rogan Josh", price: 159000, category: "Mặn" },
];


export const beverages = [
  { id: 1, name: "Trà sữa Masala", price: 25000, category: "Nóng" },
  { id: 2, name: "Soda chanh", price: 30000, category: "Lạnh" },
  { id: 3, name: "Sinh tố xoài sữa chua", price: 39000, category: "Lạnh" },
  { id: 4, name: "Cà phê đá", price: 29000, category: "Lạnh" },
  { id: 5, name: "Nước chanh tươi", price: 22000, category: "Lạnh" },
  { id: 6, name: "Trà đào lạnh", price: 27000, category: "Lạnh" },
];


export const soups = [
  { id: 1, name: "Súp cà chua", price: 35000, category: "Chay" },
  { id: 2, name: "Súp bắp ngọt", price: 39000, category: "Chay" },
  { id: 3, name: "Súp chua cay", price: 42000, category: "Chay" },
  { id: 4, name: "Súp gà trong", price: 49000, category: "Mặn" },
  { id: 5, name: "Súp nấm", price: 45000, category: "Chay" },
  { id: 6, name: "Súp chanh ngò", price: 35000, category: "Chay" },
];


export const desserts = [
  { id: 1, name: "Bánh sữa Gulab Jamun", price: 29000, category: "Chay" },
  { id: 2, name: "Kem sữa Kulfi", price: 39000, category: "Chay" },
  { id: 3, name: "Bánh chocolate tan chảy", price: 59000, category: "Chay" },
  { id: 4, name: "Bánh sữa Ras Malai", price: 45000, category: "Chay" },
];


export const pizzas = [
  { id: 1, name: "Pizza phô mai Margherita", price: 129000, category: "Chay" },
  { id: 2, name: "Pizza rau củ đặc biệt", price: 139000, category: "Chay" },
  { id: 3, name: "Pizza xúc xích Pepperoni", price: 159000, category: "Mặn" },
];


export const alcoholicDrinks = [
  { id: 1, name: "Bia lon", price: 35000, category: "Có cồn" },
  { id: 2, name: "Rượu Whiskey", price: 89000, category: "Có cồn" },
  { id: 3, name: "Rượu Vodka", price: 79000, category: "Có cồn" },
  { id: 4, name: "Rượu Rum", price: 69000, category: "Có cồn" },
  { id: 5, name: "Rượu Tequila", price: 99000, category: "Có cồn" },
  { id: 6, name: "Cocktail trái cây", price: 75000, category: "Có cồn" },
];


export const salads = [
  { id: 1, name: "Salad Caesar", price: 59000, category: "Chay" },
  { id: 2, name: "Salad Hy Lạp", price: 65000, category: "Chay" },
  { id: 3, name: "Salad trái cây", price: 45000, category: "Chay" },
  { id: 4, name: "Salad gà", price: 79000, category: "Mặn" },
  { id: 5, name: "Salad cá ngừ", price: 89000, category: "Mặn" },
];



export const menus = [
  { id: 1, name: "Khai vị", bgColor: "#b73e3e", icon: "🍲", items: startersItem },
  { id: 2, name: "Món chính", bgColor: "#5b45b0", icon: "🍛", items: mainCourse },
  { id: 3, name: "Nước uống", bgColor: "#7f167f", icon: "🍹", items: beverages },
  { id: 4, name: "Súp", bgColor: "#735f32", icon: "🍜", items: soups },
  { id: 5, name: "Tráng miệng", bgColor: "#1d2569", icon: "🍰", items: desserts },
  { id: 6, name: "Pizzas", bgColor: "#285430", icon: "🍕", items: pizzas },
  { id: 7, name: "Đồ uống có cồn", bgColor: "#b73e3e", icon: "🍺", items: alcoholicDrinks },
  { id: 8, name: "Salads", bgColor: "#5b45b0", icon: "🥗", items: salads }
]

export const metricsData = [
  {
    title: "Doanh thu",
    value: "₫50.846.900",
    percentage: "12%",
    color: "#025cca",
    isIncrease: false
  },
  {
    title: "Lượt nhấp",
    value: "10.342",
    percentage: "16%",
    color: "#02ca3a",
    isIncrease: true
  },
  {
    title: "Tổng khách hàng",
    value: "19.720",
    percentage: "10%",
    color: "#f6b100",
    isIncrease: true
  },
  {
    title: "Số đơn hàng",
    value: "20.000",
    percentage: "10%",
    color: "#be3e3f",
    isIncrease: false
  },
];


export const itemsData = [
  {
    title: "Tổng danh mục",
    value: "8",
    percentage: "12%",
    color: "#5b45b0",
    isIncrease: false
  },
  {
    title: "Tổng số món",
    value: "50",
    percentage: "12%",
    color: "#285430",
    isIncrease: true
  },
  {
    title: "Đơn đang hoạt động",
    value: "12",
    percentage: "12%",
    color: "#735f32",
    isIncrease: true
  },
  {
    title: "Tổng số bàn",
    value: "10",
    color: "#7f167f"
  }
];


export const orders = [
  {
    id: "101",
    customer: "Amrit Raj",
    status: "Ready",
    dateTime: "January 18, 2025 08:32 PM",
    items: 8,
    tableNo: 3,
    total: 250.0,
  },
  {
    id: "102",
    customer: "John Doe",
    status: "In Progress",
    dateTime: "January 18, 2025 08:45 PM",
    items: 5,
    tableNo: 4,
    total: 180.0,
  },
  {
    id: "103",
    customer: "Emma Smith",
    status: "Ready",
    dateTime: "January 18, 2025 09:00 PM",
    items: 3,
    tableNo: 5,
    total: 120.0,
  },
  {
    id: "104",
    customer: "Chris Brown",
    status: "In Progress",
    dateTime: "January 18, 2025 09:15 PM",
    items: 6,
    tableNo: 6,
    total: 220.0,
  },
];