# Quick Test Steps

## Prerequisites
- Backend running: `npm start` in `pos-backend` folder (should see "listening on port 8000")
- Frontend running: `npm run dev` in `pos-frontend` folder (should see "Local: http://localhost:5173")
- MongoDB running: `mongod` (should see "listening on 27017")

---

## Test Steps

### Step 1: Open Staff Chat
1. Go to `http://localhost:5173/staff/chat`
2. Login with staff credentials (get from your auth system)
3. Open **DevTools** (F12 → Console tab)
4. You should see these logs:
   ```
   ✅ Socket connected: [socketId]
   📌 Connecting as staff: [staffId]
   🔌 StaffChatPanel: Connecting socket for staff: [staffId]
   🎧 Setting up staff_request listener
   ```

### Step 2: Open Customer Test Chat
1. Open a **new browser window/tab**
2. Go to `http://localhost:5173/chat/test`
3. Open **DevTools** in this window too
4. You should see:
   ```
   ✅ Socket connected: [socketId]
   📌 Connecting as customer: [UUID]
   ```

### Step 3: Trigger Staff Request
1. In the **Customer tab**, in the message input field, type: `I need help`
2. Click "Send" or press Enter
3. Watch both consoles and the backend terminal

**What you should see:**

**Backend Terminal:**
```
📧 Khách hàng gửi tin: "I need help"
💾 Lưu tin từ customer [UUID]...
✅ Tin customer đã lưu (ID: [mongoId])
🤖 Chatbot response: { intent: 'CALL_STAFF', requiresStaff: true, ... }
💾 Lưu tin từ chatbot...
✅ Tin chatbot đã lưu (ID: [mongoId])

📢 === BROADCAST STAFF_REQUEST ===
📊 Staff online: ["[staffId]"]
📊 Staff count: 1
📤 Gửi data: { customerId: "[UUID]", customerName: "Customer [UUID]", message: "Khách hàng yêu cầu hỗ trợ từ nhân viên", ... }
📞 Customer [UUID] yêu cầu gọi staff
===================================
```

**Staff Browser Console (F12):**
```
📨 Message received from customer: { message: "Bot response here", ... }
🆘 STAFF REQUEST RECEIVED: { customerId: "[UUID]", customerName: "Customer [UUID]", ... }
🆘 Staff request received in component: { ... }
📍 Adding customer with ID: [UUID]
```

**Customer Browser Console (F12):**
```
📨 Message received from customer: { message: "🤖 POS Bot: [response]", senderName: "🤖 POS Bot", intent: "CALL_STAFF", ... }
```

### Step 4: Verify Customer Appears in Staff Chat
1. Look at the **Staff Chat interface** (not console, the actual UI)
2. The customer count should change from "0 customer(s)" to "1 customer(s)"
3. The customer should appear in the "Active Customers" list with UUID as the name

### Step 5: Check Database
1. Open MongoDB Compass or mongosh
2. Go to database: `pos` (or whatever your DB name is)
3. Collection: `chatmessages`
4. You should see **2 documents**:
   - Customer message: `{ sender: "[UUID]", message: "I need help", ... }`
   - Chatbot response: `{ sender: "chatbot", message: "...", receiver: "[UUID]", ... }`

---

## Troubleshooting

### ❌ Staff doesn't see customer
1. Check **Backend Terminal** - Look for the staff online count and broadcast section
2. If broadcast section not appearing: Customer isn't triggering `requiresStaff` intent
3. If broadcast section appearing: Check **Staff Console** for "STAFF REQUEST RECEIVED"
4. If staff console doesn't show it: Check Network tab for WebSocket messages

### ❌ Messages not in database
1. Check **Backend Terminal** for error logs starting with `❌ Lỗi khi lưu`
2. If no error: Check MongoDB connection
3. If error appears: It will show full error details and stack trace

### ❌ Customer test page shows error
1. Check **Customer Console** for any red errors
2. Common issue: Backend not running
3. Check backend is accessible: Go to `http://localhost:8000` should show Socket.IO welcome

---

## Success Indicators

✅ All tests pass when:
1. Backend logs show complete broadcast flow
2. Staff console shows "STAFF REQUEST RECEIVED"
3. Staff UI updates to show customer in list
4. Database contains both customer and chatbot messages

