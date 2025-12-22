/**
 * AI Analysis Types
 */
export enum AIAnalysisType {
  ORDER_DETECTION = 'order_detection',
  INTENT_ANALYSIS = 'intent_analysis',
  RESPONSE_SUGGESTION = 'response_suggestion',
  BUSINESS_INSIGHTS = 'business_insights',
}

/**
 * Customer Intent Types
 */
export enum CustomerIntent {
  INQUIRY = 'inquiry',
  PURCHASE = 'purchase',
  COMPLAINT = 'complaint',
  SUPPORT = 'support',
  NEGOTIATION = 'negotiation',
  CANCELLATION = 'cancellation',
  FOLLOW_UP = 'follow_up',
}

/**
 * Response Tone Types
 */
export enum ResponseTone {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  CASUAL = 'casual',
}

/**
 * Response Language Types
 */
export enum ResponseLanguage {
  ENGLISH = 'english',
  PIDGIN = 'pidgin',
  MIXED = 'mixed',
}

/**
 * Response Suggestion Types
 */
export enum ResponseSuggestionType {
  CONFIRMATION = 'confirmation',
  CLARIFICATION = 'clarification',
  UPSELL = 'upsell',
  SUPPORT = 'support',
  GREETING = 'greeting',
  FOLLOW_UP = 'follow_up',
}

/**
 * Customer Value Levels
 */
export enum CustomerValueLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Urgency Levels
 */
export enum UrgencyLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * AI Error Codes
 */
export enum AIErrorCode {
  API_ERROR = 'AI_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'AI_RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'AI_INVALID_INPUT',
  PROCESSING_TIMEOUT = 'AI_PROCESSING_TIMEOUT',
  MODEL_UNAVAILABLE = 'AI_MODEL_UNAVAILABLE',
  CONFIGURATION_ERROR = 'AI_CONFIGURATION_ERROR',
}
