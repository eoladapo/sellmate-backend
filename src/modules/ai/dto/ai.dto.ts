import { z } from 'zod';
import { ResponseTone, ResponseLanguage } from '../enums';

/**
 * Analyze message request DTO
 */
export const analyzeMessageSchema = z.object({
  messageContent: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  conversationId: z.string().uuid().optional(),
  platform: z.enum(['whatsapp', 'instagram']).optional(),
  conversationContext: z.array(z.string()).max(20).optional(),
  customerHistory: z.object({
    totalOrders: z.number().int().min(0),
    completedOrders: z.number().int().min(0),
    abandonedOrders: z.number().int().min(0),
    totalValue: z.number().min(0),
    averageOrderValue: z.number().min(0),
    lastOrderDate: z.string().datetime().optional(),
    abandonmentRate: z.number().min(0).max(1),
    preferredProducts: z.array(z.string()).optional(),
  }).optional(),
});

export type AnalyzeMessageDTO = z.infer<typeof analyzeMessageSchema>;

/**
 * Response suggestion request DTO
 */
export const responseSuggestionSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messageContent: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  conversationContext: z.array(z.string()).max(20).optional(),
  customerHistory: z.object({
    totalOrders: z.number().int().min(0),
    completedOrders: z.number().int().min(0),
    abandonedOrders: z.number().int().min(0),
    totalValue: z.number().min(0),
    averageOrderValue: z.number().min(0),
    lastOrderDate: z.string().datetime().optional(),
    abandonmentRate: z.number().min(0).max(1),
    preferredProducts: z.array(z.string()).optional(),
  }).optional(),
  tone: z.nativeEnum(ResponseTone).optional().default(ResponseTone.FRIENDLY),
  language: z.nativeEnum(ResponseLanguage).optional().default(ResponseLanguage.ENGLISH),
  businessProfile: z.object({
    name: z.string(),
    products: z.array(z.string()).optional(),
    defaultLocation: z.string().optional(),
  }).optional(),
});

export type ResponseSuggestionDTO = z.infer<typeof responseSuggestionSchema>;

/**
 * Business insights request DTO
 */
export const businessInsightsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeCustomerAnalysis: z.boolean().optional().default(true),
  includeTrendAnalysis: z.boolean().optional().default(true),
});

export type BusinessInsightsDTO = z.infer<typeof businessInsightsSchema>;

/**
 * AI Analysis response DTO
 */
export interface AIAnalysisResponseDTO {
  success: boolean;
  data: {
    orderDetected: boolean;
    confidence: number;
    extractedDetails?: {
      productName?: string;
      quantity?: number;
      price?: number;
      deliveryAddress?: string;
      customerName?: string;
      customerContact?: string;
      notes?: string;
    };
    customerIntent?: string;
    suggestedResponses?: Array<{
      text: string;
      type: string;
      confidence: number;
      tone: string;
      language: string;
    }>;
    businessInsights?: {
      upsellOpportunity: boolean;
      upsellSuggestions?: string[];
      customerValue: string;
      urgency: string;
      recommendedAction?: string;
      purchaseProbability?: number;
    };
    processingTime: number;
    modelVersion: string;
  };
}

/**
 * Response suggestions response DTO
 */
export interface ResponseSuggestionsResponseDTO {
  success: boolean;
  data: {
    suggestions: Array<{
      text: string;
      type: string;
      confidence: number;
      tone: string;
      language: string;
    }>;
    processingTime: number;
  };
}

/**
 * Business insights response DTO
 */
export interface BusinessInsightsResponseDTO {
  success: boolean;
  data: {
    customerValuePredictions: Array<{
      customerId: string;
      customerName: string;
      predictedValue: string;
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
      trend: string;
      topProducts: string[];
      insights: string[];
    }>;
    optimalResponseTiming: {
      bestHours: number[];
      bestDays: string[];
      averageResponseTime: number;
    };
    generatedAt: string;
  };
}
