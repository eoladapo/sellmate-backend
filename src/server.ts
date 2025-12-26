import 'reflect-metadata';
import app from './app';
import dotenv from 'dotenv';
import { Server } from 'http';
import { initializeDatabase, closeDatabase, getDataSource } from './database/config/data-source';
import { initializeRedis, closeRedis } from './config/redis.config';
import { initializeContainer } from './di';

dotenv.config();

const PORT = process.env.PORT || 3000;

let server: Server;


const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');

      try {
        await closeDatabase();

        await closeRedis();

        console.log('✅ All connections closed. Exiting...');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error('⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};


export const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    await initializeRedis();
    const dataSource = getDataSource();
    initializeContainer(dataSource);
    server = app.listen(PORT, () => {
      console.log(`📡 Server listening on port ${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/v1/docs`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();

