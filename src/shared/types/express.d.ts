import { Request } from 'express';

/**
 * Extend Express Request interface
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phoneNumber: string;
        businessName: string;
        subscriptionTier?: 'starter' | 'premium' | 'business';
        role?: 'user' | 'admin';
      };
      requestId?: string;
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
      files?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

export { };