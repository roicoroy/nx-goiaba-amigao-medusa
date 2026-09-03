import {
    defineMiddlewares,
    authenticate,
    MedusaRequest,
    MedusaResponse,
    MedusaNextFunction
} from "@medusajs/framework/http"
import { getWebSocketService } from "../modules/websocket"
import { Server as HTTPServer } from "http"

// CORS middleware to handle OPTIONS preflight requests
// This MUST run before any validation to ensure OPTIONS requests get CORS headers
const handleOptionsPreflight = (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
) => {
    // Handle OPTIONS preflight requests FIRST - before any validation
    if (req.method === "OPTIONS") {
        // Determine which CORS config to use based on route
        const isAdminRoute = req.url?.startsWith("/admin");
        const isAuthRoute = req.url?.startsWith("/auth");
        const corsConfig = isAuthRoute
            ? (process.env.AUTH_CORS || process.env.ADMIN_CORS || "*")
            : isAdminRoute 
                ? (process.env.ADMIN_CORS || "*")
                : (process.env.STORE_CORS || "*");
        const origin = req.headers.origin;
        
        // Determine allowed origin
        let allowedOrigin = "*";
        if (corsConfig !== "*") {
            const allowedOrigins = corsConfig.split(",").map((o) => o.trim());
            if (origin && allowedOrigins.includes(origin)) {
                allowedOrigin = origin;
            } else if (allowedOrigins.length === 1) {
                allowedOrigin = allowedOrigins[0];
            }
        } else if (origin) {
            allowedOrigin = origin;
        }

        // Set CORS headers for preflight
        res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-publishable-api-key, Accept");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
        
        // Return 204 for preflight
        res.status(204).end();
        return;
    }
    
    next();
}

// Auto-initialize WebSocket server on first admin request
const autoInitWebSocket = async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
) => {
    const logger = req.scope.resolve("logger");
    const webSocketService = getWebSocketService(logger);

    // Only auto-initialize if not already initialized and this is an admin route
    // Allow init endpoint to trigger initialization, but skip status to avoid recursion
    if (!webSocketService.isInitialized() && 
        req.url?.startsWith("/admin") && 
        req.url !== "/admin/websocket/status") {
        try {
            // Try to get HTTP server from request - same approach as status endpoint
            let httpServer: HTTPServer | null = null;

            // Method 1: From socket.server (most reliable in Medusa v2)
            if ((req as any).socket?.server) {
                httpServer = (req as any).socket.server as HTTPServer;
                logger.info("Got HTTP server from req.socket.server");
            } 
            // Method 2: From connection.server (Node.js)
            else if ((req as any).connection?.server) {
                httpServer = (req as any).connection.server as HTTPServer;
                logger.info("Got HTTP server from req.connection.server");
            } 
            // Method 3: From app.get("server") (Express/Fastify)
            else if ((req as any).app?.get && typeof (req as any).app.get === "function") {
                httpServer = (req as any).app.get("server") as HTTPServer;
                logger.info("Got HTTP server from req.app.get('server')");
            }
            // Method 4: Direct server property
            else if ((req as any).server) {
                httpServer = (req as any).server as HTTPServer;
                logger.info("Got HTTP server from req.server");
            }

            if (httpServer) {
                // Verify it's a valid server instance
                if (!httpServer.listen || typeof httpServer.listen !== "function") {
                    logger.error(`Invalid HTTP server instance: ${httpServer.constructor.name}`);
                    return next();
                }

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

                logger.info(`Auto-initializing WebSocket server. HTTP server type: ${httpServer.constructor.name}, listening: ${httpServer.listening}`);
                
                // Initialize with error handling
                try {
                    webSocketService.initialize(httpServer, corsOrigin);
                    
                    // Verify initialization succeeded
                    if (webSocketService.isInitialized()) {
                        logger.info("✅ WebSocket server auto-initialized successfully on first admin request");
                    } else {
                        logger.error("❌ WebSocket server initialization returned but isInitialized() is false");
                    }
                } catch (initError: any) {
                    logger.error(`❌ Error during WebSocket initialization: ${initError.message}`);
                    logger.error(`Stack: ${initError.stack}`);
                    // Don't throw - let the request continue
                }
            } else {
                const debugInfo = {
                    url: req.url,
                    hasSocket: !!(req as any).socket,
                    hasConnection: !!(req as any).connection,
                    hasApp: !!(req as any).app,
                    hasServer: !!(req as any).server,
                    socketServer: (req as any).socket?.server ? "exists" : "missing",
                    connectionServer: (req as any).connection?.server ? "exists" : "missing",
                };
                logger.warn(`⚠️ Could not access HTTP server for WebSocket auto-initialization. Request properties: ${JSON.stringify(debugInfo)}`);
            }
        } catch (error: any) {
            // Log error but don't block the request
            logger.error(`❌ Failed to auto-initialize WebSocket server: ${error.message || error}`);
            logger.error(`Stack: ${error.stack}`);
        }
    }

    next();
}

export default defineMiddlewares({
    routes: [
        // Handle OPTIONS preflight for store routes - must be first
        // This ensures OPTIONS bypasses publishable API key validation
        {
            matcher: "/store/*",
            middlewares: [
                handleOptionsPreflight,
            ],
        },
        {
            matcher: "/store/customers/me*",
            middlewares: [
                authenticate("customer", ["session", "bearer"]),
            ],
        },
        // Handle OPTIONS preflight for auth routes - must be first
        // This ensures OPTIONS bypasses authentication middleware
        {
            matcher: "/auth/*",
            middlewares: [
                handleOptionsPreflight,
            ],
        },
        // Handle OPTIONS preflight for admin routes - must be first
        // This ensures OPTIONS bypasses authentication middleware
        {
            matcher: "/admin/*",
            middlewares: [
                handleOptionsPreflight,
                autoInitWebSocket,
            ],
        },
    ],
})
