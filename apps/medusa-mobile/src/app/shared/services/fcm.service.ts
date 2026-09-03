import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { MedusaService } from '../api/medusa.service';
import { AuthState } from '../../store/auth/auth.state';
import { FCMActions } from '../../store/fcm/fcm.actions';
import { FCMRegisterPayload, FCMNotification } from '../interfaces/fcm.interface';

/**
 * FCM Service
 * 
 * Manages Firebase Cloud Messaging token lifecycle and notification handling.
 * Uses the official Capacitor Push Notifications API.
 * Handles token registration, refresh, and incoming notifications.
 */
@Injectable({
  providedIn: 'root'
})
export class FCMService {
  private medusaService = inject(MedusaService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private store = inject(Store);

  private currentToken: string | null = null;
  private registrationListener: any = null;
  private registrationErrorListener: any = null;
  private notificationReceivedListener: any = null;
  private notificationActionListener: any = null;
  private isInitialized = false;

  /**
   * Initialize FCM service
   * Requests permissions, registers for push notifications, and sets up listeners
   */
  async initialize(customerId?: string): Promise<void> {
    // Skip initialization if already done
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Push Notifications plugin is available
      if (!Capacitor.isPluginAvailable('PushNotifications')) {
        console.warn('Push Notifications plugin not available on this platform');
        return;
      }

      // Request permission to use push notifications
      // iOS will prompt user and return if they granted permission or not
      // Android will just grant without prompting
      const permissionResult = await PushNotifications.requestPermissions();
      
      if (permissionResult.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      } else {
        console.warn('Push notification permission denied');
        return;
      }

      // Set up all listeners
      this.setupListeners(customerId);

      this.isInitialized = true;
    } catch (error) {
      // Gracefully handle errors - don't block app functionality
      console.warn('FCM initialization failed:', error);
    }
  }

  /**
   * Set up all push notification listeners
   */
  private setupListeners(customerId?: string): void {
    // On success, we should be able to receive notifications
    this.registrationListener = PushNotifications.addListener('registration', 
      async (token: Token) => {
        if (token.value) {
          this.currentToken = token.value;
          // Update state immediately
          this.store.dispatch(new FCMActions.SetToken(token.value));
          // Register token with backend
          await this.registerToken(token.value, customerId);
        }
      }
    );

    // Some issue with our setup and push will not work
    this.registrationErrorListener = PushNotifications.addListener('registrationError',
      (error: any) => {
        console.error('Error on registration:', error);
        this.store.dispatch(new FCMActions.SetError(error?.message || 'Registration failed'));
      }
    );

    // Show us the notification payload if the app is open on our device
    this.notificationReceivedListener = PushNotifications.addListener('pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        await this.processNotification(notification);
      }
    );

    // Method called when tapping on a notification
    this.notificationActionListener = PushNotifications.addListener('pushNotificationActionPerformed',
      async (notification: ActionPerformed) => {
        await this.processNotificationAction(notification);
      }
    );
  }

  /**
   * Register or update FCM token with backend
   */
  async registerToken(token: string, customerId?: string): Promise<void> {
    if (!token) {
      return;
    }

    try {
      const platform = this.getPlatform();
      if (!platform) {
        return; // Platform not supported
      }

      const deviceInfo = await this.getDeviceInfo();
      const appVersion = '1.0.0'; // TODO: Get from app config or package.json

      const payload: FCMRegisterPayload = {
        token,
        platform,
        app_version: appVersion,
        device_info: deviceInfo,
        ...(customerId && { customer_id: customerId })
      };

      await firstValueFrom(this.medusaService.registerFCMDevice(payload));
      this.currentToken = token;
      // Update state
      this.store.dispatch(new FCMActions.SetToken(token));
      this.store.dispatch(new FCMActions.SetRegistered(true));
    } catch (error) {
      console.warn('Failed to register FCM token:', error);
      this.store.dispatch(new FCMActions.SetError('Failed to register token with backend'));
      // Don't throw - allow app to continue
    }
  }

  /**
   * Unregister FCM token from backend
   */
  async unregisterToken(token?: string): Promise<void> {
    const tokenToUnregister = token || this.currentToken;
    if (!tokenToUnregister) {
      return;
    }

    try {
      await firstValueFrom(this.medusaService.unregisterFCMDevice(tokenToUnregister));
      this.currentToken = null;
      // Update state
      this.store.dispatch(new FCMActions.SetToken(null));
      this.store.dispatch(new FCMActions.SetRegistered(false));
    } catch (error) {
      console.warn('Failed to unregister FCM token:', error);
      // Don't throw - allow app to continue
    }
  }

  /**
   * Process incoming notification when app is open
   */
  private async processNotification(notification: PushNotificationSchema): Promise<void> {
    const data = notification.data as any;
    if (!data) {
      return;
    }

    // Show toast notification
    if (notification.title || notification.body) {
      await this.showToast(notification.title || 'Notification', notification.body || '');
    }

    // Navigate based on notification type
    if (data.type === 'order' && data.order_id) {
      this.router.navigate(['/customer/orders', data.order_id]);
    } else if (data.type === 'product' && data.product_id) {
      this.router.navigate(['/products', data.product_id]);
    } else if (data.type === 'return' && data.return_id) {
      // Navigate to customer orders since returns-list page is removed
      this.router.navigate(['/customer-orders']);
    }
  }

  /**
   * Process notification action (when user taps on notification)
   */
  private async processNotificationAction(notification: ActionPerformed): Promise<void> {
    const data = notification.notification.data as any;
    if (!data) {
      return;
    }

    // Navigate based on notification type
    if (data.type === 'order' && data.order_id) {
      this.router.navigate(['/customer/orders', data.order_id]);
    } else if (data.type === 'product' && data.product_id) {
      this.router.navigate(['/products', data.product_id]);
    } else if (data.type === 'return' && data.return_id) {
      // Navigate to customer orders since returns-list page is removed
      this.router.navigate(['/customer-orders']);
    }
  }

  /**
   * Show toast notification
   */
  private async showToast(header: string, message: string): Promise<void> {
    const toast = await this.toastController.create({
      header,
      message,
      duration: 3000,
      position: 'top',
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  /**
   * Get current platform
   */
  private getPlatform(): 'ios' | 'android' | 'web' | null {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') {
      return 'ios';
    } else if (platform === 'android') {
      return 'android';
    } else if (platform === 'web') {
      return 'web';
    }
    return null;
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<{ model?: string; os_version?: string }> {
    try {
      if (Capacitor.isPluginAvailable('Device')) {
        const deviceInfo = await Device.getInfo();
        return {
          model: deviceInfo.model,
          os_version: deviceInfo.osVersion
        };
      }
    } catch (error) {
      console.warn('Failed to get device info:', error);
    }
    return {};
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.registrationListener) {
      this.registrationListener.remove();
      this.registrationListener = null;
    }
    if (this.registrationErrorListener) {
      this.registrationErrorListener.remove();
      this.registrationErrorListener = null;
    }
    if (this.notificationReceivedListener) {
      this.notificationReceivedListener.remove();
      this.notificationReceivedListener = null;
    }
    if (this.notificationActionListener) {
      this.notificationActionListener.remove();
      this.notificationActionListener = null;
    }
    this.isInitialized = false;
  }

  /**
   * Get current token
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }
}
