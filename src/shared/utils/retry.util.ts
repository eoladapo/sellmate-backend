/**
 * Retry utility with exponential backoff for resilient operations
 * Implements configurable retry logic with support for identifying retryable vs non-retryable errors
 */

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay in milliseconds cap (default: 30000) */
  maxDelayMs: number;
  /** Error codes/names that should trigger a retry */
  retryableErrors: string[];
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'DB_DEADLOCK',
    'SQLITE_BUSY',
    'ER_LOCK_DEADLOCK',
    'ER_LOCK_WAIT_TIMEOUT',
    'RATE_LIMIT_EXCEEDED',
    '429',
    '503',
    '504',
  ],
};

/**
 * Determines if an error is retryable based on the configuration
 * @param error - The error to check
 * @param retryableErrors - List of error codes/names that are retryable
 * @returns true if the error should trigger a retry
 */
export function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  const errorCode = (error as any).code;
  const errorName = error.name;
  const errorMessage = error.message;

  // Check if error code matches
  if (errorCode && retryableErrors.includes(errorCode)) {
    return true;
  }

  // Check if error name matches
  if (errorName && retryableErrors.includes(errorName)) {
    return true;
  }

  // Check if any retryable error string is contained in the message
  for (const retryableError of retryableErrors) {
    if (errorMessage.includes(retryableError)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates the delay for a given retry attempt using exponential backoff with jitter
 * @param attempt - The current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);

  // Add jitter (±25% randomization) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  const delayWithJitter = exponentialDelay + jitter;

  // Cap at maxDelayMs
  return Math.min(Math.max(0, delayWithJitter), maxDelayMs);
}

/**
 * Delays execution for the specified number of milliseconds
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes an async operation with retry logic and exponential backoff
 * @param operation - The async operation to execute
 * @param config - Partial retry configuration (merged with defaults)
 * @returns RetryResult containing success status, data/error, and attempt info
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const mergedConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | undefined;
  let attempts = 0;
  let totalDelayMs = 0;

  for (let attempt = 0; attempt <= mergedConfig.maxRetries; attempt++) {
    attempts = attempt + 1;

    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        attempts,
        totalDelayMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry =
        attempt < mergedConfig.maxRetries &&
        isRetryableError(lastError, mergedConfig.retryableErrors);

      if (!shouldRetry) {
        break;
      }

      // Calculate and apply backoff delay
      const backoffDelay = calculateBackoffDelay(
        attempt,
        mergedConfig.baseDelayMs,
        mergedConfig.maxDelayMs
      );
      totalDelayMs += backoffDelay;

      await delay(backoffDelay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    totalDelayMs,
  };
}

/**
 * Executes an async operation with retry logic, throwing on final failure
 * This is a convenience wrapper that throws the error instead of returning a result object
 * @param operation - The async operation to execute
 * @param config - Partial retry configuration (merged with defaults)
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function executeWithRetryOrThrow<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const result = await executeWithRetry(operation, config);

  if (!result.success) {
    throw result.error;
  }

  return result.data as T;
}

/**
 * Creates a retry wrapper with pre-configured settings
 * Useful for creating domain-specific retry utilities
 * @param config - Partial retry configuration
 * @returns A function that executes operations with the configured retry settings
 */
export function createRetryExecutor(config: Partial<RetryConfig> = {}) {
  return <T>(operation: () => Promise<T>): Promise<RetryResult<T>> => {
    return executeWithRetry(operation, config);
  };
}
