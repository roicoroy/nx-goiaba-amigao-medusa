
export namespace LanguageActions {
    export class SetLanguage {
        static readonly type = '[LanguageActions] Set Language';
        constructor(public payload: string) { }
    }

    export class SetMedusaLocale {
        static readonly type = '[LanguageActions] Set Medusa Locale';
        constructor(public payload: string | null) { }
    }

    export class SetSupportedLocales {
        static readonly type = '[LanguageActions] Set Supported Locales';
        constructor(public payload: any[]) { }
    }

}
