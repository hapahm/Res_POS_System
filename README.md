              ┌────────────────────────────────────────┐
              │         FRONTEND (React + Vite)        │
              └────┬──────────────────────────────┬────┘
                   │                              │
     RESTful APIs  │                              │  WebSockets (Socket.IO)
     (Axios HTTP)  │                              │  (Real-time Events)
                   ▼                              ▼
              ┌────────────────────────────────────────┐
              │       BACKEND (Node.js + Express)      │
              └────┬──────────────────────────────┬────┘
                   │                              │
     Integrations  │                              │  Database Layer
                   ▼                              ▼
         ┌───────────────────┐          ┌───────────────────┐
         │ 🤖 OpenAI API     │          │ 🍃 MongoDB        │
         │ 💳 VNPAY Sandbox  │          │    (Mongoose ODM) │
         │ 💳 Razorpay Gateway          └───────────────────┘
         └───────────────────┘

---

## 🚀 Các Tính Năng Cốt Lõi

### 1. 📲 Quản Lý Gọi Món & Hiển Thị Nhà Bếp (POS & KDS Flow)
* **Menu & Order Management:** Giao diện gọi món trực quan, phân loại danh mục món ăn linh hoạt, hỗ trợ tạo đơn theo từng bàn (`tableId`).
* **Real-time Kitchen Display System (KDS):** Đơn hàng từ POS tự động đẩy xuống màn hình nhà bếp (`/kitchen`) lập tức.
* **Hủy món thời gian thực (Item Cancellation):** Hỗ trợ hủy món trực tiếp từ màn hình Menu. Khi một món bị hủy, sự kiện `item_cancelled` lập tức phát tới KDS để cập nhật UI đặc biệt (gạch ngang chữ `line-through`, đổi nền xám, giảm độ mờ 50%) giúp đầu bếp nhận biết ngay mà không cần tải lại trang.

### 2. 💳 Cổng Thanh Thanh Toán Đa Dạng (Advanced Payment Gateway)
Hệ thống quản lý trạng thái hóa đơn tập trung thông qua `paymentModel.js`:
* **Tiền mặt (Cash):** Xử lý tại quầy bởi Admin/Staff, cập nhật trạng thái bàn sang đã thanh toán thông qua cơ chế `markTablePaid()`.
* **Tích hợp VNPAY (Mới):** Tạo link thanh toán động mã hóa bảo mật SHA512, tự động redirect qua cổng Sandbox của VNPAY. Hệ thống xử lý dữ liệu trả về song song qua 2 luồng: **Return URL** (đồng bộ phía Client) và **IPN Webhook** (bảo mật ngầm phía Server). Đảm bảo kiểm tra chéo số tiền (Amount Validation) và chống trùng lặp giao dịch (Idempotent Transaction).
* **Tương Thích Ngược Razorpay:** Duy trì toàn bộ luồng xử lý và webhook của hệ thống Razorpay cũ, đảm bảo các log giao dịch cũ hoạt động ổn định.

### 3. 🤖 Trợ Lý Ảo Lai Thông Minh (Hybrid AI Chatbot)
Kiến trúc xử lý tin nhắn 3 tầng tối ưu chi phí vận hành (Chỉ tốn ~$3-$5/tháng cho tần suất 1000 cuộc hội thoại/ngày):
* **Tầng 1 - Khớp từ khóa cố định (Rule-Based Matching | Miễn phí | <1ms):** Tự động phản hồi các câu hỏi tần suất cao như: giờ mở cửa, địa chỉ, thực đơn.
* **Tầng 2 - Trí tuệ nhân tạo (AI Classification & Parameter Extraction | ~$0.0005 | ~500ms):** Chuyển tiếp các câu thoại tự nhiên đến mô hình `gpt-3.5-turbo` của OpenAI để phân tích ý định (Intent). Nếu khách hỏi về đơn hàng hoặc bàn trống, AI sẽ tự động bóc tách tham số (`orderId`, `tableNumber`), thực hiện truy vấn trực tiếp vào MongoDB để trả về câu trả lời chính xác theo thời gian thực.
* **Tầng 3 - Phòng ngự & Chuyển giao (Human Handoff):** Tự động chuyển hướng cuộc hội thoại tới nhân viên trực thông qua Staff Panel (`/staff/chat`) trong trường hợp AI bị timeout (10 giây), lỗi kết nối API hoặc khi khách hàng yêu cầu gặp người thật.

### 4. 📊 Dashboard Báo Cáo Doanh Thu (Data-Driven Metrics)
* **Thống kê thời gian thực:** Toàn bộ chỉ số tổng doanh thu (VND), tổng đơn hàng, tổng khách hàng, tổng món ăn, số lượng bàn hoạt động đều được tính toán bằng các hàm Aggregate trực tiếp từ cơ sở dữ liệu (MongoDB).
* **Xuất Báo Cáo Excel Chuyên Nghiệp:** Tích hợp tính năng xuất file báo cáo tổng hợp định dạng Excel (`.xlsx`) gồm 3 Worksheet phân tách: Tổng quan dòng tiền (Overview), Thống kê hiệu suất món ăn (Dish Stats), và Hiệu suất danh mục (Category Stats) kèm cấu hình style tiêu đề chuyên nghiệp.

---

## 📁 Cấu Trúc File Dự Án Cốt Lõi

Res_POS_System/
├── pos-backend/                # SOURCE CODE BACKEND (Node.js/Express)
│   ├── config/                 # Cấu hình môi trường và cấu hình cổng VNPAY
│   ├── controllers/            # Logic nghiệp vụ (Payment, Report, Order, Dish)
│   ├── models/                 # Mongoose Schemas (paymentModel, orderModel, tableModel, chatMessage)
│   ├── routes/                 # RESTful API Endpoints
│   ├── sockets/                # Trình điều hướng Socket.IO (chat.socket.js, kitchen.socket.js)
│   ├── services/               # Tầng dịch vụ thông minh (ai.service.js, chatbot.service.js)
│   └── .env.example            # Bản mẫu cấu hình biến môi trường hệ thống
│
└── pos-frontend/               # SOURCE CODE FRONTEND (React + Vite)
├── src/
│   ├── components/         # Các thành phần UI tái sử dụng (Dashboard, Chat, KitchenCard)
│   ├── https/              # Trình wrapper gọi API (Axios instance & endpoint helpers)
│   ├── pages/              # Trang giao diện chính (/staff/chat, /chat/test, /kitchen, /menu)
│   └── redux/              # Centralized State Management (chatSlice, orderSlice)

---

🧪 Quy Trình Kiểm Thử Các Tính Năng Hệ Thống
1. Luồng Chat Hỗ Trợ Kép (Staff <=> Customer)
Mở đồng thời hai cửa sổ ẩn danh trên trình duyệt để kiểm tra tính năng đồng bộ tin nhắn cực hạn:

Cửa sổ 1 (Nhân viên trực): Truy cập http://localhost:5173/staff/chat, đăng nhập và bật nút trạng thái sang Online (Xanh) để kích hoạt kết nối phòng trực staff_room.

Cửa sổ 2 (Giả lập Khách hàng): Truy cập http://localhost:5173/chat/test (Trang test simulator không cần đăng nhập, tự động sinh mã khách ngẫu nhiên).

Kịch bản test:

Test Rule-Based: Tại tab Khách hàng nhập "Nhà hàng mở cửa lúc mấy giờ?" -> Hệ thống phản hồi ngay tức thì (<1ms) không tốn phí API OpenAI.

Test AI Trích Xuất Dữ Liệu: Nhập "Kiểm tra hộ tôi đơn hàng ORD001 xem đã làm xong chưa" -> Xem terminal backend để thấy AI bóc tách orderId: ORD001, tự động tìm trong DB và trả về trạng thái món ăn.

Test Gọi Nhân Viên: Nhập "Tôi muốn gặp nhân viên" hoặc nhập chuỗi ký tự rác liên tục -> Hệ thống tự động kích hoạt luồng CALL_STAFF, thông báo đẩy lập tức hiển thị bên màn hình Staff để nhân viên bấm nút nhận chat.

2. Quy Trình Thanh Toán VNPAY
Đăng nhập tài khoản quyền Admin/Staff, tại mục Quản lý bàn/Đơn hàng, các đơn chưa thanh toán sẽ có nhãn màu vàng pending.

Click chọn trạng thái đơn hàng -> Hệ thống điều hướng sang trang thanh toán chi tiết /payment.

Chọn phương thức Bank (VNPAY) -> Click thanh toán -> Hệ thống tự động sinh mã hóa bảo mật, ký SHA512 và đưa người dùng tới giao diện thanh toán Sandbox của VNPAY.

Sử dụng thông tin thẻ thử nghiệm do VNPAY cung cấp (Ví dụ: Ngân hàng Thử nghiệm NCB) để tiến hành OTP giả lập.

Sau khi hoàn tất giao dịch, VNPAY điều hướng trở lại trang /payment-result, đồng thời Webhook IPN chạy ngầm lập tức đổi trạng thái đơn hàng từ pending sang paid trên toàn hệ thống.

3. Luồng Hủy Món Nhà Bếp (KDS)
Mở song song màn hình Menu gọi món http://localhost:5173/menu và màn hình nhà bếp http://localhost:5173/kitchen.

Tiến hành đặt đơn gồm 3 món từ Menu -> Màn hình nhà bếp lập tức hiển thị thẻ món ăn (Kitchen Card) theo thời gian thực nhờ kết nối Socket.

Tại giao diện Menu, bấm vào biểu tượng thùng rác (🗑️) tại 1 món bất kỳ trong đơn vừa gọi để thực hiện hủy món.

Quan sát màn hình KDS, món ăn đó lập tức thay đổi hiệu ứng hiển thị (gạch ngang, mờ đi) mà không cần F5 tải lại trang, giúp nhà bếp tránh việc làm nhầm món đã hủy.

🔒 Quản Lý Trạng Thái Thanh Toán Tiêu Chuẩn
Mọi giao dịch điện tử trong cơ sở dữ liệu hệ thống được đồng bộ hóa nghiêm ngặt theo các trạng thái (Enum) sau:

pending: Đơn hàng vừa khởi tạo, đang chờ quét mã QR hoặc xử lý quẹt thẻ.

paid: Giao dịch thành công, tiền đã ghi nhận, hệ thống khóa nút thanh toán để tránh lặp lệnh.

failed: Người dùng chủ động hủy giao dịch tại cổng thanh toán hoặc thẻ bị từ chối.

expired: Quá thời hạn thực hiện phiên giao dịch bảo mật do VNPAY quy định.

refunded: Trạng thái đơn hàng đã được thực hiện hoàn tiền thành công (Hỗ trợ cấu hình sẵn model).
"""