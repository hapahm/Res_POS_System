/**
 * AI SERVICE
 * Xử lý intent classification và parameter extraction sử dụng OpenAI API
 * Chỉ được gọi khi rule-based matching không thành công
 */

const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Possible intents that AI can classify
 */
const AVAILABLE_INTENTS = [
    'OPENING_HOURS',
    'MENU',
    'ORDER_STATUS',
    'TABLE_STATUS',
    'PRICING',
    'ADDRESS',
    'CALL_STAFF',
    'THANKS',
    'GREETING',
    'FALLBACK'
];

/**
 * System prompt for AI - instructs how to classify and extract info
 */
const SYSTEM_PROMPT = `You are a restaurant chatbot assistant. Your job is to:
1. Classify the user's message into one of these intents: ${AVAILABLE_INTENTS.join(', ')}
2. Extract relevant parameters from the message (orderId, table number, etc.)
3. Return ONLY a valid JSON response, nothing else

Rules:
- Always return valid JSON, never text explanations
- If user asks about order status, extract orderId/orderNumber if present
- If user asks about table availability, extract table number if present
- For unknown messages, use FALLBACK intent
- Response must be JSON only

JSON Response Format:
{
  "intent": "INTENT_NAME",
  "parameters": {
    "orderId": null,
    "tableNumber": null,
    "customAttribute": null
  },
  "confidence": 0.95,
  "requiresStaff": false
}`;

/**
 * AI Service class
 */
class AIService {
    /**
     * Call OpenAI API to classify intent and extract parameters
     * @param {string} userMessage - User message to analyze
     * @returns {Promise<Object>} - { intent, parameters, confidence, requiresStaff }
     */
    static async classifyWithAI(userMessage) {
        try {
            // Check if API key is configured
            if (!OPENAI_API_KEY) {
                console.error('❌ OPENAI_API_KEY not configured');
                return this.getFallbackResponse('AI service not available');
            }

            console.log(`🤖 Calling OpenAI for intent classification...`);
            console.log(`📝 Message: "${userMessage}"`);

            const response = await axios.post(
                OPENAI_API_URL,
                {
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: SYSTEM_PROMPT
                        },
                        {
                            role: 'user',
                            content: userMessage
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 200
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            // Extract response text
            const responseText = response.data.choices[0].message.content.trim();
            console.log(`📤 OpenAI response: ${responseText}`);

            // Parse JSON response
            const parsedResponse = JSON.parse(responseText);
            console.log(`✅ Successfully parsed AI response:`, parsedResponse);

            // Validate response structure
            if (!parsedResponse.intent || !AVAILABLE_INTENTS.includes(parsedResponse.intent)) {
                console.warn(`⚠️ Invalid intent from AI: ${parsedResponse.intent}, using FALLBACK`);
                return this.getFallbackResponse('Invalid intent from AI');
            }

            return {
                intent: parsedResponse.intent,
                parameters: parsedResponse.parameters || {},
                confidence: parsedResponse.confidence || 0.85,
                requiresStaff: parsedResponse.requiresStaff || parsedResponse.intent === 'CALL_STAFF',
                source: 'AI'
            };

        } catch (error) {
            console.error(`❌ AI Service error:`, error.message);

            if (error.response?.status === 401) {
                console.error('❌ OpenAI API key invalid');
            } else if (error.code === 'ECONNABORTED') {
                console.error('❌ OpenAI API timeout');
            }

            // Fallback to human handoff
            return this.getFallbackResponse(error.message);
        }
    }

    /**
     * Fallback response when AI fails
     * @param {string} errorMessage - Error message for logging
     * @returns {Object} - Fallback response with CALL_STAFF intent
     */
    static getFallbackResponse(errorMessage) {
        console.log(`⚠️ AI fallback triggered: ${errorMessage}`);
        return {
            intent: 'CALL_STAFF',
            parameters: {},
            confidence: 0,
            requiresStaff: true,
            source: 'FALLBACK'
        };
    }

    /**
     * Validate if message requires AI classification
     * (e.g., if rule-based matching failed)
     * @param {string} message - Message to check
     * @returns {boolean}
     */
    static shouldUseAI(message) {
        // Messages shorter than 3 chars probably don't need AI
        if (message.length < 3) {
            return false;
        }
        return true;
    }
}

module.exports = AIService;
