import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';
import {
  analyzeMessageSchema,
  responseSuggestionSchema,
  businessInsightsSchema,
} from '../dto/ai.dto';
import { ResponseTone, ResponseLanguage } from '../enums';

/**
 * AI Controller
 * Handles AI-related API endpoints
 */
export class AIController {
  constructor(private aiService: AIService) { }

  /**
   * POST /api/v1/ai/analyze
   * Analyze a message for order detection and intent
   */
  analyzeMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = analyzeMessageSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const result = await this.aiService.analyzeMessage({
        messageContent: validation.data.messageContent,
        conversationId: validation.data.conversationId,
        platform: validation.data.platform,
        conversationContext: validation.data.conversationContext,
        customerHistory: validation.data.customerHistory
          ? {
            ...validation.data.customerHistory,
            lastOrderDate: validation.data.customerHistory.lastOrderDate
              ? new Date(validation.data.customerHistory.lastOrderDate)
              : undefined,
          }
          : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };


  /**
   * POST /api/v1/ai/suggest-response
   * Generate response suggestions for a conversation
   */
  suggestResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = responseSuggestionSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const startTime = Date.now();
      const suggestions = await this.aiService.generateResponseSuggestions({
        conversationId: validation.data.conversationId,
        messageContent: validation.data.messageContent,
        conversationContext: validation.data.conversationContext,
        customerHistory: validation.data.customerHistory
          ? {
            ...validation.data.customerHistory,
            lastOrderDate: validation.data.customerHistory.lastOrderDate
              ? new Date(validation.data.customerHistory.lastOrderDate)
              : undefined,
          }
          : undefined,
        tone: validation.data.tone as ResponseTone,
        language: validation.data.language as ResponseLanguage,
        businessProfile: validation.data.businessProfile,
      });

      res.json({
        success: true,
        data: {
          suggestions,
          processingTime: Date.now() - startTime,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/ai/insights
   * Generate business insights
   */
  getInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = businessInsightsSchema.safeParse(req.query);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
        return;
      }

      const insights = await this.aiService.generateBusinessInsights({
        userId,
        startDate: validation.data.startDate ? new Date(validation.data.startDate) : undefined,
        endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined,
        includeCustomerAnalysis: validation.data.includeCustomerAnalysis,
        includeTrendAnalysis: validation.data.includeTrendAnalysis,
      });

      res.json({
        success: true,
        data: {
          ...insights,
          generatedAt: insights.generatedAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/ai/status
   * Check AI service availability
   */
  getStatus = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAvailable = await this.aiService.isAvailable();

      res.json({
        success: true,
        data: {
          available: isAvailable,
          provider: 'gemini',
          model: 'gemini-2.0-flash',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
