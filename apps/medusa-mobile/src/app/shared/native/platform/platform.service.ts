import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Store } from '@ngxs/store';
import { ThemeActions } from 'src/app/store/theme/theme.action';

@Injectable({
    providedIn: 'root'
})
export class PlatformService {

    private store = inject(Store);

    async platformCheckInit() {
        const platform: string = await this.nativePlatform();
        this.store.dispatch(new ThemeActions.SetPlatform(platform))
    }
    /**
     * @returns Boolean if the platform is native or not. `android` and `ios`
     * would return `true`, otherwise `false`.
     */
    async isNativePlatform(): Promise<boolean> {
        try {
            const isNative: boolean = Capacitor.isNativePlatform();
            return isNative;
        } catch (error) {
            throw error;
        }
    }

    /**
    * @returns Gets the name of the platform, 
    * such as android, ios, or web.
    */
    async nativePlatform(): Promise<string> {
        try {
            const platform: string = Capacitor.getPlatform();
            return platform;
        } catch (error) {
            throw error;
        }
    }

}
