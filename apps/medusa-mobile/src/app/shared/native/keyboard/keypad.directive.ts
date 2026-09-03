import { Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KeypadFacade } from './keypad.facade';

@Directive({
    selector: '[appHideWhenKeypadVisible]'
})
export class KeyPadDirective implements OnDestroy {

    private readonly ngUnsubscribe = new Subject();

    private readonly targetElement = inject(ElementRef);
    private readonly keypadFacade = inject(KeypadFacade);

    ngOnDestroy(): void {
        this.ngUnsubscribe.next(null);
        this.ngUnsubscribe.complete();
    }
}
