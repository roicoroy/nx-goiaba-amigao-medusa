import { Injectable } from '@angular/core';
import { State, Selector, Action, StateContext } from '@ngxs/store';
import { LanguageActions } from './language.actions';
import { MedusaLocale } from 'src/app/shared/interfaces';

export class LanguageStateModel {
    language!: string;
    medusaLocale: string | null = null;
    supportedLocales: MedusaLocale[] = [];
}

@State<LanguageStateModel>({
    name: 'language',
    defaults: {
        language: '',
        medusaLocale: null,
        supportedLocales: [],
    }
})
@Injectable()
export class LanguageState {

    @Selector()
    static getLanguage(state: LanguageStateModel): string {
        return state.language;
    }

    @Selector()
    static getMedusaLocale(state: LanguageStateModel): string | null {
        return state.medusaLocale;
    }

    @Selector()
    static getSupportedLocales(state: LanguageStateModel): MedusaLocale[] {
        return state.supportedLocales;
    }

    @Action(LanguageActions.SetLanguage)
    setLanguage(ctx: StateContext<LanguageStateModel>, { payload }: LanguageActions.SetLanguage) {
        const state = ctx.getState();
        return ctx.patchState({
            ...state,
            language: payload,
        });
    }

    @Action(LanguageActions.SetMedusaLocale)
    setMedusaLocale(ctx: StateContext<LanguageStateModel>, { payload }: LanguageActions.SetMedusaLocale) {
        const state = ctx.getState();
        return ctx.patchState({
            ...state,
            medusaLocale: payload,
        });
    }

    @Action(LanguageActions.SetSupportedLocales)
    setSupportedLocales(ctx: StateContext<LanguageStateModel>, { payload }: LanguageActions.SetSupportedLocales) {
        const state = ctx.getState();
        return ctx.patchState({
            ...state,
            supportedLocales: payload,
        });
    }

}
