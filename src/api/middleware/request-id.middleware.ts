import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID middleware
 * Generates unique request IDs for tracking and logging
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  const reqId = req.headers['x-request-id'] as string || randomUUID();

  // Store in response locals for access in other middleware
  res.locals.requestId = reqId;

  // Add to response headers for client tracking
  res.setHeader('X-Request-ID', reqId);

  // Add to request object for logging
  req.requestId = reqId;

  next();
};