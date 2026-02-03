# 🚀 Chat Feature Testing Guide

## 📋 Implementation Summary

Successfully implemented **chat feature MVP** for Restaurant POS System with:

### ✅ Completed Components

**Frontend Infrastructure:**
- ✅ Socket.IO client wrapper (`src/services/chatSocket.js`)
- ✅ Redux chat slice (`src/redux/slices/chatSlice.js`)
- ✅ Updated Redux store to include chat reducer

**Chat UI Components:**
- ✅ `ChatMessage.jsx` - Individual message with sender info & icons
- ✅ `ChatInput.jsx` - Message input field with send button
- ✅ `ChatMessages.jsx` - Scrollable message container
- ✅ `CustomerList.jsx` - Active customers sidebar
- ✅ `ChatHeader.jsx` - Header with status & online toggle
- ✅ `StaffChatPanel.jsx` - Main staff chat interface

**Pages & Routes:**
- ✅ `Chat.jsx` - Staff chat page (route: `/staff/chat`)
- ✅ `ChatTest.jsx` - Customer test simulator (route: `/chat/test`)
- ✅ Routes integrated into `App.jsx`

---

## 🧪 Testing Instructions

### **Step 1: Start Backend Server**

```bash
cd pos-backend
npm install  # If not already done
npm start
```

Expected output:
```
☑️  POS Server is listening on port 8000
🔌 Socket.IO is ready for connections
✅ MongoDB Connected: 127.0.0.1
```

### **Step 2: Start Frontend Server**

In a new terminal:

```bash
cd pos-frontend
npm install  # If not already done
npm run dev
```

Expected: Frontend runs at `http://localhost:5173`

---

## 🧑‍💼 Test Scenario 1: Staff Chat Interface

### **A. Access Staff Chat**

1. Login to the application with staff credentials
2. Navigate to: `http://localhost:5173/staff/chat`

**Expected:**
- Staff sees "Welcome to Chat Support" message
- "🔴 You are Offline" button visible
- Empty customer list on sidebar

### **B. Toggle Online Status**

1. Click "🔴 You are Offline" button
2. Button should change to "🟢 You are Online"

**Expected:**
- Backend logs: `👨‍💼 Staff [userId] đã online`
- Staff is now able to receive messages from customers

### **C. Receive Customer Message**

1. Open another browser tab/window
2. Navigate to: `http://localhost:5173/chat/test` (see Test Scenario 2)
3. Customer sends a message: "Hello, can I get a menu?"

**Expected:**
- Staff sees customer appear in the "Active Chats" list
- Customer message visible in chat area
- Backend logs show message routing

---

## 👥 Test Scenario 2: Customer Test Simulator

### **A. Access Customer Test Page**

1. Open: `http://localhost:5173/chat/test`

**Expected:**
- Page shows: "Test Mode" with Customer ID
- Connection status: "⏳ Connecting..." (changes to "✅ Connected" when socket connects)
- Empty chat area with message "No messages yet"

### **B. Send Message to Bot (No Staff Online)**

1. In ChatTest page, type: "What are your hours?"
2. Click "Send"

**Expected:**
- Message appears in chat with `senderRole: "customer"`
- After 1-2 seconds, chatbot responds with an automated reply
- Backend logs: `🤖 Chatbot trả lời customer [userId] (Intent: hours)`

### **C. Send Message to Staff (Staff Online)**

1. Make sure staff is online (green status in `/staff/chat`)
2. In ChatTest page, type: "I need help with my order"
3. Click "Send"

**Expected:**
- Customer message appears
- Staff receives message in `/staff/chat` page
- Message appears in staff's customer list
- Staff can click customer to select and see conversation

### **D. Staff Replies to Customer**

1. In `/staff/chat` (staff interface), click on customer in list
2. Type: "Hello! How can I help you today?"
3. Click "Send"

**Expected:**
- Staff message appears in staff's chat area
- Customer (in `/chat/test`) receives message
- Customer sees "🟢 Staff" badge on message
- Conversation is visible to both parties in real-time

---

## 🔗 Event Flow Verification

### **Customer Message → Bot Response Flow:**

```
Customer sends: "Hello"
    ↓
Frontend: socket.emit('user_connect', {userId, role: 'customer'})
    ↓
Backend receives on 'send_message'
    ↓
Backend checks: No staff online?
    ↓
Backend calls: ChatbotService.classifyAndRespond("Hello")
    ↓
Backend saves ChatMessage to MongoDB
    ↓
Backend emits: socket.emit('receive_message', {...botResponse})
    ↓
Customer receives: bot reply in real-time
```

### **Customer Message → Staff Response Flow:**

```
Customer sends: "Hello"
    ↓
Backend checks: Staff online? YES
    ↓
Backend saves ChatMessage (senderRole: 'customer')
    ↓
Backend emits to staff: socket.to('user_[staffId]').emit('receive_message')
    ↓
Staff sees message in StaffChatPanel
    ↓
Staff clicks customer → acceptChat() emitted
    ↓
Staff types reply + sends
    ↓
Backend emits to customer: socket.to('user_[customerId]').emit('receive_message')
    ↓
Customer sees staff reply in real-time
```

---

## ✅ Checklist: What to Verify

### **UI/UX:**
- [ ] Messages display with sender role (customer/staff/bot)
- [ ] Different colors for different sender types
- [ ] Message timestamps show correctly
- [ ] Scroll auto-jumps to latest message
- [ ] Input field clears after sending
- [ ] Online/offline toggle changes button color
- [ ] Customer list shows active conversations
- [ ] Mobile responsive (sidebar hides when in chat on mobile)

### **Real-time Communication:**
- [ ] Customer message reaches staff < 1 second
- [ ] Staff message reaches customer < 1 second
- [ ] Bot response appears < 2 seconds when no staff online
- [ ] Socket reconnection works when connection drops
- [ ] Multiple customers can chat simultaneously
- [ ] Staff can switch between customers

### **Database:**
- [ ] Messages saved to MongoDB in `chat_messages` collection
- [ ] `conversationId` properly stored
- [ ] `senderRole` correctly set (customer/staff)
- [ ] Timestamps recorded accurately

### **Console Logs (Verify Backend):**
- [ ] "🔌 Client mới kết nối: [socketId]"
- [ ] "👨‍💼 Staff [userId] đã online"
- [ ] "💬 Tin từ customer → staff"
- [ ] "🤖 Chatbot trả lời"

---

## 🐛 Troubleshooting

### **Issue: Customer can't connect to socket**

**Solution:**
- Verify backend is running on port 8000
- Check VITE_BACKEND_URL in frontend `.env` = `http://localhost:8000`
- Check browser console for connection errors
- Verify CORS is enabled (Socket.IO should handle this)

### **Issue: Messages not appearing in real-time**

**Solution:**
- Check backend logs for event names (should be `send_message`, not `customer:message`)
- Verify socket connection successful: browser console shows "✅ Socket connected"
- Check if `userId` is properly passed in socket connection
- Verify MongoDB is running

### **Issue: Staff sees no customers in list**

**Solution:**
- Customer must send a message first (socket.emit('send_message'))
- Staff must have socketConnected = true in Redux
- Check backend staffOnlineMap tracking

### **Issue: Chatbot not responding**

**Solution:**
- Verify no staff is online (chatbot only responds when staff = 0)
- Check ChatbotService in backend is properly imported
- Check backend logs for "🤖 Chatbot trả lời" message
- Verify message content isn't filtering (check chatbot rules)

---

## 📁 File Structure Created

```
src/
├── services/
│   └── chatSocket.js                 ← Socket.IO wrapper
├── components/chat/
│   ├── ChatMessage.jsx               ← Single message component
│   ├── ChatInput.jsx                 ← Message input
│   ├── ChatMessages.jsx              ← Message list container
│   ├── ChatHeader.jsx                ← Header with status
│   ├── CustomerList.jsx              ← Customer sidebar
│   └── StaffChatPanel.jsx            ← Main staff interface
├── pages/
│   ├── Chat.jsx                      ← Staff chat page
│   └── ChatTest.jsx                  ← Customer test simulator
├── redux/slices/
│   └── chatSlice.js                  ← Redux chat state
└── App.jsx                           ← Updated with chat routes
```

---

## 🎯 Next Steps (After MVP Testing)

1. **Database Optimization:**
   - Add indexes to `conversationId` for faster queries
   - Implement message pagination for long conversations
   - Add `isRead` status for unread message badges

2. **UX Improvements:**
   - Show typing indicators ("Customer is typing...")
   - Message read receipts
   - Customer online/offline status
   - Notification sounds for new messages

3. **Customer Website:**
   - Build standalone customer-facing website
   - Integrate chat as widget
   - Support order tracking in chat context
   - Add menu browsing alongside chat

4. **Staff Features:**
   - Ability to handle multiple chats
   - Chat history search
   - Conversation tags/labels
   - Team assignment for chats

5. **Analytics:**
   - Track response times
   - Chat duration metrics
   - Customer satisfaction surveys
   - Common questions report

---

## 💡 Tips for Testing

**For realistic testing:**
- Open 2-3 browser windows:
  - Window 1: Staff chat (`/staff/chat`)
  - Window 2: Customer 1 test (`/chat/test`)
  - Window 3: Customer 2 test (`/chat/test`)
- Use browser DevTools Console to watch socket events
- Monitor MongoDB with MongoDB Compass to see messages saved
- Check backend terminal logs for event flow

**Test edge cases:**
- Send very long messages (> 500 characters)
- Send rapid messages (spam test)
- Close browser tab and reconnect
- Go offline then online
- Test with multiple staff members

---

## 📞 Support

For issues or questions:
1. Check console logs (both frontend browser console & backend terminal)
2. Verify MongoDB is running: `mongod`
3. Verify ports: Backend 8000, Frontend 5173
4. Check `.env` files have correct URLs
5. Clear browser cache and restart servers

Happy Testing! 🎉
