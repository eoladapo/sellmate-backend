# SellMate Backend API

SellMate is an intelligent social commerce automation platform designed for Nigerian micro-entrepreneurs who sell through Instagram and WhatsApp.

## Features

- 🤖 AI-powered order detection using Google Gemini
- 💬 Unified conversation management across WhatsApp and Instagram
- 📊 Automated profit calculations and business analytics
- 🔐 Secure authentication with JWT and OAuth
- 🚀 RESTful API with comprehensive documentation
- 📱 Mobile-optimized for Nigerian social sellers

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM
- **Cache**: Redis
- **AI**: Google Gemini AI
- **Testing**: Jest + fast-check (Property-Based Testing)

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL >= 15
- Redis >= 6.0

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
# Create PostgreSQL database
createdb sellmate_db

# Run migrations
npm run migration:run
```

4. Start Redis:
```bash
redis-server
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert last migration
- `npm run seed` - Seed database with sample data

## Project Structure

```
src/
├── modules/          # Feature modules (auth, orders, conversations, etc.)
├── api/             # API routes and middleware
├── database/        # Database migrations and seeds
├── shared/          # Shared utilities, helpers, and types
├── config/          # Configuration files
├── docs/            # API documentation
├── tests/           # Integration and E2E tests
├── scripts/         # Utility scripts
├── app.ts           # Express app setup
├── server.ts        # Server entry point
└── container.ts     # Dependency injection container
```

## Architecture

The backend follows a **modular monolith architecture** with clear separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Handle data access
- **Entities**: TypeORM database models
- **DTOs**: Data transfer objects for API contracts
- **Validators**: Input validation schemas

Each module follows SOLID principles and uses dependency injection for loose coupling.

## API Documentation

API documentation is available at `/api/v1/docs` when the server is running.

## Testing

The project uses Jest for unit testing and fast-check for property-based testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `NODE_ENV` - Environment (development, production, test)
- `PORT` - Server port (default: 3000)
- `DB_*` - PostgreSQL connection settings
- `REDIS_*` - Redis connection settings
- `JWT_SECRET` - Secret key for JWT tokens
- `GEMINI_API_KEY` - Google Gemini AI API key
- `WHATSAPP_*` - WhatsApp Business API credentials
- `INSTAGRAM_*` - Instagram API credentials

## License

MIT
