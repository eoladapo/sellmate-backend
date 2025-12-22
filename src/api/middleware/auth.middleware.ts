import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../config/app.config';
import { UserRole } from '../../shared/enums/user-role.enum';

/**
 * Subscription tier types for rate limiting
 */
export type SubscriptionTier = 'starter' | 'professional' | 'business' | 'premium';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phoneNumber: string;
        role?: UserRole;
        subscriptionTier?: SubscriptionTier;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  role?: UserRole;
  subscriptionTier?: SubscriptionTier;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header missing',
        code: 'AUTH_HEADER_MISSING',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token missing',
        code: 'ACCESS_TOKEN_MISSING',
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, appConfig.jwt.accessSecret) as JWTPayload;

      // Add user info to request (including role for RBAC and subscription tier for rate limiting)
      req.user = {
        id: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        role: decoded.role || UserRole.SELLER, // Default to seller if not specified
        subscriptionTier: decoded.subscriptionTier,
        iat: decoded.iat,
        exp: decoded.exp,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Access token expired',
          code: 'ACCESS_TOKEN_EXPIRED',
        });
        return;
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid access token',
          code: 'ACCESS_TOKEN_INVALID',
        });
        return;
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_MIDDLEWARE_ERROR',
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is present, but doesn't require it
 */
export const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, appConfig.jwt.accessSecret) as JWTPayload;

      req.user = {
        id: decoded.userId,
        phoneNumber: decoded.phoneNumber,
        role: decoded.role || UserRole.SELLER,
        subscriptionTier: decoded.subscriptionTier,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (jwtError: any) {
      // For optional auth, we don't throw errors, just continue without user
      console.warn('Optional auth middleware - invalid token:', jwtError.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};