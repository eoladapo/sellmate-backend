import 'reflect-metadata';
import express, { Application } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.config';
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


dotenv.config();


import apiRoutes from './api/routes';


class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }


  private initializeMiddleware(): void {
    this.app.set('trust proxy', 1);
    this.app.use(requestId);
    this.app.use(enforceHttps);
    this.app.use(hstsHeader);
    this.app.use(securityHeaders);
    this.app.use(corsMiddleware);
    this.app.use(requestSizeLimit(10 * 1024 * 1024));
    this.app.use(validateMethod(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']));
    this.app.use(validateContentType(['application/json', 'multipart/form-data']));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(sanitizeInput);
    this.app.use(csrfTokenGenerator);
    this.app.use(csrfProtection);
    this.app.use(generalRateLimit);
    this.app.use(morganLogger());
    this.app.use(requestLogger);
    this.app.use(securityAuditLog);
    this.app.use(securityMonitoring);
    this.app.use(suspiciousPatternDetection);
  }

  private initializeRoutes(): void {
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


  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }
}

export default new App().app;
