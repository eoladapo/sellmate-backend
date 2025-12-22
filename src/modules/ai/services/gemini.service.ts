import { injectable } from 'tsyringe';
import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { appConfig } from '../../../config/app.config';
import { AIErrorCode } from '../enums';

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limiter for AI requests
 * Implements sliding window rate limiting
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(config: RateLimiterConfig = { maxRequests: 20, windowMs: 60000 }) {
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
  }

  /**
   * Check if a request can be made within rate limits
   */
  canMakeRequest(): boolean {
    this.cleanupOldRequests();
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a new request
   */
  recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Get wait time until next request can be made
   */
  getWaitTime(): number {
    if (this.canMakeRequest()) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(): number {
    this.cleanupOldRequests();
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  /**
   * Get current rate limit status
   */
  getStatus(): { remaining: number; resetIn: number; limit: number } {
    this.cleanupOldRequests();
    return {
      remaining: this.getRemainingRequests(),
      resetIn: this.getWaitTime(),
      limit: this.maxRequests,
    };
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  reset(): void {
    this.requests = [];
  }

  /**
   * Clean up expired requests from the window
   */
  private cleanupOldRequests(): void {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
  }
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

/**
 * Circuit breaker for AI service resilience
 * Prevents cascading failures when AI service is unavailable
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private halfOpenSuccesses: number = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenRequests: 2,
  }) {
    this.config = config;
  }

  /**
   * Check if request is allowed
   */
  canRequest(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has passed
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenSuccesses = 0;
        console.log('🔌 Circuit breaker: HALF_OPEN - Testing service availability');
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow limited requests
    return true;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.halfOpenRequests) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        console.log('🔌 Circuit breaker: CLOSED - Service recovered');
      }
    } else {
      this.failures = 0;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      console.log('🔌 Circuit breaker: OPEN - Service still failing');
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`🔌 Circuit breaker: OPEN - ${this.failures} consecutive failures`);
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker status
   */
  getStatus(): { state: string; failures: number; resetIn: number } {
    return {
      state: this.state,
      failures: this.failures,
      resetIn: this.state === CircuitState.OPEN
        ? Math.max(0, this.config.resetTimeout - (Date.now() - this.lastFailureTime))
        : 0,
    };
  }

  /**
   * Reset the circuit breaker (useful for testing)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastFailureTime = 0;
    this.halfOpenSuccesses = 0;
  }
}

/**
 * AI Service Error
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public retryable: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * Gemini AI Service
 * Wrapper for Google Generative AI SDK with rate limiting and error handling
 * 
 * Model: gemini-2.0-flash (latest stable flash model as of Dec 2024)
 * - Fast responses optimized for chat and quick tasks
 * - Supports text generation and JSON output
 * - Good multilingual support including Nigerian Pidgin
 */
@injectable()
export class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private rateLimiter: RateLimiter;
  // Using gemini-2.0-flash - the latest stable flash model
  // Alternative: 'gemini-1.5-flash' if 2.0 is not available in your region
  private readonly modelName = 'gemini-2.0-flash';
  private readonly modelVersion = 'gemini-2.0-flash';
  private isInitialized = false;

  constructor() {
    // Rate limit: 15 requests per minute (conservative for free tier)
    this.rateLimiter = new RateLimiter({ maxRequests: 15, windowMs: 60000 });
    this.initialize();
  }

  /**
   * Initialize the Gemini client
   */
  private initialize(): void {
    const apiKey = appConfig.ai.gemini.apiKey;

    if (!apiKey) {
      console.warn('⚠️ Gemini API key not configured. AI features will be unavailable.');
      return;
    }

    try {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ model: this.modelName });
      this.isInitialized = true;
      console.log('🤖 Gemini AI service initialized');
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Get the model version
   */
  getModelVersion(): string {
    return this.modelVersion;
  }

  /**
   * Get remaining rate limit requests
   */
  getRemainingRequests(): number {
    return this.rateLimiter.getRemainingRequests();
  }

  /**
   * Generate content with rate limiting and error handling
   */
  async generateContent(
    prompt: string,
    config?: Partial<GenerationConfig>
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new AIServiceError(
        'AI service is not available. Please configure GEMINI_API_KEY.',
        AIErrorCode.CONFIGURATION_ERROR,
        false
      );
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getWaitTime();
      throw new AIServiceError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        AIErrorCode.RATE_LIMIT_EXCEEDED,
        true,
        waitTime
      );
    }

    const startTime = Date.now();

    try {
      this.rateLimiter.recordRequest();

      const generationConfig: GenerationConfig = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
        ...config,
      };

      const result = await this.model!.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;
      console.log(`🤖 AI request completed in ${processingTime}ms`);

      return text;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      console.error(`🤖 AI request failed after ${processingTime}ms:`, error.message);

      // Handle specific error types
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new AIServiceError(
          'AI service rate limit exceeded. Please try again later.',
          AIErrorCode.RATE_LIMIT_EXCEEDED,
          true,
          60000
        );
      }

      if (error.message?.includes('timeout') || error.message?.includes('DEADLINE_EXCEEDED')) {
        throw new AIServiceError(
          'AI processing timed out. Please try again.',
          AIErrorCode.PROCESSING_TIMEOUT,
          true
        );
      }

      if (error.message?.includes('unavailable') || error.message?.includes('503')) {
        throw new AIServiceError(
          'AI service is temporarily unavailable. Please try again later.',
          AIErrorCode.MODEL_UNAVAILABLE,
          true,
          30000
        );
      }

      throw new AIServiceError(
        `AI processing failed: ${error.message}`,
        AIErrorCode.API_ERROR,
        false
      );
    }
  }

  /**
   * Generate JSON content with automatic parsing
   */
  async generateJSON<T>(prompt: string, config?: Partial<GenerationConfig>): Promise<T> {
    const jsonPrompt = `${prompt}

IMPORTANT: Respond ONLY with valid JSON. Do not include any markdown formatting, code blocks, or explanatory text. The response must be parseable JSON.`;

    const response = await this.generateContent(jsonPrompt, {
      ...config,
      temperature: 0.3, // Lower temperature for more consistent JSON output
    });

    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      return JSON.parse(cleanedResponse) as T;
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', response);
      throw new AIServiceError(
        'Failed to parse AI response as JSON',
        AIErrorCode.API_ERROR,
        true
      );
    }
  }
}
