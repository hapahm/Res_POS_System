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

## 🚀 Tính Năng Nổi Bật

### 🍽️ Quản Lý Gọi Món & Nhà Bếp (POS & KDS)

* Quản lý thực đơn, bàn ăn và đơn hàng trên một giao diện trực quan.
* Hỗ trợ tạo và cập nhật đơn hàng theo từng bàn.
* Đồng bộ đơn hàng giữa quầy phục vụ và nhà bếp theo thời gian thực bằng Socket.IO.
* Hỗ trợ hủy món trực tiếp từ giao diện gọi món, trạng thái được cập nhật ngay trên màn hình nhà bếp mà không cần tải lại trang.

---

### 💳 Thanh Toán Đa Phương Thức

* Hỗ trợ thanh toán bằng tiền mặt.
* Tích hợp cổng thanh toán VNPAY.
* Hỗ trợ Razorpay cho các giao dịch trực tuyến.
* Tự động cập nhật trạng thái thanh toán và đồng bộ dữ liệu đơn hàng trên toàn hệ thống.
* Quản lý các trạng thái giao dịch: `pending`, `paid`, `failed`, `expired`, `refunded`.

---

### 🤖 Chatbot Hỗ Trợ Khách Hàng

* Tự động trả lời các câu hỏi thường gặp như giờ mở cửa, địa chỉ và thực đơn.
* Hỗ trợ tra cứu thông tin đơn hàng và trạng thái bàn.
* Kết hợp AI và dữ liệu hệ thống để cung cấp phản hồi chính xác hơn.
* Cho phép chuyển cuộc trò chuyện sang nhân viên khi khách hàng cần hỗ trợ trực tiếp.

---

### 💬 Chat Thời Gian Thực

* Hỗ trợ nhắn tin trực tiếp giữa khách hàng và nhân viên.
* Đồng bộ tin nhắn theo thời gian thực bằng WebSocket.
* Quản lý lịch sử hội thoại và trạng thái hỗ trợ khách hàng.

---

### 📊 Dashboard & Báo Cáo

* Thống kê doanh thu, đơn hàng, khách hàng và món ăn.
* Hiển thị dữ liệu trực quan theo thời gian thực.
* Xuất báo cáo Excel để phục vụ quản lý và đối soát dữ liệu.
* Theo dõi hiệu suất món ăn và danh mục sản phẩm.

---

### 🔐 Phân Quyền & Bảo Mật

* Xác thực người dùng bằng JWT.
* Phân quyền theo vai trò: Admin, Staff và Customer.
* Bảo vệ các API và chức năng quản trị hệ thống.

---
---

## 🧪 Hướng Dẫn Kiểm Thử Hệ Thống

### 💬 Chat Hỗ Trợ Khách Hàng

Mở đồng thời hai trình duyệt hoặc hai cửa sổ ẩn danh:

* **Nhân viên:** `/staff/chat`
* **Khách hàng:** `/chat/test`

Kiểm tra các chức năng:

* Gửi câu hỏi phổ biến để nhận phản hồi tự động.
* Hỏi trạng thái đơn hàng để kiểm tra khả năng truy vấn dữ liệu.
* Yêu cầu gặp nhân viên để kiểm tra tính năng chuyển tiếp cuộc trò chuyện theo thời gian thực.

---

### 💳 Thanh Toán VNPAY

1. Tạo một đơn hàng chưa thanh toán.
2. Truy cập trang thanh toán.
3. Chọn phương thức **VNPAY**.
4. Thực hiện thanh toán bằng tài khoản thử nghiệm của VNPAY Sandbox.
5. Xác nhận:

   * Giao dịch được xử lý thành công.
   * Trạng thái đơn hàng chuyển từ `pending` sang `paid`.
   * Dữ liệu được đồng bộ tự động trên toàn hệ thống.

---

### 🍳 Màn Hình Nhà Bếp (KDS)

Mở đồng thời:

* Trang gọi món: `/menu`
* Trang nhà bếp: `/kitchen`

Thực hiện các bước:

1. Tạo đơn hàng mới từ giao diện gọi món.
2. Kiểm tra đơn hàng hiển thị ngay trên màn hình nhà bếp.
3. Hủy một món trong đơn hàng.
4. Xác nhận món ăn được cập nhật trạng thái hủy theo thời gian thực mà không cần tải lại trang.

---

## 🔒 Trạng Thái Thanh Toán

| Trạng thái | Mô tả                           |
| ---------- | ------------------------------- |
| `pending`  | Đang chờ thanh toán             |
| `paid`     | Thanh toán thành công           |
| `failed`   | Thanh toán thất bại hoặc bị hủy |
| `expired`  | Phiên thanh toán hết hạn        |
| `refunded` | Đã hoàn tiền                    |

```
```
