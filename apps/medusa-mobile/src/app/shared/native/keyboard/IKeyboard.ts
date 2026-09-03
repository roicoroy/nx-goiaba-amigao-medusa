import { EventEmitter } from '@angular/core';
import { KeyboardInfo } from '@capacitor/keyboard';

/** A keyboard service at native layer. */
export interface IKeyboardService {
  /**
   * Event will trigger when keyboard will show.
   * @return keyboard height.
   */
  keyboardWillShow: EventEmitter<KeyboardInfo>;

  /**
   * Event will trigger when keyboard did show.
   * @return keyboard height.
   */
  keyboardDidShow: EventEmitter<KeyboardInfo>;

  /** Event will trigger when keyboard will hide. */
  keyboardWillHide: EventEmitter<void>;

  /** Event will trigger when keyboard did hide. */
  keyboardDidHide: EventEmitter<void>;

  /** Set whether the accessory bar should be visible on the keyboard. */
  setAccessoryBarVisible(isBarVisible: boolean): Promise<void>;

  /** Hide the keyboard. */
  hideKeyboard(): Promise<void>;

  /** Display the keyboard. */
  showKeyboard(): Promise<void>;

  /**
   * Enable or disable the webview scroll while keyboard open or close.
   * @param options is disabled scroll.
   */
  setScroll(options: { isDisabled: boolean }): Promise<void>;
}
