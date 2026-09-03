import { MedusaContainer } from "@medusajs/types";
import { Server as HTTPServer } from "http";
import { getWebSocketService } from "./service";

/**
 * Initialize WebSocket server
 * This should be called when the Medusa server starts
 */
export async function initializeWebSocket(
  container: MedusaContainer,
  httpServer: HTTPServer
): Promise<void> {
  const logger = container.resolve("logger");
  const webSocketService = getWebSocketService(logger);

  // Get CORS origin from environment variables
  // Priority: WEBSOCKET_CORS_ORIGINS > ADMIN_CORS > default
  const websocketCors = process.env.WEBSOCKET_CORS_ORIGINS || process.env.ADMIN_CORS || "*";
  const corsOrigin = websocketCors.split(",").map((origin) => origin.trim());

  // Initialize WebSocket server
  webSocketService.initialize(httpServer, corsOrigin);

  logger.info("WebSocket server initialized successfully");
}

