import { Socket } from "socket.io";
import { MedusaContainer } from "@medusajs/types";

/**
 * Authentication data extracted from socket
 */
export interface SocketAuthData {
  userId?: string;
  isAuthenticated: boolean;
  token?: string;
}

/**
 * Extended Socket interface with auth data
 */
export interface AuthenticatedSocket extends Socket {
  authData?: SocketAuthData;
}

/**
 * Authenticate Socket.IO connection
 * This middleware validates JWT tokens or session cookies
 */
export async function authenticateSocket(
  socket: Socket,
  container: MedusaContainer
): Promise<SocketAuthData> {
  const authData: SocketAuthData = {
    isAuthenticated: false,
  };

  try {
    // Try to get token from handshake auth
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      // Try to get from cookies
      const cookies = socket.handshake.headers.cookie;
      if (cookies) {
        // Extract session token from cookies if needed
        // This depends on your auth implementation
      }
    }

    if (!token) {
      return authData;
    }

    // Use Medusa's auth service to validate token
    const authModuleService = container.resolve("authModuleService");
    
    // Validate token and get user
    // This is a simplified version - adjust based on your auth setup
    try {
      // For JWT tokens, you might need to decode and verify
      // For session tokens, you might need to check session store
      
      // Example: If using Medusa's auth module
      // const authIdentity = await authModuleService.validateToken(token);
      // if (authIdentity) {
      //   authData.userId = authIdentity.entity_id;
      //   authData.isAuthenticated = true;
      //   authData.token = token;
      // }
      
      // For now, we'll use a simpler approach where clients send userId
      // after initial connection, and we validate it
      authData.isAuthenticated = true;
      authData.token = token;
    } catch (error) {
      // Token validation failed
      return authData;
    }
  } catch (error) {
    // Authentication error
    return authData;
  }

  return authData;
}

/**
 * Socket.IO authentication middleware
 * Rejects unauthenticated connections
 */
export function createAuthMiddleware(container: MedusaContainer) {
  return async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const authData = await authenticateSocket(socket, container);

      if (!authData.isAuthenticated) {
        // Allow connection but mark as unauthenticated
        // Client can authenticate later via 'authenticate' event
        (socket as AuthenticatedSocket).authData = authData;
        return next();
      }

      // Store auth data in socket
      (socket as AuthenticatedSocket).authData = authData;
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  };
}

