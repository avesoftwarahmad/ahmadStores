/**
 * Intent Classification System
 * Classifies user input into one of 7 intents using keyword/pattern matching
 */

const INTENTS = {
  POLICY_QUESTION: 'policy_question',
  ORDER_STATUS: 'order_status',
  PRODUCT_SEARCH: 'product_search',
  COMPLAINT: 'complaint',
  CHITCHAT: 'chitchat',
  OFF_TOPIC: 'off_topic',
  VIOLATION: 'violation'
};

// Keywords and patterns for each intent
const INTENT_PATTERNS = {
  [INTENTS.POLICY_QUESTION]: {
    keywords: [
      'policy', 'return', 'refund', 'exchange', 'warranty', 
      'shipping', 'delivery', 'privacy', 'terms', 'conditions',
      'guarantee', 'cancel', 'how long', 'how much cost',
      'international', 'payment methods', 'security'
    ],
    patterns: [
      /what (is|are) (your|the) .*(policy|policies)/i,
      /how (do|does|can|to) .*(return|refund|exchange)/i,
      /how long .*(shipping|delivery|return)/i,
      /can i (return|exchange|cancel)/i,
      /do you (ship|deliver)/i,
      /what happens if/i
    ]
  },
  
  [INTENTS.ORDER_STATUS]: {
    keywords: [
      'order', 'track', 'tracking', 'status', 'where', 
      'delivered', 'shipment', 'package', 'arrival', 'shipped',
      'order number', 'order id', 'my purchase'
    ],
    patterns: [
      /where.*my.*(order|package|shipment)/i,
      /track.*order/i,
      /order.*status/i,
      /when.*arrive/i,
      /has.*shipped/i,
      /(check|see|view).*order/i,
      /order\s*#?\d+/i,
      /my recent (order|purchase)/i
    ]
  },
  
  [INTENTS.PRODUCT_SEARCH]: {
    keywords: [
      'product', 'item', 'looking for', 'search', 'find',
      'show', 'available', 'stock', 'price', 'cost',
      'category', 'products', 'shop', 'browse', 'recommend'
    ],
    patterns: [
      /show.*products?/i,
      /(looking|search) for/i,
      /do you (have|sell)/i,
      /what.*(products?|items?).*(available|have|sell)/i,
      /recommend.*for/i,
      /products?.*(under|less than|cheaper)/i,
      /best.*for/i,
      /(browse|shop|see).*(category|products?)/i
    ]
  },
  
  [INTENTS.COMPLAINT]: {
    keywords: [
      'problem', 'issue', 'broken', 'damaged', 'wrong',
      'complaint', 'unhappy', 'disappointed', 'terrible',
      'worst', 'awful', 'horrible', 'bad', 'unacceptable',
      'frustrated', 'angry', 'upset'
    ],
    patterns: [
      /(not|isn't|wasn't|won't|didn't) work/i,
      /this is (terrible|awful|horrible|unacceptable)/i,
      /i('m| am) (upset|angry|frustrated|disappointed)/i,
      /(broken|damaged|wrong) (product|item|order)/i,
      /want to (complain|file a complaint)/i,
      /speak to (manager|supervisor)/i,
      /this is ridiculous/i
    ]
  },
  
  [INTENTS.CHITCHAT]: {
    keywords: [
      'hello', 'hi', 'hey', 'thanks', 'thank you', 'bye',
      'goodbye', 'how are you', 'good morning', 'good evening',
      'what\'s up', 'name', 'who are you', 'help'
    ],
    patterns: [
      /^(hi|hello|hey)$/i,
      /^(thanks|thank you|thx)$/i,
      /^(bye|goodbye|see you)$/i,
      /how are you/i,
      /what('s| is) your name/i,
      /who are you/i,
      /good (morning|afternoon|evening)/i,
      /^help$/i,
      /nice to meet/i,
      /are you (human|robot|ai|bot)/i,
      /hello.*name/i,
      /hi.*name/i
    ]
  },
  
  [INTENTS.VIOLATION]: {
    keywords: [
      'stupid', 'idiot', 'hate', 'suck', 'damn',
      'racist', 'sexist', 'discriminate'
    ],
    patterns: [
      /\b(fuck|shit|bitch|ass)\b/i,
      /you('re| are) (stupid|dumb|idiot)/i,
      /hate (you|this)/i,
      /kill yourself/i,
      /go to hell/i,
      /(racist|sexist|nazi)/i,
      /\bhell\b(?!o)/i
    ]
  },
  
  [INTENTS.OFF_TOPIC]: {
    keywords: [
      'weather', 'sports', 'politics', 'recipe', 'movie',
      'music', 'game', 'homework', 'math', 'science',
      'history', 'geography', 'bitcoin', 'crypto', 'stocks'
    ],
    patterns: [
      /what('s| is) the weather/i,
      /who won the (game|match)/i,
      /tell me a (joke|story)/i,
      /how to (cook|make|prepare)/i,
      /solve.*equation/i,
      /write.*essay/i,
      /capital of/i,
      /when was.*born/i,
      /bitcoin price/i
    ]
  }
};

/**
 * Calculate intent score based on keyword matches and pattern matches
 */
function calculateIntentScore(text, intent) {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Check keyword matches
  const keywords = INTENT_PATTERNS[intent].keywords || [];
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      score += 2; // Weight for keyword match
    }
  }
  
  // Check pattern matches
  const patterns = INTENT_PATTERNS[intent].patterns || [];
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      score += 3; // Higher weight for pattern match
    }
  }
  
  return score;
}

/**
 * Classify user input into an intent
 */
function classifyIntent(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return {
      intent: INTENTS.OFF_TOPIC,
      confidence: 0,
      reason: 'Invalid input'
    };
  }
  
  const text = userInput.trim();
  
  // Calculate scores for each intent
  const scores = {};
  for (const intent of Object.values(INTENTS)) {
    scores[intent] = calculateIntentScore(text, intent);
  }
  
  // Find the intent with highest score
  let bestIntent = INTENTS.OFF_TOPIC;
  let maxScore = 0;
  
  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }
  
  // Check for violations first (highest priority)
  if (scores[INTENTS.VIOLATION] > 0) {
    return {
      intent: INTENTS.VIOLATION,
      confidence: Math.min(scores[INTENTS.VIOLATION] / 5, 1),
      reason: 'Inappropriate language detected'
    };
  }
  
  // If no clear match, check if it's chitchat
  if (maxScore === 0) {
    // Check if it's a very short message that might be chitchat
    if (text.length < 20) {
      return {
        intent: INTENTS.CHITCHAT,
        confidence: 0.5,
        reason: 'Short message, assuming chitchat'
      };
    }
    
    return {
      intent: INTENTS.OFF_TOPIC,
      confidence: 0.3,
      reason: 'No clear intent detected'
    };
  }
  
  // Calculate confidence (normalize score)
  const confidence = Math.min(maxScore / 10, 1);
  
  return {
    intent: bestIntent,
    confidence,
    reason: `Matched based on keywords and patterns (score: ${maxScore})`
  };
}

/**
 * Get intent description
 */
function getIntentDescription(intent) {
  const descriptions = {
    [INTENTS.POLICY_QUESTION]: 'Questions about store policies, returns, shipping, etc.',
    [INTENTS.ORDER_STATUS]: 'Inquiries about order status and tracking',
    [INTENTS.PRODUCT_SEARCH]: 'Looking for products or product information',
    [INTENTS.COMPLAINT]: 'Customer complaints or issues',
    [INTENTS.CHITCHAT]: 'Greetings and casual conversation',
    [INTENTS.OFF_TOPIC]: 'Topics unrelated to e-commerce',
    [INTENTS.VIOLATION]: 'Inappropriate or offensive content'
  };
  
  return descriptions[intent] || 'Unknown intent';
}

module.exports = {
  INTENTS,
  classifyIntent,
  getIntentDescription
};
