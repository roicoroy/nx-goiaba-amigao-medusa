import { Injectable, inject } from '@angular/core';
import { LoadingController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingCtrl = inject(LoadingController);
  private currentLoader: HTMLIonLoadingElement | null = null;
  private loadingCount = 0;

  /**
   * Present loading spinner with optional message
   * @param message - Optional loading message
   * @param spinner - Spinner type (default: 'circles')
   * @param duration - Auto-dismiss duration in ms (optional)
   */
  async presentLoading(
    message?: string,
    spinner: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' | 'lines-small' = 'circles',
    duration?: number
  ): Promise<void> {
    this.loadingCount++;

    if (this.currentLoader) {
      return; // Already showing a loader
    }

    try {
      this.currentLoader = await this.loadingCtrl.create({
        message: message || 'Loading...',
        spinner: spinner,
        duration: duration,
        cssClass: 'custom-loading'
      });

      await this.currentLoader.present();

      // Auto-dismiss if duration is set
      if (duration) {
        setTimeout(() => {
          this.dismissLoading();
        }, duration);
      }
    } catch (error) {
      console.error('Error presenting loading:', error);
      this.currentLoader = null;
      this.loadingCount = 0;
    }
  }

  /**
   * Dismiss the current loading spinner
   */
  async dismissLoading(): Promise<void> {
    this.loadingCount = Math.max(0, this.loadingCount - 1);

    if (this.loadingCount > 0) {
      return; // Still have pending operations
    }

    if (this.currentLoader) {
      try {
        await this.currentLoader.dismiss();
      } catch (error) {
        console.error('Error dismissing loading:', error);
      } finally {
        this.currentLoader = null;
      }
    }
  }

  /**
   * Force dismiss all loading spinners
   */
  async forceDissmiss(): Promise<void> {
    this.loadingCount = 0;
    if (this.currentLoader) {
      try {
        await this.currentLoader.dismiss();
      } catch (error) {
        console.error('Error force dismissing loading:', error);
      } finally {
        this.currentLoader = null;
      }
    }
  }

  /**
   * Check if loading is currently active
   */
  get isLoading(): boolean {
    return this.currentLoader !== null;
  }

  /**
   * Get current loading count
   */
  get loadingOperations(): number {
    return this.loadingCount;
  }
}
