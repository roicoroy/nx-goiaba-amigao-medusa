import { Injectable, inject } from '@angular/core';
import { State, Action, Selector, StateContext, Store } from '@ngxs/store';
import { UpdateKeyboardStatus } from './keyboard.actions';

export interface IKeyboardStateModel {
    isOpen: boolean;
}

@State<IKeyboardStateModel>({
    name: 'keyboard',
    defaults: {
        isOpen: false
    }
})
@Injectable()
export class KeyboardState {

    @Selector()
    static isOpen(state: IKeyboardStateModel): boolean {
        return state.isOpen;
    }

    @Action(UpdateKeyboardStatus)
    updateKeyboardStatus(ctx: StateContext<IKeyboardStateModel>, action: UpdateKeyboardStatus): void {
        ctx.patchState({ isOpen: action.isOpen });
    }
}
