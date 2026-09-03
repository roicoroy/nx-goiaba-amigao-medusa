import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Store } from '@ngxs/store';
import { AuthState } from '../store/auth/auth.state';

export interface Notification {
  id: string;
  type: string;
  orderId: string;
  orderData: any;
  createdAt: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketNotificationService {
  private socket: Socket | null = null;
  private notifications$ = new Subject<Notification>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private store = inject(Store);

  constructor() {
    // Don't auto-connect - let components call connect() when needed
  }

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const wsUrl = environment.MEDUSA_WS_URL || environment.MEDUSA_API_BASE_PATH;
    console.log('🔌 Connecting to Socket.IO server:', wsUrl);
    console.log('📋 Connection details:', {
      url: wsUrl,
      path: '/socket.io',
      transport: 'polling',
      origin: window.location.origin
    });
    
    // Use only polling transport for now (more reliable, works even if WebSocket is blocked)
    // Once connected, Socket.IO will try to upgrade to WebSocket automatically
    // If WebSocket fails, it will stay on polling (which is fine)
    this.socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['polling'], // Use only polling - more reliable, works behind firewalls/proxies
      reconnection: false, // Disable automatic reconnection to prevent endless retry loops
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: 0, // Don't retry automatically
      timeout: 20000,
      forceNew: true, // Force a new connection
      autoConnect: true,
      upgrade: false, // Disable automatic upgrade to WebSocket to avoid connection errors
      // Add extra headers if needed for CORS
      extraHeaders: {},
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected:', this.socket?.id);
      if (this.socket?.io?.engine?.transport) {
        console.log('📡 Transport:', this.socket.io.engine.transport.name);
      }
      this.reconnectAttempts = 0;
      
      // Authenticate if user is logged in
      const userId = this.getUserId();
      const token = this.getToken();
      if (userId || token) {
        console.log('🔐 Authenticating Socket.IO...');
        this.socket?.emit('authenticate', { userId, token });
      }
    });

    this.socket.on('authenticated', (data: { success: boolean; userId?: string }) => {
      if (data.success) {
        console.log('✅ WebSocket authenticated:', data.userId);
      } else {
        console.warn('⚠️ WebSocket authentication failed');
      }
    });

    this.socket.on('notification', (message: { type: string; data: Notification; timestamp: string }) => {
      console.log('📬 Notification received:', message);
      if (message.type === 'notification' && message.data) {
        this.notifications$.next(message.data);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      // Don't auto-reconnect - let user manually initialize WebSocket server first
      // This prevents endless retry loops when backend isn't configured
      if (reason === 'io server disconnect') {
        console.log('💡 WebSocket server disconnected. Please initialize WebSocket server on backend first.');
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket.IO connection error:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        type: error.constructor.name
      });
      
      // Check for specific error types
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('cors') || errorMessage.includes('cross-origin')) {
        console.error('🚫 CORS Error Detected!');
        console.error('💡 Backend CORS Configuration Required:');
        console.error('   1. Make sure your Medusa backend has CORS enabled');
        console.error('   2. Add your Angular app origin to CORS whitelist:');
        console.error(`      - Angular app origin: ${window.location.origin}`);
        console.error(`      - Backend URL: ${wsUrl}`);
        console.error('   3. Set ADMIN_CORS environment variable in your Medusa backend:');
        console.error(`      ADMIN_CORS=${window.location.origin}`);
        console.error('   4. Restart your Medusa backend server');
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        console.error('🚫 404 Error - Socket.IO endpoint not found!');
        console.error('💡 Backend Socket.IO Server Not Initialized:');
        console.error('   1. Make sure you have clicked "Initialize WebSocket Server" button');
        console.error('   2. Or manually initialize via API:');
        console.error(`      curl -X POST ${wsUrl}/admin/websocket/init \\`);
        console.error('        -H "Authorization: Bearer YOUR_ADMIN_TOKEN"');
        console.error('   3. Check that the backend Socket.IO plugin is installed and configured');
      } else if (errorMessage.includes('network') || errorMessage.includes('failed')) {
        console.error('🚫 Network Error!');
        console.error('💡 Backend Server May Not Be Running:');
        console.error(`   1. Check if backend is running at: ${wsUrl}`);
        console.error('   2. Verify the backend server is accessible');
        console.error('   3. Check firewall/proxy settings');
      }
      
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached.');
        console.error('💡 Troubleshooting Steps:');
        console.error('   1. Click "Initialize WebSocket Server" button on the dashboard');
        console.error('   2. Check backend logs for Socket.IO initialization errors');
        console.error('   3. Verify CORS configuration in backend');
        console.error('   4. Make sure the backend Socket.IO server is running and accessible');
        console.error(`   5. Test backend endpoint: ${wsUrl}/admin/websocket/status`);
      }
    });

    // Handle ping/pong for connection health
    this.socket.on('pong', () => {
      // Connection is healthy
      console.log('🏓 WebSocket ping/pong - connection healthy');
    });
  }

  /**
   * Get auth token from NGXS auth state
   */
  private getToken(): string | null {
    return this.store.selectSnapshot(AuthState.getToken);
  }

  /**
   * Get user ID from NGXS auth state
   */
  private getUserId(): string | null {
    const user = this.store.selectSnapshot(AuthState.getUser);
    return user?.id || null;
  }

  getNotifications(): Observable<Notification> {
    return this.notifications$.asObservable();
  }

  /**
   * Manually authenticate with user ID or token
   */
  authenticate(userId: string, token?: string) {
    if (this.socket?.connected) {
      this.socket.emit('authenticate', { userId, token });
    }
  }

  /**
   * Send ping to check connection health
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

