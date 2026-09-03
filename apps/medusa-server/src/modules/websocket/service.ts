import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export interface ConnectedClient {
  socketId: string;
  userId?: string;
  connectedAt: Date;
}

/**
 * WebSocket Service
 * Manages Socket.IO connections and broadcasting notifications
 */
export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger;
  }

  /**
   * Initialize Socket.IO server and attach to HTTP server
   */
  initialize(httpServer: HTTPServer, corsOrigin?: string | string[]): void {
    if (this.io) {
      this.logger?.warn("WebSocket server already initialized");
      return;
    }

    if (!httpServer) {
      this.logger?.error("Cannot initialize WebSocket server: HTTP server is null or undefined");
      throw new Error("HTTP server is required to initialize WebSocket server");
    }

    // Verify HTTP server is actually a server instance
    if (!httpServer.listen || typeof httpServer.listen !== "function") {
      this.logger?.error("Invalid HTTP server instance provided");
      throw new Error("Invalid HTTP server instance");
    }

    // Get CORS origins from environment variables
    // Priority: WEBSOCKET_CORS_ORIGINS > provided corsOrigin > ADMIN_CORS > defaults
    const websocketCorsEnv = process.env.WEBSOCKET_CORS_ORIGINS;
    const adminCorsEnv = process.env.ADMIN_CORS;
    
    let finalCorsOrigin: string | string[];
    
    // Priority 1: If WEBSOCKET_CORS_ORIGINS is set, use it
    if (websocketCorsEnv) {
      const origins = websocketCorsEnv.split(",").map((origin) => origin.trim()).filter(Boolean);
      finalCorsOrigin = origins.length > 0 ? origins : "*";
    } 
    // Priority 2: Use provided corsOrigin if it's not "*" or empty
    else if (corsOrigin && corsOrigin !== "*") {
      // If corsOrigin is already an array, use it; otherwise convert to array
      finalCorsOrigin = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];
    }
    // Priority 3: Use ADMIN_CORS from environment
    else if (adminCorsEnv && adminCorsEnv !== "*") {
      const origins = adminCorsEnv.split(",").map((origin) => origin.trim()).filter(Boolean);
      finalCorsOrigin = origins.length > 0 ? origins : "*";
    }
    // Priority 4: Use default development origins
    else {
      finalCorsOrigin = process.env.WEBSOCKET_DEFAULT_ORIGINS 
        ? process.env.WEBSOCKET_DEFAULT_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
        : [
            "http://localhost:8101", // Angular app (default)
            "http://localhost:9000", // Medusa admin (default)
            "http://127.0.0.1:8101",
            "http://127.0.0.1:9000",
          ];
    }
    
    // Ensure it's an array (handle case where finalCorsOrigin might be "*" string)
    if (!Array.isArray(finalCorsOrigin)) {
      if (finalCorsOrigin === "*") {
        // If wildcard, use defaults
        finalCorsOrigin = [
          "http://localhost:8101",
          "http://localhost:9000",
          "http://127.0.0.1:8101",
          "http://127.0.0.1:9000",
        ];
      } else {
        finalCorsOrigin = [finalCorsOrigin];
      }
    }

    this.logger?.info(`Initializing WebSocket server with CORS origins: ${JSON.stringify(finalCorsOrigin)}`);
    this.logger?.info(`HTTP server address: ${JSON.stringify(httpServer.address())}`);

    try {
      this.logger?.info("Creating Socket.IO server instance...");
      
      this.io = new SocketIOServer(httpServer, {
        cors: {
          origin: finalCorsOrigin,
          methods: ["GET", "POST"],
          credentials: true,
          allowedHeaders: ["Authorization", "Content-Type"],
        },
        path: "/socket.io",
        transports: ["websocket", "polling"], // Support both transports
        allowEIO3: true, // Allow Engine.IO v3 clients
      });

      // Verify Socket.IO server was created
      if (!this.io) {
        throw new Error("Failed to create Socket.IO server instance");
      }

      this.logger?.info("Socket.IO server instance created, setting up event handlers...");
      this.setupEventHandlers();
      
      // Verify the server is attached to the HTTP server
      const ioHttpServer = (this.io as any).httpServer;
      if (ioHttpServer !== httpServer) {
        this.logger?.warn(`Socket.IO HTTP server differs from provided server. IO server: ${ioHttpServer?.constructor?.name}, Provided: ${httpServer.constructor.name}`);
      }
      
      // Log that Socket.IO is ready
      this.io.engine.on("connection_error", (err) => {
        this.logger?.error(`Socket.IO connection error: ${err.message}`);
      });
      
      this.io.engine.on("connection", () => {
        this.logger?.info("Socket.IO client connected via engine");
      });
      
      this.logger?.info("✅ WebSocket server initialized successfully on /socket.io");
      this.logger?.info(`Socket.IO server is listening on path: /socket.io`);
      this.logger?.info(`Socket.IO HTTP server: ${ioHttpServer?.constructor?.name}, listening: ${ioHttpServer?.listening}`);
    } catch (error: any) {
      this.logger?.error(`❌ Failed to initialize WebSocket server: ${error.message || error}`);
      this.logger?.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      this.logger?.info(`Client connected: ${socket.id}`);

      // Store client connection
      this.connectedClients.set(socket.id, {
        socketId: socket.id,
        connectedAt: new Date(),
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this.logger?.info(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle authentication
      socket.on("authenticate", async (data: { token?: string; userId?: string }) => {
        const client = this.connectedClients.get(socket.id);
        if (client) {
          // For now, accept userId directly
          // In production, validate the token using Medusa's auth service
          if (data.userId) {
            client.userId = data.userId;
            this.connectedClients.set(socket.id, client);
            socket.emit("authenticated", { success: true, userId: data.userId });
            this.logger?.info(`Client authenticated: ${socket.id}, userId: ${data.userId}`);
          } else if (data.token) {
            // TODO: Validate token using Medusa's auth service
            // For now, just accept the token
            socket.emit("authenticated", { success: true });
            this.logger?.info(`Client authenticated with token: ${socket.id}`);
          } else {
            socket.emit("authenticated", { success: false, error: "Missing userId or token" });
          }
        }
      });

      // Handle ping/pong for connection health
      socket.on("ping", () => {
        socket.emit("pong");
      });
    });
  }

  /**
   * Broadcast notification to all connected clients
   */
  broadcastNotification(notification: any): void {
    if (!this.io) {
      this.logger?.warn("WebSocket server not initialized, cannot broadcast");
      return;
    }

    const connectedCount = this.connectedClients.size;
    
    if (connectedCount === 0) {
      this.logger?.warn(`⚠️ No clients connected. Notification ${notification.id} will not be received by anyone.`);
    }

    const message = {
      type: "notification",
      data: notification,
      timestamp: new Date().toISOString(),
    };

    this.io.emit("notification", message);

    this.logger?.info(`📢 Notification broadcasted to ${connectedCount} connected client(s). Notification ID: ${notification.id}, Order: ${notification.orderId}`);
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, notification: any): void {
    if (!this.io) {
      this.logger?.warn("WebSocket server not initialized, cannot send to user");
      return;
    }

    let sentCount = 0;
    this.connectedClients.forEach((client, socketId) => {
      if (client.userId === userId) {
        this.io!.to(socketId).emit("notification", {
          type: "notification",
          data: notification,
          timestamp: new Date().toISOString(),
        });
        sentCount++;
      }
    });

    this.logger?.info(`Notification sent to user ${userId} (${sentCount} connections). Notification ID: ${notification.id}`);
  }

  /**
   * Get all connected clients
   */
  getConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values());
  }

  /**
   * Get number of connected clients
   */
  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Check if WebSocket server is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }

  /**
   * Get Socket.IO server instance (for debugging)
   */
  getServerInstance(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Verify Socket.IO server is properly attached and listening
   */
  verifyConnection(): { valid: boolean; error?: string; details?: any } {
    if (!this.io) {
      return { valid: false, error: "Socket.IO server not initialized" };
    }

    try {
      // Check if the server has an engine (Socket.IO v4+)
      const hasEngine = !!(this.io as any).engine;
      const httpServer = (this.io as any).httpServer;
      
      return {
        valid: true,
        details: {
          hasEngine,
          httpServerType: httpServer?.constructor?.name,
          httpServerListening: httpServer?.listening,
          path: (this.io as any).path || "/socket.io",
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `Error verifying Socket.IO server: ${error.message}`,
      };
    }
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.connectedClients.clear();
      this.logger?.info("WebSocket server closed");
    }
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

/**
 * Get or create WebSocket service instance
 */
export function getWebSocketService(logger?: any): WebSocketService {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService(logger);
  }
  return webSocketServiceInstance;
}

