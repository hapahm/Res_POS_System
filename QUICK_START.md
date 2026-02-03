# ⚡ Quick Start Guide - Chat Feature

## 🚀 Get Running in 5 Minutes

### **1. Terminal 1 - Backend**
```bash
cd d:\KHOA LUAN TOT NGHIEP\Restaurant_POS_System\pos-backend
npm start
```
Expected output:
```
☑️  POS Server is listening on port 8000
🔌 Socket.IO is ready for connections
✅ MongoDB Connected: 127.0.0.1
```

### **2. Terminal 2 - Frontend**
```bash
cd d:\KHOA LUAN TOT NGHIEP\Restaurant_POS_System\pos-frontend
npm run dev
```
Expected output:
```
> vite
VITE v6.x.x

Local: http://localhost:5173
```

---

## 🧪 Test Chat in 3 Windows

### **Window 1: Staff Chat Interface**
```
http://localhost:5173/auth          (Login)
↓
http://localhost:5173/staff/chat    (Staff chat page)
↓
Click "🔴 You are Offline" to toggle online
```

### **Window 2: Customer Test (Simulator)**
```
http://localhost:5173/chat/test     (Opens immediately, no login)
↓
Type: "Hello! Can I see the menu?"
↓
Send and watch for chatbot response OR staff response
```

### **Window 3: Another Customer (Optional)**
```
http://localhost:5173/chat/test     (Each opens new conversation)
↓
Or: http://localhost:5173/chat/test?userId=test2&name=John
↓
Send messages to test multiple concurrent chats
```

---

## 📝 Test Scenarios (Copy-Paste)

### **Scenario A: Bot Response (No Staff)**

**Window 1 (Staff Chat):**
- ✅ Make sure you see "🔴 You are Offline"
- ✅ No customers should appear in sidebar

**Window 2 (Customer Test):**
```
Type: "What time do you close?"
Send
↓ Wait 1-2 seconds...
↓ See bot response appear
✅ SUCCESS: Bot replied!
```

### **Scenario B: Staff Response (Staff Online)**

**Window 1 (Staff Chat):**
- ✅ Toggle to "🟢 You are Online"
- See customer appear in sidebar

**Window 2 (Customer Test):**
```
Type: "I need help with my order"
Send
↓ Check Window 1...
↓ See customer message appear in staff chat
↓ Type reply in staff chat: "Sure! What order?"
↓ Send
```

**Back to Window 2 (Customer Test):**
```
✅ See staff reply appear in real-time!
```

### **Scenario C: Multiple Customers**

**Window 1 (Staff Chat):**
- ✅ Online status: "🟢 You are Online"

**Window 2 (Customer A):**
```
Send: "Table 5 here"
```

**Window 3 (Customer B):**
```
Send: "When's the food ready?"
```

**Back to Window 1 (Staff Chat):**
```
✅ Both customers appear in sidebar
✅ Click each to see their messages
✅ Reply to each customer
```

---

## 🔍 Verify Everything Works

### **Check Backend Terminal Output:**
```
✅ Should see these log lines:

🔌 Client mới kết nối: [socketId]
👨‍💼 Staff [userId] đã online
💬 Tin từ customer → staff
🤖 Chatbot trả lời customer
```

### **Check Frontend Browser Console:**
```
✅ Should see (F12 → Console):

✅ Socket connected: [socketId]
✅ Authentication successful
Message received: {...}
```

### **Check MongoDB (Optional):**
```bash
# In MongoDB Compass or mongosh:
use pos_db
db.chat_messages.find().pretty()

# Should see documents with:
# - conversationId
# - senderRole: "customer" | "staff"
# - message: "..."
# - timestamp
```

---

## ⚠️ Common Issues & Quick Fixes

### **"Cannot GET /staff/chat"**
- ✅ Make sure you're logged in first
- ✅ Try: http://localhost:5173/auth → login → then /staff/chat

### **"Waiting for connection..." stays on ChatTest**
- ✅ Backend not running? Check Terminal 1
- ✅ Backend on wrong port? Should be 8000
- ✅ Check VITE_BACKEND_URL in `.env`: `http://localhost:8000`

### **Customer appears in staff list but no messages show**
- ✅ Customer might be offline (check timestamp)
- ✅ Try refreshing both pages
- ✅ Check backend logs for errors

### **Messages not syncing between windows**
- ✅ Check browser console for socket errors (F12)
- ✅ Restart frontend: `Ctrl+C` and `npm run dev`
- ✅ Restart backend: `Ctrl+C` and `npm start`

---

## 📊 What to Watch For

### **Real-Time Success Signs:**
- ✅ Message appears in < 1 second
- ✅ Multiple windows update simultaneously
- ✅ No page refresh needed
- ✅ Online/offline status updates immediately
- ✅ Customer list appears when message sent

### **Backend Working Signs:**
- ✅ Port 8000 not blocked
- ✅ MongoDB running
- ✅ Terminal logs show connections
- ✅ No "Error" or "undefined" in logs

### **Frontend Working Signs:**
- ✅ No 404 errors
- ✅ Socket says "connected"
- ✅ Console shows no JavaScript errors
- ✅ Buttons are clickable

---

## 🎯 Feature Checklist

After testing, verify these work:

### **Staff Interface:**
- [ ] Can login and reach `/staff/chat`
- [ ] Online toggle changes color (green/red)
- [ ] Customer appears in sidebar when they send message
- [ ] Can click customer to view conversation
- [ ] Can type and send reply
- [ ] Reply appears in customer window instantly

### **Customer Test Page:**
- [ ] Page loads without login at `/chat/test`
- [ ] Shows "Connected" status
- [ ] Can type and send message
- [ ] Message appears with "Customer" badge
- [ ] Can see incoming messages from staff/bot
- [ ] Shows unique Customer ID

### **Real-Time (Both Pages):**
- [ ] Message syncs without page refresh
- [ ] Multiple windows/tabs update together
- [ ] Timestamps show correctly
- [ ] No duplicates appear
- [ ] No "buffered" messages

---

## 📱 Test on Mobile (Optional)

```
1. Get local machine IP: ipconfig (look for IPv4 Address)
   Example: 192.168.x.x

2. On phone, visit: http://192.168.x.x:5173/chat/test

3. Verify:
   - Layout is responsive
   - Messages appear
   - Input field works
   - Can send/receive messages
```

---

## 🎓 Files Modified/Created

**New Files:**
- ✅ `src/services/chatSocket.js`
- ✅ `src/redux/slices/chatSlice.js`
- ✅ `src/components/chat/ChatMessage.jsx`
- ✅ `src/components/chat/ChatInput.jsx`
- ✅ `src/components/chat/ChatMessages.jsx`
- ✅ `src/components/chat/ChatHeader.jsx`
- ✅ `src/components/chat/CustomerList.jsx`
- ✅ `src/components/chat/StaffChatPanel.jsx`
- ✅ `src/pages/Chat.jsx`
- ✅ `src/pages/ChatTest.jsx`

**Modified Files:**
- ✅ `src/redux/store.js` - Added chatSlice
- ✅ `src/pages/index.js` - Exported Chat & ChatTest
- ✅ `src/App.jsx` - Added chat routes
- ✅ `package.json` - Added socket.io-client

---

## 📞 Debugging Tips

### **Enable Socket.IO Debugging:**
```javascript
// In browser console:
localStorage.debug = 'socket.io-client:*'
// Then refresh page and watch console
```

### **Check Actual Socket Events:**
```javascript
// Open DevTools → Network tab → WS tab
// Look for "socketio" connection
// Expand and watch "Messages" tab for events
```

### **Log All Redux Actions:**
```javascript
// In src/redux/store.js (add this):
import logger from 'redux-logger' // Not installed but shows concept
// Then all actions will log to console
```

---

## ✨ What Happens Behind the Scenes

```
Customer sends "Hello"
    ↓
Frontend: socket.emit('send_message', {...})
    ↓
Backend receives & checks: staff online?
    ↓
    ├─ YES → Routes to staff socket room
    │         Staff sees in real-time
    │
    └─ NO  → Chatbot generates reply
             Customer sees bot response
    
All messages saved to MongoDB instantly
```

---

## 🎉 When It Works

You'll see:
1. Messages appear instantly
2. Staff can reply to customers
3. Customers receive replies
4. Bot responds when staff offline
5. Multiple conversations work simultaneously
6. Online/offline status updates correctly

**That's the chat feature working perfectly!** 🚀

---

## 📖 For More Details

- Full testing guide: `CHAT_TESTING_GUIDE.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Backend code: `pos-backend/sockets/chat.socket.js`

---

**Ready to test? Start with Terminal 1 and 2, then open 3 browser windows!** 👍

