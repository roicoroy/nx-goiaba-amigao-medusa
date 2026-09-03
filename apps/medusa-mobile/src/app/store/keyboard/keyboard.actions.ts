export class UpdateKeyboardStatus {
    public static readonly type = '[Keyboard] Update Keyboard Status';
    constructor(public isOpen: boolean) { }
}
