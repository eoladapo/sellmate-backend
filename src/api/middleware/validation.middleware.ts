import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error.middleware';

/**
 * Validation target types
 */
type ValidationTarget = 'body' | 'query' | 'params' | 'headers';

/**
 * Validation options
 */
interface ValidationOptions {
  target: ValidationTarget;
  schema: ZodSchema;
  optional?: boolean;
}

/**
 * Generic validation middleware factory
 * Creates middleware to validate request data using Zod schemas
 */
export const validate = (options: ValidationOptions | ValidationOptions[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validationRules = Array.isArray(options) ? options : [options];

      for (const rule of validationRules) {
        const { target, schema, optional = false } = rule;
        const data = req[target];

        // Skip validation if optional and data is empty
        if (optional && (!data || Object.keys(data).length === 0)) {
          continue;
        }

        // Validate and transform data
        const result = schema.parse(data);

        // Replace original data with validated/transformed data
        (req as any)[target] = result;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error); // Will be handled by error middleware
      } else {
        next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));
      }
    }
  };
};

/**
 * Validate request body
 */
export const validateBody = (schema: ZodSchema, optional = false) => {
  return validate({ target: 'body', schema, optional });
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema, optional = false) => {
  return validate({ target: 'query', schema, optional });
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodSchema, optional = false) => {
  return validate({ target: 'params', schema, optional });
};

/**
 * Validate headers
 */
export const validateHeaders = (schema: ZodSchema, optional = false) => {
  return validate({ target: 'headers', schema, optional });
};

/**
 * Sanitization middleware
 * Removes potentially dangerous characters from input
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize body, query, and params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * File upload validation middleware
 * Will be used for business profile images, product images, and document uploads
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;

    // Check if file is required
    if (required && !req.file && !req.files) {
      return next(new AppError('File is required', 400, 'FILE_REQUIRED'));
    }

    // Skip validation if no file uploaded and not required
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];

    for (const file of files) {
      if (!file) continue;

      // Check file size
      if (file.size > maxSize) {
        return next(new AppError(
          `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
          400,
          'FILE_TOO_LARGE'
        ));
      }

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return next(new AppError(
          `File type ${file.mimetype} not allowed`,
          400,
          'INVALID_FILE_TYPE'
        ));
      }
    }

    next();
  };
};


export const validateRequestSize = (maxSize: number = 1024 * 1024) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);

    if (contentLength > maxSize) {
      return next(new AppError(
        `Request size exceeds limit of ${maxSize / (1024 * 1024)}MB`,
        413,
        'REQUEST_TOO_LARGE'
      ));
    }

    next();
  };
};