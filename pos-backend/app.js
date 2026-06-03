const express = require("express");
const http = require("http"); // Import http module để tạo server
const { Server } = require("socket.io"); // Import Socket.IO
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const chatSocketHandler = require("./sockets/chat.socket"); // Import chat socket handler
const { kitchenSocketHandler } = require("./sockets/kitchen.socket"); // Import kitchen socket handler
const { setIOInstance } = require("./controllers/orderController"); // Import setIOInstance

const app = express();

const normalizeOrigin = (origin = "") => `${origin || ""}`.trim().replace(/\/+$/, "");
const customerAppOrigin = normalizeOrigin(config.customerAppUrl);
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    customerAppOrigin
].filter(Boolean);

// Tạo HTTP server từ Express app
// Cần thiết để Socket.IO hoạt động cùng Express
const server = http.createServer(app);

// Khởi tạo Socket.IO server với cấu hình CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "OPTIONS"]
    },
    pingInterval: 25000,
    pingTimeout: 60000,
    upgradeTimeout: 10000
});

const PORT = config.port;
connectDB();

// Middlewares
app.use(cors({
    credentials: true,
    origin: allowedOrigins
}))
app.use(express.json()); // parse incoming request in json format
app.use(cookieParser())
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Root Endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Hello from POS Server!",
        socketIO: "Chat module is running ✅"
    });
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));

// Split APIs for admin/customer (new)
app.use("/api/admin/orders", require("./routes/adminOrderRoute"));
app.use("/api/customer/orders", require("./routes/customerOrderRoute"));
app.use("/api/admin/tables", require("./routes/adminTableRoute"));
app.use("/api/customer/tables", require("./routes/customerTableRoute"));

// Legacy APIs for existing admin frontend compatibility
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use("/api/kitchen", require("./routes/kitchenRoute"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/dish", require("./routes/dishRoute"));
app.use("/api/upload", require("./routes/uploadRoute"));
app.use("/api/report", require("./routes/reportRoute"));
app.use("/api/conversations", require("./routes/conversationRoute"));

// Global Error Handler
app.use(globalErrorHandler);

// ==========================================
// SOCKET.IO HANDLER
// ==========================================
// Khởi động chat socket handler
chatSocketHandler(io);
console.log("🔌 Socket.IO chat module initialized");

// Khởi động kitchen socket handler
kitchenSocketHandler(io);
console.log("🍳 Socket.IO kitchen display system initialized");

// Set IO instance in order controller for emitting new orders
setIOInstance(io);
console.log("📤 IO instance set for order controller");

// ==========================================
// SERVER
// ==========================================
// Lưu ý: Dùng server.listen thay vì app.listen
// Vì server đã wrap Express và Socket.IO
server.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
    console.log(`🔌 Socket.IO is ready for connections`);
})