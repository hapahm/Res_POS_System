# Hybrid Chatbot Implementation Guide

## Overview

The restaurant POS chat system now features a **hybrid chatbot** that combines:
1. **Rule-based matching** - Fast, zero-cost intent classification using keywords
2. **AI fallback (OpenAI)** - Intelligent intent classification and parameter extraction when rule-based fails

## Architecture Flow

```
User Message
    ↓
ChatbotService.classifyAndRespond()
    ↓
[Try Rule-Based Matching]
    ├─ Match Found? → Return intent + response
    └─ No Match? ↓
    
[Try AI Classification (if enabled)]
    ├─ Success? → AI returns: { intent, parameters, confidence }
    │             ↓
    │          [Process Database Query]
    │             ↓
    │          Return formatted response with data
    │
    └─ Failed? → Fallback to CALL_STAFF (request human help)
```

## File Changes

### 1. **ai.service.js** (NEW)
Location: `pos-backend/services/ai.service.js`

**Purpose:** OpenAI integration for intelligent intent classification

**Key Features:**
- Calls OpenAI API (gpt-3.5-turbo model)
- Extracts parameters (orderId, tableNumber, etc.)
- Returns structured JSON response
- Error handling with fallback to CALL_STAFF
- 10-second timeout protection

**Environment Variable Required:**
```env
OPENAI_API_KEY=sk-your_api_key_here
```

**Supported Intents:**
- OPENING_HOURS
- MENU
- ORDER_STATUS
- TABLE_STATUS
- PRICING
- ADDRESS
- CALL_STAFF
- THANKS
- GREETING
- FALLBACK

### 2. **chatbot.service.js** (UPDATED)
Location: `pos-backend/services/chatbot.service.js`

**Changes:**
- `classifyAndRespond()` is now **async**
- Implements hybrid flow: rule-based → AI fallback
- Added `getResponseForIntent()` helper method
- Returns response with `source` field ('RULE_BASED', 'AI', 'FALLBACK', 'ERROR_FALLBACK')

**Usage:**
```javascript
const botResponse = await ChatbotService.classifyAndRespond(userMessage);
// Returns: { intent, response, parameters, confidence, requiresStaff, messageType, source }
```

### 3. **chat.socket.js** (UPDATED)
Location: `pos-backend/sockets/chat.socket.js`

**New Imports:**
```javascript
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
```

**New Functions:**
- `handleOrderStatusQuery(parameters)` - Query order database
- `handleTableStatusQuery(parameters)` - Query table database
- `processAIResponse(botResponse)` - Execute database queries based on AI intent

**Updated Logic:**
```javascript
// Line ~367: Now uses await for async classifyAndRespond()
let botResponse = await ChatbotService.classifyAndRespond(message);

// If AI classified, process database queries
if (botResponse.source === 'AI') {
    botResponse = await processAIResponse(botResponse);
}
```

### 4. **Environment Configuration**
Files: `.env` and `.env.example`

**New Variable:**
```env
OPENAI_API_KEY=sk-your_api_key_here
```

### 5. **package.json** (UPDATED)
Added dependency:
```json
"axios": "^1.6.0"
```

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd pos-backend
npm install
```

### Step 2: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy the key (you'll only see it once!)

### Step 3: Configure Environment Variable
Update `.env` file:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

### Step 4: Start the Server
```bash
npm run dev
```

## Testing the Hybrid Chatbot

### Test Case 1: Rule-Based Matching (No API Cost)
```
Customer: "Giờ mở cửa là mấy giờ?"
↓
Response: (from OPENING_HOURS intent)
Source: RULE_BASED
Cost: $0
```

### Test Case 2: AI Fallback with Database Query
```
Customer: "Đơn hàng ORD123 của tôi đến đâu rồi?"
↓
Response: (AI extracts orderId, queries Order collection)
Source: AI
Cost: ~$0.0005 per request
```

### Test Case 3: AI Error → Human Handoff
```
Customer: "Complex query that breaks AI..."
↓
Response: "📞 Xin lỗi, tôi gặp vấn đề kỹ thuật. Đang chuyển bạn đến nhân viên..."
Source: ERROR_FALLBACK
Cost: $0
```

## Response Examples

### Rule-Based Response (Fast, No API Call)
```javascript
{
  intent: "OPENING_HOURS",
  response: "🕐 **Giờ mở cửa của nhà hàng:**\n\n⏰ Sáng: 10:00 - 14:00\n⏰ Chiều: 17:00 - 22:00\n\nHàng ngày.",
  requiresStaff: false,
  messageType: "chatbot",
  source: "RULE_BASED"
}
```

### AI Response with Parameters (Database Query)
```javascript
{
  intent: "ORDER_STATUS",
  response: "📦 **Trạng thái đơn hàng ORD123:**\n\n📅 Ngày đặt: 15/12/2024\n💰 Tổng tiền: 250.000đ\n📦 Trạng thái: **Preparing**",
  parameters: { orderId: "ORD123" },
  confidence: 0.92,
  requiresStaff: false,
  messageType: "chatbot",
  source: "AI"
}
```

### Error Fallback Response (Human Help)
```javascript
{
  intent: "CALL_STAFF",
  response: "📞 **Xin lỗi, tôi gặp vấn đề kỹ thuật.**\n\nĐang chuyển bạn đến nhân viên...",
  requiresStaff: true,
  messageType: "chatbot",
  source: "ERROR_FALLBACK"
}
```

## Cost Optimization

### Monthly Cost Estimation
- Rule-based queries: **$0** (all keyword matching is free)
- AI queries (gpt-3.5-turbo): ~**$0.0005 per request**
  - 1000 AI requests = $0.50
  - 10000 AI requests = $5.00
  - 100000 AI requests = $50.00

### Optimization Strategy
1. Keep common queries in rule-based INTENTS (see chatbot.service.js)
2. Let AI handle only complex/unknown queries
3. Expected ratio: 80% rule-based, 20% AI
4. Expected monthly cost at 1000 conversations/day: ~$3-5

## Debugging

### Enable Verbose Logging
The system logs:
- `🔍 === CLASSIFY MESSAGE ===` - Start of classification
- `✅ Rule-based match found: INTENT_NAME` - Rule matched
- `⚠️ No rule-based match, trying AI...` - AI fallback triggered
- `🤖 AI classified intent: ORDER_STATUS` - AI result
- `🔎 Handling ORDER_STATUS with parameters:` - Database query execution

### Common Issues

**Issue 1: "OPENAI_API_KEY not configured"**
```
Solution: Set OPENAI_API_KEY in .env file with valid OpenAI API key
```

**Issue 2: "OpenAI API key invalid" (401 error)**
```
Solution: Check API key is correct and not expired
Go to https://platform.openai.com/api-keys to verify/regenerate
```

**Issue 3: "OpenAI API timeout"**
```
Solution: Network issue or OpenAI service slow
System will fallback to CALL_STAFF intent automatically
```

**Issue 4: "Unable to find order/table"**
```
Solution: Ensure OrderId/TableNumber are correct in database
AI will extract numbers from user message
```

## Monitoring & Metrics

To track performance, add logging to track:
```javascript
// In chat.socket.js, add metrics collection
const metrics = {
    ruleBasedMatches: 0,
    aiClassifications: 0,
    apiErrors: 0,
    humanHandoffs: 0
};

// Then increment metrics as messages are processed
```

## Future Enhancements

1. **Caching** - Cache AI results for identical messages
2. **Fine-tuning** - Train AI on restaurant-specific data
3. **Multilingual** - Support Vietnamese, English, Chinese
4. **Analytics** - Track most common customer queries
5. **Intent Confidence** - Only use AI if confidence > 0.7
6. **Rate Limiting** - Prevent spam of AI API
7. **Custom Knowledge Base** - Feed restaurant menu, hours to AI context

## FAQ

**Q: Why hybrid and not just AI?**
A: Rule-based is faster, more reliable, and costs $0. AI is only needed for complex queries.

**Q: Can I disable AI and use rule-based only?**
A: Yes, remove the AI fallback logic in chatbot.service.js. System will return FALLBACK_RESPONSE instead.

**Q: How much does this cost?**
A: Very little! Most queries are rule-based (free). AI is only for ~20% of queries (~$0.0005 each).

**Q: What if AI is too slow?**
A: The 10-second timeout will trigger, fallback to CALL_STAFF. Consider upgrading to faster models (gpt-4-turbo).

**Q: Can I use different AI model?**
A: Yes! Edit ai.service.js and change:
```javascript
model: 'gpt-3.5-turbo' // Change this to 'gpt-4', 'gpt-4-turbo', etc.
```

## Support

For issues:
1. Check logs in terminal for detailed error messages
2. Verify OPENAI_API_KEY is set correctly
3. Test with simple queries first
4. Check MongoDB connection for order/table queries
5. Review response source field ('RULE_BASED' vs 'AI' vs 'ERROR_FALLBACK')
