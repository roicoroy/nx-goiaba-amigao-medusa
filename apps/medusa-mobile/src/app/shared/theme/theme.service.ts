import { inject, Injectable, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Store } from '@ngxs/store';
import { ThemeActions } from '../../store/theme/theme.action';
import { ThemeState } from '../../store/theme/theme.state';

export const DARK_MODE = 'dark_mode';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private store = inject(Store);
  private document = inject(DOCUMENT);

  // Signal to track dark mode state
  isDarkMode = signal<boolean>(false);

  // Computed icon based on dark mode state
  darkModeIcon = signal<string>('sunny');

  constructor() {
    // Initialize from store
    this.initializeTheme();

    // Effect to apply theme changes to DOM
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });
  }

  /**
   * Initialize theme from NGXS store
   */
  private initializeTheme(): void {
    const isDark = this.store.selectSnapshot(ThemeState.isDarkMode);
    this.isDarkMode.set(isDark);
    this.updateIcon(isDark);
  }

  /**
   * Apply theme to the document
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      // Dark mode
      this.document.documentElement.classList.add('ion-palette-dark');
      this.document.documentElement.classList.remove('ion-palette-light');
      this.document.body.classList.add('dark');
      this.updateIcon(true);
    } else {
      // Light mode
      this.document.documentElement.classList.add('ion-palette-light');
      this.document.documentElement.classList.remove('ion-palette-dark');
      this.document.body.classList.remove('dark');
      this.updateIcon(false);
    }

    // Remove data-theme attribute - we don't use DaisyUI theming
    this.document.documentElement.removeAttribute('data-theme');
  }

  /**
   * Update the icon based on dark mode state
   */
  private updateIcon(isDark: boolean): void {
    this.darkModeIcon.set(isDark ? 'moon' : 'sunny');
  }

  /**
   * Change theme via toggle event
   */
  changeTheme(ev: { detail: { checked: boolean } }): void {
    this.store.dispatch(new ThemeActions.SetDarkMode(ev.detail.checked));
    this.isDarkMode.set(ev.detail.checked);
  }

  /**
   * Toggle dark mode
   */
  toggleTheme(): void {
    const currentDarkMode = this.isDarkMode();
    this.store.dispatch(new ThemeActions.SetDarkMode(!currentDarkMode));
    this.isDarkMode.set(!currentDarkMode);
  }

  /**
   * Get current dark mode state
   */
  getIsDarkMode(): boolean {
    return this.isDarkMode();
  }
}
