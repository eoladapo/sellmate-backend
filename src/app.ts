import 'reflect-metadata';
import express, { Application } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';

// Load environment variables first
dotenv.config();

// Import middleware
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  morganLogger,
  securityAuditLog,
  corsMiddleware,
  sanitizeInput,
  generalRateLimit,
  securityHeaders,
  requestSizeLimit,
  validateMethod,
  validateContentType,
  requestId,
  csrfTokenGenerator,
  csrfProtection,
  enforceHttps,
  hstsHeader,
  securityMonitoring,
  suspiciousPatternDetection,
} from './api/middleware';

// Import routes
import apiRoutes from './api/routes';

/**
 * Express application setup
 * Configures middleware, routes, and error handling
 */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middleware in correct order
   */
  private initializeMiddleware(): void {
    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Request ID generation (must be first)
    this.app.use(requestId);

    // HTTPS enforcement (in production)
    this.app.use(enforceHttps);
    this.app.use(hstsHeader);

    // Security headers
    this.app.use(securityHeaders);

    // CORS configuration
    this.app.use(corsMiddleware);

    // Request size limiting
    this.app.use(requestSizeLimit(10 * 1024 * 1024)); // 10MB limit

    // Method validation
    this.app.use(validateMethod(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']));

    // Content type validation
    this.app.use(validateContentType(['application/json', 'multipart/form-data']));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Input sanitization
    this.app.use(sanitizeInput);

    // CSRF token generation
    this.app.use(csrfTokenGenerator);

    // CSRF protection (for state-changing requests)
    this.app.use(csrfProtection);

    // Rate limiting (general)
    this.app.use(generalRateLimit);

    // Logging middleware
    this.app.use(morganLogger());
    this.app.use(requestLogger);
    this.app.use(securityAuditLog);

    // Security monitoring
    this.app.use(securityMonitoring);
    this.app.use(suspiciousPatternDetection);
  }

  /**
   * Initialize application routes
   */
  private initializeRoutes(): void {
    // Serve static files from public directory (for test pages)
    this.app.use(express.static(path.join(__dirname, '..', 'public')));

    // Swagger API documentation
    this.app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'SellMate API Docs',
    }));

    // Swagger JSON spec endpoint
    this.app.get('/api/v1/docs.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    // API routes (includes health routes at /api/health)
    this.app.use('/api', apiRoutes);
  }

  /**
   * Initialize error handling middleware (must be last)
   */
  private initializeErrorHandling(): void {
    // 404 handler for undefined routes
    this.app.use(notFoundHandler);

    // Global error handler (must be last middleware)
    this.app.use(errorHandler);
  }
}

export default new App().app;
