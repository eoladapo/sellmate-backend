import { Response } from 'express';

/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  errors?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
}

/**
 * Pagination interface
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

/**
 * Success response utility
 */
export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  pagination?: PaginationOptions
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      requestId: res.locals.requestId,
    },
  };

  if (pagination) {
    response.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    };
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response utility
 */
export const errorResponse = (
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 500,
  errors?: Array<{ field?: string; message: string; code?: string }>,
  errorCode?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      requestId: res.locals.requestId,
    },
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  if (errorCode) {
    (response.meta as any).errorCode = errorCode;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response utility (201)
 */
export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return successResponse(res, data, message, 201);
};

/**
 * No content response utility (204)
 */
export const noContentResponse = (res: Response): Response => {
  return res.status(204).send();
};

/**
 * Not found response utility (404)
 */
export const notFoundResponse = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return errorResponse(res, message, 404, undefined, 'RESOURCE_NOT_FOUND');
};

/**
 * Unauthorized response utility (401)
 */
export const unauthorizedResponse = (
  res: Response,
  message: string = 'Unauthorized access'
): Response => {
  return errorResponse(res, message, 401, undefined, 'UNAUTHORIZED');
};

/**
 * Forbidden response utility (403)
 */
export const forbiddenResponse = (
  res: Response,
  message: string = 'Access forbidden'
): Response => {
  return errorResponse(res, message, 403, undefined, 'FORBIDDEN');
};

/**
 * Validation error response utility (400)
 */
export const validationErrorResponse = (
  res: Response,
  errors: Array<{ field?: string; message: string; code?: string }>,
  message: string = 'Validation failed'
): Response => {
  return errorResponse(res, message, 400, errors, 'VALIDATION_ERROR');
};

/**
 * Conflict response utility (409)
 */
export const conflictResponse = (
  res: Response,
  message: string = 'Resource conflict'
): Response => {
  return errorResponse(res, message, 409, undefined, 'CONFLICT');
};

/**
 * Too many requests response utility (429)
 */
export const tooManyRequestsResponse = (
  res: Response,
  message: string = 'Too many requests',
  retryAfter?: number
): Response => {
  if (retryAfter) {
    res.set('Retry-After', retryAfter.toString());
  }
  return errorResponse(res, message, 429, undefined, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Internal server error response utility (500)
 */
export const internalServerErrorResponse = (
  res: Response,
  message: string = 'Internal server error'
): Response => {
  return errorResponse(res, message, 500, undefined, 'INTERNAL_SERVER_ERROR');
};

/**
 * Paginated response utility
 */
export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: PaginationOptions,
  message: string = 'Data retrieved successfully'
): Response => {
  return successResponse(res, data, message, 200, pagination);
};

/**
 * Health check response utility
 */
export const healthCheckResponse = (
  res: Response,
  status: 'ok' | 'degraded' | 'error',
  services: Record<string, string>,
  uptime?: number
): Response => {
  const statusCode = status === 'ok' ? 200 : status === 'degraded' ? 200 : 503;

  const healthData = {
    status,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.API_VERSION || 'v1',
    uptime: uptime || process.uptime(),
    services,
  };

  return res.status(statusCode).json(healthData);
};

/**
 * File download response utility
 */
export const fileDownloadResponse = (
  res: Response,
  filePath: string,
  fileName: string,
  mimeType?: string
): void => {
  if (mimeType) {
    res.setHeader('Content-Type', mimeType);
  }
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.download(filePath, fileName);
};

/**
 * Redirect response utility
 */
export const redirectResponse = (
  res: Response,
  url: string,
  permanent: boolean = false
): void => {
  const statusCode = permanent ? 301 : 302;
  res.redirect(statusCode, url);
};

/**
 * Custom response utility for specific status codes
 */
export const customResponse = <T>(
  res: Response,
  statusCode: number,
  data: T,
  message: string,
  success: boolean = true
): Response => {
  const response: ApiResponse<T> = {
    success,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
      requestId: res.locals.requestId,
    },
  };

  return res.status(statusCode).json(response);
};