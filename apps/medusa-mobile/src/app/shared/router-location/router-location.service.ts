import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterDataResolved } from '@ngxs/router-plugin';
import { Actions, ofActionSuccessful } from '@ngxs/store';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RouteLocationService {
  public routePath: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public routerAction$ = inject(Actions);

  constructor() {
    this.routerAction$.pipe(
      ofActionSuccessful(RouterDataResolved),
      takeUntilDestroyed()
    ).subscribe((action: RouterDataResolved | any) => {
      this.routePath.next(action.routerState.root.firstChild.url[0].path)
    });
  }
}
