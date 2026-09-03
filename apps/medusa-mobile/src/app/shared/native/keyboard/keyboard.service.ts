import { Injectable, EventEmitter, Output, inject } from '@angular/core';
import { Store } from '@ngxs/store';

import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { IKeyboardService } from './IKeyboard';
import { UpdateKeyboardStatus } from 'src/app/store/keyboard/keyboard.actions';
import { blurActiveElement } from './ui-utils';

@Injectable({
    providedIn: 'root'
})
export class KeyboardService implements IKeyboardService {
    @Output() keyboardWillShow = new EventEmitter<KeyboardInfo>();

    @Output() keyboardDidShow = new EventEmitter<KeyboardInfo>();

    @Output() keyboardWillHide = new EventEmitter<void>();

    @Output() keyboardDidHide = new EventEmitter<void>();

    private readonly store = inject(Store);

    initKeyboardListeners() {
        Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
            this.keyboardWillShow.emit(info);
            this.store.dispatch(new UpdateKeyboardStatus(true));
        });

        Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
            this.keyboardDidShow.emit(info);
        });

        Keyboard.addListener('keyboardWillHide', () => {
            this.keyboardWillHide.emit();
            this.store.dispatch(new UpdateKeyboardStatus(false));
            console.log('UpdateKeyboardStatus', false);
        });

        Keyboard.addListener('keyboardDidHide', () => {
            blurActiveElement();
            this.keyboardDidHide.emit();
        });
    }
    /** Set whether the accessory bar should be visible on the keyboard. */
    async setAccessoryBarVisible(isBarVisible: boolean): Promise<void> {
        try {
            return await Keyboard.setAccessoryBarVisible({ isVisible: isBarVisible });
        } catch (error) {
            throw error;
        }
    }

    async hideKeyboard(): Promise<void> {
        try {
            return await Keyboard.hide();
        } catch (error) {
            throw error;
        }
    }

    async showKeyboard(): Promise<void> {
        try {
            return await Keyboard.show();
        } catch (error) {
            throw error;
        }
    }

    async setScroll(options: { isDisabled: boolean }): Promise<void> {
        try {
            return await Keyboard.setScroll(options);
        } catch (error) {
            throw error;
        }
    }
}
