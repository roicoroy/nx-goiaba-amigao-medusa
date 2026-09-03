import { inject, Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
// import { KeyboardState } from 'src/app/store/keyboard/keyboard.state';

@Injectable({
    providedIn: 'root'
})
export class KeypadFacade {
    // @Select(KeyboardState.isOpen) isOpen$: Observable<boolean>;
    // isOpen$: Observable<boolean> = inject(Store).select(KeyboardState.isOpen);
}
