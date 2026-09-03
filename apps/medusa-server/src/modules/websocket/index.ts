/**
 * WebSocket Module
 * 
 * Provides Socket.IO WebSocket server for real-time notifications
 */

export { WebSocketService, getWebSocketService } from "./service";
export { 
  authenticateSocket, 
  createAuthMiddleware, 
  SocketAuthData,
  AuthenticatedSocket 
} from "./auth";
export { initializeWebSocket } from "./initialize";

