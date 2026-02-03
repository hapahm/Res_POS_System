# Debug Updates - Chat Feature

## Changes Made to Fix Customer Visibility in Staff Chat

### 1. **Frontend: StaffChatPanel.jsx**
**Issue**: Socket event listeners were being set up with a 500ms delay inside a setTimeout, and then immediately cleaned up. This could cause race conditions where events arrive before the listener is ready.

**Fix**:
- Removed the `setTimeout` wrapper - listeners now attach immediately
- Removed aggressive listener cleanup (`offReceiveMessage()`, `offStaffRequest()`, `offStaffJoined()`) to prevent race conditions
- Listeners now persist for the component's lifetime
- Added detailed console logging to trace listener setup and event reception

**Impact**: Events are now guaranteed to be received if the listener is attached before the event is emitted.

---

### 2. **Frontend: chatSocket.js**
**Issue**: Limited logging made it hard to debug if listeners were being set up correctly.

**Fix**:
- Added logging to `connectSocket()` showing the role and userId
- Added logging to `onStaffRequest()` to confirm listener setup
- Added wrapper callback in `onStaffRequest()` that logs when events are actually received

**Impact**: Clear visibility into listener setup and event flow in browser console.

---

### 3. **Backend: chat.socket.js - Staff Connection**
**Issue**: Not enough logging to confirm staff was joining the "staff_room".

**Fix**:
- Added logging when staff joins staff_room: `👨‍💼 Staff ${userId} đã online và join staff_room`
- Added logging showing total staff count in online map
- Added logging showing actual staff room size with `io.sockets.adapter.rooms.get("staff_room")?.size`

**Impact**: Clear visibility into staff room population on the backend.

---

### 4. **Backend: chat.socket.js - Staff Request Broadcasting**
**Issue**: When customer requests help, backend emits `staff_request` event to "staff_room", but we couldn't see if:
- Staff was in the room
- Event was actually being broadcast
- What data was being sent

**Fix**:
- Added detailed logging before and after `io.to("staff_room").emit("staff_request", ...)`
- Logs show:
  - List of all online staff IDs
  - Count of clients in staff_room
  - Full payload being broadcast
- Added visual separators to make the output clear

**Impact**: Can now see exactly when and what is being broadcast to staff.

---

### 5. **Backend: chat.socket.js - Database Save Operations**
**Issue**: Messages weren't appearing in MongoDB, and we couldn't see if saves were failing silently.

**Fix**:
- Improved error logging with full error object and stack trace
- Added logging for chatbot response classification
- Changed chatbot sender from `null` to `"chatbot"` string (more consistent with UUID customer IDs)

**Impact**: If database saves fail, the error is now visible in the console with full details.

---

## Testing Checklist

After these changes, test the complete flow:

### Test as Staff (port 5173/staff/chat):
1. Open browser console (F12)
2. Go to `http://localhost:5173/staff/chat`
3. Login as staff
4. You should see:
   - ✅ `🔌 StaffChatPanel: Connecting socket for staff: [staffId]`
   - ✅ `🎧 Attaching all socket listeners`
   - ✅ "Welcome to Chat Support" page loads

### Test as Customer (port 5173/chat/test):
1. Open another browser tab/window
2. Go to `http://localhost:5173/chat/test`
3. Send message: `I need help` (should trigger CALL_STAFF intent)
4. Check staff chat interface - customer should now appear in the list

### Check Backend Logs (port 8000):
You should see this sequence:

```
1. 📧 Khách hàng gửi tin: "I need help"
2. 💾 Lưu tin từ customer [UUID]...
3. ✅ Tin customer đã lưu (ID: [mongoId])
4. 🤖 Chatbot response: { intent: 'CALL_STAFF', requiresStaff: true, ... }
5. 💾 Lưu tin từ chatbot...
6. ✅ Tin chatbot đã lưu (ID: [mongoId])

7. 📢 === BROADCAST STAFF_REQUEST ===
8. 📊 Staff online: ["[staffId]"]
9. 📊 Staff count: 1
10. 📤 Gửi data: { customerId: "[UUID]", customerName: "Customer [UUID]", ... }
11. 📞 Customer [UUID] yêu cầu gọi staff
12. ===================================
```

### Check Staff Browser Console (F12):
You should see:

```
🆘 STAFF REQUEST RECEIVED: { customerId: "[UUID]", customerName: "Customer [UUID]", ... }
🆘 Staff request received in component: { ... }
📍 Adding customer with ID: [UUID]
```

Then the customer should appear in the "Active Customers" list on the staff interface.

---

## Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| **Socket Listeners** | Setup with delay, aggressively cleaned up | Immediate setup, persistent for component lifetime |
| **Backend Logging** | Minimal visibility into broadcast | Clear visibility: room population, payload, timing |
| **Error Handling** | Errors logged without full details | Full error objects with stack traces |
| **Debugging** | Hard to trace event flow | Clear console breadcrumbs showing entire flow |

---

## If Still Not Working

Check in this order:

1. **Backend logs**: Do you see `👨‍💼 Staff [staffId] đã online và join staff_room`?
   - If NO: Staff not connecting properly
   - Fix: Check Network tab in DevTools, verify userId/role being sent

2. **Backend logs**: When customer sends CALL_STAFF message, do you see `📞 Customer [UUID] yêu cầu gọi staff`?
   - If NO: Intent classification failed or requiresStaff is false
   - Fix: Check chatbot service classifyAndRespond() logic

3. **Backend logs**: Do you see `📊 Staff count: 1` in the BROADCAST section?
   - If NO: Staff is not in staff_room (see #1)
   - If YES: Event is being broadcast

4. **Staff browser console**: Do you see `🆘 STAFF REQUEST RECEIVED:`?
   - If NO: Event isn't reaching frontend
   - Fix: Check Network tab → WebSocket frame to see if data is being sent

5. **Staff browser Redux**: Open Redux DevTools, should see `addCustomer` action in the action history
   - If NO: Handler not being called
   - Fix: Check that `handleStaffRequest` is being invoked
