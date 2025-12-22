import { injectable } from 'tsyringe';
import { GeminiService } from './gemini.service';
import {
  IAIService,
  IAIAnalysisOutput,
  IAnalyzeMessageRequest,
  IResponseSuggestionRequest,
  IResponseSuggestion,
  IBusinessInsightsRequest,
  IBusinessInsightsResponse,
  IExtractedOrderDetails,
} from '../interfaces';
import {
  CustomerIntent,
  ResponseTone,
  ResponseLanguage,
  ResponseSuggestionType,
  CustomerValueLevel,
  UrgencyLevel,
} from '../enums';

/**
 * Nigerian Commerce Order Detection Patterns
 * These patterns help identify purchase intent in Nigerian social commerce conversations
 */
const ORDER_INTENT_PATTERNS = {
  // Direct purchase phrases (English)
  english: [
    'i want to buy', 'i want to order', 'i\'ll take', 'i will take',
    'give me', 'send me', 'i need', 'i\'m interested', 'how much',
    'what\'s the price', 'price please', 'available?', 'is it available',
    'do you have', 'can i get', 'i\'ll get', 'let me have',
    'add to cart', 'place order', 'confirm order', 'ready to pay',
    'i want', 'i\'d like', 'can you send', 'deliver to',
  ],

  // Nigerian Pidgin purchase phrases
  pidgin: [
    'i wan buy', 'i wan order', 'abeg send', 'abeg give me',
    'how much e be', 'how much be this', 'wetin be the price',
    'e dey available', 'una get am', 'make i get', 'i go take',
    'oya send am', 'na how much', 'e cost how much', 'i need am',
    'abeg how much', 'i wan get', 'make you send', 'i go collect',
    'na wa o', 'i dey interested', 'i wan make order',
  ],

  // Quantity indicators
  quantity: [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    'dozen', 'pair', 'pairs', 'pieces', 'pcs', 'units', 'carton', 'cartons',
    'pack', 'packs', 'set', 'sets', 'bundle', 'bundles',
  ],

  // Price/payment indicators
  payment: [
    'pay', 'payment', 'transfer', 'bank', 'account', 'send money',
    'naira', '₦', 'ngn', 'k', 'thousand', 'million',
    'cash', 'pos', 'card', 'online', 'mobile money',
  ],

  // Delivery/location indicators
  delivery: [
    'deliver', 'delivery', 'send to', 'ship to', 'address',
    'location', 'where', 'lagos', 'abuja', 'port harcourt', 'ibadan',
    'kano', 'enugu', 'benin', 'warri', 'owerri', 'calabar',
    'lekki', 'ikeja', 'vi', 'victoria island', 'ikoyi', 'ajah',
    'mainland', 'island', 'state', 'area', 'street',
  ],

  // Urgency indicators
  urgency: [
    'urgent', 'asap', 'now', 'today', 'tomorrow', 'quickly',
    'fast', 'immediately', 'sharp sharp', 'quick quick',
    'i need it', 'when can', 'how soon',
  ],

  // Negotiation phrases
  negotiation: [
    'last price', 'final price', 'best price', 'discount',
    'reduce', 'too expensive', 'too much', 'e too cost',
    'abeg reduce', 'manage am', 'customer price', 'loyal customer',
  ],
};

/**
 * Customer Intent Detection Patterns
 */
const INTENT_PATTERNS = {
  inquiry: [
    'what is', 'what\'s', 'tell me about', 'information', 'details',
    'specs', 'specification', 'features', 'color', 'size', 'sizes',
    'available colors', 'do you have', 'is there', 'any',
  ],
  complaint: [
    'problem', 'issue', 'wrong', 'bad', 'damaged', 'broken',
    'not working', 'defective', 'fake', 'disappointed', 'unhappy',
    'refund', 'return', 'exchange', 'complain', 'terrible',
  ],
  support: [
    'help', 'assist', 'support', 'question', 'how do i', 'how to',
    'can you help', 'need help', 'confused', 'don\'t understand',
  ],
  cancellation: [
    'cancel', 'don\'t want', 'changed my mind', 'no longer',
    'stop', 'remove', 'delete order', 'cancel order',
  ],
  followUp: [
    'update', 'status', 'where is', 'tracking', 'when will',
    'still waiting', 'any news', 'what happened', 'follow up',
  ],
};

/**
 * Positive emoji indicators (often signal purchase intent)
 */
const POSITIVE_EMOJIS = ['👍', '✅', '💯', '🙏', '❤️', '😍', '🔥', '💪', '👌', '🤝', '💰', '💵'];

/**
 * Nigerian state/city patterns for address extraction
 */
const NIGERIAN_LOCATIONS = [
  'lagos', 'abuja', 'kano', 'ibadan', 'port harcourt', 'benin city',
  'maiduguri', 'zaria', 'aba', 'jos', 'ilorin', 'oyo', 'enugu',
  'abeokuta', 'onitsha', 'warri', 'sokoto', 'calabar', 'uyo',
  'katsina', 'akure', 'bauchi', 'ebute metta', 'owerri', 'kaduna',
  'lekki', 'ikeja', 'victoria island', 'ikoyi', 'ajah', 'yaba',
  'surulere', 'festac', 'apapa', 'oshodi', 'mushin', 'agege',
];


// Raw response types from Gemini
interface AIAnalysisResult {
  orderDetected?: boolean;
  confidence?: number;
  extractedDetails?: IExtractedOrderDetails;
  customerIntent?: string;
  suggestedResponses?: RawResponseSuggestion[];
  businessInsights?: RawBusinessInsights;
}

interface RawResponseSuggestion {
  text: string;
  type?: string;
  confidence?: number;
  tone?: string;
  language?: string;
}

interface RawBusinessInsights {
  upsellOpportunity?: boolean;
  upsellSuggestions?: string[];
  customerValue?: string;
  urgency?: string;
  recommendedAction?: string;
  purchaseProbability?: number;
}

interface RawBusinessInsightsResponse {
  customerValuePredictions?: Array<{
    customerId?: string;
    customerName?: string;
    predictedValue?: string;
    purchaseProbability?: number;
    recommendedAction?: string;
  }>;
  highValueCustomers?: Array<{
    customerId: string;
    customerName: string;
    totalValue: number;
    orderCount: number;
  }>;
  purchaseTrends?: Array<{
    period?: string;
    trend?: string;
    topProducts?: string[];
    insights?: string[];
  }>;
  optimalResponseTiming?: {
    bestHours?: number[];
    bestDays?: string[];
    averageResponseTime?: number;
  };
}

/**
 * AI Service Implementation
 * Provides order detection, response suggestions, and business insights
 * Optimized for Nigerian social commerce patterns
 */
@injectable()
export class AIService implements IAIService {
  private geminiService: GeminiService;

  constructor(geminiService?: GeminiService) {
    this.geminiService = geminiService || new GeminiService();
  }

  async isAvailable(): Promise<boolean> {
    return this.geminiService.isAvailable();
  }

  /**
   * Analyze a message for order detection and intent
   * Uses both pattern matching and AI for comprehensive analysis
   */
  async analyzeMessage(request: IAnalyzeMessageRequest): Promise<IAIAnalysisOutput> {
    const startTime = Date.now();
    const message = request.messageContent.toLowerCase();

    // First, do local pattern-based analysis for quick detection
    const patternAnalysis = this.analyzePatterns(message);

    // If Gemini is not available, use pattern-based fallback
    if (!this.geminiService.isAvailable()) {
      return this.createPatternBasedAnalysis(request, patternAnalysis, startTime);
    }

    try {
      const prompt = this.buildAnalysisPrompt(request, patternAnalysis);
      const result = await this.geminiService.generateJSON<AIAnalysisResult>(prompt);

      // Combine AI results with pattern analysis for better accuracy
      const combinedConfidence = this.combineConfidence(
        result.confidence || 0,
        patternAnalysis.confidence
      );

      return {
        orderDetected: result.orderDetected ?? patternAnalysis.hasOrderIntent,
        confidence: combinedConfidence,
        extractedDetails: result.extractedDetails || patternAnalysis.extractedDetails,
        customerIntent: this.mapCustomerIntent(result.customerIntent) || patternAnalysis.intent,
        suggestedResponses: this.mapResponseSuggestions(result.suggestedResponses),
        businessInsights: this.mapBusinessInsights(result.businessInsights),
        processingTime: Date.now() - startTime,
        modelVersion: this.geminiService.getModelVersion(),
      };
    } catch (error) {
      console.error('AI analysis failed, using pattern fallback:', error);
      return this.createPatternBasedAnalysis(request, patternAnalysis, startTime);
    }
  }


  /**
   * Analyze message using local pattern matching
   * This provides fast, offline-capable order detection
   */
  private analyzePatterns(message: string): PatternAnalysisResult {
    const lowerMessage = message.toLowerCase();

    // Check for order intent patterns
    const englishMatches = ORDER_INTENT_PATTERNS.english.filter(p => lowerMessage.includes(p));
    const pidginMatches = ORDER_INTENT_PATTERNS.pidgin.filter(p => lowerMessage.includes(p));
    const quantityMatches = ORDER_INTENT_PATTERNS.quantity.filter(p =>
      new RegExp(`\\b${p}\\b`, 'i').test(message)
    );
    const paymentMatches = ORDER_INTENT_PATTERNS.payment.filter(p => lowerMessage.includes(p));
    const deliveryMatches = ORDER_INTENT_PATTERNS.delivery.filter(p => lowerMessage.includes(p));
    const urgencyMatches = ORDER_INTENT_PATTERNS.urgency.filter(p => lowerMessage.includes(p));
    const negotiationMatches = ORDER_INTENT_PATTERNS.negotiation.filter(p => lowerMessage.includes(p));

    // Check for positive emojis
    const hasPositiveEmoji = POSITIVE_EMOJIS.some(emoji => message.includes(emoji));

    // Calculate order intent score
    let intentScore = 0;
    intentScore += englishMatches.length * 2;
    intentScore += pidginMatches.length * 2;
    intentScore += quantityMatches.length * 1.5;
    intentScore += paymentMatches.length * 1.5;
    intentScore += deliveryMatches.length * 1;
    intentScore += urgencyMatches.length * 0.5;
    intentScore += hasPositiveEmoji ? 1 : 0;

    // Determine if this looks like an order
    const hasOrderIntent = intentScore >= 2 ||
      (englishMatches.length > 0 && (quantityMatches.length > 0 || paymentMatches.length > 0)) ||
      (pidginMatches.length > 0 && (quantityMatches.length > 0 || paymentMatches.length > 0));

    // Calculate confidence based on pattern matches
    const confidence = Math.min(1, intentScore / 8);

    // Detect customer intent
    let intent = CustomerIntent.INQUIRY;
    if (hasOrderIntent) {
      intent = CustomerIntent.PURCHASE;
    } else if (negotiationMatches.length > 0) {
      intent = CustomerIntent.NEGOTIATION;
    } else if (INTENT_PATTERNS.complaint.some(p => lowerMessage.includes(p))) {
      intent = CustomerIntent.COMPLAINT;
    } else if (INTENT_PATTERNS.support.some(p => lowerMessage.includes(p))) {
      intent = CustomerIntent.SUPPORT;
    } else if (INTENT_PATTERNS.cancellation.some(p => lowerMessage.includes(p))) {
      intent = CustomerIntent.CANCELLATION;
    } else if (INTENT_PATTERNS.followUp.some(p => lowerMessage.includes(p))) {
      intent = CustomerIntent.FOLLOW_UP;
    }

    // Extract details from message
    const extractedDetails = this.extractDetailsFromMessage(message);

    // Determine urgency
    const isUrgent = urgencyMatches.length > 0;

    return {
      hasOrderIntent,
      confidence,
      intent,
      extractedDetails,
      isUrgent,
      matchedPatterns: {
        english: englishMatches,
        pidgin: pidginMatches,
        quantity: quantityMatches,
        payment: paymentMatches,
        delivery: deliveryMatches,
        urgency: urgencyMatches,
        negotiation: negotiationMatches,
      },
      hasPositiveEmoji,
    };
  }

  /**
   * Extract order details from message using regex patterns
   */
  private extractDetailsFromMessage(message: string): IExtractedOrderDetails {
    const details: IExtractedOrderDetails = {};

    // Extract quantity (numbers followed by common units)
    const quantityMatch = message.match(/(\d+)\s*(pieces?|pcs?|units?|pairs?|dozen|cartons?|packs?|sets?|bundles?)?/i);
    if (quantityMatch) {
      details.quantity = parseInt(quantityMatch[1], 10);
    }

    // Extract price (Nigerian Naira patterns)
    const pricePatterns = [
      /₦\s*([\d,]+(?:\.\d{2})?)/,
      /NGN\s*([\d,]+(?:\.\d{2})?)/i,
      /([\d,]+(?:\.\d{2})?)\s*(?:naira|NGN)/i,
      /([\d,]+)k\b/i, // e.g., "5k" = 5000
      /(?:price|cost|amount)[:\s]*([\d,]+)/i,
    ];

    for (const pattern of pricePatterns) {
      const match = message.match(pattern);
      if (match) {
        let price = match[1].replace(/,/g, '');
        if (message.toLowerCase().includes('k') && match[0].includes('k')) {
          price = String(parseFloat(price) * 1000);
        }
        details.price = parseFloat(price);
        break;
      }
    }

    // Extract Nigerian phone numbers
    const phonePatterns = [
      /(?:0|\+234)[789][01]\d{8}/,
      /(?:0|\+234)\s*[789][01]\d\s*\d{3}\s*\d{4}/,
    ];
    for (const pattern of phonePatterns) {
      const match = message.match(pattern);
      if (match) {
        details.customerContact = match[0].replace(/\s/g, '');
        break;
      }
    }

    // Extract location/address
    const locationMatch = NIGERIAN_LOCATIONS.find(loc =>
      message.toLowerCase().includes(loc)
    );
    if (locationMatch) {
      // Try to extract more context around the location
      const addressPattern = new RegExp(`([^.!?]*${locationMatch}[^.!?]*)`, 'i');
      const addressMatch = message.match(addressPattern);
      details.deliveryAddress = addressMatch ? addressMatch[1].trim() : locationMatch;
    }

    return details;
  }


  /**
   * Build comprehensive analysis prompt for Gemini
   */
  private buildAnalysisPrompt(request: IAnalyzeMessageRequest, patternAnalysis: PatternAnalysisResult): string {
    const ctx = request.conversationContext?.length
      ? `\nConversation context (last 5 messages):\n${request.conversationContext.slice(-5).map((m, i) => `${i + 1}. ${m}`).join('\n')}`
      : '';

    const hist = request.customerHistory
      ? `\nCustomer history: ${request.customerHistory.totalOrders} total orders, ${request.customerHistory.completedOrders} completed, ₦${request.customerHistory.averageOrderValue.toFixed(0)} avg order value`
      : '';

    const patternHints = patternAnalysis.hasOrderIntent
      ? `\nPattern analysis detected potential order intent (confidence: ${(patternAnalysis.confidence * 100).toFixed(0)}%)`
      : '';

    return `You are an AI assistant for SellMate, a social commerce platform for Nigerian sellers on WhatsApp and Instagram.

TASK: Analyze the following customer message for order intent and extract relevant information.

Platform: ${request.platform || 'unknown'}
${ctx}
${hist}
${patternHints}

MESSAGE TO ANALYZE:
"${request.messageContent}"

NIGERIAN COMMERCE CONTEXT:
- Nigerian Pidgin is commonly used: "I wan buy" (I want to buy), "Abeg" (Please), "How much e be" (How much is it), "E dey available" (Is it available), "Oya" (Let's go/OK)
- Prices are in Nigerian Naira (₦ or NGN). "5k" means ₦5,000
- Common payment methods: Bank transfer, POS, Cash on delivery
- Major cities: Lagos, Abuja, Port Harcourt, Ibadan, Kano, etc.
- Emojis like 👍, ✅, 🙏, ❤️ often indicate positive intent

ORDER DETECTION KEYWORDS TO LOOK FOR:
English: "I want to buy", "I want to order", "give me", "send me", "how much", "price please", "available?", "can I get", "deliver to"
Pidgin: "I wan buy", "abeg send", "how much e be", "una get am", "make i get", "oya send am", "na how much"

RESPOND WITH JSON:
{
  "orderDetected": boolean (true if customer wants to make a purchase),
  "confidence": number (0-1, how confident you are),
  "extractedDetails": {
    "productName": string or null (what they want to buy),
    "quantity": number or null,
    "price": number or null (in Naira),
    "deliveryAddress": string or null,
    "customerName": string or null,
    "customerContact": string or null (phone number),
    "notes": string or null (special requests)
  },
  "customerIntent": "inquiry" | "purchase" | "complaint" | "support" | "negotiation" | "cancellation" | "follow_up",
  "suggestedResponses": [
    {
      "text": string (suggested reply),
      "type": "confirmation" | "clarification" | "upsell" | "support" | "greeting",
      "confidence": number (0-1),
      "tone": "professional" | "friendly" | "casual",
      "language": "english" | "pidgin" | "mixed"
    }
  ],
  "businessInsights": {
    "upsellOpportunity": boolean,
    "upsellSuggestions": string[] or null,
    "customerValue": "high" | "medium" | "low",
    "urgency": "high" | "medium" | "low",
    "recommendedAction": string or null,
    "purchaseProbability": number (0-1) or null
  }
}`;
  }

  /**
   * Create analysis result from pattern matching when AI is unavailable
   */
  private createPatternBasedAnalysis(
    _request: IAnalyzeMessageRequest,
    patternAnalysis: PatternAnalysisResult,
    startTime: number
  ): IAIAnalysisOutput {
    // Generate basic response suggestions based on intent
    const suggestions = this.generatePatternBasedSuggestions(patternAnalysis);

    return {
      orderDetected: patternAnalysis.hasOrderIntent,
      confidence: patternAnalysis.confidence,
      extractedDetails: patternAnalysis.extractedDetails,
      customerIntent: patternAnalysis.intent,
      suggestedResponses: suggestions,
      businessInsights: {
        upsellOpportunity: patternAnalysis.hasOrderIntent,
        customerValue: CustomerValueLevel.MEDIUM,
        urgency: patternAnalysis.isUrgent ? UrgencyLevel.HIGH : UrgencyLevel.MEDIUM,
        recommendedAction: patternAnalysis.hasOrderIntent
          ? 'Confirm order details and provide payment information'
          : 'Respond to customer inquiry',
      },
      processingTime: Date.now() - startTime,
      modelVersion: 'pattern-based-fallback',
    };
  }

  /**
   * Generate response suggestions based on pattern analysis
   */
  private generatePatternBasedSuggestions(analysis: PatternAnalysisResult): IResponseSuggestion[] {
    const suggestions: IResponseSuggestion[] = [];

    if (analysis.hasOrderIntent) {
      suggestions.push({
        text: 'Thank you for your order! Please confirm the following details:\n- Product:\n- Quantity:\n- Delivery address:\n\nOnce confirmed, I\'ll send you the payment details. 🙏',
        type: ResponseSuggestionType.CONFIRMATION,
        confidence: 0.8,
        tone: ResponseTone.FRIENDLY,
        language: ResponseLanguage.ENGLISH,
      });
      suggestions.push({
        text: 'Thank you! Na which product you wan order? Abeg confirm:\n- Product name:\n- How many:\n- Where you dey?\n\nI go send you account details. 👍',
        type: ResponseSuggestionType.CONFIRMATION,
        confidence: 0.7,
        tone: ResponseTone.FRIENDLY,
        language: ResponseLanguage.PIDGIN,
      });
    } else if (analysis.intent === CustomerIntent.INQUIRY) {
      suggestions.push({
        text: 'Thank you for your interest! How can I help you today? Feel free to ask about any of our products. 😊',
        type: ResponseSuggestionType.GREETING,
        confidence: 0.7,
        tone: ResponseTone.FRIENDLY,
        language: ResponseLanguage.ENGLISH,
      });
    } else if (analysis.intent === CustomerIntent.NEGOTIATION) {
      suggestions.push({
        text: 'I understand you\'re looking for the best price. Let me see what I can do for you. What quantity are you interested in?',
        type: ResponseSuggestionType.CLARIFICATION,
        confidence: 0.7,
        tone: ResponseTone.PROFESSIONAL,
        language: ResponseLanguage.ENGLISH,
      });
    } else if (analysis.intent === CustomerIntent.COMPLAINT) {
      suggestions.push({
        text: 'I\'m sorry to hear about this issue. Please share more details so I can help resolve it for you as quickly as possible. 🙏',
        type: ResponseSuggestionType.SUPPORT,
        confidence: 0.8,
        tone: ResponseTone.PROFESSIONAL,
        language: ResponseLanguage.ENGLISH,
      });
    } else {
      suggestions.push({
        text: 'Thank you for reaching out! How can I assist you today?',
        type: ResponseSuggestionType.GREETING,
        confidence: 0.6,
        tone: ResponseTone.FRIENDLY,
        language: ResponseLanguage.ENGLISH,
      });
    }

    return suggestions;
  }

  /**
   * Combine AI confidence with pattern-based confidence
   */
  private combineConfidence(aiConfidence: number, patternConfidence: number): number {
    // Weight AI confidence higher but use pattern as a boost/validation
    return Math.min(1, (aiConfidence * 0.7) + (patternConfidence * 0.3));
  }


  /**
   * Generate response suggestions for a conversation
   */
  async generateResponseSuggestions(request: IResponseSuggestionRequest): Promise<IResponseSuggestion[]> {
    if (!this.geminiService.isAvailable()) {
      return this.createFallbackSuggestions(request);
    }

    try {
      const prompt = this.buildResponseSuggestionPrompt(request);
      const result = await this.geminiService.generateJSON<{ suggestions: RawResponseSuggestion[] }>(prompt);
      return this.mapResponseSuggestions(result.suggestions, request.tone, request.language) || [];
    } catch (error) {
      console.error('Response suggestion generation failed:', error);
      return this.createFallbackSuggestions(request);
    }
  }

  /**
   * Generate business insights
   */
  async generateBusinessInsights(request: IBusinessInsightsRequest): Promise<IBusinessInsightsResponse> {
    if (!this.geminiService.isAvailable()) {
      return this.createFallbackInsights();
    }

    try {
      const prompt = this.buildBusinessInsightsPrompt(request);
      const result = await this.geminiService.generateJSON<RawBusinessInsightsResponse>(prompt);
      return {
        customerValuePredictions: (result.customerValuePredictions || []).map(p => ({
          customerId: p.customerId || '',
          customerName: p.customerName || 'Unknown',
          predictedValue: this.mapCustomerValueLevel(p.predictedValue),
          purchaseProbability: Math.min(1, Math.max(0, p.purchaseProbability || 0)),
          recommendedAction: p.recommendedAction || 'Follow up with customer',
        })),
        highValueCustomers: result.highValueCustomers || [],
        purchaseTrends: (result.purchaseTrends || []).map(t => ({
          period: t.period || '',
          trend: (t.trend as 'increasing' | 'decreasing' | 'stable') || 'stable',
          topProducts: t.topProducts || [],
          insights: t.insights || [],
        })),
        optimalResponseTiming: {
          bestHours: result.optimalResponseTiming?.bestHours || [9, 10, 11, 14, 15, 16],
          bestDays: result.optimalResponseTiming?.bestDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          averageResponseTime: result.optimalResponseTiming?.averageResponseTime || 30,
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Business insights generation failed:', error);
      return this.createFallbackInsights();
    }
  }

  private buildResponseSuggestionPrompt(request: IResponseSuggestionRequest): string {
    const ctx = request.conversationContext?.length
      ? `\nConversation context:\n${request.conversationContext.slice(-5).join('\n')}`
      : '';

    const toneMap: Record<ResponseTone, string> = {
      [ResponseTone.PROFESSIONAL]: 'professional and formal',
      [ResponseTone.FRIENDLY]: 'friendly and warm',
      [ResponseTone.CASUAL]: 'casual and relaxed',
    };

    const langMap: Record<ResponseLanguage, string> = {
      [ResponseLanguage.ENGLISH]: 'Standard English',
      [ResponseLanguage.PIDGIN]: 'Nigerian Pidgin English',
      [ResponseLanguage.MIXED]: 'Mix of English and Pidgin',
    };

    return `Generate 3 response suggestions for a Nigerian social commerce seller.
${ctx}

Customer message: "${request.messageContent}"

Preferred tone: ${toneMap[request.tone || ResponseTone.FRIENDLY]}
Preferred language: ${langMap[request.language || ResponseLanguage.ENGLISH]}

NIGERIAN PIDGIN EXAMPLES:
- "Thank you o!" (Thank you!)
- "Abeg" (Please)
- "Na wa o" (Expression of surprise)
- "Oya" (Let's go/OK)
- "E go be" (It will be fine)
- "No wahala" (No problem)

RESPOND WITH JSON:
{
  "suggestions": [
    {
      "text": string,
      "type": "confirmation" | "clarification" | "upsell" | "support" | "greeting" | "follow_up",
      "confidence": number (0-1),
      "tone": "professional" | "friendly" | "casual",
      "language": "english" | "pidgin" | "mixed"
    }
  ]
}`;
  }

  private buildBusinessInsightsPrompt(request: IBusinessInsightsRequest): string {
    const dateRange = request.startDate && request.endDate
      ? `Period: ${request.startDate.toISOString().split('T')[0]} to ${request.endDate.toISOString().split('T')[0]}`
      : 'Period: Last 30 days';

    return `Generate business insights for a Nigerian social commerce seller.

User ID: ${request.userId}
${dateRange}
Include customer analysis: ${request.includeCustomerAnalysis ?? true}
Include trend analysis: ${request.includeTrendAnalysis ?? true}

RESPOND WITH JSON:
{
  "customerValuePredictions": [
    {
      "customerId": string,
      "customerName": string,
      "predictedValue": "high" | "medium" | "low",
      "purchaseProbability": number (0-1),
      "recommendedAction": string
    }
  ],
  "highValueCustomers": [
    {
      "customerId": string,
      "customerName": string,
      "totalValue": number,
      "orderCount": number
    }
  ],
  "purchaseTrends": [
    {
      "period": string,
      "trend": "increasing" | "decreasing" | "stable",
      "topProducts": string[],
      "insights": string[]
    }
  ],
  "optimalResponseTiming": {
    "bestHours": number[],
    "bestDays": string[],
    "averageResponseTime": number
  }
}`;
  }


  // Mapping helper methods
  private mapCustomerIntent(intent?: string): CustomerIntent {
    const map: Record<string, CustomerIntent> = {
      inquiry: CustomerIntent.INQUIRY,
      purchase: CustomerIntent.PURCHASE,
      complaint: CustomerIntent.COMPLAINT,
      support: CustomerIntent.SUPPORT,
      negotiation: CustomerIntent.NEGOTIATION,
      cancellation: CustomerIntent.CANCELLATION,
      follow_up: CustomerIntent.FOLLOW_UP,
    };
    return map[intent?.toLowerCase() || ''] || CustomerIntent.INQUIRY;
  }

  private mapCustomerValueLevel(value?: string): CustomerValueLevel {
    const map: Record<string, CustomerValueLevel> = {
      high: CustomerValueLevel.HIGH,
      medium: CustomerValueLevel.MEDIUM,
      low: CustomerValueLevel.LOW,
    };
    return map[value?.toLowerCase() || ''] || CustomerValueLevel.MEDIUM;
  }

  private mapUrgencyLevel(urgency?: string): UrgencyLevel {
    const map: Record<string, UrgencyLevel> = {
      high: UrgencyLevel.HIGH,
      medium: UrgencyLevel.MEDIUM,
      low: UrgencyLevel.LOW,
    };
    return map[urgency?.toLowerCase() || ''] || UrgencyLevel.MEDIUM;
  }

  private mapResponseType(type?: string): ResponseSuggestionType {
    const map: Record<string, ResponseSuggestionType> = {
      confirmation: ResponseSuggestionType.CONFIRMATION,
      clarification: ResponseSuggestionType.CLARIFICATION,
      upsell: ResponseSuggestionType.UPSELL,
      support: ResponseSuggestionType.SUPPORT,
      greeting: ResponseSuggestionType.GREETING,
      follow_up: ResponseSuggestionType.FOLLOW_UP,
    };
    return map[type?.toLowerCase() || ''] || ResponseSuggestionType.SUPPORT;
  }

  private mapTone(tone?: string): ResponseTone {
    const map: Record<string, ResponseTone> = {
      professional: ResponseTone.PROFESSIONAL,
      friendly: ResponseTone.FRIENDLY,
      casual: ResponseTone.CASUAL,
    };
    return map[tone?.toLowerCase() || ''] || ResponseTone.FRIENDLY;
  }

  private mapLanguage(language?: string): ResponseLanguage {
    const map: Record<string, ResponseLanguage> = {
      english: ResponseLanguage.ENGLISH,
      pidgin: ResponseLanguage.PIDGIN,
      mixed: ResponseLanguage.MIXED,
    };
    return map[language?.toLowerCase() || ''] || ResponseLanguage.ENGLISH;
  }

  private mapResponseSuggestions(
    suggestions?: RawResponseSuggestion[],
    defaultTone?: ResponseTone,
    defaultLanguage?: ResponseLanguage
  ): IResponseSuggestion[] | undefined {
    if (!suggestions || suggestions.length === 0) return undefined;
    return suggestions.map(s => ({
      text: s.text,
      type: this.mapResponseType(s.type),
      confidence: Math.min(1, Math.max(0, s.confidence || 0.5)),
      tone: s.tone ? this.mapTone(s.tone) : (defaultTone || ResponseTone.FRIENDLY),
      language: s.language ? this.mapLanguage(s.language) : (defaultLanguage || ResponseLanguage.ENGLISH),
    }));
  }

  private mapBusinessInsights(insights?: RawBusinessInsights) {
    if (!insights) return undefined;
    return {
      upsellOpportunity: insights.upsellOpportunity || false,
      upsellSuggestions: insights.upsellSuggestions,
      customerValue: this.mapCustomerValueLevel(insights.customerValue),
      urgency: this.mapUrgencyLevel(insights.urgency),
      recommendedAction: insights.recommendedAction,
      purchaseProbability: insights.purchaseProbability,
    };
  }

  // Fallback methods
  private createFallbackSuggestions(request: IResponseSuggestionRequest): IResponseSuggestion[] {
    const tone = request.tone || ResponseTone.FRIENDLY;
    const language = request.language || ResponseLanguage.ENGLISH;

    if (language === ResponseLanguage.PIDGIN) {
      return [
        {
          text: 'Thank you for your message! How I fit help you today? 🙏',
          type: ResponseSuggestionType.GREETING,
          confidence: 0.5,
          tone,
          language,
        },
        {
          text: 'Abeg give me small time, I go check and get back to you. 👍',
          type: ResponseSuggestionType.SUPPORT,
          confidence: 0.5,
          tone,
          language,
        },
      ];
    }

    return [
      {
        text: 'Thank you for your message! How can I help you today? 😊',
        type: ResponseSuggestionType.GREETING,
        confidence: 0.5,
        tone,
        language,
      },
      {
        text: 'Please give me a moment, I will check and get back to you shortly.',
        type: ResponseSuggestionType.SUPPORT,
        confidence: 0.5,
        tone,
        language,
      },
    ];
  }

  private createFallbackInsights(): IBusinessInsightsResponse {
    return {
      customerValuePredictions: [],
      highValueCustomers: [],
      purchaseTrends: [{
        period: 'This Week',
        trend: 'stable',
        topProducts: [],
        insights: ['AI insights unavailable. Please configure GEMINI_API_KEY for full functionality.'],
      }],
      optimalResponseTiming: {
        bestHours: [9, 10, 11, 14, 15, 16],
        bestDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        averageResponseTime: 30,
      },
      generatedAt: new Date(),
    };
  }
}

/**
 * Pattern analysis result interface
 */
interface PatternAnalysisResult {
  hasOrderIntent: boolean;
  confidence: number;
  intent: CustomerIntent;
  extractedDetails: IExtractedOrderDetails;
  isUrgent: boolean;
  matchedPatterns: {
    english: string[];
    pidgin: string[];
    quantity: string[];
    payment: string[];
    delivery: string[];
    urgency: string[];
    negotiation: string[];
  };
  hasPositiveEmoji: boolean;
}
