import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getWebSocketService } from "../../../../modules/websocket";
import { Server as HTTPServer } from "http";

/**
 * POST /admin/websocket/init
 * 
 * Initialize WebSocket server by attaching to the HTTP server
 * This endpoint should be called once when the server starts
 * or can be called automatically on first access
 * Requires admin authentication.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const webSocketService = getWebSocketService(logger);

  try {
    // Check if already initialized
    if (webSocketService.isInitialized()) {
      return res.status(200).json({
        success: true,
        message: "WebSocket server already initialized",
        connectedClients: webSocketService.getConnectedCount(),
      });
    }

    // Get HTTP server from request - try multiple approaches for Medusa v2
    let httpServer: HTTPServer | null = null;

    // Approach 1: From socket.server (most common)
    if ((req as any).socket?.server) {
      httpServer = (req as any).socket.server as HTTPServer;
    }
    // Approach 2: From req.connection (Node.js)
    else if ((req as any).connection?.server) {
      httpServer = (req as any).connection.server as HTTPServer;
    }
    // Approach 3: From app (Express/Fastify)
    else if ((req as any).app) {
      const app = (req as any).app;
      // Try to get server from app
      if (app.get && typeof app.get === "function") {
        httpServer = app.get("server") as HTTPServer;
      }
      // If app itself is the server
      else if (app.listen && typeof app.listen === "function") {
        // This is tricky - we need the actual server instance
        // Try to access it from the request
        httpServer = (req as any).socket?.server as HTTPServer;
      }
    }
    // Approach 4: From req object directly
    else if ((req as any).server) {
      httpServer = (req as any).server as HTTPServer;
    }

    if (!httpServer) {
      const debugInfo = {
        hasSocket: !!(req as any).socket,
        hasConnection: !!(req as any).connection,
        hasApp: !!(req as any).app,
        hasServer: !!(req as any).server,
        socketServer: (req as any).socket?.server ? "exists" : "missing",
        connectionServer: (req as any).connection?.server ? "exists" : "missing",
      };
      logger.error(`Could not access HTTP server instance. Available properties: ${JSON.stringify(debugInfo)}`);

      return res.status(500).json({
        success: false,
        message: "Could not access HTTP server instance. Please ensure the server is running and try again.",
        hint: "The WebSocket server needs access to the HTTP server to attach Socket.IO. This might require a server restart.",
      });
    }

    // Get CORS origin from environment - include Angular app origin
    const adminCors = process.env.ADMIN_CORS || "*";
    let corsOrigin: string | string[] = "*";
    
    if (adminCors !== "*") {
      const origins = adminCors.split(",").map((origin) => origin.trim());
      // Ensure Angular app origin is included
      if (!origins.includes("http://localhost:8101")) {
        origins.push("http://localhost:8101");
      }
      corsOrigin = origins;
    } else {
      // If using wildcard, still allow localhost:8101 explicitly for Socket.IO
      corsOrigin = ["http://localhost:8101", "http://localhost:9000"];
    }

    logger.info(`Initializing WebSocket server with CORS origins: ${JSON.stringify(corsOrigin)}`);
    logger.info(`HTTP server type: ${httpServer.constructor.name}, listening: ${httpServer.listening}`);

    // Initialize WebSocket server
    try {
      webSocketService.initialize(httpServer, corsOrigin);
      
      // Verify initialization succeeded
      if (!webSocketService.isInitialized()) {
        logger.error("WebSocket server initialization returned but isInitialized() is false");
        return res.status(500).json({
          success: false,
          message: "WebSocket server initialization failed - server not properly initialized",
        });
      }
      
      logger.info("✅ WebSocket server initialized successfully");
      
      // Get verification details
      const verification = webSocketService.verifyConnection();
      
      res.status(200).json({
        success: true,
        message: "WebSocket server initialized successfully",
        corsOrigins: corsOrigin,
        verification,
      });
    } catch (initError: any) {
      logger.error(`❌ Error during WebSocket initialization: ${initError.message}`);
      logger.error(`Stack: ${initError.stack}`);
      return res.status(500).json({
        success: false,
        message: "Error initializing WebSocket server",
        error: initError.message,
        stack: process.env.NODE_ENV === "development" ? initError.stack : undefined,
      });
    }
  } catch (error: any) {
    logger.error(`Error initializing WebSocket server: ${error.message || error}`);
    res.status(500).json({
      success: false,
      message: "Error initializing WebSocket server",
      error: error.message,
    });
  }
}

/**
 * GET /admin/websocket/init
 * 
 * Check WebSocket server status
 * Requires admin authentication.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const webSocketService = getWebSocketService(logger);

  try {
    res.status(200).json({
      success: true,
      initialized: webSocketService.isInitialized(),
      connectedClients: webSocketService.getConnectedCount(),
      clients: webSocketService.getConnectedClients(),
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

