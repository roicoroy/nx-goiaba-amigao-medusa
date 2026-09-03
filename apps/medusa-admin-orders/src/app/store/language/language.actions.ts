
export namespace LanguageActions {
    export class SetLanguage {
        static readonly type = '[LanguageActions] Set Language';
        constructor(public payload: string) { }
    }

}
