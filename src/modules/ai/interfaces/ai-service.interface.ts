import {
  CustomerIntent,
  ResponseTone,
  ResponseLanguage,
  ResponseSuggestionType,
  CustomerValueLevel,
  UrgencyLevel,
} from '../enums';

/**
 * Extracted order details from AI analysis
 */
export interface IExtractedOrderDetails {
  productName?: string;
  quantity?: number;
  price?: number;
  deliveryAddress?: string;
  customerName?: string;
  customerContact?: string;
  notes?: string;
}

/**
 * Response suggestion from AI
 */
export interface IResponseSuggestion {
  text: string;
  type: ResponseSuggestionType;
  confidence: number;
  tone: ResponseTone;
  language: ResponseLanguage;
}

/**
 * Business insights from AI analysis
 */
export interface IBusinessInsights {
  upsellOpportunity: boolean;
  upsellSuggestions?: string[];
  customerValue: CustomerValueLevel;
  urgency: UrgencyLevel;
  recommendedAction?: string;
  purchaseProbability?: number;
}

/**
 * Customer summary for AI context
 */
export interface ICustomerSummary {
  totalOrders: number;
  completedOrders: number;
  abandonedOrders: number;
  totalValue: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  abandonmentRate: number;
  preferredProducts?: string[];
}

/**
 * AI Analysis input
 */
export interface IAIAnalysisInput {
  messageContent: string;
  conversationContext?: string[];
  customerHistory?: ICustomerSummary;
  platform?: 'whatsapp' | 'instagram';
  businessProfile?: {
    name: string;
    products?: string[];
    defaultLocation?: string;
  };
}

/**
 * AI Analysis output
 */
export interface IAIAnalysisOutput {
  orderDetected: boolean;
  confidence: number;
  extractedDetails?: IExtractedOrderDetails;
  customerIntent?: CustomerIntent;
  suggestedResponses?: IResponseSuggestion[];
  businessInsights?: IBusinessInsights;
  processingTime: number;
  modelVersion: string;
}

/**
 * Message analysis request
 */
export interface IAnalyzeMessageRequest {
  messageContent: string;
  conversationId?: string;
  platform?: 'whatsapp' | 'instagram';
  conversationContext?: string[];
  customerHistory?: ICustomerSummary;
}

/**
 * Response suggestion request
 */
export interface IResponseSuggestionRequest {
  conversationId?: string;
  messageContent: string;
  conversationContext?: string[];
  customerHistory?: ICustomerSummary;
  tone?: ResponseTone;
  language?: ResponseLanguage;
  businessProfile?: {
    name: string;
    products?: string[];
    defaultLocation?: string;
  };
}

/**
 * Business insights request
 */
export interface IBusinessInsightsRequest {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  includeCustomerAnalysis?: boolean;
  includeTrendAnalysis?: boolean;
}

/**
 * Business insights response
 */
export interface IBusinessInsightsResponse {
  customerValuePredictions: Array<{
    customerId: string;
    customerName: string;
    predictedValue: CustomerValueLevel;
    purchaseProbability: number;
    recommendedAction: string;
  }>;
  highValueCustomers: Array<{
    customerId: string;
    customerName: string;
    totalValue: number;
    orderCount: number;
  }>;
  purchaseTrends: Array<{
    period: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    topProducts: string[];
    insights: string[];
  }>;
  optimalResponseTiming: {
    bestHours: number[];
    bestDays: string[];
    averageResponseTime: number;
  };
  generatedAt: Date;
}

/**
 * AI Service Interface
 */
export interface IAIService {
  /**
   * Analyze a message for order detection and intent
   */
  analyzeMessage(request: IAnalyzeMessageRequest): Promise<IAIAnalysisOutput>;

  /**
   * Generate response suggestions for a conversation
   */
  generateResponseSuggestions(request: IResponseSuggestionRequest): Promise<IResponseSuggestion[]>;

  /**
   * Generate business insights
   */
  generateBusinessInsights(request: IBusinessInsightsRequest): Promise<IBusinessInsightsResponse>;

  /**
   * Check if AI service is available
   */
  isAvailable(): Promise<boolean>;
}
