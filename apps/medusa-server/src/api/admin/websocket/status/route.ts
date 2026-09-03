import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getWebSocketService } from "../../../../modules/websocket";
import { Server as HTTPServer } from "http";

/**
 * GET /admin/websocket/status
 * 
 * Check WebSocket server status and auto-initialize if not initialized
 * Useful for monitoring and debugging
 * Requires admin authentication.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const webSocketService = getWebSocketService(logger);

  try {
    let isInitialized = webSocketService.isInitialized();
    let autoInitialized = false;

    // Auto-initialize if not initialized
    if (!isInitialized) {
      try {
        // Get HTTP server from request
        let httpServer: HTTPServer | null = null;

        if ((req as any).socket?.server) {
          httpServer = (req as any).socket.server as HTTPServer;
        } else if ((req as any).connection?.server) {
          httpServer = (req as any).connection.server as HTTPServer;
        } else if ((req as any).app?.get && typeof (req as any).app.get === "function") {
          httpServer = (req as any).app.get("server") as HTTPServer;
        } else if ((req as any).server) {
          httpServer = (req as any).server as HTTPServer;
        }

        if (httpServer && httpServer.listen && typeof httpServer.listen === "function") {
          // Get CORS origin from environment
          const adminCors = process.env.ADMIN_CORS || "*";
          let corsOrigin: string | string[] = "*";
          
          if (adminCors !== "*") {
            const origins = adminCors.split(",").map((origin) => origin.trim());
            if (!origins.includes("http://localhost:8101")) {
              origins.push("http://localhost:8101");
            }
            corsOrigin = origins;
          } else {
            corsOrigin = ["http://localhost:8101", "http://localhost:9000"];
          }

          logger.info("Auto-initializing WebSocket server from status endpoint...");
          webSocketService.initialize(httpServer, corsOrigin);
          isInitialized = webSocketService.isInitialized();
          autoInitialized = isInitialized;
          
          if (autoInitialized) {
            logger.info("✅ WebSocket server auto-initialized successfully from status endpoint");
          } else {
            logger.warn("⚠️ WebSocket server initialization attempted but failed");
          }
        } else {
          logger.warn("Could not access HTTP server for auto-initialization from status endpoint");
        }
      } catch (initError: any) {
        logger.error(`Failed to auto-initialize WebSocket server from status endpoint: ${initError.message}`);
        // Continue to return status even if initialization fails
      }
    }

    const connectedCount = webSocketService.getConnectedCount();
    const clients = webSocketService.getConnectedClients();
    const verification = webSocketService.verifyConnection();

    // Get HTTP server info for debugging
    let httpServerInfo: any = null;
    try {
      if ((req as any).socket?.server) {
        const server = (req as any).socket.server;
        httpServerInfo = {
          type: server.constructor.name,
          listening: server.listening,
          address: server.address(),
        };
      }
    } catch (e) {
      // Ignore errors getting server info
    }

    res.status(200).json({
      success: true,
      initialized: isInitialized,
      autoInitialized,
      connectedClients: connectedCount,
      clients: clients.map(client => ({
        socketId: client.socketId,
        userId: client.userId,
        connectedAt: client.connectedAt,
      })),
      verification,
      httpServer: httpServerInfo,
      socketIoPath: "/socket.io",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error(`Error getting WebSocket status: ${error.message || error}`);
    res.status(500).json({
      success: false,
      message: "Error getting WebSocket status",
      error: error.message,
    });
  }
}

