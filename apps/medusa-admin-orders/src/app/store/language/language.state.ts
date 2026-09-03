import { Injectable } from '@angular/core';
import { State, Selector, Action, StateContext } from '@ngxs/store';
import { LanguageActions } from './language.actions';

export class LanguageStateModel {
    language!: string;
}
@State<LanguageStateModel>({
    name: 'language',
    defaults: {
        language: '',
    }
})
@Injectable()
export class LanguageState {

    @Selector()
    static getLanguage(state: LanguageStateModel): string {
        return state.language;
    }

    @Action(LanguageActions.SetLanguage)
    setLanguage(ctx: StateContext<LanguageStateModel>, { payload }: LanguageActions.SetLanguage) {
        const state = ctx.getState();
        return ctx.patchState({
            ...state,
            language: payload,
        });
    }

}
