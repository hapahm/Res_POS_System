# Quick Start - Hybrid Chatbot Testing

## 🚀 5-Minute Setup

### Step 1: Get OpenAI API Key (2 minutes)
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (you'll only see it once!)

### Step 2: Configure Environment (1 minute)
Edit `pos-backend/.env`:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

### Step 3: Install & Run (2 minutes)
```bash
cd pos-backend
npm install
npm run dev
```

---

## ✅ Test Cases

### Test 1: Rule-Based Query (FAST - No API Cost)
**Action:** Send message from customer
```
"Nhà hàng mở cửa giờ nào?"
```
**Expected Result:**
- ✅ Response: Hours of operation
- ✅ Source: RULE_BASED
- ✅ Cost: $0.00
- ✅ Speed: <1ms

**Telemetry (Console):**
```
🔍 === CLASSIFY MESSAGE ===
📝 User message: "Nhà hàng mở cửa giờ nào?"
✅ Rule-based match found: OPENING_HOURS
```

---

### Test 2: AI Classification Query (SMART - $0.0005)
**Action:** Send message from customer
```
"Đơn hàng ORD123 của tôi đến đâu rồi?"
```
**Expected Result:**
- ✅ Response: Order status details (from database)
- ✅ Parameters extracted: { orderId: "ORD123" }
- ✅ Source: AI
- ✅ Cost: ~$0.0005
- ✅ Speed: ~500ms

**Telemetry (Console):**
```
🔍 === CLASSIFY MESSAGE ===
📝 User message: "Đơn hàng ORD123 của tôi đến đâu rồi?"
✅ No rule-based match, trying AI...
🤖 AI classified intent: ORDER_STATUS
✅ AI response processed with database query
🔎 Handling ORDER_STATUS with parameters: { orderId: 'ORD123' }
```

---

### Test 3: Error Fallback (SAFE - No Cost)
**Action:** Send gibberish message
```
"xyzabc123 qwerty asdfgh"
```
**Expected Result:**
- ✅ Response: "📞 Xin lỗi, tôi gặp vấn đề kỹ thuật. Đang chuyển bạn đến nhân viên..."
- ✅ Intent: FALLBACK
- ✅ Source: FALLBACK (no API call)
- ✅ Cost: $0.00
- ✅ Speed: <1ms

**Telemetry (Console):**
```
🔍 === CLASSIFY MESSAGE ===
📝 User message: "xyzabc123 qwerty asdfgh"
⚠️ No rule-based match, trying AI...
```

---

### Test 4: Complex AI Query
**Action:** Send message from customer
```
"Bàn số 5 còn trống không? Tôi muốn đặt bàn cho 4 người"
```
**Expected Result:**
- ✅ Response: Table availability status
- ✅ Parameters extracted: { tableNumber: 5 }
- ✅ Source: AI
- ✅ Database query executed
- ✅ Human-readable response with table info

**Telemetry (Console):**
```
🤖 AI classified intent: TABLE_STATUS
🔎 Handling TABLE_STATUS with parameters: { tableNumber: 5 }
```

---

### Test 5: Staff Receives AI-Powered Response
**Action:** Both test and real staff chat open
1. Customer asks: "Đơn hàng ORD456 của tôi ở đâu?"
2. Chatbot responds with AI-generated status
3. Staff sees the response in chat history

**Expected Result:**
- ✅ Staff can see database query result
- ✅ Message saved to MongoDB
- ✅ Real-time sync via Socket.IO
- ✅ Both customer and staff see same info

---

## 📊 Response Comparison

### Rule-Based Response
```json
{
  "intent": "OPENING_HOURS",
  "response": "🕐 **Giờ mở cửa của nhà hàng:**\n\n⏰ Sáng: 10:00 - 14:00\n⏰ Chiều: 17:00 - 22:00",
  "requiresStaff": false,
  "messageType": "chatbot",
  "source": "RULE_BASED"
}
```

### AI Response
```json
{
  "intent": "ORDER_STATUS",
  "response": "📦 **Trạng thái đơn hàng ORD123:**\n\n📅 Ngày đặt: 15/12/2024\n💰 Tổng tiền: 250.000đ\n📦 Trạng thái: **Preparing**",
  "parameters": { "orderId": "ORD123" },
  "confidence": 0.92,
  "requiresStaff": false,
  "messageType": "chatbot",
  "source": "AI"
}
```

### Error Fallback
```json
{
  "intent": "CALL_STAFF",
  "response": "📞 **Xin lỗi, tôi gặp vấn đề kỹ thuật.**\n\nĐang chuyển bạn đến nhân viên...",
  "requiresStaff": true,
  "messageType": "chatbot",
  "source": "ERROR_FALLBACK"
}
```

---

## 🐛 Troubleshooting

### Problem: "OPENAI_API_KEY not configured"
```
✗ Check 1: Open .env file
✗ Check 2: Verify OPENAI_API_KEY=sk-... is present
✗ Check 3: Restart server (npm run dev)
✓ If still failing: Regenerate API key from https://platform.openai.com/api-keys
```

### Problem: "OpenAI API key invalid" (401)
```
✗ Check 1: Copy-paste key from dashboard again
✗ Check 2: Remove any quotes or spaces
✗ Check 3: Verify key starts with "sk-"
✓ If still failing: Delete old key, create new one
```

### Problem: "OpenAI API timeout"
```
✗ Check 1: Test internet connection
✗ Check 2: Check OpenAI status page (status.openai.com)
✗ Check 3: Verify message isn't too long (>1000 chars)
✓ System will fallback to CALL_STAFF automatically
```

### Problem: "Unable to find order/table in database"
```
✗ Check 1: Verify Order/Table exists in MongoDB
✗ Check 2: Check AI extracted correct orderId/tableNumber in logs
✗ Check 3: Verify AI saw the number (check console output)
✓ AI will try to extract numbers from user message
```

### Problem: Customer/Staff not receiving messages
```
✗ Check 1: Verify Socket.IO connection (check console for "Client mới kết nối")
✗ Check 2: Check MongoDB is running (mongodb://127.0.0.1:27017)
✗ Check 3: Verify both users have same conversationId
✓ Messages should sync in <100ms
```

---

## 📈 Monitoring

### Key Metrics to Watch
1. **Rule-Based Match Rate** (target: >70%)
   - If too low: add more keywords to INTENTS
   
2. **AI Error Rate** (target: <1%)
   - If high: check OPENAI_API_KEY and API quota

3. **Response Time** (target: <1s)
   - Rule-based: <10ms
   - AI: 300-800ms
   - Timeout: 10s max

4. **Human Handoff Rate** (target: <10%)
   - If high: add more intents to rule-based

---

## 🎯 Next Steps

After testing works:
1. ✅ Test more complex queries
2. ✅ Monitor API costs (should be <$5/month)
3. ✅ Add more database queries for other intents
4. ✅ Consider caching for repeated queries
5. ✅ Set up error alerts

---

## 📞 Support

If something doesn't work:
1. Check terminal logs (look for 🔍 and 🤖 emojis)
2. Verify OPENAI_API_KEY is valid
3. Check MongoDB is running
4. Try with simple rule-based query first
5. Read HYBRID_CHATBOT_GUIDE.md for detailed docs

---

**You're all set! Start testing the hybrid chatbot now! 🚀**
