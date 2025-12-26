import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { Server } from 'http';
import { initializeDatabase, closeDatabase, getDataSource } from './database/config/data-source';
import { initializeRedis, closeRedis } from './config/redis.config';
import { initializeContainer } from './di';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server: Server;

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');

      try {
        // Close database connection
        await closeDatabase();

        // Close Redis connection
        await closeRedis();

        console.log('✅ All connections closed. Exiting...');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

/**
 * Initialize all connections and start the server
 */
export const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Initialize Redis connection
    await initializeRedis();

    // Initialize dependency injection container
    const dataSource = getDataSource();
    initializeContainer(dataSource);

    // Start Express server
    server = app.listen(PORT, () => {
      console.log(`📡 Server listening on port ${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the server
startServer();

