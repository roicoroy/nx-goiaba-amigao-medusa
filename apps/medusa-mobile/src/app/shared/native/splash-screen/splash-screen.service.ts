import { Injectable } from '@angular/core';
import { ShowOptions, SplashScreen } from '@capacitor/splash-screen';

@Injectable({
    providedIn: 'root'
})
export class SplashScreenService {

    constructor(
    ) { }
    /**
     * @param options splash screen configurations
     * @returns show splash screen promise
     */
    async show(options?: ShowOptions): Promise<void> {
        try {
            return await SplashScreen.show(options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * @returns hide splash screen promise
     */
    async hide(): Promise<void> {
        try {
            return await SplashScreen.hide();
        } catch (error) {
            throw error;
        }
    }
}
