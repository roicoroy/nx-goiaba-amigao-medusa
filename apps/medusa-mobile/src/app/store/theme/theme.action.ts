import { ThemeModel } from "./theme";


export namespace ThemeActions {
    export class SetDarkMode {
        static readonly type = '[ThemeActions] Set Dark Mode';
        constructor(public payload: any) { }
    }
    export class SaveTheme {
        static readonly type = '[ThemeActions] Save Theme';
        constructor(public payload: any) { }
    }
    export class SaveUserAvatar {
        static readonly type = '[ThemeActions] Save User Avatar';
        constructor(public userAvatar: string) { }
    }
    export class SaveUserProfileSetting {
        static readonly type = '[ThemeActions] Save User Profile Setting';
        constructor(public themeModel: ThemeModel) { }
    }
    export class SetPlatform {
        static readonly type = '[ThemeActions] Set Platform on state';
        constructor(public platform: string) { }
    }
}

