import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  private searchOpenSubject = new BehaviorSubject<boolean>(false);
  public isSearchOpen$ = this.searchOpenSubject.asObservable();

  /**
   * Toggle search open/close state
   */
  toggleSearch(): void {
    this.searchOpenSubject.next(!this.searchOpenSubject.value);
  }

  /**
   * Open search
   */
  openSearch(): void {
    this.searchOpenSubject.next(true);
  }

  /**
   * Close search
   */
  closeSearch(): void {
    this.searchOpenSubject.next(false);
  }

  /**
   * Get current search state
   */
  get isSearchOpen(): boolean {
    return this.searchOpenSubject.value;
  }

  /**
   * Format file size in human readable format
   * @param bytes - Size in bytes
   * @returns Formatted size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Truncate text to specified length
   * @param text - Text to truncate
   * @param length - Maximum length
   * @param suffix - Suffix to add (default: '...')
   * @returns Truncated text
   */
  truncateText(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + suffix;
  }

  /**
   * Generate a random color in hex format
   * @returns Random hex color
   */
  generateRandomColor(): string {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
  }

  /**
   * Check if device is mobile
   * @returns True if mobile device
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Copy text to clipboard
   * @param text - Text to copy
   * @returns Promise<boolean> - Success status
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  }
}
