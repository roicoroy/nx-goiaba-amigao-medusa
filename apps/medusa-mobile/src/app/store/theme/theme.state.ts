import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ThemeActions } from './theme.action';
import { ThemeModel } from './theme';

export class ThemeStateModel {
    isDarkMode!: boolean;
    savedTheme: any;
    userAvatar!: string;
    settings!: ThemeModel[];
}

@State<ThemeStateModel>({
    name: 'theme',
    defaults: {
        isDarkMode: false,
        savedTheme: null,
        userAvatar: '',
        settings: [],
    }
})
@Injectable()
export class ThemeState {

    @Selector()
    static isDarkMode(state: ThemeStateModel): boolean {
        return state.isDarkMode;
    }

    @Selector()
    static getUserAvatar(state: ThemeStateModel): string {
        return state.userAvatar;
    }

    @Selector()
    static getSavedTheme(state: ThemeStateModel): any {
        return state.savedTheme;
    }

    @Selector()
    static getSavedSettings(state: ThemeStateModel): ThemeModel[] {
        return state.settings;
    }

    @Action(ThemeActions.SetDarkMode)
    setDarkMode(ctx: StateContext<ThemeStateModel>, { payload }: ThemeActions.SetDarkMode) {
        return ctx.patchState({
            isDarkMode: payload
        });
    }

    @Action(ThemeActions.SaveTheme)
    saveTheme(ctx: StateContext<ThemeStateModel>, { payload }: ThemeActions.SaveTheme) {
        return ctx.patchState({
            savedTheme: payload
        });
    }

    @Action(ThemeActions.SaveUserAvatar)
    saveUserAvatar(ctx: StateContext<ThemeStateModel>, { userAvatar }: ThemeActions.SaveUserAvatar) {
        return ctx.patchState({
            userAvatar: userAvatar
        });
    }

    @Action(ThemeActions.SaveUserProfileSetting)
    saveUserProfileSetting(ctx: StateContext<ThemeStateModel>, { themeModel }: ThemeActions.SaveUserProfileSetting) {
        return ctx.patchState({
            settings: [themeModel]
        });
    }
}
