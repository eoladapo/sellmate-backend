import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../helpers/jwt/verify-token.helper';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * Socket.IO service for real-time notifications
 */
export class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use(this.authMiddleware.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('🔌 Socket.IO server initialized');
  }

  /**
   * Authentication middleware for Socket.IO
   */
  private async authMiddleware(
    socket: AuthenticatedSocket,
    next: (err?: Error) => void
  ): Promise<void> {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const result = verifyAccessToken(token);
      if (!result.valid || !result.payload?.userId) {
        return next(new Error('Invalid token'));
      }

      socket.userId = result.payload.userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Track user's socket connections
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    console.log(`👤 User ${userId} connected (socket: ${socket.id})`);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.userSockets.get(userId)?.delete(socket.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
      console.log(`👤 User ${userId} disconnected (socket: ${socket.id})`);
    });

    // Handle notification acknowledgment
    socket.on('notification:ack', (notificationId: string) => {
      console.log(`📬 Notification ${notificationId} acknowledged by user ${userId}`);
    });

    // Handle mark as read
    socket.on('notification:read', (notificationId: string) => {
      // This will be handled by the notification service
      socket.emit('notification:read:ack', { notificationId, success: true });
    });
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send notification to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: unknown): void {
    userIds.forEach((userId) => this.sendToUser(userId, event, data));
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: unknown): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.emit(event, data);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Get count of online users
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get Socket.IO server instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

// Singleton instance
let socketService: SocketService | null = null;

export const getSocketService = (): SocketService => {
  if (!socketService) {
    socketService = new SocketService();
  }
  return socketService;
};

export const initializeSocketService = (httpServer: HttpServer): SocketService => {
  const service = getSocketService();
  service.initialize(httpServer);
  return service;
};
