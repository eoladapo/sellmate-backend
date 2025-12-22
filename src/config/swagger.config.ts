import swaggerJsdoc from 'swagger-jsdoc';
import { appConfig } from './app.config';

/**
 * Swagger/OpenAPI 3.0 Configuration
 * Comprehensive API documentation for SellMate Platform
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SellMate API',
      version: '1.0.0',
      description: `
# SellMate Platform - Social Commerce Automation Backend API

SellMate is an intelligent social commerce automation platform designed specifically for Nigerian micro-entrepreneurs who sell through Instagram and WhatsApp.

## Features
- **Unified Conversations**: Consolidate WhatsApp and Instagram messages in one place
- **AI-Powered Order Detection**: Automatically detect orders from conversations
- **Profit Analytics**: Real-time business metrics and profit calculations
- **Customer Management**: Track customer interactions across platforms

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
API requests are rate-limited to prevent abuse. Current limits:
- General: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes
- AI endpoints: 20 requests per minute
      `,
      contact: {
        name: 'SellMate Team',
        email: 'support@sellmate.ng',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${appConfig.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.sellmate.ng',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token obtained from /auth/verify-otp or /auth/refresh',
        },
      },
      schemas: {
        // Common Response Schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'An error occurred' },
            message: { type: 'string', example: 'Detailed error message' },
            statusCode: { type: 'integer', example: 400 },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 5 },
                hasMore: { type: 'boolean', example: true },
              },
            },
          },
        },

        // User & Authentication Schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            phoneNumber: { type: 'string', example: '+2348123456789' },
            businessName: { type: 'string', example: "Kemi's Fashion Store" },
            email: { type: 'string', format: 'email', example: 'kemi@example.com' },
            isVerified: { type: 'boolean', example: true },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            operatingMode: { type: 'string', enum: ['lite', 'full'], example: 'full' },
            connectedPlatforms: {
              type: 'object',
              properties: {
                whatsapp: {
                  type: 'object',
                  properties: {
                    connected: { type: 'boolean', example: true },
                    businessAccountId: { type: 'string' },
                    connectedAt: { type: 'string', format: 'date-time' },
                  },
                },
                instagram: {
                  type: 'object',
                  properties: {
                    connected: { type: 'boolean', example: false },
                    businessAccountId: { type: 'string' },
                    connectedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
            onboardingCompleted: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn: { type: 'number', example: 900, description: 'Access token expiry in seconds' },
            tokenType: { type: 'string', example: 'Bearer' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['phoneNumber', 'businessName'],
          properties: {
            phoneNumber: { type: 'string', example: '+2348123456789', description: 'Nigerian phone number' },
            businessName: { type: 'string', example: "Kemi's Fashion Store" },
            email: { type: 'string', format: 'email', example: 'kemi@example.com' },
          },
        },
        VerifyOTPRequest: {
          type: 'object',
          required: ['phoneNumber', 'otp'],
          properties: {
            phoneNumber: { type: 'string', example: '+2348123456789' },
            otp: { type: 'string', example: '123456', minLength: 6, maxLength: 6 },
          },
        },

        // Conversation Schemas
        Conversation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            platform: { type: 'string', enum: ['whatsapp', 'instagram', 'manual'] },
            platformConversationId: { type: 'string' },
            participantId: { type: 'string' },
            participantName: { type: 'string', example: 'John Doe' },
            participantProfilePicture: { type: 'string', format: 'uri' },
            lastMessageContent: { type: 'string' },
            lastMessageAt: { type: 'string', format: 'date-time' },
            unreadCount: { type: 'integer', example: 3 },
            isArchived: { type: 'boolean', example: false },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            conversationId: { type: 'string', format: 'uuid' },
            platformMessageId: { type: 'string' },
            content: { type: 'string', example: 'I want to buy 2 pairs of shoes' },
            type: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'document', 'location'] },
            direction: { type: 'string', enum: ['inbound', 'outbound'] },
            status: { type: 'string', enum: ['sent', 'delivered', 'read', 'failed'] },
            mediaUrl: { type: 'string', format: 'uri' },
            metadata: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Order Schemas
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            customerId: { type: 'string', format: 'uuid' },
            conversationId: { type: 'string', format: 'uuid' },
            sourceMessageId: { type: 'string', format: 'uuid' },
            platform: { type: 'string', enum: ['whatsapp', 'instagram', 'manual'] },
            status: {
              type: 'string',
              enum: ['draft', 'pending', 'confirmed', 'delivered', 'cancelled', 'expired', 'abandoned'],
              example: 'pending',
            },
            product: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Red Sneakers' },
                quantity: { type: 'integer', example: 2 },
                sellingPrice: { type: 'number', example: 15000 },
                costPrice: { type: 'number', example: 10000 },
                description: { type: 'string' },
              },
            },
            customer: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe' },
                contact: { type: 'string', example: '+2348123456789' },
                deliveryAddress: { type: 'string', example: '123 Lagos Street, Ikeja' },
              },
            },
            totalAmount: { type: 'number', example: 30000 },
            profit: { type: 'number', example: 10000 },
            profitMargin: { type: 'number', example: 33.33 },
            notes: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time', description: '48 hours from creation' },
            confirmedAt: { type: 'string', format: 'date-time' },
            deliveredAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['product', 'customer'],
          properties: {
            customerId: { type: 'string', format: 'uuid' },
            conversationId: { type: 'string', format: 'uuid' },
            product: {
              type: 'object',
              required: ['name', 'quantity', 'sellingPrice'],
              properties: {
                name: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
                sellingPrice: { type: 'number', minimum: 0 },
                costPrice: { type: 'number', minimum: 0 },
                description: { type: 'string' },
              },
            },
            customer: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                contact: { type: 'string' },
                deliveryAddress: { type: 'string' },
              },
            },
            notes: { type: 'string' },
          },
        },

        // Customer Schemas
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'John Doe' },
            phoneNumber: { type: 'string', example: '+2348123456789' },
            platforms: {
              type: 'object',
              properties: {
                whatsapp: {
                  type: 'object',
                  properties: {
                    phoneNumber: { type: 'string' },
                    profileName: { type: 'string' },
                    lastInteraction: { type: 'string', format: 'date-time' },
                  },
                },
                instagram: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    profileName: { type: 'string' },
                    lastInteraction: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
            totalOrders: { type: 'integer', example: 5 },
            totalSpent: { type: 'number', example: 75000 },
            averageOrderValue: { type: 'number', example: 15000 },
            lastOrderAt: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CustomerInsights: {
          type: 'object',
          properties: {
            customer: { $ref: '#/components/schemas/Customer' },
            orderHistory: {
              type: 'object',
              properties: {
                totalOrders: { type: 'integer' },
                completedOrders: { type: 'integer' },
                cancelledOrders: { type: 'integer' },
                abandonedOrders: { type: 'integer' },
              },
            },
            purchasePatterns: {
              type: 'object',
              properties: {
                preferredProducts: { type: 'array', items: { type: 'string' } },
                averageOrderValue: { type: 'number' },
                purchaseFrequency: { type: 'string', enum: ['frequent', 'regular', 'occasional', 'rare'] },
              },
            },
            platformActivity: {
              type: 'object',
              properties: {
                primaryPlatform: { type: 'string', enum: ['whatsapp', 'instagram'] },
                whatsappMessages: { type: 'integer' },
                instagramMessages: { type: 'integer' },
              },
            },
          },
        },

        // Analytics Schemas
        DashboardMetrics: {
          type: 'object',
          properties: {
            revenue: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 500000 },
                previousPeriod: { type: 'number', example: 450000 },
                percentageChange: { type: 'number', example: 11.11 },
                trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable'] },
              },
            },
            profit: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 150000 },
                margin: { type: 'number', example: 30 },
                previousPeriod: { type: 'number', example: 135000 },
                percentageChange: { type: 'number', example: 11.11 },
              },
            },
            orders: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 50 },
                completed: { type: 'integer', example: 45 },
                pending: { type: 'integer', example: 3 },
                cancelled: { type: 'integer', example: 2 },
                completionRate: { type: 'number', example: 90 },
              },
            },
            customers: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 100 },
                new: { type: 'integer', example: 15 },
                returning: { type: 'integer', example: 35 },
                acquisitionRate: { type: 'number', example: 15 },
              },
            },
          },
        },

        // Notification Schemas
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: [
                'new_message',
                'order_detected',
                'order_status_changed',
                'order_expiring',
                'order_expired',
                'new_customer',
                'low_inventory',
                'profit_alert',
                'integration_error',
                'system',
              ],
            },
            title: { type: 'string', example: 'New Order Detected' },
            message: { type: 'string', example: 'A potential order was detected in your WhatsApp conversation' },
            data: { type: 'object' },
            isRead: { type: 'boolean', example: false },
            readAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Settings Schemas
        UserSettings: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            businessProfile: { $ref: '#/components/schemas/BusinessProfile' },
            notificationPreferences: { $ref: '#/components/schemas/NotificationPreferences' },
            integrationSettings: { $ref: '#/components/schemas/IntegrationSettings' },
            dataPrivacySettings: { $ref: '#/components/schemas/DataPrivacySettings' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        BusinessProfile: {
          type: 'object',
          properties: {
            name: { type: 'string', example: "Kemi's Fashion Store" },
            contactPhone: { type: 'string', example: '+2348123456789' },
            defaultLocation: { type: 'string', example: 'Lagos, Nigeria' },
            businessHours: {
              type: 'object',
              properties: {
                start: { type: 'string', example: '09:00' },
                end: { type: 'string', example: '18:00' },
              },
            },
          },
        },
        NotificationPreferences: {
          type: 'object',
          properties: {
            newMessage: { $ref: '#/components/schemas/NotificationTypeSetting' },
            orderDetected: { $ref: '#/components/schemas/NotificationTypeSetting' },
            orderStatusChanged: { $ref: '#/components/schemas/NotificationTypeSetting' },
            orderExpiring: { $ref: '#/components/schemas/NotificationTypeSetting' },
            lowInventory: { $ref: '#/components/schemas/ThresholdNotificationSetting' },
            profitAlert: { $ref: '#/components/schemas/MarginNotificationSetting' },
          },
        },
        NotificationTypeSetting: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            channels: {
              type: 'object',
              properties: {
                inApp: { type: 'boolean', example: true },
                sms: { type: 'boolean', example: false },
              },
            },
          },
        },
        ThresholdNotificationSetting: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            threshold: { type: 'integer', example: 10 },
            channels: {
              type: 'object',
              properties: {
                inApp: { type: 'boolean', example: true },
                sms: { type: 'boolean', example: false },
              },
            },
          },
        },
        MarginNotificationSetting: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
            marginThreshold: { type: 'number', example: 20 },
            channels: {
              type: 'object',
              properties: {
                inApp: { type: 'boolean', example: true },
                sms: { type: 'boolean', example: false },
              },
            },
          },
        },
        IntegrationSettings: {
          type: 'object',
          properties: {
            whatsapp: {
              type: 'object',
              properties: {
                autoSync: { type: 'boolean', example: true },
                syncInterval: { type: 'integer', example: 5, description: 'Sync interval in minutes' },
              },
            },
            instagram: {
              type: 'object',
              properties: {
                autoSync: { type: 'boolean', example: true },
                syncComments: { type: 'boolean', example: false },
              },
            },
          },
        },
        DataPrivacySettings: {
          type: 'object',
          properties: {
            dataRetentionDays: { type: 'integer', example: 365 },
            allowAnalytics: { type: 'boolean', example: true },
            allowMarketing: { type: 'boolean', example: false },
            allowDataSharing: { type: 'boolean', example: false },
            allowAiProcessing: { type: 'boolean', example: true },
          },
        },
        UpdateSettingsRequest: {
          type: 'object',
          properties: {
            businessProfile: { $ref: '#/components/schemas/BusinessProfile' },
            notificationPreferences: { $ref: '#/components/schemas/NotificationPreferences' },
            integrationSettings: { $ref: '#/components/schemas/IntegrationSettings' },
            dataPrivacySettings: { $ref: '#/components/schemas/DataPrivacySettings' },
          },
        },

        // AI Schemas
        AIAnalysisResult: {
          type: 'object',
          properties: {
            orderDetected: { type: 'boolean', example: true },
            confidence: { type: 'number', example: 0.85, minimum: 0, maximum: 1 },
            extractedDetails: {
              type: 'object',
              properties: {
                productName: { type: 'string', example: 'Red Sneakers' },
                quantity: { type: 'integer', example: 2 },
                price: { type: 'number', example: 15000 },
                deliveryAddress: { type: 'string' },
                customerName: { type: 'string' },
              },
            },
            customerIntent: {
              type: 'string',
              enum: ['inquiry', 'purchase', 'complaint', 'support'],
              example: 'purchase',
            },
          },
        },
        AIResponseSuggestion: {
          type: 'object',
          properties: {
            text: { type: 'string', example: 'Thank you for your order! I will process it right away.' },
            type: { type: 'string', enum: ['confirmation', 'clarification', 'upsell', 'support'] },
            confidence: { type: 'number', example: 0.9 },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Unauthorized' },
                  message: { type: 'string', example: 'Invalid or expired token' },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'The requested resource was not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Not Found' },
                  message: { type: 'string', example: 'Resource not found' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Validation Error' },
                  message: { type: 'string', example: 'Invalid request body' },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: { type: 'string', example: 'Too Many Requests' },
                  message: { type: 'string', example: 'Rate limit exceeded. Please try again later.' },
                  retryAfter: { type: 'integer', example: 60 },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User registration, login, and token management',
      },
      {
        name: 'OAuth',
        description: 'Social platform OAuth flows for WhatsApp and Instagram',
      },
      {
        name: 'Conversations',
        description: 'Unified conversation management across platforms',
      },
      {
        name: 'Orders',
        description: 'Order creation, tracking, and lifecycle management',
      },
      {
        name: 'Customers',
        description: 'Customer profile and insights management',
      },
      {
        name: 'Analytics',
        description: 'Business metrics, revenue analytics, and reporting',
      },
      {
        name: 'Integrations',
        description: 'WhatsApp and Instagram integration management',
      },
      {
        name: 'Notifications',
        description: 'In-app and SMS notification management',
      },
      {
        name: 'Settings',
        description: 'User preferences and configuration',
      },
      {
        name: 'Subscription',
        description: 'Subscription plans and billing management',
      },
      {
        name: 'AI',
        description: 'AI-powered order detection and response suggestions',
      },
      {
        name: 'Webhooks',
        description: 'Webhook endpoints for WhatsApp and Instagram',
      },
      {
        name: 'Health',
        description: 'System health and status endpoints',
      },
    ],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/api/routes/**/*.ts',
    './src/modules/**/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
